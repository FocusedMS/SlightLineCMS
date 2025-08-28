import { useMemo, useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

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

const fmt = (dt?: string | null) => (!dt ? '—' : new Date(dt).toLocaleString())

const statusStyles: Record<string, string> = {
  Published: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  PendingReview: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  Draft: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30',
  Rejected: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyles[value] ?? statusStyles.Draft}`}>
      {value}
    </span>
  )
}

function Kebab({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label="Row actions"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80">
        <circle cx="12" cy="6" r="1.6" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="12" cy="18" r="1.6" />
      </svg>
    </button>
  )
}

function ConfirmModal({
  title = 'Are you sure?',
  body,
  open,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
}: {
  title?: string
  body?: string
  open: boolean
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 backdrop-blur-sm">
      <div className="w-[96%] max-w-md rounded-2xl" style={{ background: 'var(--surface)' }}>
        <div className="p-5" style={{ color: 'var(--text)' }}>
          <h3 className="text-lg font-semibold">{title}</h3>
          {body && <p className="mt-2" style={{ color: 'var(--muted)' }}>{body}</p>}
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={onClose} className="btn btn-outline">Cancel</button>
            <button onClick={() => { onConfirm(); onClose() }} className="btn btn-primary">{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
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
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['my-posts'] }) },
    onError: () => toast.error('Delete failed')
  })

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | 'Draft' | 'PendingReview' | 'Published' | 'Rejected'>('All')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated')
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)

  const posts = postsQ.data ?? []
  const counts = useMemo(() => {
    const c = { Draft: 0, PendingReview: 0, Published: 0, Rejected: 0 } as any
    for (const p of posts) c[p.status] = (c[p.status] ?? 0) + 1
    return c
  }, [posts])

  const filtered = useMemo(() => {
    let list = posts.slice()
    if (status !== 'All') list = list.filter(p => p.status === status)
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">My Posts</h1>
        <div className="ml-auto flex items-center gap-2">
          <BadgeCount label="Draft" value={counts.Draft || 0} className={statusStyles.Draft} onClick={() => setStatus('Draft')} />
          <BadgeCount label="Pending" value={counts.PendingReview || 0} className={statusStyles.PendingReview} onClick={() => setStatus('PendingReview')} />
          <BadgeCount label="Published" value={counts.Published || 0} className={statusStyles.Published} onClick={() => setStatus('Published')} />
          <BadgeCount label="Rejected" value={counts.Rejected || 0} className={statusStyles.Rejected} onClick={() => setStatus('Rejected')} />
          <Link to="/editor" className="btn btn-primary ml-2">New Post</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title or excerpt…" className="input" />
        <select value={status} onChange={e => setStatus(e.target.value as any)} className="input">
          <option>All</option>
          <option>Draft</option>
          <option>PendingReview</option>
          <option>Published</option>
          <option>Rejected</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="input">
          <option value="updated">Sort: Recently updated</option>
          <option value="created">Sort: Recently created</option>
          <option value="title">Sort: Title A–Z</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
        <div
          className="hidden min-w-full items-center px-5 py-3 text-sm md:grid"
          style={{ background: 'color-mix(in srgb, var(--surface) 98%, transparent)', color: 'var(--muted)', borderBottom: `1px solid var(--border)`, gridTemplateColumns: 'minmax(360px,1fr) 140px 190px 64px' }}
        >
          <div>Title</div>
          <div>Status</div>
          <div>Updated</div>
          <div className="text-right"> </div>
        </div>

        {postsQ.isLoading ? (
          <SkeletonRows />
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>
            No posts match your filters. <Link to="/editor" className="btn-ghost">Create one</Link>.
          </div>
        ) : (
          filtered.map(p => (
            <Row
              key={p.id}
              post={p}
              onSubmit={() => submit.mutate(p.id)}
              onDelete={() => setPendingDelete(p.id)}
            />
          ))
        )}
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete !== null && remove.mutate(pendingDelete)}
        title="Delete post?"
        body="This cannot be undone."
        confirmLabel={remove.isPending ? 'Deleting…' : 'Delete'}
      />
    </div>
  )
}

function BadgeCount({ label, value, className, onClick }: { label: string; value: number; className: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ring-1 transition hover:brightness-110 ${className}`}>
      <span className="font-medium">{label}</span>
      <span className="ml-1 rounded-full bg-black/30 px-2 py-0.5 text-[11px]">{value}</span>
    </button>
  )
}

function Row({ post, onSubmit, onDelete }: { post: Post; onSubmit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="grid items-center px-5 py-4 transition"
      style={{ gridTemplateColumns: 'minmax(360px,1fr) 140px 190px 64px', borderTop: `1px solid var(--border)` }}
    >
      <div className="min-w-0">
        <div className="truncate font-medium">{post.title}</div>
        <div className="mt-1 line-clamp-1 text-sm" style={{ color: 'var(--muted)' }}>{post.excerpt || '—'}</div>
      </div>
      <div><StatusPill value={post.status} /></div>
      <div className="text-sm" style={{ color: 'var(--muted)' }}>{fmt(post.updatedAt)}</div>
      <div className="relative -mr-2 text-right">
        <Kebab open={open} onToggle={() => setOpen(v => !v)} />
        {open && (
          <div
            onMouseLeave={() => setOpen(false)}
            className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl shadow-2xl"
            style={{ background: 'var(--surface)', border: `1px solid var(--border)` }}
            role="menu"
          >
            {post.status === 'Published' && (
              <MenuItem as={Link as any} to={`/post/${post.slug}`} target="_blank">View</MenuItem>
            )}
            <MenuItem as={Link as any} to={`/editor/${post.id}`}>Edit</MenuItem>
            {post.status === 'Draft' && (
              <MenuItem onClick={onSubmit}>Submit for review</MenuItem>
            )}
            <MenuItem danger onClick={onDelete}>Delete</MenuItem>
          </div>
        )}
      </div>
    </div>
  )
}

function MenuItem({ children, onClick, danger, as: Comp = 'button', to, target }:
  { children: any; onClick?: () => void; danger?: boolean; as?: any; to?: string; target?: string }) {
  const cls = `w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${danger ? 'text-rose-400' : ''}`
  return <Comp to={to} onClick={onClick} className={cls} target={target}>{children}</Comp>
}

function SkeletonRows() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="grid items-center px-5 py-4" style={{ gridTemplateColumns: 'minmax(360px,1fr) 140px 190px 64px' }}>
          <div className="h-5 w-2/3 animate-pulse rounded" style={{ background: 'color-mix(in srgb, var(--text) 10%, transparent)' }} />
          <div className="h-6 w-24 animate-pulse rounded-full" style={{ background: 'color-mix(in srgb, var(--text) 10%, transparent)' }} />
          <div className="h-5 w-40 animate-pulse rounded" style={{ background: 'color-mix(in srgb, var(--text) 10%, transparent)' }} />
          <div className="h-8 w-8 rounded-lg bg-transparent" />
        </div>
      ))}
    </div>
  )
}
