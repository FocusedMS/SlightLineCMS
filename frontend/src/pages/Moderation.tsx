import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Container } from '../components/layout/Container'
import { Modal } from '../components/ui/Modal'

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

export default function AdminModeration() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 10
  
  // Modal state
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pendingQ = useQuery({
    queryKey: ['moderation', 'pending', { page, pageSize }],
    queryFn: async () => (await api.get<PendingResp>('/api/Moderation/posts', { params: { page, pageSize } })).data,
  })

  const approve = useMutation({
    mutationFn: async (id: number) =>
      (await api.post(`/api/Moderation/posts/${id}/approve`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation', 'pending'] })
      toast.success('Post approved successfully!')
      setShowApproveModal(false)
      setSelectedPost(null)
    },
    onError: (error) => {
      toast.error('Failed to approve post. Please try again.')
      console.error('Approve error:', error)
    }
  })

  const reject = useMutation({
    mutationFn: async (args: { id: number; reason: string }) =>
      (await api.post(`/api/Moderation/posts/${args.id}/reject`, { reason: args.reason })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation', 'pending'] })
      toast.success('Post rejected successfully!')
      setShowRejectModal(false)
      setSelectedPost(null)
      setRejectReason('')
    },
    onError: (error) => {
      toast.error('Failed to reject post. Please try again.')
      console.error('Reject error:', error)
    }
  })

  const handleApprove = (post: PendingPost) => {
    setSelectedPost(post)
    setShowApproveModal(true)
  }

  const handleReject = (post: PendingPost) => {
    setSelectedPost(post)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const confirmApprove = async () => {
    if (!selectedPost) return
    
    setIsSubmitting(true)
    try {
      await approve.mutateAsync(selectedPost.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmReject = async () => {
    if (!selectedPost) return
    
    // Validate reason if provided
    if (rejectReason.trim() && rejectReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters, or leave it blank.')
      return
    }
    
    setIsSubmitting(true)
    try {
      await reject.mutateAsync({ 
        id: selectedPost.id, 
        reason: rejectReason.trim() 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeApproveModal = () => {
    setShowApproveModal(false)
    setSelectedPost(null)
  }

  const closeRejectModal = () => {
    setShowRejectModal(false)
    setSelectedPost(null)
    setRejectReason('')
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
            <Card className="text-sm text-gray-500 dark:text-gray-400">No posts waiting for review.</Card>
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
                          variant="primary"
                          onClick={() => handleApprove(p)}
                          disabled={approve.isPending || reject.isPending || isSubmitting}
                        >
                          {approve.isPending ? 'Approving…' : 'Approve'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(p)}
                          disabled={approve.isPending || reject.isPending || isSubmitting}
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

      {/* Approve Confirmation Modal */}
      <Modal
        open={showApproveModal}
        title="Confirm Approval"
        onClose={closeApproveModal}
        onConfirm={confirmApprove}
        confirmLabel={isSubmitting ? "Approving..." : "Yes, Approve"}
        disabled={isSubmitting}
      >
        <p>Are you sure you want to approve "{selectedPost?.title}"?</p>
        <p className="text-sm text-gray-500 mt-2">This will publish the post immediately.</p>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        open={showRejectModal}
        title="Confirm Rejection"
        onClose={closeRejectModal}
        onConfirm={confirmReject}
        confirmLabel={isSubmitting ? "Rejecting..." : "Yes, Reject"}
        danger={true}
        disabled={isSubmitting}
      >
        <div className="space-y-4">
          <p>Are you sure you want to reject "{selectedPost?.title}"?</p>
          <div>
            <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rejection Reason (optional)
            </label>
            <textarea
              id="reject-reason"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Provide a reason for rejection (minimum 10 characters if provided)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            {rejectReason.trim() && rejectReason.trim().length < 10 && (
              <p className="text-sm text-red-500 mt-1">
                Reason must be at least 10 characters, or leave it blank.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </Container>
  )
}
