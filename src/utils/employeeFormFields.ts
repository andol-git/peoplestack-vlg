import type { KeyboardEvent } from 'react';
import dayjs from 'dayjs';

// Nested date fields that need dayjs <-> 'YYYY-MM-DD' string conversion around an antd Form.
export const CAREER_DATE_FIELDS = ['dateOfInterview', 'joiningDate', 'reJoiningDate', 'fromDate', 'tillDate'] as const;
export const COMPLIANCE_DATE_FIELDS = ['passportValidFrom', 'passportValidTo', 'aepDate', 'avsecValidFrom', 'avsecValidTo'] as const;
export const WORK_DATE_FIELDS = ['hostelJoiningDate', 'leaveFromDate', 'leaveToDate', 'noticeDate', 'exitDate'] as const;

export const LEGAL_BACKGROUND_FIELDS = [
  ['everDetained', 'Ever Detained'],
  ['everBoundDown', 'Ever Bound Down'],
  ['everFined', 'Ever Fined'],
  ['everConvicted', 'Ever Convicted'],
  ['anyCasePending', 'Any Case Pending'],
  ['everArrested', 'Ever Arrested'],
  ['everProsecuted', 'Ever Prosecuted'],
  ['dismissedOrRemoved', 'Dismissed or Removed'],
  ['dischargedFromTraining', 'Discharged from Training'],
  ['previousEmploymentUnderGovt', 'Previous Employment under Govt.'],
  ['undertakingOwnedByGovt', 'Undertaking Owned/Controlled by Govt.'],
] as const;

// The backend requires every Legal Background flag on every submission — default them so a
// brand-new form (where the switches haven't been touched) still submits valid boolean values.
export const LEGAL_BACKGROUND_DEFAULTS: Record<string, boolean> = {
  everDetained: false,
  everBoundDown: false,
  everFined: false,
  everConvicted: false,
  anyCasePending: false,
  everArrested: false,
  everProsecuted: false,
  dismissedOrRemoved: false,
  dischargedFromTraining: false,
  previousEmploymentUnderGovt: false,
  undertakingOwnedByGovt: false,
};

// Generic over T (rather than returning a loose Record<string, any>) so spreading the result
// alongside other typed objects doesn't make every property of the merged literal optional.
export function toDayjsFields<T extends Record<string, any> | undefined>(obj: T, fields: readonly string[]): T {
  if (!obj) return obj;
  const result: any = { ...obj };
  for (const f of fields) {
    if (result[f]) result[f] = dayjs(result[f]);
  }
  return result;
}

export function toStringFields<T extends Record<string, any> | undefined>(obj: T, fields: readonly string[]): T {
  if (!obj) return obj;
  const result: any = { ...obj };
  for (const f of fields) {
    if (result[f] && typeof result[f].format === 'function') result[f] = result[f].format('YYYY-MM-DD');
  }
  return result;
}

// Blocks any non-digit keystroke so phone-style fields can only ever contain digits.
export function blockNonDigits(e: KeyboardEvent<HTMLInputElement>) {
  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
    e.preventDefault();
  }
}
