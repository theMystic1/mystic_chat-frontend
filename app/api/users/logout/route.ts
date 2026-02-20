// app/api/users/logout/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const backendRes = await fetch(`${process.env.API_BASE_URL}/users/logout`, {
    method: "POST",
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
  });

  const data = await backendRes.json().catch(() => ({}));
  const res = NextResponse.json(data, { status: backendRes.status });

  const setCookies = (backendRes.headers as any).getSetCookie?.() as
    | string[]
    | undefined;
  if (setCookies?.length) {
    for (const c of setCookies) res.headers.append("set-cookie", c);
  }

  return res;
}
