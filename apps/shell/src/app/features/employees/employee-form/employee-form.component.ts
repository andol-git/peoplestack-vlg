import { Component, inject, OnInit, signal, computed } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { EmployeeFacade } from "@ps/shared/data-access";

interface WizardStep {
  id: number;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: "app-employee-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./employee-form.component.html",
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly facade = inject(EmployeeFacade);

  form!: FormGroup;
  currentStep = signal(1);
  isEditMode = signal(false);
  employeeId = signal<number | null>(null);
  stepError = signal(false);
  siteValue = signal<string>('');

  readonly clientGroups = [
    { label: 'Airport',      type: 'airport',      clients: ['GMR', 'BIAL', 'IGI', 'CSIA', 'MAA'] },
    { label: 'Government',   type: 'government',   clients: ['TSGIRD'] },
    { label: 'Hospitality',  type: 'hospitality',  clients: ['NOVOTEL'] },
    { label: 'Education',    type: 'education',    clients: ['CBIT', 'MGIT'] },
  ];

  private readonly clientTypeMap: Record<string, string> = Object.fromEntries(
    this.clientGroups.flatMap(g => g.clients.map(c => [c, g.type]))
  );

  readonly clientType   = computed(() => this.clientTypeMap[this.siteValue()] ?? 'general');
  readonly isAirportSite = computed(() => this.clientType() === 'airport');
  readonly isGmrSite     = computed(() => this.siteValue() === 'GMR');

  readonly steps: WizardStep[] = [
    {
      id: 1,
      label: "Employee Info",
      icon: "👤",
      description: "Personal, family, career & legal details",
    },
    {
      id: 2,
      label: "Compliance & Work",
      icon: "🔐",
      description: "Compliance, documents & work details",
    },
  ];

  readonly totalSteps = this.steps.length;

  readonly progress = computed(() =>
    Math.round(((this.currentStep() - 1) / (this.totalSteps - 1)) * 100),
  );

  ngOnInit(): void {
    this.buildForm();
    this.form.get("workDetails.site")!.valueChanges.subscribe(v => this.siteValue.set(v ?? ''));
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.isEditMode.set(true);
      this.employeeId.set(+id);
      this.facade.loadEmployeeById(+id).subscribe((emp) => {
        this.patchForm(emp);
      });
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      idNo: ["", Validators.required],
      serialNumberAssigned: [""],
      phoneNo: ["", [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      isActive: [true],

      personalDetails: this.fb.group({
        name: ["", Validators.required],
        gender: ["Male", Validators.required],
        dateOfBirth: ["", Validators.required],
        bloodGroup: [""],
        maritalStatus: ["Single"],
        nationality: ["Indian", Validators.required],
        identificationMarks: [""],
        height: [null],
        weight: [null],
        chest: [null],
      }),

      familyDetails: this.fb.group({
        fathersName: ["", Validators.required], // nominee name
        motherName: [""],                        // nominee date of birth
        fatherPlaceOfBirth: [""],                // nominee age
        alternativeMobileNumber: [""],            // nominee contact number
        relation: [""],                          // relationship with employee
        wifeName: [""],                          // nominee address
      }),

      careerDetails: this.fb.group({
        dateOfInterview: [""],
        joiningDate: ["", Validators.required],
        reJoiningDate: [""],
        designation: [""],
        organisation: [""],
        natureOfEmployment: [""],
        reasonForLeaving: [""],
        presentAddress: [""],
        fromDate: [""],
        tillDate: [""],
        ageAtMatriculation: [""],
        schoolCollegeName: [""],
        stayingFrom: [""],
      }),

      addresses: this.fb.array([
        this.createAddressGroup("PERMANENT"),
        this.createAddressGroup("TEMPORARY"),
      ]),

      legalBackground: this.fb.group({
        everDetained: [false, Validators.required],
        everBoundDown: [false],
        everFined: [false, Validators.required],
        everConvicted: [false, Validators.required],
        anyCasePending: [false, Validators.required],
        everArrested: [false, Validators.required],
        everProsecuted: [false, Validators.required],
        dismissedOrRemoved: [false, Validators.required],
        dischargedFromTraining: [false],
        responsiblePersonsInfo: [""],
      }),

      complianceDetails: this.fb.group({
        pfNo: [""],
        pfStatus: ["Not Applied"],
        esicNo: [""],
        esicStatus: ["Not Applied"],
        ifscCode: [""],
        bankAccountNumber: [""],
        bankAccountStatus: ["Not Applied"],
        pan: [""],
        panStatus: ["Not Applied"],
        aadhar: [""],
        passportNumber: [""],
        passportValidFrom: [""],
        passportValidTo: [""],
        passportSubmitted: [""],
        aepApplicationStatus: ["Not Applied"],
        aepType: ["NA"],
        aepValidity: [""],
        aepNumber: [""],
        avsecValidFrom: [""],
        avsecValidTo: [""],
        avsecStatus: ["Not Applied"],
      }),

      workDetails: this.fb.group({
        site: [""],
        shift: [""],
        category: [""],
        designation: [""],
        organisation: [""],
        uniform: [""],
        shoes: [""],
        certificates: [""],
        documentGiven: [""],
        previousExperience: [""],
        brokerName: [""],
        hostelJoiningDate: ["Not Opted"],
        transport: ["Not Opted"],
        pvcStatus: ["Not Applied"],
        leaveFromDate: [""],
        leaveToDate: [""],
        noticeDate: [""],
        noticeReason: [""],
        exitDate: [""],
        exitStatus: ["NOT JOINED"],
        remarks: [""],
        fullFinalSettlement: [""],
      }),
    });
    this.workDetailsGroup = this.form.get("workDetails") as FormGroup;
  }

