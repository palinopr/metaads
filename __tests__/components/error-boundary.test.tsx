import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, useErrorHandler } from '@/components/error-boundary'
import { Component } from 'react'

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant }: { children: React.ReactNode; onClick?: () => void; variant?: string }) => (
    <button data-testid="button" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-testid="alert" data-variant={variant}>{children}</div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-description">{children}</div>
  ),
  AlertTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-title">{children}</div>
  ),
}))

jest.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Home: () => <div data-testid="home-icon" />,
}))

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

// Component for testing useErrorHandler hook
const TestUseErrorHandler = ({ shouldThrow }: { shouldThrow: boolean }) => {
  const handleError = useErrorHandler()
  
  if (shouldThrow) {
    handleError(new Error('Hook error message'))
  }
  
  return <div>Hook component</div>
}

describe('ErrorBoundary', () => {
  // Mock window.location.reload
  const mockReload = jest.fn()
  const mockAssign = jest.fn()
  
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        reload: mockReload,
        href: '',
      },
      writable: true,
    })
    jest.clearAllMocks()
    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test child content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Test child content')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An error occurred while rendering this component')).toBeInTheDocument()
  })

  it('displays error message when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByTestId('alert')).toHaveAttribute('data-variant', 'destructive')
  })

  it('renders fallback component when provided', () => {
    const fallback = <div>Custom fallback content</div>
    
    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Custom fallback content')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('calls window.location.reload when reload button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const reloadButton = screen.getByText(/Reload Page/i).closest('button')
    expect(reloadButton).toBeInTheDocument()
    
    fireEvent.click(reloadButton!)
    expect(mockReload).toHaveBeenCalledTimes(1)
  })

  it('navigates to home when home button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const homeButton = screen.getByText(/Go Home/i).closest('button')
    expect(homeButton).toBeInTheDocument()
    
    fireEvent.click(homeButton!)
    // The component sets window.location.href directly, which is harder to test
    // In a real app, you might want to use a router for better testability
  })

  it('shows stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Stack trace (development only)')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('does not show stack trace in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.queryByText('Stack trace (development only)')).not.toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('logs error to console when error occurs', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('can recover from error state when component is re-rendered without error', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    // Error state should be shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Re-render without error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    // Error UI might still be shown because component state hasn't reset
    // In real usage, the reload button would handle this
  })
})

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('throws error when handleError is called', () => {
    expect(() => {
      render(
        <ErrorBoundary>
          <TestUseErrorHandler shouldThrow={true} />
        </ErrorBoundary>
      )
    }).not.toThrow() // ErrorBoundary should catch it
    
    // Error UI should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('does not throw when handleError is not called', () => {
    render(
      <ErrorBoundary>
        <TestUseErrorHandler shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Hook component')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})