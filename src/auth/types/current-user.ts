import { Role } from '../enums/role.enum';

export type CurrentUser = {
  id: number;
  role: Role;
};

// Export as value for runtime
export const CurrentUser = {} as CurrentUser;
