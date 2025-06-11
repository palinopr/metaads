import { render, screen } from '@testing-library/react'
import { RecentSales } from '@/components/recent-sales'

// Mock the Avatar components
jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="avatar" className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }: { src?: string; alt?: string }) => (
    <img data-testid="avatar-image" src={src} alt={alt} />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
}))

describe('RecentSales', () => {
  it('renders without crashing', () => {
    render(<RecentSales />)
    expect(screen.getByRole('list', { hidden: true })).toBeInTheDocument()
  })

  it('displays all sales data', () => {
    render(<RecentSales />)
    
    // Check for all names
    expect(screen.getByText('Olivia Martin')).toBeInTheDocument()
    expect(screen.getByText('Jackson Lee')).toBeInTheDocument()
    expect(screen.getByText('Isabella Nguyen')).toBeInTheDocument()
    expect(screen.getByText('William Kim')).toBeInTheDocument()
    expect(screen.getByText('Sofia Davis')).toBeInTheDocument()
  })

  it('displays all email addresses', () => {
    render(<RecentSales />)
    
    expect(screen.getByText('olivia.martin@email.com')).toBeInTheDocument()
    expect(screen.getByText('jackson.lee@email.com')).toBeInTheDocument()
    expect(screen.getByText('isabella.nguyen@email.com')).toBeInTheDocument()
    expect(screen.getByText('will@email.com')).toBeInTheDocument()
    expect(screen.getByText('sofia.davis@email.com')).toBeInTheDocument()
  })

  it('displays all amounts', () => {
    render(<RecentSales />)
    
    expect(screen.getByText('+$1,999.00')).toBeInTheDocument()
    expect(screen.getByText('+$39.00')).toBeInTheDocument()
    expect(screen.getByText('+$299.00')).toBeInTheDocument()
    expect(screen.getByText('+$99.00')).toBeInTheDocument()
    // Sofia Davis also has +$39.00, so we should have 2 instances
    expect(screen.getAllByText('+$39.00')).toHaveLength(2)
  })

  it('renders avatars for each sale', () => {
    render(<RecentSales />)
    
    const avatars = screen.getAllByTestId('avatar')
    expect(avatars).toHaveLength(5)
    
    const avatarImages = screen.getAllByTestId('avatar-image')
    expect(avatarImages).toHaveLength(5)
    
    const avatarFallbacks = screen.getAllByTestId('avatar-fallback')
    expect(avatarFallbacks).toHaveLength(5)
  })

  it('displays correct avatar fallbacks', () => {
    render(<RecentSales />)
    
    expect(screen.getByText('OM')).toBeInTheDocument()
    expect(screen.getByText('JL')).toBeInTheDocument()
    expect(screen.getByText('IN')).toBeInTheDocument()
    expect(screen.getByText('WK')).toBeInTheDocument()
    expect(screen.getByText('SD')).toBeInTheDocument()
  })

  it('has correct structure with flex layout', () => {
    const { container } = render(<RecentSales />)
    const mainContainer = container.firstChild as HTMLElement
    
    expect(mainContainer).toHaveClass('space-y-8')
    
    const saleItems = container.querySelectorAll('.flex.items-center')
    expect(saleItems).toHaveLength(5)
  })

  it('has proper text styling classes', () => {
    const { container } = render(<RecentSales />)
    
    // Check for medium font weight on names
    const nameElements = container.querySelectorAll('.text-sm.font-medium.leading-none')
    expect(nameElements).toHaveLength(5)
    
    // Check for muted foreground on emails
    const emailElements = container.querySelectorAll('.text-sm.text-muted-foreground')
    expect(emailElements).toHaveLength(5)
    
    // Check for auto margin and medium font on amounts
    const amountElements = container.querySelectorAll('.ml-auto.font-medium')
    expect(amountElements).toHaveLength(5)
  })
})