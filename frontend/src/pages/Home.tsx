import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card } from '../components/ui/Card'
import PostCard from '../components/PostCard'

type Post = { id: number; title: string; slug: string; excerpt?: string }

export default function Home() {
  const nav = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isFetching, isError } = useQuery({
    queryKey: ['posts', { page, pageSize:10, search }],
    queryFn: async () => (await api.get('/api/Posts', { params:{ page, pageSize:10, search: search || undefined } })).data
  })

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Home • Blog</title>
        <meta
          name="description"
          content="Browse the latest published posts on our blog."
        />
      </Helmet>
      <section className="relative overflow-hidden rounded-[16px] border p-8 md:p-12" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-[color:var(--primary)] via-[#6474ff] to-[#6ee7f9] bg-clip-text text-transparent">
                Write. Share. Grow.
              </span>
            </h1>
            <p className="text-lg" style={{ color: 'var(--muted)' }}>A modern, fast and SEO‑friendly blogging platform. Browse posts, create rich content with a WYSIWYG editor, and get instant SEO suggestions.</p>
            <div className="flex gap-3 flex-wrap">
              <button className="btn btn-primary" onClick={()=>nav('/login')}>Start writing</button>
              <a href="#explore" className="btn-ghost">Explore posts</a>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-[16px] border p-6 shadow-card" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--primary)' }}>Highlights</div>
              <div className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                <div>• Rich text editor with image uploads</div>
                <div>• Built‑in SEO analyzer</div>
                <div>• Admin moderation workflow</div>
                <div>• Response caching + ETags</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div id="explore" className="flex items-center gap-3">
        <input className="input" placeholder="Search posts" value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1) }} />
      </div>
      {/* Trending strip (first few items) */}
      {!isFetching && !isError && data?.items?.length ? (
        <div className="flex gap-2 flex-wrap items-center" style={{ color: 'var(--muted)' }}>
          <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text)' }}>Trending:</span>
          {data.items.slice(0, 5).map((p: Post) => (
            <span key={p.id} className="chip chip-neutral truncate max-w-[200px]">{p.title}</span>
          ))}
        </div>
      ) : null}
      {isFetching && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-60" />
          ))}
        </div>
      )}
      {!isFetching && isError && (
        <Card className="text-center" style={{ color: 'var(--muted)' }}>Failed to load posts.</Card>
      )}
      {!isFetching && !isError && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items?.map((p: Post) => (
            <PostCard key={p.id} id={p.id} slug={p.slug} title={p.title} excerpt={p.excerpt} />
          ))}
          {!data?.items?.length && (
            <Card className="text-center" style={{ color: 'var(--muted)' }}>No posts yet.</Card>
          )}
        </div>
      )}
      <div className="flex items-center justify-center gap-3">
        <button className="btn btn-outline" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1, p-1))}>Prev</button>
        <span className="text-sm">Page {page}</span>
        <button className="btn btn-outline" disabled={(data?.items?.length||0) < 10} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  )
}
