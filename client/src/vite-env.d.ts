/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_CHAT_WS: string;
  readonly VITE_HLS_BASE: string;
  readonly VITE_STREAM_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}