  createAddressGroup(type: "PERMANENT" | "TEMPORARY") {
    return this.fb.group({
      addressType: [type, Validators.required],
      line1: ["", Validators.required],
      district: [""],
      state: ["", Validators.required],
      pincode: ["", [Validators.required, Validators.pattern(/^[0-9]{5,6}$/)]],
    });
  }

  get addressesArray(): FormArray {
    return this.form.get("addresses") as FormArray;
  }

  workDetailsGroup!: FormGroup;

  patchForm(emp: any): void {
    this.form.patchValue({
      idNo: emp.idNo ?? "",
      serialNumberAssigned: emp.serialNumberAssigned ?? "",
      phoneNo: emp.phoneNo ?? "",
      isActive: emp.isActive ?? true,
    });

    if (emp.personalDetails) {
      this.form.get("personalDetails")!.patchValue({
        name: emp.personalDetails.name ?? "",
        gender: emp.personalDetails.gender ?? "Male",
        dateOfBirth: emp.personalDetails.dateOfBirth ?? "",
        bloodGroup: emp.personalDetails.bloodGroup ?? "",
        maritalStatus: emp.personalDetails.maritalStatus ?? "Single",
        nationality: emp.personalDetails.nationality ?? "Indian",
        identificationMarks: emp.personalDetails.identificationMarks ?? "",
        height: emp.personalDetails.height ?? null,
        weight: emp.personalDetails.weight ?? null,
        chest: emp.personalDetails.chest ?? null,
      });
    }

    if (emp.familyDetails) {
      this.form.get("familyDetails")!.patchValue({
        fathersName: emp.familyDetails.fathersName ?? "",
        motherName: emp.familyDetails.motherName ?? "",
        fatherPlaceOfBirth: emp.familyDetails.fatherPlaceOfBirth ?? "",
        alternativeMobileNumber: emp.familyDetails.alternativeMobileNumber ?? "",
        relation: emp.familyDetails.relation ?? "",
        wifeName: emp.familyDetails.wifeName ?? "",
      });
    }

    if (emp.careerDetails) {
      this.form.get("careerDetails")!.patchValue({
        dateOfInterview: emp.careerDetails.dateOfInterview ?? "",
        joiningDate: emp.careerDetails.joiningDate ?? "",
        reJoiningDate: emp.careerDetails.reJoiningDate ?? "",
        designation: emp.careerDetails.designation ?? "",
        organisation: emp.careerDetails.organisation ?? "",
        natureOfEmployment: emp.careerDetails.natureOfEmployment ?? "",
        reasonForLeaving: emp.careerDetails.reasonForLeaving ?? "",
        presentAddress: emp.careerDetails.presentAddress ?? "",
        fromDate: emp.careerDetails.fromDate ?? "",
        tillDate: emp.careerDetails.tillDate ?? "",
        ageAtMatriculation: emp.careerDetails.ageAtMatriculation ?? "",
        schoolCollegeName: emp.careerDetails.schoolCollegeName ?? "",
        stayingFrom: emp.careerDetails.stayingFrom ?? "",
      });
    }

    if (emp.legalBackground) {
      this.form.get("legalBackground")!.patchValue({
        everDetained: emp.legalBackground.everDetained ?? false,
        everBoundDown: emp.legalBackground.everBoundDown ?? false,
        everFined: emp.legalBackground.everFined ?? false,
        everConvicted: emp.legalBackground.everConvicted ?? false,
        anyCasePending: emp.legalBackground.anyCasePending ?? false,
        everArrested: emp.legalBackground.everArrested ?? false,
        everProsecuted: emp.legalBackground.everProsecuted ?? false,
        dismissedOrRemoved: emp.legalBackground.dismissedOrRemoved ?? false,
        dischargedFromTraining: emp.legalBackground.dischargedFromTraining ?? false,
        responsiblePersonsInfo: emp.legalBackground.responsiblePersonsInfo ?? "",
      });
    }

    if (emp.complianceDetails) {
      this.form.get("complianceDetails")!.patchValue({
        pfNo: emp.complianceDetails.pfNo ?? "",
        pfStatus: emp.complianceDetails.pfStatus ?? "Not Applied",
        esicNo: emp.complianceDetails.esicNo ?? "",
        esicStatus: emp.complianceDetails.esicStatus ?? "Not Applied",
        ifscCode: emp.complianceDetails.ifscCode ?? "",
        bankAccountNumber: emp.complianceDetails.bankAccountNumber ?? "",
        bankAccountStatus: emp.complianceDetails.bankAccountStatus ?? "Not Applied",
        pan: emp.complianceDetails.pan ?? "",
        panStatus: emp.complianceDetails.panStatus ?? "Not Applied",
        aadhar: emp.complianceDetails.aadhar ?? "",
        passportNumber: emp.complianceDetails.passportNumber ?? "",
        passportValidFrom: emp.complianceDetails.passportValidFrom ?? "",
        passportValidTo: emp.complianceDetails.passportValidTo ?? "",
        aepApplicationStatus: emp.complianceDetails.aepApplicationStatus ?? "Not Applied",
        aepType: emp.complianceDetails.aepType ?? "NA",
        aepValidity: emp.complianceDetails.aepValidity ?? "",
        aepNumber: emp.complianceDetails.aepNumber ?? "",
        avsecStatus: emp.complianceDetails.avsecStatus ?? "Not Applied",
        avsecValidFrom: emp.complianceDetails.avsecValidFrom ?? "",
        avsecValidTo: emp.complianceDetails.avsecValidTo ?? "",
      });
    }

    if (emp.workDetails) {
      this.form.get("workDetails")!.patchValue({
        site: emp.workDetails.site ?? "",
        shift: emp.workDetails.shift ?? "",
        category: emp.workDetails.category ?? "",
        designation: emp.workDetails.designation ?? "",
        organisation: emp.workDetails.organisation ?? "",
        uniform: emp.workDetails.uniform ?? "",
        shoes: emp.workDetails.shoes ?? "",
        certificates: emp.workDetails.certificates ?? "",
        documentGiven: emp.workDetails.documentGiven ?? "",
        previousExperience: emp.workDetails.previousExperience ?? "",
        brokerName: emp.workDetails.brokerName ?? "",
        hostelJoiningDate: emp.workDetails.hostelJoiningDate ?? "Not Opted",
        transport: emp.workDetails.transport ?? "Not Opted",
        pvcStatus: emp.workDetails.pvcStatus ?? "Not Applied",
        leaveFromDate: emp.workDetails.leaveFromDate ?? "",
        leaveToDate: emp.workDetails.leaveToDate ?? "",
        noticeDate: emp.workDetails.noticeDate ?? "",
        noticeReason: emp.workDetails.noticeReason ?? "",
        exitDate: emp.workDetails.exitDate ?? "",
        exitStatus: emp.workDetails.exitStatus ?? "NOT JOINED",
        remarks: emp.workDetails.remarks ?? "",
        fullFinalSettlement: emp.workDetails.fullFinalSettlement ?? "",
      });
      this.siteValue.set(emp.workDetails.site ?? '');
    }

    if (emp.addresses?.length) {
      const addr = emp.addresses.map((a: any) => ({
        ...a,
        addressType: (a.addressType ?? "").toUpperCase(),
      }));
      const perm = addr.find((a: any) => a.addressType === "PERMANENT") ?? addr[0];
      const temp = addr.find((a: any) => a.addressType === "TEMPORARY") ?? addr[1];
      if (perm) {
        this.addressesArray.at(0).patchValue({
          addressType: "PERMANENT",
          line1: perm.line1 ?? "",
          district: perm.district ?? "",
          state: perm.state ?? "",
          pincode: perm.pincode ?? "",
        });
      }
      if (temp) {
        this.addressesArray.at(1).patchValue({
          addressType: "TEMPORARY",
          line1: temp.line1 ?? "",
          district: temp.district ?? "",
          state: temp.state ?? "",
          pincode: temp.pincode ?? "",
        });
      }
    }
  }

