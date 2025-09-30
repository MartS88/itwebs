// files.controller.ts

// Nest js
import {
  ConflictException,
  Controller, ForbiddenException,
  Get, Logger, NotFoundException, Param,
  Post, Query, Delete,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

// Services
import { FilesService } from './files.service';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../redis-cache/redis-cache.service';

// Guards
import { JwtAuthGuard } from '../auth/guards';

// Decorators
import { Public } from '../auth/decorators';
import { UserId } from '../common/decorators';

// Types
import { MIMETYPE } from './types';

// Routes
import { FILES } from './files.routes';


const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'image/heic',
    'image/heif',
    'application/octet-stream',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.heic', '.heif', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

  const isMimeAllowed = allowedMimeTypes.includes(file.mimetype);
  const isExtAllowed = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));

  if (isMimeAllowed || isExtAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG/WEBP/JPEG/HEIC/HEIF/PDF/TXT/DOC/DOCX/XLS/XLSX/PPT/PPTX files are allowed'), false);
  }
};

@UseGuards(JwtAuthGuard)
@Controller(FILES.CONTROLLER)
export class FilesController {
  private logger = new Logger(FilesController.name);
  private TOKEN_SECRET: string
  constructor(
    private readonly configService: ConfigService,
    private readonly redisCacheService: RedisCacheService,
    private readonly filesService: FilesService,
  ) {
    this.TOKEN_SECRET = this.configService.get('FILES_ACCESS_SECRET');
  }

  @UseGuards(JwtAuthGuard)
  @Post(FILES.ROUTES.UPLOAD)
  @UseInterceptors(FileInterceptor('file', {
    fileFilter,
    limits: { fileSize: 7 * 1024 * 1024 },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @UserId() userId: number) {
    if (!file) {
      return { message: 'No file uploaded' };
    }
    const originalName = file.originalname;


    const isDublicate = await this.filesService.isDublicate(userId, originalName);
    if (isDublicate) {
      throw new ConflictException('This file is already uploaded');
    }

    let mimetype = file.mimetype;

    // Fix for iPhone HEIC uploads as 'application/octet-stream'
    if (file.mimetype === MIMETYPE.APPLICATION_OCTET_STREAM && file.originalname.toLowerCase().endsWith('.heic')) {
      mimetype = MIMETYPE.IMAGE_HEIC;
    }

    // PDF — save as-is
    if (mimetype === MIMETYPE.APPLICATION_PDF) {
      await this.filesService.saveFileBuffer(userId, originalName, file.buffer, mimetype);
      return { message: `PDF cached successfully!` };
    }

    // HEIC/HEIF — convert to JPEG and compress
    if (mimetype === MIMETYPE.IMAGE_HEIC || mimetype === MIMETYPE.IMAGE_HEIF) {
      const convertedHeicToImg = await this.filesService.convertHeicToJpeg(file.buffer);

      const cuttedOriginalName = originalName.replace(/\.heic$/i, '');
      await this.filesService.saveFileBuffer(userId, cuttedOriginalName, convertedHeicToImg, MIMETYPE.IMAGE_JPEG);

      return { message: 'HEIC file converted to IMG and cached successfully!' };
    }

    // All other formats → compress and save
    const compressedFile = await this.filesService.compressFile(file.buffer);
    await this.filesService.saveFileBuffer(userId, originalName, compressedFile, mimetype);
    return { message: 'File cached successfully!' };
  }


 
  @Get()
  async getUserFiles(@UserId() userId: number, @Query('category') category?: string) {
    return await this.filesService.getUserFiles(userId, category);
  }

  
  @Delete(FILES.ROUTES.DELETE_FILE)
  async deleteFile(@UserId() userId: number, @Param('fileId') fileId: string) {
    const success = await this.filesService.deleteFile(userId, fileId);
    
    if (!success) {
      throw new NotFoundException('File not found or you do not have permission to delete it');
    }
    
    return { message: 'File deleted successfully' };
  }

  @Public()
  @Get(FILES.ROUTES.GET_FILE_BY_USER_AND_ID)
  async serveFile(
    @Param('userId') userId: number,
    @Param('fileId') fileId: string,
    @Query('token') token: string,
    @Res({ passthrough: false }) res: Response,
  ) {

    if (token !== this.TOKEN_SECRET) {
      throw new ForbiddenException('Invalid token');
    }
    const fileKey = `file:${userId}:${fileId}`;
    const filetypeKey = `filetype:${userId}:${fileId}`;

    const rawBuffer = await this.redisCacheService.getBuffer(fileKey);
    const mimetype = await this.redisCacheService.get<string>(filetypeKey);

    if (!rawBuffer || !mimetype) {
      throw new NotFoundException('File not found');
    }
    const sizeInBytes = rawBuffer.length;
    const sizeInMB = sizeInBytes / (1024 * 1024);


    const buffer = rawBuffer;

    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.end(buffer);
    return;
  }


}
