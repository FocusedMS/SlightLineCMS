import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock Redux store
jest.mock('react-redux', () => ({
  useSelector: jest.fn()
}))

// Mock React Router
jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to}>Navigate to {to}</div>,
  useLocation: () => ({ pathname: '/test' })
}))

import { useSelector } from 'react-redux'
import { RouteGuard } from '../components/RouteGuard'

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>

describe('RouteGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when authenticated', () => {
    mockUseSelector.mockReturnValue({
      user: { id: 1, username: 'test', role: 'Blogger' },
      token: 'valid-token'
    })

    render(
      <RouteGuard>
        <div>Protected Content</div>
      </RouteGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    mockUseSelector.mockReturnValue({
      user: null,
      token: null
    })

    render(
      <RouteGuard>
        <div>Protected Content</div>
      </RouteGuard>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login')
  })

  it('allows guest access when allowGuest is true', () => {
    mockUseSelector.mockReturnValue({
      user: null,
      token: null
    })

    render(
      <RouteGuard allowGuest>
        <div>Guest Content</div>
      </RouteGuard>
    )

    expect(screen.getByText('Guest Content')).toBeInTheDocument()
  })

  it('enforces role-based access control', () => {
    mockUseSelector.mockReturnValue({
      user: { id: 1, username: 'blogger', role: 'Blogger' },
      token: 'valid-token'
    })

    render(
      <RouteGuard requiredRole="Admin">
        <div>Admin Only Content</div>
      </RouteGuard>
    )

    expect(screen.getByTestId('navigate')).toBeInTheDocument()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/dashboard')
  })

  it('allows admin to access any role-restricted content', () => {
    mockUseSelector.mockReturnValue({
      user: { id: 1, username: 'admin', role: 'Admin' },
      token: 'valid-token'
    })

    render(
      <RouteGuard requiredRole="Blogger">
        <div>Blogger Content</div>
      </RouteGuard>
    )

    expect(screen.getByText('Blogger Content')).toBeInTheDocument()
  })
})
