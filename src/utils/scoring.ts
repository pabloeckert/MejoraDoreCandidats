import { CANDIDATES, EVALUATORS, QUESTIONS } from "../data";
import type { Candidate, CandidateResult, Evaluation, Status } from "../types";

export function weightedTotal(e: Evaluation): number {
  return QUESTIONS.reduce((sum, q) => sum + e[q.key] * q.weight, 0);
}

export function hasVeto(evals: Evaluation[]): boolean {
  return evals.some((e) => e.p2 === 1 || e.p4 === 1);
}

export function statusFor(score: number | null, veto: boolean): Status {
  if (veto) return "veto";
  if (score === null) return "sin-datos";
  if (score < 20) return "descartado";
  if (score < 27) return "reserva";
  return "terna";
}

export function computeResult(candidate: Candidate, all: Evaluation[]): CandidateResult {
  const evaluations = all.filter((e) => e.candidate_id === candidate.id);
  const count = evaluations.length;
  const score = count ? evaluations.reduce((s, e) => s + weightedTotal(e), 0) / count : null;
  return {
    candidate,
    count,
    score,
    status: statusFor(score, hasVeto(evaluations)),
    provisional: count > 0 && count < EVALUATORS.length,
    evaluations,
  };
}

export function computeAll(all: Evaluation[]): CandidateResult[] {
  return CANDIDATES.map((c) => computeResult(c, all));
}

export const STATUS_LABEL: Record<Status, string> = {
  veto: "Veto Automático (Descarte)",
  descartado: "Descartado",
  reserva: "En Reserva",
  terna: "Terna Final",
  "sin-datos": "Sin evaluar",
};
