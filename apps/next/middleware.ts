import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// # ADDED: Guard Clerk middleware when missing env on Vercel
const __HAS_CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// export default clerkMiddleware() // ORIGINAL
// # UPDATED VERSION: Fallback to NextResponse.next() if no Clerk key is present
export default function middleware(req: Request) {
  if (!__HAS_CLERK) {
    return NextResponse.next()
  }
  // Delegate to Clerk's middleware when configured
  // @ts-ignore - types differ between runtimes
  return (clerkMiddleware() as any)(req as any)
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}


