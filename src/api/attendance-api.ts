import { http } from '../lib/http';
import type {
  AttendanceHistoryEntry,
  AttendanceLockedPeriod,
  AttendanceRecord,
  BulkAttendanceEntry,
  BulkAttendanceResponse,
} from '../types/models';

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
          ...(dateFrom ? { fromDate: dateFrom } : {}),
          ...(dateTo ? { toDate: dateTo } : {}),
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
  saveBulk(customerId: number, entries: BulkAttendanceEntry[], idempotencyKey: string) {
    return http
      .put<BulkAttendanceResponse>(
        '/api/attendance/bulk',
        { customerId, entries },
        { headers: { 'X-Idempotency-Key': idempotencyKey } }
      )
      .then((r) => r.data);
  },
  getLockedPeriods(customerId: number, fromDate: string, toDate: string) {
    return http
      .get<AttendanceLockedPeriod[]>('/api/attendance/locked-periods', { params: { customerId, fromDate, toDate } })
      .then((r) => r.data);
  },
  getHistory(companyId: string) {
    return http
      .get<AttendanceHistoryEntry[]>('/api/attendance/history', { params: { companyId } })
      .then((r) => r.data);
  },
};
