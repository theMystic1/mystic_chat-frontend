"use client";

import * as React from "react";
import { useWs } from "@/contexts/ws-context";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios-client";
import { ChatListItem, ChatSyncState, ReceiptStatus } from "@/utils/types";

const ChatSyncContext = React.createContext<ChatSyncState | null>(null);

const normalizeInitialChats = (chats: ChatListItem[]): ChatListItem[] => {
  return chats.map((c) => {
    const lm = c.lastMessageId;
    const lastMessageMessageId = lm?._id
      ? String(lm._id)
      : (c.lastMessageMessageId ?? null);

    const lastMessageText =
      typeof lm?.text === "string" ? lm.text : (c.lastMessageText ?? "");

    const lastMessageAt =
      lm?.updatedAt || lm?.createdAt
        ? String(lm.updatedAt || lm.createdAt)
        : (c.lastMessageAt ?? "");

    const lastMessageSenderId = lm?.senderId
      ? String(lm.senderId)
      : (c.lastMessageSenderId ?? null);

    return {
      ...c,
      unreadCount: Number(c.unreadCount ?? 0),
      lastMessageMessageId,
      lastMessageText,
      lastMessageAt,
      lastMessageSenderId,
    };
  });
};

// ---- helpers to update react-query cache ----
const mapIncomingToMessage = (m: any) => {
  return {
    _id: String(m.id ?? m._id),
    chatId: String(m.chatId),
    senderId: String(m.senderId),
    type: m.type ?? "text",
    text: m.text ?? "",
    createdAt: m.createdAt ?? new Date().toISOString(),
    updatedAt: m.updatedAt ?? m.createdAt ?? new Date().toISOString(),
    attachments: m.attachments ?? [],
    // client-side fields (safe)
    localStatus: "sent",
    deliveryStatus: "sent",
  };
};

