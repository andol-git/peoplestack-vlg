import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/employee-api';
import type { Employee } from '../types/models';

export function useEmployeesQuery(active: boolean) {
  return useQuery({
    queryKey: ['employees', active ? 'active' : 'inactive'],
    queryFn: () => (active ? employeeApi.getAll() : employeeApi.getAllInactive()),
  });
}

export function useEmployeesByCustomer() {
  return useMutation({
    mutationFn: (customerId: number) => employeeApi.getAll(customerId),
  });
}

export function useEmployeeQuery(id: number | undefined) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getById(id as number),
    enabled: id !== undefined,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employee: Employee) => employeeApi.create(employee),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employee }: { id: number; employee: Employee }) => employeeApi.update(id, employee),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee', vars.id] });
    },
  });
}

export function useInactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeApi.inactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}
