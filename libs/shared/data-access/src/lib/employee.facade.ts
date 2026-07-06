import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import { EmployeeApiService } from './employee-api.service';
import { Employee } from '@ps/shared/models';

export interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  totalActive: number;
  totalInactive: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeFacade {
  // ─── Dependencies ─────────────────────────────────────────────────────────
  private readonly employeeApi = inject(EmployeeApiService);

  // ─── State ────────────────────────────────────────────────────────────────
  private readonly _state = signal<EmployeeState>({
    employees: [],
    selectedEmployee: null,
    isLoading: false,
    isSaving: false,
    error: null,
    successMessage: null,
    totalActive: 0,
    totalInactive: 0,
  });

  // ─── Selectors ────────────────────────────────────────────────────────────
  readonly employees        = computed(() => this._state().employees);
  readonly selectedEmployee = computed(() => this._state().selectedEmployee);
  readonly isLoading        = computed(() => this._state().isLoading);
  readonly isSaving         = computed(() => this._state().isSaving);
  readonly error            = computed(() => this._state().error);
  readonly successMessage   = computed(() => this._state().successMessage);
  readonly totalActive      = computed(() => this._state().totalActive);
  readonly totalInactive    = computed(() => this._state().totalInactive);

  // ─── Actions ──────────────────────────────────────────────────────────────

  loadEmployees(active = true): void {
    this._patch({ isLoading: true, error: null });
    const call$ = active
      ? this.employeeApi.getAll()
      : this.employeeApi.getAllInactive();

    call$.pipe(finalize(() => this._patch({ isLoading: false }))).subscribe({
      next: (employees) =>
        this._patch({
          employees,
          totalActive: active ? employees.length : this._state().totalActive,
          totalInactive: !active ? employees.length : this._state().totalInactive,
        }),
      error: (err) =>
        this._patch({ error: err?.error?.message ?? 'Failed to load employees.' }),
    });
  }

  loadEmployeeById(id: number): Observable<Employee> {
    this._patch({ isLoading: true, error: null });
    return this.employeeApi.getById(id).pipe(
      tap((employee) => this._patch({ selectedEmployee: employee, isLoading: false })),
      catchError((err) => {
        this._patch({ isLoading: false, error: err?.error?.message ?? 'Employee not found.' });
        return throwError(() => err);
      })
    );
  }

  createEmployee(employee: Employee): Observable<Employee> {
    this._patch({ isSaving: true, error: null, successMessage: null });
    return this.employeeApi.create(employee).pipe(
      tap((created) => {
        this._patch({
          isSaving: false,
          successMessage: `Employee ${created.idNo} created successfully.`,
          employees: [...this._state().employees, created],
          totalActive: this._state().totalActive + 1,
        });
      }),
      catchError((err) => {
        this._patch({ isSaving: false, error: err?.error?.message ?? 'Failed to create employee.' });
        return throwError(() => err);
      })
    );
  }

  updateEmployee(id: number, employee: Employee): Observable<Employee> {
    this._patch({ isSaving: true, error: null, successMessage: null });
    return this.employeeApi.update(id, employee).pipe(
      tap((updated) => {
        const employees = this._state().employees.map((e) =>
          e.id === id ? updated : e
        );
        this._patch({
          isSaving: false,
          successMessage: `Employee ${updated.idNo} updated successfully.`,
          employees,
          selectedEmployee: updated,
        });
      }),
      catchError((err) => {
        this._patch({ isSaving: false, error: err?.error?.message ?? 'Failed to update employee.' });
        return throwError(() => err);
      })
    );
  }

  inactivateEmployee(id: number): void {
    this.employeeApi.inactivate(id).subscribe({
      next: () => {
        const employees = this._state().employees.filter((e) => e.id !== id);
        this._patch({
          employees,
          successMessage: 'Employee deactivated successfully.',
          totalActive: this._state().totalActive - 1,
          totalInactive: this._state().totalInactive + 1,
        });
      },
      error: (err) =>
        this._patch({ error: err?.error?.message ?? 'Failed to deactivate employee.' }),
    });
  }

  deleteEmployee(id: number): void {
    this.employeeApi.delete(id).subscribe({
      next: () => {
        const employees = this._state().employees.filter((e) => e.id !== id);
        this._patch({
          employees,
          successMessage: 'Employee deleted permanently.',
          totalActive: Math.max(0, this._state().totalActive - 1),
        });
      },
      error: (err) =>
        this._patch({ error: err?.error?.message ?? 'Failed to delete employee.' }),
    });
  }

  selectEmployee(employee: Employee | null): void {
    this._patch({ selectedEmployee: employee });
  }

  clearMessages(): void {
    this._patch({ error: null, successMessage: null });
  }

  // ─── Private ──────────────────────────────────────────────────────────────
  private _patch(partial: Partial<EmployeeState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }
}
