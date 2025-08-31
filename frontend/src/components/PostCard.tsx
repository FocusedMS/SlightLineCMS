import { Link } from 'react-router-dom'
import { Card } from './ui/Card'

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
      <Card className="overflow-hidden p-0 hover:shadow-card transition-all duration-300">
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
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white group-hover:text-brand-200 transition mb-3 line-clamp-2">
            {title}
          </h3>
          <p className="text-text-soft line-clamp-3 leading-relaxed">
            {excerpt || 'No description available'}
          </p>
        </div>
      </Card>
    </Link>
  )
}


