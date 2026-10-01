import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { useUpdateDietAssignment } from '@/hooks/useDietAssignments'
import type { ManagedUser } from '@/api/user-management.api'
import type { DietAssignmentRecord, DietAssignmentStatus } from '@/api/diet-assignments.api'
import { DIET_ASSIGNMENT_STATUSES as STATUSES } from '../constants'

const schema = z.object({
  trainerId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  status: z.enum(['Draft', 'Active', 'Completed']),
})
type FormValues = z.infer<typeof schema>

interface EditDietAssignmentDialogProps {
  open: boolean
  onClose: () => void
  assignment: DietAssignmentRecord | null
  trainerOptions: ManagedUser[]
}

/** Reassign the trainer/dates/status on an existing assignment — the member and diet plan never change once assigned. */
export function EditDietAssignmentDialog({ open, onClose, assignment, trainerOptions }: EditDietAssignmentDialogProps) {
  const update = useUpdateDietAssignment()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })
  const trainerId = watch('trainerId')
  const status = watch('status')

  useEffect(() => {
    if (open && assignment) {
      reset({
        trainerId: assignment.trainerId ? String(assignment.trainerId) : '',
        startDate: assignment.startDate.slice(0, 10),
        endDate: assignment.endDate?.slice(0, 10) ?? '',
        status: assignment.status,
      })
    }
  }, [open, assignment, reset])

  const branchTrainers = useMemo(
    () => trainerOptions.filter((t) => t.branchId === assignment?.branchId),
    [trainerOptions, assignment?.branchId]
  )

  if (!assignment) return null

  const onSubmit = (values: FormValues) => {
    update.mutate(
      {
        id: assignment.id,
        data: {
          trainerId: values.trainerId ? Number(values.trainerId) : undefined,
          startDate: values.startDate,
          endDate: values.endDate || undefined,
          status: values.status,
        },
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Trainer (optional)</Label>
            <Select value={trainerId} onValueChange={(v) => setValue('trainerId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a trainer..." />
              </SelectTrigger>
              <SelectContent>
                {branchTrainers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.fullName ?? t.firstName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-red-600">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" {...register('endDate')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setValue('status', v as DietAssignmentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
