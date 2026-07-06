import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Employee } from '@ps/shared-ui';
import { EmployeeFacade } from '../employee-facade/employee.facade';

@Component({
  selector: 'ps-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly facade = inject(EmployeeFacade);

  isEditMode = signal(false);
  employeeId = signal<number | null>(null);

  readonly genderOptions = ['Male', 'Female', 'Other'];
  readonly maritalOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  readonly statusOptions = ['Not Applied', 'Applied', 'Active'];
  readonly exitStatusOptions = ['NOT JOINED', 'RESIGNED', 'TERMINATED', 'RETIRED'];

  form: FormGroup = this.fb.group({
    idNo: ['', Validators.required],
    serialNumberAssigned: [''],
    emailId: ['', [Validators.required, Validators.email]],
    phoneNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    isActive: [true],

    personalDetails: this.fb.group({
      name: ['', Validators.required],
      gender: ['Male', Validators.required],
      dateOfBirth: ['', Validators.required],
      bloodGroup: [''],
      maritalStatus: ['Single'],
      nationality: ['Indian', Validators.required],
      identificationMarks: [''],
      wifeName: [''],
    }),

    familyDetails: this.fb.group({
      fathersName: ['', Validators.required],
      fathersOccupation: [''],
      motherName: ['', Validators.required],
      fatherPlaceOfBirth: [''],
      alternativeMobileNumber: [''],
      relation: [''],
    }),

    careerDetails: this.fb.group({
      dateOfInterview: [''],
      joiningDate: ['', Validators.required],
      reJoiningDate: [''],
      presentAddress: [''],
    }),

    legalBackground: this.fb.group({
      everDetained: [false],
      everBoundDown: [false],
      everFined: [false],
      everConvicted: [false],
      anyCasePending: [false],
      dischargedFromTraining: [false],
      dismissedOrRemoved: [false],
      everArrested: [false],
      everProsecuted: [false],
      responsiblePersons: [''],
    }),

    complianceDetails: this.fb.group({
      pfNo: [''],
      pfStatus: ['Not Applied'],
      esicNo: [''],
      esicStatus: ['Not Applied'],
      ifscCode: [''],
      bankAccountNumber: [''],
      pan: [''],
      brokerName: [''],
      passportNumber: [''],
    }),

    assignmentDetails: this.fb.group({
      site: [''],
      shift: [''],
      category: [''],
      designationPostOffered: [''],
      organisation: [''],
      natureOfEmployment: [''],
      transport: [''],
      uniform: [''],
      shoes: [''],
    }),

    exitDetails: this.fb.group({
      exitDate: [''],
      exitStatus: ['NOT JOINED'],
      remarks: [''],
    }),

    addresses: this.fb.array([
      this.createAddressGroup('PERMANENT'),
      this.createAddressGroup('TEMPORARY'),
    ]),
  });

  constructor() {
    effect(() => {
      const emp = this.facade.selectedEmployee();
      if (emp) this.patchForm(emp);
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.employeeId.set(+id);
      this.facade.loadById(+id);
    }
  }

  createAddressGroup(type: 'PERMANENT' | 'TEMPORARY') {
    return this.fb.group({
      addressType: [type, Validators.required],
      line1: ['', Validators.required],
      district: [''],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{5,6}$/)]],
    });
  }

  get addressesArray() {
    return this.form.get('addresses') as import('@angular/forms').FormArray;
  }

  patchForm(emp: Employee): void {
    this.form.patchValue({
      idNo: emp.idNo ?? '',
      serialNumberAssigned: emp.serialNumberAssigned ?? '',
      emailId: emp.emailId ?? '',
      phoneNo: emp.phoneNo ?? '',
      isActive: emp.isActive ?? true,
      personalDetails: emp.personalDetails ?? {},
      familyDetails: emp.familyDetails ?? {},
      careerDetails: emp.careerDetails ?? {},
      legalBackground: emp.legalBackground ?? {},
      complianceDetails: emp.complianceDetails ?? {},
      assignmentDetails: emp.assignmentDetails ?? {},
      exitDetails: emp.exitDetails ?? {},
    });

    if (emp.addresses?.length) {
      const perm = emp.addresses.find(a => a.addressType === 'PERMANENT') ?? emp.addresses[0];
      const temp = emp.addresses.find(a => a.addressType === 'TEMPORARY') ?? emp.addresses[1];
      if (perm) this.addressesArray.at(0).patchValue(perm);
      if (temp) this.addressesArray.at(1).patchValue(temp);
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const payload = this.form.getRawValue() as Employee;

    if (this.isEditMode() && this.employeeId()) {
      this.facade.update(this.employeeId()!, payload);
    } else {
      this.facade.create(payload);
    }
  }

  cancel(): void {
    this.facade.clearSelected();
    this.router.navigate(['/employees']);
  }

  field(path: string) {
    return this.form.get(path);
  }

  fieldError(path: string): string | null {
    const c = this.field(path);
    if (!c || (!c.touched && !c.dirty) || !c.errors) return null;
    if (c.errors['required']) return 'This field is required';
    if (c.errors['email']) return 'Enter a valid email address';
    if (c.errors['pattern'] && path === 'phoneNo') return 'Phone number must be exactly 10 digits';
    if (c.errors['pattern']) return 'Invalid format';
    return 'Invalid value';
  }
}
