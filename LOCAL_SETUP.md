# MetaAds Local Setup Guide

The application is currently showing a black/blank screen because it requires a PostgreSQL database to run properly.

## Quick Fix Options

### Option 1: Use Supabase (Recommended - Free)

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project (takes about 2 minutes)
3. Once created, go to Settings > Database
4. Copy your database credentials
5. Update your `.env` file with:

```env
# Replace with your actual Supabase credentials
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres"

# Also update these from your Supabase project
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

6. Run database migrations:
```bash
npm run db:push
```

7. Restart the dev server:
```bash
npm run dev
```

### Option 2: Install PostgreSQL Locally

1. Install PostgreSQL:
   - Mac: `brew install postgresql && brew services start postgresql`
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Linux: `sudo apt-get install postgresql`

2. Create a database:
```bash
createdb metaads
```

3. Update `.env`:
```env
DATABASE_URL="postgresql://localhost:5432/metaads"
DIRECT_URL="postgresql://localhost:5432/metaads"
```

4. Run migrations:
```bash
npm run db:push
```

5. Restart the dev server:
```bash
npm run dev
```

### Option 3: Use Docker

1. Create `docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: metaads
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

2. Start PostgreSQL:
```bash
docker-compose up -d
```

3. Update `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/metaads"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/metaads"
```

4. Run migrations:
```bash
npm run db:push
```

5. Restart the dev server:
```bash
npm run dev
```

## Creating Test User

After setting up the database, create a test user:

1. Create `scripts/create-test-user.js`:
```javascript
const bcrypt = require('bcryptjs');
const { db } = require('../src/db/drizzle');
const { users } = require('../src/db/schema');

async function createTestUser() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await db.insert(users).values({
    email: 'test@example.com',
    name: 'Test User',
    password: hashedPassword,
  });
  
  console.log('Test user created!');
  console.log('Email: test@example.com');
  console.log('Password: password123');
  process.exit(0);
}

createTestUser();
```

2. Run:
```bash
node scripts/create-test-user.js
```

## Facebook OAuth Setup (Optional)

To enable Facebook login:

1. Go to [https://developers.facebook.com](https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login product
4. Set redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Update `.env` with your app credentials

## Troubleshooting

- **Black screen**: Database connection issue - check logs with `tail -f dev.log`
- **Auth errors**: Database not migrated - run `npm run db:push`
- **Port 3000 in use**: Kill existing process: `lsof -ti:3000 | xargs kill -9`

The application should now load properly with the sign-in page visible!