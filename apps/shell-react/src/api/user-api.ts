import { http } from '../lib/http';
import type { AssignRoleRequest, CreateUserRequest, Role, UpdateUserStatusRequest, User } from '../types/models';

export const userApi = {
  getAll() {
    return http.get<User[]>('/api/users').then((r) => r.data);
  },
  getById(id: number) {
    return http.get<User>(`/api/users/${id}`).then((r) => r.data);
  },
  create(payload: CreateUserRequest) {
    return http.post<User>('/api/users', payload).then((r) => r.data);
  },
  updateStatus(id: number, payload: UpdateUserStatusRequest) {
    return http.patch<User>(`/api/users/${id}/status`, payload).then((r) => r.data);
  },
  assignRole(id: number, payload: AssignRoleRequest) {
    return http.post<User>(`/api/users/${id}/roles`, payload).then((r) => r.data);
  },
  removeRole(id: number, roleId: number) {
    return http.delete<void>(`/api/users/${id}/roles/${roleId}`).then((r) => r.data);
  },
  getRoles() {
    return http.get<Role[]>('/api/roles').then((r) => r.data);
  },
};
