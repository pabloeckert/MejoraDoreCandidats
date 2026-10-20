import { supabase } from "@/integrations/supabase/client";

export interface UserSession {
  id: string;
  nombre: string;
  tutorial_visto: boolean;
}

export interface LoginResult {
  session?: UserSession;
  requiresNewPin?: boolean;
  userId?: string;
  nombre?: string;
}

const SESSION_KEY = "dore_user_session";

export function getStoredSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch (e) {
    console.error("Error reading stored session:", e);
    return null;
  }
}

export function saveStoredSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Error saving stored session:", e);
  }
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error("Error clearing stored session:", e);
  }
}

export async function loginWithPin(nombre: string, pin: string): Promise<LoginResult> {
  const { data, error } = await supabase.rpc("iniciar_sesion", {
    p_nombre: nombre.trim(),
    p_pin: pin.trim(),
  });

  if (error) {
    throw new Error(error.message || "Usuario o PIN incorrecto.");
  }

  const res = data as Record<string, unknown>;
  if (res["requiere_nuevo_pin"]) {
    return {
      requiresNewPin: true,
      userId: String(res["id"]),
      nombre: String(res["nombre"]),
    };
  }

  const session: UserSession = {
    id: String(res["id"]),
    nombre: String(res["nombre"]),
    tutorial_visto: Boolean(res["tutorial_visto"]),
  };

  saveStoredSession(session);
  return { session };
}

export async function registerWithPin(nombre: string, pin: string): Promise<UserSession> {
  const { data, error } = await supabase.rpc("crear_usuario", {
    p_nombre: nombre.trim(),
    p_pin: pin.trim(),
  });

  if (error) {
    throw new Error(error.message || "Error al crear el acceso.");
  }

  const res = data as Record<string, unknown>;
  const session: UserSession = {
    id: String(res["id"]),
    nombre: String(res["nombre"]),
    tutorial_visto: Boolean(res["tutorial_visto"]),
  };

  saveStoredSession(session);
  return session;
}

export async function defineNewPin(usuarioId: string, pin: string): Promise<UserSession> {
  const { data, error } = await supabase.rpc("definir_pin", {
    p_usuario_id: usuarioId,
    p_pin: pin.trim(),
  });

  if (error) {
    throw new Error(error.message || "Error al definir el nuevo PIN.");
  }

  const res = data as Record<string, unknown>;
  const session: UserSession = {
    id: String(res["id"]),
    nombre: String(res["nombre"]),
    tutorial_visto: Boolean(res["tutorial_visto"]),
  };

  saveStoredSession(session);
  return session;
}

export async function markTutorialSeen(usuarioId: string): Promise<void> {
  const { error } = await supabase.rpc("marcar_tutorial_visto", {
    p_usuario_id: usuarioId,
  });

  if (error) {
    console.warn("Could not mark tutorial seen remotely:", error.message);
  }

  // Update local session
  const current = getStoredSession();
  if (current && current.id === usuarioId) {
    saveStoredSession({ ...current, tutorial_visto: true });
  }
}
