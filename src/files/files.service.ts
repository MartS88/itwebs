import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../redis-cache/redis-cache.service';
import * as sharp from 'sharp';
import * as heicConvert from 'heic-convert';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { File } from './models/file-model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redisCacheService: RedisCacheService,
    @InjectModel(File)
    private readonly fileModel: typeof File,
  ) {}

  async isDublicate(userId: number, originalName: string): Promise<boolean> {
    const fileKey = `file:${userId}:${originalName}`;
    const existingFile = await this.redisCacheService.get(fileKey);
    return !!existingFile;
  }

  async saveFileBuffer(userId: number, originalName: string, buffer: Buffer, mimetype: string): Promise<void> {
    const storageType = this.configService.get<string>('FILE_STORAGE_TYPE') || 'cache';
    
    if (storageType === 'cache') {
      // Save only to Redis cache
      const fileKey = `file:${userId}:${originalName}`;
      const filetypeKey = `filetype:${userId}:${originalName}`;
      
      await this.redisCacheService.setBuffer(fileKey, buffer, 3600); // 1 hour TTL
      await this.redisCacheService.set(filetypeKey, mimetype, 3600);
    } else {
      // Save to file system and database
      const fileId = uuidv4();
      const fileExtension = path.extname(originalName);
      const fileName = `${fileId}${fileExtension}`;
      const uploadsDir = path.join(process.cwd(), 'uploads', 'files');
      const filePath = path.join(uploadsDir, fileName);
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Write file to disk
      fs.writeFileSync(filePath, buffer);
      
      // Save file info to database
      try {
        await this.fileModel.create({
          userId,
          originalName,
          fileName,
          filePath,
          mimeType: mimetype,
          fileSize: buffer.length,
          isProcessed: true,
        });
      } catch (error) {
        this.logger.error(`Database error: ${error.message}`);
        throw error;
      }
    }
  }

  async convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
    
    try {
      const outputBuffer = await heicConvert({
        buffer: buffer,
        format: 'JPEG',
        quality: 0.8,
      });
      return outputBuffer;
    } catch (error) {
      this.logger.error('Error converting HEIC to JPEG:', error);
      throw new Error('Failed to convert HEIC file');
    }
  }

  async compressFile(buffer: Buffer): Promise<Buffer> {
    try {
      // For images, use sharp compression
      if (this.isImageBuffer(buffer)) {
        return await sharp(buffer)
          .jpeg({ quality: 80 })
          .png({ quality: 80 })
          .webp({ quality: 80 })
          .toBuffer();
      }
      
      // For other files, return as-is
      return buffer;
    } catch (error) {
      this.logger.error('Error compressing file:', error);
      return buffer; // Return original if compression fails
    }
  }

  private isImageBuffer(buffer: Buffer): boolean {
    // Check for common image file signatures
    const signatures = [
      [0xFF, 0xD8, 0xFF], // JPEG
      [0x89, 0x50, 0x4E, 0x47], // PNG
      [0x52, 0x49, 0x46, 0x46], // WEBP (RIFF)
    ];

    return signatures.some(sig => 
      sig.every((byte, index) => buffer[index] === byte)
    );
  }

  async getUserFiles(userId: number, category?: string) {
    const storageType = this.configService.get<string>('FILE_STORAGE_TYPE') || 'cache';
    
    if (storageType === 'cache') {
      // For cache mode, return empty array since files are in Redis
      return [];
    } else {
      // For file system mode, query database
      const whereClause: any = { userId };
      
      try {
        const files = await this.fileModel.findAll({
          where: whereClause,
          order: [['created_at', 'DESC']]
        });
        
        return files;
      } catch (error) {
        this.logger.error(`Database query error: ${error.message}`);
        throw error;
      }
    }
  }

  async deleteFile(userId: number, fileId: string): Promise<boolean> {
    const storageType = this.configService.get<string>('FILE_STORAGE_TYPE') || 'cache';
    
    // Validate fileId is a valid number
    const fileIdNumber = parseInt(fileId);
    if (isNaN(fileIdNumber)) {
      this.logger.error(`Invalid fileId: ${fileId}`);
      return false;
    }
    
    this.logger.log(`Attempting to delete file ${fileId} for user ${userId} in ${storageType} mode`);
    
    if (storageType === 'cache') {
      // For cache mode, delete from Redis
      const fileKey = `file:${userId}:${fileId}`;
      const filetypeKey = `filetype:${userId}:${fileId}`;
      
      try {
        await this.redisCacheService.del(fileKey);
        await this.redisCacheService.del(filetypeKey);
        return true;
      } catch (error) {
        this.logger.error(`Redis delete error: ${error.message}`);
        return false;
      }
    } else {
      // For file system mode, delete from database and filesystem
      try {
        const file = await this.fileModel.findOne({
          where: { 
            id: fileIdNumber,
            userId: userId 
          }
        });
        
        if (!file) {
          this.logger.error(`File not found: id=${fileIdNumber}, userId=${userId}`);
          return false;
        }
        
        this.logger.log(`Found file: ${file.originalName} at ${file.filePath}`);
        
        // Delete physical file from filesystem
        if (fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }
        
        // Delete database record
        await file.destroy();
        
        this.logger.log(`Successfully deleted file ${fileId} for user ${userId}`);
        return true;
      } catch (error) {
        this.logger.error(`File deletion error: ${error.message}`);
        return false;
      }
    }
  }
}
