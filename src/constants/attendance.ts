import type { AttendanceStatus } from '../types/models';

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['P', 'A', 'WO', 'OT'];

/** Label, colours and keyboard shortcut for each attendance status, shared by all attendance screens. */
export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  { label: string; color: string; background: string; tagColor: string; shortcut: string }
> = {
  P: { label: 'Present', color: '#15803d', background: '#dcfce7', tagColor: 'success', shortcut: 'P' },
  A: { label: 'Absent', color: '#b91c1c', background: '#fee2e2', tagColor: 'error', shortcut: 'A' },
  WO: { label: 'Week Off', color: '#475569', background: '#e2e8f0', tagColor: 'default', shortcut: 'W' },
  OT: { label: 'Overtime', color: '#b45309', background: '#fef3c7', tagColor: 'warning', shortcut: 'O' },
};
