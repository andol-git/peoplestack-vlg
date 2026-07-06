import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '../auth/auth.facade';

@Component({
  selector: 'ps-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected facade   = inject(AuthFacade);

  form!: FormGroup;
  showPassword = signal(false);
  currentYear  = new Date().getFullYear();

  readonly features = [
    { icon: '👥', label: 'Employee Management' },
    { icon: '🔐', label: 'AEP & Compliance' },
    { icon: '📊', label: 'Analytics Dashboard' },
    { icon: '🏢', label: 'Multi-Site Support' },
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  get usernameCtrl() { return this.form.get('username')!; }
  get passwordCtrl() { return this.form.get('password')!; }

  get usernameError(): string | null {
    const c = this.usernameCtrl;
    if (!c.touched) return null;
    if (c.hasError('required')) return 'Username is required';
    if (c.hasError('minlength')) return 'At least 3 characters required';
    return null;
  }

  get passwordError(): string | null {
    const c = this.passwordCtrl;
    if (!c.touched) return null;
    if (c.hasError('required')) return 'Password is required';
    if (c.hasError('minlength')) return 'At least 4 characters required';
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.facade.login(this.form.getRawValue());
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
