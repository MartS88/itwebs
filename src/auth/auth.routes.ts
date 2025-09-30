

export const AUTH = {
  CONTROLLER: 'auth',
  ROUTES: {
    REGISTER: 'register',
    LOGIN: 'login',
    REFRESH: 'refresh',
    LOGOUT: 'logout',

    GOOGLE_LOGIN: 'google',
    GOOGLE_CALLBACK: 'google/callback',

    FORGOT_PASSWORD: 'forgot-password',
    RESET_PASSWORD: 'reset-password',

    UPDATE_EMAIL: 'update-email',
    UPDATE_PASSWORD: 'update-password',
  },
} as const;
