# Deployment Guide

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/metaads.git
cd metaads

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Build the application
npm run build

# 5. Start the application
npm start
```

## Environment Variables

```env
# Required
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional
NODE_ENV=production
PORT=3000
```

## Deployment Options

### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Vercel
1. Import GitHub repository
2. Configure environment
3. Deploy

### Docker
```bash
docker build -t metaads .
docker run -p 3000:3000 metaads
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues.