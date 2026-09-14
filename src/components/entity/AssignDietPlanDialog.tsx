import { useEffect, useMemo, useState } from 'react'
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
import { useCreateDietAssignment } from '@/hooks/useDietAssignments'
import type { ManagedUser } from '@/api/user-management.api'
import type { DietPlanRecord } from '@/api/diet-plans.api'

const schema = z.object({
  memberId: z.string().min(1, 'Select a member'),
  dietPlanId: z.string().min(1, 'Select a diet plan'),
  trainerId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  reviewDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface AssignDietPlanDialogProps {
  open: boolean
  onClose: () => void
  memberOptions: ManagedUser[]
  trainerOptions: ManagedUser[]
  planOptions: DietPlanRecord[]
  fixedMember?: ManagedUser
  /** Pre-selects and locks the plan (e.g. launched from a plan's own detail view). */
  fixedDietPlanId?: number
}

/**
 * Assigns an existing diet plan template to a member — the structural
 * equivalent of AssignTrainingProgramDialog. Plan/trainer pickers are
 * narrowed client-side to the selected member's branch (the real
 * enforcement is still server-side).
 */
export function AssignDietPlanDialog({
  open,
  onClose,
  memberOptions,
  trainerOptions,
  planOptions,
  fixedMember,
  fixedDietPlanId,
}: AssignDietPlanDialogProps) {
  const [memberId, setMemberId] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [dietPlanId, setDietPlanId] = useState('')
  const create = useCreateDietAssignment()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      const initialMemberId = fixedMember ? fixedMember.id : ''
      const initialPlanId = fixedDietPlanId ? String(fixedDietPlanId) : ''
      reset({
        memberId: initialMemberId,
        dietPlanId: initialPlanId,
        trainerId: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        reviewDate: '',
      })
      setMemberId(initialMemberId)
      setTrainerId('')
      setDietPlanId(initialPlanId)
    }
  }, [open, fixedMember, fixedDietPlanId, reset])

  const selectedMember = memberOptions.find((m) => m.id === memberId) ?? fixedMember
  const branchTrainers = useMemo(
    () => trainerOptions.filter((t) => t.branchId === selectedMember?.branchId),
    [trainerOptions, selectedMember?.branchId]
  )
  const branchPlans = useMemo(
    () => planOptions.filter((p) => (
      p.branchId === Number(selectedMember?.branchId)
      && p.status === 'Active'
      && p.memberId !== null
      && Number(p.memberId) === Number(selectedMember?.id)
    )),
    [planOptions, selectedMember?.branchId, selectedMember?.id]
  )

  const onSubmit = (values: FormValues) => {
    create.mutate(
      {
        memberId: Number(values.memberId),
        dietPlanId: Number(values.dietPlanId),
        trainerId: values.trainerId ? Number(values.trainerId) : undefined,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        reviewDate: values.reviewDate || undefined,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign a Diet Plan</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">
          Assign an approved, member-specific diet plan to the member's schedule.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!fixedMember && (
            <div className="space-y-1.5">
              <Label>Member</Label>
              <Select
                value={memberId}
                onValueChange={(v) => {
                  setMemberId(v)
                  setValue('memberId', v)
                  setTrainerId('')
                  setValue('trainerId', '')
                  if (!fixedDietPlanId) {
                    setDietPlanId('')
                    setValue('dietPlanId', '')
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {memberOptions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.fullName ?? m.firstName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.memberId && <p className="text-xs text-red-600">{errors.memberId.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Diet Plan</Label>
            {fixedDietPlanId ? (
              // A controlled Select whose value has no matching, mounted
              // SelectItem (the dropdown here is disabled and never opened)
              // gets "corrected" back to '' by Radix — so a locked plan is
              // shown as a plain static field instead of a disabled Select,
              // the same way the Member field is omitted entirely above
              // when `fixedMember` is set.
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-slate-700">
                {planOptions.find((p) => String(p.id) === String(fixedDietPlanId))?.name ?? `Plan #${fixedDietPlanId}`}
              </div>
            ) : (
              <Select
                value={dietPlanId}
                disabled={!selectedMember}
                onValueChange={(v) => { setDietPlanId(v); setValue('dietPlanId', v) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedMember ? 'Select a diet plan...' : 'Choose a member first'} />
                </SelectTrigger>
                <SelectContent>
                  {branchPlans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.dietPlanId && <p className="text-xs text-red-600">{errors.dietPlanId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Trainer (optional)</Label>
            <Select
              value={trainerId}
              onValueChange={(v) => { setTrainerId(v); setValue('trainerId', v) }}
              disabled={!selectedMember}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedMember ? 'Select a trainer...' : 'Choose a member first'} />
              </SelectTrigger>
              <SelectContent>
                {branchTrainers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.fullName ?? t.firstName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-red-600">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" {...register('endDate')} />
            </div>
            <div className="space-y-1.5">
              <Label>Review Date</Label>
              <Input type="date" {...register('reviewDate')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Assigning...' : 'Assign to Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
