"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/logo";
import NewChatModal from "./new-chat";
import { Chat } from "@/utils/types";
import { useUser } from "@/contexts/user-cintext";
import AppLoader from "@/app/loading";
import { formatChatTime, getInitials } from "@/utils/helpers";

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  avatarText: string;
  online?: boolean;
};

const chatsSeed: ChatItem[] = [
  {
    id: "c1",
    name: "Jason",
    lastMessage: "Send me the updated PRD pls",
    time: "12:31",
    unread: 2,
    avatarText: "J",
    online: true,
  },
  {
    id: "c2",
    name: "Joey",
    lastMessage: "Approved. Let’s ship.",
    time: "11:08",
    avatarText: "J",
  },
  {
    id: "c3",
    name: "Support",
    lastMessage: "Ticket #1829 resolved",
    time: "Yesterday",
    avatarText: "S",
    unread: 1,
  },
  {
    id: "c4",
    name: "Design Team",
    lastMessage: "Figma link: v2 ready",
    time: "Mon",
    avatarText: "D",
  },
];

const ChatSidebar = ({ chat }: { chat: Chat[] }) => {
  const pathname = usePathname();
  const activeChatId = React.useMemo(() => {
    const m = pathname?.match(/\/chat\/([^/]+)/);
    return m?.[1] ?? "";
  }, [pathname]);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const { user, loading } = useUser();

  if (loading) return <AppLoader />;

  return (
    <div className="h-full min-h-0 w-full flex flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-white/5 shrink-0">
        <div>
          <Logo />
          <div className="flex items-center gap-3">
            <div className="ml-10">
              <p className="text-xs text-muted">Secure messaging</p>
            </div>
          </div>
        </div>

        <div className="">
          <button
            className="btn btn-ghost px-3 py-2 text-xs"
            onClick={() => setOpen(true)}
          >
            New
          </button>
        </div>
      </div>

      {/* search */}
      <div className="p-4 border-b border-white/5 shrink-0">
        <div className="input-wrap">
          <input
            className="input"
            placeholder="Search chats"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* list */}
      <div className="min-h-0 flex-1 no-scrollbar overflow-y-auto overscroll-contain">
        {chat?.map((c) => {
          const active = c._id === activeChatId;

          const otherUser = c.members.find((m) => m._id !== user?._id);
          const userName =
            otherUser?.displayName || otherUser?.userName || "New User";
          return (
            <Link
              key={c._id}
              href={`/chat/${c._id}`}
              className={[
                "w-full px-4 py-3 flex items-center gap-3 border-b border-white/5 transition",
                active ? "bg-elevated" : "hover:bg-white/5",
              ].join(" ")}
            >
              <div className="relative">
                <div className="h-11 w-11 rounded-2xl bg-elevated border border-white/5 flex items-center justify-center">
                  <span className="font-semibold">{getInitials(userName)}</span>
                </div>
                {!c.isMuted ? (
                  <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-success-500 border border-bg" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold">{userName}</p>
                  <p className="text-[11px] text-muted">
                    {c.lastMessageId?.updatedAt
                      ? formatChatTime({ value: c.lastMessageId?.updatedAt })
                      : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <p className="truncate text-xs text-dim">
                    {c.lastMessageId?.text ?? ""}
                  </p>
                  {c.unreadCount > 0 ? (
                    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-gold-gradient text-black text-[11px] font-semibold grid place-items-center">
                      {c.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <NewChatModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          // refetch chats here
        }}
      />
    </div>
  );
};

export default ChatSidebar;
