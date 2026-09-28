import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EntityListPage } from '@/components/entity/EntityListPage'
import { AssignTrainingProgramDialog } from '@/components/entity/AssignTrainingProgramDialog'
import { useTrainerMembers } from '@/hooks/useTrainerMembers'
import { useProgramAssignments, useDeleteProgramAssignment, useUpdateProgramAssignment } from '@/hooks/useProgramAssignments'
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms'
import type { ProgramAssignmentRecord, ProgramAssignmentStatus } from '@/api/program-assignments.api'

const statuses: ProgramAssignmentStatus[] = ['active', 'paused', 'completed', 'cancelled']

export default function TrainerTrainingPage() {
  const [assignOpen, setAssignOpen] = useState(false)
  const members = useTrainerMembers({ page: 1, perPage: 100 })
  const assignments = useProgramAssignments()
  const programs = useTrainingPrograms()
  const update = useUpdateProgramAssignment()
  const remove = useDeleteProgramAssignment()
  const memberRows = members.data?.data ?? []
  const programName = (id: number) => programs.data?.find((program) => String(program.id) === String(id))?.name ?? `#${id}`
  const memberName = (id: number) => memberRows.find((member) => String(member.id) === String(id))?.fullName ?? `#${id}`

  const columns: ColumnDef<ProgramAssignmentRecord>[] = [
    { header: 'Program', cell: ({ row }) => <span className="font-medium">{programName(row.original.trainingProgramId)}</span> },
    { header: 'Member', cell: ({ row }) => memberName(row.original.memberId) },
    { header: 'Start', cell: ({ row }) => row.original.startDate.slice(0, 10) },
    {
      header: 'Status',
      cell: ({ row }) => <Select value={row.original.status} onValueChange={(status) => update.mutate({ id: row.original.id, data: { status: status as ProgramAssignmentStatus } })}>
        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
        <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
      </Select>,
    },
    { id: 'actions', header: '', cell: ({ row }) => <Button size="sm" variant="destructive" onClick={() => remove.mutate(row.original.id)} disabled={remove.isPending}>Remove</Button> },
  ]

  return (
    <>
      <EntityListPage
        title="Workout Assignments"
        description="Programs assigned to members in your coaching roster."
        columns={columns}
        data={assignments.data}
        isLoading={assignments.isLoading || members.isLoading || programs.isLoading}
        isError={assignments.isError || members.isError || programs.isError}
        onRetry={() => { void assignments.refetch(); void members.refetch(); void programs.refetch() }}
        emptyMessage="No workout assignments yet."
        actions={<Button onClick={() => setAssignOpen(true)} disabled={memberRows.length === 0 || !programs.data?.length}><Plus className="mr-1.5 h-4 w-4" /> Assign Workout</Button>}
      />
      <AssignTrainingProgramDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        memberOptions={memberRows}
        trainerOptions={[]}
        programOptions={programs.data ?? []}
      />
    </>
  )
}