import { http } from '../lib/http';
import type { PayrollPreview, PayrollRunDetail, PayrollRunSummary } from '../types/models';

export interface PayrollPreviewFilters {
  customerId: number;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
}

export interface RunPayrollRequest {
  customerId: number;
  fromDate: string;
  toDate: string;
}

export const payrollApi = {
  preview(filters: PayrollPreviewFilters) {
    return http.get<PayrollPreview>('/api/payroll/preview', { params: filters }).then((r) => r.data);
  },
  run(payload: RunPayrollRequest) {
    return http.post<PayrollRunDetail>('/api/payroll/runs', payload).then((r) => r.data);
  },
  getRuns(customerId?: number) {
    return http
      .get<PayrollRunSummary[]>('/api/payroll/runs', customerId != null ? { params: { customerId } } : undefined)
      .then((r) => r.data);
  },
  getRun(id: number) {
    return http.get<PayrollRunDetail>(`/api/payroll/runs/${id}`).then((r) => r.data);
  },
};
