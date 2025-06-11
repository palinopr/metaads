/**
 * Agent 9: Testing Agent
 * Implements comprehensive testing infrastructure
 */

import { BaseAgent, Task } from './base-agent';

export class TestingAgent extends BaseAgent {
  constructor() {
    super('Testing');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'test-1',
        name: 'Setup unit testing',
        description: 'Jest and React Testing Library',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'test-2',
        name: 'Create integration tests',
        description: 'API and component integration tests',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'test-3',
        name: 'Implement E2E tests',
        description: 'Playwright for end-to-end testing',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'test-4',
        name: 'Add visual regression',
        description: 'Screenshot comparison tests',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'test-5',
        name: 'Create performance tests',
        description: 'Load and stress testing',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting testing infrastructure setup...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'test-1':
        await this.setupUnitTesting();
        break;
      case 'test-2':
        await this.createIntegrationTests();
        break;
      case 'test-3':
        await this.implementE2ETests();
        break;
      case 'test-4':
        await this.addVisualRegression();
        break;
      case 'test-5':
        await this.createPerformanceTests();
        break;
    }
  }

  private async setupUnitTesting() {
    // Jest configuration
    await this.writeFile('jest.config.js', `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react'
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
`);

    // Test setup file
    await this.writeFile('tests/setup.ts', `
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { server } from './mocks/server';

// Polyfill for Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
`);

    // Testing utilities
    await this.writeFile('tests/utils/test-utils.tsx', `
import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { NextRouter } from 'next/router';

// Mock router
const mockRouter: NextRouter = {
  basePath: '',
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  router?: Partial<NextRouter>;
  queryClient?: QueryClient;
}

function customRender(
  ui: React.ReactElement,
  {
    router = {},
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <RouterContext.Provider value={{ ...mockRouter, ...router }}>
          <ThemeProvider defaultTheme="light">
            {children}
          </ThemeProvider>
        </RouterContext.Provider>
      </QueryClientProvider>
    );
  };

  return rtlRender(ui, { wrapper: AllTheProviders, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockCampaign = (overrides = {}) => ({
  id: '123',
  name: 'Test Campaign',
  status: 'ACTIVE',
  objective: 'CONVERSIONS',
  budget: 1000,
  spend: 500,
  impressions: 10000,
  clicks: 500,
  conversions: 50,
  revenue: 2000,
  roas: 4.0,
  ctr: 5.0,
  cpc: 1.0,
  createdTime: '2024-01-01',
  updatedTime: '2024-01-15',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

// Async utilities
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

// Custom queries
export const queryByTestId = (testId: string) =>
  screen.queryByTestId(testId);

export const getAllByTestId = (testId: string) =>
  screen.getAllByTestId(testId);
`);

    // Example unit test
    await this.writeFile('components/ui/__tests__/button.test.tsx', `
import { render, screen, fireEvent } from '@/tests/utils/test-utils';
import { Button } from '../button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<Button disabled>Click me</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Cancel</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');
  });

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });
});
`);

    this.log('Unit testing setup complete');
  }

  private async createIntegrationTests() {
    // MSW server setup
    await this.writeFile('tests/mocks/server.ts', `
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
`);

    // MSW handlers
    await this.writeFile('tests/mocks/handlers.ts', `
import { rest } from 'msw';

export const handlers = [
  // Meta API endpoints
  rest.get('https://graph.facebook.com/v18.0/act_*/campaigns', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: '123',
            name: 'Test Campaign',
            status: 'ACTIVE',
            objective: 'CONVERSIONS',
            daily_budget: '10000',
            insights: {
              data: [{
                spend: '500.00',
                impressions: '10000',
                clicks: '500',
                conversions: '50',
                purchase_roas: '4.0',
                ctr: '5.0',
                cpc: '1.0'
              }]
            }
          }
        ],
        paging: {}
      })
    );
  }),

  // Internal API endpoints
  rest.post('/api/meta', async (req, res, ctx) => {
    const body = await req.json();
    
    if (body.type === 'overview') {
      return res(
        ctx.json({
          success: true,
          data: {
            campaigns: [],
            totalSpend: 5000,
            totalRevenue: 20000,
            totalImpressions: 100000,
            totalClicks: 5000
          }
        })
      );
    }

    return res(ctx.status(400), ctx.json({ error: 'Invalid request' }));
  }),

  rest.post('/api/auth/login', async (req, res, ctx) => {
    const { email, password } = await req.json();
    
    if (email === 'test@example.com' && password === 'password') {
      return res(
        ctx.json({
          user: { id: '1', email, name: 'Test User' },
          token: 'mock-jwt-token'
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  }),

  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
      })
    );
  })
];
`);

    // Integration test example
    await this.writeFile('tests/integration/campaign-dashboard.test.tsx', `
import { render, screen, waitFor, within } from '@/tests/utils/test-utils';
import { rest } from 'msw';
import { server } from '@/tests/mocks/server';
import Dashboard from '@/app/dashboard/page';

describe('Campaign Dashboard Integration', () => {
  it('loads and displays campaigns', async () => {
    render(<Dashboard />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check campaign is displayed
    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument(); // Spend
    expect(screen.getByText('4.00x')).toBeInTheDocument(); // ROAS
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('https://graph.facebook.com/v18.0/act_*/campaigns', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('filters campaigns by status', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });

    // Click on status filter
    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);

    // Select 'PAUSED' status
    const pausedCheckbox = screen.getByRole('checkbox', { name: /paused/i });
    fireEvent.click(pausedCheckbox);

    // Campaign should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Test Campaign')).not.toBeInTheDocument();
    });
  });

  it('refreshes data when requested', async () => {
    let callCount = 0;
    server.use(
      rest.get('https://graph.facebook.com/v18.0/act_*/campaigns', (req, res, ctx) => {
        callCount++;
        return res(ctx.json({ data: [], paging: {} }));
      })
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(callCount).toBe(1);
    });

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(callCount).toBe(2);
    });
  });
});
`);

    // API integration test
    await this.writeFile('tests/integration/api.test.ts', `
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/meta/route';

describe('/api/meta', () => {
  it('returns campaign data for valid request', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'overview',
        dateRange: 'last_7d'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(true);
    expect(jsonData.data).toBeDefined();
  });

  it('returns error for invalid request type', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'invalid'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.error).toBeDefined();
  });

  it('handles missing credentials', async () => {
    // Mock missing env variables
    const originalToken = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN;
    delete process.env.NEXT_PUBLIC_META_ACCESS_TOKEN;

    const { req, res } = createMocks({
      method: 'POST',
      body: { type: 'overview' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.error).toContain('credentials');

    // Restore
    process.env.NEXT_PUBLIC_META_ACCESS_TOKEN = originalToken;
  });
});
`);

    this.log('Integration tests created');
  }

  private async implementE2ETests() {
    // Playwright configuration
    await this.writeFile('playwright.config.ts', `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`);

    // E2E test example
    await this.writeFile('tests/e2e/dashboard.spec.ts', `
import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('meta-credentials', JSON.stringify({
        accessToken: 'test-token',
        adAccountId: 'act_123456789'
      }));
    });
  });

  test('loads dashboard and displays campaigns', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for campaigns to load
    await page.waitForSelector('[data-testid="campaign-card"]');
    
    // Check campaign is visible
    const campaign = page.locator('[data-testid="campaign-card"]').first();
    await expect(campaign).toBeVisible();
    await expect(campaign).toContainText('Campaign');
  });

  test('filters campaigns by date range', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click date filter
    await page.click('[data-testid="date-filter"]');
    
    // Select "Last 30 days"
    await page.click('text=Last 30 days');
    
    // Wait for data to reload
    await page.waitForLoadState('networkidle');
    
    // Verify URL updated
    expect(page.url()).toContain('dateRange=last_30d');
  });

  test('opens campaign details', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click on a campaign
    await page.click('[data-testid="campaign-card"]');
    
    // Wait for modal
    await page.waitForSelector('[data-testid="campaign-detail-modal"]');
    
    // Check details are visible
    await expect(page.locator('[data-testid="campaign-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="campaign-chart"]')).toBeVisible();
  });

  test('handles errors gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/api/meta', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.goto('/dashboard');
    
    // Check error message is displayed
    await expect(page.locator('text=Something went wrong')).toBeVisible();
    
    // Check retry button exists
    await expect(page.locator('button:has-text("Try again")')).toBeVisible();
  });

  test('responsive design works', async ({ page, viewport }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check mobile menu is visible
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Check desktop navigation is visible
    await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
  });
});
`);

    // E2E test utilities
    await this.writeFile('tests/e2e/utils/helpers.ts', `
import { Page } from '@playwright/test';

export async function login(page: Page, credentials = {
  accessToken: 'test-token',
  adAccountId: 'act_123456789'
}) {
  await page.goto('/');
  await page.evaluate((creds) => {
    localStorage.setItem('meta-credentials', JSON.stringify(creds));
  }, credentials);
}

export async function mockAPIResponse(page: Page, url: string, response: any) {
  await page.route(url, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

export async function waitForDataLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: \`tests/e2e/screenshots/\${name}.png\`,
    fullPage: true 
  });
}
`);

    this.log('E2E tests implemented');
  }

  private async addVisualRegression() {
    // Visual regression test setup
    await this.writeFile('tests/visual/visual.spec.ts', `
import { test, expect } from '@playwright/test';
import { login } from '../e2e/utils/helpers';

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard matches snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Hide dynamic content
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid="timestamp"]').forEach(el => {
        el.textContent = '2024-01-01 00:00:00';
      });
    });

    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixels: 100,
      fullPage: true
    });
  });

  test('campaign detail modal matches snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[data-testid="campaign-card"]');
    await page.waitForSelector('[data-testid="campaign-detail-modal"]');

    await expect(page.locator('[data-testid="campaign-detail-modal"]')).toHaveScreenshot(
      'campaign-detail.png'
    );
  });

  test('dark mode matches snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500); // Wait for transition

    await expect(page).toHaveScreenshot('dashboard-dark.png', {
      fullPage: true
    });
  });

  test('mobile view matches snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true
    });
  });

  test('error state matches snapshot', async ({ page }) => {
    await page.route('**/api/meta', route => {
      route.fulfill({ status: 500 });
    });

    await page.goto('/dashboard');
    await page.waitForSelector('text=Something went wrong');

    await expect(page).toHaveScreenshot('error-state.png');
  });
});
`);

    // Visual testing utilities
    await this.writeFile('tests/visual/config.ts', `
export const visualConfig = {
  // Threshold for pixel differences
  threshold: 0.2,
  
  // Areas to ignore in screenshots
  ignoreRegions: [
    { selector: '[data-testid="timestamp"]' },
    { selector: '[data-testid="loading-spinner"]' },
    { selector: '.animated-element' }
  ],
  
  // Viewport sizes to test
  viewports: [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ],
  
  // Themes to test
  themes: ['light', 'dark'],
  
  // Wait for animations to complete
  waitForAnimations: true,
  animationTimeout: 500
};

export async function preparePageForScreenshot(page: Page) {
  // Disable animations
  await page.addStyleTag({
    content: \`
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    \`
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  // Hide cursors and selections
  await page.addStyleTag({
    content: \`
      * {
        cursor: none !important;
        user-select: none !important;
      }
    \`
  });
}
`);

    this.log('Visual regression testing added');
  }

  private async createPerformanceTests() {
    // Performance test configuration
    await this.writeFile('tests/performance/lighthouse.config.js', `
module.exports = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      disabled: false,
    },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
  categories: {
    performance: {
      title: 'Performance',
      auditRefs: [
        { id: 'first-contentful-paint', weight: 3 },
        { id: 'largest-contentful-paint', weight: 5 },
        { id: 'cumulative-layout-shift', weight: 5 },
        { id: 'total-blocking-time', weight: 3 },
        { id: 'speed-index', weight: 3 },
      ],
    },
  },
  audits: [
    { path: 'metrics/first-contentful-paint' },
    { path: 'metrics/largest-contentful-paint' },
    { path: 'metrics/cumulative-layout-shift' },
    { path: 'metrics/total-blocking-time' },
    { path: 'metrics/speed-index' },
  ],
};
`);

    // Load testing script
    await this.writeFile('tests/performance/load-test.js', `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'], // Error rate must be below 10%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test dashboard page
  let res = http.get(\`\${BASE_URL}/dashboard\`);
  check(res, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard loads quickly': (r) => r.timings.duration < 500,
  });
  errorRate.add(res.status !== 200);

  sleep(1);

  // Test API endpoint
  res = http.post(
    \`\${BASE_URL}/api/meta\`,
    JSON.stringify({ type: 'overview' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, {
    'API status is 200': (r) => r.status === 200,
    'API responds quickly': (r) => r.timings.duration < 300,
    'API returns data': (r) => JSON.parse(r.body).data !== undefined,
  });
  errorRate.add(res.status !== 200);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
`);

    // Performance monitoring script
    await this.writeFile('tests/performance/monitor.ts', `
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { writeFileSync } from 'fs';

interface PerformanceMetrics {
  url: string;
  timestamp: Date;
  lighthouse: any;
  customMetrics: {
    timeToInteractive: number;
    memoryUsage: number;
    mainThreadWork: number;
  };
}

export async function runPerformanceTest(url: string): Promise<PerformanceMetrics> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Collect custom metrics
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  const customMetrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      timeToInteractive: perfData.loadEventEnd - perfData.fetchStart,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      mainThreadWork: performance.measure ? 
        performance.getEntriesByType('measure').reduce((acc, entry) => acc + entry.duration, 0) : 0
    };
  });

  // Run Lighthouse
  const { port } = new URL(browser.wsEndpoint());
  const lighthouseResult = await lighthouse(url, {
    port,
    logLevel: 'error',
    output: 'json',
  });

  await browser.close();

  return {
    url,
    timestamp: new Date(),
    lighthouse: lighthouseResult.lhr,
    customMetrics
  };
}

// Performance regression detection
export function detectRegression(
  current: PerformanceMetrics,
  baseline: PerformanceMetrics,
  threshold = 0.1 // 10% regression threshold
): { hasRegression: boolean; regressions: string[] } {
  const regressions: string[] = [];

  // Check Lighthouse scores
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
  categories.forEach(category => {
    const currentScore = current.lighthouse.categories[category]?.score || 0;
    const baselineScore = baseline.lighthouse.categories[category]?.score || 0;
    
    if (currentScore < baselineScore * (1 - threshold)) {
      regressions.push(\`\${category}: \${baselineScore} -> \${currentScore}\`);
    }
  });

  // Check custom metrics
  if (current.customMetrics.timeToInteractive > baseline.customMetrics.timeToInteractive * (1 + threshold)) {
    regressions.push('Time to Interactive increased');
  }

  return {
    hasRegression: regressions.length > 0,
    regressions
  };
}

// Run tests and save results
export async function runAndSaveTests(urls: string[]) {
  const results: PerformanceMetrics[] = [];

  for (const url of urls) {
    console.log(\`Testing \${url}...\`);
    const result = await runPerformanceTest(url);
    results.push(result);
  }

  // Save results
  writeFileSync(
    'performance-results.json',
    JSON.stringify(results, null, 2)
  );

  // Generate report
  const report = generateReport(results);
  writeFileSync('performance-report.html', report);

  return results;
}

function generateReport(results: PerformanceMetrics[]): string {
  return \`
<!DOCTYPE html>
<html>
<head>
  <title>Performance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .good { color: green; }
    .warning { color: orange; }
    .bad { color: red; }
  </style>
</head>
<body>
  <h1>Performance Test Report</h1>
  <p>Generated: \${new Date().toISOString()}</p>
  
  <table>
    <thead>
      <tr>
        <th>URL</th>
        <th>Performance Score</th>
        <th>Time to Interactive</th>
        <th>Memory Usage</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      \${results.map(result => \`
        <tr>
          <td>\${result.url}</td>
          <td class="\${getScoreClass(result.lighthouse.categories.performance.score)}">
            \${(result.lighthouse.categories.performance.score * 100).toFixed(0)}
          </td>
          <td>\${result.customMetrics.timeToInteractive}ms</td>
          <td>\${(result.customMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</td>
          <td>\${getStatus(result)}</td>
        </tr>
      \`).join('')}
    </tbody>
  </table>
</body>
</html>
  \`;
}

function getScoreClass(score: number): string {
  if (score >= 0.9) return 'good';
  if (score >= 0.7) return 'warning';
  return 'bad';
}

function getStatus(result: PerformanceMetrics): string {
  const score = result.lighthouse.categories.performance.score;
  if (score >= 0.9) return '✅ Excellent';
  if (score >= 0.7) return '⚠️ Needs Improvement';
  return '❌ Poor';
}
`);

    this.log('Performance tests created');
  }
}