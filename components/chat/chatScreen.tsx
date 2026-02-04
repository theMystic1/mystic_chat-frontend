"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../ui/logo";
import useKeyboardOffset from "@/hooks/useKeyboardOffset";

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  avatarText: string;
  online?: boolean;
};

type Message = {
  id: string;
  chatId: string;
  fromMe: boolean;
  text: string;
  time: string;
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

const messagesSeed: Message[] = [
  {
    id: "m1",
    chatId: "c1",
    fromMe: false,
    text: "Hey — can you share the updated PRD?",
    time: "12:20",
  },
  {
    id: "m2",
    chatId: "c1",
    fromMe: true,
    text: "Yep. Updating acceptance criteria now.",
    time: "12:22",
  },
  {
    id: "m3",
    chatId: "c1",
    fromMe: false,
    text: "Nice. Also add the chat expiration note.",
    time: "12:25",
  },
  {
    id: "m4",
    chatId: "c1",
    fromMe: true,
    text: "Done. I’ll send the link in 2 mins.",
    time: "12:26",
  },
];

const bubbleBase =
  "max-w-[78%] rounded-2xl px-4 py-2 text-sm leading-relaxed border border-white/5 shadow-sm";

const ChatScreen = () => {
  const [activeChatId, setActiveChatId] = React.useState<string>("c1");
  const [query, setQuery] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [msgs, setMsgs] = React.useState<Message[]>(messagesSeed);
  const [mobileView, setMobileView] = React.useState<"list" | "chat">("list");

  const kbOffset = useKeyboardOffset();

  const activeChat = React.useMemo(
    () => chatsSeed.find((c) => c.id === activeChatId) ?? chatsSeed[0],
    [activeChatId],
  );

  const filteredChats = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chatsSeed;
    return chatsSeed.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    );
  }, [query]);

  const chatMessages = React.useMemo(
    () => msgs.filter((m) => m.chatId === activeChatId),
    [msgs, activeChatId],
  );

  const onSelectChat = (id: string) => {
    setActiveChatId(id);
    setMobileView("chat");
  };

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      chatId: activeChatId,
      fromMe: true,
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMsgs((prev) => [...prev, newMsg]);
    setDraft("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSend();
  };

  return (
    <div className="bg-bg text-ink-100 w-full  overflow-hidden z-50">
      {/* viewport padding top/bottom */}
      <div className="mx-auto w-full max-w-350 px-2 sm:px-4 py-3 sm:py-5">
        {/* fixed height shell so page doesn't scroll */}
        <div className="h-[calc(100dvh-1.5rem)] sm:h-[calc(100dvh-2.5rem)] w-full surface overflow-hidden">
          {/* grid must fill shell */}
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[360px_1fr]">
            {/* LEFT */}
            <aside
              className={[
                "h-full min-h-0 border-r border-white/5 bg-surface",
                "lg:block",
                mobileView === "list" ? "block" : "hidden",
                "flex flex-col", // so header/search stay fixed and list scrolls
              ].join(" ")}
            >
              {/* top bar (fixed) */}
              <div className="flex items-center justify-between gap-3 p-4 border-b border-white/5 shrink-0">
                <div>
                  <Logo />
                  <div className="flex items-center gap-3">
                    {/* <div className="h-10 w-10 rounded-2xl bg-elevated border border-white/5 flex items-center justify-center">
                    <span className="logo-mark text-sm">L</span>
                  </div> */}

                    <div className="ml-10">
                      <p className="text-xs text-muted">Secure messaging</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost px-3 py-2 text-xs">
                    New
                  </button>
                </div>
              </div>

              {/* search (fixed) */}
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

              {/* chats list (ONLY this scrolls) */}
              <div className="min-h-0 flex-1 no-scrollbar overflow-y-auto overscroll-contain">
                {filteredChats.map((c) => {
                  const active = c.id === activeChatId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectChat(c.id)}
                      className={[
                        "w-full text-left px-4 py-3 flex items-center gap-3 border-b border-white/5 transition",
                        active ? "bg-elevated" : "hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="relative">
                        <div className="h-11 w-11 rounded-2xl bg-elevated border border-white/5 flex items-center justify-center">
                          <span className="font-semibold">{c.avatarText}</span>
                        </div>
                        {c.online ? (
                          <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-success-500 border border-bg" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-muted">{c.time}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <p className="truncate text-xs text-dim">
                            {c.lastMessage}
                          </p>
                          {c.unread ? (
                            <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-gold-gradient text-black text-[11px] font-semibold grid place-items-center">
                              {c.unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* RIGHT */}
            <main
              className={[
                "h-full min-h-0 bg-bg",
                "lg:block",
                mobileView === "chat" ? "block" : "hidden",
                "flex flex-col", // header fixed, messages scroll, composer fixed
              ].join(" ")}
            >
              {/* header (fixed) */}
              <div className="flex items-center justify-between gap-3 p-4 border-b border-white/5 bg-surface shrink-0">
                <div className="flex items-center gap-3 min-w-0 w-full">
                  <div>
                    <button
                      type="button"
                      onClick={() => setMobileView("list")}
                      className="lg:hidden btn btn-ghost px-3 py-2 text-xs"
                    >
                      Back
                    </button>
                  </div>

                  <div className="min-h-10 min-w-10 rounded-2xl bg-elevated border border-white/5 flex items-center justify-center">
                    <span className="font-semibold">
                      {activeChat.avatarText}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {activeChat.name}
                    </p>
                    <p className="text-xs text-muted">
                      {activeChat.online ? "Online" : "Last seen recently"}
                    </p>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 w-[40%]">
                  <button className="btn btn-ghost px-3 py-2 text-xs">
                    Search
                  </button>
                  <button className="btn btn-ghost px-3 py-2 text-xs">
                    More
                  </button>
                </div>
              </div>

              {/* messages (ONLY this scrolls on right) */}
              <div className="relative h-full flex-1 overflow-hidden mb-4">
                <div className="absolute inset-0 nebula-overlay opacity-35 pointer-events-none" />
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/10 to-black/20 pointer-events-none" />

                <div className="relative h-[calc(100%-200px)] no-scrollbar overflow-y-auto overscroll-contain p-4 sm:p-6">
                  <div className="mx-auto h-full max-w-3xl flex flex-col gap-3">
                    <div className="mx-auto text-[11px] text-muted bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                      Today
                    </div>

                    <AnimatePresence initial={false}>
                      {chatMessages.map((m) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={
                            m.fromMe ? "flex justify-end" : "flex justify-start"
                          }
                        >
                          <div
                            className={[
                              bubbleBase,
                              m.fromMe
                                ? "bg-gold-gradient text-black"
                                : "bg-surface text-ink-100",
                            ].join(" ")}
                          >
                            <p>{m.text}</p>
                            <div className="mt-1 flex justify-end">
                              <span
                                className={
                                  m.fromMe
                                    ? "text-[10px] text-black/70"
                                    : "text-[10px] text-muted"
                                }
                              >
                                {m.time}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              {/* composer (fixed) */}
              {/* <div className="p-3 sm:p-4 border-t border-white/5 bg-surface shrink-0  bottom-0 right-0 left-0 lg:left-90"> */}
              <div
                className="sticky bottom-0 z-20 p-3 sm:p-4 border-t border-white/5 bg-surface shrink-0"
                style={{ transform: `translateY(-${kbOffset}px)` }}
              >
                <div className="mx-auto max-w-3xl flex items-end gap-2">
                  {/* <button
                    type="button"
                    className="btn btn-ghost px-3 py-2 text-xs"
                  >
                    +
                  </button> */}

                  <div className="flex-1">
                    <div className="input-wrap">
                      <input
                        className="input"
                        placeholder="Type a message"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={onKeyDown}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      Press <span className="text-ink-100">Enter</span> to send
                    </p>
                  </div>

                  <div className="w-12 absolute top-4 right-11 ">
                    <button
                      type="button"
                      onClick={onSend}
                      className="btn btn-primary px-5 py-2.5"
                    >
                      {">"}
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>

          <MobileBoot
            activeChatId={activeChatId}
            setMobileView={setMobileView}
          />
        </div>
      </div>
    </div>
  );
};

const MobileBoot = ({
  activeChatId,
  setMobileView,
}: {
  activeChatId: string;
  setMobileView: React.Dispatch<React.SetStateAction<"list" | "chat">>;
}) => {
  React.useEffect(() => {
    void activeChatId;
    void setMobileView;
  }, [activeChatId, setMobileView]);

  return null;
};

export default ChatScreen;
