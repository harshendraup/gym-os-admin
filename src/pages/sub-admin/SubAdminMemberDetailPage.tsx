import { useNavigate, useParams } from 'react-router-dom'
import { MemberProfileTabs } from '@/components/entity/MemberProfileTabs'
import { useUser, useUpdateUser, useUsersByRole } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useDietAssignmentsForMember } from '@/hooks/useDietAssignments'

export default function SubAdminMemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading } = useUser(id!)
  const updateUser = useUpdateUser(id!)
  const { trainerRole } = useRoles()
  // Backend already scopes a sub-admin's /users list to their own branch,
  // so every trainer here is already in the same branch as this member.
  const { data: trainers = [] } = useUsersByRole(trainerRole?.id)
  const { data: diets = [] } = useDietAssignmentsForMember(id)
  const currentTrainer = trainers.find((t) => t.id === String(user?.trainerId))
  const trainerName = (trainerId: number | null) => {
    if (!trainerId) return 'Unassigned'
    const t = trainers.find((tr) => tr.id === String(trainerId))
    return t ? (t.fullName ?? t.firstName) : `#${trainerId}`
  }

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

  return (
    <MemberProfileTabs
      member={user}
      roleLabel="Member"
      onBack={() => navigate('/sub-admin/members')}
      onToggleStatus={() =>
        updateUser.mutate({ status: user.status === 'Active' ? 'Inactive' : 'Active' })
      }
      isTogglingStatus={updateUser.isPending}
      trainerOptions={trainers}
      currentTrainerName={currentTrainer?.fullName ?? currentTrainer?.firstName}
      dietAssignments={diets}
      dietTrainerName={trainerName}
    />
  )
}
