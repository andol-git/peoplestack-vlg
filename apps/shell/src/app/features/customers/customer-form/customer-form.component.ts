import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerFacade } from '../../../../../../../libs/shared/data-access/src/lib/customer.facade';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './customer-form.component.html',
})
export class CustomerFormComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade         = inject(CustomerFacade);

  form!: FormGroup;
  isEditMode = signal(false);
  customerId = signal<number | null>(null);

  ngOnInit(): void {
    this.facade.clearMessages();
    this.form = this.fb.group({
      name:          ['', Validators.required],
      code:          [''],
      site:          [''],
      contactNumber: [''],
      isActive:      [true],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.customerId.set(+id);
      this.facade.loadCustomerById(+id).subscribe(c => {
        this.form.patchValue({
          name:          c.name          ?? '',
          code:          c.code          ?? '',
          site:          c.site          ?? '',
          contactNumber: c.contactNumber ?? '',
          isActive:      c.isActive      ?? true,
        });
      });
    }
  }

  fieldError(path: string): string | null {
    const c = this.form.get(path);
    if (!c || !c.touched || !c.errors) return null;
    if (c.errors['required']) return 'This field is required';
    return 'Invalid value';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue();
    if (this.isEditMode() && this.customerId()) {
      this.facade.updateCustomer(this.customerId()!, payload).subscribe({
        next: () => this.router.navigate(['/customers']),
        error: () => {},
      });
    } else {
      this.facade.createCustomer(payload).subscribe({
        next: () => this.router.navigate(['/customers']),
        error: () => {},
      });
    }
  }
}
