# Advanced AI Features - Usage Guide

## Overview

The Meta Ads Dashboard now includes a comprehensive suite of AI-powered analytics and optimization features designed to provide actionable insights and automate campaign optimization.

## Core AI Features

### 1. Predictive Analytics & ML Models

**File:** `/lib/ai-predictions.ts`
**Purpose:** Multi-model ensemble predictions for campaign performance

**Features:**
- ARIMA time series forecasting
- Machine learning regression models
- Neural network predictions
- Ensemble prediction combining multiple models
- Seasonality adjustments
- Confidence intervals

**Usage Example:**
```typescript
import { getAIPredictionService } from '@/lib/ai-predictions'

const aiService = getAIPredictionService(claudeApiKey)

const predictions = await aiService.getPredictions({
  campaign: campaignData,
  timeframe: '30d',
  scenario: 'moderate',
  includeSeasonality: true,
  includeCompetitorAnalysis: true
})
```

### 2. Anomaly Detection System

**Purpose:** Real-time detection of unusual campaign performance patterns

**Features:**
- Z-score based statistical anomaly detection
- Multi-metric monitoring (spend, CTR, conversions, ROAS, CPC)
- Severity classification (low, medium, high)
- Automated explanations and recommendations
- Historical baseline comparison

**Usage Example:**
```typescript
const anomalies = await aiService.detectAnomalies(campaigns, 30) // 30-day lookback

anomalies.forEach(anomaly => {
  console.log(`${anomaly.metric} anomaly detected:`, anomaly.explanation)
  console.log('Recommendations:', anomaly.recommendations)
})
```

### 3. Recommendation Engine

**Purpose:** AI-powered optimization suggestions for campaigns

**Features:**
- Budget optimization recommendations
- Targeting optimization analysis
- Creative performance suggestions
- Bidding strategy optimization
- Schedule optimization
- Priority-based ranking system

**Usage Example:**
```typescript
const recommendations = await aiService.generateOptimizationRecommendations(campaigns)

recommendations.forEach(rec => {
  console.log(`${rec.priority} priority: ${rec.action}`)
  console.log(`Expected impact: +${rec.impact.expectedChange * 100}% ${rec.impact.metric}`)
})
```

### 4. Trend Analysis & Forecasting

**Purpose:** Long-term trend detection and forecasting

**Features:**
- Multi-metric trend analysis
- Seasonal pattern detection
- Change point identification
- Cycle length detection
- Trend strength measurement
- Future trend forecasting

**Usage Example:**
```typescript
const trends = await aiService.analyzeTrends(campaigns, ['spend', 'roas', 'conversions'])

Object.entries(trends.trends).forEach(([metric, data]) => {
  console.log(`${metric} trend: ${data.direction} (strength: ${data.strength})`)
})
```

### 5. Sentiment Analysis for Ad Copy

**Purpose:** Emotional tone analysis of advertising copy

**Features:**
- Overall sentiment classification (positive/negative/neutral)
- Emotional breakdown (joy, anger, fear, sadness, surprise)
- Improvement suggestions
- Keyword-based analysis with AI enhancement

**Usage Example:**
```typescript
const sentiment = await aiService.analyzeSentiment("Your amazing ad copy here!")

console.log(`Sentiment: ${sentiment.sentiment} (${sentiment.score})`)
console.log('Emotions:', sentiment.emotions)
console.log('Suggestions:', sentiment.suggestions)
```

### 6. Competitor Intelligence

**Purpose:** Industry benchmark comparison and competitive analysis

**Features:**
- Industry benchmark comparison
- Performance gap analysis
- Competitive positioning insights
- Metric-specific recommendations
- Trend comparison with industry standards

**Usage Example:**
```typescript
const competitorInsights = await aiService.analyzeCompetitors(campaigns, 'ecommerce')

competitorInsights.forEach(insight => {
  const performance = insight.difference_percentage > 0 ? 'outperforming' : 'underperforming'
  console.log(`${insight.metric}: ${performance} industry by ${Math.abs(insight.difference_percentage)}%`)
})
```

### 7. A/B Testing Optimization

**Purpose:** Statistical analysis of A/B test results

**Features:**
- Statistical significance testing (t-tests)
- Sample size calculations
- Confidence level analysis
- Winner determination
- Test result recommendations

**Usage Example:**
```typescript
const abResult = await aiService.analyzeABTest(variantA, variantB, 0.95)

if (abResult.statistical_significance) {
  console.log(`Winner: Variant ${abResult.winner}`)
} else {
  console.log('No statistically significant difference detected')
}
```

### 8. Performance Prediction Models

**Purpose:** Multi-model performance forecasting

**Features:**
- Linear regression predictions
- Random forest modeling
- Neural network forecasting
- Ensemble model combination
- Risk assessment
- Opportunity identification

**Usage Example:**
```typescript
const performancePrediction = await aiService.predictCampaignPerformance(campaign, 30)

console.log('30-day forecast:', performancePrediction.predictions)
console.log('Confidence:', performancePrediction.confidence)
console.log('Risks:', performancePrediction.risks)
```

### 9. AI-Powered Insights Generation

**Purpose:** Comprehensive campaign analysis with AI narrative

**Features:**
- Executive summary generation
- Key findings extraction
- Action item identification
- Strategic recommendations
- Risk assessment
- Opportunity analysis
- AI-generated narrative reports

