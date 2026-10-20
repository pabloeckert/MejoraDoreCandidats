import { useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
  UserCheck,
  Award,
  AlertTriangle,
  Send,
  X,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PRACTICE_CANDIDATE } from "@/data.demo";
import { QUESTIONS } from "@/data";
import type { QuestionKey, Score } from "@/types";

interface TutorialGuideProps {
  isOpen: boolean;
  onClose: () => void;
  evaluatorName: string;
}

export function TutorialGuide({ isOpen, onClose, evaluatorName }: TutorialGuideProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // State for Step 6 Practice Mode
  const [practiceScores, setPracticeScores] = useState<Partial<Record<QuestionKey, Score>>>({
    p1: 3,
    p2: 2,
    p3: 3,
    p4: 2,
    p5: 3,
  });
  const [practiceSent, setPracticeSent] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePracticeSubmit = () => {
    setPracticeSent(true);
    toast.success("¡Práctica completada con éxito! Ningún dato fue guardado en Supabase.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header with Step Indicator & Close */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#1A3D84] text-xs font-bold text-white">
              {step}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1A3D84]">
                Tutorial de Inducción
              </p>
              <p className="text-xs text-[#6B7280]">
                Paso {step} de {totalSteps}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-[#6B7280] hover:text-[#2B2B2B] cursor-pointer"
            >
              Saltar tutorial
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar (6 steps) */}
        <div className="grid grid-cols-6 gap-1 bg-gray-100 px-6 py-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i + 1 <= step ? "bg-[#1A3D84]" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Step Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1A3D84]">
                  <UserCheck className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1A3D84]">
                    1. Tu sesión y perfil de evaluadora
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Identificación individual para cada evaluación
                  </p>
                </div>
              </div>

              <p className="text-sm text-[#2B2B2B] leading-relaxed">
                Ingresaste como <strong className="text-[#1A3D84]">{evaluatorName}</strong>. Todas
                las notas que cargues se asociarán de forma segura a tu nombre.
              </p>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">
                  Vista previa en la barra superior:
                </p>
                <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500"></span>
                    <span className="text-sm font-semibold text-[#1A3D84]">
                      Evaluadora: {evaluatorName}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-red-600 border border-red-200 rounded-md px-2 py-0.5 bg-red-50">
                    Salir / Cambiar
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#6B7280]">
                Si otra evaluadora necesita usar este dispositivo, podés hacer clic en{" "}
                <strong>Salir</strong> para cerrar tu sesión y permitirle ingresar su propio PIN.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#83A686]">
                  <FileCheck className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1A3D84]">
                    2. Selección de candidato y tildes
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Orden de entrevistas y seguimiento de avance
                  </p>
                </div>
              </div>

              <p className="text-sm text-[#2B2B2B] leading-relaxed">
                El sistema te propone de forma inteligente el{" "}
                <strong>próximo candidato pendiente</strong> según el cronograma.
              </p>

              <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2.5 border border-emerald-200 text-xs font-medium text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>Cerioli, Javier (08:30)</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Ya evaluado por vos
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-[#1A3D84] text-xs font-medium text-[#1A3D84]">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#1A3D84]"></span>
                    <span>Martinez, Gustavo Adrian (09:10)</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#1A3D84]">Siguiente propuesto</span>
                </div>
              </div>

              <p className="text-xs text-[#6B7280]">
                La tilde verde <strong className="text-emerald-700">✓</strong> indica que ya
                guardaste una evaluación para esa persona. Podés volver a abrirlo en cualquier
                momento para revisar o corregir.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Award className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1A3D84]">
                    3. Puntajes del 1 al 3 y "Qué se espera"
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Rúbrica objetiva de calibración para Doré
                  </p>
                </div>
              </div>

              <p className="text-sm text-[#2B2B2B] leading-relaxed">
                Evaluás 5 competencias clave en una escala objetiva de tres niveles:
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="font-bold text-[#E1061E] text-base mb-1">1</p>
                  <p className="font-semibold text-red-900">No cumple</p>
                  <p className="text-[10px] text-red-700 mt-1">Insuficiente o riesgoso</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <p className="font-bold text-[#1A3D84] text-base mb-1">2</p>
                  <p className="font-semibold text-blue-900">Cumple</p>
                  <p className="text-[10px] text-blue-700 mt-1">Estándar esperado</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="font-bold text-[#83A686] text-base mb-1">3</p>
                  <p className="font-semibold text-emerald-900">Supera</p>
                  <p className="text-[10px] text-emerald-700 mt-1">Destacado y autónomo</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                <strong>Línea guía "Qué se espera":</strong> En cada pregunta podés ver la respuesta
                esperada y las pautas para calibrar tu puntuación sin dudas.
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                  <HelpCircle className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1A3D84]">
                    4. Observaciones y contador 5/5
                  </h3>
                  <p className="text-xs text-[#6B7280]">Comentarios cualitativos y completitud</p>
                </div>
              </div>

              <p className="text-sm text-[#2B2B2B] leading-relaxed">
                El campo de <strong>observaciones</strong> es opcional pero fundamental si querés
                justificar una nota o destacar una actitud notable.
              </p>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-[#2B2B2B] mb-2">
                  <span>Progreso de evaluación:</span>
                  <span className="rounded-full bg-[#1A3D84] text-white px-2.5 py-0.5 text-[11px]">
                    5 de 5 respondidas
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  El botón de envío se habilitará únicamente cuando hayas seleccionado un puntaje
                  para las 5 preguntas.
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1A3D84]">
                  <Send className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1A3D84]">
                    5. Enviar y corregir después
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Sincronización en tiempo real y corrección libre
                  </p>
                </div>
              </div>

              <p className="text-sm text-[#2B2B2B] leading-relaxed">
                Al hacer clic en <strong>Guardar Evaluación</strong>, los datos se guardan
                inmediatamente en la base compartida y actualizan el Tablero en vivo.
              </p>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-950 space-y-2">
                <p className="font-semibold text-[#1A3D84]">
                  ¿Te equivocaste o querés cambiar una nota?
                </p>
                <p>
                  No te preocupes. Simplemente volvé a hacer clic en el candidato, cambiá las
                  calificaciones deseadas y presioná <strong>Actualizar Evaluación</strong>. El
                  sistema sobreescribe tu evaluación previa sin duplicar datos.
                </p>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E1061E]">
                  <AlertTriangle className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1A3D84]">
                    6. Tablero, Veto y Práctica
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Estados consolidados y práctica interactiva
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#2B2B2B] leading-relaxed">
                El Tablero consolida las notas de las 4 evaluadoras ponderando las preguntas (máx 33
                pts):
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-[#83A686]/40 bg-[#83A686]/10 p-2 font-medium text-[#2F4F32]">
                  <strong>Terna Final (≥ 27 pts):</strong> Color Verde Salvia Doré.
                </div>
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 font-medium text-amber-900">
                  <strong>En Reserva (20 a 26 pts):</strong> Calificados con potencial.
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-100 p-2 font-medium text-gray-700">
                  <strong>Descartado (&lt; 20 pts):</strong> No alcanza el umbral.
                </div>
                <div className="rounded-lg border border-red-300 bg-red-50 p-2 font-medium text-red-900">
                  <strong>Veto Automático:</strong> Nota 1 en Contingencias o Delimitación.
                </div>
              </div>

              {/* Practice Mode Box */}
              <div className="rounded-xl border-2 border-dashed border-[#1A3D84]/40 bg-blue-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-[#1A3D84]" />
                  <span className="text-xs font-bold uppercase tracking-wide text-[#1A3D84]">
                    Modo Práctica
                  </span>
                </div>
                <p className="text-xs text-[#2B2B2B] font-medium mb-3">
                  Probalo con el candidato de ejemplo. <strong>Es práctica: no se guarda.</strong>
                </p>

                <div className="rounded-lg bg-white p-3 border border-gray-200 mb-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2B2B2B]">{PRACTICE_CANDIDATE.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {PRACTICE_CANDIDATE.start} hs
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {QUESTIONS.map((q) => (
                      <div key={q.key} className="text-center">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">
                          {q.key.toUpperCase()}
                        </span>
                        <select
                          value={practiceScores[q.key] ?? 3}
                          onChange={(e) =>
                            setPracticeScores({
                              ...practiceScores,
                              [q.key]: Number(e.target.value) as Score,
                            })
                          }
                          className="w-full text-center rounded border border-gray-300 py-1 text-xs font-bold text-[#1A3D84] bg-white cursor-pointer"
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePracticeSubmit}
                  className="w-full rounded-xl bg-[#1A3D84] py-2 text-xs font-bold text-white shadow-xs hover:bg-[#15326c] transition cursor-pointer"
                >
                  {practiceSent
                    ? "✓ ¡Práctica enviada! (No persistida)"
                    : "Enviar evaluación de prueba"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-6 py-4">
          <button
            type="button"
            disabled={step === 1}
            onClick={handlePrev}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            <span>Atrás</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1 rounded-xl bg-[#1A3D84] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#15326c] transition cursor-pointer"
          >
            <span>{step === totalSteps ? "Entendido, finalizar" : "Siguiente"}</span>
            {step < totalSteps && <ChevronRight className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
