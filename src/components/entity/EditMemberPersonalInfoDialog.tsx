import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useUpdateUser } from '@/hooks/useUsers'
import type { ManagedUser } from '@/api/user-management.api'
import { GENDERS } from '../constants'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().refine((value) => !value || value <= new Date().toISOString().slice(0, 10), 'Date of birth cannot be in the future').optional(),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  mobile: z.string().optional(),
  alternateMobile: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

/** Full Personal & Contact editor for a member profile — a superset of the generic EditUserDialog's 4 fields, scoped to member profiles only so the shared dialog (used for admins/trainers/sub-admins too) stays untouched. */
export function EditMemberPersonalInfoDialog({
  open, onClose, member,
}: {
  open: boolean
  onClose: () => void
  member: ManagedUser
}) {
  const update = useUpdateUser(member.id)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset({
        firstName: member.firstName,
        lastName: member.lastName ?? '',
        gender: member.gender ?? '',
        dateOfBirth: member.dateOfBirth?.slice(0, 10) ?? '',
        email: member.email ?? '',
        mobile: member.mobile ?? '',
        alternateMobile: member.alternateMobile ?? '',
        bloodGroup: member.bloodGroup ?? '',
        address: member.address ?? '',
        city: member.city ?? '',
        state: member.state ?? '',
        country: member.country ?? '',
        pincode: member.pincode ?? '',
        emergencyContactName: member.emergencyContactName ?? '',
        emergencyContactRelationship: member.emergencyContactRelationship ?? '',
        emergencyContactNumber: member.emergencyContactNumber ?? '',
      })
    }
  }, [open, member, reset])

  const gender = watch('gender')
  const bloodGroup = watch('bloodGroup')

  const onSubmit = (values: FormValues) => {
    update.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        gender: values.gender || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        email: values.email || undefined,
        mobile: values.mobile || undefined,
        alternateMobile: values.alternateMobile || undefined,
        bloodGroup: values.bloodGroup || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        country: values.country || undefined,
        pincode: values.pincode || undefined,
        emergencyContactName: values.emergencyContactName || undefined,
        emergencyContactRelationship: values.emergencyContactRelationship || undefined,
        emergencyContactNumber: values.emergencyContactNumber || undefined,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Personal & Contact — {member.fullName ?? member.firstName}</DialogTitle>
        </DialogHeader>
        <form className="flex-1 space-y-5 overflow-y-auto pr-1" onSubmit={handleSubmit(onSubmit)}>
          <Section title="Personal">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="First Name">
                <Input {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
              </Field>
              <Field label="Last Name"><Input {...register('lastName')} /></Field>
              <Field label="Gender">
                <Select value={gender || undefined} onValueChange={(v) => setValue('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Date of Birth"><Input type="date" {...register('dateOfBirth')} /></Field>
              <Field label="Blood Group">
                <Select value={bloodGroup || undefined} onValueChange={(v) => setValue('bloodGroup', v)}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Contact">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Email">
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </Field>
              <Field label="Mobile"><Input {...register('mobile')} /></Field>
              <Field label="Alternate Mobile"><Input {...register('alternateMobile')} /></Field>
            </div>
          </Section>

          <Section title="Address">
            <Field label="Address"><Input {...register('address')} /></Field>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="City"><Input {...register('city')} /></Field>
              <Field label="State"><Input {...register('state')} /></Field>
              <Field label="Country"><Input {...register('country')} /></Field>
              <Field label="Pincode"><Input {...register('pincode')} /></Field>
            </div>
          </Section>

          <Section title="Emergency Contact">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><Input {...register('emergencyContactName')} /></Field>
              <Field label="Relationship"><Input placeholder="Parent, spouse, friend" {...register('emergencyContactRelationship')} /></Field>
              <Field label="Number"><Input {...register('emergencyContactNumber')} /></Field>
            </div>
          </Section>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={update.isPending} onClick={handleSubmit(onSubmit)}>
            {update.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}
