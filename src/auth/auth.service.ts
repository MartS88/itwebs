
// Other packages
import { v4 as uuidv4 } from 'uuid';
import * as argon2 from 'argon2';
import { Sequelize } from 'sequelize-typescript';

// Nest js
import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService, ConfigType } from '@nestjs/config';

// Config
import { refreshJwtConfig } from './config';

// Dto
import { CreateUserDto } from '../users/dto/create-user.dto';
import {
  ResetPasswordDto,
  ForgotPasswordDto,
  UpdatePasswordDto,
  UpdateEmailDto,
} from './dto';

// Types
import { CurrentUser,AuthJwtPayload,GoogleAuthMode, ValidateGoogleUserOptions } from './types';
import { RabbitmqNames, SendPasswordCodePayload, SendWelcomeMessage } from '../rabbitmq/types';

// Models
import { User } from '../users/models/user-model';
import { ActivationLink } from '../users/models/activation-link-model';
import { RefreshToken, PasswordRecoveryCode } from './models';

// Services
import { UsersService } from '../users/users.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
      private readonly configService: ConfigService,
      private userService: UsersService,
      private jwtService: JwtService,
      private rabbitmqService: RabbitmqService,
      @Inject(refreshJwtConfig.KEY)
      private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
      @Inject(Sequelize) private readonly sequelize: Sequelize,
      @InjectModel(User) private userRepository: typeof User,
      @InjectModel(RefreshToken) private refreshTokenRepository: typeof RefreshToken,
      @InjectModel(PasswordRecoveryCode) private passwordRecoveryCodeRepository: typeof PasswordRecoveryCode,
      @InjectModel(ActivationLink) private activationLinkRepository: typeof ActivationLink,
  ) {
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('User with this email does not exist');
    const isPasswordMatch = await argon2.verify(user.password, password);

    if (!isPasswordMatch)
      throw new UnauthorizedException('Password does not match');
    return { id: user.id };
  }

  async register(userDto: CreateUserDto) {
    const { email } = userDto;

    const existingUser = await this.userService.getUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exist');
    }

    const newUser = await this.userService.createUser(userDto);

    // Send task to rabbit
    await this.queueWelcomeMessage(
        RabbitmqNames.NOTIFICATION_SERVICE,
        {
          email: newUser.email,
          username: newUser.username,
        });

    return newUser;

  }

  async login(userId: number, ipAddress: string, userAgent: string) {
    const { accessToken, refreshToken } = await this.generateTokens(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);

    await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken, ipAddress, userAgent);
    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async generateTokens(userId: number) {
    const payload: AuthJwtPayload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: number, ipAddress: string, userAgent: string) {
    const { accessToken, refreshToken } = await this.generateTokens(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);

    await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken, ipAddress, userAgent);
    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.userService.getUserById(userId);
    const refreshTokenEntity = await this.userService.getRefreshEntity(userId);

    if (!refreshTokenEntity) {
      throw new NotFoundException(`Refresh token with user_id:${userId} not found`);
    }

    const { hashedRefreshToken } = refreshTokenEntity;

    if (!user || !refreshTokenEntity) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }

    const refreshTokenMatches = await argon2.verify(
        hashedRefreshToken,
        refreshToken,
    );

    if (!refreshTokenMatches) {
      this.logger.error('validateRefreshToken', 'Invalid Refresh Token');
      throw new UnauthorizedException('Invalid Refresh Token');
    }
    return { id: userId };
  }

  async logOut(userId: number, ipAddress: string, userAgent: string) {
    await this.userService.updateHashedRefreshToken(userId, null, ipAddress, userAgent);
  }

  async validateJwtUser(userId: number) {
    const user = await this.userService.getUserById(userId);
    if (!user) throw new UnauthorizedException('User not found!');

    const currentUser: CurrentUser = { id: user.id, role: user.role };
    return currentUser;
  }

  async validateGoogleUser({ googleUser, mode }: ValidateGoogleUserOptions) {
    const { email } = googleUser;
    const user = await this.userService.getUserByEmail(email);

    if (mode === GoogleAuthMode.LOGIN) {
      if (user) return user;
      throw new NotFoundException('An account with this email address was not found.');
    } else if (mode === GoogleAuthMode.SIGNUP) {
      if (user) {
        throw new ConflictException('User with this email already exists!');
      }
      
      const newUser = await this.userService.createUser(googleUser);

      if (!newUser?.id) {
        await newUser.reload();
      }

      try {

        // Send task to rabbit
        await this.queueWelcomeMessage(
            RabbitmqNames.NOTIFICATION_SERVICE,
            {
              email: newUser.email,
              username: newUser.username,
            });

      } catch (err) {
        console.error('Token creation failed:', err);
        throw new InternalServerErrorException('Token creation failed');
      }

      return newUser;
    }
  }


  checkPasswordRequirements(password: string) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?#]).{8,20}$/;
    if (!passwordRegex.test(password)) {
      throw new UnauthorizedException(
          'Password must be 8-20 characters, include one uppercase letter, one number, and one special character.',
      );
    }
  }

  /**
   * Handles password recovery request by generating and sending a reset code to the user's email.
   *
   * - If a valid code already exists and hasn't expired, informs the user to check their email.
   * - If the code has expired, generates and updates it.
   * - If no code exists, creates a new one.
   *
   * @param {ForgotPasswordDto} dto - Data transfer object containing the user's email.
   * @throws {NotFoundException} If no user is found with the given email.
   * @throws {HttpException} If sending the email fails or any other error occurs during the transaction.
   * @returns {Promise<{ message: string }>} A message indicating the result of the operation.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const transaction = await this.sequelize.transaction();
    try {
      const { email } = dto;

      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User with this email does not exist.');
      }
      const userId = user.id;

      const passwordRecovery = await this.userService.getPasswordRecovery(userId);
      const now = Date.now();


      // Return code
      if (passwordRecovery && now < passwordRecovery.resetPasswordExpires) {
        await transaction.rollback();
        return { message: 'You already have a valid recovery code in your email.' };
      }

      // Code expired — update
      if (passwordRecovery && now > passwordRecovery.resetPasswordExpires) {

        const newPasswordRecoveryCode = uuidv4().replace(/\D/g, '').substring(0, 6);
        await passwordRecovery.update({
          resetPasswordCode: newPasswordRecoveryCode,
          resetPasswordExpires: now + 15 * 60 * 1000, // 15 min
        }, { transaction });

        // Send task to rabbit
        await this.queuePasswordRecoveryEmail(
            RabbitmqNames.NOTIFICATION_SERVICE,
            {
              email: email,
              code: newPasswordRecoveryCode,
              username: user.username,
            });

        await transaction.commit();
        return { message: 'Recovery code was sent to your email' };
      }

      // No code yet — create new
      const passwordRecoveryCode = uuidv4().replace(/\D/g, '').substring(0, 6);

      await this.passwordRecoveryCodeRepository.create({
        userId,
        resetPasswordCode: passwordRecoveryCode,
        resetPasswordExpires: now + 15 * 60 * 1000, // 15 minutes
      }, { transaction });


      // Send task to rabbit
      await this.queuePasswordRecoveryEmail(
          RabbitmqNames.NOTIFICATION_SERVICE,
          {
            email: email,
            code: passwordRecoveryCode,
            username: user.username,
          });

      await transaction.commit();

      return { message: 'Recovery code was sent to your email' };
    } catch (error: any) {
      await transaction.rollback();
      this.logger.error('forgotPassword', error.message, { stack: error.stack });
      throw error;
    }
  }


  /**
   * Resets the user's password using a recovery code.
   *
   * @param {ResetPasswordDto} dto - Data transfer object containing the user's email, new password, and reset code.
   * @throws {NotFoundException} If no user is found with the given email.
   * @throws {UnauthorizedException} If the reset code is missing, incorrect, or expired.
   * @throws {HttpException} If updating the user or destroying the code fails.
   * @returns {Promise<{ message: string }>} A success message if the password is reset.
   */
  async requestPasswordReset(dto: ResetPasswordDto) {
    const transaction = await this.sequelize.transaction();

    try {
      const { email, newPassword, resetPasswordCode } = dto;

      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw new NotFoundException('User with this email does not exist.');
      }
      const now = Date.now();
      const passwordRecoveryCode = await this.userService.getPasswordRecovery(user.id);

      if (!passwordRecoveryCode) {
        throw new NotFoundException('No reset code found.');
      }

      if (passwordRecoveryCode.resetPasswordCode !== resetPasswordCode) {
        throw new ConflictException('The code is incorrect.');
      }
      if (passwordRecoveryCode.resetPasswordExpires < now) {
        throw new GoneException('Reset code has expired.');
      }
      await user.update(
          { password: newPassword },
          { transaction },
      );

      await passwordRecoveryCode.destroy({ transaction });
      await transaction.commit();
      return { message: 'Password updated successfully' };
    } catch (error: any) {

      await transaction.rollback();
      this.logger.error('requestPasswordReset', error.message, { stack: error.stack });
      throw error;
    }

  }


  /**
   * Queues a welcome message to be sent by publishing it to RabbitMQ.
   *
   * This method emits a message to the specified RabbitMQ exchange or queue with the given payload.
   * It is used to asynchronously trigger the welcome message sending logic in the notification microservice.
   * @param {RabbitmqNames} rabbitName - The name of the RabbitMQ exchange or queue to emit the message to.
   * @param {SendWelcomeMessage} payload - The payload containing email and username for the welcome message.
   *
   * @throws {BadRequestException} If the payload is missing or invalid.
   */
  async queueWelcomeMessage(rabbitName: RabbitmqNames, payload: SendWelcomeMessage) {
    if (!payload) {
      this.logger.error('queueWelcomeMessage', 'Payload is missing');
      throw new BadRequestException('Payload is missing');
    }
    await this.rabbitmqService.emit(rabbitName, 'send-welcome-message', payload);
  }

  /**
   * Sends a password recovery code task to the notification microservice via RabbitMQ.
   *
   * This function emits an event with the specified payload containing the user's email,
   * recovery code, and username. It is used to trigger an email notification for password recovery.
   * The microservice is responsible for handling the delivery of the email.
   *
   * @param {SendPasswordCodePayload} payload - Object containing email, code, and username.
   * @throws {BadRequestException} If the payload is missing or invalid.
   * @returns {Promise<void>} Resolves once the message is published to the broker.
   */
  async queuePasswordRecoveryEmail(rabbitName: RabbitmqNames, payload: SendPasswordCodePayload) {
    if (!payload) {
      this.logger.error('queuePasswordRecoveryEmail', 'Payload is missing');
      throw new BadRequestException('Payload is missing');
    }
    await this.rabbitmqService.emit(rabbitName, 'send-password-recovery-code', payload);
  }

  /**
   * Changes the email address of a user.
   *
   * @param {number} userId - The ID of the user whose email is being changed.
   * @param {UpdateEmailDto} dto - Data transfer object containing the new email address.
   * @throws {ConflictException} If the new email is already in use by another user.
   * @returns {Promise<string>} A confirmation message after updating the email.
   */
  async changeEmail(userId: number, dto: UpdateEmailDto): Promise<string> {
    const { newEmail } = dto;
    const existingUser = await this.userService.getUserByEmail(newEmail);

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('This email is already in use.');
    }
    return await this.userService.updateUserEmail(userId, newEmail);
  }

  /**
   * Changes the user's password.
   *
   * @param {number} userId - ID of the user whose password is being changed.
   * @param {UpdatePasswordDto} dto - Data transfer object containing the new password.
   * @returns {Promise<string>} A message confirming that the password was updated.
   */
  async changePassword(userId: number, dto: UpdatePasswordDto): Promise<string> {
    return await this.userService.updateUserPassword(userId, dto);
  }

}


