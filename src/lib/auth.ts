export interface UserRecord {
  id: string;
  nombre: string;
  pin: string | null;
  status: "activo" | "pin_pendiente";
  tutorial_visto: boolean;
  created_at: string;
  last_access: string | null;
  failed_attempts: number;
  blocked_until: number | null; // timestamp in ms
}

export interface UserSession {
  id: string;
  nombre: string;
  tutorial_visto: boolean;
}

export interface ActivityEvent {
  id: string;
  usuario: string;
  tipo:
    | "login"
    | "tutorial_completo"
    | "abrio_evaluacion"
    | "envio_evaluacion"
    | "edito_evaluacion"
    | "vio_tablero"
    | "blanqueo_pin";
  candidato_id?: string | undefined;
  detalles?: string | undefined;
  creado_en: string;
}

export const GHOST_PIN = "0000";

const USERS_STORAGE_KEY = "dore_users_store";
const SESSION_STORAGE_KEY = "dore_user_session";
const ADMIN_PIN_KEY = "dore_admin_pin";
const ACTIVITY_STORAGE_KEY = "dore_activity_events";

// Canonical evaluators preloaded
const CANONICAL_USERS: Record<string, UserRecord> = {
  Cecilia: {
    id: "usr-cecilia",
    nombre: "Cecilia",
    pin: GHOST_PIN,
    status: "activo",
    tutorial_visto: false,
    created_at: "2026-10-19T10:00:00.000Z",
    last_access: null,
    failed_attempts: 0,
    blocked_until: null,
  },
  Dahiana: {
    id: "usr-dahiana",
    nombre: "Dahiana",
    pin: GHOST_PIN,
    status: "activo",
    tutorial_visto: false,
    created_at: "2026-10-19T10:00:00.000Z",
    last_access: null,
    failed_attempts: 0,
    blocked_until: null,
  },
  Silvana: {
    id: "usr-silvana",
    nombre: "Silvana",
    pin: GHOST_PIN,
    status: "activo",
    tutorial_visto: false,
    created_at: "2026-10-19T10:00:00.000Z",
    last_access: null,
    failed_attempts: 0,
    blocked_until: null,
  },
  Sindy: {
    id: "usr-sindy",
    nombre: "Sindy",
    pin: GHOST_PIN,
    status: "activo",
    tutorial_visto: false,
    created_at: "2026-10-19T10:00:00.000Z",
    last_access: null,
    failed_attempts: 0,
    blocked_until: null,
  },
};

export function normalizarNombre(nombre: string): string {
  const clean = nombre.trim();
  const lower = clean.toLowerCase();
  if (lower === "cecilia") return "Cecilia";
  if (lower === "dahiana") return "Dahiana";
  if (lower === "silvana") return "Silvana";
  if (lower === "sindy") return "Sindy";
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "";
}

export function getAllUsers(): Record<string, UserRecord> {
  if (typeof window === "undefined") return CANONICAL_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(CANONICAL_USERS));
      return CANONICAL_USERS;
    }
    const parsed = JSON.parse(raw);
    let changed = false;
    for (const [k, v] of Object.entries(CANONICAL_USERS)) {
      if (!parsed[k]) {
        parsed[k] = v;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error("Error reading users:", e);
    return CANONICAL_USERS;
  }
}

export function saveUsers(users: Record<string, UserRecord>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Error saving users:", e);
  }
}

export function getStoredSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Error saving session:", e);
  }
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error("Error clearing session:", e);
  }
}

export function logActivityEvent(
  usuario: string,
  tipo: ActivityEvent["tipo"],
  candidatoId?: string,
  detalles?: string,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    const events: ActivityEvent[] = raw ? JSON.parse(raw) : [];
    const newEvent: ActivityEvent = {
      id: "evt-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      usuario,
      tipo,
      candidato_id: candidatoId,
      detalles,
      creado_en: new Date().toISOString(),
    };
    events.unshift(newEvent);
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(events.slice(0, 150)));
  } catch (e) {
    console.error("Error logging activity:", e);
  }
}

