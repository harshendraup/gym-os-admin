import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MemberProfileTabs } from '@/components/entity/MemberProfileTabs'
import { useUser, useUpdateUser, useUsersByRole } from '@/hooks/useUsers'
import { useBranches } from '@/hooks/useBranches'
import { useRoles } from '@/hooks/useRoles'
import { useDietAssignmentsForMember } from '@/hooks/useDietAssignments'

export default function SuperAdminMemberDetailPage() {
  const { branchId, id } = useParams<{ branchId?: string; id: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading } = useUser(id!)
  const updateUser = useUpdateUser(id!)

  const { data: branches = [] } = useBranches()
  const { trainerRole } = useRoles()
  const { data: trainers = [] } = useUsersByRole(trainerRole?.id)
  const { data: diets = [] } = useDietAssignmentsForMember(id)

  // A trainer can only be assigned within the member's own branch — narrow
  // the picker up front so the request can never fail on a mismatch.
  const branchTrainers = useMemo(
    () => trainers.filter((t) => t.branchId === user?.branchId),
    [trainers, user?.branchId]
  )
  const currentTrainer = trainers.find((t) => t.id === String(user?.trainerId))
  const trainerName = (trainerId: number | null) => {
    if (!trainerId) return 'Unassigned'
    const t = trainers.find((tr) => tr.id === String(trainerId))
    return t ? (t.fullName ?? t.firstName) : `#${trainerId}`
  }

  // Reachable both from the branch drill-down (Businesses → Branches → View
  // Members) and from the flat Members sidebar page — go back to whichever
  // one linked here.
  const backTo = branchId ? `/superadmin/branches/${branchId}/members` : '/superadmin/members'

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Member not found.</p>
      </div>
    )
  }

  const branchName = branches.find((b) => b.id === user.branchId)?.branchName

  return (
    <MemberProfileTabs
      member={user}
      roleLabel="Member"
      branchLabel={branchName}
      onBack={() => navigate(backTo)}
      onToggleStatus={() =>
        updateUser.mutate({ status: user.status === 'Active' ? 'Inactive' : 'Active' })
      }
      isTogglingStatus={updateUser.isPending}
      trainerOptions={branchTrainers}
      currentTrainerName={currentTrainer?.fullName ?? currentTrainer?.firstName}
      dietAssignments={diets}
      dietTrainerName={trainerName}
    />
  )
}
