import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, type AttendanceFilters } from '../api/attendance-api';
import type { BulkAttendanceEntry } from '../types/models';

export function useAttendanceQuery(filters: AttendanceFilters) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => attendanceApi.getAll(filters),
    enabled: !!filters.companyId,
  });
}

export function useUploadAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, date, companyId }: { file: File; date: string; companyId: string }) =>
      attendanceApi.upload(file, date, companyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-history'] });
    },
  });
}

export function useSaveBulkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      entries,
      idempotencyKey,
    }: {
      customerId: number;
      entries: BulkAttendanceEntry[];
      idempotencyKey: string;
    }) => attendanceApi.saveBulk(customerId, entries, idempotencyKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

export function useAttendanceLockedPeriodsQuery(customerId: number | undefined, fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ['attendance-locked-periods', customerId, fromDate, toDate],
    queryFn: () => attendanceApi.getLockedPeriods(customerId as number, fromDate, toDate),
    enabled: customerId !== undefined,
  });
}

export function useAttendanceHistoryQuery(companyId: string) {
  return useQuery({
    queryKey: ['attendance-history', companyId],
    queryFn: () => attendanceApi.getHistory(companyId),
    enabled: !!companyId,
  });
}
