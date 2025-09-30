
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/user-model';

interface PasswordRecoveryCodeCreationAttrs {
  userId: number;
  resetPasswordCode: string;
  resetPasswordExpires: number;
}

@Table({
  tableName: 'password_recovery_codes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class PasswordRecoveryCode extends Model<
  PasswordRecoveryCode,
  PasswordRecoveryCodeCreationAttrs
> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.STRING(6),
    allowNull: false,
    field: 'reset_password_code',
  })
  resetPasswordCode: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    field: 'reset_password_expires',
  })
  resetPasswordExpires: number;
}
