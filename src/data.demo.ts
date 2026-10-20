import type { Candidate, Evaluation } from "./types";

export const DEMO_CANDIDATES: Candidate[] = [
  {
    id: "demo-terna",
    name: "García, Martín (Ejemplo Terna)",
    shift: "Mañana",
    start: "08:30",
    end: "09:10",
  },
  {
    id: "demo-reserva",
    name: "Rodríguez, Lucía (Ejemplo Reserva)",
    shift: "Mañana",
    start: "09:10",
    end: "09:50",
  },
  {
    id: "demo-descartado",
    name: "López, Carlos (Ejemplo Descartado)",
    shift: "Mañana",
    start: "09:50",
    end: "10:30",
  },
  {
    id: "demo-veto",
    name: "Fernández, Sofía (Ejemplo Veto)",
    shift: "Tarde",
    start: "14:30",
    end: "15:10",
  },
  {
    id: "demo-pendiente",
    name: "González, Diego (Ejemplo Pendiente)",
    shift: "Tarde",
    start: "15:10",
    end: "15:50",
  },
];

export const DEMO_EVALUATIONS: Evaluation[] = [
  // Ejemplo Terna: A[3,3,2,3,3] B[3,3,3,3,2] C[3,2,2,3,3] D[3,3,2,3,3] -> promedio 30,5 -> Terna Final
  {
    evaluator: "A",
    candidate_id: "demo-terna",
    p1: 3,
    p2: 3,
    p3: 2,
    p4: 3,
    p5: 3,
    comment: "Perfil sobresaliente en liderazgo y trato.",
  },
  {
    evaluator: "B",
    candidate_id: "demo-terna",
    p1: 3,
    p2: 3,
    p3: 3,
    p4: 3,
    p5: 2,
    comment: "Excelente resolución operativa.",
  },
  { evaluator: "C", candidate_id: "demo-terna", p1: 3, p2: 2, p3: 2, p4: 3, p5: 3 },
  { evaluator: "D", candidate_id: "demo-terna", p1: 3, p2: 3, p3: 2, p4: 3, p5: 3 },

  // Ejemplo Reserva: A[2,2,2,2,2] B[2,3,2,2,2] C[2,2,1,2,3] D[3,2,2,2,2] -> 23 -> En Reserva
  { evaluator: "A", candidate_id: "demo-reserva", p1: 2, p2: 2, p3: 2, p4: 2, p5: 2 },
  { evaluator: "B", candidate_id: "demo-reserva", p1: 2, p2: 3, p3: 2, p4: 2, p5: 2 },
  { evaluator: "C", candidate_id: "demo-reserva", p1: 2, p2: 2, p3: 1, p4: 2, p5: 3 },
  { evaluator: "D", candidate_id: "demo-reserva", p1: 3, p2: 2, p3: 2, p4: 2, p5: 2 },

  // Ejemplo Descartado: A[1,2,1,2,2] B[2,2,1,2,1] C[1,2,2,2,2] D[2,2,1,2,2] -> 19,25 -> Descartado
  { evaluator: "A", candidate_id: "demo-descartado", p1: 1, p2: 2, p3: 1, p4: 2, p5: 2 },
  { evaluator: "B", candidate_id: "demo-descartado", p1: 2, p2: 2, p3: 1, p4: 2, p5: 1 },
  { evaluator: "C", candidate_id: "demo-descartado", p1: 1, p2: 2, p3: 2, p4: 2, p5: 2 },
  { evaluator: "D", candidate_id: "demo-descartado", p1: 2, p2: 2, p3: 1, p4: 2, p5: 2 },

  // Ejemplo Veto: A[3,3,3,3,3] B[3,3,3,3,3] C[3,1,3,3,3] -> promedio 31 pero Veto Automático (C puso 1 en Contingencias)
  { evaluator: "A", candidate_id: "demo-veto", p1: 3, p2: 3, p3: 3, p4: 3, p5: 3 },
  { evaluator: "B", candidate_id: "demo-veto", p1: 3, p2: 3, p3: 3, p4: 3, p5: 3 },
  {
    evaluator: "C",
    candidate_id: "demo-veto",
    p1: 3,
    p2: 1,
    p3: 3,
    p4: 3,
    p5: 3,
    comment: "Puntaje 1 en contingencias ante queja de cliente.",
  },

  // Ejemplo Pendiente: A[3,2,3,2,2] B[2,2,3,2,3] -> 25,5, "2 de 4", atenuado
  { evaluator: "A", candidate_id: "demo-pendiente", p1: 3, p2: 2, p3: 3, p4: 2, p5: 2 },
  { evaluator: "B", candidate_id: "demo-pendiente", p1: 2, p2: 2, p3: 3, p4: 2, p5: 3 },
];

export const PRACTICE_CANDIDATE: Candidate = {
  id: "candidato-practica",
  name: "Candidato de Prueba (Práctica)",
  shift: "Mañana",
  start: "08:00",
  end: "08:30",
};
