import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Delete, RotateCcw, AlertCircle, Loader2 } from "lucide-react";
import { loginWithPin, defineNewPin, type UserSession, getAllUsers } from "@/lib/auth";

interface LoginScreenProps {
  onSuccess: (session: UserSession) => void;
  onAdminTrigger?: () => void;
}

const PRIMARY_EVALUATORS = ["Cecilia", "Dahiana", "Silvana", "Sindy"];

export function LoginScreen({ onSuccess, onAdminTrigger }: LoginScreenProps) {
  const [nombre, setNombre] = useState<string>("");
  const [customNameMode, setCustomNameMode] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [mode, setMode] = useState<"login" | "new_pin_first" | "new_pin_confirm">("login");
  const [newPinDraft, setNewPinDraft] = useState<string>("");
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);

  const customInputRef = useRef<HTMLInputElement>(null);

  // Trigger shake animation on error
  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  // Process PIN submission automatically when 4 digits are entered
  const handlePinComplete = useCallback(
    async (completedPin: string) => {
      setErrorMsg(null);

      const targetNombre = nombre.trim();
      if (!targetNombre) {
        setErrorMsg("Seleccioná o ingresá tu nombre antes de digitar el PIN.");
        triggerShake();
        setPin("");
        return;
      }

      setLoading(true);

      try {
        if (mode === "login") {
          const res = await loginWithPin(targetNombre, completedPin);
          if (res.requiresNewPin) {
            setTargetUserId(res.userId || targetNombre);
            setMode("new_pin_first");
            setPin("");
            toast.info("Tu PIN fue blanqueado. Por favor definí tu nuevo PIN de 4 dígitos.");
            return;
          }
          if (res.success && res.session) {
            toast.success(`Bienvenida, ${res.session.nombre}`);
            onSuccess(res.session);
          } else {
            setErrorMsg(res.error || "PIN incorrecto.");
            triggerShake();
            setPin("");
          }
        } else if (mode === "new_pin_first") {
          setNewPinDraft(completedPin);
          setPin("");
          setMode("new_pin_confirm");
          toast.info("Confirmá tu nuevo PIN de 4 dígitos.");
        } else if (mode === "new_pin_confirm") {
          if (completedPin !== newPinDraft) {
            setErrorMsg("Los PINs no coinciden. Intentá nuevamente.");
            triggerShake();
            setPin("");
            setNewPinDraft("");
            setMode("new_pin_first");
            return;
          }
          const session = await defineNewPin(targetUserId || targetNombre, completedPin);
          toast.success("Nuevo PIN activado con éxito.");
          onSuccess(session);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al procesar el acceso.";
        setErrorMsg(message);
        triggerShake();
        setPin("");
      } finally {
        setLoading(false);
      }
    },
    [nombre, mode, newPinDraft, targetUserId, onSuccess, triggerShake],
  );

  // Keypad click or physical keyboard handler
  const handleDigit = useCallback(
    (digit: string) => {
      if (loading || pin.length >= 4) return;
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Auto-advance & auto-submit on 4th digit
        handlePinComplete(nextPin);
      }
    },
    [loading, pin, handlePinComplete],
  );

  const handleBackspace = useCallback(() => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  }, [loading]);

  const handleClear = useCallback(() => {
    if (loading) return;
    setPin("");
    setErrorMsg(null);
  }, [loading]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in the custom name input
      if (document.activeElement === customInputRef.current) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  // When evaluator chip is chosen
  const handleSelectEvaluator = (evaluator: string) => {
    setNombre(evaluator);
    setCustomNameMode(false);
    setErrorMsg(null);
    setPin("");

    // Check if this evaluator has pin_pendiente
    const users = getAllUsers();
    if (users[evaluator] && users[evaluator].status === "pin_pendiente") {
      setTargetUserId(users[evaluator].id);
      setMode("new_pin_first");
      toast.info(`El PIN de ${evaluator} fue blanqueado. Ingresá el nuevo PIN.`);
    } else {
      setMode("login");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8 select-none">
      <div className="w-full max-w-sm">
        {/* Brand Header: Clean white dominance with MC Isotipo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className="relative mb-3 flex items-center justify-center cursor-pointer select-none"
            title="Mejora Continua"
            onPointerDown={(e) => {
              if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onAdminTrigger?.();
              }
            }}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                onAdminTrigger?.();
              }
            }}
            onContextMenu={(e) => {
              if (e.ctrlKey || e.metaKey) e.preventDefault();
            }}
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

        {/* Step 1: Evaluator Selection */}
        <div className="mb-5">
          <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-wider text-[#1A3D84]">
            ¿Quién evalúa?
          </label>

          <div className="grid grid-cols-2 gap-2">
            {PRIMARY_EVALUATORS.map((ev) => {
              const isSelected = nombre === ev && !customNameMode;
              return (
                <button
                  key={ev}
                  type="button"
                  onClick={() => handleSelectEvaluator(ev)}
                  className={`flex items-center justify-center rounded-xl border py-2.5 px-3 text-sm font-semibold transition cursor-pointer ${
                    isSelected
                      ? "border-[#1A3D84] bg-[#1A3D84] text-white shadow-xs"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {ev}
                </button>
              );
            })}
          </div>

          {/* Option for custom name */}
          <div className="mt-2 text-center">
            {!customNameMode ? (
              <button
                type="button"
                onClick={() => {
                  setCustomNameMode(true);
                  setNombre("");
                  setTimeout(() => customInputRef.current?.focus(), 100);
                }}
                className="text-xs font-medium text-[#1A3D84] hover:underline cursor-pointer"
              >
                ¿Otro nombre? Hacé clic acá
              </button>
            ) : (
              <div className="mt-1">
                <input
                  ref={customInputRef}
                  type="text"
                  placeholder="Tu nombre y apellido"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-gray-400 focus:border-[#1A3D84] focus:outline-none focus:ring-2 focus:ring-[#1A3D84]/20"
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 2: PIN Dots / Visual Feedback */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1A3D84]">
              {mode === "login" && "PIN de 4 dígitos"}
              {mode === "new_pin_first" && "Nuevo PIN (4 dígitos)"}
              {mode === "new_pin_confirm" && "Confirmar nuevo PIN"}
            </span>
            {loading && (
              <span className="flex items-center gap-1 text-xs text-[#1A3D84]">
                <Loader2 className="size-3 animate-spin" />
                <span>Verificando...</span>
              </span>
            )}
          </div>

          {/* 4 PIN Dots */}
          <div
            className={`flex items-center justify-center gap-3.5 py-2.5 transition-transform ${
              shake ? "animate-bounce" : ""
            }`}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`flex size-11 items-center justify-center rounded-xl border-2 transition-all ${
                    isFilled
                      ? "border-[#1A3D84] bg-white shadow-xs"
                      : "border-gray-200 bg-gray-50/50"
                  }`}
                >
                  {isFilled ? (
                    <div className="size-3.5 rounded-full bg-[#1A3D84]" />
                  ) : (
                    <div className="size-2 rounded-full bg-gray-200" />
                  )}
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 py-1.5 px-3 text-xs text-[#E1061E] border border-red-200 text-center">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Step 3: Numeric Keypad (Auto-advances and submits at 4th digit) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-xs">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                disabled={loading || !nombre}
                onClick={() => handleDigit(String(num))}
                className="flex h-14 items-center justify-center rounded-xl border border-gray-100 bg-white text-xl font-bold text-[#1A3D84] shadow-xs transition hover:border-[#1A3D84]/40 hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {num}
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              disabled={loading || pin.length === 0}
              onClick={handleClear}
              className="flex h-14 items-center justify-center rounded-xl border border-transparent text-xs font-semibold text-gray-500 hover:text-gray-900 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Borrar todo"
            >
              <RotateCcw className="size-5" />
            </button>

            {/* Zero */}
            <button
              type="button"
              disabled={loading || !nombre}
              onClick={() => handleDigit("0")}
              className="flex h-14 items-center justify-center rounded-xl border border-gray-100 bg-white text-xl font-bold text-[#1A3D84] shadow-xs transition hover:border-[#1A3D84]/40 hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              0
            </button>

            {/* Backspace Button */}
            <button
              type="button"
              disabled={loading || pin.length === 0}
              onClick={handleBackspace}
              className="flex h-14 items-center justify-center rounded-xl border border-transparent text-gray-600 hover:text-[#E1061E] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Borrar último"
            >
              <Delete className="size-5" />
            </button>
          </div>
        </div>

        {/* Footer info note */}
        <p className="mt-4 text-center text-[11px] text-[#6B7280]">
          Ingresá los 4 dígitos. El sistema verifica automáticamente.
        </p>
      </div>
    </div>
  );
}
