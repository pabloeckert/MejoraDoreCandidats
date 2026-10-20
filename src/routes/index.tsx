import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HelpCircle, LogOut, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EvaluationForm } from "@/components/EvaluationForm";
import { Dashboard } from "@/components/Dashboard";
import { LoginScreen } from "@/components/LoginScreen";
import { TutorialGuide } from "@/components/TutorialGuide";
import { AdminModal } from "@/components/AdminModal";
import {
  getStoredSession,
  clearStoredSession,
  markTutorialSeen,
  type UserSession,
} from "@/lib/auth";
import { useEvalStore } from "@/store";
import type { Evaluation } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Evaluación de Candidatos · Mejora Continua" },
      {
        name: "description",
        content:
          "Herramienta interna de Mejora Continua para evaluar candidatos a supervisor de Doré Panadería y Cafetería en tiempo real.",
      },
      { property: "og:title", content: "Evaluación de Candidatos · Mejora Continua" },
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
  const [session, setSession] = useState<UserSession | null>(getStoredSession);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const { load, upsertLocal, removeLocal, flushPending } = useEvalStore();

  // Check tutorial on initial load
  useEffect(() => {
    const saved = getStoredSession();
    if (saved) {
      setSession(saved);
      if (!saved.tutorial_visto) {
        setShowTutorial(true);
      }
    }
  }, []);

  // Sync Supabase Realtime & Offline Queue
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

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    if (!newSession.tutorial_visto) {
      setShowTutorial(true);
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
  };

  const handleCloseTutorial = async () => {
    if (session) {
      await markTutorialSeen(session.id);
      setSession({ ...session, tutorial_visto: true });
    }
    setShowTutorial(false);
  };

  // If not logged in, render the Login / Alta screen
  if (!session) {
    return <LoginScreen onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Mejora Continua branding and Doré subtle chip */}
      <header className="sticky top-0 z-20 border-b-2 border-gray-200 bg-white/95 backdrop-blur shadow-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <div className="relative select-none" title="Mejora Continua">
              <img
                src="/brand/mc-isotipo.png"
                alt="Mejora Continua"
                className="h-10 w-10 object-contain drop-shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-bold leading-none text-[#1A3D84] tracking-tight">
                  Mejora Continua
                </h1>
                {/* Chip Doré */}
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#83A686]/40 bg-[#83A686]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#3B5B3E]">
                  <img
                    src="/brand/dore-logo.png"
                    alt="Doré"
                    className="h-3 w-auto object-contain rounded-xs"
                  />
                  <span>Evaluación para Doré</span>
                </div>
              </div>
              <p className="text-[11px] font-medium text-[#6B7280]">
                Candidatos a Supervisor · En Vivo
              </p>
            </div>
          </div>

          {/* Navigation & User Actions Right */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Exclusive "Informe" button for Sindy */}
            {session.nombre?.trim().toLowerCase() === "sindy" && (
              <button
                type="button"
                onClick={() => setShowAdminModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A3D84] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#15326c] transition cursor-pointer"
              >
                <BarChart3 className="size-3.5" />
                <span>Informe</span>
              </button>
            )}

            {/* Tutorial Button */}
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#1A3D84] hover:text-[#1A3D84] transition cursor-pointer"
            >
              <HelpCircle className="size-3.5 text-[#1A3D84]" />
              <span className="hidden sm:inline">Ver tutorial</span>
            </button>

            {/* Navigation Tabs */}
            <nav className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
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
                    "rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer",
                    view === k
                      ? "bg-[#1A3D84] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  {l}
                </button>
              ))}
            </nav>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              title={`Salir (${session.nombre})`}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-[#E1061E] transition cursor-pointer"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main View Content */}
      <main>
        {view === "form" ? (
          <EvaluationForm evaluatorName={session.nombre} onLogout={handleLogout} />
        ) : (
          <Dashboard />
        )}
      </main>

      {/* Guided Tutorial Overlay */}
      <TutorialGuide
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        evaluatorName={session.nombre}
      />

      {/* Hidden Admin Modal Overlay */}
      <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
    </div>
  );
}
