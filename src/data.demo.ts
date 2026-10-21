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
  // Ejemplo Terna: Sindy[3,3,2,3,3] Cecilia[3,3,3,3,2] Silvana[3,2,2,3,3] Dahiana[3,3,2,3,3] -> promedio 30,5 -> Terna Final
  {
    evaluator: "Sindy",
    candidate_id: "demo-terna",
    p1: 3,
    p2: 3,
    p3: 2,
    p4: 3,
    p5: 3,
    comment: "Perfil sobresaliente en liderazgo y trato.",
  },
  {
    evaluator: "Cecilia",
    candidate_id: "demo-terna",
    p1: 3,
    p2: 3,
    p3: 3,
    p4: 3,
    p5: 2,
    comment: "Excelente resolución operativa.",
  },
  { evaluator: "Silvana", candidate_id: "demo-terna", p1: 3, p2: 2, p3: 2, p4: 3, p5: 3 },
  { evaluator: "Dahiana", candidate_id: "demo-terna", p1: 3, p2: 3, p3: 2, p4: 3, p5: 3 },

  // Ejemplo Reserva: Sindy[2,2,2,2,2] Cecilia[2,3,2,2,2] Silvana[2,2,1,2,3] Dahiana[3,2,2,2,2] -> 23 -> En Reserva
  { evaluator: "Sindy", candidate_id: "demo-reserva", p1: 2, p2: 2, p3: 2, p4: 2, p5: 2 },
  { evaluator: "Cecilia", candidate_id: "demo-reserva", p1: 2, p2: 3, p3: 2, p4: 2, p5: 2 },
  { evaluator: "Silvana", candidate_id: "demo-reserva", p1: 2, p2: 2, p3: 1, p4: 2, p5: 3 },
  { evaluator: "Dahiana", candidate_id: "demo-reserva", p1: 3, p2: 2, p3: 2, p4: 2, p5: 2 },

  // Ejemplo Descartado: Sindy[1,2,1,2,2] Cecilia[2,2,1,2,1] Silvana[1,2,2,2,2] Dahiana[2,2,1,2,2] -> 19,25 -> Descartado
  { evaluator: "Sindy", candidate_id: "demo-descartado", p1: 1, p2: 2, p3: 1, p4: 2, p5: 2 },
  { evaluator: "Cecilia", candidate_id: "demo-descartado", p1: 2, p2: 2, p3: 1, p4: 2, p5: 1 },
  { evaluator: "Silvana", candidate_id: "demo-descartado", p1: 1, p2: 2, p3: 2, p4: 2, p5: 2 },
  { evaluator: "Dahiana", candidate_id: "demo-descartado", p1: 2, p2: 2, p3: 1, p4: 2, p5: 2 },

  // Ejemplo Veto: Sindy[3,3,3,3,3] Cecilia[3,3,3,3,3] Silvana[3,1,3,3,3] -> promedio 31 pero Veto Automático (Silvana puso 1 en Contingencias)
  { evaluator: "Sindy", candidate_id: "demo-veto", p1: 3, p2: 3, p3: 3, p4: 3, p5: 3 },
  { evaluator: "Cecilia", candidate_id: "demo-veto", p1: 3, p2: 3, p3: 3, p4: 3, p5: 3 },
  {
    evaluator: "Silvana",
    candidate_id: "demo-veto",
    p1: 3,
    p2: 1,
    p3: 3,
    p4: 3,
    p5: 3,
    comment: "Puntaje 1 en contingencias ante queja de cliente.",
  },

  // Ejemplo Pendiente: Sindy[3,2,3,2,2] Cecilia[2,2,3,2,3] -> 25,5, "2 de 4", faltan Silvana y Dahiana
  { evaluator: "Sindy", candidate_id: "demo-pendiente", p1: 3, p2: 2, p3: 3, p4: 2, p5: 2 },
  { evaluator: "Cecilia", candidate_id: "demo-pendiente", p1: 2, p2: 2, p3: 3, p4: 2, p5: 3 },
];

export const PRACTICE_CANDIDATE: Candidate = {
  id: "candidato-practica",
  name: "Candidato de Prueba (Práctica)",
  shift: "Mañana",
  start: "08:00",
  end: "08:30",
};
