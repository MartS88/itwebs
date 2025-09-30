// users.module

// Module
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Models
import { User } from './models/user-model';
import { ActivationLink } from './models/activation-link-model';
import { RefreshToken, PasswordRecoveryCode } from '../auth/models';

// Services
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      RefreshToken,
      PasswordRecoveryCode,
      ActivationLink,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
