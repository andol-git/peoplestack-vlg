import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '../auth/auth.facade';

@Component({
  selector: 'ps-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  protected facade   = inject(AuthFacade);
  private   fb       = inject(FormBuilder);
  protected showPass = signal(false);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  get u() { return this.form.get('username')!; }
  get p() { return this.form.get('password')!; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.facade.login({ username: this.u.value!, password: this.p.value! });
  }
}
