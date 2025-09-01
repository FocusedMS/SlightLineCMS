import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import AdminDashboard from '../pages/AdminDashboard'
import { api } from '../lib/api'

// Mock the API
jest.mock('../lib/api', () => ({
  api: {
    get: jest.fn()
  }
}))

// Mock react-helmet-async
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <div data-testid="helmet">{children}</div>
}))

const mockApi = api as jest.Mocked<typeof api>

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

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockDashboardData = {
    posts: {
      total: 10,
      last24Hours: 2,
      last7Days: 5,
      last30Days: 8,
      published: 7,
      draft: 2,
      pendingReview: 1
    },
    users: {
      total: 25,
      last24Hours: 3,
      last7Days: 8,
      last30Days: 15,
      active: 23,
      inactive: 2
    },
    categories: {
      total: 5,
      withPosts: 4
    },
    recentPosts: [
      {
        id: 1,
        title: 'Test Post 1',
        author: 'user1',
        category: 'Technology',
        status: 'Published',
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        title: 'Test Post 2',
        author: 'user2',
        category: 'Business',
        status: 'Draft',
        createdAt: '2024-01-02T00:00:00Z'
      }
    ],
    recentUsers: [
      {
        id: 1,
        username: 'user1',
        email: 'user1@test.com',
        role: 'Blogger',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        username: 'user2',
        email: 'user2@test.com',
        role: 'Admin',
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z'
      }
    ]
  }

  const mockCategoryStats = [
    {
      categoryId: 1,
      categoryName: 'Technology',
      totalPosts: 5,
      publishedPosts: 4,
      draftPosts: 1,
      pendingPosts: 0,
      lastPostDate: '2024-01-01T00:00:00Z'
    },
    {
      categoryId: 2,
      categoryName: 'Business',
      totalPosts: 3,
      publishedPosts: 2,
      draftPosts: 1,
      pendingPosts: 0,
      lastPostDate: '2024-01-02T00:00:00Z'
    }
  ]

  const mockUserActivity = [
    {
      userId: 1,
      username: 'user1',
      email: 'user1@test.com',
      role: 'Blogger',
      isActive: true,
      totalPosts: 5,
      publishedPosts: 4,
      lastPostDate: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      userId: 2,
      username: 'user2',
      email: 'user2@test.com',
      role: 'Admin',
      isActive: true,
      totalPosts: 3,
      publishedPosts: 2,
      lastPostDate: '2024-01-02T00:00:00Z',
      createdAt: '2024-01-02T00:00:00Z'
    }
  ]

  it('renders admin dashboard with correct title', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockDashboardData })
      .mockResolvedValueOnce({ data: mockCategoryStats })
      .mockResolvedValueOnce({ data: mockUserActivity })

    renderWithProviders(<AdminDashboard />)

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Comprehensive metrics and user management')).toBeInTheDocument()
  })

  it('displays key metrics correctly', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockDashboardData })
      .mockResolvedValueOnce({ data: mockCategoryStats })
      .mockResolvedValueOnce({ data: mockUserActivity })

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument() // Total Posts
      expect(screen.getByText('25')).toBeInTheDocument() // Total Users
      expect(screen.getByText('5')).toBeInTheDocument() // Categories
      expect(screen.getByText('7')).toBeInTheDocument() // Published Posts
    })
  })

  it('displays recent posts correctly', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockDashboardData })
      .mockResolvedValueOnce({ data: mockCategoryStats })
      .mockResolvedValueOnce({ data: mockUserActivity })

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Recent Posts')).toBeInTheDocument()
      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      expect(screen.getByText('Test Post 2')).toBeInTheDocument()
      expect(screen.getByText('by user1 • Technology')).toBeInTheDocument()
      expect(screen.getByText('by user2 • Business')).toBeInTheDocument()
    })
  })

  it('displays recent users correctly', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockDashboardData })
      .mockResolvedValueOnce({ data: mockCategoryStats })
      .mockResolvedValueOnce({ data: mockUserActivity })

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Recent Users')).toBeInTheDocument()
      expect(screen.getByText('user1')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()
      expect(screen.getByText('user1@test.com')).toBeInTheDocument()
      expect(screen.getByText('user2@test.com')).toBeInTheDocument()
    })
  })

  it('displays category statistics correctly', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockDashboardData })
      .mockResolvedValueOnce({ data: mockCategoryStats })
      .mockResolvedValueOnce({ data: mockUserActivity })

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Category Statistics')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
      expect(screen.getByText('Business')).toBeInTheDocument()
    })
  })

  it('displays user activity correctly', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockDashboardData })
      .mockResolvedValueOnce({ data: mockCategoryStats })
      .mockResolvedValueOnce({ data: mockUserActivity })

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('User Activity')).toBeInTheDocument()
      expect(screen.getByText('user1')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    mockApi.get.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderWithProviders(<AdminDashboard />)

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    // Loading skeletons should be present
  })

  it('handles API errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('API Error'))

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
    })
  })

  it('displays post status badges correctly', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockDashboardData })
      .mockResolvedValueOnce({ data: mockCategoryStats })
      .mockResolvedValueOnce({ data: mockUserActivity })

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Published')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })
  })

  it('displays user role badges correctly', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockDashboardData })
      .mockResolvedValueOnce({ data: mockCategoryStats })
      .mockResolvedValueOnce({ data: mockUserActivity })

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Blogger')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })
  })

  it('displays last updated timestamp', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: mockDashboardData })
      .mockResolvedValueOnce({ data: mockCategoryStats })
      .mockResolvedValueOnce({ data: mockUserActivity })

    renderWithProviders(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })
  })
})
