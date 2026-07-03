import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/scholarships(.*)",
  "/deadlines(.*)",
  "/guide(.*)",
  "/legal(.*)",
  "/api/deadlines(.*)",
  "/api/scholarships(.*)",
  "/api/meta(.*)",
  "/api/webhooks(.*)",
  "/auth(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|json|js|html|xml|ico|woff2?|webmanifest)$).*)",
  ],
};
