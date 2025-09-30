
import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class UpdatePasswordDto {
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
  readonly newPassword: string;
}
