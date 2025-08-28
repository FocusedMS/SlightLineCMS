import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../store/slices/authSlice'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import type { RootState } from '../store'

const schema = z.object({
  usernameOrEmail: z.string().min(3),
  password: z.string().min(6)
})
type Form = z.infer<typeof schema>

export default function Login() {
  const { register, handleSubmit, formState:{errors} } = useForm<Form>({ resolver: zodResolver(schema) })
  const nav = useNavigate()
  const dispatch = useDispatch()
  const loading = useSelector((s:RootState)=>s.auth.loading)

  const onSubmit = async (data: Form) => {
    try {
      await dispatch<any>(login(data)).unwrap()
      nav('/dashboard')
    } catch (e) {
      // stay on page; errors handled by interceptor/toasts if configured
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
      <Card className="space-y-4">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <div className="space-y-2">
          <label className="label">Username or Email</label>
          <Input placeholder="madhu@example.com" {...register('usernameOrEmail')} />
          {errors.usernameOrEmail && (
            <p className="text-red-500 text-sm">{errors.usernameOrEmail.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="label">Password</label>
          <Input type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" variant="primary" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="text-xs text-gray-500 mt-2">
          blogger: <code>madhu@example.com / Madhu@123</code>
          <br />
          admin: <code>admin / Admin@123</code>
        </div>
      </Card>
    </form>
  )
}
