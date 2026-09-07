import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeSalaryDetailsApi, type CreateEmployeeSalaryDetailRequest } from '../api/employee-salary-details-api';

export function useEmployeeSalaryDetailsQuery(customerId?: number) {
  const query = useQuery({
    queryKey: ['employee-salary-details', customerId],
    queryFn: () => employeeSalaryDetailsApi.getAll(customerId),
    enabled: customerId !== undefined,
  });
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useCreateEmployeeSalaryDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeSalaryDetailRequest) => employeeSalaryDetailsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-salary-details'] }),
  });
}

export function useUpdateEmployeeSalaryDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateEmployeeSalaryDetailRequest }) =>
      employeeSalaryDetailsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-salary-details'] }),
  });
}
