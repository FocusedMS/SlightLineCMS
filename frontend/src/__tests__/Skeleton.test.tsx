import React from 'react'
import { render } from '@testing-library/react'
import { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, SkeletonButton } from '../components/ui/Skeleton'

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.firstChild as HTMLElement
    
    expect(skeleton).toHaveClass('animate-pulse', 'bg-bg-subtle', 'rounded')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />)
    const skeleton = container.firstChild as HTMLElement
    
    expect(skeleton).toHaveClass('custom-class')
  })

  it('renders with text variant', () => {
    const { container } = render(<Skeleton variant="text" />)
    const skeleton = container.firstChild as HTMLElement
    
    expect(skeleton).toHaveClass('h-4')
  })

  it('renders with circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />)
    const skeleton = container.firstChild as HTMLElement
    
    expect(skeleton).toHaveClass('rounded-full')
  })

  it('renders with rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />)
    const skeleton = container.firstChild as HTMLElement
    
    expect(skeleton).toHaveClass('rounded')
  })

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width={200} height={100} />)
    const skeleton = container.firstChild as HTMLElement
    
    expect(skeleton).toHaveStyle({ width: '200px', height: '100px' })
  })

  it('applies string width and height', () => {
    const { container } = render(<Skeleton width="50%" height="auto" />)
    const skeleton = container.firstChild as HTMLElement
    
    expect(skeleton).toHaveStyle({ width: '50%', height: 'auto' })
  })
})

describe('SkeletonText', () => {
  it('renders single line by default', () => {
    const { container } = render(<SkeletonText />)
    const lines = container.querySelectorAll('.animate-pulse')
    
    expect(lines).toHaveLength(1)
  })

  it('renders specified number of lines', () => {
    const { container } = render(<SkeletonText lines={3} />)
    const lines = container.querySelectorAll('.animate-pulse')
    
    expect(lines).toHaveLength(3)
  })

  it('applies custom className', () => {
    const { container } = render(<SkeletonText className="custom-class" />)
    const wrapper = container.firstChild as HTMLElement
    
    expect(wrapper).toHaveClass('custom-class')
  })

  it('last line has reduced width', () => {
    const { container } = render(<SkeletonText lines={2} />)
    const lines = container.querySelectorAll('.animate-pulse')
    const lastLine = lines[1] as HTMLElement
    
    expect(lastLine).toHaveStyle({ width: '75%' })
  })
})

describe('SkeletonCard', () => {
  it('renders with default structure', () => {
    const { container } = render(<SkeletonCard />)
    const card = container.firstChild as HTMLElement
    
    expect(card).toHaveClass('p-6', 'space-y-4')
  })

  it('contains image placeholder and text', () => {
    const { container } = render(<SkeletonCard />)
    const imagePlaceholder = container.querySelector('.rounded-\\[14px\\]')
    const textLines = container.querySelectorAll('.space-y-2')
    
    expect(imagePlaceholder).toBeInTheDocument()
    expect(textLines).toHaveLength(1)
  })

  it('applies custom className', () => {
    const { container } = render(<SkeletonCard className="custom-class" />)
    const card = container.firstChild as HTMLElement
    
    expect(card).toHaveClass('custom-class')
  })
})

describe('SkeletonAvatar', () => {
  it('renders with default size', () => {
    const { container } = render(<SkeletonAvatar />)
    const avatar = container.firstChild as HTMLElement
    
    expect(avatar).toHaveStyle({ width: '40px', height: '40px' })
  })

  it('renders with custom size', () => {
    const { container } = render(<SkeletonAvatar size={60} />)
    const avatar = container.firstChild as HTMLElement
    
    expect(avatar).toHaveStyle({ width: '60px', height: '60px' })
  })

  it('applies circular variant', () => {
    const { container } = render(<SkeletonAvatar />)
    const avatar = container.firstChild as HTMLElement
    
    expect(avatar).toHaveClass('rounded-full')
  })

  it('applies custom className', () => {
    const { container } = render(<SkeletonAvatar className="custom-class" />)
    const avatar = container.firstChild as HTMLElement
    
    expect(avatar).toHaveClass('custom-class')
  })
})

describe('SkeletonButton', () => {
  it('renders with button dimensions', () => {
    const { container } = render(<SkeletonButton />)
    const button = container.firstChild as HTMLElement
    
    expect(button).toHaveStyle({ height: '40px' })
  })

  it('applies rounded corners', () => {
    const { container } = render(<SkeletonButton />)
    const button = container.firstChild as HTMLElement
    
    expect(button).toHaveClass('rounded-lg')
  })

  it('applies custom className', () => {
    const { container } = render(<SkeletonButton className="custom-class" />)
    const button = container.firstChild as HTMLElement
    
    expect(button).toHaveClass('custom-class')
  })
})
