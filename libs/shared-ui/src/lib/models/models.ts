export interface LoginRequest {
  username: string;
  password: string;
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type Gender = "Male" | "Female" | "Other";
export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";
export type AddressType = "PERMANENT" | "TEMPORARY";
export type ExitStatus = "NOT JOINED" | "RESIGNED" | "TERMINATED" | "RETIRED";
export type PfStatus = "Not Applied" | "Applied" | "Active";
export type AepStatus = "Not Applied" | "Applied" | "Active" | "Expired";

export interface PersonalDetails {
  name: string;
  gender: Gender;
  dateOfBirth: string;
  bloodGroup?: string;
  maritalStatus?: MaritalStatus;
  nationality: string;
  identificationMarks?: string;
  height?: number;
  weight?: number;
  chest?: number;
  wifeName?: string;
}
export interface FamilyDetails {
  fathersName: string;
  fathersOccupation?: string;
  motherName: string;
  fatherPlaceOfBirth?: string;
  alternativeMobileNumber?: string;
  relation?: string;
}
export interface CareerDetails {
  dateOfInterview?: string;
  joiningDate: string;
  reJoiningDate?: string;
  presentAddress?: string;
  fromDate?: string;
  tillDate?: string;
  ageAtMatriculation?: string;
  schoolCollegeName?: string;
  stayingFrom?: string;
  fullFinalSettlement?: string;
}
export interface LegalBackground {
  everDetained: boolean;
  everBoundDown: boolean;
  everFined: boolean;
  everConvicted: boolean;
  anyCasePending: boolean;
  dischargedFromTraining: boolean;
  dismissedOrRemoved: boolean;
  everArrested: boolean;
  everProsecuted: boolean;
  responsiblePersons?: string;
}
export interface Address {
  addressType: AddressType;
  line1: string;
  district?: string;
  state: string;
  pincode: string;
}
export interface ComplianceDetails {
  pfNo?: string;
  pfStatus?: PfStatus;
  esicNo?: string;
  esicStatus?: PfStatus;
  ifscCode?: string;
  bankAccountNumber?: string;
  bankAccountNumberStatus?: string;
  pan?: string;
  panStatus?: string;
  brokerName?: string;
  passportNumber?: string;
  passportValidFrom?: string;
  passportValidTo?: string;
  aepApplicationStatus?: AepStatus;
  aepType?: string[];
  aepValidity?: string;
  aepNumber?: string;
  aepValidFrom?: string;
  aepValidTo?: string;
  avsecStatus?: AepStatus;
  avsecValidFrom?: string;
  avsecValidTo?: string;
}
export interface AssignmentDetails {
  site?: string;
  shift?: string;
  category?: string;
  hostelJoiningDate?: string;
  transport?: string;
  designationPostOffered?: string;
  organisation?: string;
  natureOfEmployment?: string;
  reasonForLeaving?: string;
  pvcStatus?: string;
  certificates?: string;
  documentGiven?: string;
  previousExperience?: string;
  uniform?: string;
  shoes?: string;
  adhar?: string;
  passportSubmitted?: string[];
}
export interface ExitDetails {
  leaveFromDate?: string;
  leaveToDate?: string;
  noticeDate?: string;
  noticeReason?: string;
  exitDate?: string;
  exitStatus?: ExitStatus;
  remarks?: string;
}
export interface Employee {
  id?: number;
  idNo: string;
  serialNumberAssigned?: string;
  emailId: string;
  phoneNo: string;
  profileImageId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  personalDetails?: PersonalDetails;
  familyDetails?: FamilyDetails;
  careerDetails?: CareerDetails;
  legalBackground?: LegalBackground;
  complianceDetails?: ComplianceDetails;
  assignmentDetails?: AssignmentDetails;
  exitDetails?: ExitDetails;
  addresses?: Address[];
}
export interface Customer {
  id?: number;
  name: string;
  code?: string;
  site?: string;
  contactNumber?: string;
  isActive?: boolean;
  assignedStaffCount?: number;
}
export interface AttendanceLog {
  id?: number;
  employeeDeviceId: string;
  punchTime: string;
  punchType: "IN" | "OUT";
  verifyType?: string;
  deviceSerial?: string;
  site?: string;
  employeeName?: string;
}
export interface EmployeeState {
  employees: Employee[];
  inactiveEmployees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}
