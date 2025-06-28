# MetaAds

A Next.js application for managing Meta/Facebook advertising campaigns.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Set up database:
```bash
npm run db:push
```

4. Run development server:
```bash
npm run dev
```

## Deployment on Railway

This project is configured to deploy on Railway using Nixpacks.

1. Push to GitHub
2. Connect Railway to your GitHub repo
3. Railway will automatically detect the configuration from `railway.toml`
4. Add environment variables in Railway dashboard
5. Deploy!

## Project Structure

```
metaads/
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── lib/          # Utility functions
│   └── middleware.ts # Next.js middleware
├── prisma/           # Database schema
├── public/           # Static assets
├── package.json      # Dependencies
├── next.config.mjs   # Next.js config
└── railway.toml      # Railway config
```