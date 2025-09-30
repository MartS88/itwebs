import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/sequelize';
import { FilesService } from './files.service';
import { RedisCacheService } from '../redis-cache/redis-cache.service';
import { File } from './models/file-model';

describe('FilesService', () => {
  let service: FilesService;
  let configService: ConfigService;
  let redisCacheService: RedisCacheService;
  let fileModel: any;

  const mockFileModel = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  const mockRedisCacheService = {
    setBuffer: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    getBuffer: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisCacheService,
          useValue: mockRedisCacheService,
        },
        {
          provide: getModelToken(File),
          useValue: mockFileModel,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    configService = module.get<ConfigService>(ConfigService);
    redisCacheService = module.get<RedisCacheService>(RedisCacheService);
    fileModel = module.get(getModelToken(File));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isDublicate', () => {
    it('should return true if file exists in cache', async () => {
      const userId = 1;
      const originalName = 'test.jpg';
      const fileKey = `file:${userId}:${originalName}`;

      mockRedisCacheService.get.mockResolvedValue('some-file-data');

      const result = await service.isDublicate(userId, originalName);

      expect(result).toBe(true);
      expect(mockRedisCacheService.get).toHaveBeenCalledWith(fileKey);
    });

    it('should return false if file does not exist in cache', async () => {
      const userId = 1;
      const originalName = 'test.jpg';
      const fileKey = `file:${userId}:${originalName}`;

      mockRedisCacheService.get.mockResolvedValue(null);

      const result = await service.isDublicate(userId, originalName);

      expect(result).toBe(false);
      expect(mockRedisCacheService.get).toHaveBeenCalledWith(fileKey);
    });
  });

  describe('saveFileBuffer - cache mode', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('cache');
    });

    it('should save file to cache only', async () => {
      const userId = 1;
      const originalName = 'test.jpg';
      const buffer = Buffer.from('test data');
      const mimetype = 'image/jpeg';

      await service.saveFileBuffer(userId, originalName, buffer, mimetype);

      expect(mockRedisCacheService.setBuffer).toHaveBeenCalledWith(
        `file:${userId}:${originalName}`,
        buffer,
        3600,
      );
      expect(mockRedisCacheService.set).toHaveBeenCalledWith(
        `filetype:${userId}:${originalName}`,
        mimetype,
        3600,
      );
      expect(mockFileModel.create).not.toHaveBeenCalled();
    });
  });

  describe('saveFileBuffer - filesystem mode', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('filesystem');
    });

    it('should save file to filesystem and database', async () => {
      const userId = 1;
      const originalName = 'test.jpg';
      const buffer = Buffer.from('test data');
      const mimetype = 'image/jpeg';

      // Mock fs operations
      const mockFs = require('fs');
      jest.spyOn(mockFs, 'existsSync').mockReturnValue(false);
      jest.spyOn(mockFs, 'mkdirSync').mockImplementation(() => {});
      jest.spyOn(mockFs, 'writeFileSync').mockImplementation(() => {});

      await service.saveFileBuffer(userId, originalName, buffer, mimetype);

      expect(mockFileModel.create).toHaveBeenCalledWith({
        userId,
        originalName,
        fileName: expect.any(String),
        filePath: expect.any(String),
        mimeType: mimetype,
        fileSize: buffer.length,
        isProcessed: true,
      });
    });
  });

  describe('getUserFiles - cache mode', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('cache');
    });

    it('should return empty array for cache mode', async () => {
      const userId = 1;
      const category = 'photos';

      const result = await service.getUserFiles(userId, category);

      expect(result).toEqual([]);
      expect(mockFileModel.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getUserFiles - filesystem mode', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('filesystem');
    });

    it('should return files from database', async () => {
      const userId = 1;
      const category = 'photos';
      const mockFiles = [
        { id: 1, originalName: 'test1.jpg', userId: 1 },
        { id: 2, originalName: 'test2.jpg', userId: 1 },
      ];

      mockFileModel.findAll.mockResolvedValue(mockFiles);

      const result = await service.getUserFiles(userId, category);

      expect(result).toEqual(mockFiles);
      expect(mockFileModel.findAll).toHaveBeenCalledWith({
        where: { userId },
        order: [['created_at', 'DESC']],
      });
    });

    it('should return files without category filter', async () => {
      const userId = 1;
      const mockFiles = [
        { id: 1, originalName: 'test1.jpg', userId: 1 },
        { id: 2, originalName: 'test2.jpg', userId: 1 },
      ];

      mockFileModel.findAll.mockResolvedValue(mockFiles);

      const result = await service.getUserFiles(userId);

      expect(result).toEqual(mockFiles);
      expect(mockFileModel.findAll).toHaveBeenCalledWith({
        where: { userId },
        order: [['created_at', 'DESC']],
      });
    });
  });

  describe('convertHeicToJpeg', () => {
    it('should convert HEIC buffer to JPEG', async () => {
      const mockBuffer = Buffer.from('heic-data');
      const mockConvertedBuffer = Buffer.from('jpeg-data');

      // Mock heic-convert
      const mockHeicConvert = require('heic-convert');
      mockHeicConvert.mockResolvedValue(mockConvertedBuffer);

      const result = await service.convertHeicToJpeg(mockBuffer);

      expect(result).toEqual(mockConvertedBuffer);
      expect(mockHeicConvert).toHaveBeenCalledWith({
        buffer: mockBuffer,
        format: 'JPEG',
        quality: 1,
      });
    });

    it('should handle conversion errors', async () => {
      const mockBuffer = Buffer.from('invalid-heic-data');
      const mockError = new Error('Conversion failed');

      // Mock heic-convert to throw error
      const mockHeicConvert = require('heic-convert');
      mockHeicConvert.mockRejectedValue(mockError);

      await expect(service.convertHeicToJpeg(mockBuffer)).rejects.toThrow('Conversion failed');
    });
  });

  describe('compressFile', () => {
    it('should compress image buffer', async () => {
      const mockBuffer = Buffer.from('image-data');
      const mockCompressedBuffer = Buffer.from('compressed-data');

      // Mock sharp
      const mockSharp = require('sharp');
      const mockSharpInstance = {
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockCompressedBuffer),
      };
      mockSharp.mockReturnValue(mockSharpInstance);

      const result = await service.compressFile(mockBuffer);

      expect(result).toEqual(mockCompressedBuffer);
      expect(mockSharp).toHaveBeenCalledWith(mockBuffer);
      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ quality: 80 });
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
    });

    it('should handle compression errors', async () => {
      const mockBuffer = Buffer.from('invalid-image-data');
      const mockError = new Error('Compression failed');

      // Mock sharp to throw error
      const mockSharp = require('sharp');
      const mockSharpInstance = {
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(mockError),
      };
      mockSharp.mockReturnValue(mockSharpInstance);

      await expect(service.compressFile(mockBuffer)).rejects.toThrow('Compression failed');
    });
  });
});
