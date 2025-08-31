import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { Suspense, lazy } from 'react'
import { Container } from './components/layout/Container'
const Home = lazy(() => import('./pages/Home'))
const Explore = lazy(() => import('./pages/Explore'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Editor = lazy(() => import('./pages/Editor'))
const Moderation = lazy(() => import('./pages/Moderation'))
import { GuestRoute, AuthenticatedRoute, AdminRoute } from './components/RouteGuard'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col relative bg-bg grid-bg">
        <Navbar />
        <main className="flex-1 relative z-10 py-8 md:py-10">
          <Suspense fallback={<div>Loading…</div>}>
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/explore" element={<Explore/>} />
            <Route path="/post/:slug" element={<PostDetail/>} />
            <Route path="/login" element={<GuestRoute><Login/></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register/></GuestRoute>} />
            {/* create */}
            <Route path="/editor" element={<AuthenticatedRoute><Editor/></AuthenticatedRoute>} />
            {/* edit (id in path) */}
            <Route path="/editor/:id" element={<AuthenticatedRoute><Editor/></AuthenticatedRoute>} />
            <Route path="/dashboard" element={<AuthenticatedRoute><Dashboard/></AuthenticatedRoute>} />
            <Route path="/moderation" element={<AdminRoute><Moderation/></AdminRoute>} />
          </Routes>
          </Suspense>
        </main>
        <footer className="relative border-t" style={{ background: 'color-mix(in srgb, var(--surface) 85%, transparent)' }}>
          <Container size="wide" className="py-6 text-sm" style={{ color: 'var(--muted)' }}>© {new Date().getFullYear()} Sightline CMS — See the whole story. Publish with precision.</Container>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
