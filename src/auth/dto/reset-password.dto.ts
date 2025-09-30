
import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Value must be string' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Not correct email' })
  readonly email: string;

  @IsNumberString({}, { message: 'Code must contain only digits' })
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  readonly resetPasswordCode: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password must not be empty' })
  @Length(8, 20, { message: 'Password must be between 8 and 20 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?#]).{8,20}$/,
    {
      message:
        'Password must include uppercase, lowercase, number, and special character',
    },
  )
  readonly newPassword: string;
}
