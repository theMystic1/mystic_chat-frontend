// components/ChatPane.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Telegram } from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import useKeyboardOffset from "@/hooks/useKeyboardOffset";
import { useChatById } from "@/hooks/useChatById";
import { useUser } from "@/contexts/user-cintext";
import { useWs } from "@/contexts/ws-context";
import { useChatSync } from "@/contexts/chat-sync-context";

import {
  dayKey,
  formatChatTime,
  formatDayLabel,
  getInitials,
} from "@/utils/helpers";
import type { LocalMessage, MessageRes, UserType } from "@/utils/types";

import { apiClient } from "@/lib/api/axios-client";
import ChatPaneSkeleton from "@/app/chat/[chatId]/loading";
import Checkmarks from "./checkMark";
import WhatsAppSettingsModal from "./settings-modal";
import NewChatModal from "./new-chat";
import { useTyping } from "@/hooks/useBumbTyping";
import ComposerMediaActions from "./media-actions";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import Image from "next/image";
import { Avatar } from "./chat-sidebar";
import toast from "react-hot-toast";
import Modal from "../ui/modal";

const bubbleBase =
  "max-w-[78%] rounded-2xl px-4 py-2 text-sm leading-relaxed border border-white/5 shadow-sm";

const clamp = (v: string, n: number) => v.slice(0, n);

