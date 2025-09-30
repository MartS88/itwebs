import { CreateUserDto } from '../../users/dto/create-user.dto';

export enum GoogleAuthMode {
  LOGIN = 'login',
  SIGNUP = 'signup',
}

export interface ValidateGoogleUserOptions {
  googleUser: CreateUserDto;
  mode: GoogleAuthMode;
}
