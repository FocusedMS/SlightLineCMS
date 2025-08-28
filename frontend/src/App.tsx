import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { Suspense, lazy } from 'react'
const Home = lazy(() => import('./pages/Home'))
const Explore = lazy(() => import('./pages/Explore'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Editor = lazy(() => import('./pages/Editor'))
const Moderation = lazy(() => import('./pages/Moderation'))
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col relative bg-bg grid-bg">
      <Navbar />
      <main className="container py-8 md:py-10 flex-1 relative z-10">
        <Suspense fallback={<div>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/explore" element={<Explore/>} />
          <Route path="/post/:slug" element={<PostDetail/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          {/* create */}
          <Route path="/editor" element={<ProtectedRoute><Editor/></ProtectedRoute>} />
          {/* edit (id in path) */}
          <Route path="/editor/:id" element={<ProtectedRoute><Editor/></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
          <Route path="/moderation" element={<AdminRoute><Moderation/></AdminRoute>} />
        </Routes>
        </Suspense>
      </main>
      <footer className="relative border-t" style={{ background: 'color-mix(in srgb, var(--surface) 85%, transparent)' }}>
        <div className="container py-6 text-sm" style={{ color: 'var(--muted)' }}>© {new Date().getFullYear()} Sightline CMS — See the whole story. Publish with precision.</div>
      </footer>
    </div>
  )
}
