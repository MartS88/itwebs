
// Sequelize
import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

// Models
import { User } from '../../users/models/user-model';

@Table({
  tableName: 'refresh_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'unique_user_session',
      unique: true,
      fields: ['user_id', 'ip_address', 'user_agent'],
    },
  ],
})
export class RefreshToken extends Model<RefreshToken> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(150),
    allowNull: true,
    field: 'hashed_refresh_token',
  })
  hashedRefreshToken: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  // @Column({ type: DataType.BIGINT, allowNull: true, field: 'expires_at' })
  // expiresAt: number;

  @Column({ type: DataType.STRING, allowNull: false, field: 'ip_address' })
  ipAddress: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'user_agent' })
  userAgent: string;
}
