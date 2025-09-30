// create-user.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Value must be string' })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Not correct email' })
  readonly email: string;

  @IsString({ message: 'Value must be string' })
  @IsNotEmpty({ message: 'Password must not be empty' })
  @Length(8, 20, { message: 'Password must contain from 8 to 20 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?#]).{8,20}$/,
    {
      message:
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
    },
  )
  readonly password: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
