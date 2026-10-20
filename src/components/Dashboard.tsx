import { Fragment, useMemo, useState } from "react";
import {
  Download,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { CANDIDATES, EVALUATORS, MAX_SCORE, QUESTIONS } from "@/data";
import { DEMO_CANDIDATES, DEMO_EVALUATIONS } from "@/data.demo";
import { useEvalStore } from "@/store";
import { computeAll, computeResult, STATUS_LABEL } from "@/utils/scoring";
import type { CandidateResult } from "@/types";
import { cn } from "@/lib/utils";

const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1).replace(".", ","));

/**
 * Large colored status badge with motive
 * Ej: "Veto: Cecilia puso 1 en Contingencias"
 */
function StatusBadgeWithMotive({ r }: { r: CandidateResult }) {
  if (r.status === "veto") {
    // Collect all reasons why this candidate was vetoed (P2 or P4 = 1)
    const reasons: string[] = [];
    for (const e of r.evaluations) {
      if (e.p2 === 1) {
        reasons.push(`${e.evaluator} puso 1 en Contingencias`);
      }
      if (e.p4 === 1) {
        reasons.push(`${e.evaluator} puso 1 en Delimitación`);
      }
    }
    const motiveText = reasons.length > 0 ? reasons.join(", ") : "Puntaje 1 en pregunta crítica";

    return (
      <div className="flex flex-col gap-1 items-start">
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-xs"
          style={{ backgroundColor: "#E1061E" }}
        >
          <AlertTriangle className="size-3.5 stroke-[2.5]" />
          <span>Veto: {motiveText}</span>
        </span>
        {r.provisional && (
          <span className="text-[11px] text-muted-foreground">
            Descarte automático · {r.count} de 4 evaluaron
          </span>
        )}
      </div>
    );
  }

  if (r.status === "terna") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-xs"
          style={{ backgroundColor: "#83A686" }}
        >
          <CheckCircle className="size-3.5 stroke-[2.5]" />
          <span>Terna Final ({fmt(r.score)} pts)</span>
        </span>
        {r.provisional && (
          <span className="rounded-md border border-[#83A686]/40 bg-[#83A686]/10 px-1.5 py-0.5 text-[11px] font-medium text-[#2F4F32]">
            Provisorio
          </span>
        )}
      </div>
    );
  }

  if (r.status === "reserva") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
          <span>En Reserva ({fmt(r.score)} pts)</span>
        </span>
        {r.provisional && (
          <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
            Provisorio
          </span>
        )}
      </div>
    );
  }

  if (r.status === "descartado") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
          <span>Descartado (&lt;20 pts: {fmt(r.score)})</span>
        </span>
        {r.provisional && (
          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
            Provisorio
          </span>
        )}
      </div>
    );
  }

  // sin-datos
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-500">
      <span>Sin evaluar (0 de 4)</span>
    </span>
  );
}

