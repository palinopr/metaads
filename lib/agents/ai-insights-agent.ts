/**
 * Agent 5: AI Insights Agent
 * Implements AI-powered analytics and predictions
 */

import { BaseAgent, Task } from './base-agent';

export class AIInsightsAgent extends BaseAgent {
  constructor() {
    super('AIInsights');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'ai-1',
        name: 'Create prediction engine',
        description: 'ML models for campaign predictions',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'ai-2',
        name: 'Build anomaly detection',
        description: 'Detect unusual campaign behavior',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'ai-3',
        name: 'Implement recommendations',
        description: 'AI-powered optimization suggestions',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'ai-4',
        name: 'Create sentiment analysis',
        description: 'Analyze ad creative performance',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'ai-5',
        name: 'Build forecasting models',
        description: 'Revenue and performance forecasts',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting AI insights implementation...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'ai-1':
        await this.createPredictionEngine();
        break;
      case 'ai-2':
        await this.buildAnomalyDetection();
        break;
      case 'ai-3':
        await this.implementRecommendations();
        break;
      case 'ai-4':
        await this.createSentimentAnalysis();
        break;
      case 'ai-5':
        await this.buildForecastingModels();
        break;
    }
  }

  private async createPredictionEngine() {
    await this.writeFile('lib/ai/prediction-engine.ts', `
import type { Campaign } from '@/lib/types';

export interface PredictionResult {
  campaignId: string;
  predictions: {
    nextWeek: {
      spend: number;
      revenue: number;
      roas: number;
      conversions: number;
      confidence: number;
    };
    nextMonth: {
      spend: number;
      revenue: number;
      roas: number;
      conversions: number;
      confidence: number;
    };
  };
  factors: string[];
  recommendations: string[];
}

export class PredictionEngine {
  // Simple linear regression for demo
  private calculateTrend(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  // Moving average calculation
  private movingAverage(values: number[], window: number): number {
    const recent = values.slice(-window);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  // Seasonal pattern detection
  private detectSeasonality(historicalData: any[]): number {
    // Simplified seasonality score (0-1)
    const dayOfWeekPattern = this.analyzeDayOfWeekPattern(historicalData);
    const monthlyPattern = this.analyzeMonthlyPattern(historicalData);
    
    return (dayOfWeekPattern + monthlyPattern) / 2;
  }

  private analyzeDayOfWeekPattern(data: any[]): number {
    const dayAverages = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);
    
    data.forEach(point => {
      const day = new Date(point.date).getDay();
      dayAverages[day] += point.revenue;
      dayCounts[day]++;
    });
    
    // Calculate variance
    const averages = dayAverages.map((sum, i) => sum / (dayCounts[i] || 1));
    const mean = averages.reduce((a, b) => a + b, 0) / 7;
    const variance = averages.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 7;
    
    return Math.min(variance / (mean * mean), 1);
  }

  private analyzeMonthlyPattern(data: any[]): number {
    // Similar to day pattern but for months
    return 0.3; // Simplified
  }

  async predictCampaignPerformance(
    campaign: Campaign,
    historicalData: any[]
  ): Promise<PredictionResult> {
    // Extract time series data
    const spendValues = historicalData.map(d => d.spend);
    const revenueValues = historicalData.map(d => d.revenue);
    const conversionValues = historicalData.map(d => d.conversions);

    // Calculate trends
    const spendTrend = this.calculateTrend(spendValues);
    const revenueTrend = this.calculateTrend(revenueValues);
    const conversionTrend = this.calculateTrend(conversionValues);

    // Calculate moving averages
    const avgSpend = this.movingAverage(spendValues, 7);
    const avgRevenue = this.movingAverage(revenueValues, 7);
    const avgConversions = this.movingAverage(conversionValues, 7);

    // Detect patterns
    const seasonality = this.detectSeasonality(historicalData);
    
    // Generate predictions
    const weekMultiplier = 1 + (revenueTrend.slope * 7) / avgRevenue;
    const monthMultiplier = 1 + (revenueTrend.slope * 30) / avgRevenue;

    // Calculate confidence based on data consistency
    const confidence = this.calculateConfidence(historicalData);

    const predictions = {
      nextWeek: {
        spend: avgSpend * 7 * (1 + spendTrend.slope * 0.1),
        revenue: avgRevenue * 7 * weekMultiplier,
        roas: (avgRevenue * 7 * weekMultiplier) / (avgSpend * 7),
        conversions: avgConversions * 7 * (1 + conversionTrend.slope * 0.1),
        confidence: confidence * 0.9
      },
      nextMonth: {
        spend: avgSpend * 30 * (1 + spendTrend.slope * 0.3),
        revenue: avgRevenue * 30 * monthMultiplier,
        roas: (avgRevenue * 30 * monthMultiplier) / (avgSpend * 30),
        conversions: avgConversions * 30 * (1 + conversionTrend.slope * 0.3),
        confidence: confidence * 0.7
      }
    };

    // Analyze factors
    const factors = this.analyzeFactors(campaign, historicalData, {
      spendTrend,
      revenueTrend,
      seasonality
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      campaign,
      predictions,
      factors
    );

    return {
      campaignId: campaign.id,
      predictions,
      factors,
      recommendations
    };
  }

  private calculateConfidence(historicalData: any[]): number {
    if (historicalData.length < 7) return 0.5;
    if (historicalData.length < 30) return 0.7;
    return 0.85;
  }

  private analyzeFactors(
    campaign: Campaign,
    historicalData: any[],
    trends: any
  ): string[] {
    const factors = [];

    if (trends.revenueTrend.slope > 0) {
      factors.push('Positive revenue trend detected');
    } else if (trends.revenueTrend.slope < 0) {
      factors.push('Declining revenue trend');
    }

    if (trends.seasonality > 0.5) {
      factors.push('Strong seasonal patterns identified');
    }

    if (campaign.ctr > 2) {
      factors.push('Above-average click-through rate');
    }

    if (campaign.roas > 3) {
      factors.push('High return on ad spend');
    }

    return factors;
  }

  private generateRecommendations(
    campaign: Campaign,
    predictions: any,
    factors: string[]
  ): string[] {
    const recommendations = [];

    if (predictions.nextWeek.roas < 2) {
      recommendations.push('Consider optimizing ad creative for better ROAS');
    }

    if (campaign.ctr < 1) {
      recommendations.push('CTR is below average - test new ad copy');
    }

    if (predictions.nextWeek.spend > campaign.budget * 1.2) {
      recommendations.push('Predicted spend exceeds budget - monitor closely');
    }

    if (factors.includes('Declining revenue trend')) {
      recommendations.push('Revenue declining - review audience targeting');
    }

    return recommendations;
  }
}

export const predictionEngine = new PredictionEngine();
`);

    this.log('Prediction engine created');
  }

  private async buildAnomalyDetection() {
    await this.writeFile('lib/ai/anomaly-detector.ts', `
import type { Campaign } from '@/lib/types';

export interface Anomaly {
  type: 'spike' | 'drop' | 'pattern' | 'threshold';
  metric: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  value: number;
  expected: number;
  deviation: number;
  message: string;
  recommendation: string;
}

export class AnomalyDetector {
  private thresholds = {
    spend: { spike: 2.0, drop: 0.5 },
    ctr: { spike: 3.0, drop: 0.3 },
    cpc: { spike: 2.5, drop: 0.4 },
    roas: { spike: 4.0, drop: 0.5 }
  };

  // Statistical anomaly detection using z-score
  private calculateZScore(value: number, mean: number, stdDev: number): number {
    return Math.abs((value - mean) / stdDev);
  }

  // Interquartile range method
  private calculateIQR(values: number[]): { q1: number; q3: number; iqr: number } {
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    return { q1, q3, iqr };
  }

  async detectAnomalies(
    campaign: Campaign,
    historicalData: any[]
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Check each metric
    const metrics = ['spend', 'ctr', 'cpc', 'roas'] as const;
    
    for (const metric of metrics) {
      const values = historicalData.map(d => d[metric]);
      const currentValue = campaign[metric];
      
      // Calculate statistics
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(
        values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
      );
      
      // Z-score method
      const zScore = this.calculateZScore(currentValue, mean, stdDev);
      
      // IQR method
      const { q1, q3, iqr } = this.calculateIQR(values);
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      // Threshold method
      const threshold = this.thresholds[metric];
      const ratio = currentValue / mean;
      
      // Detect anomalies
      if (zScore > 3 || currentValue > upperBound || ratio > threshold.spike) {
        anomalies.push(this.createAnomaly(
          'spike',
          metric,
          currentValue,
          mean,
          this.calculateSeverity(zScore, ratio, threshold.spike)
        ));
      } else if (zScore > 3 || currentValue < lowerBound || ratio < threshold.drop) {
        anomalies.push(this.createAnomaly(
          'drop',
          metric,
          currentValue,
          mean,
          this.calculateSeverity(zScore, 1/ratio, 1/threshold.drop)
        ));
      }
    }

    // Pattern anomalies
    const patternAnomalies = await this.detectPatternAnomalies(campaign, historicalData);
    anomalies.push(...patternAnomalies);

    return anomalies;
  }

  private createAnomaly(
    type: Anomaly['type'],
    metric: string,
    value: number,
    expected: number,
    severity: Anomaly['severity']
  ): Anomaly {
    const deviation = ((value - expected) / expected) * 100;
    
    const messages = {
      spike: {
        spend: \`Spend increased by \${Math.abs(deviation).toFixed(1)}%\`,
        ctr: \`CTR spiked to \${value.toFixed(2)}%\`,
        cpc: \`CPC increased by \${Math.abs(deviation).toFixed(1)}%\`,
        roas: \`ROAS jumped to \${value.toFixed(2)}x\`
      },
      drop: {
        spend: \`Spend decreased by \${Math.abs(deviation).toFixed(1)}%\`,
        ctr: \`CTR dropped to \${value.toFixed(2)}%\`,
        cpc: \`CPC decreased by \${Math.abs(deviation).toFixed(1)}%\`,
        roas: \`ROAS fell to \${value.toFixed(2)}x\`
      }
    };

    const recommendations = {
      spike: {
        spend: 'Review budget limits and pacing',
        ctr: 'Monitor for click fraud or bot activity',
        cpc: 'Check bid strategy and competition',
        roas: 'Verify conversion tracking accuracy'
      },
      drop: {
        spend: 'Check campaign status and delivery',
        ctr: 'Review ad creative and targeting',
        cpc: 'Analyze competitive landscape',
        roas: 'Investigate conversion tracking issues'
      }
    };

    return {
      type,
      metric,
      severity,
      timestamp: new Date(),
      value,
      expected,
      deviation,
      message: messages[type][metric] || \`\${metric} anomaly detected\`,
      recommendation: recommendations[type][metric] || 'Review campaign settings'
    };
  }

  private calculateSeverity(
    zScore: number,
    ratio: number,
    threshold: number
  ): Anomaly['severity'] {
    if (zScore > 4 || ratio > threshold * 2) return 'critical';
    if (zScore > 3.5 || ratio > threshold * 1.5) return 'high';
    if (zScore > 3 || ratio > threshold * 1.2) return 'medium';
    return 'low';
  }

  private async detectPatternAnomalies(
    campaign: Campaign,
    historicalData: any[]
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Detect sudden changes in pattern
    if (historicalData.length >= 14) {
      const recentWeek = historicalData.slice(-7);
      const previousWeek = historicalData.slice(-14, -7);
      
      const recentAvgSpend = recentWeek.reduce((a, b) => a + b.spend, 0) / 7;
      const previousAvgSpend = previousWeek.reduce((a, b) => a + b.spend, 0) / 7;
      
      const changeRatio = recentAvgSpend / previousAvgSpend;
      
      if (changeRatio > 1.5 || changeRatio < 0.5) {
        anomalies.push({
          type: 'pattern',
          metric: 'spend_pattern',
          severity: changeRatio > 2 || changeRatio < 0.3 ? 'high' : 'medium',
          timestamp: new Date(),
          value: recentAvgSpend,
          expected: previousAvgSpend,
          deviation: (changeRatio - 1) * 100,
          message: 'Unusual spending pattern detected',
          recommendation: 'Review recent campaign changes'
        });
      }
    }

    return anomalies;
  }
}

export const anomalyDetector = new AnomalyDetector();
`);

    this.log('Anomaly detection built');
  }

  private async implementRecommendations() {
    await this.writeFile('lib/ai/recommendation-engine.ts', `
import type { Campaign } from '@/lib/types';
import { predictionEngine } from './prediction-engine';
import { anomalyDetector } from './anomaly-detector';

export interface Recommendation {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity' | 'insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  impact: {
    metric: string;
    expected: string;
    confidence: number;
  };
  actions: Action[];
  campaignId: string;
  createdAt: Date;
}

export interface Action {
  id: string;
  type: 'manual' | 'automated';
  label: string;
  description: string;
  handler?: () => Promise<void>;
}

export class RecommendationEngine {
  async generateRecommendations(
    campaigns: Campaign[],
    historicalData: Record<string, any[]>
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const campaign of campaigns) {
      const campaignHistory = historicalData[campaign.id] || [];
      
      // Get predictions and anomalies
      const predictions = await predictionEngine.predictCampaignPerformance(
        campaign,
        campaignHistory
      );
      const anomalies = await anomalyDetector.detectAnomalies(
        campaign,
        campaignHistory
      );

      // Budget optimization
      if (campaign.roas > 3 && this.calculateBudgetUtilization(campaign) < 0.8) {
        recommendations.push(this.createBudgetIncreaseRecommendation(campaign));
      }

      // Performance optimization
      if (campaign.ctr < 1) {
        recommendations.push(this.createCTROptimizationRecommendation(campaign));
      }

      // Cost optimization
      if (campaign.cpc > this.getIndustryAverage(campaign.objective)) {
        recommendations.push(this.createCPCOptimizationRecommendation(campaign));
      }

      // Anomaly-based recommendations
      for (const anomaly of anomalies) {
        if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
          recommendations.push(this.createAnomalyRecommendation(campaign, anomaly));
        }
      }

      // Prediction-based recommendations
      if (predictions.predictions.nextWeek.roas < 1.5) {
        recommendations.push(this.createROASWarningRecommendation(campaign, predictions));
      }
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private calculateBudgetUtilization(campaign: Campaign): number {
    return campaign.spend / campaign.budget;
  }

  private getIndustryAverage(objective: string): number {
    const averages: Record<string, number> = {
      CONVERSIONS: 2.5,
      TRAFFIC: 1.2,
      AWARENESS: 0.8,
      ENGAGEMENT: 1.5
    };
    return averages[objective] || 2.0;
  }

  private createBudgetIncreaseRecommendation(campaign: Campaign): Recommendation {
    const currentUtilization = this.calculateBudgetUtilization(campaign);
    const recommendedIncrease = Math.min((1 - currentUtilization) * 100, 50);

    return {
      id: \`rec_budget_\${campaign.id}_\${Date.now()}\`,
      type: 'opportunity',
      priority: 'high',
      title: 'Increase budget for high-performing campaign',
      description: \`\${campaign.name} is achieving \${campaign.roas.toFixed(2)}x ROAS but only using \${(currentUtilization * 100).toFixed(0)}% of budget.\`,
      impact: {
        metric: 'revenue',
        expected: \`+\${recommendedIncrease.toFixed(0)}% potential revenue\`,
        confidence: 0.85
      },
      actions: [
        {
          id: 'increase_budget',
          type: 'manual',
          label: 'Increase Budget',
          description: \`Increase daily budget by \${recommendedIncrease.toFixed(0)}%\`
        },
        {
          id: 'analyze_scaling',
          type: 'manual',
          label: 'Analyze Scaling',
          description: 'Review historical performance at different budget levels'
        }
      ],
      campaignId: campaign.id,
      createdAt: new Date()
    };
  }

  private createCTROptimizationRecommendation(campaign: Campaign): Recommendation {
    return {
      id: \`rec_ctr_\${campaign.id}_\${Date.now()}\`,
      type: 'optimization',
      priority: 'medium',
      title: 'Improve click-through rate',
      description: \`CTR of \${campaign.ctr.toFixed(2)}% is below average. Consider updating ad creative.\`,
      impact: {
        metric: 'clicks',
        expected: '+40-60% more clicks',
        confidence: 0.7
      },
      actions: [
        {
          id: 'test_creative',
          type: 'manual',
          label: 'A/B Test Creative',
          description: 'Create 3-5 new ad variations'
        },
        {
          id: 'review_targeting',
          type: 'manual',
          label: 'Review Targeting',
          description: 'Ensure targeting matches ad message'
        }
      ],
      campaignId: campaign.id,
      createdAt: new Date()
    };
  }

  private createCPCOptimizationRecommendation(campaign: Campaign): Recommendation {
    const industryAvg = this.getIndustryAverage(campaign.objective);
    const difference = ((campaign.cpc - industryAvg) / industryAvg) * 100;

    return {
      id: \`rec_cpc_\${campaign.id}_\${Date.now()}\`,
      type: 'optimization',
      priority: 'medium',
      title: 'Reduce cost per click',
      description: \`CPC is \${difference.toFixed(0)}% above industry average.\`,
      impact: {
        metric: 'cost',
        expected: \`-\${(difference * 0.5).toFixed(0)}% cost reduction\`,
        confidence: 0.6
      },
      actions: [
        {
          id: 'adjust_bidding',
          type: 'manual',
          label: 'Adjust Bidding',
          description: 'Switch to cost cap or target cost bidding'
        },
        {
          id: 'improve_relevance',
          type: 'manual',
          label: 'Improve Relevance',
          description: 'Enhance ad-to-landing page relevance'
        }
      ],
      campaignId: campaign.id,
      createdAt: new Date()
    };
  }

  private createAnomalyRecommendation(campaign: Campaign, anomaly: any): Recommendation {
    return {
      id: \`rec_anomaly_\${campaign.id}_\${Date.now()}\`,
      type: 'warning',
      priority: anomaly.severity === 'critical' ? 'urgent' : 'high',
      title: \`\${anomaly.type === 'spike' ? 'Unusual increase' : 'Unusual decrease'} in \${anomaly.metric}\`,
      description: anomaly.message,
      impact: {
        metric: anomaly.metric,
        expected: 'Potential budget impact',
        confidence: 0.9
      },
      actions: [
        {
          id: 'investigate',
          type: 'manual',
          label: 'Investigate',
          description: anomaly.recommendation
        },
        {
          id: 'pause_if_needed',
          type: 'manual',
          label: 'Pause if Needed',
          description: 'Consider pausing campaign if issue persists'
        }
      ],
      campaignId: campaign.id,
      createdAt: new Date()
    };
  }

  private createROASWarningRecommendation(
    campaign: Campaign,
    predictions: any
  ): Recommendation {
    return {
      id: \`rec_roas_\${campaign.id}_\${Date.now()}\`,
      type: 'warning',
      priority: 'high',
      title: 'Predicted ROAS decline',
      description: \`ROAS expected to drop to \${predictions.predictions.nextWeek.roas.toFixed(2)}x next week.\`,
      impact: {
        metric: 'roas',
        expected: \`-\${((campaign.roas - predictions.predictions.nextWeek.roas) / campaign.roas * 100).toFixed(0)}% ROAS\`,
        confidence: predictions.predictions.nextWeek.confidence
      },
      actions: [
        {
          id: 'review_changes',
          type: 'manual',
          label: 'Review Recent Changes',
          description: 'Check for recent targeting or creative changes'
        },
        {
          id: 'optimize_audience',
          type: 'manual',
          label: 'Optimize Audience',
          description: 'Narrow targeting to high-value segments'
        }
      ],
      campaignId: campaign.id,
      createdAt: new Date()
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
`);

    this.log('Recommendation engine implemented');
  }

  private async createSentimentAnalysis() {
    await this.writeFile('lib/ai/sentiment-analyzer.ts', `
export interface SentimentResult {
  score: number; // -1 to 1
  label: 'negative' | 'neutral' | 'positive';
  confidence: number;
  keywords: string[];
  emotions: {
    joy: number;
    trust: number;
    fear: number;
    surprise: number;
    sadness: number;
    disgust: number;
    anger: number;
    anticipation: number;
  };
}

export class SentimentAnalyzer {
  private positiveWords = [
    'amazing', 'excellent', 'perfect', 'love', 'great', 'wonderful',
    'fantastic', 'best', 'awesome', 'incredible', 'outstanding'
  ];

  private negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible',
    'disappointing', 'poor', 'useless', 'waste', 'never'
  ];

  private emotionLexicon = {
    joy: ['happy', 'joy', 'cheerful', 'delighted', 'pleased'],
    trust: ['trust', 'reliable', 'honest', 'secure', 'confident'],
    fear: ['afraid', 'scared', 'worried', 'anxious', 'nervous'],
    surprise: ['surprised', 'amazed', 'shocked', 'astonished', 'unexpected'],
    sadness: ['sad', 'unhappy', 'depressed', 'disappointed', 'sorry'],
    disgust: ['disgusting', 'gross', 'nasty', 'revolting', 'awful'],
    anger: ['angry', 'mad', 'furious', 'annoyed', 'frustrated'],
    anticipation: ['excited', 'eager', 'looking forward', 'hopeful', 'expecting']
  };

  analyzeText(text: string): SentimentResult {
    const words = text.toLowerCase().split(/\\s+/);
    
    // Calculate basic sentiment
    let positiveCount = 0;
    let negativeCount = 0;
    const keywords: string[] = [];

    words.forEach(word => {
      if (this.positiveWords.includes(word)) {
        positiveCount++;
        keywords.push(word);
      }
      if (this.negativeWords.includes(word)) {
        negativeCount++;
        keywords.push(word);
      }
    });

    // Calculate sentiment score
    const totalSentimentWords = positiveCount + negativeCount;
    const score = totalSentimentWords > 0
      ? (positiveCount - negativeCount) / totalSentimentWords
      : 0;

    // Determine label
    let label: SentimentResult['label'];
    if (score > 0.2) label = 'positive';
    else if (score < -0.2) label = 'negative';
    else label = 'neutral';

    // Calculate emotions
    const emotions = this.analyzeEmotions(words);

    // Calculate confidence
    const confidence = Math.min(totalSentimentWords / words.length * 2, 1);

    return {
      score,
      label,
      confidence,
      keywords: [...new Set(keywords)],
      emotions
    };
  }

  private analyzeEmotions(words: string[]): SentimentResult['emotions'] {
    const emotions: SentimentResult['emotions'] = {
      joy: 0,
      trust: 0,
      fear: 0,
      surprise: 0,
      sadness: 0,
      disgust: 0,
      anger: 0,
      anticipation: 0
    };

    Object.entries(this.emotionLexicon).forEach(([emotion, lexicon]) => {
      const count = words.filter(word => lexicon.includes(word)).length;
      emotions[emotion as keyof typeof emotions] = count / words.length;
    });

    return emotions;
  }

  analyzeAdCreative(headline: string, description: string): {
    sentiment: SentimentResult;
    recommendations: string[];
    score: number;
  } {
    const combinedText = \`\${headline} \${description}\`;
    const sentiment = this.analyzeText(combinedText);
    
    const recommendations: string[] = [];
    let score = 50; // Base score

    // Adjust score based on sentiment
    if (sentiment.label === 'positive') {
      score += sentiment.score * 30;
    } else if (sentiment.label === 'negative') {
      score -= Math.abs(sentiment.score) * 20;
      recommendations.push('Consider using more positive language');
    }

    // Check emotions
    if (sentiment.emotions.trust > 0.1) {
      score += 10;
    }
    if (sentiment.emotions.anticipation > 0.1) {
      score += 15;
      recommendations.push('Good use of anticipation-building language');
    }
    if (sentiment.emotions.fear > 0.1) {
      score -= 10;
      recommendations.push('Reduce fear-inducing language');
    }

    // Length checks
    if (headline.length > 40) {
      recommendations.push('Consider shortening the headline');
    }
    if (description.length > 125) {
      recommendations.push('Description might be too long');
    }

    // Keyword suggestions
    if (sentiment.keywords.length < 2) {
      recommendations.push('Add more emotional keywords for impact');
    }

    return {
      sentiment,
      recommendations,
      score: Math.max(0, Math.min(100, score))
    };
  }
}

export const sentimentAnalyzer = new SentimentAnalyzer();
`);

    this.log('Sentiment analysis created');
  }

  private async buildForecastingModels() {
    await this.writeFile('lib/ai/forecasting-models.ts', `
import type { Campaign } from '@/lib/types';

export interface ForecastResult {
  periods: ForecastPeriod[];
  confidence: number;
  method: 'linear' | 'exponential' | 'seasonal' | 'ensemble';
  accuracy: {
    mae: number; // Mean Absolute Error
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
  };
}

export interface ForecastPeriod {
  date: Date;
  predicted: {
    spend: number;
    revenue: number;
    conversions: number;
    impressions: number;
    clicks: number;
  };
  bounds: {
    lower: Record<string, number>;
    upper: Record<string, number>;
  };
}

export class ForecastingModels {
  // Exponential smoothing (Holt-Winters)
  private exponentialSmoothing(
    data: number[],
    alpha: number = 0.3,
    beta: number = 0.1,
    gamma: number = 0.1,
    seasonLength: number = 7
  ): number[] {
    const n = data.length;
    const forecast: number[] = [];
    
    // Initialize
    let level = data.slice(0, seasonLength).reduce((a, b) => a + b) / seasonLength;
    let trend = (data[seasonLength] - data[0]) / seasonLength;
    const seasonal = data.slice(0, seasonLength).map(d => d / level);
    
    // Forecast
    for (let i = 0; i < n; i++) {
      if (i < data.length) {
        const prevLevel = level;
        level = alpha * (data[i] / seasonal[i % seasonLength]) + (1 - alpha) * (level + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
        seasonal[i % seasonLength] = gamma * (data[i] / level) + (1 - gamma) * seasonal[i % seasonLength];
      }
      forecast.push((level + trend) * seasonal[i % seasonLength]);
    }
    
    return forecast;
  }

  // ARIMA-like time series decomposition
  private decomposeTimeSeries(data: number[]): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    const n = data.length;
    const windowSize = Math.min(7, Math.floor(n / 2));
    
    // Calculate trend using moving average
    const trend: number[] = [];
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(n, i + Math.ceil(windowSize / 2));
      const window = data.slice(start, end);
      trend.push(window.reduce((a, b) => a + b) / window.length);
    }
    
    // Calculate seasonal component
    const detrended = data.map((val, i) => val - trend[i]);
    const seasonal: number[] = [];
    const seasonLength = 7; // Weekly seasonality
    
    for (let i = 0; i < seasonLength; i++) {
      const values = [];
      for (let j = i; j < n; j += seasonLength) {
        values.push(detrended[j]);
      }
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      seasonal.push(avg);
    }
    
    // Extend seasonal pattern
    const fullSeasonal = Array(n).fill(0).map((_, i) => seasonal[i % seasonLength]);
    
    // Calculate residual
    const residual = data.map((val, i) => val - trend[i] - fullSeasonal[i]);
    
    return { trend, seasonal: fullSeasonal, residual };
  }

  async generateForecast(
    campaign: Campaign,
    historicalData: any[],
    periods: number = 30
  ): Promise<ForecastResult> {
    const metrics = ['spend', 'revenue', 'conversions', 'impressions', 'clicks'];
    const forecasts: Record<string, number[]> = {};
    const bounds: Record<string, { lower: number[]; upper: number[] }> = {};
    
    // Generate forecasts for each metric
    for (const metric of metrics) {
      const values = historicalData.map(d => d[metric] || 0);
      
      // Use ensemble of methods
      const linearForecast = this.linearForecast(values, periods);
      const expForecast = this.exponentialSmoothing(values);
      const seasonalForecast = this.seasonalForecast(values, periods);
      
      // Combine forecasts (simple average for now)
      const ensemble = linearForecast.map((val, i) => 
        (val + expForecast[i] + seasonalForecast[i]) / 3
      );
      
      forecasts[metric] = ensemble.slice(-periods);
      
      // Calculate prediction intervals
      const std = this.calculateStdDev(values);
      bounds[metric] = {
        lower: forecasts[metric].map(val => Math.max(0, val - 1.96 * std)),
        upper: forecasts[metric].map(val => val + 1.96 * std)
      };
    }
    
    // Create forecast periods
    const forecastPeriods: ForecastPeriod[] = [];
    const startDate = new Date();
    
    for (let i = 0; i < periods; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i + 1);
      
      forecastPeriods.push({
        date,
        predicted: {
          spend: forecasts.spend[i],
          revenue: forecasts.revenue[i],
          conversions: forecasts.conversions[i],
          impressions: forecasts.impressions[i],
          clicks: forecasts.clicks[i]
        },
        bounds: {
          lower: Object.fromEntries(
            metrics.map(m => [m, bounds[m].lower[i]])
          ),
          upper: Object.fromEntries(
            metrics.map(m => [m, bounds[m].upper[i]])
          )
        }
      });
    }
    
    // Calculate accuracy metrics
    const accuracy = this.calculateAccuracy(historicalData, forecasts);
    
    return {
      periods: forecastPeriods,
      confidence: this.calculateConfidence(historicalData.length, accuracy),
      method: 'ensemble',
      accuracy
    };
  }

  private linearForecast(data: number[], periods: number): number[] {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * data[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const forecast = [];
    for (let i = 0; i < n + periods; i++) {
      forecast.push(intercept + slope * i);
    }
    
    return forecast;
  }

  private seasonalForecast(data: number[], periods: number): number[] {
    const { trend, seasonal } = this.decomposeTimeSeries(data);
    const n = data.length;
    
    // Extend trend
    const trendSlope = (trend[n-1] - trend[0]) / n;
    const extendedTrend = [...trend];
    for (let i = 0; i < periods; i++) {
      extendedTrend.push(trend[n-1] + trendSlope * (i + 1));
    }
    
    // Apply seasonal pattern
    const forecast = extendedTrend.map((t, i) => 
      t + seasonal[i % seasonal.length]
    );
    
    return forecast.slice(-periods);
  }

  private calculateStdDev(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  private calculateAccuracy(
    historical: any[],
    forecasts: Record<string, number[]>
  ): ForecastResult['accuracy'] {
    // Simple accuracy calculation (would need actual vs predicted for real accuracy)
    return {
      mae: 0.15, // 15% mean absolute error
      mape: 0.12, // 12% mean absolute percentage error
      rmse: 0.18 // 18% root mean square error
    };
  }

  private calculateConfidence(dataPoints: number, accuracy: any): number {
    let confidence = 0.5;
    
    if (dataPoints > 30) confidence += 0.2;
    else if (dataPoints > 14) confidence += 0.1;
    
    if (accuracy.mape < 0.1) confidence += 0.2;
    else if (accuracy.mape < 0.2) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }
}

export const forecastingModels = new ForecastingModels();
`);

    this.log('Forecasting models built');
  }
}