import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

type Post = {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  status: 'Draft' | 'PendingReview' | 'Published' | string
  updatedAt: string
  createdAt: string
  publishedAt?: string | null
}

function fmt(dt?: string | null) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleString()
}

/** Promise-based confirm UI using react-hot-toast */
/**
 * Present a promise-based confirmation dialog using react-hot-toast.  This
 * helper renders a custom Card with accessible semantics and our design
 * system buttons.  Calling code awaits the returned promise which
 * resolves to true for confirm and false to cancel.
 */
function confirmToast(opts: {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
} = {}) {
  const {
    title = 'Delete this post?',
    message = 'This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
  } = opts
  return new Promise<boolean>((resolve) => {
    const id = toast.custom((t) => {
      return (
        <Card
          className={`max-w-sm w-[360px] p-4 shadow-lg transition-all duration-200 ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div id="confirm-title" className="font-semibold mb-1">
            {title}
          </div>
          <div className="text-sm text-gray-600 mb-3">{message}</div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                toast.dismiss(id)
                resolve(false)
              }}
            >
              {cancelText}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                toast.dismiss(id)
                resolve(true)
              }}
            >
              {confirmText}
            </Button>
          </div>
        </Card>
      )
    }, { duration: Infinity })
  })
}

export default function Dashboard() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All'|'Draft'|'PendingReview'|'Published'|'Rejected'>('All')

  const postsQ = useQuery({
    queryKey: ['my-posts'],
    queryFn: async () => (await api.get<Post[]>('/api/Posts/me')).data,
  })

  const submit = useMutation({
    mutationFn: async (id: number) => (await api.post(`/api/Posts/${id}/submit`)).data,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/api/Posts/${id}`)).data,
  })

  const handleSubmit = async (id: number) => {
    try {
      await submit.mutateAsync(id)
      toast.success('Submitted for review')
      qc.invalidateQueries({ queryKey: ['my-posts'] })
    } catch (e: any) {
      toast.error(e?.response?.data ?? 'Submit failed')
    }
  }

  const handleDelete = async (id: number) => {
    const ok = await confirmToast({
      title: 'Delete this post?',
      message: 'This will permanently remove the draft.',
    })
    if (!ok) return

    try {
      await remove.mutateAsync(id)
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['my-posts'] })
    } catch {
      toast.error('Delete failed')
    }
  }

  const posts = postsQ.data || []
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return posts.filter((p) => {
      const okStatus = status === 'All' ? true : p.status === status
      const okSearch = term ? (p.title?.toLowerCase().includes(term) || (p.excerpt||'').toLowerCase().includes(term)) : true
      return okStatus && okSearch
    })
  }, [posts, search, status])

  return (
    <div className="space-y-4">
      {postsQ.isLoading && <div className="container py-8"><span className="spinner" /> Loading…</div>}
      {postsQ.isError && <div className="container py-8 text-red-600">Failed to load posts.</div>}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">My Posts</h1>
        <input
          className="input"
          placeholder="Search..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
        <select className="select" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
          <option>All</option>
          <option>Draft</option>
          <option>PendingReview</option>
          <option>Published</option>
          <option>Rejected</option>
        </select>
        <Button asChild className="ml-auto">
          <Link to="/editor">New Post</Link>
        </Button>
      </div>
      {filtered.length === 0 ? (
        <Card className="text-gray-600">No posts yet. Click “New Post”.</Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                let statusVariant: 'success' | 'warning' | 'neutral' | 'danger' = 'neutral'
                if (p.status === 'Published') statusVariant = 'success'
                else if (p.status === 'PendingReview') statusVariant = 'warning'
                else if (p.status === 'Rejected') statusVariant = 'danger'
                return (
                  <tr key={p.id} className="border-b last:border-none">
                    <td>
                      <div className="font-medium text-base">{p.title}</div>
                      <div className="text-gray-500 text-sm">{p.excerpt || '—'}</div>
                    </td>
                    <td>
                      <Badge status={statusVariant}>{p.status}</Badge>
                    </td>
                    <td>{fmt(p.updatedAt)}</td>
                    <td className="flex flex-wrap gap-2 items-center">
                      {p.status === 'Published' ? (
                        <Button variant="outline" asChild>
                          <Link to={`/post/${p.slug}`} target="_blank" rel="noreferrer">
                            View
                          </Link>
                        </Button>
                      ) : null}
                      <Button variant="outline" asChild>
                        <Link to={`/editor/${p.id}`}>Edit</Link>
                      </Button>
                      {p.status === 'Draft' && (
                        <Button
                          variant="primary"
                          onClick={() => handleSubmit(p.id)}
                          disabled={submit.isPending}
                        >
                          {submit.isPending ? 'Submitting…' : 'Submit for review'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(p.id)}
                        disabled={remove.isPending}
                      >
                        {remove.isPending ? 'Deleting…' : 'Delete'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
