import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollSettingsApi, type PayrollSettingsPayload } from '../api/payroll-settings-api';

export function usePayrollSettingsQuery(customerId: number | undefined) {
  return useQuery({
    queryKey: ['payroll-settings', customerId],
    queryFn: () => payrollSettingsApi.get(customerId as number),
    enabled: customerId !== undefined,
    retry: false,
  });
}

export function useSavePayrollSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, ...payload }: { customerId: number } & PayrollSettingsPayload) =>
      payrollSettingsApi.save(customerId, payload),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['payroll-settings', vars.customerId] }),
  });
}