**Usage Example:**
```typescript
const insights = await aiService.generateInsights(campaigns)

console.log('Executive Summary:', insights.executive_summary)
console.log('Key Findings:', insights.key_findings)
console.log('Action Items:', insights.action_items)
console.log('AI Narrative:', insights.ai_narrative)
```

## React Components

### AIInsightsDashboard Component

**File:** `/components/ai-insights-dashboard.tsx`
**Purpose:** Complete UI for all AI features

**Features:**
- Tabbed interface for different AI features
- Real-time anomaly alerts
- Interactive prediction charts
- Optimization recommendation cards
- Sentiment analysis interface
- Competitor comparison visualizations

**Usage:**
```jsx
import { AIInsightsDashboard } from '@/components/ai-insights-dashboard'

<AIInsightsDashboard 
  campaigns={campaigns} 
  claudeApiKey={process.env.CLAUDE_API_KEY}
/>
```

### Enhanced Predictive Analytics Component

**File:** `/components/predictive-analytics.tsx`
**Purpose:** Advanced forecasting visualizations

**Features:**
- Multi-scenario predictions
- Confidence interval charts
- Risk analysis
- Interactive controls
- Trend visualizations

## API Routes

### AI Insights API

**File:** `/app/api/ai-insights/route.ts`
**Endpoint:** `POST /api/ai-insights`

**Supported Actions:**
- `predictions` - Get campaign predictions
- `anomalies` - Detect performance anomalies
- `recommendations` - Get optimization suggestions
- `trends` - Analyze performance trends
- `competitor` - Compare with industry benchmarks
- `sentiment` - Analyze ad copy sentiment
- `ab-test` - Analyze A/B test results
- `performance-prediction` - Predict future performance
- `insights` - Generate comprehensive insights

**Request Format:**
```json
{
  "action": "predictions",
  "campaigns": [...],
  "params": {
    "campaign": {...},
    "timeframe": "30d",
    "scenario": "moderate"
  },
  "claudeApiKey": "optional-api-key"
}
```

## Configuration

### Environment Variables

```env
CLAUDE_API_KEY=your-claude-api-key-here
```

### Type Definitions

**File:** `/lib/types.ts`
Contains all TypeScript interfaces for:
- Campaign data structures
- Prediction results
- Anomaly detection results
- Optimization recommendations
- A/B test results
- Competitor insights
- Sentiment analysis results

## Best Practices

### 1. Data Quality
- Ensure campaigns have sufficient historical data (minimum 7 days)
- Validate data before passing to AI functions
- Handle missing or null values appropriately

### 2. Performance Optimization
- Use caching for frequently accessed predictions
- Implement request throttling for API calls
- Consider batch processing for multiple campaigns

### 3. Error Handling
- Always wrap AI calls in try-catch blocks
- Provide fallback predictions when AI services fail
- Log errors for debugging and monitoring

### 4. User Experience
- Show loading states during AI processing
- Provide confidence levels for predictions
- Explain AI recommendations clearly

## Integration Examples

### Dashboard Integration
```jsx
// In your main dashboard component
import { AIInsightsDashboard } from '@/components/ai-insights-dashboard'
import { PredictiveAnalytics } from '@/components/predictive-analytics'

function Dashboard({ campaigns }) {
  return (
    <div>
      <PredictiveAnalytics campaigns={campaigns} />
      <AIInsightsDashboard campaigns={campaigns} />
    </div>
  )
}
```

### API Integration
```typescript
// Client-side usage
async function getAIInsights(campaigns: Campaign[]) {
  const response = await fetch('/api/ai-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'insights',
      campaigns,
      params: {}
    })
  })
  
  const result = await response.json()
  return result.data
}
```

## Advanced Features

### Custom Model Training
The system is designed to support custom ML model training with your specific campaign data:

```typescript
// Future enhancement - custom model training
const customModel = await aiService.trainCustomModel({
  campaigns: historicalCampaigns,
  features: ['spend', 'impressions', 'clicks', 'conversions'],
  target: 'roas',
  modelType: 'xgboost'
})
```

### Real-time Monitoring
Set up automated anomaly monitoring:

```typescript
// Future enhancement - real-time alerts
const monitor = new AnomalyMonitor({
  campaigns,
  checkInterval: '1h',
  onAnomalyDetected: (anomaly) => {
    sendSlackAlert(anomaly)
    pauseCampaignIfSevere(anomaly)
  }
})
```

## Troubleshooting

### Common Issues

1. **Claude API Rate Limits**
   - Implement exponential backoff
   - Use fallback predictions when API is unavailable
   - Cache API responses

2. **Insufficient Historical Data**
   - Require minimum 7 days of data
   - Use industry benchmarks as fallback
   - Clearly indicate confidence levels

3. **Model Accuracy**
   - Validate predictions against actual results
   - Continuously update model parameters
   - Use ensemble methods for better accuracy

### Performance Monitoring

Monitor AI feature performance:
- Prediction accuracy over time
- API response times
- Error rates
- User engagement with recommendations

## Future Enhancements

1. **Advanced ML Models**
   - Deep learning models
   - Real-time model updates
   - Custom model training

2. **Expanded Data Sources**
   - External market data
   - Weather data correlation
   - Economic indicators

3. **Automated Actions**
   - Auto-pause underperforming campaigns
   - Automatic budget reallocation
   - Smart bidding adjustments

4. **Enhanced Visualizations**
   - 3D trend analysis
   - Interactive model explanations
   - Real-time dashboards

This comprehensive AI system provides Meta Ads managers with powerful tools to optimize campaigns, predict performance, and make data-driven decisions with confidence.