  private readonly stepFieldMap: Record<number, string[]> = {
    1: ["idNo", "phoneNo", "personalDetails"],
    2: ["familyDetails", "careerDetails", "addresses", "legalBackground", "complianceDetails", "workDetails"],
  };

  private validateCurrentStep(): boolean {
    const keys = this.stepFieldMap[this.currentStep()] || [];
    let valid = true;

    for (const key of keys) {
      const ctrl = this.form.get(key);
      if (!ctrl) continue;
      ctrl.markAllAsTouched();
      if (ctrl.invalid) valid = false;
    }

    if (this.currentStep() === 1) {
      ["idNo", "phoneNo"].forEach((k) => this.form.get(k)?.markAsTouched());
      if (this.form.get("idNo")?.invalid || this.form.get("phoneNo")?.invalid)
        valid = false;
    }

    this.stepError.set(!valid);
    return valid;
  }

  nextStep(): void {
    if (!this.validateCurrentStep()) return;
    this.stepError.set(false);
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((s) => s + 1);
      window.scrollTo(0, 0);
    }
  }

  prevStep(): void {
    this.stepError.set(false);
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
      window.scrollTo(0, 0);
    }
  }

  goToStep(n: number): void {
    if (n > this.currentStep() && !this.validateCurrentStep()) return;
    this.stepError.set(false);
    this.currentStep.set(n);
    window.scrollTo(0, 0);
  }

  isStepDone(step: number): boolean {
    return step < this.currentStep();
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      const stepFieldMap: Record<number, string[]> = {
        1: ["idNo", "phoneNo", "personalDetails"],
        2: ["familyDetails", "careerDetails", "addresses", "legalBackground", "complianceDetails", "workDetails"],
      };
      for (let step = 1; step <= this.totalSteps; step++) {
        const keys = stepFieldMap[step] || [];
        const hasError = keys.some((key) => {
          const ctrl = this.form.get(key);
          return ctrl && ctrl.invalid;
        });
        if (hasError) {
          this.currentStep.set(step);
          window.scrollTo(0, 0);
          break;
        }
      }
      return;
    }

    const raw = this.form.getRawValue();

    const cleanDates = (obj: any): any => {
      if (!obj || typeof obj !== "object") return obj;
      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (
          typeof val === "string" &&
          val.trim() === "" &&
          (key.toLowerCase().includes("date") ||
            key.toLowerCase().includes("from") ||
            key.toLowerCase().includes("to") ||
            key.toLowerCase().includes("valid"))
        ) {
          cleaned[key] = null;
        } else if (
          typeof val === "object" &&
          val !== null &&
          !Array.isArray(val)
        ) {
          cleaned[key] = cleanDates(val);
        } else {
          cleaned[key] = val;
        }
      }
      return cleaned;
    };

    const payload = cleanDates(raw);

    if (this.isEditMode() && this.employeeId()) {
      this.facade.updateEmployee(this.employeeId()!, payload).subscribe({
        next: () => this.router.navigate(["/employees"]),
        error: () => {},
      });
    } else {
      this.facade.createEmployee(payload).subscribe({
        next: () => this.router.navigate(["/employees"]),
        error: () => {},
      });
    }
  }

  field(path: string) {
    return this.form.get(path);
  }

  fieldError(path: string): string | null {
    const c = this.field(path);
    if (!c || (!c.touched && !c.dirty) || !c.errors) return null;
    if (c.errors["required"]) return "This field is required";
    if (c.errors["email"]) return "Enter a valid email address";
    if (c.errors["pattern"] && path === "phoneNo")
      return "Phone number must be exactly 10 digits";
    if (c.errors["pattern"]) return "Invalid format";
    return "Invalid value";
  }

  readonly genderOptions = ["Male", "Female", "Other"];
  readonly maritalOptions = ["Single", "Married", "Divorced", "Widowed"];
  readonly bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  readonly boolOptions = [
    { label: "No", value: false },
    { label: "Yes", value: true },
  ];
  readonly statusOptions = ["Not Applied", "Applied", "Completed"];
  readonly designationOptions = [
    "LOADER",
    "SECURITY GUARD",
    "UTILITY STAFF",
    "SUPERVISOR",
    "MANAGER",
    "HOUSE KEEPING",
  ];
  readonly organisationOptions = ["VLG", "GMR", "BIAL", "CISF"];
  readonly siteOptions = this.clientGroups.flatMap(g => g.clients);
  readonly shiftOptions = ["A", "B", "C", "G", "N", "D"];
  readonly categoryOptions = ["A", "B", "C", "N"];
  readonly uniformOptions = [
    "JOCKET, SOCKS, GLOVES, ID CARD",
    "FULL UNIFORM",
    "PARTIAL",
  ];
  readonly shoesOptions = ["PROVIDED", "NOT PROVIDED", "OWN"];
  readonly certificateOptions = ["Submitted", "Not Submitted"];
  readonly documentOptions = ["ADHAR,PAN,BANK", "ADHAR,PAN", "ADHAR ONLY"];
  readonly exitStatusOptions = ["NOT JOINED", "RESIGNED", "TERMINATED", "RETIRED"];
  readonly transportOptions = ["Opted", "Not Opted"];
  readonly hostelOptions = ["Opted", "Not Opted"];
  readonly pvcStatusOptions = ["Not Applied", "Applied", "Completed"];
  readonly aepTypeOptions = ["TAEP", "BAEP", "NA"];
  readonly employmentOptions = [
    "LOADING/UNLOADING WORK",
    "SECURITY",
    "UTILITY",
    "CLEANING",
  ];
  readonly stateOptions = [
    "Andhra Pradesh",
    "Telangana",
    "Karnataka",
    "Tamil Nadu",
    "Maharashtra",
    "Delhi",
    "Uttar Pradesh",
    "West Bengal",
    "Bihar",
    "Rajasthan",
    "Gujarat",
    "Odisha",
    "Madhya Pradesh",
    "Assam",
    "Kerala",
    "Jharkhand",
    "Other",
  ];
}
