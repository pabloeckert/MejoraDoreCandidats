import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Evaluation } from "./types";

const PENDING_KEY = "dore-pending-evals";

interface State {
  evaluations: Evaluation[];
  loaded: boolean;
  load: () => Promise<void>;
  upsertLocal: (e: Evaluation) => void;
  removeLocal: (evaluator: string, candidate_id: string) => void;
  submit: (e: Evaluation) => Promise<"saved" | "queued">;
  flushPending: () => Promise<void>;
  resetAll: () => void;
}

const key = (e: Evaluation) => `${e.evaluator}|${e.candidate_id}`;

function readPending(): Evaluation[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  } catch {
    return [];
  }
}
function writePending(list: Evaluation[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

async function save(e: Evaluation) {
  const { error } = await supabase.from("evaluations").upsert(
    {
      evaluator: e.evaluator,
      candidate_id: e.candidate_id,
      p1: e.p1,
      p2: e.p2,
      p3: e.p3,
      p4: e.p4,
      p5: e.p5,
      comment: e.comment ? e.comment.trim() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "evaluator,candidate_id" },
  );
  if (error) {
    console.error("Error al guardar evaluación en Supabase:", error);
    throw error;
  }
}

export const useEvalStore = create<State>((set, get) => ({
  evaluations: [],
  loaded: false,
  load: async () => {
    try {
      const { data, error } = await supabase.from("evaluations").select("*");
      if (error) throw error;
      if (data) {
        const serverEvals = data as Evaluation[];
        const pending = readPending();
        const pendingKeys = new Set(pending.map(key));
        const merged = [...serverEvals.filter((x) => !pendingKeys.has(key(x))), ...pending];
        set({ evaluations: merged, loaded: true });
      }
    } catch (err) {
      console.error("Error al cargar evaluaciones:", err);
      // Fallback a pendientes locales
      const pending = readPending();
      if (pending.length > 0) {
        set({ evaluations: pending, loaded: true });
      }
    }
  },
  upsertLocal: (e) =>
    set((s) => ({ evaluations: [...s.evaluations.filter((x) => key(x) !== key(e)), e] })),
  removeLocal: (evaluator, candidate_id) =>
    set((s) => ({
      evaluations: s.evaluations.filter(
        (x) => !(x.evaluator === evaluator && x.candidate_id === candidate_id),
      ),
    })),
  submit: async (e) => {
    get().upsertLocal(e);
    try {
      await save(e);
      // Limpiar de pendientes si estaba
      writePending(readPending().filter((x) => key(x) !== key(e)));
      return "saved";
    } catch {
      writePending([...readPending().filter((x) => key(x) !== key(e)), e]);
      return "queued";
    }
  },
  flushPending: async () => {
    const pending = readPending();
    if (!pending.length) return;
    const left: Evaluation[] = [];
    for (const e of pending) {
      try {
        await save(e);
      } catch {
        left.push(e);
      }
    }
    writePending(left);
  },
  resetAll: () => {
    localStorage.removeItem(PENDING_KEY);
    set({ evaluations: [] });
  },
}));
