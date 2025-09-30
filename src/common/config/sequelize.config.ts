
// Nest js
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

// Models
import { User } from '../../users/models/user-model';
import { ActivationLink } from '../../users/models/activation-link-model';
import { RefreshToken, PasswordRecoveryCode } from '../../auth/models';
import { File } from '../../files/models/file-model';


export const SequelizeConfig = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService): Promise<SequelizeModuleOptions> => {
    return {
      dialect: 'mysql',
      host: configService.get<string>('MYSQL_HOST'),
      port: configService.get<number>('MYSQL_PORT'),
      username: configService.get<string>('MYSQL_USERNAME'),
      password: configService.get<string>('MYSQL_PASSWORD'),
      database: configService.get<string>('MYSQL_NAME'),
      models: [User, RefreshToken, PasswordRecoveryCode, ActivationLink,File],
      dialectOptions: {
        // cert: {
        //   require: true,
        //   rejectUnauthorized: false,
        // },
      },
      pool: {
        max: 50,
        min: 10,
        acquire: 10000,
        idle: 5000,
      },
    };
  },
  inject: [ConfigService],
};
