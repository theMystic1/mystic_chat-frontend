// utils/api/proxi.ts
import { NextResponse } from "next/server";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { createServerApi } from "@/lib/api/axios-server";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const proxy = async (
  method: Method,
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
) => {
  const api = await createServerApi();

  // DEBUG: prove where it’s calling

  try {
    const res =
      method === "GET" || method === "DELETE"
        ? await api.request({ method, url: path, ...config })
        : await api.request({ method, url: path, data: body, ...config });

    console.log("[proxy] backend status:", res.status);
    return NextResponse.json(res.data, { status: res.status });
  } catch (e) {
    if (axios.isAxiosError(e)) {
      console.log(
        "[proxy] backend error:",
        e.response?.status,
        e.response?.data,
      );
      return NextResponse.json(
        e.response?.data ?? { message: "Request failed" },
        { status: e.response?.status ?? 500 },
      );
    }
    console.log("[proxy] unexpected error:", e);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
};
