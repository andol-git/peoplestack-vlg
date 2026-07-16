import { http } from '../lib/http';
import type { AttendanceRecord } from '../types/models';

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
  upload(file: File, date: string, companyId: string) {
    const formData = new FormData();
    formData.append('file', file);
    return http
      .post<void>('/api/attendance/upload', formData, { params: { date, companyId } })
      .then((r) => r.data);
  },
};
