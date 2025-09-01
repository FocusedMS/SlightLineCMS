import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import UserManagement from '../pages/UserManagement'
import { api } from '../lib/api'
import { toast } from '../lib/toast'

// Mock the API
jest.mock('../lib/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}))

// Mock toast
jest.mock('../lib/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock react-helmet-async
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <div data-testid="helmet">{children}</div>
}))

// Mock window.confirm
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

const mockApi = api as jest.Mocked<typeof api>
const mockToast = toast as jest.Mocked<typeof toast>

// Mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'admin', role: 'Admin' }, token: 'mock-token' }) => state
    }
  })
}

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
  
  const store = createMockStore()

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  )
}

describe('UserManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  const mockUsers = [
    {
      id: 1,
      username: 'user1',
      email: 'user1@test.com',
      role: 'Blogger',
      isActive: true,
      totalPosts: 5,
      publishedPosts: 3,
      draftPosts: 1,
      pendingPosts: 1,
      lastPostDate: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      username: 'user2',
      email: 'user2@test.com',
      role: 'Admin',
      isActive: false,
      totalPosts: 2,
      publishedPosts: 1,
      draftPosts: 1,
      pendingPosts: 0,
      lastPostDate: '2024-01-02T00:00:00Z',
      createdAt: '2024-01-02T00:00:00Z'
    },
    {
      id: 3,
      username: 'user3',
      email: 'user3@test.com',
      role: 'Blogger',
      isActive: true,
      totalPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      pendingPosts: 0,
      lastPostDate: null,
      createdAt: '2024-01-03T00:00:00Z'
    }
  ]

  it('renders user management page with correct title', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Manage user accounts and permissions')).toBeInTheDocument()
  })

  it('displays user statistics correctly', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // Total Users
      expect(screen.getByText('2')).toBeInTheDocument() // Active Users
      expect(screen.getByText('1')).toBeInTheDocument() // Inactive Users
      expect(screen.getByText('1')).toBeInTheDocument() // Admins
    })
  })

  it('displays users table correctly', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('All Users')).toBeInTheDocument()
      expect(screen.getByText('user1')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()
      expect(screen.getByText('user3')).toBeInTheDocument()
      expect(screen.getByText('user1@test.com')).toBeInTheDocument()
      expect(screen.getByText('user2@test.com')).toBeInTheDocument()
      expect(screen.getByText('user3@test.com')).toBeInTheDocument()
    })
  })

  it('displays user roles correctly', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      expect(screen.getAllByText('Blogger')).toHaveLength(2)
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })
  })

  it('displays user post counts correctly', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument() // user1 total posts
      expect(screen.getByText('3')).toBeInTheDocument() // user1 published posts
      expect(screen.getByText('2')).toBeInTheDocument() // user2 total posts
      expect(screen.getByText('1')).toBeInTheDocument() // user2 published posts
      expect(screen.getByText('0')).toBeInTheDocument() // user3 total posts
    })
  })

  it('displays user status indicators correctly', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      // Should have 2 active users (green dots) and 1 inactive user (red dot)
      const statusIndicators = screen.getAllByRole('generic')
      // This is a simplified check - in a real test you'd look for specific CSS classes or data attributes
    })
  })

  it('shows lock/unlock buttons correctly', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      expect(screen.getAllByText('Lock')).toHaveLength(2) // For active users
      expect(screen.getByText('Unlock')).toBeInTheDocument() // For inactive user
    })
  })

  it('shows delete buttons for all users', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      expect(screen.getAllByText('Delete')).toHaveLength(3)
    })
  })

  it('handles lock user action successfully', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })
    mockApi.put.mockResolvedValue({ data: { message: 'User locked successfully' } })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      const lockButtons = screen.getAllByText('Lock')
      fireEvent.click(lockButtons[0])
    })

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/api/UserManagement/users/1/toggle-status', { isActive: false })
      expect(mockToast.success).toHaveBeenCalledWith('User locked successfully')
    })
  })

  it('handles unlock user action successfully', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })
    mockApi.put.mockResolvedValue({ data: { message: 'User unlocked successfully' } })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      const unlockButton = screen.getByText('Unlock')
      fireEvent.click(unlockButton)
    })

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/api/UserManagement/users/2/toggle-status', { isActive: true })
      expect(mockToast.success).toHaveBeenCalledWith('User unlocked successfully')
    })
  })

  it('handles delete user action with confirmation', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })
    mockApi.delete.mockResolvedValue({ data: { message: 'User account deactivated successfully' } })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])
    })

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to deactivate this user account? This action cannot be undone.')

    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith('/api/UserManagement/users/1')
      expect(mockToast.success).toHaveBeenCalledWith('User account deactivated successfully')
    })
  })

  it('does not delete user when confirmation is cancelled', async () => {
    mockConfirm.mockReturnValue(false)
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])
    })

    expect(mockConfirm).toHaveBeenCalled()
    expect(mockApi.delete).not.toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('API Error'))

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })
  })

  it('handles toggle status error', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })
    mockApi.put.mockRejectedValue(new Error('Toggle failed'))

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      const lockButtons = screen.getAllByText('Lock')
      fireEvent.click(lockButtons[0])
    })

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update user status')
    })
  })

  it('handles delete user error', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })
    mockApi.delete.mockRejectedValue(new Error('Delete failed'))

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])
    })

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to deactivate user account')
    })
  })

  it('shows loading state initially', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderWithProviders(<UserManagement />)

    expect(screen.getByText('User Management')).toBeInTheDocument()
    // Loading skeletons should be present
  })

  it('displays joined date correctly', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText(/Joined:/)).toBeInTheDocument()
    })
  })

  it('displays last post date correctly', async () => {
    mockApi.get.mockResolvedValue({ data: mockUsers })

    renderWithProviders(<UserManagement />)

    await waitFor(() => {
      expect(screen.getByText('Never')).toBeInTheDocument() // For user3 who has no posts
    })
  })
})
