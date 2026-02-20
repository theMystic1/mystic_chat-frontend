"use client";

import { WsClient } from "@/utils/ws/wss";
import { useParams } from "next/navigation";
import { Ref, useCallback, useRef } from "react";

export const useTyping = ({
  ws,
  // typingRef,
  // chatId,
  // stopTimerRef,
}: {
  ws: WsClient | null;
  // typingRef: any;
  // chatId: string;
  // stopTimerRef: any;
}) => {
  const { chatId } = useParams();

  const typingRef = useRef(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bumpTyping = useCallback(() => {
    if (!ws) return;

    if (!typingRef.current) {
      typingRef.current = true;
      ws.typingStart(chatId as string);
    }

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);

    stopTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      ws.typingStop(chatId as string);
    }, 900);
  }, [ws, chatId]);

  return {
    bumpTyping,
  };
};
