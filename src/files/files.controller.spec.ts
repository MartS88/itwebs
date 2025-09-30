import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { RedisCacheService } from '../redis-cache/redis-cache.service';
import { JwtAuthGuard } from '../auth/guards';
import { Response } from 'express';

describe('FilesController', () => {
  let controller: FilesController;
  let filesService: FilesService;
  let redisCacheService: RedisCacheService;
  let configService: ConfigService;

  const mockFilesService = {
    isDublicate: jest.fn(),
    saveFileBuffer: jest.fn(),
    convertHeicToJpeg: jest.fn(),
    compressFile: jest.fn(),
    getUserFiles: jest.fn(),
  };

  const mockRedisCacheService = {
    getBuffer: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: RedisCacheService,
          useValue: mockRedisCacheService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FilesController>(FilesController);
    filesService = module.get<FilesService>(FilesService);
    redisCacheService = module.get<RedisCacheService>(RedisCacheService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
  const mockRequest = {
    user: { id: 1 },
    file: {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test data'),
      stream: null,
      destination: '',
      filename: 'test.jpg',
      path: '',
    },
  };

    it('should return message when no file uploaded', async () => {
      const result = await controller.uploadFile(null, 1);

      expect(result).toEqual({ message: 'No file uploaded' });
    });

    it('should throw ConflictException for duplicate files', async () => {
      mockFilesService.isDublicate.mockResolvedValue(true);

      await expect(controller.uploadFile(mockRequest.file, 1)).rejects.toThrow(
        ConflictException,
      );
      expect(mockFilesService.isDublicate).toHaveBeenCalledWith(1, 'test.jpg');
    });

    it('should save PDF file as-is', async () => {
      const pdfFile = {
        ...mockRequest.file,
        mimetype: 'application/pdf',
      };

      mockFilesService.isDublicate.mockResolvedValue(false);
      mockFilesService.saveFileBuffer.mockResolvedValue(undefined);

      const result = await controller.uploadFile(pdfFile, 1);

      expect(result).toEqual({ message: 'PDF cached successfully!' });
      expect(mockFilesService.saveFileBuffer).toHaveBeenCalledWith(
        1,
        'test.jpg',
        pdfFile.buffer,
        'application/pdf',
      );
    });

    it('should convert HEIC to JPEG', async () => {
      const heicFile = {
        ...mockRequest.file,
        mimetype: 'image/heic',
        originalname: 'test.heic',
      };

      mockFilesService.isDublicate.mockResolvedValue(false);
      mockFilesService.convertHeicToJpeg.mockResolvedValue(Buffer.from('converted data'));
      mockFilesService.saveFileBuffer.mockResolvedValue(undefined);

      const result = await controller.uploadFile(heicFile, 1);

      expect(result).toEqual({ message: 'HEIC file converted to IMG and cached successfully!' });
      expect(mockFilesService.convertHeicToJpeg).toHaveBeenCalledWith(heicFile.buffer);
      expect(mockFilesService.saveFileBuffer).toHaveBeenCalledWith(
        1,
        'test', // original name without .heic extension
        Buffer.from('converted data'),
        'image/jpeg',
      );
    });

    it('should compress other image formats', async () => {
      mockFilesService.isDublicate.mockResolvedValue(false);
      mockFilesService.compressFile.mockResolvedValue(Buffer.from('compressed data'));
      mockFilesService.saveFileBuffer.mockResolvedValue(undefined);

      const result = await controller.uploadFile(mockRequest.file, 1);

      expect(result).toEqual({ message: 'File cached successfully!' });
      expect(mockFilesService.compressFile).toHaveBeenCalledWith(mockRequest.file.buffer);
      expect(mockFilesService.saveFileBuffer).toHaveBeenCalledWith(
        1,
        'test.jpg',
        Buffer.from('compressed data'),
        'image/jpeg',
      );
    });

    it('should fix HEIC mimetype for application/octet-stream', async () => {
      const octetStreamFile = {
        ...mockRequest.file,
        mimetype: 'application/octet-stream',
        originalname: 'test.heic',
      };

      mockFilesService.isDublicate.mockResolvedValue(false);
      mockFilesService.compressFile.mockResolvedValue(Buffer.from('compressed data'));
      mockFilesService.saveFileBuffer.mockResolvedValue(undefined);

      const result = await controller.uploadFile(octetStreamFile, 1);

      expect(result).toEqual({ message: 'HEIC file converted to IMG and cached successfully!' });
      expect(mockFilesService.saveFileBuffer).toHaveBeenCalledWith(
        1,
        'test',
        Buffer.from('compressed data'),
        'image/jpeg',
      );
    });
  });

  describe('getUserFiles', () => {
    const mockRequest = {
      user: { id: 1 },
    };

    it('should return user files', async () => {
      const mockFiles = [
        { id: 1, originalName: 'test1.jpg', userId: 1 },
        { id: 2, originalName: 'test2.jpg', userId: 1 },
      ];

      mockFilesService.getUserFiles.mockResolvedValue(mockFiles);

      const result = await controller.getUserFiles(1, 'photos');

      expect(result).toEqual(mockFiles);
      expect(mockFilesService.getUserFiles).toHaveBeenCalledWith(1, 'photos');
    });

    it('should return user files without category', async () => {
      const mockFiles = [
        { id: 1, originalName: 'test1.jpg', userId: 1 },
        { id: 2, originalName: 'test2.jpg', userId: 1 },
      ];

      mockFilesService.getUserFiles.mockResolvedValue(mockFiles);

      const result = await controller.getUserFiles(1);

      expect(result).toEqual(mockFiles);
      expect(mockFilesService.getUserFiles).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe('serveFile', () => {
  const mockResponse = {
    setHeader: jest.fn(),
    end: jest.fn(),
  } as unknown as Response;

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-secret');
    });

    it('should throw ForbiddenException for invalid token', async () => {
      await expect(
        controller.serveFile(1, 'file123', 'invalid-token', mockResponse),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when file not found in cache', async () => {
      mockRedisCacheService.getBuffer.mockResolvedValue(null);
      mockRedisCacheService.get.mockResolvedValue(null);

      await expect(
        controller.serveFile(1, 'file123', 'test-secret', mockResponse),
      ).rejects.toThrow(NotFoundException);

      expect(mockRedisCacheService.getBuffer).toHaveBeenCalledWith('file:1:file123');
      expect(mockRedisCacheService.get).toHaveBeenCalledWith('filetype:1:file123');
    });

    it('should serve file when found in cache', async () => {
      const mockBuffer = Buffer.from('file data');
      const mockMimetype = 'image/jpeg';

      mockRedisCacheService.getBuffer.mockResolvedValue(mockBuffer);
      mockRedisCacheService.get.mockResolvedValue(mockMimetype);

      await controller.serveFile(1, 'file123', 'test-secret', mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', mockMimetype);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Length', mockBuffer.length);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
      expect(mockResponse.end).toHaveBeenCalledWith(mockBuffer);
    });

    it('should handle missing mimetype', async () => {
      const mockBuffer = Buffer.from('file data');

      mockRedisCacheService.getBuffer.mockResolvedValue(mockBuffer);
      mockRedisCacheService.get.mockResolvedValue(null);

      await expect(
        controller.serveFile(1, 'file123', 'test-secret', mockResponse),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
