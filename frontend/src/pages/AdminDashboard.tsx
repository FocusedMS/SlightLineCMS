import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Container } from '../components/layout/Container'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { Helmet } from 'react-helmet-async'

interface DashboardMetrics {
  posts: {
    total: number
    last24Hours: number
    last7Days: number
    last30Days: number
    published: number
    draft: number
    pendingReview: number
  }
  users: {
    total: number
    last24Hours: number
    last7Days: number
    last30Days: number
    active: number
    inactive: number
  }
  categories: {
    total: number
    withPosts: number
  }
  recentPosts: Array<{
    id: number
    title: string
    author: string
    category: string
    status: string
    createdAt: string
  }>
  recentUsers: Array<{
    id: number
    username: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
  }>
}

interface CategoryStats {
  categoryId: number
  categoryName: string
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  pendingPosts: number
  lastPostDate?: string
}

interface UserActivity {
  userId: number
  username: string
  email: string
  role: string
  isActive: boolean
  totalPosts: number
  publishedPosts: number
  lastPostDate?: string
  createdAt: string
}

export default function AdminDashboard() {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/api/Analytics/dashboard')).data
  })

  const { data: categoryStats, isLoading: categoryLoading } = useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => (await api.get('/api/Analytics/category-stats')).data
  })

  const { data: userActivity, isLoading: userLoading } = useQuery({
    queryKey: ['user-activity'],
    queryFn: async () => (await api.get('/api/Analytics/user-activity')).data
  })

  if (dashboardLoading) {
    return (
      <Container size="xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Container>
    )
  }

  const metrics = dashboardData as DashboardMetrics

  return (
    <Container size="xl">
      <Helmet>
        <title>Admin Dashboard • Sightline</title>
        <meta name="description" content="Admin dashboard with comprehensive metrics and user management" />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-200">Admin Dashboard</h1>
            <p className="text-slate-400 mt-2">Comprehensive metrics and user management</p>
          </div>
          <div className="text-sm text-slate-400">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Posts Metrics */}
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Posts</p>
                <p className="text-2xl font-bold text-slate-200">{metrics.posts.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Last 24h</span>
                <span className="text-slate-200">{metrics.posts.last24Hours}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Last 7 days</span>
                <span className="text-slate-200">{metrics.posts.last7Days}</span>
              </div>
            </div>
          </Card>

          {/* Users Metrics */}
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-slate-200">{metrics.users.total}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Active</span>
                <span className="text-green-400">{metrics.users.active}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Inactive</span>
                <span className="text-red-400">{metrics.users.inactive}</span>
              </div>
            </div>
          </Card>

          {/* Categories Metrics */}
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-slate-200">{metrics.categories.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">With Posts</span>
                <span className="text-slate-200">{metrics.categories.withPosts}</span>
              </div>
            </div>
          </Card>

          {/* Post Status Metrics */}
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Published</p>
                <p className="text-2xl font-bold text-emerald-400">{metrics.posts.published}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Draft</span>
                <span className="text-amber-400">{metrics.posts.draft}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Pending</span>
                <span className="text-blue-400">{metrics.posts.pendingReview}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Posts */}
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recent Posts
            </h3>
            <div className="space-y-3">
              {metrics.recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium break-words overflow-hidden text-ellipsis line-clamp-2" title={post.title}>{post.title}</p>
                    <p className="text-sm text-slate-400">by {post.author} • {post.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      post.status === 'Published' ? 'bg-emerald-500/20 text-emerald-400' :
                      post.status === 'Draft' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {post.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Users */}
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Recent Users
            </h3>
            <div className="space-y-3">
              {metrics.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium break-words overflow-hidden text-ellipsis" title={user.username}>{user.username}</p>
                    <p className="text-sm text-slate-400 break-words overflow-hidden text-ellipsis" title={user.email}>{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      user.isActive ? 'bg-green-400' : 'bg-red-400'
                    }`}></span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Category Statistics */}
        {categoryLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Category Statistics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Category</th>
                    <th className="text-right py-3 px-4 text-slate-400">Total</th>
                    <th className="text-right py-3 px-4 text-slate-400">Published</th>
                    <th className="text-right py-3 px-4 text-slate-400">Draft</th>
                    <th className="text-right py-3 px-4 text-slate-400">Pending</th>
                    <th className="text-right py-3 px-4 text-slate-400">Last Post</th>
                  </tr>
                </thead>
                <tbody>
                  {(categoryStats as CategoryStats[])?.map((category) => (
                    <tr key={category.categoryId} className="border-b border-slate-800/50">
                      <td className="py-3 px-4 text-slate-200 font-medium">{category.categoryName}</td>
                      <td className="py-3 px-4 text-right text-slate-200">{category.totalPosts}</td>
                      <td className="py-3 px-4 text-right text-emerald-400">{category.publishedPosts}</td>
                      <td className="py-3 px-4 text-right text-amber-400">{category.draftPosts}</td>
                      <td className="py-3 px-4 text-right text-blue-400">{category.pendingPosts}</td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {category.lastPostDate ? new Date(category.lastPostDate).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* User Activity */}
        {userLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              User Activity
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
                  </tr>
                </thead>
                <tbody>
                  {(userActivity as UserActivity[])?.slice(0, 10).map((user) => (
                    <tr key={user.userId} className="border-b border-slate-800/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-slate-200 font-medium">{user.username}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Container>
  )
}
