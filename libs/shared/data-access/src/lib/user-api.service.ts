import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserRequest, UpdateUserStatusRequest, AssignRoleRequest, Role } from '@ps/shared/models';
import { APP_CONFIG } from '../tokens/app-config.token';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  private get base(): string {
    return `${this.config.apiBaseUrl}/api/users`;
  }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.base);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(payload: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.base, payload);
  }

  updateStatus(id: number, payload: UpdateUserStatusRequest): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}/status`, payload);
  }

  assignRole(id: number, payload: AssignRoleRequest): Observable<User> {
    return this.http.post<User>(`${this.base}/${id}/roles`, payload);
  }

  removeRole(id: number, roleId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/roles/${roleId}`);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.config.apiBaseUrl}/api/roles`);
  }
}
