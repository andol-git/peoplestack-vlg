import { Component } from '@angular/core';
import { CustomerListComponent as PsCustomerListComponent } from '../../../../../../../libs/feature-customer/src/lib/customer-list/customer-list.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [PsCustomerListComponent],
  template: '<ps-customer-list />',
})
export class CustomerListComponent {}
