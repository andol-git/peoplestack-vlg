import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerFacade } from '@ps/shared/data-access';
import { AssignStaffModalComponent } from '../assign-staff-modal/assign-staff-modal.component';

@Component({
  selector: 'ps-customer-list',
  standalone: true,
  imports: [RouterLink, AssignStaffModalComponent],
  templateUrl: './customer-list.html',
})
export class CustomerListComponent implements OnInit {
  readonly facade = inject(CustomerFacade);

  readonly searchTerm          = signal('');
  readonly showAssignModal     = signal(false);
  readonly selectedCustomerId  = signal<number | undefined>(undefined);
  readonly selectedCustomerName = signal<string | undefined>(undefined);

  readonly filteredCustomers = computed(() => {
    const q = this.searchTerm().toLowerCase();
    return this.facade.customers().filter((c) =>
      !q || c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.facade.loadCustomers();
  }

  openAssignModal(customerId: number, customerName: string): void {
    this.selectedCustomerId.set(customerId);
    this.selectedCustomerName.set(customerName);
    this.showAssignModal.set(true);
  }

  onModalClose(): void {
    this.showAssignModal.set(false);
    this.selectedCustomerId.set(undefined);
    this.selectedCustomerName.set(undefined);
  }

  onAssigned(): void {
    this.facade.loadCustomers();
    this.onModalClose();
  }
}
