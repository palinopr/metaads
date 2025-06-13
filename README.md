# Meta Ads Dashboard

A modern, responsive dashboard for managing and analyzing Meta (Facebook) ad campaigns.

## Features

- 📊 Real-time campaign metrics and performance tracking
- 💰 Revenue, ROAS, and conversion analytics
- 📅 Flexible date range selection
- 🔐 Secure credential management
- 🔄 Auto-refresh capabilities
- 📱 Mobile-responsive design
- 🤖 AI-powered campaign insights with Claude
- 📈 Predictive analytics and recommendations
- 🎯 Anomaly detection and optimization suggestions

## Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-repo/metaads.git
   cd metaads
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your Anthropic API key
   ```

3. **Run Development**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Setup

### 1. Basic Setup
1. Visit the application at `http://localhost:3000`
2. Enter your Meta Access Token and Ad Account ID
3. Click "Save & Connect"
4. View your campaign data in the dashboard

### 2. AI Features Setup (Optional but Recommended)
1. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
2. Add it to your `.env.local` file:
   ```env
   NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```
3. Or configure it in the UI at `http://localhost:3000/settings/ai`
4. Enable AI-powered insights and predictions

## Getting Credentials

### Meta Ads API
1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to System Users → Generate Token
3. Required permissions: `ads_read`, `ads_management`
4. Copy your Ad Account ID from Ads Manager

### Anthropic API (for AI Features)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate an API key
4. Add to `.env.local` or configure in Settings → AI

## Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Meta Graph API
- Anthropic Claude API
- Railway/Vercel compatible

## License

MIT 
