export type UserRole = 'CLIENT' | 'MANAGER';

export interface UserResponse {
  id: number;
  username: string;
  role: UserRole;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}