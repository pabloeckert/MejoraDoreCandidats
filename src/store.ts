import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Evaluation } from "./types";

const PENDING_KEY = "dore-pending-evals";

interface State {
  evaluations: Evaluation[];
  loaded: boolean;
  load: () => Promise<void>;
  upsertLocal: (e: Evaluation) => void;
  submit: (e: Evaluation) => Promise<"saved" | "queued">;
  flushPending: () => Promise<void>;
}

const key = (e: Evaluation) => `${e.evaluator}|${e.candidate_id}`;

function readPending(): Evaluation[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch { return []; }
}
function writePending(list: Evaluation[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

async function save(e: Evaluation) {
  const { error } = await supabase.from("evaluations").upsert(
    { ...e, comment: e.comment || null, updated_at: new Date().toISOString() },
    { onConflict: "evaluator,candidate_id" },
  );
  if (error) throw error;
}

export const useEvalStore = create<State>((set, get) => ({
  evaluations: [],
  loaded: false,
  load: async () => {
    const { data, error } = await supabase.from("evaluations").select("*");
    if (!error && data) set({ evaluations: data as Evaluation[], loaded: true });
  },
  upsertLocal: (e) =>
    set((s) => ({ evaluations: [...s.evaluations.filter((x) => key(x) !== key(e)), e] })),
  submit: async (e) => {
    get().upsertLocal(e);
    try {
      await save(e);
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
      try { await save(e); } catch { left.push(e); }
    }
    writePending(left);
  },
}));
