export const FILES = {
  CONTROLLER: 'files',
  ROUTES: {
    UPLOAD: 'upload',
    GET_FILE_BY_USER_AND_ID: ':userId/:fileId',
    DELETE_FILE: ':fileId',
  },
} as const;
