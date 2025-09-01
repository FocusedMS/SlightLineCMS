import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import Editor from '../pages/Editor'
import { api } from '../lib/api'

// Mock the API
jest.mock('../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }
}))

// Mock react-helmet-async
jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <div data-testid="helmet">{children}</div>
}))

// Mock ReactQuill
jest.mock('react-quill', () => {
  return function MockReactQuill({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
      <textarea
        data-testid="quill-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rich text editor"
      />
    )
  }
})

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

describe('Editor - HTML Converter Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApi.get.mockResolvedValue({ data: [] }) // Mock categories API
  })

  it('renders HTML converter section', () => {
    renderWithProviders(<Editor />)

    expect(screen.getByText('HTML Converter')).toBeInTheDocument()
    expect(screen.getByText('Paste HTML content to convert to blog post')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Paste your HTML content here/)).toBeInTheDocument()
  })

  it('extracts title from h1 tag and sets content', async () => {
    renderWithProviders(<Editor />)

    const htmlTextarea = screen.getByPlaceholderText(/Paste your HTML content here/)
    const htmlContent = `
      <h1>My Amazing Blog Post</h1>
      <p>This is the content of my blog post.</p>
      <h2>Subheading</h2>
      <p>More content here.</p>
    `

    fireEvent.change(htmlTextarea, { target: { value: htmlContent } })

    await waitFor(() => {
      // Check if title was extracted
      const titleInput = screen.getByDisplayValue('My Amazing Blog Post')
      expect(titleInput).toBeInTheDocument()
    })

    // Check if content was set in the editor
    const quillEditor = screen.getByTestId('quill-editor')
    expect(quillEditor).toHaveValue(htmlContent)
  })

  it('handles HTML content without h1 tag', async () => {
    renderWithProviders(<Editor />)

    const htmlTextarea = screen.getByPlaceholderText(/Paste your HTML content here/)
    const htmlContent = `
      <p>This is content without an h1 tag.</p>
      <h2>Subheading</h2>
      <p>More content here.</p>
    `

    fireEvent.change(htmlTextarea, { target: { value: htmlContent } })

    await waitFor(() => {
      // Title should remain empty since no h1 tag was found
      const titleInput = screen.getByPlaceholderText(/Enter your post title/)
      expect(titleInput).toHaveValue('')
    })

    // Content should still be set
    const quillEditor = screen.getByTestId('quill-editor')
    expect(quillEditor).toHaveValue(htmlContent)
  })

  it('handles complex HTML content with multiple h1 tags', async () => {
    renderWithProviders(<Editor />)

    const htmlTextarea = screen.getByPlaceholderText(/Paste your HTML content here/)
    const htmlContent = `
      <h1>First Title</h1>
      <p>Some content.</p>
      <h1>Second Title</h1>
      <p>More content.</p>
    `

    fireEvent.change(htmlTextarea, { target: { value: htmlContent } })

    await waitFor(() => {
      // Should extract the first h1 tag
      const titleInput = screen.getByDisplayValue('First Title')
      expect(titleInput).toBeInTheDocument()
    })
  })

  it('handles HTML content with nested tags in h1', async () => {
    renderWithProviders(<Editor />)

    const htmlTextarea = screen.getByPlaceholderText(/Paste your HTML content here/)
    const htmlContent = `
      <h1><strong>Bold Title</strong> with <em>emphasis</em></h1>
      <p>Content here.</p>
    `

    fireEvent.change(htmlTextarea, { target: { value: htmlContent } })

    await waitFor(() => {
      // Should extract text content without HTML tags
      const titleInput = screen.getByDisplayValue('Bold Title with emphasis')
      expect(titleInput).toBeInTheDocument()
    })
  })

  it('handles empty HTML content', async () => {
    renderWithProviders(<Editor />)

    const htmlTextarea = screen.getByPlaceholderText(/Paste your HTML content here/)

    fireEvent.change(htmlTextarea, { target: { value: '' } })

    // Should not cause any errors
    expect(htmlTextarea).toHaveValue('')
  })

  it('handles HTML content with special characters', async () => {
    renderWithProviders(<Editor />)

    const htmlTextarea = screen.getByPlaceholderText(/Paste your HTML content here/)
    const htmlContent = `
      <h1>Title with "quotes" & symbols</h1>
      <p>Content with <a href="http://example.com">links</a> and <code>code</code>.</p>
    `

    fireEvent.change(htmlTextarea, { target: { value: htmlContent } })

    await waitFor(() => {
      const titleInput = screen.getByDisplayValue('Title with "quotes" & symbols')
      expect(titleInput).toBeInTheDocument()
    })
  })

  it('shows helpful information about HTML converter', () => {
    renderWithProviders(<Editor />)

    expect(screen.getByText(/This will automatically extract the title from <h1> tags and set the content/)).toBeInTheDocument()
  })

  it('maintains existing form functionality alongside HTML converter', async () => {
    renderWithProviders(<Editor />)

    // Test that regular form inputs still work
    const titleInput = screen.getByPlaceholderText(/Enter your post title/)
    fireEvent.change(titleInput, { target: { value: 'Manual Title' } })

    expect(titleInput).toHaveValue('Manual Title')

    // Test that HTML converter still works
    const htmlTextarea = screen.getByPlaceholderText(/Paste your HTML content here/)
    const htmlContent = '<h1>HTML Title</h1><p>Content</p>'

    fireEvent.change(htmlTextarea, { target: { value: htmlContent } })

    await waitFor(() => {
      expect(titleInput).toHaveValue('HTML Title')
    })
  })

  it('handles malformed HTML gracefully', async () => {
    renderWithProviders(<Editor />)

    const htmlTextarea = screen.getByPlaceholderText(/Paste your HTML content here/)
    const malformedHtml = `
      <h1>Unclosed tag
      <p>Content with <strong>unclosed bold
      <h2>Another heading</h2>
    `

    fireEvent.change(htmlTextarea, { target: { value: malformedHtml } })

    await waitFor(() => {
      // Should still extract what it can
      const titleInput = screen.getByDisplayValue('Unclosed tag')
      expect(titleInput).toBeInTheDocument()
    })
  })

  it('preserves HTML formatting in content', async () => {
    renderWithProviders(<Editor />)

    const htmlTextarea = screen.getByPlaceholderText(/Paste your HTML content here/)
    const htmlContent = `
      <h1>Formatted Post</h1>
      <p>This is a <strong>bold</strong> and <em>italic</em> text.</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
    `

    fireEvent.change(htmlTextarea, { target: { value: htmlContent } })

    await waitFor(() => {
      const quillEditor = screen.getByTestId('quill-editor')
      expect(quillEditor).toHaveValue(htmlContent)
    })
  })
})
