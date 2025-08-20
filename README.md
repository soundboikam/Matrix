# Matrix v2

A Next.js + Prisma application for managing artist streaming data with US/Global region support.

## Features

- Artist management and streaming data tracking
- CSV upload with automatic header detection
- US/Global region support for streaming data
- NextAuth authentication
- Responsive dashboard with charts and tables

## Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

### Prerequisites
- Push your repository to GitHub
- Set up a PostgreSQL database (Neon, Supabase, or Railway recommended)

### Steps

1. **On vercel.com**: New Project → Import GitHub repo

2. **Add Environment Variables** in Vercel → Settings → Environment Variables:
   ```
   DATABASE_URL = (from Neon/Supabase/Railway)
   NEXTAUTH_URL = https://your-vercel-domain.vercel.app
   NEXTAUTH_SECRET = (generate a 32+ char secret)
   GITHUB_ID = (if using GitHub OAuth)
   GITHUB_SECRET = (if using GitHub OAuth)
   NEXT_PUBLIC_APP_NAME = Matrix
   NEXT_PUBLIC_DEFAULT_DATA_TYPE = US
   ```

3. **Set "Build Command"** empty in Vercel (we supply it via vercel.json)

4. **Click Deploy**

5. **After first deploy**: run `npx vercel env pull .env.local` locally if needed

### Database Notes
- With Prisma on serverless Postgres, ensure your DB provider supports connection pooling (Neon does)
- `sslmode=require` recommended for production
- The app will automatically run migrations during deployment

### Health Check
After deployment, verify it's working by visiting: `https://your-domain.vercel.app/api/health`

### Vercel Functions Pattern
This project uses Next.js App Router. Serverless functions live under `app/api/**`.
Ensure the Vercel Project Settings → Functions do not include a legacy `api/**` pattern.
If present, remove it or change to `app/api/**`. The repo's `vercel.json` expects App Router.

## Vercel CLI Deployment

For advanced users, you can also deploy using the Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel link
vercel --prod
```
