import { useState } from "react";
import { toast } from "sonner";
import { User, ArrowRight, Loader2 } from "lucide-react";
import { loginDirect, type UserSession } from "@/lib/auth";

interface LoginScreenProps {
  onSuccess: (session: UserSession) => void;
}

const PRIMARY_EVALUATORS = ["Cecilia", "Dahiana", "Silvana", "Sindy"];

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [customName, setCustomName] = useState<string>("");
  const [loadingName, setLoadingName] = useState<string | null>(null);

  const handleSelectEvaluator = async (evaluator: string) => {
    if (loadingName) return;
    setLoadingName(evaluator);

    try {
      const res = await loginDirect(evaluator);
      if (res.success && res.session) {
        toast.success(`¡Bienvenida, ${res.session.nombre}!`);
        onSuccess(res.session);
      } else {
        toast.error(res.error || "No se pudo iniciar sesión.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión.";
      toast.error(message);
    } finally {
      setLoadingName(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customName.trim();
    if (!clean) {
      toast.info("Ingresá tu nombre para continuar.");
      return;
    }
    await handleSelectEvaluator(clean);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8 select-none">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="relative mb-3 flex items-center justify-center select-none"
            title="Mejora Continua"
          >
            <img
              src="/brand/mc-isotipo.png"
              alt="Mejora Continua"
              className="h-16 w-16 object-contain"
            />
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1A3D84]">
            Mejora Continua
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
            Evaluación de Candidatos a Supervisor
          </p>

          {/* Chip Doré */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#83A686]/30 bg-[#83A686]/10 px-3 py-1 text-xs font-semibold text-[#2F4F32]">
            <img
              src="/brand/dore-logo.png"
              alt="Doré"
              className="h-3 w-auto object-contain rounded-xs"
            />
            <span>Doré Panadería y Cafetería</span>
          </div>

          <p className="mt-3 text-xs italic text-[#6B7280]">&ldquo;No motiva, clarifica.&rdquo;</p>
        </div>

        {/* 1-Step Direct Evaluator Selection */}
        <div className="space-y-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-[#1A3D84]">
            ¿Quién evalúa hoy?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {PRIMARY_EVALUATORS.map((ev) => {
              const isLoading = loadingName === ev;
              return (
                <button
                  key={ev}
                  type="button"
                  disabled={Boolean(loadingName)}
                  onClick={() => handleSelectEvaluator(ev)}
                  className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-xs transition hover:border-[#1A3D84] hover:shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-blue-50 text-[#1A3D84] font-bold text-base group-hover:bg-[#1A3D84] group-hover:text-white transition-colors">
                    {isLoading ? <Loader2 className="size-5 animate-spin" /> : ev.charAt(0)}
                  </div>
                  <span className="mt-2.5 text-sm font-bold text-[#2B2B2B] group-hover:text-[#1A3D84] transition-colors">
                    {ev}
                  </span>
                  <span className="text-[10px] text-[#6B7280]">Acceso directo</span>
                </button>
              );
            })}
          </div>

          {/* Custom Name Section */}
          <div className="pt-3 border-t border-gray-100">
            <form onSubmit={handleCustomSubmit} className="space-y-2">
              <label
                htmlFor="custom-name"
                className="block text-center text-xs font-medium text-[#6B7280]"
              >
                ¿Otro nombre?
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    id="custom-name"
                    type="text"
                    placeholder="Tu nombre y apellido"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    disabled={Boolean(loadingName)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-[#2B2B2B] placeholder:text-gray-400 focus:border-[#1A3D84] focus:outline-none focus:ring-2 focus:ring-[#1A3D84]/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={Boolean(loadingName) || !customName.trim()}
                  className="flex items-center gap-1 rounded-xl bg-[#1A3D84] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#15326c] transition disabled:opacity-40 cursor-pointer"
                >
                  <span>Entrar</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[11px] text-[#6B7280]">
          Hacé clic en tu nombre para ingresar inmediatamente a la evaluación.
        </p>
      </div>
    </div>
  );
}
