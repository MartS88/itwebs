
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateUsernameDto {
  @IsString({ message: 'Value must be string' })
  @IsNotEmpty()
  @Length(3, 16, { message: 'Username must contain from 3 to 16 characters' })
  readonly newUsername: string;
}
