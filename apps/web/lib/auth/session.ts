"use client";

const TOKEN_KEY = "relieflink_token";
const USER_KEY = "relieflink_user";

export function saveSession(token: string, user: unknown): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser<T>(): T | null {
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;
  return JSON.parse(value) as T;
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
