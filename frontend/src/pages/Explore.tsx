import { useState, useEffect } from 'react'
import PostCard from '../components/PostCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { api } from '../lib/api'

interface Post {
  id: number
  title: string
  slug: string
  excerpt: string
  coverImageUrl?: string
  status: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  authorId: number
  categoryId?: number
}

interface Category {
  id: number
  name: string
  slug: string
}

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('publishedAt')

  useEffect(() => {
    fetchCategories()
    fetchPosts()
  }, [currentPage, selectedCategory, sortBy])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/Categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '12',
        sortBy,
        status: '2' // Published posts only
      })
      
      if (selectedCategory) {
        params.append('categoryId', selectedCategory)
      }
      
      const response = await api.get(`/api/Posts?${params}`)
      setPosts(response.data.items || response.data)
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    // TODO: Implement search API endpoint
    fetchPosts()
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 2: return <Badge status="published">Published</Badge>
      case 1: return <Badge status="pending">Pending</Badge>
      case 0: return <Badge status="draft">Draft</Badge>
      default: return <Badge status="neutral">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-brand-400 to-accent-cyan bg-clip-text text-transparent">
            Explore
          </span>
          <span className="text-white"> Stories</span>
        </h1>
        <p className="text-xl text-text-soft max-w-2xl mx-auto">
          Discover insights, tutorials, and perspectives from our community of creators
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full"
              >
                <option value="publishedAt">Latest</option>
                <option value="createdAt">Newest</option>
                <option value="title">Title A-Z</option>
              </Select>
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="space-y-4">
                <div className="h-48 bg-bg-subtle rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-bg-subtle rounded w-3/4"></div>
                  <div className="h-4 bg-bg-subtle rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                id={post.id}
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                coverImageUrl={post.coverImageUrl}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-text-soft">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🔍</div>
            <h3 className="text-xl font-semibold text-white">No posts found</h3>
            <p className="text-text-soft">
              Try adjusting your search terms or category filter
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
                setCurrentPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
