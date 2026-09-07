import { http } from '../lib/http';
import type { AdvanceType } from '../types/models';

export const advanceTypeApi = {
  getAll(customerId: number) {
    return http.get<AdvanceType[]>('/api/advance-types', { params: { customerId } }).then((r) => r.data);
  },
  create(customerId: number, name: string) {
    return http.post<AdvanceType>('/api/advance-types', { customerId, name }).then((r) => r.data);
  },
  delete(id: number) {
    return http.delete<void>(`/api/advance-types/${id}`).then((r) => r.data);
  },
};
