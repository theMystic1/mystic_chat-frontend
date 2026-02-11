"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/logo";
import NewChatModal from "./new-chat";
import { useUser } from "@/contexts/user-cintext";
import AppLoader from "@/app/loading";
import { formatChatTime, getInitials } from "@/utils/helpers";
import { useChatSync } from "@/contexts/chat-sync-context"; // <-- adjust path
import { useWs } from "@/contexts/ws-context";
import { Close, Edit, Settings } from "@mui/icons-material";
import Modal from "../ui/modal";
import WhatsAppSettingsModal from "./settings-modal";
import { ProfileModalShell } from "./profile-shell";
import { UserType } from "@/utils/types";

type LastMessage =
  | string
  | null
  | {
      _id?: string;
      id?: string;
      text?: string;
      updatedAt?: string;
      createdAt?: string;
    };

const ChatSidebar = () => {
  const pathname = usePathname();
  const activeChatId = React.useMemo(() => {
    const m = pathname?.match(/\/chat\/([^/]+)/);
    return m?.[1] ?? "";
  }, [pathname]);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [openModal, setOpenModal] = React.useState(false);

  const { user: currentUser, loading } = useUser();
  const { chats, setActiveChatId, setChats } = useChatSync();
  const { isOnline } = useWs();
  const useder = currentUser;

  React.useEffect(() => {
    setActiveChatId(activeChatId || null);
  }, [activeChatId, setActiveChatId]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;

    return chats.filter((c) => {
      const otherUser = c.members?.find(
        (m: any) => String(m._id) !== String(useder?._id),
      );
      const name = otherUser?.displayName || otherUser?.userName || "New User";

      const lm = c.lastMessageId as unknown as LastMessage;
      const lastText = typeof lm === "object" && lm ? (lm.text ?? "") : "";

      return (
        name.toLowerCase().includes(q) || lastText.toLowerCase().includes(q)
      );
    });
  }, [query, chats, useder?._id]);

  if (loading) return <AppLoader />;

  // console.log(filtered);

  return (
    <div className="h-full min-h-0 w-full flex flex-col relative">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-white/5 shrink-0">
        <div>
          <Logo />
          <div className="flex items-center gap-3">
            <div className="ml-10">
              <p className="text-xs text-muted">Secure messaging</p>
            </div>
          </div>
        </div>

        <div>
          <button
            className="btn btn-ghost px-3 py-2 text-xs"
            onClick={() => setOpen(true)}
          >
            New
          </button>
        </div>
      </div>

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

      <div className="min-h-0 flex-1 no-scrollbar overflow-y-auto overscroll-contain">
        {filtered?.map((c: any) => {
          const active = String(c._id) === String(activeChatId);

          const otherUser = c.members?.find(
            (m: any) => String(m._id) !== String(useder?._id),
          );
          const userName =
            otherUser?.displayName || otherUser?.userName || "New User";

          const lm = c.lastMessageId as unknown as LastMessage;

          const lastTimeRaw =
            (typeof lm === "object" && lm && (lm.updatedAt || lm.createdAt)) ||
            c.lastMessageAt ||
            null;

          const unread = Number(c.unreadCount ?? 0);

          return (
            <Link
              key={c._id}
              href={`/chat/${c._id}`}
              className={[
                "w-full px-4 py-3 flex items-center gap-3 border-b border-white/5 transition",
                active ? "bg-elevated" : "hover:bg-white/5",
              ].join(" ")}
              onClick={() => {
                // makes unread clear immediately even before effects run
                setActiveChatId(String(c._id));
              }}
            >
              <div className="relative">
                <Avatar userName={userName} />

                {isOnline(otherUser?._id) ? (
                  <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-success-500 border border-bg" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold">{userName}</p>

                  <p className="text-[11px] text-muted">
                    {lastTimeRaw
                      ? formatChatTime({ value: String(lastTimeRaw) })
                      : ""}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 mt-1">
                  <p className="truncate text-xs text-dim">
                    {c.lastMessageText}
                  </p>

                  {unread > 0 ? (
                    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-gold-gradient text-black text-[11px] font-semibold grid place-items-center">
                      {unread}
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
        onCreated={(data) => {
          // setChats((prev) => ({
          //   ...prev,
          //   data,
          // }));
          console.log(data);
        }}
      />
      <SettingsModal openModal={openModal} setOpenModal={setOpenModal} />

      <button
        className="fixed bottom-5 left-4 cursor-pointer hover:text-aurora-400 transition-all duration-200"
        onClick={() => setOpenModal(true)}
      >
        <Settings />
      </button>
    </div>
  );
};

export default ChatSidebar;

const Avatar = ({ userName }: { userName: string }) => {
  //
  const colorMix = [
    { bg: "bg-gray-100", text: "text-gray-800" },
    { bg: "bg-gray-200", text: "text-gray-800" },
    { bg: "bg-gray-300", text: "text-gray-800" },
    { bg: "bg-gray-400", text: "text-gray-800" },
    { bg: "bg-gray-500", text: "text-white" },
    { bg: "bg-gray-600", text: "text-white" },
    { bg: "bg-gray-700", text: "text-white" },
  ];
  return (
    <div
      className={`${colorMix[getInitials(userName).charCodeAt(1) % colorMix.length].bg} ${colorMix[getInitials(userName).charCodeAt(1) % colorMix.length].text} h-11 w-11 rounded-2xl flex items-center justify-center`}
    >
      <span className="font-semibold">{getInitials(userName)}</span>
    </div>
  );
};

const SettingsModal = ({
  openModal,
  setOpenModal,
 
}: {
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;

}) => {
  const { user: curUser } = useUser();

  return (
    <WhatsAppSettingsModal
      open={openModal}
      onClose={() => setOpenModal(false)}
      user={ curUser}
      onSave={async () => {}}
    />
  );
};
