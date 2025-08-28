import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card } from '../components/ui/Card'

type Post = { id: number; title: string; slug: string; excerpt?: string }

export default function Home() {
  const nav = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, isFetching } = useQuery({
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
      <section className="relative overflow-hidden rounded-3xl border bg-white p-8 md:p-12">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-500 bg-clip-text text-transparent">
                Write. Share. Grow.
              </span>
            </h1>
            <p className="text-gray-600 text-lg">A modern, fast and SEO‑friendly blogging platform. Browse posts, create rich content with a WYSIWYG editor, and get instant SEO suggestions.</p>
            <div className="flex gap-3 flex-wrap">
              <button className="btn btn-primary" onClick={()=>nav('/login')}>Start writing</button>
              <a href="#explore" className="btn btn-outline">Explore posts</a>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl border bg-white/90 backdrop-blur p-6 shadow-sm">
              <div className="text-sm font-medium text-brand-600 mb-2">Highlights</div>
              <div className="space-y-2 text-sm text-gray-600">
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
      <div className="grid md:grid-cols-2 gap-4">
        {data?.items?.map((p: Post) => (
          <Link
            to={`/post/${p.slug}`}
            key={p.id}
            className="transition-transform hover:-translate-y-1"
          >
            <Card className="h-full">
              <div className="text-lg font-semibold mb-1 truncate" title={p.title}>
                {p.title}
              </div>
              <p className="text-gray-600 text-sm overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {p.excerpt || 'No description'}
              </p>
            </Card>
          </Link>
        ))}
        {!data?.items?.length && (
          <Card className="text-gray-500 text-center">No posts yet.</Card>
        )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button className="btn btn-outline" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1, p-1))}>Prev</button>
        <span className="text-sm">Page {page}</span>
        <button className="btn btn-outline" disabled={(data?.items?.length||0) < 10} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  )
}
