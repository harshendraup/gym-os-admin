import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type BusinessUser = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
}

export default function TrainersPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['business-admin-users', 'trainer'],
    queryFn: () => api.get<BusinessUser[]>('/business-admin/users', { role: 'trainer', page: 1, perPage: 200 }),
  })

  return (
    <div className="flex h-full flex-col">
      <Header title="Trainner" />
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Trainner</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-44 rounded-lg bg-muted animate-pulse" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data as BusinessUser[]).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell>{u.email ?? '—'}</TableCell>
                      <TableCell>{u.phone ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? 'success' : 'secondary'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