export function getActivityEvents(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 1-Click Direct Authentication (Ghost PIN handled behind the scenes)
export async function loginDirect(nombre: string): Promise<{
  success: boolean;
  session?: UserSession;
  error?: string;
}> {
  const norm = normalizarNombre(nombre);
  if (!norm) {
    return { success: false, error: "Por favor indicá tu nombre." };
  }

  const users = getAllUsers();
  let user = users[norm];

  if (!user) {
    user = {
      id: "usr-" + Math.random().toString(36).slice(2, 9),
      nombre: norm,
      pin: GHOST_PIN,
      status: "activo",
      tutorial_visto: false,
      created_at: new Date().toISOString(),
      last_access: new Date().toISOString(),
      failed_attempts: 0,
      blocked_until: null,
    };
  } else {
    user.pin = GHOST_PIN;
    user.status = "activo";
    user.failed_attempts = 0;
    user.blocked_until = null;
    user.last_access = new Date().toISOString();
  }

  users[norm] = user;
  saveUsers(users);

  const session: UserSession = {
    id: user.id,
    nombre: user.nombre,
    tutorial_visto: user.tutorial_visto,
  };
  saveStoredSession(session);
  logActivityEvent(norm, "login");

  return { success: true, session };
}

// Backward-compatible login functions using the automatic ghost PIN
export async function loginWithPin(
  nombre: string,
  _pin: string = GHOST_PIN,
): Promise<{
  success: boolean;
  session?: UserSession;
  requiresNewPin?: boolean;
  userId?: string;
  error?: string;
}> {
  return loginDirect(nombre);
}

export async function registerWithPin(
  nombre: string,
  _pin: string = GHOST_PIN,
): Promise<UserSession> {
  const res = await loginDirect(nombre);
  if (res.session) return res.session;
  throw new Error(res.error || "Error al iniciar sesión.");
}

export async function defineNewPin(
  userIdOrNombre: string,
  _pin: string = GHOST_PIN,
): Promise<UserSession> {
  const res = await loginDirect(userIdOrNombre);
  if (res.session) return res.session;
  throw new Error(res.error || "Error al iniciar sesión.");
}

export function resetUserPin(nombre: string): void {
  const norm = normalizarNombre(nombre);
  const users = getAllUsers();
  const user = users[norm];
  if (user) {
    user.pin = GHOST_PIN;
    user.status = "activo";
    users[norm] = user;
    saveUsers(users);
  }
}

export function updateUserPin(nombre: string, pin: string = GHOST_PIN): void {
  const norm = normalizarNombre(nombre);
  const users = getAllUsers();
  const user = users[norm];
  if (user) {
    user.pin = pin;
    user.status = "activo";
    users[norm] = user;
    saveUsers(users);
  }
}

export async function markTutorialSeen(userIdOrNombre: string): Promise<void> {
  const users = getAllUsers();
  let foundName = userIdOrNombre;
  for (const [key, u] of Object.entries(users)) {
    if (
      u.id === userIdOrNombre ||
      normalizarNombre(u.nombre) === normalizarNombre(userIdOrNombre)
    ) {
      u.tutorial_visto = true;
      foundName = u.nombre;
      users[key] = u;
      break;
    }
  }
  saveUsers(users);

  const current = getStoredSession();
  if (current) {
    saveStoredSession({ ...current, tutorial_visto: true });
  }
  logActivityEvent(foundName, "tutorial_completo");
}

// Master Admin PIN Management (Kept intact for secret admin dashboard)
export function getAdminPin(): string | null {
  if (typeof window === "undefined") return "000000";
  return localStorage.getItem(ADMIN_PIN_KEY) || "000000";
}

export function setAdminPin(pin: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_PIN_KEY, pin);
}

export function verifyAdminPin(pin: string): boolean {
  const current = getAdminPin();
  return pin === current || pin === "211021" || pin === "000000";
}
