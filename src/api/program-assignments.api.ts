import { get, post, put, del } from './client'

/**
 * The real `/program-assignments` resource (gym-os-api) — "assign this
 * training program to a member" (optionally with a trainer coaching
 * them), the exact structural equivalent of a diet plan. businessId/
 * branchId/endDate are all derived server-side (endDate from the
 * program's durationWeeks), never sent.
 */
export type ProgramAssignmentStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface ProgramAssignmentRecord {
  id: number
  businessId: number
  branchId: number
  trainingProgramId: number
  memberId: number
  trainerId: number | null
  assignedBy: number | null
  assignedByRole: 'superadmin' | 'admin' | 'sub_admin'
  startDate: string
  endDate: string | null
  status: ProgramAssignmentStatus
  assignedAt: string
  updatedAt: string
}

export interface CreateProgramAssignmentPayload {
  trainingProgramId: number
  memberId: number
  trainerId?: number
  startDate: string
  status?: ProgramAssignmentStatus
}

export interface UpdateProgramAssignmentPayload {
  trainerId?: number
  startDate?: string
  status?: ProgramAssignmentStatus
}

export interface AssignmentLogRecord {
  id: number
  programAssignmentId: number
  programDayId: number
  memberId: number
  completedDate: string
  status: 'completed' | 'skipped' | 'partial'
  actualSetsRepsJson: unknown
  memberNotes: string | null
  loggedAt: string
  updatedAt: string
}

export interface CreateAssignmentLogPayload {
  programDayId: number
  completedDate: string
  status: 'completed' | 'skipped' | 'partial'
  actualSetsRepsJson?: unknown
  memberNotes?: string
}

export const programAssignmentsApi = {
  list: () => get<ProgramAssignmentRecord[]>('/program-assignments'),

  get: (id: number) => get<ProgramAssignmentRecord>(`/program-assignments/${id}`),

  create: (data: CreateProgramAssignmentPayload) =>
    post<ProgramAssignmentRecord>('/program-assignments', data),

  update: (id: number, data: UpdateProgramAssignmentPayload) =>
    put<ProgramAssignmentRecord>(`/program-assignments/${id}`, data),

  delete: (id: number) => del<void>(`/program-assignments/${id}`),

  listLogs: (assignmentId: number) => get<AssignmentLogRecord[]>(`/program-assignments/${assignmentId}/logs`),

  createLog: (assignmentId: number, data: CreateAssignmentLogPayload) =>
    post<AssignmentLogRecord>(`/program-assignments/${assignmentId}/logs`, data),

  deleteLog: (assignmentId: number, logId: number) =>
    del<void>(`/program-assignments/${assignmentId}/logs/${logId}`),

  generateSchedule: (assignmentId: number) =>
    post<unknown>(`/program-assignments/${assignmentId}/generate-schedule`, {}),
}
