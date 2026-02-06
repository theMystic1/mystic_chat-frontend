"use client";

import * as React from "react";
import ChatSidebar from "./chat-sidebar";
import { Chat } from "@/utils/types";

const ChatLayoutClient = ({
  children,
  chat,
}: {
  children: React.ReactNode;
  chat: Chat[];
}) => {
  return (
    <div className="bg-bg text-ink-100 w-full min-h-dvh overflow-hidden">
      <div className="mx-auto w-full max-w-350 px-2 sm:px-4 py-3 sm:py-5">
        <div className="h-[calc(100dvh-1.5rem)] sm:h-[calc(100dvh-2.5rem)] w-full surface overflow-hidden">
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[360px_1fr]">
            {/* Sidebar always visible on desktop */}
            <aside className="hidden lg:flex h-full min-h-0 border-r border-white/5 bg-surface">
              <ChatSidebar chat={chat} />
            </aside>

            {/* Content */}
            <main className="h-full min-h-0">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLayoutClient;
