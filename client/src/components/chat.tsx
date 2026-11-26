import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";

interface ChatProps {
  room: string;
}

export function Chat({ room }: ChatProps) {
  const { token, user } = useAuth();
  const { status, messages, send } = useChat({ token, room });
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // автоскролл вниз, но только если пользователь уже внизу
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "connecting":
        return "подключение...";
      case "open":
        return "онлайн";
      case "closed":
        return "переподключение...";
      default:
        return "offline";
    }
  }, [status]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(text);
    setText("");
  }

  return (
    <aside className="chat">
      <header className="chat-header">
        <span className="chat-title">Чат</span>
        <span className={`chat-status chat-status--${status}`}>{statusLabel}</span>
      </header>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && (
          <p className="chat-empty">Сообщений пока нет. Будьте первым!</p>
        )}
        {messages.map((m, i) => {
          const isMe = user?.id === m.user_id;
          return (
            <div key={`${m.ts}-${i}`} className={`chat-message${isMe ? " chat-message--me" : ""}`}>
              <span className="chat-author">
                {isMe ? user.email.split("@")[0] : `user#${m.user_id}`}
              </span>
              <span className="chat-text">{m.text}</span>
            </div>
          );
        })}
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={status === "open" ? "Написать сообщение..." : "Нет соединения"}
          maxLength={500}
          disabled={status !== "open"}
          autoComplete="off"
        />
        <button type="submit" disabled={status !== "open" || !text.trim()}>
          →
        </button>
      </form>
    </aside>
  );
}