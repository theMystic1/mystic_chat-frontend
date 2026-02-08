"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import useKeyboardOffset from "@/hooks/useKeyboardOffset";
import {
  ChatWithMessagesResponse,
  LocalMessage,
  MessageRes,
} from "@/utils/types";
import { useUser } from "@/contexts/user-cintext";
import ChatPaneSkeleton from "@/app/chat/[chatId]/loading";
import { useWs } from "@/contexts/ws-context";
import {
  dayKey,
  formatChatTime,
  formatDayLabel,
  getInitials,
} from "@/utils/helpers";
import { apiClient } from "@/lib/api/axios-client";
import Checkmarks from "./checkMark";
import { useChatSync } from "@/contexts/chat-sync-context";
import { OtherUserModal } from "./otheuser-modal";

const bubbleBase =
  "max-w-[78%] rounded-2xl px-4 py-2 text-sm leading-relaxed border border-white/5 shadow-sm";

const ChatPane = ({
  chatId,
  chat,
}: {
  chatId: string;
  chat: ChatWithMessagesResponse;
}) => {
  const kbOffset = useKeyboardOffset();
  const [draft, setDraft] = React.useState("");
  const [messages, setMessages] = React.useState<LocalMessage[]>(() =>
    (chat.messages ?? []).map((m) => ({
      ...m,
      localStatus: "sent",
      deliveryStatus: "sent",
    })),
  );
  const [openSettingsModal, setOpenSettingsModal] = React.useState(false);

  const { typingByChatId } = useChatSync();
  const { isOnline, ws, lastEvent } = useWs();
  const { user, loading } = useUser();

  const otherUser = chat?.chat?.members.find(
    (m) => String(m._id) !== String(user?._id),
  );

  const typingUsers = typingByChatId?.[chatId] ?? [];
  const isOtherTyping = typingUsers.some(
    (id: any) => String(id) === String(otherUser?._id),
  );
  const otherId = otherUser?._id ? String(otherUser._id) : null;
  const otherUserOnline = isOnline(otherId);

  const userName = otherUser?.displayName || otherUser?.userName || "New User";

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  const shouldStickToBottomRef = React.useRef(true);

  const computeNearBottom = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return true;
    const threshold = 140;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    return dist < threshold;
  }, []);

  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = "auto") => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    },
    [],
  );

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      shouldStickToBottomRef.current = computeNearBottom();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    shouldStickToBottomRef.current = computeNearBottom();
    return () => el.removeEventListener("scroll", onScroll);
  }, [computeNearBottom]);

  React.useEffect(() => {
    shouldStickToBottomRef.current = true;

    const raf = requestAnimationFrame(() => scrollToBottom("auto"));
    return () => cancelAnimationFrame(raf);
  }, [chatId, scrollToBottom]);

  const prevLenRef = React.useRef<number>(messages.length);
  React.useEffect(() => {
    const prevLen = prevLenRef.current;
    prevLenRef.current = messages.length;

    if (messages.length <= prevLen) return;

    if (shouldStickToBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom]);

  const pendingDeliveredRef = React.useRef<Set<string>>(new Set());
  const pendingReadRef = React.useRef<Set<string>>(new Set());

  const typingRef = React.useRef(false);
  const stopTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!ws) return;
    ws.joinChat(chatId);
    return () => ws.leaveChat(chatId);
  }, [ws, chatId]);

  React.useEffect(() => {
    if (!ws || !lastEvent) return;
    if (lastEvent.type === "joined_chat" && lastEvent.data.chatId === chatId) {
      ws.ackDeliveredAll(chatId);
      ws.ackReadAll(chatId);
    }
  }, [ws, lastEvent, chatId]);

  React.useEffect(() => {
    if (!ws || !lastEvent) return;

    if (lastEvent.type === "message_sent") {
      const incoming = lastEvent.data;
      if (incoming.chatId !== chatId) return;

      const fromMe = String(incoming.senderId) === String(user?._id);

      if (!fromMe) {
        ws.ackDelivered(incoming.chatId, incoming.id);
        ws.ackRead(incoming.chatId, incoming.id);
      }

      setMessages((prev) => {
        const exists = prev.some((m) => String(m._id) === String(incoming.id));
        if (exists) return prev;

        const pendingDelivered = pendingDeliveredRef.current.has(
          String(incoming.id),
        );
        const pendingRead = pendingReadRef.current.has(String(incoming.id));

        const mapped: LocalMessage = {
          _id: incoming.id as any,
          chatId: incoming.chatId as any,
          senderId: incoming.senderId as any,
          type: incoming.type as any,
          text: incoming.text ?? "",
          createdAt: incoming.createdAt ?? new Date().toISOString(),
          attachments: incoming.attachments ?? [],
          localStatus: "sent",
          deliveryStatus: pendingRead
            ? "read"
            : pendingDelivered
              ? "delivered"
              : "sent",
        } as any;

        const idx = prev.findIndex((m) => {
          if (m.localStatus !== "sending") return false;
          if (String(m.senderId) !== String(incoming.senderId)) return false;
          if ((m.text ?? "") !== (incoming.text ?? "")) return false;

          const a = new Date(m.createdAt ?? 0).getTime();
          const b = new Date(incoming.createdAt ?? Date.now()).getTime();
          return Math.abs(a - b) < 30_000;
        });

        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = mapped;
          return copy;
        }

        return [...prev, mapped];
      });

      return;
    }

    if (lastEvent.type === "message_delivered") {
      const { chatId: cid, messageId } = lastEvent.data;
      if (cid !== chatId) return;

      let found = false;
      setMessages((prev) =>
        prev.map((m) => {
          if (String(m._id) !== String(messageId)) return m;
          const isMine = String(m.senderId) === String(user?._id);
          if (!isMine) return m;
          found = true;
          if (m.deliveryStatus === "read") return m;
          return { ...m, deliveryStatus: "delivered" };
        }),
      );
      if (!found) pendingDeliveredRef.current.add(String(messageId));
      return;
    }

    if (lastEvent.type === "message_read") {
      const { chatId: cid, messageId } = lastEvent.data;
      if (cid !== chatId) return;

      let found = false;
      setMessages((prev) =>
        prev.map((m) => {
          if (String(m._id) !== String(messageId)) return m;
          const isMine = String(m.senderId) === String(user?._id);
          if (!isMine) return m;
          found = true;
          return { ...m, deliveryStatus: "read" };
        }),
      );
      if (!found) pendingReadRef.current.add(String(messageId));
      return;
    }

    if (lastEvent.type === "messages_delivered") {
      const { chatId: cid, messageIds } = lastEvent.data;
      if (cid !== chatId) return;

      const idSet = new Set(messageIds.map(String));
      setMessages((prev) =>
        prev.map((m) => {
          const isMine = String(m.senderId) === String(user?._id);
          if (!isMine) return m;
          if (!idSet.has(String(m._id))) return m;
          if (m.deliveryStatus === "read") return m;
          return { ...m, deliveryStatus: "delivered" };
        }),
      );

      for (const id of idSet) pendingDeliveredRef.current.add(String(id));
      return;
    }

    if (lastEvent.type === "messages_read") {
      const { chatId: cid, messageIds } = lastEvent.data;
      if (cid !== chatId) return;

      const idSet = new Set(messageIds.map(String));
      setMessages((prev) =>
        prev.map((m) => {
          const isMine = String(m.senderId) === String(user?._id);
          if (!isMine) return m;
          if (!idSet.has(String(m._id))) return m;
          return { ...m, deliveryStatus: "read" };
        }),
      );

      for (const id of idSet) pendingReadRef.current.add(String(id));
      return;
    }
  }, [ws, lastEvent, chatId, user?._id]);

  const sendToServer = async (chatId: string, text: string) => {
    return apiClient.post(`/chat/messages/${chatId}/send`, {
      message: text,
      type: "text",
    });
  };

  const bumpTyping = React.useCallback(() => {
    if (!ws) return;

    if (!typingRef.current) {
      typingRef.current = true;
      ws.typingStart(chatId);
    }

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);

    stopTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      ws.typingStop(chatId);
    }, 900);
  }, [ws, chatId]);

  const onSend = async () => {
    const text = draft.trim();
    if (!text) return;

    setDraft("");

    shouldStickToBottomRef.current = true;

    if (typingRef.current) {
      typingRef.current = false;
      ws?.typingStop(chatId);
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const clientId = `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const optimistic: any = {
      _id: clientId,
      clientId,
      chatId,
      senderId: user?._id as string,
      type: "text",
      text,
      createdAt: new Date().toISOString(),
      localStatus: "sending",
      deliveryStatus: "sending",
    };

    setMessages((prev) => [...prev, optimistic]);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    try {
      await sendToServer(chatId, text);
    } catch (e) {
      console.error(e);
      setMessages((prev) =>
        prev.map((m) =>
          m.clientId === clientId
            ? { ...m, localStatus: "failed", deliveryStatus: "sent" }
            : m,
        ),
      );
    }
  };

  const retryMessage = async (clientId: string) => {
    const msg = messages.find((m) => m.clientId === clientId);
    if (!msg) return;

    shouldStickToBottomRef.current = true;

    setMessages((prev) =>
      prev.map((m) =>
        m.clientId === clientId
          ? { ...m, localStatus: "sending", deliveryStatus: "sending" }
          : m,
      ),
    );

    requestAnimationFrame(() => scrollToBottom("smooth"));

    try {
      await sendToServer(chatId, msg.text ?? "");
    } catch (e) {
      console.error(e);
      setMessages((prev) =>
        prev.map((m) =>
          m.clientId === clientId ? { ...m, localStatus: "failed" } : m,
        ),
      );
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSend();
  };

  if (loading) return <ChatPaneSkeleton />;

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-white/5 bg-surface shrink-0">
        <div className="flex items-center gap-3 min-w-0 w-full">
          <Link
            href="/chat"
            className="lg:hidden btn btn-ghost px-3 py-2 text-xs"
          >
            Back
          </Link>

          <div className="min-h-10 min-w-10 rounded-2xl bg-elevated border border-white/5 flex items-center justify-center">
            <span className="font-semibold">{getInitials(userName)}</span>
          </div>

          <button
            className="min-w-0 cursor-pointer"
            onClick={() => setOpenSettingsModal(true)}
          >
            <p className="truncate text-start text-sm font-semibold">
              {" "}
              {userName}
            </p>
            <p className="text-xs text-muted text-start">
              {isOtherTyping
                ? "typing…"
                : otherUserOnline
                  ? "Online"
                  : otherUser?.lastSeenAt
                    ? formatChatTime({ value: otherUser?.lastSeenAt })
                    : "offline"}
            </p>
          </button>
        </div>
      </div>

      {/* messages */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 nebula-overlay opacity-35 pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/10 to-black/20 pointer-events-none" />

        <div
          ref={scrollerRef}
          className="relative h-full no-scrollbar overflow-y-auto overscroll-contain p-4 sm:p-6 pb-28"
        >
          <div className="mx-auto max-w-3xl flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {(() => {
                let lastDay: string | null = null;

                return messages.map((m: MessageRes) => {
                  const createdAt = m.createdAt ?? new Date().toISOString();
                  const currentDay = dayKey(createdAt);
                  const showDay = currentDay !== lastDay;
                  lastDay = currentDay;

                  const fromMe = String(m.senderId) === String(user?._id);

                  return (
                    <React.Fragment key={m._id}>
                      {showDay && (
                        <div className="mx-auto text-[11px] text-muted bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                          {formatDayLabel(createdAt)}
                        </div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={
                          fromMe ? "flex justify-end" : "flex justify-start"
                        }
                      >
                        <div
                          className={[
                            bubbleBase,
                            fromMe
                              ? "bg-brand-gradient text-black"
                              : "bg-surface text-ink-100",
                          ].join(" ")}
                        >
                          <p>{m.text}</p>

                          <div className="mt-1 flex items-center justify-end gap-2">
                            {fromMe && m.localStatus === "failed" && (
                              <button
                                type="button"
                                onClick={() => retryMessage(m.clientId!)}
                                className="text-[10px] underline underline-offset-2 text-red-500 cursor-pointer hover:text-red-600"
                              >
                                Failed • Retry
                              </button>
                            )}

                            {fromMe && m.localStatus !== "failed" && (
                              <span className="text-[10px]">
                                <Checkmarks
                                  status={
                                    fromMe &&
                                    m?.readBy?.includes(otherUser?._id!)
                                      ? "read"
                                      : fromMe &&
                                          !m?.readBy?.includes(
                                            otherUser?._id!,
                                          ) &&
                                          m?.deliveredTo?.includes(
                                            otherUser?._id!,
                                          )
                                        ? "delivered"
                                        : (m.deliveryStatus as any)
                                  }
                                />
                              </span>
                            )}

                            <span
                              className={
                                fromMe
                                  ? "text-[10px] text-black/70"
                                  : "text-[10px] text-muted"
                              }
                            >
                              {formatChatTime({
                                value: createdAt,
                                type: "time",
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                });
              })()}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      <div
        className="sticky bottom-0 z-20 p-3 sm:p-4 border-t border-white/5 bg-surface shrink-0"
        style={{ transform: `translateY(-${kbOffset}px)` }}
      >
        <div className="mx-auto max-w-3xl flex items-end gap-2">
          <div className="flex-1">
            <div className="input-wrap">
              <input
                className="input"
                placeholder="Type a message"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  bumpTyping();
                }}
                onKeyDown={onKeyDown}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Press <span className="text-ink-100">Enter</span> to send
            </p>
          </div>

          <div className="w-12 absolute top-4 right-11">
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

      <OtherUserModal
        open={openSettingsModal}
        onClose={() => setOpenSettingsModal(false)}
        title={otherUser?.displayName || otherUser?.userName || "User User"}
        otherUser={otherUser}
      />
    </div>
  );
};

export default ChatPane;
