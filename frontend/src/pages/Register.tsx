import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'

// Enhanced validation schema with comprehensive rules
const schema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email format'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be less than 32 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
    .refine((val) => !val.includes(' '), 'Username cannot contain spaces'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
})

type Form = z.infer<typeof schema>

// Password strength checker
const getPasswordStrength = (password: string) => {
  let score = 0
  let feedback = []

  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[@$!%*?&]/.test(password)) score++
  if (password.length >= 12) score++

  if (score < 3) return { strength: 'Weak', color: 'text-red-500', bgColor: 'bg-red-500/20' }
  if (score < 5) return { strength: 'Fair', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' }
  if (score < 6) return { strength: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-500/20' }
  return { strength: 'Strong', color: 'text-green-500', bgColor: 'bg-green-500/20' }
}

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isValid }, watch, trigger } = useForm<Form>({ 
    resolver: zodResolver(schema),
    mode: 'onChange' // Enable real-time validation
  })
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const watchedEmail = watch('email')
  const watchedUsername = watch('username')

  // Real-time email validation
  useEffect(() => {
    if (watchedEmail && watchedEmail.length > 5) {
      trigger('email')
    }
  }, [watchedEmail, trigger])

  // Real-time username validation
  useEffect(() => {
    if (watchedUsername && watchedUsername.length >= 3) {
      trigger('username')
    }
  }, [watchedUsername, trigger])

  // Real-time password validation
  useEffect(() => {
    if (password.length > 0) {
      trigger('password')
    }
  }, [password, trigger])

  // Check username availability (simulated - you can implement actual API call)
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return
    
    setIsCheckingUsername(true)
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 500))
      // For demo purposes, assume usernames starting with 'admin' are taken
      const available = !username.toLowerCase().startsWith('admin')
      setUsernameAvailable(available)
    } catch (error) {
      setUsernameAvailable(null)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  useEffect(() => {
    if (watchedUsername && watchedUsername.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(watchedUsername)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [watchedUsername])

  const onSubmit = async (data: Form) => {
    try {
      await api.post('/api/Auth/register', data, { 
        showSuccessToast: true, 
        successMessage: 'Account created successfully! Please sign in.' 
      } as any)
      nav('/login')
    } catch (error) {
      // Error handling is done by the API interceptor
    }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto py-6">
      <Card className="space-y-6">
        <h1 className="text-2xl font-semibold text-center">Create your account</h1>
        
        {/* Email Field */}
        <div className="space-y-2">
          <label className="label flex items-center justify-between">
            <span>Email</span>
            {watchedEmail && !errors.email && (
              <span className="text-green-500 text-xs">✓ Valid email</span>
            )}
          </label>
          <Input 
            type="email" 
            placeholder="Enter your email address" 
            {...register('email')} 
            className={watchedEmail && !errors.email ? 'border-green-500/50' : ''}
          />
          {errors.email && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <span>⚠</span> {errors.email.message}
            </p>
          )}
        </div>

        {/* Username Field */}
        <div className="space-y-2">
          <label className="label flex items-center justify-between">
            <span>Username</span>
            {watchedUsername && !errors.username && usernameAvailable === true && (
              <span className="text-green-500 text-xs">✓ Available</span>
            )}
            {watchedUsername && !errors.username && usernameAvailable === false && (
              <span className="text-red-500 text-xs">✗ Taken</span>
            )}
            {isCheckingUsername && (
              <span className="text-blue-500 text-xs">Checking...</span>
            )}
          </label>
          <Input 
            placeholder="Choose a unique username" 
            {...register('username')} 
            className={watchedUsername && !errors.username && usernameAvailable === true ? 'border-green-500/50' : ''}
          />
          {errors.username && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <span>⚠</span> {errors.username.message}
            </p>
          )}
          {watchedUsername && !errors.username && usernameAvailable === false && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <span>✗</span> This username is already taken
            </p>
          )}
          <p className="text-xs text-slate-400">
            Username can contain letters, numbers, hyphens, and underscores
          </p>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label className="label flex items-center justify-between">
            <span>Password</span>
            {password && (
              <span className={`text-xs ${passwordStrength.color}`}>
                {passwordStrength.strength}
              </span>
            )}
          </label>
          <div className="relative">
            <Input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password" 
              {...register('password')}
              onChange={(e) => setPassword(e.target.value)}
              className={password && !errors.password ? 'border-green-500/50' : ''}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      level <= (passwordStrength.strength === 'Weak' ? 1 : 
                               passwordStrength.strength === 'Fair' ? 2 : 
                               passwordStrength.strength === 'Good' ? 4 : 5)
                        ? passwordStrength.bgColor
                        : 'bg-slate-700/50'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs ${passwordStrength.color}`}>
                {passwordStrength.strength} password
              </p>
            </div>
          )}

          {errors.password && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <span>⚠</span> {errors.password.message}
            </p>
          )}
          
          <div className="text-xs text-slate-400 space-y-1">
            <p>Password must contain:</p>
            <ul className="space-y-1 ml-2">
              <li className={password.length >= 8 ? 'text-green-500' : 'text-slate-500'}>
                • At least 8 characters {password.length >= 8 ? '✓' : ''}
              </li>
              <li className={/[a-z]/.test(password) ? 'text-green-500' : 'text-slate-500'}>
                • One lowercase letter {/[a-z]/.test(password) ? '✓' : ''}
              </li>
              <li className={/[A-Z]/.test(password) ? 'text-green-500' : 'text-slate-500'}>
                • One uppercase letter {/[A-Z]/.test(password) ? '✓' : ''}
              </li>
              <li className={/\d/.test(password) ? 'text-green-500' : 'text-slate-500'}>
                • One number {/\d/.test(password) ? '✓' : ''}
              </li>
              <li className={/[@$!%*?&]/.test(password) ? 'text-green-500' : 'text-slate-500'}>
                • One special character (@$!%*?&) {/[@$!%*?&]/.test(password) ? '✓' : ''}
              </li>
            </ul>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isSubmitting || !isValid || usernameAvailable === false} 
          className="w-full"
        >
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </Button>

        {/* Form Status */}
        <div className="text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => nav('/login')}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </Card>
    </form>
  )
}
