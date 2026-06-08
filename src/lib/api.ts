const RAW = import.meta.env.VITE_API_URL
export const API_URL = RAW.replace(/\/$/, "");

const TOKEN_KEY = "hr_token";
const USER_KEY = "hr_user";

export type AuthUser = { id: string; name: string; email: string; role: string };

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },
  set(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export async function api<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = auth.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    auth.clear();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "message" in data
        ? (data as any).message
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export function pdfUrl(id: string) {
  const token = auth.getToken();
  // For simple <iframe src> we still need auth; use blob fetch instead.
  return { url: `${API_URL}/api/invoices/${id}/pdf`, token };
}

export async function fetchPdfBlob(id: string): Promise<Blob> {
  const token = auth.getToken();
  const res = await fetch(`${API_URL}/api/invoices/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to load PDF");
  return res.blob();
}
