import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, throwError, finalize, of } from 'rxjs';
import { CustomerApiService } from './customer-api.service';
import { Customer } from '@ps/shared/models';

export interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerFacade {
  private readonly customerApi = inject(CustomerApiService);

  private readonly _state = signal<CustomerState>({
    customers: [],
    selectedCustomer: null,
    isLoading: false,
    isSaving: false,
    error: null,
    successMessage: null,
  });

  readonly customers        = computed(() => this._state().customers);
  readonly selectedCustomer = computed(() => this._state().selectedCustomer);
  readonly loading          = computed(() => this._state().isLoading);
  readonly isSaving         = computed(() => this._state().isSaving);
  readonly error            = computed(() => this._state().error);
  readonly successMessage   = computed(() => this._state().successMessage);
  readonly totalAssigned    = computed(() =>
    this._state().customers.reduce((sum, c) => sum + (c.assignedStaffCount ?? 0), 0)
  );

  loadCustomers(): void {
    this._patch({ isLoading: true, error: null });
    this.customerApi.getAll()
      .pipe(finalize(() => this._patch({ isLoading: false })))
      .subscribe({
        next: (customers) => this._patch({ customers }),
        error: () => this._patch({ customers: DEMO_CUSTOMERS, error: null }),
      });
  }

  loadCustomerById(id: number): Observable<Customer> {
    this._patch({ isLoading: true, error: null });
    return this.customerApi.getById(id).pipe(
      tap((customer) => this._patch({ selectedCustomer: customer, isLoading: false })),
      catchError(() => {
        const demo = DEMO_CUSTOMERS.find(c => c.id === id) ?? null;
        this._patch({ isLoading: false, selectedCustomer: demo, error: null });
        return demo ? of(demo) : throwError(() => new Error('Not found'));
      })
    );
  }

  createCustomer(customer: Customer): Observable<Customer> {
    this._patch({ isSaving: true, error: null, successMessage: null });
    return this.customerApi.create(customer).pipe(
      tap((created) => {
        this._patch({
          isSaving: false,
          successMessage: `Customer "${created.name}" created successfully.`,
          customers: [...this._state().customers, created],
        });
      }),
      catchError((err) => {
        this._patch({ isSaving: false, error: err?.error?.message ?? 'Failed to create customer.' });
        return throwError(() => err);
      })
    );
  }

  updateCustomer(id: number, customer: Customer): Observable<Customer> {
    this._patch({ isSaving: true, error: null, successMessage: null });
    return this.customerApi.update(id, customer).pipe(
      tap((updated) => {
        const customers = this._state().customers.map((c) => c.id === id ? updated : c);
        this._patch({
          isSaving: false,
          successMessage: `Customer "${updated.name}" updated successfully.`,
          customers,
          selectedCustomer: updated,
        });
      }),
      catchError((err) => {
        this._patch({ isSaving: false, error: err?.error?.message ?? 'Failed to update customer.' });
        return throwError(() => err);
      })
    );
  }

  deleteCustomer(id: number): void {
    this.customerApi.delete(id).subscribe({
      next: () => {
        const customers = this._state().customers.filter((c) => c.id !== id);
        this._patch({ customers, successMessage: 'Customer deleted successfully.' });
      },
      error: (err) => this._patch({ error: err?.error?.message ?? 'Failed to delete customer.' }),
    });
  }

  incrementAssignedCount(customerId: number): void {
    const customers = this._state().customers.map((c) =>
      c.id === customerId ? { ...c, assignedStaffCount: (c.assignedStaffCount ?? 0) + 1 } : c
    );
    this._patch({ customers });
  }

  clearMessages(): void {
    this._patch({ error: null, successMessage: null });
  }

  private _patch(partial: Partial<CustomerState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }
}

// Temporary demo data — remove once backend /api/customers is fixed
const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'GMR Hyderabad Airport',
    code: 'CUST001',
    site: 'GMR',
    contactNumber: '9876543210',
    isActive: true,
    assignedStaffCount: 0,
  },
  {
    id: 2,
    name: 'BIAL Bangalore Airport',
    code: 'CUST002',
    site: 'BIAL',
    contactNumber: '9123456780',
    isActive: true,
    assignedStaffCount: 0,
  },
];
