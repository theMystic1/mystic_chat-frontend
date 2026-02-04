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
  // console.log(api);

  try {
    const res =
      method === "GET" || method === "DELETE"
        ? api.request({ method, url: path, ...config })
        : api.request({ method, url: path, data: body, ...config });

    return NextResponse.json(res);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      return NextResponse.json(
        e.response?.data ?? { message: "Request failed" },
        { status: e.response?.status ?? 500 },
      );
    }
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
};
