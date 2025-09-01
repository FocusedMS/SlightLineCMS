import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { lazy, Suspense } from 'react'
const ReactQuill = lazy(() => import('react-quill'))
import 'react-quill/dist/quill.snow.css'

// Custom styles for ReactQuill in dark theme
const customQuillStyles = `
  .ql-editor {
    background: transparent !important;
    color: #e2e8f0 !important;
    min-height: 200px;
    font-size: 16px;
    line-height: 1.6;
  }
  
  .ql-toolbar {
    background: #1e293b !important;
    border: 1px solid #475569 !important;
    border-radius: 8px 8px 0 0;
    border-bottom: none !important;
  }
  
  .ql-container {
    border: 1px solid #475569 !important;
    border-radius: 0 0 8px 8px;
    background: #1e293b !important;
  }
  
  .ql-stroke {
    stroke: #e2e8f0 !important;
  }
  
  .ql-fill {
    fill: #e2e8f0 !important;
  }
  
  .ql-picker {
    color: #e2e8f0 !important;
  }
  
  .ql-picker-options {
    background: #334155 !important;
    border: 1px solid #475569 !important;
  }
  
  .ql-picker-item {
    color: #e2e8f0 !important;
  }
  
  .ql-picker-item:hover {
    background: #475569 !important;
  }
  
  .ql-picker-label:hover {
    color: #60a5fa !important;
  }
  
  .ql-tooltip {
    background: #334155 !important;
    border: 1px solid #475569 !important;
    color: #e2e8f0 !important;
  }
  
  .ql-tooltip a {
    color: #60a5fa !important;
  }
  
  .ql-tooltip input[type=text] {
    background: #1e293b !important;
    border: 1px solid #475569 !important;
    color: #e2e8f0 !important;
  }
  
  .ql-tooltip input[type=text]:focus {
    border-color: #60a5fa !important;
  }
`

// Inject custom styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = customQuillStyles
  document.head.appendChild(style)
}
import { api } from '../lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Container } from '../components/layout/Container'

const schema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .refine(val => val.trim().length > 0, 'Title cannot be empty'),
  excerpt: z.string()
    .max(300, 'Excerpt must be less than 300 characters')
    .optional(),
  focusKeyword: z.string()
    .max(50, 'Focus keyword must be less than 50 characters')
    .optional(),
  contentHtml: z.string()
    .min(10, 'Content must have meaningful text')
    .optional(),
  coverImageUrl: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  categoryId: z.number().nullable().optional()
})
type Form = z.infer<typeof schema>

