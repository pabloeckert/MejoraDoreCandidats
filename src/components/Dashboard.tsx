import { Fragment, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { EVALUATORS, MAX_SCORE, QUESTIONS } from "@/data";
import { useEvalStore } from "@/store";
import { computeAll, STATUS_LABEL } from "@/utils/scoring";
import type { CandidateResult, Status } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<Status, string> = {
  veto: "status-veto",
  descartado: "status-descartado",
  reserva: "status-reserva",
  terna: "status-terna",
  "sin-datos": "status-none",
};

function StatusBadge({ r }: { r: CandidateResult }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_CLASS[r.status])}>
        {STATUS_LABEL[r.status]}
      </span>
      {r.provisional && <span className="text-xs text-muted-foreground">Provisorio</span>}
    </span>
  );
}

const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1).replace(".", ","));

function exportCsv(results: CandidateResult[]) {
  const rows = [["Candidato", "Turno", "Evaluaciones", "Puntaje", "Estado", ...EVALUATORS]];
  for (const r of results) {
    rows.push([
      r.candidate.name, r.candidate.shift, `${r.count}/4`, fmt(r.score), STATUS_LABEL[r.status],
      ...EVALUATORS.map((ev) => {
        const e = r.evaluations.find((x) => x.evaluator === ev);
        return e ? QUESTIONS.map((q) => e[q.key]).join("-") + (e.comment ? ` (${e.comment})` : "") : "";
      }),
    ]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = "dore-evaluaciones.csv"; a.click();
  URL.revokeObjectURL(url);
}

function Detail({ r }: { r: CandidateResult }) {
  if (!r.count) return <p className="text-sm text-muted-foreground">Sin evaluaciones aún.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-1 pr-3 font-medium">Evaluadora</th>
            {QUESTIONS.map((q, i) => <th key={q.key} className="px-2 py-1 text-center font-medium" title={q.title}>P{i + 1}</th>)}
            <th className="px-2 py-1 font-medium">Comentario</th>
          </tr>
        </thead>
        <tbody>
          {r.evaluations.map((e) => (
            <tr key={e.evaluator} className="border-t">
              <td className="py-1.5 pr-3">{e.evaluator}</td>
              {QUESTIONS.map((q) => (
                <td key={q.key} className={cn("px-2 text-center", (q.key === "p2" || q.key === "p4") && e[q.key] === 1 && "font-bold text-destructive")}>
                  {e[q.key]}
                </td>
              ))}
              <td className="px-2 text-muted-foreground">{e.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Dashboard() {
  const evaluations = useEvalStore((s) => s.evaluations);
  const [sortByScore, setSortByScore] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const results = useMemo(() => {
    const r = computeAll(evaluations);
    return sortByScore ? [...r].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)) : r;
  }, [evaluations, sortByScore]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Puntaje máximo {MAX_SCORE} · se actualiza en vivo</p>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setSortByScore((s) => !s)}>
            {sortByScore ? "Orden por horario" : "Orden por puntaje"}
          </button>
          <button className="btn-outline" onClick={() => exportCsv(results)}>
            <Download className="size-4" /> Descargar
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Horario</th>
              <th className="px-4 py-3 font-medium">Candidato</th>
              <th className="px-4 py-3 text-center font-medium">Evaluaciones</th>
              <th className="px-4 py-3 text-center font-medium">Puntaje</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <Fragment key={r.candidate.id}>
                <tr
                  className={cn("cursor-pointer border-t hover:bg-muted/50", r.status === "veto" && "row-veto")}
                  onClick={() => setOpenId(openId === r.candidate.id ? null : r.candidate.id)}
                >
                  <td className="px-4 py-3 text-muted-foreground">{r.candidate.shift} · {r.candidate.start}</td>
                  <td className="px-4 py-3 font-medium">{r.candidate.name}</td>
                  <td className="px-4 py-3 text-center">{r.count} de 4</td>
                  <td className="px-4 py-3 text-center font-display text-lg">{fmt(r.score)}</td>
                  <td className="px-4 py-3"><StatusBadge r={r} /></td>
                </tr>
                {openId === r.candidate.id && (
                  <tr className="border-t bg-muted/30"><td colSpan={5} className="px-4 py-3"><Detail r={r} /></td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {results.map((r) => (
          <button
            key={r.candidate.id}
            className={cn("rounded-xl border bg-card p-4 text-left", r.status === "veto" && "row-veto")}
            onClick={() => setOpenId(openId === r.candidate.id ? null : r.candidate.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{r.candidate.name}</p>
                <p className="text-xs text-muted-foreground">{r.candidate.shift} · {r.candidate.start} · {r.count} de 4</p>
              </div>
              <span className="font-display text-2xl">{fmt(r.score)}</span>
            </div>
            <div className="mt-2"><StatusBadge r={r} /></div>
            {openId === r.candidate.id && <div className="mt-3"><Detail r={r} /></div>}
          </button>
        ))}
      </div>
    </div>
  );
}