export const ChatSyncProvider = ({
  initialChats,
  children,
}: {
  initialChats: ChatListItem[];
  children: React.ReactNode;
}) => {
  const { ws, lastEvent } = useWs();
  const qc = useQueryClient();

  const [chats, setChats] = React.useState<ChatListItem[]>(() =>
    normalizeInitialChats(initialChats),
  );

  const [activeChatId, _setActiveChatId] = React.useState<string | null>(null);
  const [typingByChatId, setTypingByChatId] = React.useState<
    Record<string, string[]>
  >({});
  const [onlineUserIds, setOnlineUserIds] = React.useState<Set<string>>(
    new Set(),
  );

  const [lastReceiptByChatId, setLastReceiptByChatId] = React.useState<
    Record<string, { messageId: string; status: ReceiptStatus }>
  >({});

  const meIdRef = React.useRef<string | null>(null);

  const setActiveChatId = React.useCallback((id: string | null) => {
    _setActiveChatId(id);
  }, []);

  React.useEffect(() => {
    setChats(normalizeInitialChats(initialChats));
  }, [initialChats]);

  React.useEffect(() => {
    if (!ws) return;

    const st = ws.getState();
    if (!st.authed) return;

    for (const c of chats) ws.joinChat(String(c._id));

    return () => {
      for (const c of chats) ws.leaveChat(String(c._id));
    };
  }, [ws, chats]);

  React.useEffect(() => {
    if (!ws || !lastEvent) return;
    if (lastEvent.type === "auth_ok") {
      meIdRef.current = lastEvent.data.userId;
      for (const c of chats) ws.joinChat(String(c._id));
    }
  }, [ws, lastEvent, chats]);

  React.useEffect(() => {
    if (!ws || !lastEvent) return;

    // ✅ chat created
    if (lastEvent.type === "chat_created") {
      const c = lastEvent.data;
      const chatId = String(c.id ?? c._id);

      setChats((prev) => {
        const exists = prev.some((x) => String(x._id) === chatId);
        if (exists) return prev;

        const newChat: ChatListItem = {
          _id: chatId,
          members: c.members,
          unreadCount: 0,
          lastMessageId: null,
          lastMessageMessageId: null,
          lastMessageText: "",
          lastMessageAt: c.createdAt ?? new Date().toISOString(),
          lastMessageSenderId: null,
        };

        return [newChat, ...prev];
      });

      // ✅ seed minimal cache so opening the chat doesn't "miss"
      qc.setQueryData(["chat", chatId], (old: any) => {
        if (old) return old;
        return {
          chat: {
            _id: chatId,
            ...c,
          },
          messages: [],
        };
      });

      // members cache (optional seed)
      qc.setQueryData(["chat-members", chatId], (old: any) => old ?? c.members);

      // subscribe
      ws.joinChat(chatId);

      return;
    }

    // ✅ message sent
    if (lastEvent.type === "message_sent") {
      const m = lastEvent.data;
      const chatId = String(m.chatId);
      const msg = mapIncomingToMessage(m);

      const meId = meIdRef.current ?? ws.getState().userId;
      const fromMe = meId ? String(m.senderId) === String(meId) : false;

      // delivered/read acks
      if (meId && !fromMe) {
        ws.ackDelivered(chatId, String(m.id));

        const isActive =
          activeChatId && String(activeChatId) === String(chatId);
        const visible =
          typeof document === "undefined" ||
          document.visibilityState === "visible";

        if (isActive && visible) ws.ackRead(chatId, String(m.id));
      }

      // ✅ update sidebar list
      setChats((prev) => {
        const idx = prev.findIndex((c) => String(c._id) === chatId);
        if (idx < 0) return prev;

        const copy = [...prev];
        const cur = copy[idx];

        const isActive =
          activeChatId && String(activeChatId) === String(chatId);

        const nextUnread =
          fromMe || isActive
            ? Number(cur.unreadCount ?? 0)
            : Number(cur.unreadCount ?? 0) + 1;

        const updated: ChatListItem = {
          ...cur,
          unreadCount: nextUnread,
          lastMessageMessageId: String(m.id),
          lastMessageText: m.text ?? "",
          lastMessageAt: m.createdAt ?? new Date().toISOString(),
          lastMessageSenderId: String(m.senderId),
        };

        copy.splice(idx, 1);
        copy.unshift(updated);
        return copy;
      });

      // ✅ update ticks for chat list (only my outgoing)
      if (fromMe) {
        setLastReceiptByChatId((prev) => ({
          ...prev,
          [chatId]: { messageId: String(m.id), status: "sent" },
        }));
      }

      // ✅ 1) write into React Query cache for the chat thread
      qc.setQueryData(["chat", chatId], (old: any) => {
        if (!old) return old;

        const oldMsgs = Array.isArray(old.messages) ? old.messages : [];
        const exists = oldMsgs.some(
          (x: any) => String(x._id) === String(msg._id),
        );
        if (exists) return old;

        return {
          ...old,
          messages: [...oldMsgs, msg],
          chat: {
            ...(old.chat ?? {}),
            lastMessageAt: msg.createdAt,
          },
        };
      });

      // ✅ 2) If it's not cached yet, prefetch so entering the chat works immediately
      const hasCache = qc.getQueryData(["chat", chatId]);
      if (!hasCache) {
        qc.prefetchQuery({
          queryKey: ["chat", chatId],
          queryFn: async () => {
            const { data } = await apiClient.get(`/chat/messages/${chatId}`);
            return data?.data ?? data;
          },
          staleTime: 60_000,
        });
      }

      return;
    }

    // ✅ delivered
    if (lastEvent.type === "message_delivered") {
      const { chatId, messageId } = lastEvent.data;

      setLastReceiptByChatId((prev) => {
        const cur = prev[chatId];
        if (!cur) return prev;
        if (String(cur.messageId) !== String(messageId)) return prev;
        if (cur.status === "read") return prev;
        return {
          ...prev,
          [chatId]: { messageId: String(messageId), status: "delivered" },
        };
      });

      // optional: reflect in message cache too (if you want)
      qc.setQueryData(["chat", String(chatId)], (old: any) => {
        if (!old?.messages) return old;
        return {
          ...old,
          messages: old.messages.map((x: any) =>
            String(x._id) === String(messageId)
              ? { ...x, deliveryStatus: "delivered" }
              : x,
          ),
        };
      });

      return;
    }

    // ✅ read
    if (lastEvent.type === "message_read") {
      const { chatId, messageId } = lastEvent.data;

      setLastReceiptByChatId((prev) => {
        const cur = prev[chatId];
        if (!cur) return prev;
        if (String(cur.messageId) !== String(messageId)) return prev;
        return {
          ...prev,
          [chatId]: { messageId: String(messageId), status: "read" },
        };
      });

      qc.setQueryData(["chat", String(chatId)], (old: any) => {
        if (!old?.messages) return old;
        return {
          ...old,
          messages: old.messages.map((x: any) =>
            String(x._id) === String(messageId)
              ? { ...x, deliveryStatus: "read" }
              : x,
          ),
        };
      });

      return;
    }

    // ✅ bulk delivered
    if (lastEvent.type === "messages_delivered") {
      const { chatId, messageIds } = lastEvent.data as any;
      const ids = Array.isArray(messageIds)
        ? messageIds.map(String)
        : [String(messageIds)];

      setLastReceiptByChatId((prev) => {
        const cur = prev[chatId];
        if (!cur) return prev;
        if (!ids.includes(String(cur.messageId))) return prev;
        if (cur.status === "read") return prev;
        return {
          ...prev,
          [chatId]: { messageId: cur.messageId, status: "delivered" },
        };
      });

      qc.setQueryData(["chat", String(chatId)], (old: any) => {
        if (!old?.messages) return old;
        const idSet = new Set(ids.map(String));
        return {
          ...old,
          messages: old.messages.map((x: any) =>
            idSet.has(String(x._id)) && x.deliveryStatus !== "read"
              ? { ...x, deliveryStatus: "delivered" }
              : x,
          ),
        };
      });

      return;
    }

    // ✅ bulk read
    if (lastEvent.type === "messages_read") {
      const { chatId, messageIds } = lastEvent.data as any;
      const ids = Array.isArray(messageIds)
        ? messageIds.map(String)
        : [String(messageIds)];

      setLastReceiptByChatId((prev) => {
        const cur = prev[chatId];
        if (!cur) return prev;
        if (!ids.includes(String(cur.messageId))) return prev;
        return {
          ...prev,
          [chatId]: { messageId: cur.messageId, status: "read" },
        };
      });

      qc.setQueryData(["chat", String(chatId)], (old: any) => {
        if (!old?.messages) return old;
        const idSet = new Set(ids.map(String));
        return {
          ...old,
          messages: old.messages.map((x: any) =>
            idSet.has(String(x._id)) ? { ...x, deliveryStatus: "read" } : x,
          ),
        };
      });

      return;
    }
  }, [ws, lastEvent, activeChatId, qc]);

  React.useEffect(() => {
    if (!ws || !activeChatId) return;

    ws.ackDeliveredAll(activeChatId);
    ws.ackReadAll(activeChatId);

    setChats((prev) =>
      prev.map((c) =>
        String(c._id) === String(activeChatId) ? { ...c, unreadCount: 0 } : c,
      ),
    );

    // Optional: on open, force a revalidate once (if you want)
    // qc.invalidateQueries({ queryKey: ["chat", String(activeChatId)] });
  }, [ws, activeChatId]);

  React.useEffect(() => {
    if (!ws || !lastEvent) return;

    if (lastEvent.type === "typing_start") {
      const { chatId, userId } = lastEvent.data;

      setTypingByChatId((prev) => {
        const cur = new Set(prev[chatId] ?? []);
        cur.add(String(userId));
        return { ...prev, [chatId]: Array.from(cur) };
      });

      return;
    }

    if (lastEvent.type === "typing_stop") {
      const { chatId, userId } = lastEvent.data;

      setTypingByChatId((prev) => {
        const cur = new Set(prev[chatId] ?? []);
        cur.delete(String(userId));
        const next = { ...prev };
        next[chatId] = Array.from(cur);
        if (next[chatId].length === 0) delete next[chatId];
        return next;
      });

      return;
    }
  }, [ws, lastEvent]);

  React.useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "presence_online") {
      setOnlineUserIds((prev) =>
        new Set(prev).add(String(lastEvent.data.userId)),
      );
      return;
    }

    if (lastEvent.type === "presence_offline") {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(String(lastEvent.data.userId));
        return next;
      });
      return;
    }
  }, [lastEvent]);

  const value: ChatSyncState = {
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    lastReceiptByChatId,
    typingByChatId,
    onlineUserIds,
  };

  return (
    <ChatSyncContext.Provider value={value}>
      {children}
    </ChatSyncContext.Provider>
  );
};

export const useChatSync = () => {
  const ctx = React.useContext(ChatSyncContext);
  if (!ctx) throw new Error("useChatSync must be used within ChatSyncProvider");
  return ctx;
};
