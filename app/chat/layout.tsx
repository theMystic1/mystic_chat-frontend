// app/chat/layout.tsx
import ChatLayoutClient from "@/components/chat/chat-layout";
import { createServerApi } from "@/lib/api/axios-server";
import { ReactNode } from "react";
import axios from "axios";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/utils/tokens";

const ChatLayout = async ({ children }: { children: ReactNode }) => {
  const server = await createServerApi();

  // ✅ Example cookie name — change to your real one
  const cookie = await cookies();

  const token = cookie.get(ACCESS_COOKIE)?.value ?? "";

  try {
    const { data } = await server.get("/chat");

    return (
      <ChatLayoutClient token={token!} chat={data?.data?.chats ?? []}>
        {children}
      </ChatLayoutClient>
    );
  } catch (e) {
    if (axios.isAxiosError(e)) {
      console.error(
        "[ChatLayout] /chat failed:",
        e.response?.status,
        e.response?.data,
      );
      return (
        <ChatLayoutClient token={token} chat={[]}>
          {children}
        </ChatLayoutClient>
      );
    }

    console.error("[ChatLayout] unexpected error:", e);
    return (
      <ChatLayoutClient token={token} chat={[]}>
        {children}
      </ChatLayoutClient>
    );
  }
};

export default ChatLayout;
