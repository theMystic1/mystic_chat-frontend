import { setAuthCookiesOnResponse } from "@/utils/tokens";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const body = await req.json();

  const backendRes = await fetch(`${process.env.API_BASE_URL}/users/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!backendRes.ok) {
    const err = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { message: err?.message ?? "Signin failed", ...err },
      { status: backendRes.status },
    );
  }

  const data = (await backendRes.json()) as {
    token: string;
    refreshToken?: string;
    user?: unknown;
  };

  // ✅ create response first, then attach cookies to it
  const res = NextResponse.json({ ok: true, user: data ?? null });

  return setAuthCookiesOnResponse(res, {
    accessToken: data.token,
    refreshToken: data.refreshToken,
  });
};

// import { proxy } from "@/utils/api/proxi";

// export const POST = async (req: Request) =>
//   proxy("POST", "/users/verify", await req.json());
