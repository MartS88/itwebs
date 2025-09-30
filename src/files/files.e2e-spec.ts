import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { CacheModule } from '@nestjs/cache-manager';
import { FilesModule } from './files.module';
import { RedisCacheModule } from '../redis-cache/redis-cache.module';
import { User } from '../users/models/user-model';
import { File } from './models/file-model';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

describe('Files (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        FilesModule,
        RedisCacheModule,
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          autoLoadModels: true,
          synchronize: true,
        }),
        SequelizeModule.forFeature([User, File]),
        CacheModule.register({
          isGlobal: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = app.get<ConfigService>(ConfigService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Create test user and get auth token
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    if (userResponse.status === 201) {
      authToken = userResponse.body.accessToken;
      userId = userResponse.body.id;
    } else {
      // If user already exists, login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      authToken = loginResponse.body.accessToken;
      userId = loginResponse.body.id;
    }
  });

  afterEach(async () => {
    // Clean up test files
    const uploadsDir = path.join(process.cwd(), 'uploads', 'files');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
    }
  });

  describe('/files/upload (POST)', () => {
    it('should upload a file successfully', async () => {
      const testFile = Buffer.from('test file content');
      
      const response = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile, 'test.txt')
        .expect(201);

      expect(response.body.message).toContain('cached successfully');
    });

    it('should reject file upload without authentication', async () => {
      const testFile = Buffer.from('test file content');
      
      await request(app.getHttpServer())
        .post('/files/upload')
        .attach('file', testFile, 'test.txt')
        .expect(401);
    });

    it('should reject unsupported file types', async () => {
      const testFile = Buffer.from('test file content');
      
      await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile, 'test.exe')
        .expect(400);
    });

    it('should handle duplicate file uploads', async () => {
      const testFile = Buffer.from('test file content');
      
      // First upload
      await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile, 'duplicate.txt')
        .expect(201);

      // Second upload with same name
      await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile, 'duplicate.txt')
        .expect(409);
    });
  });

  describe('/files (GET)', () => {
    it('should return user files', async () => {
      const response = await request(app.getHttpServer())
        .get('/files')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return files filtered by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/files?category=documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/files')
        .expect(401);
    });
  });

  describe('/files/:userId/:fileId (GET)', () => {
    it('should serve file with valid token', async () => {
      const fileId = 'test123';
      const secret = configService.get('FILES_ACCESS_SECRET');
      
      const response = await request(app.getHttpServer())
        .get(`/files/${userId}/${fileId}?token=${secret}`)
        .expect(404); // File not found in cache, which is expected

      // This test verifies the endpoint is accessible and token validation works
    });

    it('should reject request with invalid token', async () => {
      const fileId = 'test123';
      
      await request(app.getHttpServer())
        .get(`/files/${userId}/${fileId}?token=invalid-token`)
        .expect(403);
    });

    it('should reject request without token', async () => {
      const fileId = 'test123';
      
      await request(app.getHttpServer())
        .get(`/files/${userId}/${fileId}`)
        .expect(403);
    });
  });

  describe('File processing', () => {
    it('should handle HEIC file conversion', async () => {
      // Mock HEIC file (in real scenario, this would be actual HEIC data)
      const heicFile = Buffer.from('mock heic data');
      
      const response = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', heicFile, 'test.heic')
        .expect(201);

      expect(response.body.message).toContain('HEIC file converted');
    });

    it('should handle PDF files without compression', async () => {
      const pdfFile = Buffer.from('%PDF-1.4 mock pdf content');
      
      const response = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', pdfFile, 'test.pdf')
        .expect(201);

      expect(response.body.message).toContain('PDF cached successfully');
    });
  });

  describe('Storage mode configuration', () => {
    it('should work in cache mode', async () => {
      // Set cache mode
      process.env.FILE_STORAGE_TYPE = 'cache';
      
      const testFile = Buffer.from('test file content');
      
      const response = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile, 'cache-test.txt')
        .expect(201);

      expect(response.body.message).toContain('cached successfully');
    });

    it('should work in filesystem mode', async () => {
      // Set filesystem mode
      process.env.FILE_STORAGE_TYPE = 'filesystem';
      
      const testFile = Buffer.from('test file content');
      
      const response = await request(app.getHttpServer())
        .post('/files/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile, 'filesystem-test.txt')
        .expect(201);

      expect(response.body.message).toContain('cached successfully');
      
      // Reset to cache mode
      process.env.FILE_STORAGE_TYPE = 'cache';
    });
  });
});
