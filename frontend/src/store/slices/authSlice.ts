import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../lib/api'

type User = { id: number; username: string; role: 'Blogger'|'Admin' }
type AuthState = { user: User|null; token: string|null; loading: boolean; error?: string }

const initial: AuthState = {
  user: JSON.parse(localStorage.getItem('user')||'null'),
  token: localStorage.getItem('token'),
  loading: false
}

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { usernameOrEmail: string; password: string }) => {
    const { data } = await api.post('/api/Auth/login', payload)
    return data as { token: string; expiresIn: number; user: User }
  }
)

const slice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    logout(state) {
      state.user = null; state.token = null
      localStorage.removeItem('user'); localStorage.removeItem('token')
    }
  },
  extraReducers: b => {
    b.addCase(login.pending, s => { s.loading = true; s.error = undefined })
     .addCase(login.fulfilled, (s, a) => {
       s.loading = false; s.user = a.payload.user; s.token = a.payload.token
       localStorage.setItem('user', JSON.stringify(a.payload.user))
       localStorage.setItem('token', a.payload.token)
     })
     .addCase(login.rejected, (s, a) => {
       s.loading = false; s.error = a.error.message || 'Login failed'
     })
  }
})

export const { logout } = slice.actions
export default slice.reducer
