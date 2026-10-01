import { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { useCreateMembership, useUpdateMembership } from '@/hooks/useMemberships'
import type {
  MembershipRecord, MembershipPayload, MembershipDurationUnit, MembershipDiscountType, MembershipStatus,
} from '@/api/memberships.api'
import type { BranchRecord } from '@/api/branches.api'
import { DURATION_UNITS, DISCOUNT_TYPES, MEMBERSHIP_STATUSES as STATUSES } from '../constants'

interface FormState {
  branchId: string
  membershipName: string
  membershipCode: string
  title: string
  subTitle: string
  description: string
  badgeLabel: string
  colorTag: string
  amount: string
  currency: string
  discountType: MembershipDiscountType | ''
  discountValue: string
  taxPercentage: string
  joiningFee: string
  renewalPrice: string
  durationValue: string
  durationUnit: MembershipDurationUnit
  isLifetime: boolean
  attendanceLimit: string
  maxFreezeDays: string
  personalTrainingSessions: string
  guestPasses: string
  maxMembersPerPlan: string
  isTrial: boolean
  groupClasses: boolean
  dietPlan: boolean
  lockerAccess: boolean
  workoutAccess: boolean
  isFeatured: boolean
  isVisibleOnApp: boolean
  sortOrder: string
  status: MembershipStatus
}

function emptyForm(): FormState {
  return {
    branchId: '',
    membershipName: '',
    membershipCode: '',
    title: '',
    subTitle: '',
    description: '',
    badgeLabel: '',
    colorTag: '',
    amount: '',
    currency: 'INR',
    discountType: '',
    discountValue: '',
    taxPercentage: '',
    joiningFee: '',
    renewalPrice: '',
    durationValue: '1',
    durationUnit: 'months',
    isLifetime: false,
    attendanceLimit: '',
    maxFreezeDays: '',
    personalTrainingSessions: '',
    guestPasses: '',
    maxMembersPerPlan: '',
    isTrial: false,
    groupClasses: false,
    dietPlan: false,
    lockerAccess: false,
    workoutAccess: false,
    isFeatured: false,
    isVisibleOnApp: true,
    sortOrder: '',
    status: 'draft',
  }
}

function fromRecord(m: MembershipRecord): FormState {
  return {
    branchId: m.branchId ? String(m.branchId) : '',
    membershipName: m.membershipName,
    membershipCode: m.membershipCode,
    title: m.title,
    subTitle: m.subTitle ?? '',
    description: m.description ?? '',
    badgeLabel: m.badgeLabel ?? '',
    colorTag: m.colorTag ?? '',
    amount: String(m.amount),
    currency: m.currency,
    discountType: m.discountType ?? '',
    discountValue: m.discountValue ?? '',
    taxPercentage: m.taxPercentage ?? '',
    joiningFee: m.joiningFee ?? '',
    renewalPrice: m.renewalPrice ?? '',
    durationValue: String(m.durationValue),
    durationUnit: m.durationUnit,
    isLifetime: m.isLifetime,
    attendanceLimit: m.attendanceLimit != null ? String(m.attendanceLimit) : '',
    maxFreezeDays: m.maxFreezeDays != null ? String(m.maxFreezeDays) : '',
    personalTrainingSessions: m.personalTrainingSessions != null ? String(m.personalTrainingSessions) : '',
    guestPasses: m.guestPasses != null ? String(m.guestPasses) : '',
    maxMembersPerPlan: m.maxMembersPerPlan != null ? String(m.maxMembersPerPlan) : '',
    isTrial: m.isTrial,
    groupClasses: m.groupClasses,
    dietPlan: m.dietPlan,
    lockerAccess: m.lockerAccess,
    workoutAccess: m.workoutAccess,
    isFeatured: m.isFeatured,
    isVisibleOnApp: m.isVisibleOnApp,
    sortOrder: m.sortOrder != null ? String(m.sortOrder) : '',
    status: m.status,
  }
}

function computeFinalAmount(amount: string, discountType: MembershipDiscountType | '', discountValue: string): number | null {
  const amountNum = Number(amount)
  if (!amount || Number.isNaN(amountNum)) return null
  if (!discountType || !discountValue) return amountNum
  const discountNum = Number(discountValue)
  if (Number.isNaN(discountNum)) return amountNum
  const discounted = discountType === 'flat' ? amountNum - discountNum : amountNum - (amountNum * discountNum) / 100
  return Math.max(0, Math.round(discounted * 100) / 100)
}

interface MembershipFormDialogProps {
  open: boolean
  onClose: () => void
  membership?: MembershipRecord | null
  /** Admin: pick one of the business's branches, or leave blank for a business-wide plan. Omit for Sub-Admin. */
  branchOptions?: BranchRecord[]
  /** Sub-Admin: branch is fixed and not shown as a picker. */
  fixedBranchId?: number
}

export function MembershipFormDialog({ open, onClose, membership, branchOptions, fixedBranchId }: MembershipFormDialogProps) {
  const create = useCreateMembership()
  const update = useUpdateMembership()
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState('')

  const isEdit = !!membership

  useEffect(() => {
    if (open) {
      setForm(membership ? fromRecord(membership) : emptyForm())
      setError('')
    }
  }, [open, membership])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const finalAmount = computeFinalAmount(form.amount, form.discountType, form.discountValue)

  const onSubmit = () => {
    setError('')
    if (!form.membershipName.trim()) return setError('Internal name is required')
    if (!form.membershipCode.trim()) return setError('Plan code is required')
    if (!form.title.trim()) return setError('Card title is required')
    if (!form.amount || Number(form.amount) < 0) return setError('Amount is required')
    if (!form.isLifetime && (!form.durationValue || Number(form.durationValue) < 1)) return setError('Duration is required')

    const payload: MembershipPayload = {
      branchId: fixedBranchId ?? (form.branchId ? Number(form.branchId) : undefined),
      membershipName: form.membershipName.trim(),
      membershipCode: form.membershipCode.trim(),
      title: form.title.trim(),
      subTitle: form.subTitle || undefined,
      description: form.description || undefined,
      badgeLabel: form.badgeLabel || undefined,
      colorTag: form.colorTag || undefined,
      amount: Number(form.amount),
      currency: form.currency || undefined,
      discountType: form.discountType || undefined,
      discountValue: form.discountValue ? Number(form.discountValue) : undefined,
      taxPercentage: form.taxPercentage ? Number(form.taxPercentage) : undefined,
      joiningFee: form.joiningFee ? Number(form.joiningFee) : undefined,
      renewalPrice: form.renewalPrice ? Number(form.renewalPrice) : undefined,
      durationValue: Number(form.durationValue) || 1,
      durationUnit: form.durationUnit,
      isLifetime: form.isLifetime,
      attendanceLimit: form.attendanceLimit ? Number(form.attendanceLimit) : undefined,
      maxFreezeDays: form.maxFreezeDays ? Number(form.maxFreezeDays) : undefined,
      personalTrainingSessions: form.personalTrainingSessions ? Number(form.personalTrainingSessions) : undefined,
      guestPasses: form.guestPasses ? Number(form.guestPasses) : undefined,
      maxMembersPerPlan: form.maxMembersPerPlan ? Number(form.maxMembersPerPlan) : undefined,
      isTrial: form.isTrial,
      groupClasses: form.groupClasses,
      dietPlan: form.dietPlan,
      lockerAccess: form.lockerAccess,
      workoutAccess: form.workoutAccess,
      isFeatured: form.isFeatured,
      isVisibleOnApp: form.isVisibleOnApp,
      sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined,
      status: form.status,
    }

    if (isEdit && membership) {
      update.mutate({ id: membership.id, data: payload }, { onSuccess: onClose })
    } else {
      create.mutate(payload, { onSuccess: onClose })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Membership Plan' : 'Create Membership Plan'}</DialogTitle>
        </DialogHeader>
        <p className="-mt-1 text-sm text-muted-foreground">
          Membership plans are what members actually sign up for — set the price, duration, and perks members get on this plan.
        </p>

        <div className="space-y-6">
          {!!branchOptions && (
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select value={form.branchId || 'all'} onValueChange={(v) => set('branchId', v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches (business-wide)</SelectItem>
                  {branchOptions.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.branchName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Card Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Internal Name</Label>
                  <Input placeholder="GOLD-ANNUAL-2026" value={form.membershipName} onChange={(e) => set('membershipName', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Plan Code</Label>
                  <Input placeholder="GOLD-ANNUAL" value={form.membershipCode} onChange={(e) => set('membershipCode', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Card Title</Label>
                  <Input placeholder="Gold Annual" value={form.title} onChange={(e) => set('title', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Card Subtitle</Label>
                  <Input placeholder="Best value for committed members" value={form.subTitle} onChange={(e) => set('subTitle', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea placeholder="What this plan includes..." value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Badge (optional)</Label>
                  <Input placeholder="Most Popular" value={form.badgeLabel} onChange={(e) => set('badgeLabel', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Card Color (optional)</Label>
                  <Input placeholder="gold" value={form.colorTag} onChange={(e) => set('colorTag', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Pricing</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input type="number" placeholder="12000" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input placeholder="INR" value={form.currency} onChange={(e) => set('currency', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tax %</Label>
                  <Input type="number" placeholder="18" value={form.taxPercentage} onChange={(e) => set('taxPercentage', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Discount Type</Label>
                  <Select value={form.discountType || 'none'} onValueChange={(v) => set('discountType', v === 'none' ? '' : (v as MembershipDiscountType))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No discount</SelectItem>
                      {DISCOUNT_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    placeholder={form.discountType === 'percentage' ? '10 (%)' : '2000'}
                    value={form.discountValue}
                    onChange={(e) => set('discountValue', e.target.value)}
                    disabled={!form.discountType}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Joining Fee (optional)</Label>
                  <Input type="number" placeholder="500" value={form.joiningFee} onChange={(e) => set('joiningFee', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Renewal Price (optional)</Label>
                  <Input type="number" placeholder="10000" value={form.renewalPrice} onChange={(e) => set('renewalPrice', e.target.value)} />
                </div>
              </div>
              {finalAmount !== null && (
                <p className="rounded-md bg-primary/5 px-3 py-2 text-sm">
                  Member pays <span className="font-semibold text-primary">{form.currency || 'INR'} {finalAmount}</span> after discount, before tax.
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Duration</h3>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input type="number" value={form.durationValue} onChange={(e) => set('durationValue', e.target.value)} disabled={form.isLifetime} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form.durationUnit} onValueChange={(v) => set('durationUnit', v as MembershipDurationUnit)} disabled={form.isLifetime}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATION_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-1.5 pb-2.5 text-sm">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-input" checked={form.isLifetime} onChange={(e) => set('isLifetime', e.target.checked)} />
                Lifetime plan
              </label>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Limits &amp; Perks</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Attendance Limit</Label>
                  <Input type="number" placeholder="Unlimited" value={form.attendanceLimit} onChange={(e) => set('attendanceLimit', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Freeze Days</Label>
                  <Input type="number" placeholder="0" value={form.maxFreezeDays} onChange={(e) => set('maxFreezeDays', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">PT Sessions</Label>
                  <Input type="number" placeholder="0" value={form.personalTrainingSessions} onChange={(e) => set('personalTrainingSessions', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Guest Passes</Label>
                  <Input type="number" placeholder="0" value={form.guestPasses} onChange={(e) => set('guestPasses', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5 w-1/2 pr-1.5">
                <Label className="text-xs">Max Members on Plan (family/couple)</Label>
                <Input type="number" placeholder="1" value={form.maxMembersPerPlan} onChange={(e) => set('maxMembersPerPlan', e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {([
                  ['isTrial', 'Trial plan'],
                  ['groupClasses', 'Group classes'],
                  ['dietPlan', 'Diet plan'],
                  ['lockerAccess', 'Locker access'],
                  ['workoutAccess', 'Workout access'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-1.5">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-input" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Visibility</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-input" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
                  Highlight this card
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-input" checked={form.isVisibleOnApp} onChange={(e) => set('isVisibleOnApp', e.target.checked)} />
                  Visible to members
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => set('status', v as MembershipStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sort Order</Label>
                  <Input type="number" placeholder="0" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={onSubmit} disabled={isPending}>
            {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
