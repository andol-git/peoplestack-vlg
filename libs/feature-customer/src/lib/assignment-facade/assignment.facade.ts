import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize } from 'rxjs';
import { AssignmentService } from '../assignment-service/assignment.service';
import { EmployeeFacade, CustomerFacade } from '@ps/shared/data-access';
import { Employee } from '@ps/shared/models';

export interface AssignmentState {
  assignedEmployeeIds: number[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
}

@Injectable({ providedIn: 'root' })
export class AssignmentFacade {
  private readonly assignmentService = inject(AssignmentService);
  private readonly employeeFacade    = inject(EmployeeFacade);
  private readonly customerFacade    = inject(CustomerFacade);

  private readonly _state = signal<AssignmentState>({
    assignedEmployeeIds: [],
    isLoading: false,
    isSaving: false,
    error: null,
    successMessage: null,
  });

  readonly assignedEmployeeIds = computed(() => this._state().assignedEmployeeIds);
  readonly isLoading           = computed(() => this._state().isLoading);
  readonly isSaving            = computed(() => this._state().isSaving);
  readonly error               = computed(() => this._state().error);
  readonly successMessage      = computed(() => this._state().successMessage);
  readonly availableEmployees  = computed<Employee[]>(() => this.employeeFacade.employees());

  readonly unassignedEmployees = computed<Employee[]>(() => {
    const assignedIds = new Set(this._state().assignedEmployeeIds);
    return this.employeeFacade.employees().filter((e) => e.id != null && !assignedIds.has(e.id));
  });

  readonly assignedEmployees = computed<Employee[]>(() => {
    const assignedIds = new Set(this._state().assignedEmployeeIds);
    return this.employeeFacade.employees().filter((e) => e.id != null && assignedIds.has(e.id));
  });

  loadForCustomer(customerId: number): void {
    this._patch({ isLoading: true, error: null });
    this.employeeFacade.loadEmployees(true);
    this.assignmentService.getAssignments(customerId)
      .pipe(finalize(() => this._patch({ isLoading: false })))
      .subscribe({
        next: (assignments) =>
          this._patch({ assignedEmployeeIds: assignments.map((a) => a.employeeId) }),
        error: (err) =>
          this._patch({ error: err?.error?.message ?? 'Failed to load assignments.' }),
      });
  }

  assignStaff(customerId: number, employeeId: number): void {
    this._patch({ isSaving: true, error: null, successMessage: null });
    this.assignmentService.assignStaff(customerId, employeeId)
      .pipe(finalize(() => this._patch({ isSaving: false })))
      .subscribe({
        next: () => {
          this._patch({
            assignedEmployeeIds: [...this._state().assignedEmployeeIds, employeeId],
            successMessage: 'Staff assigned successfully.',
          });
          this.customerFacade.incrementAssignedCount(customerId);
        },
        error: (err) =>
          this._patch({ error: err?.error?.message ?? 'Failed to assign staff.' }),
      });
  }

  unassignStaff(customerId: number, employeeId: number): void {
    this._patch({ isSaving: true, error: null, successMessage: null });
    this.assignmentService.unassignStaff(customerId, employeeId)
      .pipe(finalize(() => this._patch({ isSaving: false })))
      .subscribe({
        next: () =>
          this._patch({
            assignedEmployeeIds: this._state().assignedEmployeeIds.filter((id) => id !== employeeId),
            successMessage: 'Staff unassigned successfully.',
          }),
        error: (err) =>
          this._patch({ error: err?.error?.message ?? 'Failed to unassign staff.' }),
      });
  }

  reset(): void {
    this._patch({ assignedEmployeeIds: [], error: null, successMessage: null, isLoading: false, isSaving: false });
  }

  private _patch(partial: Partial<AssignmentState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }
}
