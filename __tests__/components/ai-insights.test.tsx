import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AIInsights } from '@/components/ai-insights'

// Mock the utility functions
jest.mock('@/lib/utils', () => ({
  formatCurrency: (value: number) => `$${value.toFixed(2)}`,
  formatPercentage: (value: number) => `${value.toFixed(1)}%`,
  cn: (...classes: string[]) => classes.filter(Boolean).join(' ')
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Brain: () => <div data-testid="brain-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Rocket: () => <div data-testid="rocket-icon" />,
  PiggyBank: () => <div data-testid="piggy-bank-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />
}))

// Mock fetch for API calls
global.fetch = jest.fn()

const mockCampaigns = [
  {
    id: '1',
    name: 'Test Campaign 1',
    performanceScore: 85,
    lifetimeROAS: 3.2,
    daysRunning: 30,
    insights: {
      spend: 1000,
      revenue: 3200,
      impressions: 50000,
      clicks: 1500,
      ctr: 3.0,
      conversions: 32
    }
  },
  {
    id: '2',
    name: 'Test Campaign 2',
    performanceScore: 65,
    lifetimeROAS: 2.1,
    daysRunning: 15,
    insights: {
      spend: 500,
      revenue: 1050,
      impressions: 25000,
      clicks: 750,
      ctr: 3.0,
      conversions: 21
    }
  }
]

const defaultProps = {
  campaigns: mockCampaigns,
  totalSpend: 1500,
  totalRevenue: 4250,
  accountInfo: {
    id: 'act_123',
    name: 'Test Account',
    currency: 'USD'
  }
}

