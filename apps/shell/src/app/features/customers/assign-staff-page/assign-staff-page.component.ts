import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerFacade } from '../../../../../../../libs/shared/data-access/src/lib/customer.facade';
import { AssignStaffModalComponent } from '../../../../../../../libs/feature-customer/src/lib/assign-staff-modal/assign-staff-modal.component';

@Component({
  selector: 'app-assign-staff-page',
  standalone: true,
  imports: [RouterLink, AssignStaffModalComponent],
  templateUrl: './assign-staff-page.component.html',
})
export class AssignStaffPageComponent implements OnInit {
  readonly facade = inject(CustomerFacade);

  readonly searchTerm           = signal('');
  readonly showModal            = signal(false);
  readonly selectedCustomerId   = signal<number | undefined>(undefined);
  readonly selectedCustomerName = signal<string | undefined>(undefined);

  readonly filteredCustomers = computed(() => {
    const q = this.searchTerm().toLowerCase();
    return this.facade.customers().filter(c =>
      !q || c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.facade.loadCustomers();
  }

  openModal(id: number, name: string): void {
    this.selectedCustomerId.set(id);
    this.selectedCustomerName.set(name);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedCustomerId.set(undefined);
    this.selectedCustomerName.set(undefined);
  }

  onAssigned(): void {
    this.facade.loadCustomers();
    this.closeModal();
  }
}
