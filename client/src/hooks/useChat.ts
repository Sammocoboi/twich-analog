import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatStatus } from "../types";

interface UseChatOptions {
  token: string | null;
  room: string;
}

interface UseChatResult {
  status: ChatStatus;
  messages: ChatMessage[];
  send: (text: string) => void;
}

const MAX_MESSAGES = 500; // не даём DOM раздуваться

export function useChat({ token, room }: UseChatOptions): UseChatResult {
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const closedByUserRef = useRef(false);

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

    const url = new URL(import.meta.env.VITE_CHAT_WS);
    url.searchParams.set("room", room);
    url.searchParams.set("token", token);

    setStatus("connecting");
    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
      setStatus("open");
    };

    ws.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data) as ChatMessage;
        setMessages((prev) => {
          const next = [...prev, m];
          return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
        });
      } catch {
        // игнорируем невалидный JSON
      }
    };

    ws.onerror = () => {
      // браузер сам закроет соединение, дальше сработает onclose
    };

    ws.onclose = () => {
      setStatus("closed");
      wsRef.current = null;
      if (closedByUserRef.current) return;

      // экспоненциальный backoff: 1s, 2s, 4s, ... до 15s
      const attempt = Math.min(++retryRef.current, 5);
      const delay = Math.min(1000 * 2 ** (attempt - 1), 15000);
      timerRef.current = window.setTimeout(connect, delay);
    };
  }, [token, room]);

  useEffect(() => {
    closedByUserRef.current = false;
    setMessages([]);
    connect();
    return () => {
      closedByUserRef.current = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      setStatus("idle");
    };
  }, [connect]);

  const send = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500) return;
    ws.send(JSON.stringify({ text: trimmed }));
  }, []);

  return { status, messages, send };
}