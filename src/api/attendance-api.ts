import { http } from '../lib/http';
import type { AttendanceRecord } from '../types/models';

// TODO: hardcoded until there's a companies endpoint or the logged-in user carries their own companyId.
export const DEFAULT_COMPANY_ID = 'CUST001';

export interface AttendanceFilters {
  companyId: string;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const attendanceApi = {
  getAll(filters: AttendanceFilters) {
    const { companyId, employeeId, dateFrom, dateTo } = filters;
    return http
      .get<AttendanceRecord[]>('/api/attendance', {
        params: {
          companyId,
          ...(employeeId ? { employeeId } : {}),
          ...(dateFrom ? { dateFrom } : {}),
          ...(dateTo ? { dateTo } : {}),
        },
      })
      .then((r) => r.data);
  },
  upload(file: File, date: string, companyId: string = DEFAULT_COMPANY_ID) {
    const formData = new FormData();
    formData.append('file', file);
    return http
      .post<void>('/api/attendance/upload', formData, { params: { date, companyId } })
      .then((r) => r.data);
  },
};
