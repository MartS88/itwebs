import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../../users/models/user-model';


@Table({
  tableName: 'files',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class File extends Model<File> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'user_id',
  })
  userId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'original_name',
  })
  originalName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'file_name',
  })
  fileName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'file_path',
  })
  filePath: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'mime_type',
  })
  mimeType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'file_size',
  })
  fileSize: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_processed',
  })
  isProcessed: boolean;

  @BelongsTo(() => User)
  user: User;
}
