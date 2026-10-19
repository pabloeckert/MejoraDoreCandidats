import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { CANDIDATES, EVALUATORS, QUESTIONS } from "@/data";
import { useEvalStore } from "@/store";
import type { Evaluation, Evaluator, QuestionKey, Score } from "@/types";
import { cn } from "@/lib/utils";

const LABELS: Record<Score, string> = { 1: "No cumple", 2: "Cumple", 3: "Supera" };
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
  const [open, setOpen] = useState<QuestionKey | null>(null);
  const [nowId, setNowId] = useState<string>();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(EVAL_KEY) as Evaluator | null;
    if (saved && EVALUATORS.includes(saved)) setEvaluator(saved);
    const id = currentCandidateId();
    setNowId(id);
    if (id) setCandidateId(id);
  }, []);

  const existing = useMemo(
    () => evaluations.find((e) => e.evaluator === evaluator && e.candidate_id === candidateId),
    [evaluations, evaluator, candidateId],
  );

  useEffect(() => {
    if (existing) {
      setScores({ p1: existing.p1, p2: existing.p2, p3: existing.p3, p4: existing.p4, p5: existing.p5 });
      setComment(existing.comment ?? "");
    } else {
      setScores({});
      setComment("");
    }
  }, [existing]);

  const complete = evaluator && candidateId && QUESTIONS.every((q) => scores[q.key]);

  const onSubmit = async () => {
    if (!complete) return;
    if (existing && !confirm("Ya cargaste una evaluación para este candidato. ¿Reemplazarla?")) return;
    setSending(true);
    const ev = { evaluator, candidate_id: candidateId, ...scores, comment } as Evaluation;
    const r = await submit(ev);
    setSending(false);
    if (r === "saved") toast.success("Evaluación enviada");
    else toast.warning("Sin conexión: se guardó en este celular y se enviará al volver internet");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">Evaluadora</span>
          <select
            className="field"
            value={evaluator}
            onChange={(e) => {
              setEvaluator(e.target.value as Evaluator);
              localStorage.setItem(EVAL_KEY, e.target.value);
            }}
          >
            <option value="">Elegir…</option>
            {EVALUATORS.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">Candidato</span>
          <select className="field" value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
            <option value="">Elegir…</option>
            {(["Mañana", "Tarde"] as const).map((shift) => (
              <optgroup key={shift} label={`Turno ${shift}`}>
                {CANDIDATES.filter((c) => c.shift === shift).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.start} · {c.name}{c.id === nowId ? "  (ahora)" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {existing && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
          Ya evaluaste a este candidato. Podés modificar y reenviar.
        </p>
      )}

      <ol className="space-y-4">
        {QUESTIONS.map((q, i) => (
          <li key={q.key} className="rounded-xl border bg-card p-4">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-3 text-left"
              onClick={() => setOpen(open === q.key ? null : q.key)}
            >
              <h3 className="font-display text-lg leading-snug">
                <span className="text-primary">P{i + 1}.</span> {q.title}
              </h3>
              <ChevronDown className={cn("mt-1 size-5 shrink-0 text-muted-foreground transition-transform", open === q.key && "rotate-180")} />
            </button>
            {open === q.key && (
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p className="italic">"{q.prompt}"</p>
                <ul className="space-y-1">
                  {([1, 2, 3] as Score[]).map((s) => (
                    <li key={s}><strong className="text-foreground">{s}:</strong> {q.guide[s]}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {([1, 2, 3] as Score[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScores((p) => ({ ...p, [q.key]: s }))}
                  className={cn("score-btn", scores[q.key] === s && "score-btn-active")}
                  aria-pressed={scores[q.key] === s}
                >
                  <span className="text-3xl font-semibold">{s}</span>
                  <span className="text-xs">{LABELS[s]}</span>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-muted-foreground">Comentarios (opcional)</span>
        <textarea className="field min-h-24" value={comment} onChange={(e) => setComment(e.target.value)} />
      </label>

      <button
        type="button"
        disabled={!complete || sending}
        onClick={onSubmit}
        className="h-14 w-full rounded-xl bg-primary text-lg font-medium text-primary-foreground transition-opacity disabled:opacity-40"
      >
        {sending ? "Enviando…" : existing ? "Actualizar Evaluación" : "Enviar Evaluación"}
      </button>
    </div>
  );
}
