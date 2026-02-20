// hooks/useChatById.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios-client";
import type { LocalMessage } from "@/utils/types";

export const useChatById = (chatId: string) => {
  const chatQuery = useQuery({
    queryKey: ["chat", chatId],
    enabled: !!chatId,
    queryFn: async () => {
      const { data } = await apiClient.get(`/chat/messages/${chatId}`);

      const payload = data?.data ?? data;
      return payload;
    },
    select: (payload: any) => {
      const messages: LocalMessage[] = (payload?.messages ?? []).map(
        (m: any) => ({
          ...m,
          localStatus: m.localStatus ?? "sent",
          deliveryStatus: m.deliveryStatus ?? "sent",
        }),
      );

      return {
        ...payload,
        messages,
      };
    },
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const membersQuery = useQuery({
    queryKey: ["chat-members", chatId],
    enabled: !!chatId,
    queryFn: async () => {
      const { data } = await apiClient.get(`/chat/members/${chatId}`);
      return data?.data?.members ?? data?.members ?? [];
    },
    staleTime: 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const chatData = chatQuery.data;
  const messages: LocalMessage[] = chatData?.messages ?? [];

  return {
    chatData,
    messages,
    members: membersQuery.data ?? [],
    isLoading: chatQuery.isLoading,
    isLoadingMembers: membersQuery.isLoading,
  };
};
