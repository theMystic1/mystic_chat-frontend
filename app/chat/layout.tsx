import ChatLayoutClient from "@/components/chat/chat-layout";
import { createServerApi } from "@/lib/api/axios-server";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import axios from "axios";

const ChatLayout = async ({ children }: { children: ReactNode }) => {
  const server = await createServerApi();

  try {
    const { data } = await server.get("/chat");

    // console.log(data);

    return (
      <ChatLayoutClient chat={data?.data?.chats ?? []}>
        {children}
      </ChatLayoutClient>
    );
  } catch (e) {
    // ✅ expected auth errors: redirect (or render "sign in" state)
    if (axios.isAxiosError(e)) {
      const status = e.response?.status;

      if (status === 401 || status === 403) {
        redirect("/signin");
      }

      console.error("[ChatLayout] /chat failed:", status, e.response?.data);
      return <ChatLayoutClient chat={[]}>{children}</ChatLayoutClient>;
    }

    console.error("[ChatLayout] unexpected error:", e);
    return <ChatLayoutClient chat={[]}>{children}</ChatLayoutClient>;
  }
};

export default ChatLayout;
