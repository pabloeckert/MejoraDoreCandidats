import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EvaluationForm } from "@/components/EvaluationForm";
import { Dashboard } from "@/components/Dashboard";
import { useEvalStore } from "@/store";
import type { Evaluation } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Doré · Evaluación de Supervisores" },
      { name: "description", content: "Herramienta interna de Doré Panadería y Cafetería para puntuar entrevistas a supervisor en tiempo real." },
      { property: "og:title", content: "Doré · Evaluación de Supervisores" },
      { property: "og:description", content: "Carga de evaluaciones y tablero consolidado de candidatos." },
    ],
  }),
  component: Index,
});

const PIN = "2110";
const PIN_KEY = "dore-pin-ok";

function Index() {
  const [view, setView] = useState<"form" | "board">("form");
  const [ok, setOk] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const { load, upsertLocal, flushPending } = useEvalStore();

  useEffect(() => setOk(localStorage.getItem(PIN_KEY) === "1"), []);

  useEffect(() => {
    if (!ok) return;
    flushPending().then(load);
    const onOnline = () => flushPending().then(load);
    window.addEventListener("online", onOnline);
    const channel = supabase
      .channel("evaluations")
      .on("postgres_changes", { event: "*", schema: "public", table: "evaluations" }, (p) => {
        if (p.new && "evaluator" in p.new) upsertLocal(p.new as Evaluation);
      })
      .subscribe();
    return () => {
      window.removeEventListener("online", onOnline);
      supabase.removeChannel(channel);
    };
  }, [ok, load, upsertLocal, flushPending]);

  if (ok === null) return null;

  if (!ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <h1 className="font-display text-4xl">Doré</h1>
        <form
          className="w-full max-w-xs space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === PIN) { localStorage.setItem(PIN_KEY, "1"); setOk(true); }
            else setPin("");
          }}
        >
          <input className="field text-center text-2xl tracking-widest" inputMode="numeric" placeholder="PIN del equipo" value={pin} onChange={(e) => setPin(e.target.value)} />
          <button className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground">Ingresar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b-4 border-primary bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="font-display text-2xl leading-none">Doré</h1>
            <p className="text-xs text-muted-foreground">Panadería y Cafetería · Entrevistas Supervisor</p>
          </div>
          <nav className="flex rounded-lg bg-secondary p-1 text-sm">
            {([["form", "Cargar Evaluación"], ["board", "Tablero Consolidado"]] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={cn("rounded-md px-3 py-2 font-medium transition-colors", view === k ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
              >
                {l}
              </button>
            ))}
          </nav>
        </div>
      </header>
      {view === "form" ? <EvaluationForm /> : <Dashboard />}
    </div>
  );
}
