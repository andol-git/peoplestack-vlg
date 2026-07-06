import { Component, signal, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { RouterLink, ActivatedRoute, Router } from "@angular/router";
import { UserFacade } from "@ps/shared/data-access";

@Component({
  selector: "app-user-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./user-form.component.html",
})
export class UserFormComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly facade  = inject(UserFacade);

  public isEditMode   = signal(false);
  public isSaving     = this.facade.isSaving;
  public showPass     = signal(false);
  private editUserId: number | null = null;

  public readonly roles = [
    { id: 1, name: 'ROLE_SUPER_ADMIN', label: 'Super Admin' },
    { id: 3, name: 'ROLE_ADMIN',       label: 'Admin' },
    { id: 4, name: 'ROLE_MANAGER',     label: 'Manager' },
    { id: 2, name: 'ROLE_AGENT',       label: 'Agent' },
    { id: 5, name: 'ROLE_EMPLOYEE',    label: 'Employee' },
  ];
  public readonly companies = [
    "VLG Services",
    "SecureGuard Pvt Ltd",
    "AirPort Security",
    "Elite Force",
  ];

  public form!: FormGroup;

  public ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    this.isEditMode.set(!!id && id !== "new");
    this.editUserId = id && id !== "new" ? +id : null;

    this.form = this.fb.group({
      name:            ["", Validators.required],
      email:           ["", [Validators.required, Validators.email]],
      role:            [5, Validators.required],
      company:         ["VLG Services"],
      status:          ["Active"],
      password:        ["", this.isEditMode() ? [] : [Validators.required, Validators.minLength(6)]],
      confirmPassword: [""],
      notes:           [""],
    });

    this.facade.loadRoles();

    if (this.isEditMode() && this.editUserId) {
      this.facade.loadUserById(this.editUserId).subscribe({
        next: (user) => {
          const existingRole = this.roles.find(r => r.name === user.roles?.[0]?.name);
          this.form.patchValue({
            name:   user.username,
            email:  user.email,
            role:   existingRole?.id ?? 5,
            status: user.isActive ? "Active" : "Inactive",
          });
        },
      });
    }
  }

  public fieldError(key: string): string | null {
    const c = this.form.get(key);
    if (!c || !c.touched || !c.errors) return null;
    if (c.errors["required"])  return "This field is required";
    if (c.errors["email"])     return "Enter a valid email";
    if (c.errors["minlength"]) return `Minimum ${c.errors["minlength"].requiredLength} characters`;
    return "Invalid value";
  }

  public toggleShowPass(): void {
    this.showPass.update(v => !v);
  }

  public onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { name, email, password, role, status } = this.form.value;
    const roleId = +role;

    if (this.isEditMode() && this.editUserId) {
      const id = this.editUserId;
      this.facade.updateUserStatus(id, { isActive: status === "Active" }).subscribe({
        next: () => {
          this.facade.assignRole(id, { roleId }).subscribe({
            next: () => this.router.navigate(["/users"]),
          });
        },
      });
    } else {
      this.facade.createUser({
        username: name,
        email,
        password,
        roleIds: [roleId],
      }).subscribe({
        next: () => this.router.navigate(["/users"]),
      });
    }
  }
}