function exportCsv(results: CandidateResult[], evaluatorsList: string[]) {
  const rows = [
    ["Candidato", "Turno", "Horario", "Evaluaciones", "Puntaje Final", "Estado", ...evaluatorsList],
  ];
  for (const r of results) {
    rows.push([
      r.candidate.name,
      r.candidate.shift,
      `${r.candidate.start} a ${r.candidate.end}`,
      `${r.count} de 4`,
      fmt(r.score),
      STATUS_LABEL[r.status],
      ...evaluatorsList.map((ev) => {
        const e = r.evaluations.find((x) => x.evaluator === ev);
        return e
          ? QUESTIONS.map((q) => `${q.key.toUpperCase()}:${e[q.key]}`).join(" ") +
              (e.comment ? ` [${e.comment}]` : "")
          : "Pendiente";
      }),
    ]);
  }
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `dore-evaluacion-candidatos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Detail({ r, isDemo = false }: { r: CandidateResult; isDemo?: boolean }) {
  if (!r.count) {
    return (
      <div className="py-2 text-xs italic text-muted-foreground">
        Aún no hay evaluaciones cargadas para este candidato.
      </div>
    );
  }

  const expectedEvaluators = isDemo ? ["A", "B", "C", "D"] : EVALUATORS;
  const missingEvaluators = expectedEvaluators.filter(
    (ev) => !r.evaluations.some((e) => e.evaluator === ev),
  );

  return (
    <div className="space-y-3 pt-2 pb-1">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left font-semibold text-muted-foreground">
              <th className="px-3 py-2">Evaluadora</th>
              {QUESTIONS.map((q) => (
                <th key={q.key} className="px-3 py-2 text-center">
                  {q.key.toUpperCase()} (x{q.weight})
                </th>
              ))}
              <th className="px-3 py-2 text-center font-bold text-foreground">Total</th>
              <th className="px-3 py-2">Observaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {r.evaluations.map((e) => {
              const subtotal = QUESTIONS.reduce((sum, q) => sum + e[q.key] * q.weight, 0);
              const isVetoCause = e.p2 === 1 || e.p4 === 1;

              return (
                <tr
                  key={e.evaluator}
                  className={cn("hover:bg-muted/30", isVetoCause && "bg-[#E1061E]/5")}
                >
                  <td className="px-3 py-2 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span>{e.evaluator}</span>
                      {isVetoCause && (
                        <span className="rounded bg-[#E1061E] px-1 py-0.2 text-[9px] font-bold text-white">
                          VETO
                        </span>
                      )}
                    </span>
                  </td>
                  {QUESTIONS.map((q) => {
                    const isCrit = (q.key === "p2" || q.key === "p4") && e[q.key] === 1;
                    return (
                      <td
                        key={q.key}
                        className={cn(
                          "px-3 py-2 text-center font-mono",
                          isCrit
                            ? "bg-[#E1061E] font-bold text-white rounded"
                            : e[q.key] === 3
                              ? "font-semibold text-emerald-700"
                              : "text-foreground",
                        )}
                      >
                        {e[q.key]}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center font-semibold text-foreground">
                    {subtotal} / 33
                  </td>
                  <td className="px-3 py-2 text-muted-foreground italic">
                    {e.comment ? `"${e.comment}"` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {missingEvaluators.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-amber-800">
          <Clock className="size-3.5" />
          <span>
            Falta evaluación de: <strong>{missingEvaluators.join(", ")}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const evaluations = useEvalStore((s) => s.evaluations);
  // Default: sort by final score descending
  const [sortMode, setSortMode] = useState<"score" | "schedule">("score");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(evaluations.length === 0);

  const hasRealEvaluations = evaluations.length > 0;
  const isDemoActive = showDemo;

  // Compute and sort
  const results = useMemo(() => {
    let all: CandidateResult[];

    if (isDemoActive) {
      all = DEMO_CANDIDATES.map((c) => computeResult(c, DEMO_EVALUATIONS));
    } else {
      all = computeAll(evaluations);
    }

    if (sortMode === "score") {
      return [...all].sort((a, b) => {
        // Scored candidates come first, descending
        if (a.score === null && b.score !== null) return 1;
        if (a.score !== null && b.score === null) return -1;
        if (a.score !== null && b.score !== null) {
          if (b.score !== a.score) return b.score - a.score;
        }
        // If tied or both null, preserve schedule order
        const targetList = isDemoActive ? DEMO_CANDIDATES : CANDIDATES;
        const idxA = targetList.findIndex((c) => c.id === a.candidate.id);
        const idxB = targetList.findIndex((c) => c.id === b.candidate.id);
        return idxA - idxB;
      });
    }

    // Schedule order
    return all;
  }, [evaluations, sortMode, isDemoActive]);

  const totalEvaluations = isDemoActive ? DEMO_EVALUATIONS.length : evaluations.length;
  const maxPossibleEvals = isDemoActive
    ? DEMO_CANDIDATES.length * 4
    : CANDIDATES.length * EVALUATORS.length;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      {/* Top Bar with Controls and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-[#1A3D84]">Tablero Consolidado</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              <span className="text-[9px] uppercase font-semibold text-gray-400">Cliente:</span>
              <span className="font-semibold text-gray-700">Doré</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalEvaluations} de {maxPossibleEvals} evaluaciones totales cargadas · Puntaje máx.{" "}
            {MAX_SCORE} · Actualizado en tiempo real
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Switch "Ver datos de ejemplo" */}
          <div
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#2B2B2B] hover:border-[#1A3D84] transition-colors cursor-pointer"
            title="Alternar entre datos de ejemplo y datos en vivo"
          >
            <Sparkles className="size-3.5 text-[#1A3D84]" />
            <label htmlFor="demo-toggle" className="cursor-pointer select-none">
              {showDemo ? "Modo ejemplo activo" : "Ver datos de ejemplo"}
            </label>
            <input
              id="demo-toggle"
              type="checkbox"
              checked={showDemo}
              onChange={(e) => setShowDemo(e.target.checked)}
              className="size-4 cursor-pointer accent-[#1A3D84]"
            />
          </div>

          {/* Sort toggle (Default: score descending) */}
          <button
            type="button"
            className="btn-outline cursor-pointer"
            onClick={() => setSortMode((prev) => (prev === "score" ? "schedule" : "score"))}
          >
            <ArrowUpDown className="size-3.5" />
            <span>
              {sortMode === "score" ? "Orden: Por puntaje (descendente)" : "Orden: Por horario"}
            </span>
          </button>

          {/* Export CSV button */}
          <button
            type="button"
            className="btn-outline cursor-pointer"
            onClick={() => exportCsv(results, isDemoActive ? ["A", "B", "C", "D"] : EVALUATORS)}
          >
            <Download className="size-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Demo Banner */}
      {isDemoActive && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="font-bold text-amber-900 text-sm">Estás viendo datos de ejemplo</p>
              <p className="text-amber-800">
                Mostrando casos de prueba en memoria (Terna Final, En Reserva, Descartado, Veto y
                Pendiente evaluados por A, B, C y D). Estos datos no se guardan en la base de datos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDemo(false)}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1 font-semibold text-amber-900 hover:bg-amber-100 transition cursor-pointer"
          >
            Volver a datos reales
          </button>
        </div>
      )}

      {/* Scoring Rules Quick Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Criterios:</span>
        <span className="inline-flex items-center gap-1 rounded bg-[#E1061E]/10 px-2 py-0.5 font-medium text-[#E1061E]">
          Veto si P2 o P4 = 1
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
          &lt; 20 Descartado
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
          20–26 En Reserva
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-[#83A686]/20 px-2 py-0.5 font-medium text-[#2F4F32]">
          27–33 Terna Final
        </span>
        <span className="ml-auto text-[11px] italic">
          * Filas atenuadas en gris indican evaluaciones pendientes (&lt; 4).
        </span>
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-xs md:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary/70 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3.5">Horario</th>
              <th className="px-4 py-3.5">Candidato</th>
              <th className="px-4 py-3.5 text-center">Evaluaciones</th>
              <th className="px-4 py-3.5 text-center">Puntaje Final</th>
              <th className="px-4 py-3.5">Estado y Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {results.map((r) => {
              const hasPending = r.count < 4;
              const isVeto = r.status === "veto";
              const isExpanded = openId === r.candidate.id;

              return (
                <Fragment key={r.candidate.id}>
                  <tr
                    onClick={() => setOpenId(isExpanded ? null : r.candidate.id)}
                    className={cn(
                      "cursor-pointer transition-colors select-none",
                      // Dim in gray when evaluations are pending (< 4)
                      hasPending
                        ? "bg-zinc-50/70 text-zinc-600 hover:bg-zinc-100/80"
                        : "bg-card text-foreground hover:bg-muted/40",
                      isVeto && "row-veto",
                      isExpanded && "bg-muted/40",
                    )}
                  >
                    {/* Horario */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-medium">{r.candidate.start}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({r.candidate.shift})
                      </span>
                    </td>

                    {/* Candidato */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-semibold",
                            hasPending ? "text-zinc-700" : "text-foreground",
                          )}
                        >
                          {r.candidate.name}
                        </span>
                        {hasPending && (
                          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Evaluaciones (Mostrar "2 de 4 evaluaciones") */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-block rounded-md px-2.5 py-1 text-xs font-semibold",
                          r.count === 4
                            ? "bg-emerald-100 text-emerald-800"
                            : r.count > 0
                              ? "bg-zinc-200 text-zinc-800"
                              : "bg-zinc-100 text-zinc-500",
                        )}
                      >
                        {r.count} de 4 evaluaciones
                      </span>
                    </td>

                    {/* Puntaje Final */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="font-display text-xl font-bold">{fmt(r.score)}</span>
                      {r.score !== null && (
                        <span className="text-[11px] text-muted-foreground"> / 33</span>
                      )}
                    </td>

                    {/* Estado con etiqueta grande y motivo */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadgeWithMotive r={r} />
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row with full evaluations details */}
                  {isExpanded && (
                    <tr className="bg-muted/20">
                      <td colSpan={5} className="px-6 py-4">
                        <Detail r={r} isDemo={isDemoActive} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="grid gap-3 md:hidden">
        {results.map((r) => {
          const hasPending = r.count < 4;
          const isVeto = r.status === "veto";
          const isExpanded = openId === r.candidate.id;

          return (
            <div
              key={r.candidate.id}
              onClick={() => setOpenId(isExpanded ? null : r.candidate.id)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all cursor-pointer shadow-xs",
                // Dim in gray when evaluations are pending (< 4)
                hasPending
                  ? "border-dashed border-zinc-300 bg-zinc-50/70 text-zinc-600"
                  : "border-border bg-card text-foreground",
                isVeto && "row-veto",
              )}
            >
              {/* Header: Name, Score, Schedule */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-base leading-snug">{r.candidate.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Turno {r.candidate.shift} · {r.candidate.start} hs
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold">{fmt(r.score)}</span>
                  {r.score !== null && (
                    <span className="text-[11px] text-muted-foreground block">/ 33</span>
                  )}
                </div>
              </div>

              {/* Badges: Evaluations count & Status with motive */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                <span
                  className={cn(
                    "inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
                    r.count === 4
                      ? "bg-emerald-100 text-emerald-800"
                      : r.count > 0
                        ? "bg-zinc-200 text-zinc-800"
                        : "bg-zinc-100 text-zinc-500",
                  )}
                >
                  {r.count} de 4 evaluaron
                </span>

                <StatusBadgeWithMotive r={r} />
              </div>

              {/* Mobile Expanded Detail */}
              {isExpanded && (
                <div className="mt-3 border-t border-border pt-3">
                  <Detail r={r} isDemo={isDemoActive} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
