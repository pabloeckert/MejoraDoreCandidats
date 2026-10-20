import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, CheckCircle2, ChevronDown, Clock, Edit3, Loader2, UserCheck } from "lucide-react";
import { CANDIDATES, QUESTIONS } from "@/data";
import { useEvalStore } from "@/store";
import type { Evaluation, Evaluator, QuestionKey, Score } from "@/types";
import { cn } from "@/lib/utils";

const LABELS: Record<Score, string> = {
  1: "No cumple",
  2: "Cumple",
  3: "Supera",
};

function currentCandidateId(): string | undefined {
  const d = new Date();
  const now = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return CANDIDATES.find((c) => now >= c.start && now < c.end)?.id;
}

interface EvaluationFormProps {
  evaluatorName: string;
  onLogout?: () => void;
}

export function EvaluationForm({ evaluatorName, onLogout }: EvaluationFormProps) {
  const { evaluations, submit } = useEvalStore();
  const [candidateId, setCandidateId] = useState("");
  const [scores, setScores] = useState<Partial<Record<QuestionKey, Score>>>({});
  const [comment, setComment] = useState("");
  const [openGuide, setOpenGuide] = useState<QuestionKey | null>(null);
  const [nowId, setNowId] = useState<string>();
  const [sending, setSending] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<{
    candidateName: string;
    isUpdate: boolean;
  } | null>(null);

  // Set of candidate IDs evaluated by currently authenticated evaluator
  const evaluatedIds = useMemo(() => {
    if (!evaluatorName) return new Set<string>();
    return new Set(
      evaluations.filter((e) => e.evaluator === evaluatorName).map((e) => e.candidate_id),
    );
  }, [evaluations, evaluatorName]);

  // 1. Initial load: detect current schedule and propose next candidate
  useEffect(() => {
    const currentId = currentCandidateId();
    setNowId(currentId);

    // If candidateId is empty, propose the next candidate missing for this evaluator
    if (!candidateId) {
      const nextPending = CANDIDATES.find((c) => !evaluatedIds.has(c.id));
      if (nextPending) {
        setCandidateId(nextPending.id);
      } else if (CANDIDATES[0]) {
        setCandidateId(CANDIDATES[0].id);
      }
    }
  }, [evaluatedIds, candidateId]);

  // Existing evaluation for this evaluator & candidate
  const existing = useMemo(
    () => evaluations.find((e) => e.evaluator === evaluatorName && e.candidate_id === candidateId),
    [evaluations, evaluatorName, candidateId],
  );

  // Load existing values when candidate or existing changes
  useEffect(() => {
    if (existing) {
      setScores({
        p1: existing.p1,
        p2: existing.p2,
        p3: existing.p3,
        p4: existing.p4,
        p5: existing.p5,
      });
      setComment(existing.comment ?? "");
    } else {
      setScores({});
      setComment("");
    }
  }, [existing, candidateId]);

  const selectedCandidate = CANDIDATES.find((c) => c.id === candidateId);

  // Question progress
  const answeredCount = QUESTIONS.filter((q) => scores[q.key] !== undefined).length;
  const isComplete = Boolean(evaluatorName && candidateId && answeredCount === QUESTIONS.length);

  const onSubmit = async () => {
    if (!isComplete || sending || !evaluatorName || !candidateId) return;

    setSending(true);
    const ev: Evaluation = {
      evaluator: evaluatorName as Evaluator,
      candidate_id: candidateId,
      p1: scores.p1 as Score,
      p2: scores.p2 as Score,
      p3: scores.p3 as Score,
      p4: scores.p4 as Score,
      p5: scores.p5 as Score,
      comment: comment.trim() || null,
    };

    try {
      const res = await submit(ev);
      const candName = selectedCandidate?.name ?? candidateId;
      const isUpdate = Boolean(existing);

      setLastSubmitted({
        candidateName: candName,
        isUpdate,
      });

      if (res === "saved") {
        toast.success(
          isUpdate
            ? `Evaluación actualizada para ${candName}`
            : `Evaluación guardada para ${candName}`,
        );
      } else {
        toast.warning(
          "Guardado localmente. Se sincronizará automáticamente con Supabase al recuperar la conexión.",
        );
      }

      // Propose next missing candidate automatically
      const updatedEvaluated = new Set([...evaluatedIds, candidateId]);
      const nextCandidate = CANDIDATES.find((c) => !updatedEvaluated.has(c.id));
      if (nextCandidate) {
        setCandidateId(nextCandidate.id);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al guardar. Intentá nuevamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-36">
      {/* Visible Confirmation Banner */}
      {lastSubmitted && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-emerald-900">
              {lastSubmitted.isUpdate
                ? "✓ Evaluación actualizada"
                : "✓ Evaluación enviada con éxito"}
            </p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Se registraron correctamente los puntajes de{" "}
              <strong className="text-emerald-900">{lastSubmitted.candidateName}</strong> por{" "}
              {evaluatorName}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLastSubmitted(null)}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Evaluator & Candidate Selection Header */}
      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        {/* Active Evaluator Badge (No select dropdown) */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#1A3D84] text-xs font-bold text-white uppercase shadow-xs">
              <UserCheck className="size-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Evaluadora Activa
              </p>
              <p className="text-sm font-bold text-[#1A3D84]">{evaluatorName}</p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-[#E1061E] transition cursor-pointer"
            >
              Salir
            </button>
          )}
        </div>

        {/* Candidate Dropdown */}
        <div className="space-y-1.5">
          <label
            htmlFor="candidate-select"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Candidato
          </label>
          <select
            id="candidate-select"
            className="field font-medium text-sm"
            value={candidateId}
            onChange={(e) => {
              setCandidateId(e.target.value);
              setLastSubmitted(null);
            }}
          >
            <option value="">Seleccionar candidato…</option>
            {(["Mañana", "Tarde"] as const).map((shift) => (
              <optgroup key={shift} label={`Turno ${shift}`}>
                {CANDIDATES.filter((c) => c.shift === shift).map((c) => {
                  const isDone = evaluatedIds.has(c.id);
                  return (
                    <option key={c.id} value={c.id}>
                      {isDone ? "✓ " : ""}
                      {c.start} · {c.name}
                      {isDone ? " (evaluado)" : ""}
                      {c.id === nowId ? " · AHORA" : ""}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Quick Candidate Selector Chips (Mobile First) */}
        <div className="space-y-1.5 pt-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Acceso Rápido por Candidato
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CANDIDATES.map((c) => {
              const isEvaluated = evaluatedIds.has(c.id);
              const isSelected = c.id === candidateId;
              const isNow = c.id === nowId;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCandidateId(c.id);
                    setLastSubmitted(null);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#1A3D84] text-white shadow-xs font-semibold"
                      : isEvaluated
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                    isNow && !isSelected && "ring-2 ring-[#F7CC13]",
                  )}
                >
                  {isEvaluated && <Check className="size-3 stroke-[2.5] text-emerald-600" />}
                  <span>{c.name.split(",")[0]}</span>
                  {isNow && (
                    <span className="rounded bg-[#F7CC13] px-1 text-[9px] font-bold text-[#1A3D84]">
                      AHORA
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Candidate Summary Banner */}
      {selectedCandidate && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-foreground">
                {selectedCandidate.name}
              </h2>
              {existing && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <Check className="size-3" />
                  Evaluado
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Turno {selectedCandidate.shift} · {selectedCandidate.start} a {selectedCandidate.end}{" "}
              hs
            </p>
          </div>

          {selectedCandidate.id === nowId && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#F7CC13] px-2.5 py-1 text-xs font-bold text-[#1A3D84]">
              <Clock className="size-3.5" />
              En Horario
            </span>
          )}
        </div>
      )}

      {/* 5 Questions Rubric */}
      <ol className="mt-5 space-y-4">
        {QUESTIONS.map((q, i) => {
          const currentScore = scores[q.key];
          const isOpen = openGuide === q.key;

          return (
            <li
              key={q.key}
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-xs transition-all",
                currentScore ? "border-[#1A3D84]/40" : "border-border",
              )}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A3D84]">
                    Pregunta {i + 1} de 5 · Peso x{q.weight}
                  </span>
                  <h3 className="font-display text-lg font-bold leading-snug text-foreground">
                    {q.title}
                  </h3>
                </div>
              </div>

              {/* Qué se espera line */}
              <div className="mt-2.5 rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs leading-relaxed text-[#2B2B2B]">
                <span className="font-bold text-[#1A3D84]">Qué se espera: </span>
                <span className="font-medium text-foreground">{q.expected}</span>
              </div>

              {/* Scenario Prompt */}
              <div className="mt-2.5 text-xs italic text-muted-foreground">"{q.prompt}"</div>

              {/* Expandable detailed guide */}
              <button
                type="button"
                onClick={() => setOpenGuide(isOpen ? null : q.key)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-[#1A3D84] hover:underline cursor-pointer"
              >
                <span>{isOpen ? "Ocultar criterios" : "Ver criterios detallados (1, 2, 3)"}</span>
                <ChevronDown
                  className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="mt-2.5 rounded-xl border border-dashed border-gray-300 p-3 text-xs text-muted-foreground space-y-1.5 bg-gray-50/50">
                  {([1, 2, 3] as Score[]).map((s) => (
                    <div key={s} className="flex gap-2">
                      <span className="font-bold text-foreground shrink-0">
                        {s} ({LABELS[s]}):
                      </span>
                      <span>{q.guide[s]}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Big Touch-Friendly 1 / 2 / 3 Score Buttons */}
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {([1, 2, 3] as Score[]).map((s) => {
                  const isSelected = currentScore === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScores((prev) => ({ ...prev, [q.key]: s }))}
                      className={cn(
                        "flex flex-col items-center justify-center min-h-[5.5rem] rounded-xl border-2 transition-all active:scale-[0.98] cursor-pointer",
                        isSelected
                          ? "border-[#1A3D84] bg-[#1A3D84] text-white shadow-md ring-2 ring-[#1A3D84]/20"
                          : "border-border bg-white text-muted-foreground hover:border-[#1A3D84]/50 hover:bg-gray-50",
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="text-3xl font-bold leading-none">{s}</span>
                      <span
                        className={cn(
                          "mt-1 text-xs font-semibold",
                          isSelected ? "text-white" : "text-muted-foreground",
                        )}
                      >
                        {LABELS[s]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Optional Comments */}
      <div className="mt-5 space-y-1.5">
        <label
          htmlFor="comments-input"
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Observaciones adicionales (opcional)
        </label>
        <textarea
          id="comments-input"
          rows={3}
          className="field text-sm"
          placeholder="Notas cualitativas sobre actitud, respuestas, puntualidad o dudas para el consenso grupal…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {/* Sticky Bottom Action Bar with Progress Counter */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur shadow-lg">
        <div className="mx-auto max-w-xl space-y-2">
          {/* Header indicator inside sticky bar */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">
              {answeredCount === 5 ? (
                <span className="text-emerald-700 font-bold">✓ Las 5 preguntas completas</span>
              ) : (
                <span>Preguntas respondidas: {answeredCount} de 5</span>
              )}
            </span>
            <span className="text-muted-foreground">
              {existing ? "Modo corrección activa" : "Nueva evaluación"}
            </span>
          </div>

          {/* Progress bar visual */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-[#1A3D84] transition-all duration-300"
              style={{ width: `${(answeredCount / 5) * 100}%` }}
            />
          </div>

          {/* Fixed Submit Button */}
          <button
            type="button"
            disabled={!isComplete || sending}
            onClick={onSubmit}
            className={cn(
              "flex h-13 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-white transition-all shadow-md active:scale-[0.99]",
              isComplete && !sending
                ? "bg-[#1A3D84] hover:bg-[#15326c] cursor-pointer"
                : "bg-gray-300 text-gray-500 opacity-60 cursor-not-allowed",
            )}
          >
            {sending ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Guardando en tiempo real…</span>
              </>
            ) : existing ? (
              <>
                <Edit3 className="size-5" />
                <span>Actualizar Evaluación</span>
              </>
            ) : (
              <>
                <Check className="size-5 stroke-[2.5]" />
                <span>Guardar Evaluación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
