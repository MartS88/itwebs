// Sequelize
import {
  Column,
  DataType,
  Model,
  Table,
  HasMany,
  BeforeUpdate,
  BeforeCreate,
  HasOne,
} from 'sequelize-typescript';

// Enum
import { Role } from '../../auth/enums/role.enum';

// Models
import { ActivationLink } from './activation-link-model';
import { File } from '../../files/models/file-model';
import { RefreshToken, PasswordRecoveryCode } from '../../auth/models';

// Argon
import * as argon2 from 'argon2';

interface UserCreationAttrs {
  username: string;
  email: string;
  password: string;
}

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model<User, UserCreationAttrs> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(20),
    unique: true,
    allowNull: true,
    defaultValue: null,
  })
  username: string;

  @Column({ type: DataType.STRING(320), unique: true, allowNull: false })
  email: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  password: string;

  @Column({
    type: DataType.ENUM('ADMIN', 'USER', 'EDITOR'),
    defaultValue: 'USER',
  })
  role: Role;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
    field: 'avatar_url',
  })
  avatarUrl: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_activated',
  })
  isActivated: boolean;

  @HasMany(() => RefreshToken, { onDelete: 'CASCADE', hooks: true })
  refreshTokens: RefreshToken[];

  @HasOne(() => PasswordRecoveryCode, { onDelete: 'CASCADE', hooks: true })
  passwordRecoveryCode: PasswordRecoveryCode;

  @HasOne(() => ActivationLink, { onDelete: 'CASCADE', hooks: true })
  activationLinks: ActivationLink;

  @HasMany(() => File, { onDelete: 'CASCADE', hooks: true })
  files: File[];

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('password')) {
      instance.password = await argon2.hash(instance.password, {
        type: argon2.argon2id,
      });
    }
  }
}
