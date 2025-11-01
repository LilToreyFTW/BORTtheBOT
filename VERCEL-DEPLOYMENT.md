# Vercel Deployment Guide for BORTtheBOT Next.js App

## Important: Monorepo Configuration

This is a Turborepo monorepo. The Next.js app is located in `apps/next/`.

## Vercel Project Settings

### Step 1: Configure Root Directory in Vercel Dashboard

1. Go to your project settings in Vercel
2. Navigate to **Settings** → **General**
3. Under **Root Directory**, select **"Edit"**
4. Set Root Directory to: `apps/next`
5. Click **"Save"**

### Step 2: Configure Build Settings

The `vercel.json` in `apps/next/` already has:
- **Framework Preset**: Auto-detect (Next.js)
- **Build Command**: `cd ../.. && bun install && cd apps/next && bun run build`
- **Output Directory**: `.next`
- **Install Command**: `cd ../.. && bun install`

### Step 3: Environment Variables

Make sure to set these in Vercel Dashboard → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SERVER_URL=http://your-server-url:3000
```

### Step 4: Deploy

Once Root Directory is set to `apps/next`, Vercel should:
1. Detect Next.js automatically (version 14.2.7)
2. Use the correct package.json from `apps/next/`
3. Run builds from the monorepo root

## Troubleshooting

### Error: "Could not identify Next.js version"

**Solution**: Set Root Directory to `apps/next` in Vercel dashboard.

### Error: "No Next.js version detected"

**Solution**: 
1. Verify `apps/next/package.json` has `"next": "14.2.7"` in dependencies
2. Ensure Root Directory is set to `apps/next`
3. Re-deploy after changing settings

### Build Fails: "Cannot find module"

**Solution**: The build command runs from monorepo root, which should resolve workspace dependencies correctly.

## Alternative: Manual Configuration

If auto-detection still fails, manually set in Vercel Dashboard:

- **Framework Preset**: Next.js
- **Node.js Version**: 20.x (or latest)
- **Build Command**: `cd ../.. && bun install && cd apps/next && bun run build`
- **Output Directory**: `.next`
- **Install Command**: `cd ../.. && bun install`
- **Root Directory**: `apps/next`

## Verification

After deployment, verify:
- ✅ Build logs show Next.js 14.2.7 detected
- ✅ Build completes successfully
- ✅ App is accessible at your Vercel URL