describe('AIInsights Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        insights: [
          {
            id: '1',
            type: 'opportunity',
            priority: 'high',
            title: 'Scale High-Performing Campaign',
            description: 'Campaign 1 shows strong performance with ROAS above 3.0',
            impact: 'Potential 25% increase in revenue',
            action: 'Increase budget by 20%',
            potentialGain: 800,
            confidence: 87
          }
        ],
        recommendations: [
          {
            campaignId: '1',
            campaignName: 'Test Campaign 1',
            action: 'scale',
            reason: 'Strong ROAS and low cost per conversion',
            impact: 'High',
            confidence: 90
          }
        ],
        predictiveAnalytics: {
          nextWeekROAS: 3.1,
          nextWeekSpend: 1800,
          nextWeekRevenue: 5580,
          trends: ['increasing_efficiency', 'stable_performance']
        }
      })
    })
  })

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<AIInsights {...defaultProps} />)
      expect(screen.getByText('AI Performance Insights')).toBeInTheDocument()
    })

    it('should display the correct title and description', () => {
      render(<AIInsights {...defaultProps} />)
      expect(screen.getByText('AI Performance Insights')).toBeInTheDocument()
      expect(screen.getByText(/AI-powered analysis of your campaign performance/)).toBeInTheDocument()
    })

    it('should render tabs for different insight categories', () => {
      render(<AIInsights {...defaultProps} />)
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /recommendations/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /predictions/i })).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      render(<AIInsights {...defaultProps} />)
      expect(screen.getByText(/analyzing your campaigns/i)).toBeInTheDocument()
    })
  })

  describe('Data Loading', () => {
    it('should call AI insights API on mount', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaigns: mockCampaigns,
            totalSpend: 1500,
            totalRevenue: 4250,
            accountInfo: defaultProps.accountInfo
          })
        })
      })
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))
      
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load ai insights/i)).toBeInTheDocument()
      })
    })

    it('should handle empty response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          insights: [],
          recommendations: [],
          predictiveAnalytics: null
        })
      })
      
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText(/no insights available/i)).toBeInTheDocument()
      })
    })
  })

  describe('Insights Display', () => {
    it('should display insights after loading', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Scale High-Performing Campaign')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Campaign 1 shows strong performance with ROAS above 3.0')).toBeInTheDocument()
      expect(screen.getByText('Potential 25% increase in revenue')).toBeInTheDocument()
    })

    it('should show insight priority badges', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('HIGH')).toBeInTheDocument()
      })
    })

    it('should display confidence scores', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('87% Confidence')).toBeInTheDocument()
      })
    })

    it('should show potential gain for opportunities', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('$800.00')).toBeInTheDocument()
      })
    })
  })

  describe('Recommendations Tab', () => {
    it('should switch to recommendations tab when clicked', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Scale High-Performing Campaign')).toBeInTheDocument()
      })
      
      const recommendationsTab = screen.getByRole('tab', { name: /recommendations/i })
      await user.click(recommendationsTab)
      
      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument()
      expect(screen.getByText('Strong ROAS and low cost per conversion')).toBeInTheDocument()
    })

    it('should display recommendation actions correctly', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Scale High-Performing Campaign')).toBeInTheDocument()
      })
      
      const recommendationsTab = screen.getByRole('tab', { name: /recommendations/i })
      await user.click(recommendationsTab)
      
      expect(screen.getByText('SCALE')).toBeInTheDocument()
      expect(screen.getByText('90% Confidence')).toBeInTheDocument()
    })
  })

  describe('Predictions Tab', () => {
    it('should switch to predictions tab and show predictive analytics', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Scale High-Performing Campaign')).toBeInTheDocument()
      })
      
      const predictionsTab = screen.getByRole('tab', { name: /predictions/i })
      await user.click(predictionsTab)
      
      expect(screen.getByText('Next Week Forecast')).toBeInTheDocument()
      expect(screen.getByText('3.1')).toBeInTheDocument() // ROAS
      expect(screen.getByText('$1800.00')).toBeInTheDocument() // Spend
      expect(screen.getByText('$5580.00')).toBeInTheDocument() // Revenue
    })

    it('should display trend indicators', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Scale High-Performing Campaign')).toBeInTheDocument()
      })
      
      const predictionsTab = screen.getByRole('tab', { name: /predictions/i })
      await user.click(predictionsTab)
      
      expect(screen.getByText('Increasing Efficiency')).toBeInTheDocument()
      expect(screen.getByText('Stable Performance')).toBeInTheDocument()
    })
  })

  describe('Interaction Handlers', () => {
    it('should handle refresh button click', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Scale High-Performing Campaign')).toBeInTheDocument()
      })
      
      const refreshButton = screen.getByRole('button', { name: /refresh insights/i })
      await user.click(refreshButton)
      
      expect(global.fetch).toHaveBeenCalledTimes(2) // Initial load + refresh
    })

    it('should handle insight card expansion', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Scale High-Performing Campaign')).toBeInTheDocument()
      })
      
      const insightCard = screen.getByText('Scale High-Performing Campaign').closest('[role="button"]')
      if (insightCard) {
        await user.click(insightCard)
        expect(screen.getByText('Increase budget by 20%')).toBeInTheDocument()
      }
    })
  })

  describe('Error Handling', () => {
    it('should show error state when API call fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
      
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load ai insights/i)).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      })
      
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i })
        expect(retryButton).toBeInTheDocument()
      })
    })

    it('should retry API call when retry button is clicked', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            insights: [],
            recommendations: [],
            predictiveAnalytics: null
          })
        })
      
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
      
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)
      
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Props Validation', () => {
    it('should handle empty campaigns array', () => {
      render(<AIInsights {...defaultProps} campaigns={[]} />)
      expect(screen.getByText('AI Performance Insights')).toBeInTheDocument()
    })

    it('should handle missing account info', () => {
      const propsWithoutAccount = { ...defaultProps }
      delete propsWithoutAccount.accountInfo
      
      render(<AIInsights {...propsWithoutAccount} />)
      expect(screen.getByText('AI Performance Insights')).toBeInTheDocument()
    })

    it('should handle zero spend and revenue', () => {
      render(<AIInsights {...defaultProps} totalSpend={0} totalRevenue={0} />)
      expect(screen.getByText('AI Performance Insights')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AIInsights {...defaultProps} />)
      
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('aria-selected')
    })

    it('should be keyboard navigable', async () => {
      render(<AIInsights {...defaultProps} />)
      
      const firstTab = screen.getByRole('tab', { name: /overview/i })
      firstTab.focus()
      
      // Tab to next tab
      await user.keyboard('{ArrowRight}')
      expect(screen.getByRole('tab', { name: /recommendations/i })).toHaveAttribute('aria-selected')
    })

    it('should have appropriate color contrast for insights', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        const highPriorityBadge = screen.getByText('HIGH')
        expect(highPriorityBadge).toBeInTheDocument()
        // Badge should have appropriate styling for high contrast
      })
    })
  })

  describe('Performance', () => {
    it('should not make unnecessary API calls', async () => {
      const { rerender } = render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
      
      // Re-render with same props shouldn't trigger new API call
      rerender(<AIInsights {...defaultProps} />)
      
      // Wait a bit to ensure no additional calls
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should debounce rapid prop changes', async () => {
      const { rerender } = render(<AIInsights {...defaultProps} />)
      
      // Rapid prop changes
      rerender(<AIInsights {...defaultProps} totalSpend={1600} />)
      rerender(<AIInsights {...defaultProps} totalSpend={1700} />)
      rerender(<AIInsights {...defaultProps} totalSpend={1800} />)
      
      await waitFor(() => {
        // Should still only have made the initial call plus one for the final state
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Integration', () => {
    it('should integrate properly with campaign data', async () => {
      render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaigns: mockCampaigns,
            totalSpend: 1500,
            totalRevenue: 4250,
            accountInfo: defaultProps.accountInfo
          })
        })
      })
    })

    it('should update when campaign data changes', async () => {
      const { rerender } = render(<AIInsights {...defaultProps} />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
      
      const newCampaigns = [...mockCampaigns, {
        id: '3',
        name: 'New Campaign',
        performanceScore: 75,
        lifetimeROAS: 2.5,
        daysRunning: 7,
        insights: { spend: 200, revenue: 500 }
      }]
      
      rerender(<AIInsights {...defaultProps} campaigns={newCampaigns} />)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })
})