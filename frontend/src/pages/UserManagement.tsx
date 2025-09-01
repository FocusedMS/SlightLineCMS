import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Container } from '../components/layout/Container'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Helmet } from 'react-helmet-async'
import { toast } from '../lib/toast'

interface UserManagement {
  id: number
  username: string
  email: string
  role: string
  isActive: boolean
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  pendingPosts: number
  lastPostDate?: string
  createdAt: string
}

export default function UserManagement() {
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['user-management'],
    queryFn: async () => (await api.get('/api/UserManagement/users')).data
  })

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      return await api.put(`/api/UserManagement/users/${userId}/toggle-status`, { isActive })
    },
    onSuccess: (_, variables) => {
      toast.success(`User ${variables.isActive ? 'unlocked' : 'locked'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['user-management'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: () => {
      toast.error('Failed to update user status')
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await api.delete(`/api/UserManagement/users/${userId}`)
    },
    onSuccess: () => {
      toast.success('User account deactivated successfully')
      queryClient.invalidateQueries({ queryKey: ['user-management'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: () => {
      toast.error('Failed to deactivate user account')
    }
  })

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus })
  }

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to deactivate this user account? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId)
    }
  }

  if (isLoading) {
    return (
      <Container size="content">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </Container>
    )
  }

  return (
    <Container size="content">
      <Helmet>
        <title>User Management • Sightline</title>
        <meta name="description" content="Manage users, lock/unlock accounts, and view user activity" />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-200">User Management</h1>
            <p className="text-slate-400 mt-2">Manage user accounts and permissions</p>
          </div>
          <div className="text-sm text-slate-400">
            Total Users: {(users as UserManagement[])?.length || 0}
          </div>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-slate-200">{(users as UserManagement[])?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-green-400">
                  {(users as UserManagement[])?.filter(u => u.isActive).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Inactive Users</p>
                <p className="text-2xl font-bold text-red-400">
                  {(users as UserManagement[])?.filter(u => !u.isActive).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Admins</p>
                <p className="text-2xl font-bold text-purple-400">
                  {(users as UserManagement[])?.filter(u => u.role === 'Admin').length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            All Users
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400">User</th>
                  <th className="text-left py-3 px-4 text-slate-400">Role</th>
                  <th className="text-right py-3 px-4 text-slate-400">Posts</th>
                  <th className="text-right py-3 px-4 text-slate-400">Published</th>
                  <th className="text-right py-3 px-4 text-slate-400">Last Post</th>
                  <th className="text-center py-3 px-4 text-slate-400">Status</th>
                  <th className="text-center py-3 px-4 text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users as UserManagement[])?.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-slate-200 font-medium">{user.username}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                        <p className="text-xs text-slate-500">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">{user.totalPosts}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{user.publishedPosts}</td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {user.lastPostDate ? new Date(user.lastPostDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`w-2 h-2 rounded-full inline-block ${
                        user.isActive ? 'bg-green-400' : 'bg-red-400'
                      }`}></span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant={user.isActive ? "destructive" : "default"}
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          disabled={toggleUserStatusMutation.isPending}
                          className="text-xs"
                        >
                          {user.isActive ? 'Lock' : 'Unlock'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
                          className="text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Container>
  )
}
