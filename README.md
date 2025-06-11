# Meta Ads Dashboard Pro 🚀

An advanced Meta Ads management platform with AI-powered insights, predictive analytics, and comprehensive campaign tracking. Built to be the best Meta Ads platform available.

## ✨ Features

### Core Dashboard
- 📊 **Real-time Dashboard** - Complete overview of all campaigns with live metrics
- 📈 **Campaign Details** - Full historical data from campaign start date
- 📅 **Date Filtering** - View today, yesterday, or all-time data
- 🔍 **Debug Panel** - Built-in API troubleshooting tools
- 💾 **Data Export** - Download campaign data as CSV

### AI-Powered Features
- 🧠 **AI Insights** - Automatic recommendations and opportunity detection
- ✨ **Predictive Analytics** - 7/30/90 day forecasts with multiple scenarios
- 🎯 **Individual Campaign Predictions** - AI forecasts for each campaign
- 🚨 **Anomaly Detection** - Real-time alerts for unusual performance
- 🤖 **Claude AI Integration** - Optional advanced ML predictions

### Advanced Analytics
- 🏆 **Competitor Benchmarking** - Compare to industry standards
- 📊 **Campaign Comparison** - Side-by-side analysis of up to 4 campaigns
- 📈 **Performance Scoring** - 0-100 rating for each campaign
- 🎨 **Visual Analytics** - Interactive charts and graphs
- 🔄 **Trend Analysis** - Week-over-week performance tracking

### User Experience
- 🎯 **Expandable Rows** - See predictions without leaving the table
- 🔔 **Smart Notifications** - Performance alerts and anomalies
- 💻 **System Status** - Real-time diagnostics panel
- 🛠️ **Health Check Scripts** - Automated troubleshooting

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   ```
   http://localhost:3000
   ```

4. **Add your Meta API credentials**
   - Click the Settings icon (⚙️)
   - Enter your Meta API Access Token
   - Enter your Ad Account ID (format: act_123456789)
   - Click "Save & Connect"

## 🔧 Troubleshooting

**Quick diagnosis:**
```bash
./diagnose.sh
```

**Full system check:**
```bash
./scripts/health-check.sh
```

**Common issues:**
- "No campaigns found" → Add Meta API credentials in Settings
- Server crashes → Run `rm -rf .next && npm run dev`
- Port conflicts → Kill existing processes: `pkill -f "next dev"`

## 📋 Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- Meta Developer Account with Ads Management API access
- Meta Ads API Access Token and Ad Account ID
- (Optional) Claude API key for enhanced AI features

## 🏗️ Project Structure

```
metaads/
├── app/                    # Next.js app directory
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── ai-insights.tsx    # AI recommendations
│   ├── predictive-analytics.tsx
│   ├── campaign-comparison.tsx
│   ├── campaign-detail.tsx
│   ├── competitor-benchmark.tsx
│   └── ...
├── lib/                   # Utilities and API clients
│   ├── meta-api-client.ts # Meta API integration
│   ├── meta-api-enhanced.ts
│   └── ai-predictions.ts  # Claude AI integration
├── scripts/              # Diagnostic tools
│   └── health-check.sh
├── diagnose.sh           # Quick diagnosis script
├── TROUBLESHOOTING.md    # Detailed troubleshooting
├── FEATURES_GUIDE.md     # Complete features guide
└── PROJECT_HISTORY.md    # Development history
```

## 🔑 API Configuration

### Meta API (Required)
1. Get Access Token from [Meta Business Manager](https://business.facebook.com)
2. Get Ad Account ID (format: act_123456789)
3. Add in Settings panel

### Claude AI (Optional)
1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Add in AI Settings panel
3. Enable "Use AI-Powered Predictions"

## 📚 Documentation

- **[FEATURES_GUIDE.md](./FEATURES_GUIDE.md)** - Detailed guide to all features
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solutions to common issues
- **[PROJECT_HISTORY.md](./PROJECT_HISTORY.md)** - Complete development history

## 🛡️ Security Notes

- API keys stored in browser localStorage
- No backend required - all client-side
- Consider environment variables for production
- HTTPS recommended for deployment

## 🚀 Deployment

### Deploy to Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Deploy (no environment variables needed)

### Deploy to other platforms
- Build: `npm run build`
- Start: `npm start`
- Static export: `npm run export`

## 💻 Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Charts**: Recharts
- **APIs**: Meta Graph API, Claude AI (optional)
- **State**: React hooks and localStorage

## 🎯 Key Features Explained

### AI Insights
Automatically analyzes campaigns and provides:
- Optimization opportunities
- Budget reallocation suggestions
- Performance improvement tips
- ROI estimates for each recommendation

### Predictive Analytics
- Individual campaign predictions
- Portfolio-level forecasts
- Multiple growth scenarios
- Confidence intervals

### Campaign Comparison
- Visual side-by-side analysis
- Winner identification
- Multi-metric radar charts
- Export comparison data

### System Status
Real-time diagnostics showing:
- Connection status
- API health
- Error messages
- Quick fixes

## 📈 Performance

- Lazy loaded components
- Efficient data fetching
- Client-side caching
- Optimized re-renders
- Responsive design

## 🤝 Contributing

This is a private project. For issues or suggestions, please use the built-in feedback system.

## 📄 License

All rights reserved - Private project

---

Built with ❤️ to be the best Meta Ads platform available
