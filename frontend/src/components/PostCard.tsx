import { Link } from 'react-router-dom'

type PostCardProps = {
  id: number
  slug: string
  title: string
  excerpt?: string | null
  coverImageUrl?: string | null
}

export default function PostCard({ id, slug, title, excerpt, coverImageUrl }: PostCardProps) {
  const api = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000'
  return (
    <Link to={`/post/${slug}`} className="group block transition-transform hover:-translate-y-1">
      <div className="card overflow-hidden p-0">
        {coverImageUrl ? (
          <div className="w-full aspect-video overflow-hidden">
            <img
              loading="lazy"
              src={`${api}${coverImageUrl}`}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        ) : null}
        <div className="p-4">
          <div className="font-semibold truncate" title={title}>{title}</div>
          <p className="text-sm" style={{ color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {excerpt || 'No description'}
          </p>
        </div>
      </div>
    </Link>
  )
}


