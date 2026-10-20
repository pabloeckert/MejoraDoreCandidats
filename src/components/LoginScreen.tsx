import { useState } from "react";
import { toast } from "sonner";
import { Lock, User, ArrowRight, ShieldCheck, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { loginWithPin, registerWithPin, defineNewPin, type UserSession } from "@/lib/auth";

interface LoginScreenProps {
  onSuccess: (session: UserSession) => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "register" | "define_pin">("login");
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [userIdForNewPin, setUserIdForNewPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNombre = nombre.trim();
    if (!cleanNombre && mode !== "define_pin") {
      setErrorMsg("Por favor, ingresá tu nombre.");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setErrorMsg("El PIN debe tener exactamente 4 dígitos numéricos.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const res = await loginWithPin(cleanNombre, pin);
        if (res.requiresNewPin && res.userId) {
          setUserIdForNewPin(res.userId);
          setMode("define_pin");
          setPin("");
          toast.info(
            "Tu PIN fue blanqueado por el administrador. Por favor ingresá tu nuevo PIN de 4 dígitos.",
          );
          return;
        }
        if (res.session) {
          toast.success(`¡Bienvenida, ${res.session.nombre}!`);
          onSuccess(res.session);
        }
      } else if (mode === "register") {
        if (pin !== confirmPin) {
          setErrorMsg("Los PINs no coinciden. Verificalos e intentá de nuevo.");
          return;
        }
        const session = await registerWithPin(cleanNombre, pin);
        toast.success(`Acceso creado con éxito. ¡Bienvenida, ${session.nombre}!`);
        onSuccess(session);
      } else if (mode === "define_pin") {
        if (!userIdForNewPin) {
          throw new Error("ID de usuario no identificado.");
        }
        if (pin !== confirmPin) {
          setErrorMsg("Los PINs no coinciden.");
          return;
        }
        const session = await defineNewPin(userIdForNewPin, pin);
        toast.success("Nuevo PIN guardado con éxito.");
        onSuccess(session);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 flex items-center justify-center">
            <img
              src="/brand/mc-isotipo.png"
              alt="Mejora Continua"
              className="h-20 w-20 object-contain drop-shadow-sm select-none"
            />
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-[#2B2B2B]">
            Mejora Continua
          </h1>
          <p className="mt-1 text-sm font-medium text-[#6B7280]">
            Evaluación de Candidatos a Supervisor
          </p>

          {/* Chip Doré */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#83A686]/40 bg-[#83A686]/10 px-3 py-1 text-xs font-semibold text-[#3B5B3E]">
            <span className="size-2 rounded-full bg-[#83A686]"></span>
            <span>Evaluación para Doré</span>
          </div>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 border-b border-gray-100 pb-3">
            <h2 className="text-lg font-semibold text-[#1A3D84]">
              {mode === "login" && "Ingresar al Sistema"}
              {mode === "register" && "Crear tu Acceso"}
              {mode === "define_pin" && "Definir nuevo PIN"}
            </h2>
            <p className="text-xs text-[#6B7280]">
              {mode === "login" && "Ingresá tu nombre y PIN de 4 dígitos"}
              {mode === "register" && "Completá tus datos para acceder por primera vez"}
              {mode === "define_pin" && "Tu acceso fue restablecido; elegí tu nuevo PIN"}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-[#E1061E] border border-red-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== "define_pin" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#2B2B2B]">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cecilia, Dahiana, Silvana, Sindy"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-[#2B2B2B] placeholder:text-gray-400 focus:border-[#1A3D84] focus:outline-none focus:ring-2 focus:ring-[#1A3D84]/20"
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#2B2B2B]">
                {mode === "define_pin" ? "Nuevo PIN (4 dígitos)" : "PIN (4 dígitos)"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPin(val);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm font-mono tracking-widest text-[#2B2B2B] placeholder:text-gray-400 focus:border-[#1A3D84] focus:outline-none focus:ring-2 focus:ring-[#1A3D84]/20"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            </div>

            {(mode === "register" || mode === "define_pin") && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#2B2B2B]">
                  Confirmar PIN (4 dígitos)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setConfirmPin(val);
                    }}
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm font-mono tracking-widest text-[#2B2B2B] placeholder:text-gray-400 focus:border-[#1A3D84] focus:outline-none focus:ring-2 focus:ring-[#1A3D84]/20"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A3D84] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15326c] focus:outline-none focus:ring-2 focus:ring-[#1A3D84]/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "login" && "Entrar"}
                    {mode === "register" && "Crear mi acceso"}
                    {mode === "define_pin" && "Guardar nuevo PIN"}
                  </span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          {mode !== "define_pin" && (
            <div className="mt-5 text-center">
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrorMsg(null);
                    setPin("");
                    setConfirmPin("");
                  }}
                  className="text-xs font-semibold text-[#1A3D84] hover:underline cursor-pointer"
                >
                  ¿Primera vez? Creá tu acceso
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                    setPin("");
                    setConfirmPin("");
                  }}
                  className="text-xs font-semibold text-[#1A3D84] hover:underline cursor-pointer"
                >
                  ¿Ya tenés acceso? Iniciá sesión
                </button>
              )}
            </div>
          )}
        </div>

        {/* Security Footer Note */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#6B7280]">
          <ShieldCheck className="size-4 text-[#83A686]" />
          <span>Acceso seguro protegido por PIN de 4 dígitos</span>
        </div>
      </div>
    </div>
  );
}
