
// Nest js
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

// Modules
import { UsersModule } from '../users/users.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';

// Services and controllers
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

// Models
import { User } from '../users/models/user-model';
import { ActivationLink } from '../users/models/activation-link-model';
import { RefreshToken, PasswordRecoveryCode } from './models';

// Config
import { jwtConfig, refreshJwtConfig, googleOauthConfig } from './config';

// Guard and strategies
import { APP_GUARD } from '@nestjs/core';
import {
  GoogleStrategy,
  RefreshJwtStrategy,
  JwtStrategy,
  LocalStrategy,
} from './strategies';
import { RolesGuard, JwtAuthGuard } from './guards';

@Module({
  imports: [
    SequelizeModule.forFeature([User,RefreshToken,PasswordRecoveryCode,ActivationLink]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    ConfigModule.forFeature(googleOauthConfig),
    UsersModule,
    RabbitmqModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    GoogleStrategy,

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}