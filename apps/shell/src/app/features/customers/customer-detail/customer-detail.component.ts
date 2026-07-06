import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CustomerFacade } from '../../../../../../../libs/shared/data-access/src/lib/customer.facade';
import { AssignStaffModalComponent } from '../../../../../../../libs/feature-customer/src/lib/assign-staff-modal/assign-staff-modal.component';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [RouterLink, AssignStaffModalComponent],
  templateUrl: './customer-detail.component.html',
})
export class CustomerDetailComponent implements OnInit {
  readonly facade    = inject(CustomerFacade);
  readonly route     = inject(ActivatedRoute);
  readonly showModal = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.loadCustomerById(+id).subscribe();
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'C';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  onAssigned(): void {
    const id = this.facade.selectedCustomer()?.id;
    if (id) this.facade.loadCustomerById(id).subscribe();
    this.showModal.set(false);
  }
}
