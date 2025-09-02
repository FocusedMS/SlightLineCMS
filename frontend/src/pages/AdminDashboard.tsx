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

interface RecentUserPosts {
  userId: number
  username: string
  role: string
  postsLast7Days: number
  publishedLast7Days: number
  draftLast7Days: number
  pendingLast7Days: number
}

export default function AdminDashboard() {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get('/api/Analytics/dashboard')).data,
    retry: 0,
  })

  const { data: categoryStats, isLoading: categoryLoading } = useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => (await api.get('/api/Analytics/category-stats')).data,
    retry: 0,
  })

  const { data: userActivity, isLoading: userLoading } = useQuery({
    queryKey: ['user-activity'],
    queryFn: async () => (await api.get('/api/Analytics/user-activity')).data,
    retry: 0,
  })

  const { data: recentUserPosts, isLoading: recentPostsLoading } = useQuery({
    queryKey: ['recent-user-posts'],
    queryFn: async () => (await api.get('/api/Analytics/recent-user-posts')).data as RecentUserPosts[],
    retry: 0,
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

  // If the analytics endpoint is missing or returned an error, avoid crashing.
  if (!dashboardData) {
    return (
      <Container size="xl">
        <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-200 mb-2">Admin analytics unavailable</h2>
          <p className="text-slate-400">We couldn't load admin dashboard metrics. Other admin pages should still work.</p>
        </Card>
      </Container>
    )
  }

  const metrics = dashboardData as DashboardMetrics

  return (
    <Container size="full">
      <Helmet>
        <title>Admin Dashboard • Sightline</title>
        <meta name="description" content="Admin dashboard with comprehensive metrics and user management" />
      </Helmet>

      <div className="space-y-10">
        {/* Header */}
        <div className="px-6 md:px-8 xl:px-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">Admin Console</h1>
            <p className="text-slate-400 mt-2">Comprehensive metrics and user management</p>
          </div>
          <div className="text-sm text-slate-400">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Hero Metrics - full width */}
        <div className="px-6 md:px-8 xl:px-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Posts Metrics */}
          <Card className="p-6 border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/30 backdrop-blur shadow-[0_0_40px_-15px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Posts</p>
                <p className="text-2xl font-bold text-slate-200">{metrics.posts.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center ring-1 ring-blue-400/20">
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
          <Card className="p-6 border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/30 backdrop-blur shadow-[0_0_40px_-15px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-slate-200">{metrics.users.total}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center ring-1 ring-green-400/20">
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
          <Card className="p-6 border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/30 backdrop-blur shadow-[0_0_40px_-15px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-slate-200">{metrics.categories.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center ring-1 ring-purple-400/20">
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
          <Card className="p-6 border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/30 backdrop-blur shadow-[0_0_40px_-15px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Published</p>
                <p className="text-2xl font-bold text-emerald-400">{metrics.posts.published}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center ring-1 ring-emerald-400/20">
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
        <div className="px-6 md:px-8 xl:px-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="px-6 md:px-8 xl:px-10"><Skeleton className="h-64" /></div>
        ) : (
          <div className="px-6 md:px-8 xl:px-10"><Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
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
          </Card></div>
        )}

        {/* User Activity */}
        {userLoading ? (
          <div className="px-6 md:px-8 xl:px-10"><Skeleton className="h-64" /></div>
        ) : (
          <div className="px-6 md:px-8 xl:px-10 grid grid-cols-1 2xl:grid-cols-3 gap-6">
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur 2xl:col-span-2">
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
          {/* Top contributors mini chart using recent-user-posts */}
          <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Top contributors (7 days)</h3>
            <div className="space-y-3">
              {(!recentPostsLoading ? (recentUserPosts as RecentUserPosts[] | undefined) ?? [] : []).slice(0, 8).map((u) => {
                const max = Math.max(1, Math.max(...(((recentUserPosts as RecentUserPosts[]) || [{ postsLast7Days: 1 }]).map(x => x.postsLast7Days))));
                const pct = Math.round((u.postsLast7Days / max) * 100);
                return (
                  <div key={u.userId} className="grid grid-cols-12 items-center gap-3">
                    <div className="col-span-4 truncate text-slate-300 text-sm">{u.username}</div>
                    <div className="col-span-6 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500/70 via-emerald-500/70 to-purple-500/70" style={{ width: pct + '%' }} />
                    </div>
                    <div className="col-span-2 text-right text-slate-400 text-sm">{u.postsLast7Days}</div>
                  </div>
                )
              })}
              {(!recentUserPosts || (recentUserPosts as RecentUserPosts[]).length === 0) && !recentPostsLoading && (
                <p className="text-slate-400 text-sm">No recent posts in the last 7 days.</p>
              )}
            </div>
          </Card>
          </div>
        )}
      </div>
    </Container>
  )
}
