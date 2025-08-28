import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { Suspense, lazy } from 'react'
const Home = lazy(() => import('./pages/Home'))
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
    <div className="min-h-screen flex flex-col relative">
      <div className="bg-grid absolute inset-0 opacity-40 pointer-events-none" />
      <Navbar />
      <main className="container py-6 flex-1 relative">
        <Suspense fallback={<div>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home/>} />
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
      <footer className="border-t bg-white/80 backdrop-blur relative">
        <div className="container py-6 text-sm text-gray-500">© {new Date().getFullYear()} Sightline CMS — See the whole story. Publish with precision.</div>
      </footer>
    </div>
  )
}
