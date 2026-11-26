export interface User {
  id: number;
  email: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ChatMessage {
  user_id: number;
  room: string;
  text: string;
  ts: number;
}

export type ChatStatus = "idle" | "connecting" | "open" | "closed";