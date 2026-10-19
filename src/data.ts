import type { Candidate, Evaluator, Question } from "./types";

export const EVALUATORS: Evaluator[] = ["Cecilia", "Dahiana", "Silvana", "Sindy"];

export const CANDIDATES: Candidate[] = [
  { id: "cerioli", name: "Cerioli, Javier", shift: "Mañana", start: "08:30", end: "09:10" },
  {
    id: "martinez",
    name: "Martinez, Gustavo Adrian",
    shift: "Mañana",
    start: "09:10",
    end: "09:50",
  },
  { id: "arrua", name: "Arrua, Danila Noemi", shift: "Mañana", start: "09:50", end: "10:30" },
  { id: "oliveira", name: "Oliveira, Juan Pablo", shift: "Mañana", start: "10:30", end: "11:10" },
  { id: "grecco", name: "Grecco, Marcelo Javier", shift: "Mañana", start: "11:10", end: "11:50" },
  {
    id: "ferreyra",
    name: "Ferreyra Márquez, Alejandro",
    shift: "Tarde",
    start: "14:30",
    end: "15:10",
  },
  {
    id: "malaquias",
    name: "Malaquias, Victor Fabian",
    shift: "Tarde",
    start: "15:10",
    end: "15:40",
  },
  { id: "roa", name: "Roa, Alexis", shift: "Tarde", start: "15:40", end: "16:20" },
];

export const QUESTIONS: Question[] = [
  {
    key: "p1",
    title: "Manejo de personal",
    weight: 2,
    prompt:
      "Contame una situación concreta donde un colaborador no cumplía con los estándares o tenía mala actitud frente al cliente. ¿Cómo lo abordaste y qué resultado tuviste?",
    expected:
      "Abordaje en privado con empatía y firmeza; corrección constructiva del error y refuerzo del impacto en el cliente.",
    guide: {
      1: 'Vago, punitivo ("lo mando a echar") o evasivo.',
      2: "Corrige en privado, marca el error claro y explica el estándar.",
      3: "Privado, con empatía y firmeza; hace seguimiento y refuerza el impacto en el cliente.",
    },
  },
  {
    key: "p2",
    title: "Contingencias",
    weight: 3,
    prompt:
      "Sábado a la tarde, local lleno, se rompe una máquina clave y un cliente se queja a los gritos. Cecilia no atiende. ¿Qué hacés paso a paso?",
    expected:
      "Serenidad absoluta: contención y calma al cliente primero, reorganización del equipo en salón y búsqueda de solución técnica.",
    guide: {
      1: "Se desespera, insiste en llamar a Cecilia, descuida al cliente o responde agresivo.",
      2: "Calma al cliente, ofrece alternativa, reorganiza al equipo y busca solución técnica.",
      3: "Serenidad total, contiene al cliente, protege el salón, da directivas claras y documenta.",
    },
  },
  {
    key: "p3",
    title: "Protocolos y calidad",
    weight: 2,
    prompt:
      "¿Cómo hacés para que el personal cumpla los checklists de limpieza, presentación y hospitalidad sin perseguirlos como un policía?",
    expected:
      "Construcción de hábitos con rutinas claras, controles con método, ejemplo propio y reconocimiento al equipo.",
    guide: {
      1: "Control punitivo o sin método.",
      2: "Rutinas claras, controles y ejemplo propio.",
      3: "Forma al equipo, genera hábito y compromiso; controla con método y reconoce.",
    },
  },
  {
    key: "p4",
    title: "Delimitación de responsabilidad",
    weight: 3,
    prompt: "¿Qué decisiones tomarías solo y cuáles escalarías a la dueña?",
    expected:
      "Criterio autónomo para resolver lo operativo de inmediato y reportar o escalar ordenadamente lo estratégico.",
    guide: {
      1: "Escala todo o se excede en atribuciones.",
      2: "Distingue lo operativo de lo estratégico.",
      3: "Criterio claro, resuelve lo operativo y reporta ordenadamente.",
    },
  },
  {
    key: "p5",
    title: "Compatibilidad y motivación",
    weight: 1,
    prompt:
      "¿Por qué querés trabajar en Doré? Disponibilidad rotativa, fines de semana y movilidad.",
    expected:
      "Alta afinidad y entusiasmo por la marca Doré, y disponibilidad horaria total (rotativa y fines de semana).",
    guide: {
      1: "Sin motivación clara o disponibilidad incompatible.",
      2: "Motivado y disponible.",
      3: "Alta afinidad con la marca y disponibilidad total.",
    },
  },
];

export const MAX_SCORE = QUESTIONS.reduce((s, q) => s + q.weight * 3, 0);