export default function Editor() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const nav = useNavigate()

  const { register, setValue, handleSubmit, watch, formState:{errors, isValid, isDirty}, reset } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { contentHtml: '' },
    mode: 'onChange'
  })

  // Fetch categories for the category dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/api/Categories')).data as { id: number; name: string }[],
    staleTime: Infinity
  })

  // Load existing when editing
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

  // Enhanced SEO analysis with comprehensive validations
  let seoTimer: number | undefined
  
  const calculateSeoScore = (title: string, excerpt: string, content: string, keyword: string) => {
    let score = 0
    let suggestions: string[] = []
    
    // Title analysis (30% of total score)
    if (!title || title.trim().length === 0) {
      suggestions.push('Add a compelling title to improve SEO')
    } else if (title.length < 10) {
      suggestions.push('Title is too short. Aim for 10-60 characters')
      score += 5
    } else if (title.length > 60) {
      suggestions.push('Title is too long. Keep it under 60 characters')
      score += 10
    } else if (title.length >= 30 && title.length <= 60) {
      score += 30
      suggestions.push('✓ Title length is optimal for SEO')
    } else {
      score += 15
    }
    
    // Focus keyword analysis (25% of total score)
    if (!keyword || keyword.trim().length === 0) {
      suggestions.push('Add a focus keyword to target specific searches')
    } else if (keyword.length < 2) {
      suggestions.push('Focus keyword is too short')
      score += 5
    } else if (keyword.length > 50) {
      suggestions.push('Focus keyword is too long. Keep it concise')
      score += 10
    } else {
      score += 25
      suggestions.push('✓ Focus keyword is well-defined')
    }
    
    // Excerpt analysis (20% of total score)
    if (!excerpt || excerpt.trim().length === 0) {
      suggestions.push('Add a compelling excerpt to improve click-through rates')
    } else if (excerpt.length < 50) {
      suggestions.push('Excerpt is too short. Aim for 120-160 characters')
      score += 5
    } else if (excerpt.length > 200) {
      suggestions.push('Excerpt is too long. Keep it under 160 characters')
      score += 10
    } else if (excerpt.length >= 120 && excerpt.length <= 160) {
      score += 20
      suggestions.push('✓ Excerpt length is optimal for search results')
    } else {
      score += 15
    }
    
    // Content analysis (25% of total score)
    if (!content || content.trim().length === 0) {
      suggestions.push('Add content to your post. Empty posts rank poorly')
    } else {
      const contentLength = content.replace(/<[^>]*>/g, '').length
      if (contentLength < 100) {
        suggestions.push('Content is too short. Aim for at least 300 words')
        score += 5
      } else if (contentLength < 300) {
        suggestions.push('Content could be longer. Aim for 300+ words for better ranking')
        score += 15
      } else if (contentLength >= 300 && contentLength <= 1000) {
        score += 25
        suggestions.push('✓ Content length is good for SEO')
      } else {
        score += 20
        suggestions.push('✓ Content is comprehensive and detailed')
      }
    }
    
    // Keyword usage analysis
    if (keyword && content) {
      const keywordLower = keyword.toLowerCase()
      const contentLower = content.toLowerCase()
      const titleLower = title.toLowerCase()
      
      // Check keyword in title
      if (titleLower.includes(keywordLower)) {
        score += 5
        suggestions.push('✓ Focus keyword found in title')
      } else {
        suggestions.push('Include your focus keyword in the title')
      }
      
      // Check keyword in content
      const keywordCount = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length
      if (keywordCount === 0) {
        suggestions.push('Include your focus keyword in the content')
      } else if (keywordCount === 1) {
        score += 3
        suggestions.push('✓ Focus keyword found in content')
      } else if (keywordCount <= 3) {
        score += 5
        suggestions.push('✓ Focus keyword usage is well-balanced')
      } else {
        suggestions.push('Avoid overusing your focus keyword (keyword stuffing)')
      }
    }
    
    // Ensure score doesn't exceed 100
    score = Math.min(100, Math.max(0, score))
    
    return { score, suggestions }
  }
  
  const analyzeSeo = async () => {
    const title = watch('title') || ''
    const excerpt = watch('excerpt') || ''
    const content = watch('contentHtml') || ''
    const keyword = watch('focusKeyword') || ''
    
    // Check if we have any meaningful content to analyze
    if (!title.trim() && !excerpt.trim() && !content.trim() && !keyword.trim()) {
      setSeo({
        score: 0,
        suggestions: ['Start by adding a title, excerpt, content, or focus keyword to get SEO insights']
      })
      setSeoLoading(false)
      return
    }
    
    try {
      setSeoLoading(true)
      
      // First try to get server-side analysis
      const body = { title, excerpt, contentHtml: content, focusKeyword: keyword }
      try {
        const { data } = await api.post('/api/Seo/analyze', body)
        if (data && typeof data.score === 'number') {
          setSeo(data)
          return
        }
      } catch (error) {
        console.log('Server-side SEO analysis failed, using client-side fallback')
      }
      
      // Fallback to client-side analysis
      const clientSeo = calculateSeoScore(title, excerpt, content, keyword)
      setSeo(clientSeo)
      
    } catch (error) {
      console.error('SEO analysis error:', error)
      setSeo({
        score: 0,
        suggestions: ['Unable to analyze SEO at this time. Please try again.']
      })
    } finally {
      setSeoLoading(false)
    }
  }
  
  const scheduleSeo = () => {
    if (seoTimer) window.clearTimeout(seoTimer)
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

    const watchedTitle = watch('title')
  const watchedExcerpt = watch('excerpt')
  const watchedKeyword = watch('focusKeyword')
  
  // Enhanced validation states
  const isTitleValid = watchedTitle && watchedTitle.length >= 3 && watchedTitle.length <= 100
  const isExcerptValid = !watchedExcerpt || (watchedExcerpt.length > 0 && watchedExcerpt.length <= 300)
  const isKeywordValid = !watchedKeyword || (watchedKeyword.length > 0 && watchedKeyword.length <= 50)
  const isContentValid = watch('contentHtml') && (watch('contentHtml')?.replace(/<[^>]*>/g, '').trim().length || 0) >= 10
  
  // Form completion status
  const formCompletion = {
    title: isTitleValid ? 100 : (watchedTitle ? Math.min(100, (watchedTitle.length / 3) * 100) : 0),
    excerpt: watchedExcerpt ? Math.min(100, (watchedExcerpt.length / 300) * 100) : 0,
    keyword: watchedKeyword ? 100 : 0,
    content: isContentValid ? 100 : (watch('contentHtml') ? Math.min(100, ((watch('contentHtml')?.replace(/<[^>]*>/g, '').trim().length || 0) / 10) * 100) : 0)
  }
  
  const overallCompletion = Math.round(
    (formCompletion.title + formCompletion.excerpt + formCompletion.keyword + formCompletion.content) / 4
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Container size="full" className="py-6">
        <Container size="wide">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
                              <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {isEdit ? 'Edit Post' : 'Create New Post'}
                  </h1>
                  <p className="text-slate-400 text-sm">
                    {isEdit ? 'Refine your content and improve SEO' : 'Craft engaging content with AI-powered insights'}
                  </p>
                  
                  {/* Form Completion Indicator */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                      <span className="text-xs text-slate-400">Form Completion</span>
                    </div>
                    <div className="w-24 bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 transition-all duration-500 ${
                          overallCompletion >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                          overallCompletion >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                          overallCompletion >= 40 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                          'bg-gradient-to-r from-rose-500 to-pink-500'
                        }`}
                        style={{ width: `${overallCompletion}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${
                      overallCompletion >= 80 ? 'text-emerald-400' :
                      overallCompletion >= 60 ? 'text-amber-400' :
                      overallCompletion >= 40 ? 'text-blue-400' :
                      'text-rose-400'
                    }`}>
                      {overallCompletion}%
                    </span>
                  </div>
                </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={analyzeSeo}
                className="px-6 py-3 bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {seoLoading ? 'Analyzing…' : 'Analyze SEO'}
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={createPost.isPending || updatePost.isPending || !isValid || !isDirty}
                className={`px-8 py-3 shadow-xl transition-all duration-200 ${
                  isValid && isDirty
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 cursor-not-allowed opacity-60'
                }`}
                onClick={handleSubmit(onSubmit)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
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
                  className="px-6 py-3 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {submitForReview.isPending ? 'Submitting…' : 'Submit for Review'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <form className="lg:col-span-3 space-y-6">
            
            {/* Validation Summary */}
            <Card className="p-4 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isTitleValid ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>
                  <span className="text-sm text-slate-300">Title</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isTitleValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {formCompletion.title}%
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isExcerptValid ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>
                  <span className="text-sm text-slate-300">Excerpt</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isExcerptValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {formCompletion.excerpt}%
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isKeywordValid ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>
                  <span className="text-sm text-slate-300">Keyword</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isKeywordValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {formCompletion.keyword}%
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isContentValid ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}></div>
                  <span className="text-sm text-slate-300">Content</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isContentValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {formCompletion.content}%
                  </span>
                </div>
              </div>
            </Card>
            {loadingExisting && isEdit ? (
              <Card className="p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-slate-400">Loading post...</span>
                </div>
              </Card>
            ) : (
              <>
                {/* Title Section */}
                <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
                  <div className="space-y-3">
                    <label className="label flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-lg font-semibold">Post Title</span>
                      <div className="flex items-center gap-2">
                        {watchedTitle && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isTitleValid 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {watchedTitle.length} chars
                          </span>
                        )}
                        {isTitleValid && (
                          <span className="text-emerald-400 text-sm">✓ Optimal</span>
                        )}
                      </div>
                    </label>
                    <Input 
                      placeholder="Enter a compelling title that captures attention..." 
                      {...register('title')} 
                      onChange={(e)=>{ register('title').onChange(e); scheduleSeo(); }}
                      className={`h-14 text-lg transition-all duration-200 ${
                        watchedTitle 
                          ? isTitleValid 
                            ? 'bg-slate-800/50 border-emerald-500/50 focus:border-emerald-500/70 focus:ring-emerald-500/20' 
                            : 'bg-slate-800/50 border-amber-500/50 focus:border-amber-500/70 focus:ring-amber-500/20'
                          : 'bg-slate-800/50 border-slate-600/50 focus:border-purple-500/50 focus:ring-purple-500/20'
                      }`}
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                </Card>

                {/* Excerpt & Keyword Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
                    <div className="space-y-3">
                      <label className="label flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        <span className="text-lg font-semibold">Excerpt</span>
                        <div className="flex items-center gap-2">
                          {watchedExcerpt && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              watchedExcerpt.length >= 120 && watchedExcerpt.length <= 160
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : watchedExcerpt.length > 0
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                            }`}>
                              {watchedExcerpt.length} chars
                            </span>
                          )}
                          {watchedExcerpt && watchedExcerpt.length >= 120 && watchedExcerpt.length <= 160 && (
                            <span className="text-emerald-400 text-sm">✓ Optimal</span>
                          )}
                        </div>
                      </label>
                      <Input 
                        placeholder="Write a compelling summary that entices readers..." 
                        {...register('excerpt')} 
                        onChange={(e)=>{ register('excerpt').onChange(e); scheduleSeo(); }}
                        className={`h-12 transition-all duration-200 ${
                          watchedExcerpt 
                            ? watchedExcerpt.length >= 120 && watchedExcerpt.length <= 160
                              ? 'bg-slate-800/50 border-emerald-500/50 focus:border-emerald-500/70 focus:ring-emerald-500/20' 
                              : 'bg-slate-800/50 border-amber-500/50 focus:border-amber-500/70 focus:ring-amber-500/20'
                            : 'bg-slate-800/50 border-slate-600/50 focus:border-blue-500/50 focus:ring-blue-500/20'
                        }`}
                      />
                    </div>
                  </Card>

                  <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
                    <div className="space-y-3">
                      <label className="label flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span className="text-lg font-semibold">Focus Keyword</span>
                        <div className="flex items-center gap-2">
                          {watchedKeyword && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              watchedKeyword.length >= 2 && watchedKeyword.length <= 50
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {watchedKeyword.length} chars
                            </span>
                          )}
                          {watchedKeyword && watchedKeyword.length >= 2 && watchedKeyword.length <= 50 && (
                            <span className="text-emerald-400 text-sm">✓ Optimal</span>
                          )}
                        </div>
                      </label>
                      <Input 
                        placeholder="Enter your primary SEO keyword..." 
                        {...register('focusKeyword')} 
                        onChange={(e)=>{ register('focusKeyword').onChange(e); scheduleSeo(); }}
                        className={`h-12 transition-all duration-200 ${
                          watchedKeyword 
                            ? watchedKeyword.length >= 2 && watchedKeyword.length <= 50
                              ? 'bg-slate-800/50 border-emerald-500/50 focus:border-emerald-500/70 focus:ring-emerald-500/20' 
                              : 'bg-slate-800/50 border-amber-500/50 focus:border-amber-500/70 focus:ring-amber-500/20'
                            : 'bg-slate-800/50 border-slate-600/50 focus:border-emerald-500/50 focus:ring-emerald-500/20'
                        }`}
                      />
                    </div>
                  </Card>
                </div>

                {/* HTML Converter Section */}
                <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
                  <div className="space-y-4">
                    <label className="label flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span className="text-lg font-semibold">HTML Converter</span>
                      <span className="text-blue-400 text-sm">Paste HTML content to convert to blog post</span>
                    </label>
                    
                    <div className="space-y-3">
                      <textarea
                        placeholder="Paste your HTML content here (including title, headings, paragraphs, etc.)..."
                        className="w-full h-32 p-4 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 resize-none"
                        onChange={(e) => {
                          const htmlContent = e.target.value;
                          if (htmlContent.trim()) {
                            // Extract title from h1 tag
                            const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
                            if (titleMatch) {
                              setValue('title', titleMatch[1].replace(/<[^>]*>/g, '').trim());
                            }
                            
                            // Set the HTML content
                            setValue('contentHtml', htmlContent);
                            scheduleSeo();
                          }
                        }}
                      />
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>This will automatically extract the title from &lt;h1&gt; tags and set the content</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Content Editor Section */}
                <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
                  <div className="space-y-4">
                    <label className="label flex items-center gap-2">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-lg font-semibold">Content</span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-sm">Rich text editor with advanced formatting</span>
                        {watch('contentHtml') && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isContentValid 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {watch('contentHtml')?.replace(/<[^>]*>/g, '').trim().length || 0} chars
                          </span>
                        )}
                        {isContentValid && (
                          <span className="text-emerald-400 text-sm">✓ Sufficient</span>
                        )}
                      </div>
                    </label>
                    
                    <div className="bg-slate-800/50 rounded-lg border border-slate-600/50">
                      <Suspense fallback={
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-3"></div>
                          <div className="text-slate-400">Loading editor...</div>
                        </div>
                      }>
                        <ReactQuill
                          ref={quillRef as any}
                          theme="snow"
                          value={watch('contentHtml') || ''}
                          onChange={(html) => { setValue('contentHtml', html, { shouldDirty: true }); scheduleSeo(); }}
                          modules={modules}
                          className="bg-transparent"
                          style={{ 
                            '--quill-bg': 'transparent',
                            '--quill-border': 'transparent',
                            '--quill-text': '#e2e8f0'
                          } as any}
                        />
                      </Suspense>
                    </div>
                  </div>
                </Card>

                {/* Media & Category Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
                    <div className="space-y-3">
                      <label className="label flex items-center gap-2">
                        <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-lg font-semibold">Cover Image</span>
                        {watch('coverImageUrl') && (
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ Set
                          </span>
                        )}
                      </label>
                      <Input
                        placeholder="Image URL will be auto-filled when you upload..."
                        {...register('coverImageUrl')}
                        className={`h-12 transition-all duration-200 ${
                          watch('coverImageUrl') 
                            ? 'bg-slate-800/50 border-emerald-500/50 focus:border-emerald-500/70 focus:ring-emerald-500/20' 
                            : 'bg-slate-800/50 border-slate-600/50 focus:border-rose-500/50 focus:ring-rose-500/20'
                        }`}
                      />
                      {errors.coverImageUrl && (
                        <p className="text-red-400 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.coverImageUrl.message}
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
                    <div className="space-y-3">
                      <label className="label flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-lg font-semibold">Category</span>
                        {watch('categoryId') && (
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ✓ Selected
                          </span>
                        )}
                      </label>
                      <Select
                        value={String(watch('categoryId') ?? '')}
                        onChange={(e) => {
                          const v = e.target.value ? parseInt(e.target.value) : undefined
                          setValue('categoryId', v as any, { shouldDirty: true })
                        }}
                        className={`h-12 transition-all duration-200 ${
                          watch('categoryId') 
                            ? 'bg-slate-800/50 border-emerald-500/50 focus:border-emerald-500/70 focus:ring-emerald-500/20' 
                            : 'bg-slate-800/50 border-slate-600/50 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                        }`}
                      >
                        <option value="">Select a category</option>
                        {categories?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </Card>
                </div>
              </>
            )}
            
            {/* Helpful Tips */}
            <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white">Pro Tips for Better SEO</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div className="space-y-2">
                  <p>• <strong>Title:</strong> Keep between 30-60 characters for optimal search display</p>
                  <p>• <strong>Excerpt:</strong> Aim for 120-160 characters to avoid truncation in search results</p>
                  <p>• <strong>Focus Keyword:</strong> Use 2-50 characters and include it naturally in your content</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>Content:</strong> Write at least 300 words for better search ranking</p>
                  <p>• <strong>Images:</strong> Add alt text and descriptive filenames for better accessibility</p>
                  <p>• <strong>Structure:</strong> Use headings (H1, H2, H3) to organize your content</p>
                </div>
              </div>
            </Card>
          </form>

          {/* Premium SEO Sidebar */}
          <aside className="space-y-6">
            <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">SEO Analyzer</h3>
                  <p className="text-slate-400 text-sm">AI-powered content optimization</p>
                </div>
              </div>

              {seoLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3"></div>
                  <div className="text-slate-400 text-sm">Analyzing your content...</div>
                </div>
              ) : seo ? (
                <div className="space-y-6">
                  {'score' in seo && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">SEO Score</span>
                        <span className="text-lg font-bold text-emerald-400">{Math.round(seo.score)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, seo.score))}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {seo.score >= 80 ? 'Excellent! Your content is well-optimized.' :
                         seo.score >= 60 ? 'Good! A few improvements could help.' :
                         seo.score >= 40 ? 'Fair! Several areas need attention.' :
                         'Needs work! Focus on the suggestions below.'}
                      </div>
                    </div>
                  )}

                  {seo.suggestions?.length ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-300">Optimization Tips</h4>
                      <div className="space-y-2">
                        {seo.suggestions.map((s: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                            <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-sm text-slate-300">
                              {typeof s === 'string' ? s : s?.message ?? JSON.stringify(s)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-slate-400 text-sm">No suggestions yet</div>
                      <div className="text-slate-500 text-xs mt-1">Fill in the fields to get started</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-slate-400 text-sm mb-2">Ready to analyze</div>
                  <div className="text-slate-500 text-xs">Start typing in the fields above to get real-time SEO insights</div>
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 border border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur">
              <h4 className="text-lg font-semibold text-white mb-4">Content Stats</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Title Length</span>
                  <span className={`text-sm font-medium ${watchedTitle && watchedTitle.length >= 30 && watchedTitle.length <= 60 ? 'text-green-400' : 'text-slate-300'}`}>
                    {watchedTitle ? watchedTitle.length : 0} chars
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Excerpt Length</span>
                  <span className={`text-sm font-medium ${watchedExcerpt && watchedExcerpt.length >= 120 && watchedExcerpt.length <= 160 ? 'text-green-400' : 'text-slate-300'}`}>
                    {watchedExcerpt ? watchedExcerpt.length : 0} chars
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Focus Keyword</span>
                  <span className={`text-sm font-medium ${watchedKeyword ? 'text-green-400' : 'text-slate-300'}`}>
                    {watchedKeyword ? 'Set' : 'Not set'}
                  </span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
        </Container>
      </Container>
    </div>
  )
}
