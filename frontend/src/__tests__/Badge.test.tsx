import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from '../components/ui/Badge'

describe('Badge component', () => {
  it('renders children text', () => {
    render(<Badge status="success">Published</Badge>)
    expect(screen.getByText('Published')).toBeInTheDocument()
  })

  it('applies correct classes for status', () => {
    const { container } = render(<Badge status="warning">Pending</Badge>)
    const span = container.firstChild as HTMLElement
    // Should have amber background when warning
    expect(span.className).toMatch(/amber/)
  })
})