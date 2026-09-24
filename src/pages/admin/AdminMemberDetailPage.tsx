import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MemberProfileTabs } from '@/components/entity/MemberProfileTabs'
import { useUser, useUpdateUser, useUsersByRole } from '@/hooks/useUsers'
import { useBranches } from '@/hooks/useBranches'
import { useRoles } from '@/hooks/useRoles'
import { useDietAssignmentsForMember } from '@/hooks/useDietAssignments'
import { useAuthStore } from '@/store/auth.store'

export default function AdminMemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading } = useUser(id!)
  const updateUser = useUpdateUser(id!)
  const gymContext = useAuthStore((s) => s.gymContext)
  const { data: branches = [] } = useBranches(gymContext?.businessId)
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
    <div className="relative -m-6 flex h-[calc(100%+3rem)] flex-col overflow-hidden lg:-m-8 lg:h-[calc(100%+4rem)]">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "linear-gradient(rgba(248,250,252,0.70), rgba(248,250,252,0.80)), url('/images/ai-assistance.png')" }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex-1 overflow-auto p-6 lg:p-8">
        <MemberProfileTabs
          member={user}
          roleLabel="Member"
          branchLabel={branchName}
          onBack={() => navigate('/admin/members')}
          onToggleStatus={() =>
            updateUser.mutate({ status: user.status === 'Active' ? 'Inactive' : 'Active' })
          }
          isTogglingStatus={updateUser.isPending}
          trainerOptions={branchTrainers}
          currentTrainerName={currentTrainer?.fullName ?? currentTrainer?.firstName}
          dietAssignments={diets}
          dietTrainerName={trainerName}
        />
      </div>
    </div>
  )
}
