import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/hooks/use-toast'

const schema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export default function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone } = (location.state as { phone: string }) ?? {}
  const [isLoading, setIsLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<{ otp: string }>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ otp }: { otp: string }) => {
    setIsLoading(true)
    try {
      const result = await authApi.verifyOtp({ phone, otp })
      setAuth(result.user, result.accessToken, result.refreshToken, result.gymContext)
      navigate('/dashboard')
    } catch {
      toast({ title: 'Invalid OTP', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Enter OTP</CardTitle>
          <CardDescription>We sent a 6-digit code to {phone}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>OTP Code</Label>
              <Input placeholder="123456" maxLength={6} className="text-center text-lg tracking-widest" {...register('otp')} />
              {errors.otp?.message && <p className="text-xs text-destructive">{errors.otp.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/auth/login')}>
              Back
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
