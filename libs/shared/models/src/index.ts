// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  username: string;
  role: string;
}

// ─── Employee ────────────────────────────────────────────────────────────────

export interface PersonalDetails {
  id?: number;
  name: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string; // YYYY-MM-DD
  bloodGroup?: string;
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed";
  nationality: string;
  identificationMarks?: string;
  height?: number;
  weight?: number;
  chest?: number;
}

export interface FamilyDetails {
  id?: number;
  fathersName: string;       // nominee name
  motherName: string;        // nominee date of birth
  fatherPlaceOfBirth?: string; // nominee age
  alternativeMobileNumber?: string; // nominee contact number
  relation?: string;         // relationship with employee
  wifeName?: string;         // nominee address
}

export interface CareerDetails {
  id?: number;
  dateOfInterview?: string;
  joiningDate: string;
  reJoiningDate?: string | null;
  designation?: string;
  organisation?: string;
  natureOfEmployment?: string;
  reasonForLeaving?: string;
  presentAddress?: string;
  fromDate?: string;
  tillDate?: string;
  ageAtMatriculation?: string;
  schoolCollegeName?: string;
  stayingFrom?: string;
}

export interface LegalBackground {
  id?: number;
  everDetained: boolean;
  everBoundDown?: boolean;
  everFined: boolean;
  everConvicted: boolean;
  anyCasePending: boolean;
  everArrested: boolean;
  everProsecuted: boolean;
  dismissedOrRemoved: boolean;
  dischargedFromTraining?: boolean;
  responsiblePersonsInfo?: string;
}

export interface Address {
  id?: number;
  addressType: "PERMANENT" | "TEMPORARY";
  line1: string;
  district?: string;
  state: string;
  pincode: string;
}

export interface ComplianceDetails {
  id?: number;
  pfNo?: string;
  pfStatus?: "Applied" | "Completed" | "Not Applied";
  esicNo?: string;
  esicStatus?: "Applied" | "Completed" | "Not Applied";
  ifscCode?: string;
  bankAccountNumber?: string;
  bankAccountStatus?: "Applied" | "Completed" | "Not Applied";
  pan?: string;
  panStatus?: "Applied" | "Completed" | "Not Applied";
  aadhar?: string;
  passportNumber?: string;
  passportValidFrom?: string;
  passportValidTo?: string;
  passportSubmitted?: string;
  aepApplicationStatus?: "Applied" | "Completed" | "Not Applied";
  aepType?: string;
  aepValidity?: string;
  aepNumber?: string;
  aepValidFrom?: string;
  aepValidTo?: string;
  avsecValidFrom?: string;
  avsecValidTo?: string;
  avsecStatus?: "Applied" | "Completed" | "Not Applied";
}

export interface WorkDetails {
  id?: number;
  site?: string;
  shift?: string;
  category?: string;
  uniform?: string;
  shoes?: string;
  certificates?: string;
  documentGiven?: string;
  previousExperience?: string;
  brokerName?: string;
  hostelJoiningDate?: string;
  transport?: string;
  pvcStatus?: string;
  leaveFromDate?: string;
  leaveToDate?: string;
  noticeDate?: string;
  noticeReason?: string;
  exitDate?: string;
  exitStatus?: string;
  remarks?: string;
  fullFinalSettlement?: string;
}

export interface Employee {
  id?: number;
  idNo: string;
  serialNumberAssigned?: string;
  emailId: string;
  phoneNo: string;
  profileImageId?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  personalDetails?: PersonalDetails;
  familyDetails?: FamilyDetails;
  careerDetails?: CareerDetails;
  legalBackground?: LegalBackground;
  addresses?: Address[];
  complianceDetails?: ComplianceDetails;
  workDetails?: WorkDetails;
}

// ─── Customer ────────────────────────────────────────────────────────────────

export interface Customer {
  id?: number;
  name: string;
  code?: string;
  site?: string;
  contactNumber?: string;
  isActive?: boolean;
  assignedStaffCount?: number;
}

export interface StaffAssignment {
  id?: number;
  customerId: number;
  employeeId: number;
  assignedAt?: string;
}

// ─── UI / Pagination ─────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

// ─── App Config (White-Label) ─────────────────────────────────────────────────

export interface AppConfig {
  appName: string;
  appShortName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  apiBaseUrl: string;
  supportEmail: string;
  companyName: string;
}

// ─── User & Role ──────────────────────────────────────────────────────────────

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  phone?: string;
  isActive?: boolean;
  roles?: Role[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  roleIds?: number[];
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface AssignRoleRequest {
  roleId: number;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}
