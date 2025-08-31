import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from '../components/ui/Badge'

describe('Badge component', () => {
  it('renders children text', () => {
    render(<Badge variant="published">Published</Badge>)
    expect(screen.getByText('Published')).toBeDefined()
  })

  it('applies correct classes for status', () => {
    const { container } = render(<Badge variant="pending">Pending</Badge>)
    const span = container.firstChild as HTMLElement
    // Should have amber background when pending
    expect(span.className).toMatch(/amber/)
  })
})