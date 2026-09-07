import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payrollApi, type PayrollPreviewFilters, type RunPayrollRequest } from '../api/payroll-api';

export function usePayrollPreviewQuery(filters: PayrollPreviewFilters | null) {
  return useQuery({
    queryKey: ['payroll-preview', filters],
    queryFn: () => payrollApi.preview(filters as PayrollPreviewFilters),
    enabled: !!filters,
  });
}

export function useRunPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RunPayrollRequest) => payrollApi.run(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['payroll-runs', vars.customerId] });
      qc.invalidateQueries({ queryKey: ['payroll-runs', undefined] });
    },
  });
}

export function usePayrollRunsQuery(customerId?: number) {
  const query = useQuery({
    queryKey: ['payroll-runs', customerId],
    queryFn: () => payrollApi.getRuns(customerId),
    enabled: customerId !== undefined,
  });
  return {
    ...query,
    data: query.data ?? [],
  };
}

// On-demand fetch of one run's full employee-level detail — used to build that
// run's CSV export without loading every run's lines up front.
export function useFetchPayrollRun() {
  return useMutation({
    mutationFn: (id: number) => payrollApi.getRun(id),
  });
}
