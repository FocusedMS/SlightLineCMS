import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Container } from '../components/layout/Container'

type PendingPost = {
  id: number
  title: string
  slug: string
  authorId: number
  updatedAt: string
}
type PendingResp = {
  items: PendingPost[]
  total: number
  page: number
  pageSize: number
}

/** Small confirm toast (Yes/No) that resolves to boolean */
function confirmToast(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const id = toast.custom((t) => (
      <div className="card p-4 shadow-lg min-w-[280px]">
        <div className="font-medium mb-3">{message}</div>
        <div className="flex gap-2 justify-end">
          <button
            className="btn btn-outline"
            onClick={() => { toast.dismiss(t.id); resolve(false) }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { toast.dismiss(t.id); resolve(true) }}
          >
            Yes
          </button>
        </div>
      </div>
    ), { duration: Infinity, id: `confirm-${Date.now()}` })
  })
}

/** Prompt for a text (Reject reason). Returns string or null if canceled. */
function promptToast(label: string): Promise<string | null> {
  return new Promise((resolve) => {
    let value = ''
    toast.custom((t) => (
      <div className="card p-4 shadow-lg min-w-[320px]">
        <div className="font-medium mb-2">{label}</div>
        <input
          className="input mb-3 w-full"
          placeholder="Optional"
          onChange={(e) => { value = e.currentTarget.value }}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button
            className="btn btn-outline"
            onClick={() => { toast.dismiss(t.id); resolve(null) }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { toast.dismiss(t.id); resolve(value) }}
          >
            Submit
          </button>
        </div>
      </div>
    ), { duration: Infinity })
  })
}

export default function AdminModeration() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const pendingQ = useQuery({
    queryKey: ['moderation', 'pending', { page, pageSize }],
    queryFn: async () => (await api.get<PendingResp>('/api/Moderation/posts', { params: { page, pageSize } })).data,
  })

  const approve = useMutation({
    mutationFn: async (id: number) =>
      (await api.post(`/api/Moderation/posts/${id}/approve`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moderation', 'pending'] }),
  })

  const reject = useMutation({
    mutationFn: async (args: { id: number; reason: string }) =>
      (await api.post(`/api/Moderation/posts/${args.id}/reject`, { reason: args.reason })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moderation', 'pending'] }),
  })

  const handleApprove = async (p: PendingPost) => {
    const ok = await confirmToast(`Approve “${p.title}”?`)
    if (!ok) return
    await toast.promise(approve.mutateAsync(p.id), {
      loading: 'Approving…',
      success: 'Approved ✅',
      error: 'Approve failed',
    })
  }

  const handleReject = async (p: PendingPost) => {
    const ok = await confirmToast(`Reject “${p.title}”?`)
    if (!ok) return
    const reason = await promptToast('Rejection reason (optional)')
    const finalReason = reason && reason.trim().length > 0 ? reason.trim() : ''
    if (finalReason && finalReason.length < 10) {
      toast.error('Reason must be at least 10 characters, or leave it blank.')
      return
    }
    await toast.promise(reject.mutateAsync({ id: p.id, reason: finalReason }), {
      loading: 'Rejecting…',
      success: finalReason ? `Rejected (reason noted) ❌` : 'Rejected ❌',
      error: 'Reject failed',
    })
  }

  if (pendingQ.isLoading) return <div className="container py-8"><span className="spinner" /> Loading…</div>
  if (pendingQ.isError) return <div className="container py-8 text-red-600">Failed to load queue.</div>

  const rows = pendingQ.data?.items ?? []

  return (
    <Container size="full" className="py-8 md:py-12">
      <Container size="wide">
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Moderation Queue</h1>

          {rows.length === 0 ? (
            <Card className="text-sm" style={{ color: 'var(--muted)' }}>No posts waiting for review.</Card>
          ) : (
            <Card className="overflow-x-auto p-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b last:border-none">
                      <td>{p.title}</td>
                      <td>#{p.authorId}</td>
                      <td>{new Date(p.updatedAt).toLocaleString()}</td>
                      <td className="flex flex-wrap gap-2 py-2">
                        <Button
                          variant="success"
                          onClick={() => handleApprove(p)}
                          disabled={approve.isPending || reject.isPending}
                        >
                          {approve.isPending ? 'Approving…' : 'Approve'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(p)}
                          disabled={approve.isPending || reject.isPending}
                        >
                          {reject.isPending ? 'Rejecting…' : 'Reject'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1, p-1))}>Prev</Button>
            <span className="text-sm">Page {page}</span>
            <Button variant="outline" disabled={(rows?.length||0) < pageSize} onClick={()=>setPage(p=>p+1)}>Next</Button>
          </div>
        </div>
      </Container>
    </Container>
  )
}
