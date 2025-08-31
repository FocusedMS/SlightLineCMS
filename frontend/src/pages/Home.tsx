import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import PostCard from '../components/PostCard'
import { Container } from '../components/layout/Container'

type Post = { 
  id: number; 
  title: string; 
  slug: string; 
  excerpt?: string; 
  coverImageUrl?: string;
  publishedAt?: string;
  categoryId?: number;
}

export default function Home() {
  const nav = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [totalPosts, setTotalPosts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        setPage(1)
        fetchPosts()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const { data, isFetching, isError } = useQuery({
    queryKey: ['posts', { page, pageSize: 12, search }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '12'
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }
      
      const response = await api.get(`/api/Posts?${params}`)
      setTotalPosts(response.data.total || 0)
      setTotalPages(Math.ceil((response.data.total || 0) / 12))
      return response.data
    },
    enabled: search === '' || search.length >= 2
  })

  const fetchPosts = async () => {
    // This will be called by the debounced search effect
    // The query will automatically refetch
  }

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Home • Blog</title>
        <meta
          name="description"
          content="Browse the latest published posts on our blog."
        />
      </Helmet>
      {/* Hero Section */}
      <Container size="full" className="py-8 md:py-12">
        <section className="relative overflow-hidden rounded-[18px] bg-bg-raised border border-white/8 p-8 md:p-12 shadow-card">
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-brand-400 to-accent-cyan bg-clip-text text-transparent">
                Write. Share. Grow.
              </span>
            </h1>
            <p className="text-xl text-text-soft leading-relaxed">
              A modern, fast and SEO‑friendly blogging platform. Browse posts, create rich content with a WYSIWYG editor, and get instant SEO suggestions.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button variant="primary" onClick={() => nav('/login')}>
                Start writing
              </Button>
              <Button variant="secondary" onClick={() => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore posts
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <Card className="p-6">
              <div className="text-sm font-semibold mb-3 text-brand-300">Highlights</div>
              <div className="space-y-2 text-sm text-text-soft">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-emerald" />
                  Rich text editor with image uploads
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-cyan" />
                  Built‑in SEO analyzer
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-amber" />
                  Admin moderation workflow
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-rose" />
                  Response caching + ETags
                </div>
              </div>
            </Card>
          </div>
        </div>
        </section>
      </Container>
      {/* Search Section */}
      <Container size="wide">
        <div id="explore" className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-white">Discover Stories</h2>
          <p className="text-text-soft">Search through our collection of published posts</p>
        </div>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search posts by title or excerpt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
              >
                Clear
              </Button>
            )}
          </div>
          
          {/* Results count */}
          {search && (
            <div className="mt-4 text-sm text-text-soft">
              {totalPosts} post{totalPosts !== 1 ? 's' : ''} found for "{search}"
            </div>
          )}
        </Card>
        </div>
      </Container>
      {/* Posts Grid */}
      <Container size="wide">
        {isFetching && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-48 bg-bg-subtle rounded-[14px]"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-bg-subtle rounded w-3/4"></div>
                    <div className="h-4 bg-bg-subtle rounded w-1/2"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {!isFetching && isError && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">⚠️</div>
              <h3 className="text-xl font-semibold text-white">Failed to load posts</h3>
              <p className="text-text-soft">Please try again later</p>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </Card>
        )}
        
        {!isFetching && !isError && data?.items && (
          <>
            {data.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {data.items.map((p: Post) => (
                  <PostCard 
                    key={p.id} 
                    id={p.id} 
                    slug={p.slug} 
                    title={p.title} 
                    excerpt={p.excerpt}
                    coverImageUrl={p.coverImageUrl}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">📝</div>
                  <h3 className="text-xl font-semibold text-white">No posts found</h3>
                  <p className="text-text-soft">
                    {search ? `No posts match "${search}"` : 'No posts have been published yet.'}
                  </p>
                  {search && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearch('')
                        setPage(1)
                      }}
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              </Card>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-text-soft">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  )
}
