# MetaAds

A Next.js 15 application for managing Facebook advertising campaigns with AI-powered automation - "Cursor for Meta Ads".

## Context Engineering

This project uses Context Engineering methodology for AI-assisted development. Instead of relying on clever prompts, we provide comprehensive context to ensure reliable, high-quality code generation.

### Quick Start with Context Engineering

1. **Feature Request**: Create your feature request in `INITIAL.md`
2. **Generate Plan**: Use `/generate-prp` to create a Product Requirements Prompt
3. **Execute**: Use `/execute-prp` to implement the feature with validation
4. **Validate**: Run tests and fix issues iteratively

See [Context Engineering Workflow](#context-engineering-workflow) below for details.

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
- Responsive design
- AI-powered campaign management
- Real-time campaign monitoring with SSE
- Multi-agent AI system for optimization

## Context Engineering Workflow

This project follows Context Engineering principles for reliable AI-assisted development.

### 1. Understanding the System

Before making any changes:
- Read `CLAUDE.md` for project-wide rules and conventions
- Check `examples/` directory for established code patterns
- Review `requirements/` for feature specifications

### 2. Creating a Feature Request

When you need to implement a new feature:

1. Copy `INITIAL.md` template
2. Fill out all sections with specific details
3. Reference existing code patterns from `examples/`
4. Include all relevant Meta API documentation links

### 3. Generating a PRP (Product Requirements Prompt)

Use the `/generate-prp` command which will:
- Research the codebase for similar patterns
- Read relevant documentation
- Create a comprehensive implementation plan
- Include validation steps and success criteria

### 4. Executing the PRP

Use the `/execute-prp` command which will:
- Follow the implementation blueprint step-by-step
- Run validation commands after each major step
- Fix issues before proceeding
- Complete all items in the checklist

### 5. Validation Commands

Always run these commands before considering a feature complete:

```bash
# Syntax and type checking
npm run lint
npm run typecheck

# Build verification
npm run build

# Tests (if applicable)
npm test

# Database migrations (if schema changed)
npm run db:generate
npm run db:migrate
```

### 6. Key Directories

- `.claude/` - AI assistant configuration and commands
- `PRPs/` - Product Requirements Prompts
  - `templates/` - Base template for new PRPs
  - Example PRPs for reference
- `examples/` - Canonical code patterns
  - API route patterns
  - Component patterns
  - Database query patterns
- `CLAUDE.md` - Global project rules
- `INITIAL.md` - Feature request template

### 7. Best Practices

1. **Context Over Cleverness**: Provide comprehensive context rather than relying on clever prompts
2. **Pattern Matching**: Always look for existing patterns before creating new ones
3. **Validation-Driven**: Validate at each step, not just at the end
4. **Research First**: Thoroughly understand existing code before implementing
5. **Continuous Improvement**: When you find better patterns or approaches, update the context:
   - Add new patterns to `examples/`
   - Update gotchas in `CLAUDE.md`
   - Track improvements in `.claude/IMPROVEMENT_LOG.md`
   - Enhance templates based on real usage

### 8. Common Commands

```bash
# Start development
npm run dev

# Run linting
npm run lint

# Type checking
npm run typecheck

# Database operations
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio

# Build for production
npm run build
```

## Troubleshooting

For comprehensive troubleshooting, see `TROUBLESHOOTING.md`.

### Quick Fixes
- **Facebook OAuth Issues**: See `docs/facebook-oauth-setup.md`
- **Database Connection**: Check `DATABASE_URL` encoding in `.env`
- **Meta API Rate Limits**: Automatic retry with exponential backoff
- **Build Failures**: Run `npm run lint` and `npm run typecheck`
- **API Errors**: Check `API_ACCESS.md` for self-service fixes

### Self-Service Resources
- `TROUBLESHOOTING.md` - Step-by-step issue resolution
- `API_ACCESS.md` - API documentation and error fixes
- `examples/` - Reference implementations
- `npm run db:studio` - Visual database debugging

## Deployment

### Automatic Deployment via GitHub
This project is configured for automatic deployment:
1. **Push to GitHub** → Triggers Vercel deployment
2. **Main branch** → Deploys to production
3. **Other branches** → Create preview deployments

### Manual Deployment
```bash
# Deploy to production
vercel --prod

# Create preview deployment
vercel
```

### GitHub Push Workflow
**CRITICAL**: Always push changes to GitHub:
```bash
# After making changes
git add .
git commit -m "feat/fix/docs: description of changes"
git push origin main

# Verify deployment at:
# https://vercel.com/[your-username]/metaads
```

## Contributing

1. Follow the Context Engineering workflow for all new features
2. Ensure all tests pass before submitting PRs
3. Update documentation as needed
4. Follow existing code patterns from `examples/`
5. **ALWAYS push to GitHub after changes** - This triggers automatic deployment!

# Deployment trigger: Mon Jun 30 13:19:54 CDT 2025
# Force redeploy: Mon Jun 30 13:26:24 CDT 2025
# Database URLs updated: Mon Jun 30 13:55:13 CDT 2025
# Rebuild with updated NEXT_PUBLIC_ADMIN_EMAILS: Mon Jun 30 14:21:27 CDT 2025
