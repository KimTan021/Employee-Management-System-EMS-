import { create } from 'zustand';

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  setAuth: (token: string, username: string, role: string, remember?: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

type AuthPayload = { token: string | null; username: string | null; role: string | null };

const LOCAL_KEY = 'auth-storage';
const SESSION_KEY = 'auth-storage-session';

function readStoredAuth(): AuthPayload {
  const tryParse = (raw: string | null): AuthPayload | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.token !== 'string') return null;
      return { token: parsed.token, username: parsed.username ?? null, role: parsed.role ?? null };
    } catch {
      return null;
    }
  };

  const session = tryParse(sessionStorage.getItem(SESSION_KEY));
  if (session) return session;
  const local = tryParse(localStorage.getItem(LOCAL_KEY));
  if (local) return local;
  return { token: null, username: null, role: null };
}

function writeStoredAuth(payload: AuthPayload, remember: boolean) {
  if (payload.token) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    if (remember) localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
    else localStorage.removeItem(LOCAL_KEY);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOCAL_KEY);
  }
}

const initial = readStoredAuth();

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: initial.token,
  username: initial.username,
  role: initial.role,
  setAuth: (token, username, role, remember = true) => {
    const payload = { token, username, role };
    writeStoredAuth(payload, remember);
    set(payload);
  },
  logout: () => {
    writeStoredAuth({ token: null, username: null, role: null }, false);
    set({ token: null, username: null, role: null });
  },
  isAuthenticated: () => !!get().token,
}));
