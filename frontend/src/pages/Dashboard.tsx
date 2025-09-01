import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Container } from '../components/layout/Container'

type Post = {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  status: 'Draft' | 'PendingReview' | 'Published' | 'Rejected' | string
  updatedAt: string
  createdAt: string
  publishedAt?: string | null
}

const fmt = (dt?: string | null) => {
  if (!dt) return '—'
  const date = new Date(dt)
  if (isNaN(date.getTime()) || date > new Date()) {
    return new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const getStatusVariant = (status: string) => {
  const statusLower = status?.toLowerCase()
  switch (statusLower) {
    case 'pendingreview': return 'pending'
    case 'published': return 'published'
    case 'draft': return 'secondary'
    case 'rejected': return 'rejected'
    default: return 'secondary'
  }
}

const getStatusLabel = (status: string) => {
  const statusLower = status?.toLowerCase()
  switch (statusLower) {
    case 'pendingreview': return 'Pending'
    case 'published': return 'Published'
    case 'draft': return 'Draft'
    case 'rejected': return 'Rejected'
    default: return status
  }
}

export default function Dashboard() {
  const qc = useQueryClient()
  const postsQ = useQuery({
    queryKey: ['my-posts'],
    queryFn: async () => (await api.get<Post[]>('/api/Posts/me')).data,
  })

  const submit = useMutation({
    mutationFn: async (id: number) => (await api.post(`/api/Posts/${id}/submit`)).data,
    onSuccess: () => { toast.success('Submitted for review'); qc.invalidateQueries({ queryKey: ['my-posts'] }) },
    onError: (e: any) => toast.error(e?.response?.data ?? 'Submit failed')
  })
  const remove = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/api/Posts/${id}`)).data,
    onSuccess: () => { 
      toast.success('Deleted'); 
      qc.invalidateQueries({ queryKey: ['my-posts'] });
      setPendingDelete(null); // Close modal after successful deletion
    },
    onError: (e: any) => {
      const errorMessage = e?.response?.data?.detail || e?.response?.data?.title || 'Delete failed'
      toast.error(errorMessage)
      setPendingDelete(null); // Close modal on error too
    }
  })

  // Note: Backend doesn't support unpublishing posts directly
  // Users need to edit the post and change status manually

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | 'Draft' | 'PendingReview' | 'Published' | 'Rejected'>('All')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated')
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)

  const posts = postsQ.data ?? []
  const counts = useMemo(() => {
    const c = { Draft: 0, PendingReview: 0, Published: 0, Rejected: 0 } as any
    for (const p of posts) {
      const status = p.status?.toLowerCase()
      if (status === 'draft') c.Draft++
      else if (status === 'pendingreview') c.PendingReview++
      else if (status === 'published') c.Published++
      else if (status === 'rejected') c.Rejected++
    }
    return c
  }, [posts])

  const filtered = useMemo(() => {
    let list = posts.slice()
    if (status !== 'All') {
      list = list.filter(p => p.status?.toLowerCase() === status.toLowerCase())
    }
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      list = list.filter(p => p.title.toLowerCase().includes(s) || (p.excerpt ?? '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      const da = sortBy === 'updated' ? a.updatedAt : a.createdAt
      const db = sortBy === 'updated' ? b.updatedAt : b.createdAt
      return new Date(db).getTime() - new Date(da).getTime()
    })
    return list
  }, [posts, q, status, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Container size="xl" className="py-6">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  My Posts
                </h1>
                <p className="text-slate-400 text-sm">
                  Manage and track your blog posts with advanced analytics
                </p>
                
                {/* Stats Overview */}
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-xs text-slate-400">Total Posts</span>
                    <span className="text-sm font-semibold text-white">{posts.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-xs text-slate-400">Published</span>
                    <span className="text-sm font-semibold text-white">{counts.Published}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span className="text-xs text-slate-400">Pending</span>
                    <span className="text-sm font-semibold text-white">{counts.PendingReview}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <Button asChild variant="primary" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl">
              <Link to="/editor">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Post
              </Link>
            </Button>
          </div>
        </div>

        {/* Status Filters */}
        <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-slate-300">Filter by status:</span>
            <BadgeCount label="Draft" value={counts.Draft || 0} variant="draft" onClick={() => setStatus('Draft')} />
            <BadgeCount label="Pending" value={counts.PendingReview || 0} variant="pending" onClick={() => setStatus('PendingReview')} />
            <BadgeCount label="Published" value={counts.Published || 0} variant="published" onClick={() => setStatus('Published')} />
            <BadgeCount label="Rejected" value={counts.Rejected || 0} variant="rejected" onClick={() => setStatus('Rejected')} />
          </div>
        </Card>

        {/* Search & Filter Section */}
        <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search title or excerpt..."
                  className="w-full pl-14 h-12 bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/20 text-white placeholder-slate-400"
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <Button 
                variant="primary" 
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </Button>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Status Filter</label>
                <Select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full h-11 bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/20 text-white"
                >
                  <option>All Posts</option>
                  <option>Draft</option>
                  <option>PendingReview</option>
                  <option>Published</option>
                  <option>Rejected</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Sort By</label>
                <Select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full h-11 bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/20 text-white"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="created">Recently Created</option>
                  <option value="title">Title A–Z</option>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Posts Table */}
        <Card className="p-0 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
          {/* Table Header */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur border-b border-white/10 z-20">
            <div className="grid grid-cols-[1fr,140px,180px,160px] md:grid-cols-[1fr,160px,200px,180px] items-center gap-4 md:gap-6 px-4 sm:px-6 lg:px-10 py-4 md:py-5">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-slate-300">Title</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-slate-300">Status</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-slate-300">Updated</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <span className="text-sm font-semibold text-slate-300">Actions</span>
              </div>
            </div>
          </div>

          {postsQ.isLoading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center border border-slate-600/50">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">No posts found</h3>
                  <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                    {q || status !== 'All' 
                      ? 'No posts match your current filters. Try adjusting your search or status filter.' 
                      : 'Ready to share your thoughts? Create your first blog post and start your writing journey.'}
                  </p>
                </div>
                <Button asChild variant="primary" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Link to="/editor">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {q || status !== 'All' ? 'Clear Filters' : 'Create Your First Post'}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/8">
              {filtered.map(p => (
                <Row
                  key={p.id}
                  post={p}
                  onSubmit={() => submit.mutate(p.id)}
                  onDelete={() => setPendingDelete(p.id)}
                />
              ))}
            </div>
          )}
        </Card>

        <Modal
          open={pendingDelete !== null}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => pendingDelete !== null && remove.mutate(pendingDelete)}
          title="Delete post?"
          danger={true}
        >
          This action cannot be undone. The post will be permanently removed.
        </Modal>


      </Container>
    </div>
  )
}

function BadgeCount({ label, value, variant, onClick }: { label: string; value: number; variant: 'draft' | 'pending' | 'published' | 'rejected'; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition hover:scale-105 cursor-pointer"
    >
      <Badge variant={variant}>{label}</Badge>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white">{value}</span>
    </button>
  )
}

function Row({ post, onSubmit, onDelete }: { post: Post; onSubmit: () => void; onDelete: () => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr,160px,200px,180px] items-center gap-4 md:gap-6 px-4 sm:px-6 lg:px-10 py-4 md:py-5 transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 border-b border-white/5 last:border-b-0 group">
      {/* Title & Excerpt Column */}
      <div className="min-w-0 space-y-2">
        <div className="font-semibold text-white group-hover:text-blue-100 transition-colors text-lg break-words overflow-hidden text-ellipsis line-clamp-2" title={post.title}>
          {post.title}
        </div>
        <div className="text-sm text-slate-400 break-words leading-relaxed">
          {post.excerpt || 'No excerpt available'}
        </div>
      </div>
      
      {/* Status Column */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg flex items-center justify-center border border-slate-600/50">
          {post.status?.toLowerCase() === 'draft' && (
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          )}
          {post.status?.toLowerCase() === 'pendingreview' && (
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {post.status?.toLowerCase() === 'published' && (
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          )}
          {post.status?.toLowerCase() === 'rejected' && (
            <svg className="w-4 h-4 text-rose-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          )}
        </div>
        <div className="text-sm font-semibold text-slate-200">{getStatusLabel(post.status)}</div>
      </div>
      
      {/* Updated Column */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-sm text-slate-400">{fmt(post.updatedAt)}</div>
      </div>
      
      {/* Actions Column */}
      <div className="flex md:flex-col gap-2 md:gap-3 items-stretch">
        {/* View Button - Available for all posts */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('View button clicked for post:', post.id, 'Slug:', post.slug, 'Status:', post.status)
            window.open(`/my-post/${post.slug}`, '_blank')
          }}
          className="inline-flex items-center justify-center h-9 md:h-10 min-w-[96px] md:min-w-[120px] px-3 gap-2 rounded-xl text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-400/60 font-medium bg-emerald-500/5 backdrop-blur shadow-sm w-full md:w-[120px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </Button>

        {/* Edit Button */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="inline-flex items-center justify-center h-9 md:h-10 min-w-[96px] md:min-w-[120px] px-3 gap-2 rounded-xl text-blue-400 border-blue-500/40 hover:bg-blue-500/20 hover:border-blue-400/60 font-medium bg-blue-500/5 backdrop-blur shadow-sm w-full md:w-[120px]"
        >
          <Link to={`/editor/${post.id}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        </Button>

        {/* Submit Button - Only for draft/rejected posts */}
        {(post.status?.toLowerCase() === 'draft' || post.status?.toLowerCase() === 'rejected') && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSubmit}
            className="inline-flex items-center justify-center h-9 md:h-10 min-w-[96px] md:min-w-[120px] px-3 gap-2 rounded-xl text-amber-400 border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-400/60 font-medium bg-amber-500/5 backdrop-blur shadow-sm w-full md:w-[120px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Submit
          </Button>
        )}

        {/* Submit Button - Disabled for pending review */}
        {post.status?.toLowerCase() === 'pendingreview' && (
          <div title="Already submitted for review">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="inline-flex items-center justify-center h-9 md:h-10 min-w-[96px] md:min-w-[120px] px-3 gap-2 rounded-xl text-slate-400 border-slate-500/40 bg-slate-500/5 backdrop-blur shadow-sm w-full md:w-[120px] opacity-60 cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Submitted
            </Button>
          </div>
        )}

        {/* Delete Button - Allow deletion of all posts */}
        <div title={`Delete ${post.status} post`}>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="inline-flex items-center justify-center h-9 md:h-10 min-w-[96px] md:min-w-[120px] px-3 gap-2 rounded-xl text-rose-400 border-rose-500/40 hover:bg-rose-500/20 hover:border-rose-400/60 font-medium bg-rose-500/5 backdrop-blur shadow-sm w-full md:w-[120px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr,160px,200px,180px] items-center gap-4 md:gap-6 px-4 sm:px-6 lg:px-10 py-4 md:py-5 border-b border-white/5 last:border-b-0">
          {/* Title & Excerpt Column */}
          <div className="min-w-0 space-y-3">
            <div className="h-6 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse w-3/4"></div>
            </div>
          </div>
          
          {/* Status Column */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse w-16"></div>
          </div>
          
          {/* Updated Column */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse w-20"></div>
          </div>
          
          {/* Actions Column */}
          <div className="flex md:flex-col gap-2 md:gap-3">
            <div className="h-9 md:h-10 w-full md:w-[120px] bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl animate-pulse"></div>
            <div className="h-9 md:h-10 w-full md:w-[120px] bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl animate-pulse"></div>
            <div className="h-9 md:h-10 w-full md:w-[120px] bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl animate-pulse"></div>
          </div>
        </div>
      ))}
    </>
  )
}
