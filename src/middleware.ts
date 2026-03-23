import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Only add CORS headers for API routes with Bearer auth (extension requests)
  if (
    req.nextUrl.pathname.startsWith("/api/") &&
    req.headers.get("authorization")?.startsWith("Bearer ")
  ) {
    const origin = req.headers.get("origin") || "";
    const isExtension = origin.startsWith("chrome-extension://");

    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": isExtension ? origin : "",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = NextResponse.next();
    if (isExtension) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
