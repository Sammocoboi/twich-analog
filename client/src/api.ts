import type { TokenResponse, User } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE;

/** OAuth2PasswordRequestForm требует application/x-www-form-urlencoded */
export async function login(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.append("username", email); // в вашем FastAPI username = email
  body.append("password", password);

  const res = await fetch(`${API_BASE}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Неверный email или пароль");
    throw new Error(`Ошибка входа: ${res.status}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Не удалось получить профиль: ${res.status}`);
  return (await res.json()) as User;
}