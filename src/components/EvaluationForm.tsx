import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, CheckCircle2, ChevronDown, Clock, Edit3, Loader2 } from "lucide-react";
import { CANDIDATES, EVALUATORS, QUESTIONS } from "@/data";
import { useEvalStore } from "@/store";
import type { Evaluation, Evaluator, QuestionKey, Score } from "@/types";
import { cn } from "@/lib/utils";

const LABELS: Record<Score, string> = {
  1: "No cumple",
  2: "Cumple",
  3: "Supera",
};

const EVAL_KEY = "dore-evaluator";

function currentCandidateId(): string | undefined {
  const d = new Date();
  const now = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return CANDIDATES.find((c) => now >= c.start && now < c.end)?.id;
}

export function EvaluationForm() {
  const { evaluations, submit } = useEvalStore();
  const [evaluator, setEvaluator] = useState<Evaluator | "">("");
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

  // Set of candidate IDs evaluated by currently selected evaluator
  const evaluatedIds = useMemo(() => {
    if (!evaluator) return new Set<string>();
    return new Set(evaluations.filter((e) => e.evaluator === evaluator).map((e) => e.candidate_id));
  }, [evaluations, evaluator]);

  // 1. Initial load: restore remembered evaluator and detect current schedule
  useEffect(() => {
    const saved = localStorage.getItem(EVAL_KEY) as Evaluator | null;
    if (saved && EVALUATORS.includes(saved)) {
      setEvaluator(saved);
    }
    const currentId = currentCandidateId();
    setNowId(currentId);
  }, []);

  // 2. Automatically propose the next candidate that is missing for the evaluator
  useEffect(() => {
    if (!evaluator) return;

    // If candidateId is empty OR if the user just switched evaluator and had no candidate
    if (!candidateId) {
      const nextPending = CANDIDATES.find((c) => !evaluatedIds.has(c.id));
      if (nextPending) {
        setCandidateId(nextPending.id);
      } else if (CANDIDATES[0]) {
        setCandidateId(CANDIDATES[0].id);
      }
    }
  }, [evaluator, evaluatedIds, candidateId]);

  // Existing evaluation for this evaluator & candidate
  const existing = useMemo(
    () => evaluations.find((e) => e.evaluator === evaluator && e.candidate_id === candidateId),
    [evaluations, evaluator, candidateId],
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
  const isComplete = Boolean(evaluator && candidateId && answeredCount === QUESTIONS.length);

  // Switch evaluator handler
  const handleEvaluatorChange = (nextEval: Evaluator | "") => {
    setEvaluator(nextEval);
    if (nextEval) {
      localStorage.setItem(EVAL_KEY, nextEval);
      // Auto propose next pending candidate for this evaluator
      const nextPending = CANDIDATES.find(
        (c) => !evaluations.some((e) => e.evaluator === nextEval && e.candidate_id === c.id),
      );
      if (nextPending) {
        setCandidateId(nextPending.id);
      }
    } else {
      localStorage.removeItem(EVAL_KEY);
    }
  };

  const onSubmit = async () => {
    if (!isComplete || sending || !evaluator || !candidateId) return;

    setSending(true);
    const ev: Evaluation = {
      evaluator,
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
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#83A686]/40 bg-[#83A686]/10 p-4 text-[#2C4A2F]">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#83A686]" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-foreground">
              {lastSubmitted.isUpdate
                ? "✓ Evaluación actualizada"
                : "✓ Evaluación enviada con éxito"}
            </p>
            <p className="text-muted-foreground">
              Se registraron correctamente los puntajes de{" "}
              <strong className="text-foreground">{lastSubmitted.candidateName}</strong> por{" "}
              {evaluator}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLastSubmitted(null)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Evaluator & Candidate Selection Header */}
      <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Evaluator Dropdown */}
          <div className="space-y-1.5">
            <label
              htmlFor="evaluator-select"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Evaluadora
            </label>
            <select
              id="evaluator-select"
              className="field font-medium"
              value={evaluator}
              onChange={(e) => handleEvaluatorChange(e.target.value as Evaluator)}
            >
              <option value="">Seleccionar evaluadora…</option>
              {EVALUATORS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
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
              className="field font-medium"
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
        </div>

        {/* Quick Candidate Selector Chips (Mobile First) */}
        {evaluator && (
          <div className="space-y-1.5 pt-1">
            <span className="block text-xs font-medium text-muted-foreground">
              Candidatos (✓ = ya evaluados por vos):
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
              {CANDIDATES.map((c) => {
                const isDone = evaluatedIds.has(c.id);
                const isSelected = c.id === candidateId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCandidateId(c.id);
                      setLastSubmitted(null);
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-[#83A686] bg-[#83A686] text-white shadow-xs"
                        : isDone
                          ? "border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100"
                          : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {isDone && <Check className="size-3 stroke-[3]" />}
                    <span>{c.name.split(",")[0]}</span>
                    <span className="opacity-70">({c.start})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Editing Notice if already evaluated */}
      {existing && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          <Edit3 className="size-4 shrink-0 text-amber-700" />
          <p>
            <strong>Modo edición:</strong> Ya enviaste una evaluación para{" "}
            <strong>{selectedCandidate?.name}</strong>. Podés corregir cualquier puntaje o
            comentario y guardar los cambios.
          </p>
        </div>
      )}

      {/* Candidate Selected Info */}
      {selectedCandidate && (
        <div className="mt-4 flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>
              Turno {selectedCandidate.shift} ({selectedCandidate.start} a {selectedCandidate.end}{" "}
              hs)
            </span>
          </div>
          <span>{existing ? "✓ Evaluado por vos" : "Pendiente de tu evaluación"}</span>
        </div>
      )}

      {/* Questions list */}
      <ol className="mt-5 space-y-4">
        {QUESTIONS.map((q, i) => {
          const currentScore = scores[q.key];
          const isOpen = openGuide === q.key;

          return (
            <li
              key={q.key}
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-xs transition-all",
                currentScore ? "border-[#83A686]/60" : "border-border",
              )}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#83A686]">
                    Pregunta {i + 1} de 5 · Peso x{q.weight}
                  </span>
                  <h3 className="font-display text-xl font-medium leading-snug text-foreground">
                    {q.title}
                  </h3>
                </div>
              </div>

              {/* Qué se espera line (EXPLICIT REQUIREMENT) */}
              <div className="mt-2.5 rounded-xl bg-secondary/80 p-3 text-xs leading-relaxed text-secondary-foreground">
                <span className="font-bold text-[#4F6C52]">Qué se espera: </span>
                <span className="font-medium text-foreground">{q.expected}</span>
              </div>

              {/* Scenario Prompt */}
              <div className="mt-2.5 text-xs italic text-muted-foreground">"{q.prompt}"</div>

              {/* Expandable detailed guide */}
              <button
                type="button"
                onClick={() => setOpenGuide(isOpen ? null : q.key)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span>{isOpen ? "Ocultar guía detallada" : "Ver criterios de puntuación"}</span>
                <ChevronDown
                  className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
                />
              </button>

              {isOpen && (
                <div className="mt-2.5 rounded-xl border border-dashed p-3 text-xs text-muted-foreground space-y-1.5 bg-muted/20">
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
                        "flex flex-col items-center justify-center min-h-[5.5rem] rounded-xl border-2 transition-all active:scale-[0.98]",
                        isSelected
                          ? "border-[#83A686] bg-[#83A686] text-white shadow-md ring-2 ring-[#83A686]/30"
                          : "border-border bg-background text-muted-foreground hover:border-[#83A686]/50 hover:bg-muted/40",
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
          Observaciones o comentarios (opcional)
        </label>
        <textarea
          id="comments-input"
          className="field min-h-24 resize-y py-2.5 text-sm"
          placeholder="Anotá detalles relevantes, dudas o justificaciones de puntaje…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {/* Fixed Bottom Action Bar (Mobile First) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-4 backdrop-blur-md shadow-2xl">
        <div className="mx-auto flex max-w-xl flex-col gap-2">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={cn(answeredCount === 5 ? "text-[#4F6C52]" : "text-muted-foreground")}>
              {answeredCount === 5 ? "✓ 5 de 5 respondidas" : `${answeredCount} de 5 respondidas`}
            </span>
            <span className="text-muted-foreground">
              {!evaluator
                ? "Falta elegir evaluadora"
                : !candidateId
                  ? "Falta elegir candidato"
                  : answeredCount < 5
                    ? `Faltan responder ${5 - answeredCount}`
                    : "Todo completo"}
            </span>
          </div>

          {/* Progress bar visual */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-[#83A686] transition-all duration-300"
              style={{ width: `${(answeredCount / 5) * 100}%` }}
            />
          </div>

          {/* Fixed Submit Button */}
          <button
            type="button"
            disabled={!isComplete || sending}
            onClick={onSubmit}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-xl text-lg font-semibold text-white transition-all shadow-md active:scale-[0.99]",
              isComplete && !sending
                ? "bg-[#83A686] hover:bg-[#729475] cursor-pointer"
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
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
                <span>Enviar Evaluación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
