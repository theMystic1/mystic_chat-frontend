import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

type SetTokensArgs = {
  accessToken: string;
  refreshToken?: string;
  accessMaxAgeSec?: number; // default 15m
  refreshMaxAgeSec?: number; // default 30d
};

export const setAuthCookiesOnResponse = (
  res: NextResponse,
  {
    accessToken,
    refreshToken,
    accessMaxAgeSec = 60 * 15,
    refreshMaxAgeSec = 60 * 60 * 24 * 30,
  }: SetTokensArgs,
) => {
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAgeSec,
  });

  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: refreshMaxAgeSec,
    });
  }

  return res;
};

export const clearAuthCookies = async () => {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
};

export const getAccessToken = async () => {
  const cookieStore = await cookies();

  return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
};

export const getRefreshToken = async () => {
  const cookieStore = await cookies();

  return cookieStore.get(REFRESH_COOKIE)?.value ?? null;
};
