export type UserRole = 'CLIENT' | 'MANAGER';

export interface UserResponse {
  id: string;
  username: string;
  fullName: string | null;
  email: string | null;
  role: UserRole;
  gradeCode: string | null;
  gradeName: string | null;
  teamCode: string | null;
  teamName: string | null;
}

export interface CreateUserRequest {
  username: string;
  fullName?: string;
  email?: string;
  password: string;
  role: UserRole;
  gradeCode?: string;
  teamCode?: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserProfileRequest {
  gradeCode?: string | null;
  teamCode?: string | null;
  email?: string | null;
}
