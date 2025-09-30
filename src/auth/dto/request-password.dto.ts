
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestPasswordDto {
  @IsString({ message: 'Value must be string' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Not correct email' })
  readonly email: string;

  // @IsString({ message: 'Value must be string' })
  // @Length(6, 6, { message: 'Length must be exactly 6 characters' })
  // @IsNotEmpty()
  // readonly resetPasswordCode: string;
  //
  //

  // @IsString({message: 'Value must be string'})
  // @IsNotEmpty()
  // @Length(5, 16, {message: 'Password must contain from 5 to 16 characters'})
  // readonly newPassword: string;
}
