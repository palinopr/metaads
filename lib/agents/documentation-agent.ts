/**
 * Agent 10: Documentation Agent
 * Creates comprehensive documentation
 */

import { BaseAgent, Task } from './base-agent';

export class DocumentationAgent extends BaseAgent {
  constructor() {
    super('Documentation');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'doc-1',
        name: 'Create API documentation',
        description: 'Document all API endpoints',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'doc-2',
        name: 'Generate component docs',
        description: 'Document React components',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'doc-3',
        name: 'Write user guides',
        description: 'End-user documentation',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'doc-4',
        name: 'Create developer guides',
        description: 'Technical implementation guides',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'doc-5',
        name: 'Build documentation site',
        description: 'Interactive documentation website',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting documentation generation...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'doc-1':
        await this.createAPIDocumentation();
        break;
      case 'doc-2':
        await this.generateComponentDocs();
        break;
      case 'doc-3':
        await this.writeUserGuides();
        break;
      case 'doc-4':
        await this.createDeveloperGuides();
        break;
      case 'doc-5':
        await this.buildDocumentationSite();
        break;
    }
  }

  private async createAPIDocumentation() {
    await this.writeFile('docs/api/README.md', `
# Meta Ads Dashboard API Documentation

## Overview

The Meta Ads Dashboard API provides endpoints for managing and analyzing Facebook advertising campaigns. All API endpoints are RESTful and return JSON responses.

## Base URL

\`\`\`
Production: https://api.metaadsdashboard.com
Development: http://localhost:3000/api
\`\`\`

## Authentication

All API requests require authentication using Meta Access Token and Ad Account ID.

### Setting Credentials

Credentials are stored in localStorage:

\`\`\`javascript
localStorage.setItem('meta-credentials', JSON.stringify({
  accessToken: 'YOUR_META_ACCESS_TOKEN',
  adAccountId: 'act_YOUR_ACCOUNT_ID'
}));
\`\`\`

## Error Handling

All endpoints follow a consistent error response format:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`

Common error codes:
- \`INVALID_CREDENTIALS\`: Missing or invalid Meta credentials
- \`RATE_LIMIT_EXCEEDED\`: Too many requests
- \`INVALID_REQUEST\`: Malformed request data
- \`SERVER_ERROR\`: Internal server error

## Endpoints

### Campaign Overview

Get aggregated campaign metrics and overview data.

**Endpoint:** \`POST /api/meta\`

**Request Body:**
\`\`\`json
{
  "type": "overview",
  "dateRange": "last_7d" // Optional: today, yesterday, last_7d, last_30d, last_90d, all_time
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "123456789",
        "name": "Summer Sale Campaign",
        "status": "ACTIVE",
        "objective": "CONVERSIONS",
        "budget": 1000,
        "spend": 750.50,
        "impressions": 50000,
        "clicks": 2500,
        "conversions": 125,
        "revenue": 5000,
        "roas": 6.66,
        "ctr": 5.0,
        "cpc": 0.30,
        "createdTime": "2024-01-01T00:00:00Z",
        "updatedTime": "2024-01-15T12:00:00Z"
      }
    ],
    "summary": {
      "totalCampaigns": 10,
      "activeCampaigns": 7,
      "totalSpend": 15000,
      "totalRevenue": 75000,
      "averageRoas": 5.0,
      "totalImpressions": 1000000,
      "totalClicks": 50000,
      "totalConversions": 2500
    }
  }
}
\`\`\`

### Campaign Details

Get detailed information about a specific campaign.

**Endpoint:** \`GET /api/meta/campaigns/{campaignId}\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "123456789",
      "name": "Summer Sale Campaign",
      "status": "ACTIVE",
      "objective": "CONVERSIONS",
      "budget": 1000,
      "spend": 750.50,
      "metrics": {
        "impressions": 50000,
        "clicks": 2500,
        "conversions": 125,
        "revenue": 5000,
        "roas": 6.66,
        "ctr": 5.0,
        "cpc": 0.30,
        "cpm": 15.01,
        "frequency": 1.5
      },
      "adSets": [
        {
          "id": "987654321",
          "name": "Lookalike Audience",
          "status": "ACTIVE",
          "budget": 500,
          "targetingSpec": {}
        }
      ],
      "insights": {
        "daily": [
          {
            "date": "2024-01-15",
            "spend": 100,
            "impressions": 5000,
            "clicks": 250,
            "conversions": 15,
            "revenue": 600
          }
        ]
      }
    }
  }
}
\`\`\`

### Update Campaign

Update campaign settings.

**Endpoint:** \`PUT /api/meta/campaigns/{campaignId}\`

**Request Body:**
\`\`\`json
{
  "status": "PAUSED", // ACTIVE or PAUSED
  "dailyBudget": 1500,
  "name": "Updated Campaign Name"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "123456789",
      "status": "PAUSED",
      "dailyBudget": 1500,
      "name": "Updated Campaign Name"
    }
  }
}
\`\`\`

### Demographics Data

Get demographic breakdown for campaigns.

**Endpoint:** \`POST /api/meta/demographics\`

**Request Body:**
\`\`\`json
{
  "campaignIds": ["123456789", "987654321"],
  "dateRange": "last_7d"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "demographics": {
      "age": [
        { "range": "18-24", "impressions": 10000, "clicks": 500, "spend": 150 },
        { "range": "25-34", "impressions": 25000, "clicks": 1500, "spend": 400 }
      ],
      "gender": [
        { "type": "male", "impressions": 30000, "clicks": 1200, "spend": 350 },
        { "type": "female", "impressions": 20000, "clicks": 800, "spend": 200 }
      ],
      "location": [
        { "country": "US", "impressions": 40000, "clicks": 1800, "spend": 450 },
        { "country": "CA", "impressions": 10000, "clicks": 200, "spend": 100 }
      ]
    }
  }
}
\`\`\`

### Day/Hour Performance

Get performance breakdown by day of week and hour.

**Endpoint:** \`POST /api/meta/day-hour-insights\`

**Request Body:**
\`\`\`json
{
  "campaignIds": ["123456789"],
  "dateRange": "last_30d"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "insights": {
      "byDayOfWeek": [
        { "day": "Monday", "impressions": 15000, "clicks": 750, "conversions": 45 },
        { "day": "Tuesday", "impressions": 18000, "clicks": 900, "conversions": 55 }
      ],
      "byHour": [
        { "hour": 9, "impressions": 5000, "clicks": 250, "conversions": 15 },
        { "hour": 10, "impressions": 6000, "clicks": 300, "conversions": 18 }
      ],
      "heatmap": [
        { "day": "Monday", "hour": 9, "value": 0.85 },
        { "day": "Monday", "hour": 10, "value": 0.92 }
      ]
    }
  }
}
\`\`\`

### Health Check

Check API and service health status.

**Endpoint:** \`GET /api/health\`

**Response:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00Z",
  "services": {
    "api": "healthy",
    "database": "healthy",
    "meta_api": "healthy",
    "redis": "degraded"
  }
}
\`\`\`

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Write operations**: 30 requests per 15 minutes
- **Analytics endpoints**: 300 requests per 15 minutes

Rate limit headers are included in responses:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining
- \`X-RateLimit-Reset\`: Time when limit resets

## Webhooks

Configure webhooks to receive real-time updates:

**Endpoint:** \`POST /api/webhooks\`

**Request Body:**
\`\`\`json
{
  "url": "https://your-domain.com/webhook",
  "events": ["campaign.updated", "campaign.paused", "budget.exceeded"],
  "secret": "your-webhook-secret"
}
\`\`\`

## SDK Usage

### JavaScript/TypeScript

\`\`\`typescript
import { MetaAdsClient } from '@metaads/sdk';

const client = new MetaAdsClient({
  accessToken: 'YOUR_TOKEN',
  adAccountId: 'act_123456789'
});

// Get campaigns
const campaigns = await client.campaigns.list({
  dateRange: 'last_7d'
});

// Update campaign
await client.campaigns.update('123456789', {
  status: 'PAUSED'
});
\`\`\`

### Python

\`\`\`python
from metaads import MetaAdsClient

client = MetaAdsClient(
    access_token='YOUR_TOKEN',
    ad_account_id='act_123456789'
)

# Get campaigns
campaigns = client.campaigns.list(date_range='last_7d')

# Update campaign
client.campaigns.update('123456789', status='PAUSED')
\`\`\`

## Changelog

### Version 2.0.0 (2024-01-15)
- Added demographic insights endpoint
- Improved error handling
- Added webhook support

### Version 1.0.0 (2024-01-01)
- Initial release
- Basic campaign management
- Analytics endpoints
`);

    this.log('API documentation created');
  }

  private async generateComponentDocs() {
    await this.writeFile('docs/components/README.md', `
# Component Documentation

## Overview

This document provides comprehensive documentation for all React components in the Meta Ads Dashboard.

## Component Categories

1. **UI Components** - Basic building blocks (buttons, cards, inputs)
2. **Feature Components** - Business logic components (campaigns, analytics)
3. **Layout Components** - Page structure and navigation
4. **Utility Components** - Helpers and wrappers

---

## UI Components

### Button

A versatile button component with multiple variants and states.

**Import:**
\`\`\`typescript
import { Button } from '@/components/ui/button';
\`\`\`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link' | 'default' | Visual style variant |
| size | 'default' \| 'sm' \| 'lg' \| 'icon' | 'default' | Button size |
| disabled | boolean | false | Disable interactions |
| loading | boolean | false | Show loading spinner |
| asChild | boolean | false | Render as child component |
| onClick | () => void | - | Click handler |

**Examples:**
\`\`\`tsx
// Basic button
<Button onClick={() => console.log('clicked')}>
  Click me
</Button>

// Destructive action
<Button variant="destructive" size="sm">
  Delete Campaign
</Button>

// Loading state
<Button loading disabled>
  Saving...
</Button>

// As link
<Button asChild>
  <a href="/dashboard">Go to Dashboard</a>
</Button>
\`\`\`

### Card

Container component for grouping related content.

**Import:**
\`\`\`typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
\`\`\`

**Props:**
| Component | Props | Description |
|-----------|-------|-------------|
| Card | className?: string | Main container |
| CardHeader | className?: string | Header section |
| CardTitle | className?: string | Title text |
| CardDescription | className?: string | Description text |
| CardContent | className?: string | Main content area |
| CardFooter | className?: string | Footer section |

**Example:**
\`\`\`tsx
<Card>
  <CardHeader>
    <CardTitle>Campaign Performance</CardTitle>
    <CardDescription>Last 7 days metrics</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <Metric label="Spend" value="$1,234" />
      <Metric label="ROAS" value="4.5x" />
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full">View Details</Button>
  </CardFooter>
</Card>
\`\`\`

---

## Feature Components

### CampaignCard

Displays campaign information with expandable details.

**Import:**
\`\`\`typescript
import { CampaignCard } from '@/components/features/campaign-card';
\`\`\`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| campaign | Campaign | Yes | Campaign data object |
| onSelect | (id: string) => void | No | Selection handler |
| onExpand | (id: string) => void | No | Expand handler |
| showPredictions | boolean | No | Show AI predictions |
| isExpanded | boolean | No | Expanded state |

**Example:**
\`\`\`tsx
<CampaignCard
  campaign={campaignData}
  onSelect={(id) => handleSelect(id)}
  onExpand={(id) => toggleExpand(id)}
  showPredictions
  isExpanded={expandedIds.includes(campaignData.id)}
/>
\`\`\`

### AIInsights

Displays AI-generated insights and recommendations.

**Import:**
\`\`\`typescript
import { AIInsights } from '@/components/features/ai-insights';
\`\`\`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| campaigns | Campaign[] | Yes | Campaign data array |
| dateRange | DateRange | No | Analysis period |
| onActionClick | (action: Action) => void | No | Action handler |
| variant | 'compact' \| 'detailed' | No | Display variant |

**Example:**
\`\`\`tsx
<AIInsights
  campaigns={campaigns}
  dateRange="last_7d"
  onActionClick={(action) => executeAction(action)}
  variant="detailed"
/>
\`\`\`

### MetricsChart

Flexible charting component for various metrics.

**Import:**
\`\`\`typescript
import { MetricsChart } from '@/components/features/metrics-chart';
\`\`\`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data | ChartData[] | Yes | Chart data points |
| type | 'line' \| 'bar' \| 'area' \| 'pie' | No | Chart type |
| metrics | string[] | Yes | Metrics to display |
| height | number | No | Chart height |
| showLegend | boolean | No | Display legend |
| interactive | boolean | No | Enable interactions |

**Example:**
\`\`\`tsx
<MetricsChart
  data={performanceData}
  type="area"
  metrics={['spend', 'revenue']}
  height={300}
  showLegend
  interactive
/>
\`\`\`

---

## Layout Components

### DashboardLayout

Main layout wrapper for dashboard pages.

**Import:**
\`\`\`typescript
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
\`\`\`

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | ReactNode | Yes | Page content |
| sidebar | ReactNode | No | Sidebar content |
| header | ReactNode | No | Header content |
| className | string | No | Additional classes |

**Example:**
\`\`\`tsx
<DashboardLayout
  sidebar={<NavigationMenu />}
  header={<HeaderBar />}
>
  <main className="p-6">
    {/* Page content */}
  </main>
</DashboardLayout>
\`\`\`

---

## Hooks

### useCampaigns

Hook for fetching and managing campaign data.

**Import:**
\`\`\`typescript
import { useCampaigns } from '@/hooks/use-campaigns';
\`\`\`

**Usage:**
\`\`\`tsx
function CampaignList() {
  const {
    campaigns,
    isLoading,
    error,
    refetch,
    updateCampaign,
    deleteCampaign
  } = useCampaigns({
    dateRange: 'last_7d',
    status: ['ACTIVE', 'PAUSED']
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {campaigns.map(campaign => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
\`\`\`

### useMetrics

Hook for performance metrics tracking.

**Import:**
\`\`\`typescript
import { useMetrics } from '@/hooks/use-metrics';
\`\`\`

**Usage:**
\`\`\`tsx
function AnalyticsPage() {
  const { track, trackTiming } = useMetrics('analytics-page');

  useEffect(() => {
    track('page-view');
    
    const startTime = Date.now();
    loadData().then(() => {
      trackTiming('data-load', Date.now() - startTime);
    });
  }, []);

  return <div>Analytics Content</div>;
}
\`\`\`

---

## Theming

### Theme Variables

The application supports custom theming through CSS variables:

\`\`\`css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;
}
\`\`\`

### Using Theme

\`\`\`tsx
import { useTheme } from '@/hooks/use-theme';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      Toggle Theme
    </Button>
  );
}
\`\`\`

---

## Best Practices

1. **Component Composition**: Build complex components from smaller, reusable pieces
2. **Props Interface**: Always define TypeScript interfaces for component props
3. **Default Props**: Provide sensible defaults for optional props
4. **Accessibility**: Include proper ARIA labels and keyboard navigation
5. **Performance**: Use React.memo for expensive components
6. **Testing**: Write unit tests for all components
7. **Documentation**: Keep component documentation up to date

---

## Contributing

When adding new components:

1. Create component in appropriate directory
2. Add TypeScript types
3. Write unit tests
4. Add Storybook stories
5. Update this documentation
6. Submit PR with examples
`);

    this.log('Component documentation generated');
  }

  private async writeUserGuides() {
    await this.writeFile('docs/user-guide/README.md', `
# Meta Ads Dashboard User Guide

## Welcome!

Welcome to the Meta Ads Dashboard - your comprehensive solution for managing and optimizing Facebook advertising campaigns. This guide will help you get started and make the most of all features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Campaigns](#managing-campaigns)
4. [Analytics & Insights](#analytics--insights)
5. [AI Features](#ai-features)
6. [Settings & Customization](#settings--customization)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### 1. Initial Setup

1. **Access the Dashboard**
   - Navigate to [https://metaadsdashboard.com](https://metaadsdashboard.com)
   - Click "Get Started" on the landing page

2. **Connect Your Meta Account**
   - Click the "Settings" icon in the top right
   - Enter your Meta Access Token
   - Enter your Ad Account ID (format: act_123456789)
   - Click "Save Credentials"

3. **Verify Connection**
   - The dashboard will automatically load your campaigns
   - Look for the green "Connected" status indicator

### 2. Getting Your Credentials

#### Meta Access Token:
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Navigate to Tools > Graph API Explorer
3. Generate a User Access Token with these permissions:
   - ads_read
   - ads_management
   - business_management

#### Ad Account ID:
1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to Business Settings > Accounts > Ad Accounts
3. Copy your Ad Account ID (starts with "act_")

---

## Dashboard Overview

### Main Dashboard Elements

![Dashboard Overview](./images/dashboard-overview.png)

1. **Navigation Bar**
   - Logo and brand
   - Search functionality
   - Settings and profile menu

2. **Summary Cards**
   - Total Spend
   - Total Revenue
   - Active Campaigns
   - Average ROAS

3. **Campaign List**
   - Real-time campaign performance
   - Status indicators
   - Quick actions menu

4. **Sidebar**
   - Navigation menu
   - Quick filters
   - AI Insights panel

### Understanding Metrics

| Metric | Description | Good Range |
|--------|-------------|------------|
| ROAS | Return on Ad Spend | > 3.0x |
| CTR | Click-Through Rate | > 1.5% |
| CPC | Cost Per Click | < $2.00 |
| CPM | Cost Per Thousand Impressions | < $30 |
| Frequency | Average times ad shown to same person | 1.5 - 3.0 |

---

## Managing Campaigns

### Viewing Campaign Details

1. **Click on any campaign** in the list to expand details
2. View comprehensive metrics:
   - Performance graphs
   - Demographic breakdown
   - Ad set performance
   - Creative performance

### Editing Campaigns

1. **Pause/Resume Campaign**
   - Click the status toggle
   - Confirm the action

2. **Adjust Budget**
   - Click the budget amount
   - Enter new daily budget
   - Save changes

3. **Bulk Actions**
   - Select multiple campaigns using checkboxes
   - Choose action from bulk menu:
     - Pause selected
     - Activate selected
     - Adjust budgets
     - Export data

### Campaign Filters

Use filters to find specific campaigns:

- **Status**: Active, Paused, Ended
- **Date Range**: Today, Yesterday, Last 7/30/90 days
- **Performance**: High/Low ROAS, Spend levels
- **Objective**: Conversions, Traffic, Awareness

---

## Analytics & Insights

### Performance Dashboard

Access detailed analytics:

1. **Time Series Analysis**
   - Toggle between Daily, Weekly, Monthly views
   - Compare multiple metrics on same chart
   - Export chart data

2. **Comparative Analysis**
   - Compare up to 4 campaigns side-by-side
   - Identify top performers
   - Spot trends and patterns

3. **Custom Reports**
   - Create custom metric combinations
   - Save report templates
   - Schedule automated reports

### Key Performance Indicators

Monitor these KPIs for success:

1. **Efficiency Metrics**
   - Cost per Result
   - Conversion Rate
   - Return on Ad Spend

2. **Engagement Metrics**
   - Click-Through Rate
   - Engagement Rate
   - Video View Rate

3. **Reach Metrics**
   - Unique Reach
   - Frequency
   - Impressions

---

## AI Features

### AI Insights Panel

The AI continuously analyzes your campaigns to provide:

1. **Opportunities**
   - Budget optimization suggestions
   - Audience expansion ideas
   - Creative recommendations

2. **Warnings**
   - Declining performance alerts
   - Budget pace warnings
   - Audience fatigue indicators

3. **Predictions**
   - 7-day performance forecast
   - Budget utilization projection
   - ROAS predictions

### Using AI Recommendations

1. **Review Recommendations**
   - Check the AI Insights panel daily
   - Priority indicators show urgency
   - Confidence scores indicate reliability

2. **Take Action**
   - Click "Apply" to implement suggestion
   - Click "Learn More" for details
   - Dismiss if not relevant

3. **Track Results**
   - Monitor implemented changes
   - AI learns from your decisions
   - Recommendations improve over time

### Predictive Analytics

For each campaign, view:
- **Next Week Forecast**: Expected spend, revenue, and ROAS
- **Next Month Projection**: Longer-term performance outlook
- **Scenario Analysis**: What-if calculations for budget changes

---

## Settings & Customization

### Account Settings

1. **Credentials Management**
   - Update Meta Access Token
   - Change Ad Account ID
   - Test connection status

2. **Notification Preferences**
   - Email alerts for performance changes
   - Budget threshold warnings
   - Weekly summary reports

3. **Display Preferences**
   - Choose default date range
   - Set currency display
   - Configure decimal places

### Dashboard Customization

1. **Layout Options**
   - Compact view for more campaigns
   - Detailed view for richer data
   - Mobile-optimized layout

2. **Metric Selection**
   - Choose which metrics to display
   - Reorder columns
   - Save custom views

3. **Theme Selection**
   - Light mode (default)
   - Dark mode
   - Auto (follows system)

### Data Export

Export your data in multiple formats:

1. **Quick Export**
   - Click export button on any view
   - Choose CSV or Excel format
   - Data downloads immediately

2. **Custom Export**
   - Select specific campaigns
   - Choose date range
   - Pick metrics to include
   - Add filters

3. **Scheduled Exports**
   - Set up recurring exports
   - Choose email recipients
   - Select frequency

---

## Troubleshooting

### Common Issues

#### "No Campaigns Found"
**Cause**: Invalid credentials or no active campaigns
**Solution**: 
1. Verify your Access Token is valid
2. Check Ad Account ID format
3. Ensure account has campaigns

#### "API Rate Limit Exceeded"
**Cause**: Too many requests to Meta API
**Solution**:
1. Wait 15 minutes before refreshing
2. Use date filters to reduce data
3. Enable caching in settings

#### "Connection Failed"
**Cause**: Network or API issues
**Solution**:
1. Check internet connection
2. Verify Meta API status
3. Try refreshing credentials

### Performance Tips

1. **Use Date Filters**
   - Smaller date ranges load faster
   - Historical data can be accessed separately

2. **Enable Caching**
   - Reduces API calls
   - Improves load times
   - Updates every 5 minutes

3. **Optimize Views**
   - Hide unused columns
   - Use pagination for large lists
   - Close expanded views when not needed

### Getting Help

If you need assistance:

1. **Check Documentation**
   - This user guide
   - API documentation
   - Video tutorials

2. **Contact Support**
   - Email: support@metaadsdashboard.com
   - Chat: Available 9 AM - 5 PM EST
   - Response time: < 24 hours

3. **Community Resources**
   - User forum
   - Feature requests
   - Best practices sharing

---

## Keyboard Shortcuts

Improve your efficiency with these shortcuts:

| Shortcut | Action |
|----------|--------|
| / | Focus search |
| R | Refresh data |
| C | Create new campaign |
| E | Export current view |
| ? | Show shortcuts help |
| Esc | Close modal/dialog |
| ← → | Navigate date ranges |
| Space | Select/deselect campaign |

---

## Best Practices

### Campaign Management
1. Review AI insights daily
2. Act on high-priority recommendations
3. Monitor frequency to avoid ad fatigue
4. Test different audiences regularly
5. Keep creative fresh

### Budget Optimization
1. Use AI budget recommendations
2. Shift budget to high-ROAS campaigns
3. Set up budget alerts
4. Review spend pacing weekly
5. Plan for seasonal variations

### Performance Monitoring
1. Check dashboard at consistent times
2. Set up automated reports
3. Track week-over-week trends
4. Compare against benchmarks
5. Document successful strategies

---

## Updates & New Features

We continuously improve the dashboard. Recent updates:

### Version 2.1 (Latest)
- Enhanced AI predictions
- Bulk campaign editor
- Custom metric builder
- Mobile app (iOS/Android)

### Coming Soon
- Google Ads integration
- Advanced attribution models
- Custom AI training
- Team collaboration tools

Stay updated:
- Check the changelog in settings
- Subscribe to our newsletter
- Follow @MetaAdsDashboard on Twitter

---

Thank you for choosing Meta Ads Dashboard! We're here to help you succeed with your advertising campaigns.
`);

    this.log('User guides written');
  }

  private async createDeveloperGuides() {
    await this.writeFile('docs/developer/README.md', `
# Developer Guide

## Architecture Overview

The Meta Ads Dashboard is built with a modern, scalable architecture:

\`\`\`
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js App   │────▶│   API Routes    │────▶│   Meta Graph    │
│   (Frontend)    │     │   (Backend)     │     │      API        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                         
        ▼                       ▼                         
┌─────────────────┐     ┌─────────────────┐              
│                 │     │                 │              
│   React Query   │     │     Redis       │              
│   (Caching)     │     │   (Caching)     │              
│                 │     │                 │              
└─────────────────┘     └─────────────────┘              
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand, React Query
- **Data Visualization**: Recharts
- **API**: Next.js API Routes
- **Authentication**: Meta OAuth
- **Deployment**: Vercel/Docker

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Meta Developer Account
- Git

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/your-org/meta-ads-dashboard.git
cd meta-ads-dashboard

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run development server
pnpm dev
\`\`\`

### Environment Variables

\`\`\`env
# Meta API
NEXT_PUBLIC_META_APP_ID=your_app_id
NEXT_PUBLIC_META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_access_token

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/metaads

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# AI Features (optional)
ANTHROPIC_API_KEY=your_anthropic_key
```

## Project Structure

\`\`\`
meta-ads-dashboard/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── features/         # Feature components
│   └── layouts/          # Layout components
├── lib/                   # Utilities and libraries
│   ├── api/              # API clients
│   ├── hooks/            # Custom hooks
│   └── utils/            # Helper functions
├── public/               # Static assets
├── styles/               # Global styles
└── tests/                # Test files
\`\`\`

## Development Workflow

### 1. Creating a New Feature

\`\`\`bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create component
mkdir components/features/your-feature
touch components/features/your-feature/index.tsx
touch components/features/your-feature/your-feature.test.tsx
\`\`\`

### 2. Component Template

\`\`\`typescript
// components/features/your-feature/index.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export interface YourFeatureProps {
  className?: string;
  // Add your props
}

export function YourFeature({ className, ...props }: YourFeatureProps) {
  return (
    <div className={cn('your-default-classes', className)} {...props}>
      {/* Component content */}
    </div>
  );
}
\`\`\`

### 3. Testing

\`\`\`typescript
// components/features/your-feature/your-feature.test.tsx
import { render, screen } from '@/tests/utils/test-utils';
import { YourFeature } from './index';

describe('YourFeature', () => {
  it('renders correctly', () => {
    render(<YourFeature />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });
});
\`\`\`

### 4. API Route Template

\`\`\`typescript
// app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  // Define request validation
});

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const body = await request.json();
    const data = requestSchema.parse(body);
    
    // Process request
    const result = await processYourLogic(data);
    
    // Return response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
\`\`\`

## State Management

### Using Zustand Store

\`\`\`typescript
// lib/stores/campaign-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CampaignStore {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCampaigns: (campaigns: Campaign[]) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCampaignStore = create<CampaignStore>()(
  devtools(
    persist(
      (set) => ({
        campaigns: [],
        isLoading: false,
        error: null,
        
        setCampaigns: (campaigns) => set({ campaigns }),
        updateCampaign: (id, updates) => set((state) => ({
          campaigns: state.campaigns.map(c => 
            c.id === id ? { ...c, ...updates } : c
          )
        })),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'campaign-storage',
      }
    )
  )
);
\`\`\`

### Using React Query

\`\`\`typescript
// hooks/use-campaigns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metaAPI } from '@/lib/api/meta-api';

export function useCampaigns(options?: { dateRange?: string }) {
  return useQuery({
    queryKey: ['campaigns', options],
    queryFn: () => metaAPI.getCampaigns(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      metaAPI.updateCampaign(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
\`\`\`

## API Integration

### Meta API Client

\`\`\`typescript
// lib/api/meta-api-client.ts
export class MetaAPIClient {
  private baseURL = 'https://graph.facebook.com/v18.0';
  private accessToken: string;
  private accountId: string;

  constructor(accessToken: string, accountId: string) {
    this.accessToken = accessToken;
    this.accountId = accountId;
  }

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = new URL(\`\${this.baseURL}\${endpoint}\`);
    url.searchParams.append('access_token', this.accessToken);

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new MetaAPIError(response.status, await response.text());
    }

    return response.json();
  }

  async getCampaigns(params?: CampaignParams) {
    const fields = 'id,name,status,objective,daily_budget,insights{spend,impressions,clicks}';
    return this.request<CampaignsResponse>(
      \`/\${this.accountId}/campaigns?fields=\${fields}\`
    );
  }
}
\`\`\`

## Performance Optimization

### 1. Code Splitting

\`\`\`typescript
// Use dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});
\`\`\`

### 2. Image Optimization

\`\`\`typescript
import Image from 'next/image';

<Image
  src="/campaign-image.jpg"
  alt="Campaign"
  width={300}
  height={200}
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurDataURL}
/>
\`\`\`

### 3. Memoization

\`\`\`typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize components
const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});
\`\`\`

## Security Best Practices

### 1. Input Validation

\`\`\`typescript
import { z } from 'zod';

const campaignSchema = z.object({
  name: z.string().min(1).max(100),
  budget: z.number().positive(),
  status: z.enum(['ACTIVE', 'PAUSED']),
});

// Validate before processing
const validatedData = campaignSchema.parse(requestData);
\`\`\`

### 2. API Security

\`\`\`typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // CSRF protection
  const token = request.headers.get('x-csrf-token');
  if (!token || !validateCSRFToken(token)) {
    return new Response('Invalid CSRF token', { status: 403 });
  }

  // Rate limiting
  const ip = request.ip || 'unknown';
  if (isRateLimited(ip)) {
    return new Response('Too many requests', { status: 429 });
  }

  return NextResponse.next();
}
\`\`\`

### 3. Environment Variables

\`\`\`typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_META_APP_ID: z.string(),
  META_ACCESS_TOKEN: z.string(),
  DATABASE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
\`\`\`

## Testing Strategy

### 1. Unit Tests

\`\`\`bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
\`\`\`

### 2. Integration Tests

\`\`\`typescript
// tests/integration/api.test.ts
describe('API Integration', () => {
  it('fetches campaigns successfully', async () => {
    const response = await fetch('/api/campaigns');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('campaigns');
  });
});
\`\`\`

### 3. E2E Tests

\`\`\`typescript
// tests/e2e/dashboard.spec.ts
test('user can view campaigns', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('h1')).toContainText('Campaigns');
  await expect(page.locator('[data-testid="campaign-card"]')).toBeVisible();
});
\`\`\`

## Deployment

### Vercel Deployment

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
\`\`\`

### Docker Deployment

\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## Monitoring & Debugging

### 1. Error Tracking

\`\`\`typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
\`\`\`

### 2. Performance Monitoring

\`\`\`typescript
// lib/monitoring/performance.ts
export function trackPerformance(metricName: string, value: number) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.measure(metricName);
    
    // Send to analytics
    analytics.track('performance_metric', {
      metric: metricName,
      value: value,
      timestamp: Date.now(),
    });
  }
}
\`\`\`

### 3. Debug Mode

\`\`\`typescript
// lib/debug.ts
export const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
  
  time: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(label);
    }
  },
};
\`\`\`

## Contributing

### Code Style

We use ESLint and Prettier for code formatting:

\`\`\`bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
\`\`\`

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run all checks
5. Submit PR with description

### Commit Convention

Follow conventional commits:

\`\`\`
feat: Add campaign comparison feature
fix: Resolve API timeout issue
docs: Update API documentation
style: Format code with prettier
refactor: Simplify campaign logic
test: Add campaign service tests
chore: Update dependencies
\`\`\`

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Meta Graph API](https://developers.facebook.com/docs/graph-api)
- [React Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
`);

    this.log('Developer guides created');
  }

  private async buildDocumentationSite() {
    await this.writeFile('docs/docusaurus.config.js', `
module.exports = {
  title: 'Meta Ads Dashboard',
  tagline: 'Comprehensive documentation for Meta Ads Dashboard',
  url: 'https://docs.metaadsdashboard.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'metaadsdashboard',
  projectName: 'docs',
  
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/metaadsdashboard/docs/edit/main/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Meta Ads Dashboard',
      logo: {
        alt: 'Meta Ads Dashboard Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'doc',
          docId: 'api/intro',
          position: 'left',
          label: 'API',
        },
        {
          type: 'doc',
          docId: 'guides/intro',
          position: 'left',
          label: 'Guides',
        },
        {
          href: 'https://github.com/metaadsdashboard',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'API Reference',
              to: '/docs/api/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/metaads',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/metaadsdashboard',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              href: 'https://blog.metaadsdashboard.com',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/metaadsdashboard',
            },
          ],
        },
      ],
      copyright: \`Copyright © \${new Date().getFullYear()} Meta Ads Dashboard.\`,
    },
    prism: {
      theme: require('prism-react-renderer/themes/github'),
      darkTheme: require('prism-react-renderer/themes/dracula'),
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_API_KEY',
      indexName: 'metaadsdashboard',
    },
  },
  
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'api',
        path: 'api',
        routeBasePath: 'api',
        sidebarPath: require.resolve('./sidebarsApi.js'),
      },
    ],
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'openapi',
        docsPluginId: 'api',
        config: {
          metaads: {
            specPath: 'openapi/metaads.yaml',
            outputDir: 'api/endpoints',
            sidebarOptions: {
              groupPathsBy: 'tag',
            },
          },
        },
      },
    ],
  ],
  
  themes: ['docusaurus-theme-openapi-docs'],
};
`);

    // Create interactive API documentation
    await this.writeFile('docs/openapi/metaads.yaml', `
openapi: 3.0.0
info:
  title: Meta Ads Dashboard API
  description: API for managing Facebook advertising campaigns
  version: 2.0.0
  contact:
    name: API Support
    url: https://metaadsdashboard.com/support
    email: api@metaadsdashboard.com

servers:
  - url: https://api.metaadsdashboard.com
    description: Production server
  - url: http://localhost:3000/api
    description: Development server

security:
  - BearerAuth: []

paths:
  /meta:
    post:
      summary: Get campaign overview
      tags:
        - Campaigns
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                type:
                  type: string
                  enum: [overview]
                dateRange:
                  type: string
                  enum: [today, yesterday, last_7d, last_30d, last_90d, all_time]
            examples:
              basic:
                value:
                  type: overview
                  dateRange: last_7d
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CampaignOverview'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'

  /meta/campaigns/{campaignId}:
    get:
      summary: Get campaign details
      tags:
        - Campaigns
      parameters:
        - name: campaignId
          in: path
          required: true
          schema:
            type: string
          description: Campaign ID
      responses:
        '200':
          description: Campaign details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Campaign'

components:
  schemas:
    Campaign:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        status:
          type: string
          enum: [ACTIVE, PAUSED, DELETED]
        objective:
          type: string
        budget:
          type: number
        metrics:
          $ref: '#/components/schemas/Metrics'
          
    Metrics:
      type: object
      properties:
        spend:
          type: number
        impressions:
          type: integer
        clicks:
          type: integer
        conversions:
          type: integer
        revenue:
          type: number
        roas:
          type: number
        ctr:
          type: number
        cpc:
          type: number
          
    CampaignOverview:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            campaigns:
              type: array
              items:
                $ref: '#/components/schemas/Campaign'
            summary:
              type: object
              
  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Invalid or missing credentials"
                
    RateLimited:
      description: Rate limit exceeded
      headers:
        X-RateLimit-Limit:
          schema:
            type: integer
        X-RateLimit-Remaining:
          schema:
            type: integer
        X-RateLimit-Reset:
          schema:
            type: string
            format: date-time
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Too many requests"
                
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
`);

    this.log('Documentation site built');
  }
}