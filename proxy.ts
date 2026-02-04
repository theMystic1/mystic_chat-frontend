import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "./utils/tokens";

const protectedRoutes = ["/chat", "/dashboard", "/settings"];
const publicRoutes = ["/", "/signin", "/signup"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtected = protectedRoutes.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );
  const isPublic = publicRoutes.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );

  // optimistic: cookie presence only
  const token = req.cookies.get(ACCESS_COOKIE)?.value;

  if (isProtected && !token) {
    const url = new URL("/signin", req.nextUrl);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isPublic && token && isPublic) {
    return NextResponse.redirect(new URL("/chat", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
