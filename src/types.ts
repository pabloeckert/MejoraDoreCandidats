export type Evaluator = "Cecilia" | "Dahiana" | "Silvana" | "Sindy";
export type Score = 1 | 2 | 3;
export type QuestionKey = "p1" | "p2" | "p3" | "p4" | "p5";

export interface Candidate {
  id: string;
  name: string;
  shift: "Mañana" | "Tarde";
  start: string; // "08:30"
  end: string;
}

export interface Question {
  key: QuestionKey;
  title: string;
  weight: number;
  prompt: string;
  expected: string;
  guide: Record<Score, string>;
}

export interface Evaluation {
  evaluator: Evaluator;
  candidate_id: string;
  p1: Score;
  p2: Score;
  p3: Score;
  p4: Score;
  p5: Score;
  comment?: string | null;
  updated_at?: string;
}

export type Status = "veto" | "descartado" | "reserva" | "terna" | "sin-datos";

export interface CandidateResult {
  candidate: Candidate;
  count: number;
  score: number | null;
  status: Status;
  provisional: boolean;
  evaluations: Evaluation[];
}
