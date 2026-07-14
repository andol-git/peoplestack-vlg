import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/user-api';
import type { AssignRoleRequest, CreateUserRequest, UpdateUserStatusRequest } from '../types/models';

export function useUsersQuery() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });
}

export function useUserQuery(id: number | undefined) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getById(id as number),
    enabled: id !== undefined,
  });
}

export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => userApi.getRoles(),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserRequest) => userApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserStatusRequest }) =>
      userApi.updateStatus(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', vars.id] });
    },
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AssignRoleRequest }) => userApi.assignRole(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', vars.id] });
    },
  });
}

export function useRemoveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleId }: { id: number; roleId: number }) => userApi.removeRole(id, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
