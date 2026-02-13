import { useChatSync } from "@/contexts/chat-sync-context";
import { useUser } from "@/contexts/user-cintext";
import { apiClient } from "@/lib/api/axios-client";
import { LocalMessage, UserType } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

export const useChats = () => {
  const [query, setQuery] = useState("");
  const { chats, setActiveChatId, setChats } = useChatSync();

  const { user, loading } = useUser();

  const { chatId } = useParams();

  const { isLoading: loadingMembers, data: members } = useQuery({
    queryKey: ["chat-members", chatId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/chat/members/${chatId}`); // <-- your endpoint
      return data?.data?.members ?? data?.members; // normalize to your response
    },

    enabled: !!chatId,

    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;

    return chats.filter((c) => {
      const otherUser = c.members?.find(
        (m: any) => String(m._id) !== String(user?._id),
      );
      const name = otherUser?.displayName || otherUser?.userName || "New User";

      const lm = c.lastMessageId as unknown as LastMessage;
      const lastText = typeof lm === "object" && lm ? (lm.text ?? "") : "";

      return (
        name.toLowerCase().includes(q) || lastText.toLowerCase().includes(q)
      );
    });
  }, [query, chats, user?._id]);

  const otherUsers = useMemo(() => {
    const meId = String(user?._id ?? "");

    const users = chats
      .map((c) => c.members?.find((m: any) => String(m._id) !== meId) ?? null)
      .filter((u): u is any => Boolean(u));

    const byId = new Map<string, any>();
    for (const u of users) byId.set(String(u._id), u);

    return Array.from(byId.values());
  }, [chats, user?._id]);

  return {
    query,
    setQuery,
    filtered,
    otherUsers,
    setActiveChatId,
    setChats,
    loading,
    members,
    loadingMembers,
  };
};
