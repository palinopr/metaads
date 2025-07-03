# 🚀 MetaAds Quick Start - Fix Black Screen

The app is showing a black screen because it needs a PostgreSQL database. Here's the fastest way to get it running:

## Fastest Option: Free Cloud PostgreSQL (2 minutes)

### Step 1: Get Free PostgreSQL
Go to one of these services and create a free database:
- **Neon** (Recommended): https://neon.tech - Instant setup, generous free tier
- **Supabase**: https://supabase.com - Also provides auth and storage
- **Aiven**: https://aiven.io - 1 month free trial

### Step 2: Update .env
Once you have your database URL, update the `.env` file:

```bash
# Replace this line in .env:
DATABASE_URL="your-postgresql-url-here"
DIRECT_URL="your-postgresql-url-here"
```

### Step 3: Set up database
```bash
# Install dependencies (if not done)
npm install

# Push database schema
npm run db:push

# Create a test user (optional)
npm run seed
```

### Step 4: Restart the server
```bash
npm run dev
```

## Example with Neon (Recommended)

1. Go to https://neon.tech and sign up (uses GitHub auth)
2. Create a new project (takes 10 seconds)
3. Copy the connection string from the dashboard
4. Your `.env` should look like:

```env
DATABASE_URL="postgresql://username:password@host.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:password@host.neon.tech/neondb?sslmode=require"
```

5. Run:
```bash
npm run db:push
npm run dev
```

The app should now load at http://localhost:3000 with the sign-in page!

## Still Having Issues?

Check the logs:
```bash
tail -f dev.log
```

Common fixes:
- Make sure the database URL is correctly formatted
- Check that the database service is active
- Ensure you ran `npm run db:push` after setting up the database

Need more help? Check `LOCAL_SETUP.md` for detailed instructions.