import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { lazy, Suspense } from 'react'
const ReactQuill = lazy(() => import('react-quill'))
import 'react-quill/dist/quill.snow.css'
import { api } from '../lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 chars'),
  excerpt: z.string().optional(),
  focusKeyword: z.string().optional(),
  contentHtml: z.string().optional(),
  coverImageUrl: z.string().optional(),
  categoryId: z.number().nullable().optional()
})
type Form = z.infer<typeof schema>

export default function Editor() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const nav = useNavigate()

  const { register, setValue, handleSubmit, watch, formState:{errors}, reset } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { contentHtml: '' }
  })

  // Fetch categories for the category dropdown.  If the request fails we fall back to an empty array.
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/api/Categories')).data as { id: number; name: string }[],
    staleTime: Infinity
  })

  // load existing when editing
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => (await api.get(`/api/Posts/${id}`)).data,
    enabled: isEdit
  })

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title ?? '',
        excerpt: existing.excerpt ?? '',
        focusKeyword: existing.focusKeyword ?? '',
        contentHtml: existing.contentHtml ?? '',
        coverImageUrl: existing.coverImageUrl ?? '',
        categoryId: existing.categoryId ?? null
      })
    }
  }, [existing, reset])

  const quillRef = useRef<any>(null)
  const [seo, setSeo] = useState<any>(null)
  const [seoLoading, setSeoLoading] = useState(false)

  const createPost = useMutation({
    mutationFn: async (payload: any) => (await api.post('/api/Posts', payload)).data,
    onSuccess: () => {
      toast.success('Draft created! Go to Dashboard to submit for review.')
      nav('/dashboard')
    }
  })

  const updatePost = useMutation({
    mutationFn: async (payload: any) => (await api.put(`/api/Posts/${id}`, payload)).data,
    onSuccess: () => toast.success('Draft updated')
  })

  const submitForReview = useMutation({
    mutationFn: async () => (await api.post(`/api/Posts/${id}/submit`, {})).data,
    onSuccess: () => toast.success('Submitted for review')
  })

  const onImageUpload = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', 'posts')
    try {
      const { data } = await api.post('/api/Media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Image uploaded')
      return `${import.meta.env.VITE_API_BASE_URL}${data.url}`
    } catch (e: any) {
      const msg = e?.response?.data?.title || 'Upload failed'
      toast.error(msg)
      throw e
    }
  }

  const insertImage = async () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async () => {
      const file = (input.files?.[0])
      if (!file) return
      const url = await onImageUpload(file)
      const editor = quillRef.current?.getEditor?.()
      const range = editor?.getSelection(true)
      if (range) {
        editor!.insertEmbed(range.index, 'image', url)
        editor!.setSelection({ index: range.index + 1, length: 0 })
      }
      if (!watch('coverImageUrl')) setValue('coverImageUrl', url, { shouldDirty: true })
    }
    input.click()
  }

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1,2,3,false] }],
        ['bold','italic','underline'],
        [{'list':'ordered'}, {'list':'bullet'}],
        ['link','image'],
        ['clean']
      ],
      handlers: { image: insertImage }
    }
  }), [])

  // Debounced SEO analyze
  let seoTimer: number | undefined
  const analyzeSeo = async () => {
    const body = {
      title: watch('title'),
      excerpt: watch('excerpt'),
      contentHtml: watch('contentHtml'),
      focusKeyword: watch('focusKeyword')
    }
    try {
      setSeoLoading(true)
      const { data } = await api.post('/api/Seo/analyze', body)
      setSeo(data)
    } catch {
      setSeo(null)
    } finally {
      setSeoLoading(false)
    }
  }
  const scheduleSeo = () => {
    if (seoTimer) window.clearTimeout(seoTimer)
    // 700ms debounce
    seoTimer = window.setTimeout(analyzeSeo, 700)
  }

  const onSubmit = async (data: Form) => {
    const payload = {
      title: data.title,
      excerpt: data.excerpt,
      contentHtml: data.contentHtml,
      coverImageUrl: data.coverImageUrl,
      focusKeyword: data.focusKeyword,
      categoryId: data.categoryId ?? null,
      tagIds: [] as number[]
    }
    if (isEdit) {
      await updatePost.mutateAsync(payload)
    } else {
      await createPost.mutateAsync(payload)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="md:col-span-2 space-y-4">
        <Card className="space-y-4">
          <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Post' : 'New Post'}</h1>

          {loadingExisting && isEdit ? (
            <div>Loading…</div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="label">Title</label>
                <Input placeholder="Title" {...register('title')} onChange={(e)=>{ register('title').onChange(e); scheduleSeo(); }} />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="label">Excerpt</label>
                <Input placeholder="Short summary…" {...register('excerpt')} onChange={(e)=>{ register('excerpt').onChange(e); scheduleSeo(); }} />
              </div>

              <div className="space-y-2">
                <label className="label">Focus keyword</label>
                <Input placeholder="e.g., hello" {...register('focusKeyword')} onChange={(e)=>{ register('focusKeyword').onChange(e); scheduleSeo(); }} />
              </div>

              <div className="space-y-2">
                <label className="label">Content</label>
                <Suspense fallback={<div className="text-sm text-gray-500">Loading editor…</div>}>
                  <ReactQuill
                    ref={quillRef as any}
                    theme="snow"
                    value={watch('contentHtml') || ''}
                    onChange={(html) => { setValue('contentHtml', html, { shouldDirty: true }); scheduleSeo(); }}
                    modules={modules}
                  />
                </Suspense>
              </div>

              <div className="space-y-2">
                <label className="label">Cover image URL</label>
                <Input
                  placeholder="Auto-filled when you upload"
                  {...register('coverImageUrl')}
                />
              </div>

              {/* Category selector */}
              <div className="space-y-2">
                <label className="label">Category</label>
                <Select
                  value={String(watch('categoryId') ?? '')}
                  onChange={(e) => {
                    const v = e.target.value ? parseInt(e.target.value) : undefined
                    setValue('categoryId', v as any, { shouldDirty: true })
                  }}
                >
                  <option value="">General</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button type="button" variant="outline" onClick={analyzeSeo}>
                  {seoLoading ? 'Analyzing…' : 'Check SEO'}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={createPost.isPending || updatePost.isPending}
                >
                  {createPost.isPending || updatePost.isPending
                    ? 'Saving…'
                    : isEdit
                    ? 'Update Draft'
                    : 'Save Draft'}
                </Button>

                {isEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => submitForReview.mutate()}
                    disabled={submitForReview.isPending}
                  >
                    {submitForReview.isPending ? 'Submitting…' : 'Submit for Review'}
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
      </form>

      <aside className="space-y-4">
        <Card>
          <div className="font-semibold mb-2">SEO Analyzer</div>
          {seoLoading && <div className="text-sm text-gray-500">Analyzing…</div>}
          {seo ? (
            <div className="space-y-2">
              {'score' in seo && (
                <div>
                  <div className="text-sm">Score</div>
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-brand-500 rounded"
                      style={{ width: `${Math.min(100, Math.max(0, seo.score))}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {seo.suggestions?.length ? (
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {seo.suggestions.map((s: any, i: number) => (
                    <li key={i}>{typeof s === 'string' ? s : s?.message ?? JSON.stringify(s)}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No suggestions.</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Fill fields and the analyzer will update.</div>
          )}
        </Card>
      </aside>
    </div>
  )
}
