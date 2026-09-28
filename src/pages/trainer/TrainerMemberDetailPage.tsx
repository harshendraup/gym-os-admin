import { useNavigate, useParams } from 'react-router-dom'
import { MemberProfileTabs } from '@/components/entity/MemberProfileTabs'
import { useTrainerMember } from '@/hooks/useTrainerMembers'
import { useDietAssignmentsForMember } from '@/hooks/useDietAssignments'

export default function TrainerMemberDetailPage() {
  const { memberId = '' } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { data: member, isLoading, isError } = useTrainerMember(memberId)
  const { data: dietAssignments = [] } = useDietAssignmentsForMember(memberId)

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />
  if (isError || !member) return <p className="text-sm text-destructive">Member not found or unavailable.</p>

  return (
    <MemberProfileTabs
      member={member}
      roleLabel="Assigned Member"
      onBack={() => navigate('/trainer/members')}
      trainerOptions={[]}
      currentTrainerName="You"
      dietAssignments={dietAssignments}
      dietTrainerName={() => 'You'}
      readOnly
      showInsights={false}
    />
  )
}