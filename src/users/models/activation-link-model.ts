// activation-link.model.ts

// Sequelize
import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

// Model
import { User } from './user-model';

interface ActivationLinkCreationAttrs {
  user_id: number;
  activation_link: string;
}

@Table({
  tableName: 'activation_links',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ActivationLink extends Model<
  ActivationLink,
  ActivationLinkCreationAttrs
> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  activation_link: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;

  @BelongsTo(() => User)
  user: User;
}
