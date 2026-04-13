import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@zayka/auth/middleware"
import { isAllowedRimsRole } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, response } = createMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role =
    typeof user?.user_metadata?.role === "string" ? user.user_metadata.role : null

  if (user && role === null) {
    const byUserId = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()

    if (typeof byUserId.data?.role === "string") {
      role = byUserId.data.role
    } else {
      const byId = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      if (typeof byId.data?.role === "string") {
        role = byId.data.role
      }
    }
  }

  const isLoginRoute = pathname === "/login"
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")

  if (isPublicAsset) {
    return response
  }

  if (!user) {
    if (isLoginRoute) {
      return response
    }

    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!isAllowedRimsRole(role)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url))
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
