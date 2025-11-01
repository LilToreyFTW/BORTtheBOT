# Fix: "Could not identify Next.js version" Error

## The Problem

Vercel is not detecting Next.js because it's looking at the monorepo root instead of `apps/next/`.

## The Solution

You **MUST** configure the **Root Directory** in the Vercel Dashboard:

### Step-by-Step Fix:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your BORTtheBOT project**
3. **Go to Settings** → **General**
4. **Scroll to "Root Directory"**
5. **Click "Edit"**
6. **Set Root Directory to**: `apps/next`
7. **Click "Save"**
8. **Redeploy** your project

## Why This Works

- Next.js is located at `apps/next/` (not at the repo root)
- Vercel needs to know where to look for `package.json` with Next.js
- The `vercel.json` file cannot set root directory - it's a project-level setting

## Verification

After setting Root Directory to `apps/next`, Vercel will:
- ✅ Find `apps/next/package.json` with `"next": "14.2.7"`
- ✅ Auto-detect Next.js framework
- ✅ Use the correct build commands

## Alternative: Use Vercel CLI

If you prefer CLI:

```bash
vercel link
# When prompted, set Root Directory to: apps/next
```

Or set it via API/project settings JSON:

```json
{
  "rootDirectory": "apps/next"
}
```

## Current vercel.json

The `apps/next/vercel.json` is already configured correctly:
- Build command runs from monorepo root
- Installs dependencies properly
- Outputs to `.next` directory

**The only missing piece is setting Root Directory in the Vercel Dashboard!**

