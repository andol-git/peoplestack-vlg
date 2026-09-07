import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { advanceTypeApi } from '../api/advance-type-api';

export function useAdvanceTypesQuery(customerId: number | undefined) {
  const query = useQuery({
    queryKey: ['advance-types', customerId],
    queryFn: () => advanceTypeApi.getAll(customerId as number),
    enabled: customerId !== undefined,
  });
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useCreateAdvanceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, name }: { customerId: number; name: string }) =>
      advanceTypeApi.create(customerId, name),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['advance-types', vars.customerId] }),
  });
}

export function useDeleteAdvanceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; customerId: number }) => advanceTypeApi.delete(id),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['advance-types', vars.customerId] }),
  });
}
