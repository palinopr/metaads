# Meta Ads Dashboard Pro - Features Guide

## 🚀 Quick Start
1. Open http://localhost:3000
2. Click Settings (⚙️) 
3. Add Meta API credentials
4. Start exploring your campaigns!

## 📊 Dashboard Features

### 1. **Main Dashboard**
- **Stats Cards**: Total revenue, ROAS, conversions, active campaigns
- **Quick Actions**: Jump to AI insights, predictions, or benchmarks
- **Top Campaigns Preview**: See your best performers at a glance

### 2. **AI Insights Tab** 🧠
- **Automatic Opportunity Detection**: AI finds ways to improve performance
- **Prioritized Recommendations**: Sorted by potential impact
- **ROI Estimates**: See potential revenue gains
- **One-Click Actions**: Apply recommendations easily

### 3. **Predictive Analytics Tab** ✨
- **Forecasting**: 7, 30, or 90-day predictions
- **Scenarios**: Conservative, Moderate, or Aggressive growth
- **Confidence Intervals**: See prediction accuracy
- **Visual Charts**: Revenue, ROAS, and conversion trends

### 4. **Competitor Benchmark Tab** 🏆
- **Industry Comparison**: See how you rank
- **Performance Metrics**: ROAS, CTR, CPC vs industry
- **Improvement Suggestions**: Specific actions to beat competitors
- **Visual Rankings**: Radar charts and progress bars

### 5. **Campaigns Tab** 📈
- **Expandable Rows**: Click ▶ to see AI predictions for each campaign
- **Performance Scores**: 0-100 rating for each campaign
- **Real-time Metrics**: Today's data + lifetime performance
- **Quick Actions**: View detailed analytics for any campaign

### 6. **Compare Tab** 🔄
- **Side-by-Side Comparison**: Select up to 4 campaigns
- **Visual Charts**: Bar and radar charts
- **Winner Analysis**: See which campaign wins each metric
- **Detailed Table**: All metrics in one view

## 🎯 Individual Campaign Features

### Campaign Detail View
Click "View Details" on any campaign to see:
- **Complete History**: Every day since campaign started
- **Budget Tracking**: Daily spend and remaining budget
- **Performance Trends**: Visual charts of all metrics
- **AI Predictions**: Specific forecasts for this campaign
- **Export Data**: Download CSV for further analysis

### Inline Predictions
- Click the ▶ chevron next to any campaign name
- See 7 or 30-day predictions
- Choose growth scenario
- View mini chart with revenue/spend forecast

## 🔧 Advanced Features

### Date Filtering
- **Today**: See only today's performance
- **Yesterday**: Review yesterday's results  
- **All Time**: Complete campaign history

### System Status Panel
When no campaigns show, check:
- ✅ Internet connection
- ✅ API credentials configured
- ✅ Meta API connection status
- ✅ Application status

### Debug Panel
Click the 🐛 bug icon to:
- Test API connection
- See raw API responses
- Troubleshoot issues
- Verify credentials

## 🤖 AI Features

### Without Claude API (Default)
- Basic trend predictions
- Rule-based anomaly detection
- Generic recommendations
- Simple forecasting

### With Claude API (Enhanced)
- ML-powered predictions
- Context-aware insights
- Personalized recommendations
- Advanced anomaly detection
- Risk assessment
- Opportunity identification

### How to Enable Claude AI
1. Go to AI Settings (in Settings panel)
2. Add your Claude API key
3. Toggle "Use AI-Powered Predictions"
4. Save and refresh

## 📱 Responsive Design
- Works on desktop, tablet, and mobile
- Optimized tables with horizontal scroll
- Collapsible sections for small screens

## ⚡ Performance Tips

### For Faster Loading
1. Use date filters to limit data
2. Close unused tabs
3. Minimize expanded campaign rows

### For Better Predictions
1. Run campaigns for at least 7 days
2. Ensure consistent daily data
3. Use Claude API for best results

## 🔍 Troubleshooting

### Nothing Showing?
Run: `./diagnose.sh`

### Server Issues?
Run: `./scripts/health-check.sh`

### API Errors?
1. Check Debug Panel
2. Verify credentials in Settings
3. Check Meta Business Manager permissions

## 🎨 Customization

### Modify Predictions
Edit: `/lib/ai-predictions.ts`

### Change UI Theme
Edit: `/app/globals.css`

### Add New Metrics
Edit: `/lib/meta-api-client.ts`

## 📈 Best Practices

1. **Review AI Insights Daily**: Check for new opportunities
2. **Compare Campaigns Weekly**: Identify winners and losers
3. **Update Predictions**: Refresh forecasts as data changes
4. **Export Data**: Keep historical records
5. **Test Scenarios**: Use prediction scenarios for planning

## 🚦 Status Indicators

- 🟢 **Green**: Good performance/health
- 🟡 **Yellow**: Needs attention
- 🔴 **Red**: Poor performance/issues
- 🔵 **Blue**: Informational

## 🔐 Security Notes

- API keys stored locally (browser)
- No data sent to external servers (except Meta/Claude APIs)
- All processing done client-side
- Consider backend storage for production

---

Need help? Check `/TROUBLESHOOTING.md` or run `./diagnose.sh`