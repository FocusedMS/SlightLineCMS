import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock Redux store
jest.mock('react-redux', () => ({
  useSelector: jest.fn()
}))

// Mock React Router
jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to}>Navigate to {to}</div>,
  useLocation: () => ({ pathname: '/admin' })
}))

import { useSelector } from 'react-redux'
import { AdminRoute } from '../components/RouteGuard'

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>

describe('AdminRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when user is admin', () => {
    mockUseSelector.mockReturnValue({
      user: { id: 1, username: 'admin', role: 'Admin' },
      token: 'valid-token'
    })

    render(
      <AdminRoute>
        <div>Admin Dashboard</div>
      </AdminRoute>
    )

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('redirects to dashboard when user is not admin', () => {
    mockUseSelector.mockReturnValue({
      user: { id: 1, username: 'blogger', role: 'Blogger' },
      token: 'valid-token'
    })

    render(
      <AdminRoute>
        <div>Admin Dashboard</div>
      </AdminRoute>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard')
  })

  it('redirects to login when not authenticated', () => {
    mockUseSelector.mockReturnValue({
      user: null,
      token: null
    })

    render(
      <AdminRoute>
        <div>Admin Dashboard</div>
      </AdminRoute>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
  })

  it('redirects to login when user is null but token exists', () => {
    mockUseSelector.mockReturnValue({
      user: null,
      token: 'valid-token'
    })

    render(
      <AdminRoute>
        <div>Admin Dashboard</div>
      </AdminRoute>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
  })

  it('redirects to login when user exists but token is null', () => {
    mockUseSelector.mockReturnValue({
      user: { id: 1, username: 'admin', role: 'Admin' },
      token: null
    })

    render(
      <AdminRoute>
        <div>Admin Dashboard</div>
      </AdminRoute>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
  })

  it('handles case-insensitive role comparison', () => {
    mockUseSelector.mockReturnValue({
      user: { id: 1, username: 'admin', role: 'admin' }, // lowercase
      token: 'valid-token'
    })

    render(
      <AdminRoute>
        <div>Admin Dashboard</div>
      </AdminRoute>
    )

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('handles undefined role gracefully', () => {
    mockUseSelector.mockReturnValue({
      user: { id: 1, username: 'user', role: undefined },
      token: 'valid-token'
    })

    render(
      <AdminRoute>
        <div>Admin Dashboard</div>
      </AdminRoute>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard')
  })
})
