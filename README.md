# Meta Ads Dashboard

A modern, responsive dashboard for managing and analyzing Meta (Facebook) ad campaigns.

## Features

- 📊 Real-time campaign metrics and performance tracking
- 💰 Revenue, ROAS, and conversion analytics
- 📅 Flexible date range selection
- 🔐 Secure credential management
- 🔄 Auto-refresh capabilities
- 📱 Mobile-responsive design

## Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-repo/metaads.git
   cd metaads
   npm install
   ```

2. **Configure**
   ```bash
   cp .env.example .env.local
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

1. Visit the application at `http://localhost:3000`
2. Enter your Meta Access Token and Ad Account ID
3. Click "Save & Connect"
4. View your campaign data in the dashboard

## Getting Credentials

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to System Users → Generate Token
3. Required permissions: `ads_read`, `ads_management`
4. Copy your Ad Account ID from Ads Manager

## Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Meta Graph API
- Railway/Vercel compatible

## License

MIT