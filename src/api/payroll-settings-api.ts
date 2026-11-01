import { http } from '../lib/http';
import type { CustomerPayrollSettings } from '../types/models';

export type PayrollSettingsPayload = Omit<CustomerPayrollSettings, 'customerId'>;

export const payrollSettingsApi = {
  get(customerId: number) {
    return http
      .get<CustomerPayrollSettings>(`/api/customers/${customerId}/payroll-settings`)
      .then((r) => r.data);
  },
  save(customerId: number, payload: PayrollSettingsPayload) {
    return http
      .put<CustomerPayrollSettings>(`/api/customers/${customerId}/payroll-settings`, payload)
      .then((r) => r.data);
  },
};
