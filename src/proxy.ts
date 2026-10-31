import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session cookie on every request and keeps
// signed-out visitors out of /app. Authorization itself is enforced by RLS.
export async function proxy(request: NextRequest) {
  // Canonicalise percent-encoded paths first (/%61pp is /app): the platform
  // may decode them for routing, so the checks below must see the same path.
  const raw = request.nextUrl.pathname;
  if (raw.includes("%")) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      return new NextResponse(null, { status: 400 });
    }
    if (decoded !== raw && !/[%\s?#\\]/.test(decoded)) {
      const url = request.nextUrl.clone();
      url.pathname = decoded;
      return NextResponse.redirect(url, 308);
    }
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!signedIn && pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
