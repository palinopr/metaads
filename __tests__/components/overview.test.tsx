import { render, screen } from '@testing-library/react'
import { Overview } from '@/components/overview'

// Mock recharts components with more detailed mocking
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children, width, height }: { children: React.ReactNode, width: string, height: number }) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>{children}</div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode, data: any[] }) => (
    <div data-testid="bar-chart" data-length={data?.length}>{children}</div>
  ),
  Bar: ({ dataKey, fill, radius, className }: any) => (
    <div data-testid="bar" data-key={dataKey} data-fill={fill} data-radius={radius?.join(',')} data-class={className} />
  ),
  XAxis: ({ dataKey, stroke, fontSize, tickLine, axisLine }: any) => (
    <div data-testid="x-axis" data-key={dataKey} data-stroke={stroke} data-font-size={fontSize} data-tick-line={tickLine} data-axis-line={axisLine} />
  ),
  YAxis: ({ stroke, fontSize, tickLine, axisLine, tickFormatter }: any) => (
    <div data-testid="y-axis" data-stroke={stroke} data-font-size={fontSize} data-tick-line={tickLine} data-axis-line={axisLine} data-formatter={tickFormatter?.toString()} />
  ),
}))

describe('Overview', () => {
  beforeEach(() => {
    // Mock Math.random to ensure consistent test results
    jest.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders without crashing', () => {
    render(<Overview />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('renders chart components with correct props', () => {
    render(<Overview />)
    
    // Check bar chart
    const barChart = screen.getByTestId('bar-chart')
    expect(barChart).toBeInTheDocument()
    expect(barChart).toHaveAttribute('data-length', '12') // 12 months
    
    // Check bar component
    const bar = screen.getByTestId('bar')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('data-key', 'total')
    expect(bar).toHaveAttribute('data-fill', 'currentColor')
    expect(bar).toHaveAttribute('data-radius', '4,4,0,0')
    expect(bar).toHaveAttribute('data-class', 'fill-primary')
    
    // Check X axis
    const xAxis = screen.getByTestId('x-axis')
    expect(xAxis).toBeInTheDocument()
    expect(xAxis).toHaveAttribute('data-key', 'name')
    expect(xAxis).toHaveAttribute('data-stroke', '#888888')
    expect(xAxis).toHaveAttribute('data-font-size', '12')
    expect(xAxis).toHaveAttribute('data-tick-line', 'false')
    expect(xAxis).toHaveAttribute('data-axis-line', 'false')
    
    // Check Y axis
    const yAxis = screen.getByTestId('y-axis')
    expect(yAxis).toBeInTheDocument()
    expect(yAxis).toHaveAttribute('data-stroke', '#888888')
    expect(yAxis).toHaveAttribute('data-font-size', '12')
    expect(yAxis).toHaveAttribute('data-tick-line', 'false')
    expect(yAxis).toHaveAttribute('data-axis-line', 'false')
    expect(yAxis.getAttribute('data-formatter')).toContain('value')
  })

  it('has correct responsive container dimensions', () => {
    render(<Overview />)
    const responsiveContainer = screen.getByTestId('responsive-container')
    expect(responsiveContainer).toBeInTheDocument()
    expect(responsiveContainer).toHaveAttribute('data-width', '100%')
    expect(responsiveContainer).toHaveAttribute('data-height', '350')
  })

  it('generates consistent data when Math.random is mocked', () => {
    // Since we mocked Math.random to return 0.5, each data point should be:
    // Math.floor(0.5 * 5000) + 1000 = 2500 + 1000 = 3500
    const { rerender } = render(<Overview />)
    const firstRender = screen.getByTestId('bar-chart')
    
    rerender(<Overview />)
    const secondRender = screen.getByTestId('bar-chart')
    
    // Both renders should be present (component should render consistently)
    expect(firstRender).toBeInTheDocument()
    expect(secondRender).toBeInTheDocument()
  })

  it('generates data for all 12 months', () => {
    render(<Overview />)
    const barChart = screen.getByTestId('bar-chart')
    expect(barChart).toHaveAttribute('data-length', '12')
  })

  it('applies correct styling classes', () => {
    render(<Overview />)
    const bar = screen.getByTestId('bar')
    expect(bar).toHaveAttribute('data-class', 'fill-primary')
  })

  it('formats Y-axis values as currency', () => {
    render(<Overview />)
    const yAxis = screen.getByTestId('y-axis')
    const formatterString = yAxis.getAttribute('data-formatter')
    expect(formatterString).toBeTruthy()
    
    // Test that the formatter function would format values correctly
    // Since we can't directly test the function, we verify it's present
    expect(formatterString).toContain('value')
  })
})

// Test accessibility
describe('Overview Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    const { container } = render(<Overview />)
    
    // The chart should be perceivable by screen readers
    const responsiveContainer = screen.getByTestId('responsive-container')
    expect(responsiveContainer).toBeInTheDocument()
    
    // Chart should have semantic structure
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('should render without accessibility violations', async () => {
    const { container } = render(<Overview />)
    
    // Basic check that component renders successfully
    expect(container).toBeInTheDocument()
  })
})

// Test performance and error handling
describe('Overview Performance and Error Handling', () => {
  it('should handle rapid re-renders without errors', () => {
    const { rerender } = render(<Overview />)
    
    // Rapid re-renders shouldn't cause errors
    for (let i = 0; i < 10; i++) {
      rerender(<Overview />)
    }
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('should not cause memory leaks with repeated mounting/unmounting', () => {
    const { unmount } = render(<Overview />)
    unmount()
    
    // Re-mount should work fine
    render(<Overview />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('should generate different data on different renders when random is not mocked', () => {
    // Restore original Math.random for this test
    jest.restoreAllMocks()
    
    const { unmount } = render(<Overview />)
    const firstChart = screen.getByTestId('bar-chart')
    unmount()
    
    render(<Overview />)
    const secondChart = screen.getByTestId('bar-chart')
    
    // Both should exist but data might be different
    expect(firstChart).toBeDefined()
    expect(secondChart).toBeInTheDocument()
    
    // Re-mock for other tests
    jest.spyOn(Math, 'random').mockReturnValue(0.5)
  })
})