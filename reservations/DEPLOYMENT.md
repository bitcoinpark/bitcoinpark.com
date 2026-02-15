# Deployment Guide - ParkBook Reservations

This app automatically deploys to Vercel via GitHub Actions whenever changes are pushed to the `main` branch.

## One-Time Setup

### 1. Create Vercel Project (Web Interface)

1. Go to https://vercel.com/new
2. Import the `bitcoinpark/bitcoinpark.com` repository
3. Configure:
   - **Root Directory**: `reservations`
   - **Framework**: Next.js
   - Click **Deploy** (it will fail without env vars, that's OK)
4. After creation, go to **Settings** → **General**:
   - Copy your **Project ID**
   - Copy your **Team/Org ID**

### 2. Get Vercel Token

1. Go to https://vercel.com/account/tokens
2. Create a new token named "GitHub Actions"
3. Copy the token (starts with `vercel_...`)

### 3. Set Up Free Services

**Database (Neon):**
- Go to https://neon.tech
- Create project "parkbook"
- Copy connection string

**Email (Resend):**
- Go to https://resend.com
- Get API key

### 4. Add GitHub Secrets

Go to your GitHub repo: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

```
VERCEL_TOKEN          = [Token from step 2]
VERCEL_ORG_ID         = [Org ID from step 1]
VERCEL_PROJECT_ID     = [Project ID from step 1]
DATABASE_URL          = [PostgreSQL connection string from Neon]
NEXTAUTH_SECRET       = jSKhfBRddK8Jmd1TvzkU3kDlORlO4G5yfolyJj0Kczc=
NEXTAUTH_URL          = [Your Vercel URL, e.g., https://parkbook.vercel.app]
RESEND_API_KEY        = [API key from Resend]
EMAIL_FROM            = ParkBook <noreply@bitcoinpark.com>
```

### 5. Initialize Database

After first successful deployment, run migrations:

```bash
# Install Vercel CLI
npm install -g vercel

# Pull environment variables
cd reservations
vercel env pull

# Run migrations
npx prisma migrate deploy
npx prisma db seed
```

## How It Works

1. Push changes to `main` branch
2. GitHub Actions detects changes in `reservations/` folder
3. Builds the Next.js app
4. Automatically deploys to Vercel
5. Your app is live!

## Manual Deployment

You can also trigger a deployment manually:

1. Go to **Actions** tab in GitHub
2. Select "Deploy Reservations App"
3. Click "Run workflow"

## Environment Variables in Vercel

After first deployment, also add the environment variables directly in Vercel:

1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Add all the same secrets (except VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)

This ensures they're available during build and runtime.
