import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(100)
})

type Form = z.infer<typeof schema>

export default function Register() {
  const { register, handleSubmit, formState:{errors, isSubmitting} } = useForm<Form>({ resolver: zodResolver(schema) })
  const nav = useNavigate()

  const onSubmit = async (data: Form) => {
    await api.post('/api/Auth/register', data, { showSuccessToast: true, successMessage: 'Registered. Please sign in.' } as any)
    nav('/login')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto py-6">
      <Card className="space-y-4">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <div className="space-y-2">
          <label className="label">Email</label>
          <Input type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && (<p className="text-red-500 text-sm">{errors.email.message}</p>)}
        </div>
        <div className="space-y-2">
          <label className="label">Username</label>
          <Input placeholder="yourname" {...register('username')} />
          {errors.username && (<p className="text-red-500 text-sm">{errors.username.message}</p>)}
        </div>
        <div className="space-y-2">
          <label className="label">Password</label>
          <Input type="password" placeholder="••••••••" {...register('password')} />
          {errors.password && (<p className="text-red-500 text-sm">{errors.password.message}</p>)}
        </div>
        <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </Button>
      </Card>
    </form>
  )
}
