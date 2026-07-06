import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import { UserApiService } from './user-api.service';
import { User, Role, CreateUserRequest, UpdateUserStatusRequest, AssignRoleRequest } from '@ps/shared/models';

export interface UserState {
  users: User[];
  selectedUser: User | null;
  roles: Role[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserFacade {
  private readonly userApi = inject(UserApiService);

  private readonly _state = signal<UserState>({
    users: [],
    selectedUser: null,
    roles: [],
    isLoading: false,
    isSaving: false,
    error: null,
    successMessage: null,
  });

  readonly users          = computed(() => this._state().users);
  readonly selectedUser   = computed(() => this._state().selectedUser);
  readonly roles          = computed(() => this._state().roles);
  readonly isLoading      = computed(() => this._state().isLoading);
  readonly isSaving       = computed(() => this._state().isSaving);
  readonly error          = computed(() => this._state().error);
  readonly successMessage = computed(() => this._state().successMessage);
  readonly totalActive    = computed(() => this._state().users.filter(u => u.isActive).length);

  loadUsers(): void {
    this._patch({ isLoading: true, error: null });
    this.userApi.getAll()
      .pipe(finalize(() => this._patch({ isLoading: false })))
      .subscribe({
        next: (users) => this._patch({ users }),
        error: (err) => this._patch({ error: err?.error?.message ?? 'Failed to load users.' }),
      });
  }

  loadUserById(id: number): Observable<User> {
    this._patch({ isLoading: true, error: null });
    return this.userApi.getById(id).pipe(
      tap((user) => this._patch({ selectedUser: user, isLoading: false })),
      catchError((err) => {
        this._patch({ isLoading: false, error: err?.error?.message ?? 'User not found.' });
        return throwError(() => err);
      })
    );
  }

  createUser(payload: CreateUserRequest): Observable<User> {
    this._patch({ isSaving: true, error: null, successMessage: null });
    return this.userApi.create(payload).pipe(
      tap((created) => {
        this._patch({
          isSaving: false,
          successMessage: `User "${created.username}" created successfully.`,
          users: [...this._state().users, created],
        });
      }),
      catchError((err) => {
        this._patch({ isSaving: false, error: err?.error?.message ?? 'Failed to create user.' });
        return throwError(() => err);
      })
    );
  }

  updateUserStatus(id: number, payload: UpdateUserStatusRequest): Observable<User> {
    this._patch({ isSaving: true, error: null, successMessage: null });
    return this.userApi.updateStatus(id, payload).pipe(
      tap((updated) => {
        if (!updated) {
          this._patch({ isSaving: false, successMessage: 'User status updated successfully.' });
          return;
        }
        const users = this._state().users.map((u) => u.id === id ? updated : u);
        this._patch({
          isSaving: false,
          successMessage: `User "${updated.username}" ${updated.isActive ? 'activated' : 'deactivated'} successfully.`,
          users,
          selectedUser: this._state().selectedUser?.id === id ? updated : this._state().selectedUser,
        });
      }),
      catchError((err) => {
        this._patch({ isSaving: false, error: err?.error?.message ?? 'Failed to update user status.' });
        return throwError(() => err);
      })
    );
  }

  assignRole(id: number, payload: AssignRoleRequest): Observable<User> {
    this._patch({ isSaving: true, error: null, successMessage: null });
    return this.userApi.assignRole(id, payload).pipe(
      tap((updated) => {
        if (!updated) {
          this._patch({ isSaving: false, successMessage: 'Role assigned successfully.' });
          return;
        }
        const users = this._state().users.map((u) => u.id === id ? updated : u);
        this._patch({
          isSaving: false,
          successMessage: 'Role assigned successfully.',
          users,
          selectedUser: this._state().selectedUser?.id === id ? updated : this._state().selectedUser,
        });
      }),
      catchError((err) => {
        this._patch({ isSaving: false, error: err?.error?.message ?? 'Failed to assign role.' });
        return throwError(() => err);
      })
    );
  }

  removeRole(id: number, roleId: number): void {
    this._patch({ isSaving: true, error: null, successMessage: null });
    this.userApi.removeRole(id, roleId).subscribe({
      next: () => {
        const users = this._state().users.map((u) =>
          u.id === id ? { ...u, roles: u.roles?.filter((r) => r.id !== roleId) } : u
        );
        this._patch({
          isSaving: false,
          successMessage: 'Role removed successfully.',
          users,
        });
      },
      error: (err) => this._patch({ isSaving: false, error: err?.error?.message ?? 'Failed to remove role.' }),
    });
  }

  loadRoles(): void {
    this.userApi.getRoles().subscribe({
      next: (roles) => this._patch({ roles }),
      error: (err) => this._patch({ error: err?.error?.message ?? 'Failed to load roles.' }),
    });
  }

  selectUser(user: User | null): void {
    this._patch({ selectedUser: user });
  }

  clearMessages(): void {
    this._patch({ error: null, successMessage: null });
  }

  private _patch(partial: Partial<UserState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }
}
