import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Helmet } from 'react-helmet-async'
import { Skeleton } from '../components/ui/Skeleton'
import { Container } from '../components/layout/Container'

export default function PostDetail() {
  const { slug } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => (await api.get(`/api/Posts/${slug}`)).data
  })

  if (isLoading) return (
    <Container size="content">
      <article className="card p-6 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </article>
    </Container>
  )

  if (!data) return null

  return (
    <Container size="content">
      <article className="prose max-w-none card p-6">
      <Helmet>
        <title>{data.title} • Sightline</title>
        <meta name="description" content={data.excerpt || data.title} />
        <meta property="og:title" content={data.title}/>
        <meta property="og:description" content={data.excerpt || data.title}/>
        {data.coverImageUrl && <meta property="og:image" content={`${import.meta.env.VITE_API_BASE_URL}${data.coverImageUrl}`}/>}
        <meta name="twitter:card" content="summary_large_image"/>
      </Helmet>

      <h1>{data.title}</h1>
      {data.coverImageUrl && <img loading="lazy" src={`${import.meta.env.VITE_API_BASE_URL}${data.coverImageUrl}`} alt="" className="rounded-lg" />}
      <div className="leading-8" dangerouslySetInnerHTML={{ __html: data.contentHtml }} />
      </article>
    </Container>
  )
}
