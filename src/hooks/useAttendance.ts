import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, type AttendanceFilters } from '../api/attendance-api';

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}
