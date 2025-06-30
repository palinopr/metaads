# MetaAds

A Next.js 15 application for managing Facebook advertising campaigns.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js with Facebook OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **Storage/Backend**: Supabase
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Type Safety**: TypeScript

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Set up your database:
   ```bash
   npm run db:push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for all required environment variables.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── db/              # Database schema and client
├── lib/             # Utility functions and configurations
│   ├── auth.ts      # NextAuth configuration
│   └── supabase/    # Supabase client setup
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
```

## Features

- Facebook OAuth authentication
- Protected dashboard routes
- Database integration with Drizzle ORM
- Supabase backend integration
- Dark mode support
- Responsive design# Deployment trigger: Mon Jun 30 13:19:54 CDT 2025
# Force redeploy: Mon Jun 30 13:26:24 CDT 2025
