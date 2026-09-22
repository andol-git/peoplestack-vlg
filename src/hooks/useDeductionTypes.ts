import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deductionTypeApi } from '../api/deduction-type-api';

export function useDeductionTypesQuery(customerId: number | undefined) {
  const query = useQuery({
    queryKey: ['deduction-types', customerId],
    queryFn: () => deductionTypeApi.getAll(customerId as number),
    enabled: customerId !== undefined,
  });
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useCreateDeductionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, name }: { customerId: number; name: string }) =>
      deductionTypeApi.create(customerId, name),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['deduction-types', vars.customerId] }),
  });
}

export function useDeleteDeductionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; customerId: number }) => deductionTypeApi.delete(id),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['deduction-types', vars.customerId] }),
  });
}
