
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString({ message: 'Value must be string' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Not correct email' })
  readonly email: string;
}
