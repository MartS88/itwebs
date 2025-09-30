// Other packages
import * as argon2 from 'argon2';
// import * as bcrypt from 'bcryptjs';

// Nestjs
import { InjectModel } from '@nestjs/sequelize';

import {
  BadRequestException,
  ConflictException,
  // HttpException,
  // HttpStatus,
  Injectable,
  NotFoundException,
  // UnauthorizedException,
} from '@nestjs/common';

// Models
import { User } from './models/user-model';
import { RefreshToken } from '../auth/models';

// Dto
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdatePasswordDto } from '../auth/dto';
import { PasswordRecoveryCode } from '../auth/models';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    @InjectModel(RefreshToken)
    private refreshTokenRepository: typeof RefreshToken,
    @InjectModel(PasswordRecoveryCode)
    private passwordRecoveryCodeRepository: typeof PasswordRecoveryCode,
  ) {}

  async createUser(dto: CreateUserDto) {
    return this.userRepository.create(dto);
  }

  async getUserById(id: number) {
    return this.userRepository.findByPk(id, {
      attributes: {
        exclude: ['password'],
      },
    });
  }

  async getUserByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      attributes: { exclude: ['created_at', 'updated_at'] },
    });
  }

  async getRefreshEntity(userId: number) {
    return this.refreshTokenRepository.findOne({
      where: { userId },
      include: { all: true },
    });
  }

  /**
   * Updates or creates a refresh token entry for a specific user session.
   *
   * This function first attempts to find an existing refresh token record
   * for the given combination of `userId`, `ipAddress`, and `userAgent`.
   *
   * - If a matching record is found, it updates the `hashedRefreshToken`.
   * - If no record is found and `hashedRefreshToken` is not null, it creates a new record.
   * - If no record is found and `hashedRefreshToken` is null, it does nothing (no invalid token is created).
   *
   * @param {number} userId - The ID of the user whose session is being updated.
   * @param {string | null} hashedRefreshToken - The new hashed refresh token to store, or null to invalidate the session.
   * @param {string} ipAddress - The IP address associated with the session.
   * @param {string} userAgent - The user agent string of the client device.
   *
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async updateHashedRefreshToken(
    userId: number,
    hashedRefreshToken: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { userId, ipAddress, userAgent },
    });

    if (existingToken) {
      await existingToken.update({ hashedRefreshToken });
    } else if (hashedRefreshToken !== null) {
      await this.refreshTokenRepository.create({
        userId,
        hashedRefreshToken,
        ipAddress,
        userAgent,
      });
    }
  }

  async getUserByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username },
      include: { all: true },
    });
  }

  async getPasswordRecovery(userId: number) {
    return this.passwordRecoveryCodeRepository.findOne({ where: { userId } });
  }

  async updateUserEmail(userId: number, newEmail: string) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User with this id not found');
    }
    if (user.email === newEmail) {
      throw new BadRequestException('This is already your current email.');
    }
    user.email = newEmail;
    await user.save();
    return 'User email updated successfully';
  }

  async updateUserPassword(userId: number, dto: UpdatePasswordDto) {
    const { newPassword } = dto;
    const user = await this.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User with this id not found');
    }
    const isSame = await argon2.verify(user.password, newPassword);
    if (isSame) {
      throw new BadRequestException(
        'New password must differ from the current one.',
      );
    }

    user.password = newPassword;
    await user.save();
    return 'User password updated successfully';
  }

  async updateUsername(userId: number, dto: UpdateUsernameDto) {
    const { newUsername } = dto;
    const user = await this.getUserById(userId);
    // Check if the new username is already taken by a different user
    const existingUser = await this.getUserByUsername(newUsername);
    if (existingUser) {
      if (existingUser.id === user.id) {
        throw new ConflictException('You already have this username.');
      } else {
        throw new ConflictException('Username is already taken.');
      }
    }
    // If no conflicts, update the username
    user.username = newUsername;
    await user.save();

    return 'Username updated successfully';
  }
}
