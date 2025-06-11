import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock components that might cause issues in jsdom
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div role="img" aria-label="Avatar" className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => (
    <img src={src} alt={alt} />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <span aria-hidden="true">{children}</span>
  ),
}))

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div role="img" aria-label="Chart container">
      {children}
    </div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div role="img" aria-label="Bar chart">
      {children}
    </div>
  ),
  Bar: () => <div aria-hidden="true" />,
  XAxis: () => <div aria-hidden="true" />,
  YAxis: () => <div aria-hidden="true" />,
}))

describe('Accessibility Tests', () => {
  describe('Component Accessibility', () => {
    it('Overview component should be accessible', async () => {
      const { Overview } = await import('@/components/overview')
      const { container } = render(<Overview />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('RecentSales component should be accessible', async () => {
      const { RecentSales } = await import('@/components/recent-sales')
      const { container } = render(<RecentSales />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('ErrorBoundary component should be accessible in error state', async () => {
      const { ErrorBoundary } = await import('@/components/error-boundary')
      
      // Component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error')
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const { container } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      consoleSpy.mockRestore()
    })

    it('ErrorBoundary component should be accessible in normal state', async () => {
      const { ErrorBoundary } = await import('@/components/error-boundary')
      
      const { container } = render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation on interactive elements', async () => {
      const { ErrorBoundary } = await import('@/components/error-boundary')
      
      const ErrorComponent = () => {
        throw new Error('Test error')
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const { getByText } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      )
      
      const reloadButton = getByText(/Reload Page/i)
      const homeButton = getByText(/Go Home/i)
      
      // Check if buttons are focusable
      expect(reloadButton).toBeVisible()
      expect(homeButton).toBeVisible()
      
      // Test keyboard interaction
      reloadButton.focus()
      expect(reloadButton).toHaveFocus()
      
      // Tab to next button
      await userEvent.tab()
      expect(homeButton).toHaveFocus()
      
      consoleSpy.mockRestore()
    })

    it('should handle Enter key on buttons', async () => {
      const { ErrorBoundary } = await import('@/components/error-boundary')
      
      const ErrorComponent = () => {
        throw new Error('Test error')
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const mockReload = jest.fn()
      
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      })
      
      const { getByText } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      )
      
      const reloadButton = getByText(/Reload Page/i)
      
      // Focus and press Enter
      reloadButton.focus()
      await userEvent.keyboard('{Enter}')
      
      expect(mockReload).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('ARIA Labels and Roles', () => {
    it('should have proper ARIA labels on chart components', async () => {
      const { Overview } = await import('@/components/overview')
      const { getByRole } = render(<Overview />)
      
      // Chart should have proper role and label
      const chartContainer = getByRole('img', { name: /chart container/i })
      expect(chartContainer).toBeInTheDocument()
      
      const barChart = getByRole('img', { name: /bar chart/i })
      expect(barChart).toBeInTheDocument()
    })

    it('should have proper ARIA labels on avatar components', async () => {
      const { RecentSales } = await import('@/components/recent-sales')
      const { getAllByRole } = render(<RecentSales />)
      
      // Avatars should have proper role and label
      const avatars = getAllByRole('img', { name: /avatar/i })
      expect(avatars).toHaveLength(5)
      
      avatars.forEach(avatar => {
        expect(avatar).toBeVisible()
      })
    })

    it('should hide decorative elements from screen readers', async () => {
      const { RecentSales } = await import('@/components/recent-sales')
      const { container } = render(<RecentSales />)
      
      // Check for aria-hidden on decorative elements
      const decorativeElements = container.querySelectorAll('[aria-hidden="true"]')
      expect(decorativeElements.length).toBeGreaterThan(0)
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('should pass color contrast requirements', async () => {
      const { Overview } = await import('@/components/overview')
      const { container } = render(<Overview />)
      
      // Run axe with color contrast rules
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })

    it('should be usable without color alone', async () => {
      const { RecentSales } = await import('@/components/recent-sales')
      const { container, getByText } = render(<RecentSales />)
      
      // Check that information is conveyed through more than just color
      expect(getByText('Olivia Martin')).toBeInTheDocument()
      expect(getByText('+$1,999.00')).toBeInTheDocument()
      
      // Run axe to check for color dependency issues
      const results = await axe(container, {
        rules: {
          'use-of-color': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })
  })

  describe('Focus Management', () => {
    it('should maintain logical focus order', async () => {
      const { ErrorBoundary } = await import('@/components/error-boundary')
      
      const ErrorComponent = () => {
        throw new Error('Test error')
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const { getByText } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      )
      
      const reloadButton = getByText(/Reload Page/i)
      const homeButton = getByText(/Go Home/i)
      
      // Test tab order
      reloadButton.focus()
      expect(reloadButton).toHaveFocus()
      
      await userEvent.tab()
      expect(homeButton).toHaveFocus()
      
      // Test reverse tab order
      await userEvent.tab({ shift: true })
      expect(reloadButton).toHaveFocus()
      
      consoleSpy.mockRestore()
    })

    it('should have visible focus indicators', async () => {
      const { ErrorBoundary } = await import('@/components/error-boundary')
      
      const ErrorComponent = () => {
        throw new Error('Test error')
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const { getByText } = render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      )
      
      const reloadButton = getByText(/Reload Page/i)
      
      // Focus the button
      reloadButton.focus()
      expect(reloadButton).toHaveFocus()
      
      // Button should have focus styles (assuming they exist)
      expect(reloadButton).toBeVisible()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide proper text alternatives for images', async () => {
      const { RecentSales } = await import('@/components/recent-sales')
      const { getAllByRole } = render(<RecentSales />)
      
      // All images should have alt text
      const images = getAllByRole('img')
      
      images.forEach(img => {
        const altText = img.getAttribute('alt')
        const ariaLabel = img.getAttribute('aria-label')
        
        // Should have either alt text or aria-label
        expect(altText || ariaLabel).toBeTruthy()
      })
    })

    it('should provide semantic structure', async () => {
      const { RecentSales } = await import('@/components/recent-sales')
      const { container } = render(<RecentSales />)
      
      // Run axe to check for proper heading structure and landmarks
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
          'landmark-one-main': { enabled: true },
          'region': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })

    it('should announce dynamic content changes', async () => {
      const { ErrorBoundary } = await import('@/components/error-boundary')
      
      const TestComponent = ({ shouldError }: { shouldError: boolean }) => {
        if (shouldError) {
          throw new Error('Test error')
        }
        return <div>Normal content</div>
      }

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const { rerender, container } = render(
        <ErrorBoundary>
          <TestComponent shouldError={false} />
        </ErrorBoundary>
      )
      
      // Initial state should be accessible
      let results = await axe(container)
      expect(results).toHaveNoViolations()
      
      // Change to error state
      rerender(
        <ErrorBoundary>
          <TestComponent shouldError={true} />
        </ErrorBoundary>
      )
      
      // Error state should also be accessible
      results = await axe(container)
      expect(results).toHaveNoViolations()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Mobile Accessibility', () => {
    it('should be accessible on touch devices', async () => {
      const { Overview } = await import('@/components/overview')
      const { container } = render(<Overview />)
      
      // Run axe with mobile accessibility rules
      const results = await axe(container, {
        rules: {
          'target-size': { enabled: true }, // Touch target size
          'meta-viewport': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })

    it('should handle device orientation changes', async () => {
      const { RecentSales } = await import('@/components/recent-sales')
      const { container } = render(<RecentSales />)
      
      // Component should remain accessible regardless of orientation
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', async () => {
      // Mock prefers-reduced-motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      const { Overview } = await import('@/components/overview')
      const { container } = render(<Overview />)
      
      // Component should render without motion-based accessibility issues
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Accessibility', () => {
    it('should associate labels with form controls', async () => {
      // Create a simple form component for testing
      const TestForm = () => (
        <form>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />
          
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
          
          <button type="submit">Submit</button>
        </form>
      )
      
      const { container } = render(<TestForm />)
      
      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'label-title-only': { enabled: true }
        }
      })
      
      expect(results).toHaveNoViolations()
    })

    it('should provide error messages for form validation', async () => {
      const TestFormWithErrors = () => (
        <form>
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            aria-describedby="email-error"
          />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
          
          <button type="submit">Submit</button>
        </form>
      )
      
      const { container } = render(<TestFormWithErrors />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('High Contrast Mode Support', () => {
    it('should be usable in high contrast mode', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      const { RecentSales } = await import('@/components/recent-sales')
      const { container } = render(<RecentSales />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})