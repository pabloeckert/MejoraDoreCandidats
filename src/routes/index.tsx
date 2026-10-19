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
      { title: "Doré · Evaluación de candidatos" },
      {
        name: "description",
        content:
          "Herramienta interna de Doré Panadería y Cafetería para evaluar candidatos a supervisor en tiempo real.",
      },
      { property: "og:title", content: "Doré · Evaluación de candidatos" },
      {
        property: "og:description",
        content: "Carga de evaluaciones y tablero consolidado de candidatos en tiempo real.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [view, setView] = useState<"form" | "board">("form");
  const { load, upsertLocal, removeLocal, flushPending } = useEvalStore();

  useEffect(() => {
    flushPending().then(load);
    const onOnline = () => flushPending().then(load);
    window.addEventListener("online", onOnline);

    const channel = supabase
      .channel("evaluations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "evaluations" }, (p) => {
        const oldRec = p.old as Record<string, unknown> | null;
        const newRec = p.new as Record<string, unknown> | null;
        if (p.eventType === "DELETE") {
          if (
            oldRec &&
            typeof oldRec["evaluator"] === "string" &&
            typeof oldRec["candidate_id"] === "string"
          ) {
            removeLocal(oldRec["evaluator"], oldRec["candidate_id"]);
          }
        } else if (
          newRec &&
          typeof newRec["evaluator"] === "string" &&
          typeof newRec["candidate_id"] === "string"
        ) {
          upsertLocal(newRec as unknown as Evaluation);
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", onOnline);
      supabase.removeChannel(channel);
    };
  }, [load, upsertLocal, removeLocal, flushPending]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b-4 border-primary bg-white/95 backdrop-blur shadow-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="font-display text-2xl font-bold leading-none text-foreground tracking-tight">
              Doré
            </h1>
            <p className="text-xs text-muted-foreground">
              Panadería y Cafetería · Evaluación de Candidatos
            </p>
          </div>
          <nav className="flex rounded-xl bg-secondary p-1 text-sm font-medium">
            {(
              [
                ["form", "Cargar Evaluación"],
                ["board", "Tablero Consolidado"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setView(k)}
                className={cn(
                  "rounded-lg px-3.5 py-2 font-medium transition-colors cursor-pointer",
                  view === k
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
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
