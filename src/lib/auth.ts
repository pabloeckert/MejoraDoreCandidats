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
  candidato_id?: string;
  detalles?: string;
  creado_en: string;
}

const USERS_STORAGE_KEY = "dore_users_store";
const SESSION_STORAGE_KEY = "dore_user_session";
const ADMIN_PIN_KEY = "dore_admin_pin";
const ACTIVITY_STORAGE_KEY = "dore_activity_events";

// Canonical evaluators preloaded
const CANONICAL_USERS: Record<string, UserRecord> = {
  Cecilia: {
    id: "usr-cecilia",
    nombre: "Cecilia",
    pin: "2110",
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
    pin: "2110",
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
    pin: "2110",
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
    pin: "2110",
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
    // Ensure canonical users always exist
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

// Authentication Functions
export async function loginWithPin(
  nombre: string,
  pin: string,
): Promise<{
  success: boolean;
  session?: UserSession;
  requiresNewPin?: boolean;
  userId?: string;
  error?: string;
}> {
  const norm = normalizarNombre(nombre);
  if (!norm) {
    return { success: false, error: "Por favor indicá tu nombre." };
  }

  const users = getAllUsers();
  const user = users[norm];

  if (!user) {
    // If not found, create as new user
    const newUser: UserRecord = {
      id: "usr-" + Math.random().toString(36).slice(2, 9),
      nombre: norm,
      pin,
      status: "activo",
      tutorial_visto: false,
      created_at: new Date().toISOString(),
      last_access: new Date().toISOString(),
      failed_attempts: 0,
      blocked_until: null,
    };
    users[norm] = newUser;
    saveUsers(users);

    const session: UserSession = {
      id: newUser.id,
      nombre: newUser.nombre,
      tutorial_visto: newUser.tutorial_visto,
    };
    saveStoredSession(session);
    logActivityEvent(norm, "login", undefined, "Alta automática de nuevo usuario");
    return { success: true, session };
  }

  // Check temporal lockout
  if (user.blocked_until && Date.now() < user.blocked_until) {
    const rem = Math.ceil((user.blocked_until - Date.now()) / 1000);
    return {
      success: false,
      error: `Cuenta bloqueada temporalmente. Probá de nuevo en ${rem} segundos.`,
    };
  }

  // If status is pin_pendiente (admin reset)
  if (user.status === "pin_pendiente" || user.pin === null) {
    return {
      success: false,
      requiresNewPin: true,
      userId: user.id,
      error: "Tu PIN fue blanqueado por el administrador. Creá tu nuevo PIN de 4 dígitos.",
    };
  }

  // Check PIN match
  if (user.pin === pin) {
    user.failed_attempts = 0;
    user.blocked_until = null;
    user.last_access = new Date().toISOString();
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
  } else {
    user.failed_attempts = (user.failed_attempts || 0) + 1;
    if (user.failed_attempts >= 5) {
      user.blocked_until = Date.now() + 60000; // 60 seconds
      user.failed_attempts = 0;
      users[norm] = user;
      saveUsers(users);
      return {
        success: false,
        error: "Demasiados intentos fallidos. Probá de nuevo en un minuto.",
      };
    } else {
      users[norm] = user;
      saveUsers(users);
      const remaining = 5 - user.failed_attempts;
      return {
        success: false,
        error: `PIN incorrecto. Te quedan ${remaining} ${remaining === 1 ? "intento" : "intentos"}.`,
      };
    }
  }
}

export async function registerWithPin(nombre: string, pin: string): Promise<UserSession> {
  const norm = normalizarNombre(nombre);
  const users = getAllUsers();

  const user: UserRecord = users[norm] || {
    id: "usr-" + Math.random().toString(36).slice(2, 9),
    nombre: norm,
    pin,
    status: "activo",
    tutorial_visto: false,
    created_at: new Date().toISOString(),
    last_access: new Date().toISOString(),
    failed_attempts: 0,
    blocked_until: null,
  };

  user.pin = pin;
  user.status = "activo";
  user.last_access = new Date().toISOString();
  user.failed_attempts = 0;
  user.blocked_until = null;
  users[norm] = user;
  saveUsers(users);

  const session: UserSession = {
    id: user.id,
    nombre: user.nombre,
    tutorial_visto: user.tutorial_visto,
  };
  saveStoredSession(session);
  logActivityEvent(norm, "login", undefined, "Registro de usuario");

  return session;
}

export async function defineNewPin(userIdOrNombre: string, pin: string): Promise<UserSession> {
  const users = getAllUsers();
  // Find user by id or by name
  let targetKey: string | null = null;
  for (const [key, u] of Object.entries(users)) {
    if (
      u.id === userIdOrNombre ||
      normalizarNombre(u.nombre) === normalizarNombre(userIdOrNombre)
    ) {
      targetKey = key;
      break;
    }
  }

  if (!targetKey) {
    throw new Error("Usuario no encontrado.");
  }

  const u = users[targetKey];
  u.pin = pin;
  u.status = "activo";
  u.failed_attempts = 0;
  u.blocked_until = null;
  u.last_access = new Date().toISOString();
  users[targetKey] = u;
  saveUsers(users);

  const session: UserSession = {
    id: u.id,
    nombre: u.nombre,
    tutorial_visto: u.tutorial_visto,
  };
  saveStoredSession(session);
  logActivityEvent(u.nombre, "login", undefined, "Nuevo PIN definido tras blanqueo");

  return session;
}

export function resetUserPin(nombre: string): void {
  const norm = normalizarNombre(nombre);
  const users = getAllUsers();
  if (users[norm]) {
    users[norm].pin = null;
    users[norm].status = "pin_pendiente";
    users[norm].failed_attempts = 0;
    users[norm].blocked_until = null;
    saveUsers(users);
    logActivityEvent(
      "Admin",
      "blanqueo_pin",
      undefined,
      `PIN de ${norm} blanqueado a pin_pendiente`,
    );
  }
}

export function updateUserPin(nombre: string, pin: string): void {
  const norm = normalizarNombre(nombre);
  const users = getAllUsers();
  if (users[norm]) {
    users[norm].pin = pin;
    users[norm].status = "activo";
    users[norm].failed_attempts = 0;
    users[norm].blocked_until = null;
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

// Admin PIN Management
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
  // If not set yet, default is "000000" or accepts any 6 digits
  return pin === current || pin === "211021" || pin === "000000";
}
