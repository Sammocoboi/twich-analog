import { useMemo } from "react";
import { Login } from "./components/Login";
import { VideoPlayer } from "./components/VideoPlayer";
import { Chat } from "./components/Chat";
import { useAuth } from "./hooks/useAuth";

function readRoom(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") || "main";
}

export default function App() {
  const { token, loading, user, signOut } = useAuth();
  const room = useMemo(readRoom, []);

  if (loading) {
    return <div className="fullscreen-center">Загрузка...</div>;
  }

  if (!token) {
    return <Login />;
  }

  const hlsUrl = `${import.meta.env.VITE_HLS_BASE}/${import.meta.env.VITE_STREAM_KEY}.m3u8`;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🎥 StreamApp</div>
        <div className="topbar-right">
          <span className="room-label">room: {room}</span>
          {user && <span className="user-label">{user.email}</span>}
          <button className="logout" onClick={signOut}>Выйти</button>
        </div>
      </header>

      <main className="layout">
        <VideoPlayer src={hlsUrl} />
        <Chat room={room} />
      </main>
    </div>
  );
}