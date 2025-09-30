
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ValidateUserDto {
  @IsString({ message: 'Value must be string' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Not correct email' })
  readonly email: string;

  @IsString({ message: 'Value must be string' })
  @IsNotEmpty()
  @Length(5, 16, { message: 'Password must contain from 5 to 16 characters' })
  readonly password: string;
}