const ChatPane = ({ chatId }: { chatId: string; chat?: any }) => {
  const kbOffset = useKeyboardOffset();
  const [draft, setDraft] = React.useState("");

  const [openSettingsModal, setOpenSettingsModal] = React.useState(false);
  const [openAddMembers, setOpenAddMembers] = React.useState(false);
  const [openEmoji, setOpenEmoji] = React.useState(false);
  const [imgFile, setImgFile] = React.useState<File | null>(null);
  const [imgPreview, setImgPreview] = React.useState<string | null>(null);

  // out-of-order buffers
  const pendingDeliveredRef = React.useRef<Set<string>>(new Set());
  const pendingReadRef = React.useRef<Set<string>>(new Set());

  const [voiceDraft, setVoiceDraft] = React.useState<{
    blob: Blob;
    meta: { durationMs: number; mimeType: string };
  } | null>(null);

  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const emojiWrapRef = React.useRef<HTMLDivElement | null>(null);

  const { user, loading } = useUser();
  const { typingByChatId } = useChatSync();
  const { isOnline, ws, lastEvent } = useWs();

  const { chatData, messages, members, isLoading, isLoadingMembers } =
    useChatById(chatId);

  const singleChat = chatData?.chat;
  const isGroup = singleChat?.type === "group";

  const otherUsers: UserType[] = React.useMemo(() => {
    return (members ?? []).filter(
      (m: any) => String(m._id) !== String(user?._id),
    );
  }, [members, user?._id]);

  const otherUser = otherUsers?.[0] ?? null;

  const headerTitle = isGroup
    ? singleChat?.groupName || "Group"
    : otherUser?.displayName || otherUser?.userName || "New User";

  const headerAvatarUrl = isGroup
    ? singleChat?.avatarUrl
    : otherUser?.avatarUrl;

  const typingUsers = typingByChatId?.[chatId] ?? [];
  const typingOtherIds = typingUsers
    .map(String)
    .filter((id: any) => id !== String(user?._id));

  const isOtherTypingDM =
    !isGroup && otherUser
      ? typingOtherIds.includes(String(otherUser._id))
      : false;

  const typingCountInGroup = isGroup
    ? otherUsers.filter((u) => typingOtherIds.includes(String(u._id))).length
    : 0;

  const onlineCountInGroup = isGroup
    ? otherUsers.filter((u) => isOnline(String(u._id))).length
    : 0;

  const otherUserOnlineDM =
    !isGroup && otherUser ? isOnline(String(otherUser._id)) : false;

  const headerSubtitle = React.useMemo(() => {
    if (isGroup) {
      if (typingCountInGroup > 0) {
        return typingCountInGroup === 1
          ? "typing…"
          : `${typingCountInGroup} typing…`;
      }
      const totalMembers = singleChat?.members?.length ?? members?.length ?? 0;
      const onlineText =
        onlineCountInGroup > 0 ? ` • ${onlineCountInGroup} online` : "";
      return `${totalMembers} members${onlineText}`;
    }

    if (isOtherTypingDM) return "typing…";
    if (otherUserOnlineDM) return "Online";
    if (otherUser?.lastSeenAt)
      return formatChatTime({ value: otherUser.lastSeenAt });
    return "offline";
  }, [
    isGroup,
    typingCountInGroup,
    onlineCountInGroup,
    singleChat?.members?.length,
    members?.length,
    isOtherTypingDM,
    otherUserOnlineDM,
    otherUser?.lastSeenAt,
  ]);

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
    if (shouldStickToBottomRef.current) scrollToBottom("smooth");
  }, [messages.length, scrollToBottom]);

  React.useEffect(() => {
    if (!openEmoji) return;

    const onPointerDown = (e: PointerEvent) => {
      const root = emojiWrapRef.current;
      if (!root) return;

      if (!root.contains(e.target as Node)) setOpenEmoji(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [openEmoji]);

  const qc = useQueryClient();
  const chatKey = React.useMemo(() => ["chat", chatId], [chatId]);

  const patchMessages = React.useCallback(
    (updater: (prev: LocalMessage[]) => LocalMessage[]) => {
      qc.setQueryData(chatKey, (prev: any) => {
        if (!prev) return prev;
        const msgs: LocalMessage[] = prev.messages ?? [];
        return { ...prev, messages: updater(msgs) };
      });
    },
    [qc, chatKey],
  );

  const addOptimistic = React.useCallback(
    (msg: LocalMessage) => {
      patchMessages((prev) => [...prev, msg]);
      shouldStickToBottomRef.current = true;
      requestAnimationFrame(() => scrollToBottom("smooth"));
    },
    [patchMessages, scrollToBottom],
  );

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

    const sameChat = (a: any, b: any) => String(a) === String(b);

    if (lastEvent.type === "message_sent") {
      const incoming = lastEvent.data;
      if (!sameChat(incoming.chatId, chatId)) return;

      const fromMe = String(incoming.senderId) === String(user?._id);

      if (!fromMe) {
        ws.ackDelivered(incoming.chatId, incoming.id);
        ws.ackRead(incoming.chatId, incoming.id);
      }

      patchMessages((prev) => {
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

        // replace optimistic (same sender + same text + within 30s)
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

    // ✅ SINGLE DELIVERED
    if (lastEvent.type === "message_delivered") {
      const { chatId: cid, messageId } = lastEvent.data;
      if (cid !== chatId) return;

      let found = false;

      patchMessages((prev) =>
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

    // ✅ SINGLE READ
    if (lastEvent.type === "message_read") {
      const { chatId: cid, messageId } = lastEvent.data;
      if (cid !== chatId) return;

      let found = false;

      patchMessages((prev) =>
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

    // ✅ BULK DELIVERED
    if (lastEvent.type === "messages_delivered") {
      const { chatId: cid, messageIds } = lastEvent.data;
      if (cid !== chatId) return;

      const idSet = new Set(messageIds.map(String));

      patchMessages((prev) =>
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

    // ✅ BULK READ
    if (lastEvent.type === "messages_read") {
      const { chatId: cid, messageIds } = lastEvent.data;
      if (cid !== chatId) return;

      const idSet = new Set(messageIds.map(String));

      patchMessages((prev) =>
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
  }, [ws, lastEvent, chatId, user?._id, patchMessages]);

  // typing timers
  const typingRef = React.useRef(false);
  const stopTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { bumpTyping } = useTyping({
    ws,
  });

  // const bumpTyping = React.useCallback(() => {
  //   if (!ws) return;

  //   if (!typingRef.current) {
  //     typingRef.current = true;
  //     ws.typingStart(chatId);
  //   }

  //   if (stopTimerRef.current) clearTimeout(stopTimerRef.current);

  //   stopTimerRef.current = setTimeout(() => {
  //     typingRef.current = false;
  //     ws.typingStop(chatId);
  //   }, 900);
  // }, [ws, chatId]);

  const insertAtCursor = (textarea: HTMLTextAreaElement, insert: string) => {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;

    const next =
      textarea.value.slice(0, start) + insert + textarea.value.slice(end);
    textarea.value = next;

    const pos = start + insert.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(pos, pos);
    });

    return next;
  };

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiClient.post(`/chat/messages/${chatId}/send`, {
        message: text,
        type: "text",
      });
    },
    onMutate: async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      await qc.cancelQueries({ queryKey: chatKey });

      const clientId = `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const optimistic: LocalMessage = {
        _id: clientId as any,
        clientId,
        chatId: chatId as any,
        senderId: user?._id as any,
        type: "text" as any,
        text: trimmed,
        createdAt: new Date().toISOString(),
        attachments: [],
        localStatus: "sending",
        deliveryStatus: "sending",
      } as any;

      patchMessages((prev) => [...prev, optimistic]);

      return { clientId };
    },
    onError: (_err, _text, ctx) => {
      if (!ctx?.clientId) return;

      patchMessages((prev) =>
        prev.map((m) =>
          m.clientId === ctx.clientId
            ? { ...m, localStatus: "failed", deliveryStatus: "sent" }
            : m,
        ),
      );
    },
    onSuccess: () => {
      // Do nothing: server WS `message_sent` will reconcile optimistic -> real id
    },
  });
  const sendImageOptimistic = async (file: File) => {
    if (!user?._id) return;

    const clientId = `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    // show local preview immediately
    const localUrl = URL.createObjectURL(file);

    addOptimistic({
      _id: clientId as any,
      clientId,
      chatId: chatId as any,
      senderId: user._id as any,
      type: "image" as any,
      text: draft?.trim() ?? "",
      createdAt: new Date().toISOString(),
      attachments: [{ kind: "image", url: localUrl }],
      localStatus: "sending",
      deliveryStatus: "sending",
    } as any);

    try {
      // 1) upload to Cloudinary (frontend)
      const { url } = await uploadToCloudinary(file, { kind: "image" });

      // swap optimistic attachment to real url (so WS reconciliation can match)
      patchMessages((prev) =>
        prev.map((m: any) =>
          m.clientId === clientId
            ? { ...m, attachments: [{ kind: "image", url }] }
            : m,
        ),
      );

      // 2) send message to backend
      await apiClient.post(`/chat/messages/${chatId}/send`, {
        type: "image",
        message: draft?.trim() ?? "",
        attachments: [{ kind: "image", url }],
      });
    } catch (e) {
      // mark failed
      patchMessages((prev) =>
        prev.map((m: any) =>
          m.clientId === clientId
            ? { ...m, localStatus: "failed", deliveryStatus: "sent" }
            : m,
        ),
      );
    } finally {
      // clear picker
      setImgFile(null);
      // don't revoke localUrl immediately if it's currently rendered; OK to leave,
      // or revoke after you swap to cloud url (best-effort):
      setTimeout(() => URL.revokeObjectURL(localUrl), 10_000);
    }
  };

  const sendVoiceOptimistic = async (
    blob: Blob,
    meta: { durationMs: number; mimeType: string },
  ) => {
    if (!user?._id) return;

    const clientId = `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const localUrl = URL.createObjectURL(blob);

    addOptimistic({
      _id: clientId as any,
      clientId,
      chatId: chatId as any,
      senderId: user._id as any,
      type: "file" as any,
      text: "",
      createdAt: new Date().toISOString(),
      attachments: [{ kind: "file", url: localUrl }],
      localStatus: "sending",
      deliveryStatus: "sending",
    } as any);

    try {
      // Cloudinary: upload audio as "video"
      const file = new File([blob], `voice_${Date.now()}.webm`, {
        type: meta.mimeType || "audio/webm",
      });

      const { url } = await uploadToCloudinary(file, { kind: "audio" });
      // ^ if your upload helper maps "audio" -> resourceType "video" internally

      patchMessages((prev) =>
        prev.map((m: any) =>
          m.clientId === clientId
            ? { ...m, attachments: [{ kind: "file", url }] }
            : m,
        ),
      );

      await apiClient.post(`/chat/messages/${chatId}/send`, {
        type: "file",
        message: "",
        attachments: [{ kind: "file", url }],
      });
    } catch (e) {
      patchMessages((prev) =>
        prev.map((m: any) =>
          m.clientId === clientId
            ? { ...m, localStatus: "failed", deliveryStatus: "sent" }
            : m,
        ),
      );
    } finally {
      setVoiceDraft(null);
      setTimeout(() => URL.revokeObjectURL(localUrl), 10_000);
    }
  };

  const sendVoice = async (
    blob: Blob,
    meta: { durationMs: number; mimeType: string },
  ) => {
    const fd = new FormData();
    fd.append(
      "file",
      blob,
      `voice.${meta.mimeType.includes("ogg") ? "ogg" : "webm"}`,
    );
    fd.append("durationMs", String(meta.durationMs));
    fd.append("mimeType", meta.mimeType);

    await apiClient.post(`/chat/messages/${chatId}/send-voice`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const onSend = async () => {
    // priority: image -> voice -> text
    if (imgFile) {
      await sendImageOptimistic(imgFile);
      return;
    }

    if (voiceDraft) {
      await sendVoiceOptimistic(voiceDraft.blob, voiceDraft.meta);
      return;
    }

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

    sendMutation.mutate(text);
    requestAnimationFrame(() => scrollToBottom("smooth"));
  };

  const retryMessage = (clientId: string) => {
    const msg = messages.find((m) => m.clientId === clientId);
    if (!msg?.text) return;

    shouldStickToBottomRef.current = true;

    patchMessages((prev) =>
      prev.map((m) =>
        m.clientId === clientId
          ? { ...m, localStatus: "sending", deliveryStatus: "sending" }
          : m,
      ),
    );

    sendMutation.mutate(msg.text);
    requestAnimationFrame(() => scrollToBottom("smooth"));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSend();
  };

  // helpers
  const getSender = (id: string) =>
    (members ?? []).find((m: any) => String(m._id) === String(id));

  if (loading || isLoadingMembers || isLoading) return <ChatPaneSkeleton />;

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-white/5 bg-surface shrink-0">
        <div className="flex items-center gap-3 min-w-0 w-full">
          <div className="lg:hidden">
            <Link href="/chat" className="btn btn-ghost px-3 py-2 text-xs">
              <ChevronLeft />
            </Link>
          </div>

          <Avatar userName={headerTitle} avatarUrl={headerAvatarUrl} />
          <button
            className="min-w-0 cursor-pointer"
            onClick={() => setOpenSettingsModal(true)}
          >
            <p className="truncate text-start text-sm font-semibold">
              {headerTitle}
            </p>
            <p className="text-xs text-muted text-start">{headerSubtitle}</p>
          </button>
        </div>

        {isGroup && (
          <div className="lg:max-w-30 max-w-12 w-full">
            <button
              className="btn btn-ghost px-3 py-2 text-xs"
              onClick={() => setOpenAddMembers(true)}
            >
              <span className="hidden lg:flex">Add members</span>
              <span className="lg:hidden">+</span>
            </button>
          </div>
        )}
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
                          {isGroup && !fromMe ? (
                            <span className="text-xs text-aurora-400">
                              {getSender(m.senderId)?.userName ||
                                getSender(m.senderId)?.displayName ||
                                (getSender(m.senderId)?.email
                                  ? String(getSender(m.senderId)?.email).split(
                                      "@",
                                    )[0]
                                  : "") ||
                                "Unknown User"}
                            </span>
                          ) : null}

                          <div>
                            {m.attachments?.length > 0 &&
                              m.attachments.map((a, i) => {
                                if (a.kind === "image") {
                                  return (
                                    <button
                                      key={i}
                                      className="cursor-pointer"
                                      onClick={() => setImgPreview(a.url)}
                                    >
                                      <Image
                                        src={a.url}
                                        alt={`attachment-${i}`}
                                        className="max-h-60 rounded-lg object-cover"
                                        height={240}
                                        width={240}
                                      />
                                    </button>
                                  );
                                }

                                if (a.kind === "file") {
                                  // treat as audio if it looks like audio
                                  const isAudio =
                                    /\.webm$|\.ogg$|\.mp3$|\.wav$|\.m4a$/i.test(
                                      a.url,
                                    ) || String(m.type) === "file";

                                  return isAudio ? (
                                    <audio
                                      key={i}
                                      controls
                                      className="w-full min-w-20 mt-2"
                                    >
                                      <source src={a.url} />
                                    </audio>
                                  ) : null;
                                }

                                return null;
                              })}

                            <p>{m.text}</p>
                          </div>

                          <div className="mt-1 flex items-center justify-end gap-2">
                            {/* failed */}
                            {fromMe && (m as any).localStatus === "failed" && (
                              <button
                                type="button"
                                onClick={() =>
                                  retryMessage((m as any).clientId!)
                                }
                                className="text-[10px] underline underline-offset-2 text-red-500 cursor-pointer hover:text-red-600"
                              >
                                Failed • Retry
                              </button>
                            )}

                            {/* ticks (DM only) */}
                            {fromMe &&
                              !isGroup &&
                              (m as any).localStatus !== "failed" && (
                                <span className="text-[10px]">
                                  <Checkmarks
                                    status={
                                      otherUser &&
                                      (m as any)?.readBy?.includes(
                                        otherUser._id!,
                                      )
                                        ? "read"
                                        : otherUser &&
                                            (m as any)?.deliveredTo?.includes(
                                              otherUser._id!,
                                            )
                                          ? "delivered"
                                          : ((m as any).deliveryStatus as any)
                                    }
                                  />
                                </span>
                              )}

                            {/* time */}
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

      {/* composer */}
      {/* <div className="flex items-center w-full"> */}
      <div className="sticky bottom-0 z-20 p-3 sm:p-4 border-t border-white/5 bg-surface shrink-0 grid grid-cols-[1fr_28px] md:grid-cols-[1fr_48px] gap-1">
        <div className="max-w-3xl flex items-start gap-1 relative">
          {/* ✅ media actions */}
          <ComposerMediaActions
            disabled={sendMutation.isPending}
            imgFile={imgFile}
            setImgFile={setImgFile}
            voiceDraft={voiceDraft}
            setVoiceDraft={setVoiceDraft}
            onPreview={setImgPreview}
          />

          {/* your textarea */}
          <div className="flex-1">
            <div className="input-wrap">
              <textarea
                className="input resize-none leading-relaxed"
                placeholder="Type a message"
                rows={1}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  bumpTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                ref={inputRef}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Press <span className="text-ink-100">Enter</span> to send •{" "}
              <span className="text-ink-100">Shift+Enter</span> for new line
            </p>
          </div>

          {/* your emoji button block stays */}
          {/* ... */}
        </div>

        {/* send button */}
        <div className="w-7 md:w-12">
          <button
            type="button"
            onClick={onSend}
            className={`btn btn-primary md:px-5 md:py-2.5 ${
              sendMutation.isPending ? "cursor-not-allowed opacity-70" : ""
            }`}
            disabled={sendMutation.isPending}
          >
            {sendMutation.isPending ? "…" : <Telegram />}
          </button>
        </div>
      </div>

      {/* </div> */}
      {/* settings modal (group view / user view) */}
      <WhatsAppSettingsModal
        open={openSettingsModal}
        onClose={() => setOpenSettingsModal(false)}
        mode={isGroup ? "group_view" : "user_view"}
        curChat={singleChat}
        otherUsers={isGroup ? members : []}
        targetUser={isGroup ? null : otherUser}
        onLogout={async () => {
          toast.loading("Logging out...");
          try {
            await apiClient.post("/users/logout");
            toast.remove();
            toast.success("Logged out successfully");
            window.location.href = "/login";
          } catch (error) {
            console.error("Logout error:", error);
          }
        }}
      />

      {/* add members modal */}
      <NewChatModal
        type="add-to-group"
        open={openAddMembers}
        onClose={() => setOpenAddMembers(false)}
        defaulMembers={members}
      />

      {imgPreview && (
        <Modal onClose={() => setImgPreview(null)} open={!!imgPreview}>
          <div className="w-full h-full min-h-100">
            <Image
              src={imgPreview}
              alt="attachment"
              className="rounded-lg object-contain"
              fill
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ChatPane;
