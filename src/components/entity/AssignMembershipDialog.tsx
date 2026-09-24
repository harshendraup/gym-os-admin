import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { useUpdateUser } from '@/hooks/useUsers'
import type { ManagedUser } from '@/api/user-management.api'
import type { MembershipRecord } from '@/api/memberships.api'

interface AssignMembershipDialogProps {
  open: boolean
  onClose: () => void
  member: ManagedUser
  /** Membership plans already narrowed to the member's own business + branch. */
  membershipOptions: MembershipRecord[]
}

/**
 * Assigns a membership plan to a member. Only active plans scoped to the
 * member's branch (or business-wide plans) are offered.
 */
export function AssignMembershipDialog({ open, onClose, member, membershipOptions }: AssignMembershipDialogProps) {
  const [membershipId, setMembershipId] = useState(member.membershipId ? String(member.membershipId) : '')
  const update = useUpdateUser(member.id)

  const onSubmit = () => {
    if (!membershipId) return
    update.mutate({ membershipId: Number(membershipId) }, { onSuccess: onClose })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Membership</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a membership plan for {member.fullName ?? member.firstName}.
          </p>
          <div className="space-y-1.5">
            <Label>Membership Plan</Label>
            <Select value={membershipId} onValueChange={setMembershipId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan..." />
              </SelectTrigger>
              <SelectContent>
                {membershipOptions.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No membership plans available yet.
                  </div>
                ) : (
                  membershipOptions.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.membershipName}
                      {plan.isLifetime ? ' — Lifetime' : ` — ${plan.durationValue} ${plan.durationUnit}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!membershipId || update.isPending}
          >
            {update.isPending ? 'Assigning...' : 'Assign Membership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
