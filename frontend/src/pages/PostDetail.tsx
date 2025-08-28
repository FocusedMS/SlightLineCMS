import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Helmet } from 'react-helmet-async'

export default function PostDetail() {
  const { slug } = useParams()
  const { data } = useQuery({
    queryKey: ['post', slug],
    queryFn: async () => (await api.get(`/api/Posts/${slug}`)).data
  })

  if (!data) return <p>Loading…</p>

  return (
    <article className="prose max-w-none card p-6">
      <Helmet>
        <title>{data.title} • Blog</title>
        <meta name="description" content={data.excerpt || data.title} />
        <meta property="og:title" content={data.title}/>
        <meta property="og:description" content={data.excerpt || data.title}/>
        {data.coverImageUrl && <meta property="og:image" content={`${import.meta.env.VITE_API_BASE_URL}${data.coverImageUrl}`}/>}
        <meta name="twitter:card" content="summary_large_image"/>
      </Helmet>

      <h1>{data.title}</h1>
      {data.coverImageUrl && <img src={`${import.meta.env.VITE_API_BASE_URL}${data.coverImageUrl}`} alt="" />}
      <div dangerouslySetInnerHTML={{ __html: data.contentHtml }} />
    </article>
  )
}
