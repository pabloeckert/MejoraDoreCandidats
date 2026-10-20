import { useState, useMemo } from "react";
import {
  X,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Users,
  Activity,
  BarChart3,
  Clock,
  Download,
  Trash2,
  AlertOctagon,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from "recharts";
import { getAllUsers, getActivityEvents, type UserRecord } from "@/lib/auth";
import { CANDIDATES, EVALUATORS, QUESTIONS } from "@/data";
import { computeAll, computeResult } from "@/utils/scoring";
import { useEvalStore } from "@/store";
import { supabase } from "@/integrations/supabase/client";
import { generateEvaluationsBackupExcel } from "@/utils/excelExport";
import {
  exportConsolidadoPdf,
  exportFichaCandidatosPdf,
  exportAuditoriaPdf,
} from "@/utils/pdfExport";
import { DEMO_CANDIDATES, DEMO_EVALUATIONS } from "@/data.demo";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: string;
}

export function AdminModal({ isOpen, onClose, currentUser }: AdminModalProps) {
  const [activeTab, setActiveTab] = useState<"usuarios" | "actividad" | "graficas" | "reportes">(
    "graficas",
  );
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isSindy = currentUser?.trim().toLowerCase() === "sindy";
  const { evaluations, resetAll } = useEvalStore();

  // Read all users from client storage
  const usersRecord = useMemo(() => {
    return getAllUsers();
  }, []);

  const usersList: UserRecord[] = useMemo(() => {
    return Object.values(usersRecord);
  }, [usersRecord]);

  // Compute evaluations data (using real or fallback to demo if 0 real)
  const isDemo = evaluations.length === 0;
  const candidateResults = useMemo(() => {
    if (isDemo) {
      return DEMO_CANDIDATES.map((c) => computeResult(c, DEMO_EVALUATIONS));
    }
    return computeAll(evaluations);
  }, [evaluations, isDemo]);

  const currentEvals = isDemo ? DEMO_EVALUATIONS : evaluations;

  // Calculate statistics & discrepancy alerts
  const stats = useMemo(() => {
    const totalExpected = (isDemo ? DEMO_CANDIDATES.length : CANDIDATES.length) * 4;
    const completedCandidates = candidateResults.filter((r) => r.count === 4).length;
    const progressPercent = Math.round((currentEvals.length / totalExpected) * 100);

    // High discrepancy alerts (gap >= 6 points between evaluators on same candidate)
    const discrepancyAlerts: {
      candidateName: string;
      maxEvaluator: string;
      maxScore: number;
      minEvaluator: string;
      minScore: number;
      gap: number;
    }[] = [];

    candidateResults.forEach((r) => {
      if (r.evaluations.length >= 2) {
        const evScores = r.evaluations.map((e) => ({
          evaluator: e.evaluator,
          score: QUESTIONS.reduce((sum, q) => sum + e[q.key] * q.weight, 0),
        }));

        evScores.sort((a, b) => b.score - a.score);
        const max = evScores[0];
        const min = evScores[evScores.length - 1];

        if (max === undefined || min === undefined) return;

        const gap = max.score - min.score;

        if (gap >= 6) {
          discrepancyAlerts.push({
            candidateName: r.candidate.name,
            maxEvaluator: max.evaluator,
            maxScore: max.score,
            minEvaluator: min.evaluator,
            minScore: min.score,
            gap,
          });
        }
      }
    });

    return {
      totalExpected,
      currentCount: currentEvals.length,
      progressPercent,
      completedCandidates,
      discrepancyAlerts,
    };
  }, [candidateResults, currentEvals, isDemo]);

  // Chart 1: Candidate Scores Data
  const chartCandidateScores = useMemo(() => {
    return candidateResults.map((r) => {
      let color = "#6B7280"; // Descartado
      if (r.status === "terna") color = "#83A686";
      else if (r.status === "reserva") color = "#F59E0B";
      else if (r.status === "veto") color = "#E1061E";

      return {
        name: r.candidate.name.split(",")[0],
        score: r.score ?? 0,
        status: r.status,
        color,
      };
    });
  }, [candidateResults]);

  // Chart 2: Question Distribution Data (1, 2, 3 per question)
  const chartQuestionDist = useMemo(() => {
    return QUESTIONS.map((q) => {
      let c1 = 0;
      let c2 = 0;
      let c3 = 0;

      currentEvals.forEach((e) => {
        const val = e[q.key];
        if (val === 1) c1++;
        else if (val === 2) c2++;
        else if (val === 3) c3++;
      });

      return {
        pregunta: q.key.toUpperCase(),
        title: q.title,
        "1 - Insuficiente": c1,
        "2 - Cumple": c2,
        "3 - Sobresaliente": c3,
      };
    });
  }, [currentEvals]);

  // Chart 3: Evaluator Severity / Average Score
  const chartEvaluatorAvg = useMemo(() => {
    const list = isDemo ? ["A", "B", "C", "D"] : EVALUATORS;
    return list.map((ev) => {
      const userEvals = currentEvals.filter((e) => e.evaluator === ev);
      if (userEvals.length === 0) {
        return { evaluator: ev, promedio: 0, total: 0 };
      }
      const sum = userEvals.reduce((acc, e) => {
        return acc + QUESTIONS.reduce((s, q) => s + e[q.key] * q.weight, 0);
      }, 0);
      return {
        evaluator: ev,
        promedio: Number((sum / userEvals.length).toFixed(1)),
        total: userEvals.length,
      };
    });
  }, [currentEvals, isDemo]);

  const handleExecuteReset = async () => {
    if (confirmInput.trim() !== "BORRAR") {
      toast.error("Debés escribir la palabra BORRAR para proceder.");
      return;
    }
    if (!confirmCheck) {
      toast.error("Marcá la casilla de confirmación para proceder.");
      return;
    }

    setIsResetting(true);
    try {
      // 1. Generar y descargar primero el archivo Excel de backup
      toast.info("Generando archivo Excel de respaldo...");
      await generateEvaluationsBackupExcel(evaluations);
      toast.success("✓ Backup Excel generado y descargado con éxito.");

      // 2. Inmediatamente después, borrado masivo en Supabase
      const { error } = await supabase
        .from("evaluations")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        console.error("Error al borrar en Supabase:", error);
        toast.error(`Error al borrar en la base de datos: ${error.message}`);
        return;
      }

      // 3. Vaciar el estado global en la interfaz
      resetAll();
      toast.success("✓ Base de datos reseteada. Todas las evaluaciones han sido eliminadas.");
      setShowConfirmReset(false);
    } catch (err) {
      console.error("Error durante el reseteo:", err);
      toast.error("Ocurrió un error al procesar el reseteo total.");
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#1A3D84]/10 text-[#1A3D84]">
              <Shield className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-[#1A3D84] tracking-tight">
                  Panel de Administrador
                </h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  100% In-Memory
                </span>
                {isDemo && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                    Modo Ejemplo
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280]">
                Mejora Continua ·{" "}
                <span className="font-medium text-gray-500">
                  Cliente: Doré Panadería y Cafetería
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSindy && (
              <button
                type="button"
                onClick={() => {
                  setConfirmInput("");
                  setConfirmCheck(false);
                  setShowConfirmReset(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E1061E] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#c7051a] transition cursor-pointer"
                title="Descargar backup Excel y resetear todas las evaluaciones"
              >
                <Trash2 className="size-3.5" />
                <span>Reseteo Total (Peligro)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Main Authenticated Admin Area */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          {/* Top Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50/50 px-6 pt-2">
            <nav className="flex space-x-1 sm:space-x-4">
              {(
                [
                  ["usuarios", "Evaluadoras", Users],
                  ["actividad", "Actividad y Discrepancias", Activity],
                  ["graficas", "Gráficas de Evaluación", BarChart3],
                  ["reportes", "Exportar Informes PDF", FileText],
                ] as const
              ).map(([tabKey, label, Icon]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                    activeTab === tabKey
                      ? "border-[#1A3D84] text-[#1A3D84]"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Panes */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* TAB 1: EVALUADORAS */}
            {activeTab === "usuarios" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A3D84]">
                      Evaluadoras Registradas
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Estado de actividad y avance de evaluaciones en tiempo real.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Evaluadora</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-center">Evaluaciones</th>
                        <th className="px-4 py-3">Tutorial</th>
                        <th className="px-4 py-3 text-right">Último Acceso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usersList.map((u) => {
                        const userEvals = currentEvals.filter((e) => e.evaluator === u.nombre);

                        return (
                          <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3 font-semibold text-[#2B2B2B]">{u.nombre}</td>

                            {/* Status Badge */}
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Activo (Acceso directo)
                              </span>
                            </td>

                            {/* Evaluaciones Count */}
                            <td className="px-4 py-3 text-center font-medium">
                              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                                {userEvals.length} / 8
                              </span>
                            </td>

                            {/* Tutorial visto */}
                            <td className="px-4 py-3">
                              {u.tutorial_visto ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                  <CheckCircle2 className="size-3.5" />
                                  <span>Visto</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Pendiente</span>
                              )}
                            </td>

                            {/* Last access */}
                            <td className="px-4 py-3 text-right text-gray-500">
                              {u.last_access
                                ? new Date(u.last_access).toLocaleTimeString("es-AR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ACTIVIDAD Y DISCREPANCIAS */}
            {activeTab === "actividad" && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      Progreso Global
                    </p>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-[#1A3D84]">
                        {stats.currentCount} / {stats.totalExpected}
                      </span>
                      <span className="text-xs font-bold text-[#1A3D84]">
                        {stats.progressPercent}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-[#1A3D84] transition-all"
                        style={{ width: `${stats.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      Candidatos Completos
                    </p>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-[#3B5B3E]">
                        {stats.completedCandidates} de 8
                      </span>
                      <span className="text-xs font-medium text-gray-500">(4 evaluadoras)</span>
                    </div>
                    <p className="mt-2 text-[11px] text-[#6B7280]">
                      Consolidación final lista para comité.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      Alertas de Discrepancia
                    </p>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-amber-600">
                        {stats.discrepancyAlerts.length}
                      </span>
                      <span className="text-xs font-medium text-amber-700">Brecha ≥ 6 pts</span>
                    </div>
                    <p className="mt-2 text-[11px] text-[#6B7280]">
                      Requieren debate en puesta en común.
                    </p>
                  </div>
                </div>

                {/* High Discrepancy Alerts List */}
                {stats.discrepancyAlerts.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
                      <AlertTriangle className="size-4 text-amber-600" />
                      <span>Alertas de Discrepancia Significativa detectadas</span>
                    </div>
                    <p className="text-xs text-amber-800 mb-3">
                      Los siguientes candidatos presentan una brecha mayor o igual a 6 puntos entre
                      evaluadoras:
                    </p>
                    <div className="space-y-2">
                      {stats.discrepancyAlerts.map((a, i) => (
                        <div
                          key={i}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-2.5 border border-amber-200/80 text-xs shadow-xs"
                        >
                          <span className="font-semibold text-gray-900">{a.candidateName}</span>
                          <span className="text-gray-600">
                            {a.maxEvaluator} otorgó{" "}
                            <strong className="text-emerald-700">{a.maxScore} pts</strong> vs{" "}
                            {a.minEvaluator} otorgó{" "}
                            <strong className="text-red-700">{a.minScore} pts</strong>
                          </span>
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                            Diferencia: {a.gap} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Event Log */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A3D84] mb-2">
                    Registro de Eventos y Auditoría Reciente
                  </h4>
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {getActivityEvents().length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500 italic">
                        Sin eventos registrados aún en esta sesión.
                      </div>
                    ) : (
                      getActivityEvents().map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-3 text-xs hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{ev.usuario}</span>
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600 uppercase">
                              {ev.tipo}
                            </span>
                            {ev.detalles && (
                              <span className="text-gray-500 italic">— {ev.detalles}</span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400">
                            {new Date(ev.creado_en).toLocaleTimeString("es-AR")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GRAFICAS VISUALES (RECHARTS) */}
            {activeTab === "graficas" && (
              <div className="space-y-6">
                {/* Chart 1: Candidate Scores */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A3D84] mb-1">
                    Puntaje Final por Candidato (Colores según Estado)
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Verde Salvia: Terna Final | Ámbar: Reserva | Gris: Descartado | Rojo: Veto
                  </p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartCandidateScores}
                        margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          angle={-20}
                          textAnchor="end"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis domain={[0, 33]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                          {chartCandidateScores.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Question Distribution */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A3D84] mb-1">
                    Distribución de Puntuaciones por Pregunta (P1 a P5)
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Frecuencia de 1 (Insuficiente), 2 (Cumple estándar) y 3 (Sobresaliente)
                  </p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartQuestionDist}
                        margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="pregunta" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="1 - Insuficiente" stackId="a" fill="#E1061E" />
                        <Bar dataKey="2 - Cumple" stackId="a" fill="#1A3D84" />
                        <Bar dataKey="3 - Sobresaliente" stackId="a" fill="#83A686" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Evaluator Average Score */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A3D84] mb-1">
                    Severidad Relativa: Puntaje Promedio Otorgado por Evaluadora
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Permite comparar la tendencia de calificación de cada evaluadora
                  </p>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartEvaluatorAvg}
                        margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="evaluator" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 33]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="promedio" fill="#1A3D84" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: EXPORTACION DE INFORMES PDF */}
            {activeTab === "reportes" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A3D84]">
                    Informes Formales en PDF
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Exportación directa de reportes consolidados y fichas individuales en formato
                    PDF para el comité de Doré.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Report 1: Consolidado */}
                  <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                    <div>
                      <div className="flex size-10 items-center justify-center rounded-lg bg-[#1A3D84]/10 text-[#1A3D84] mb-3">
                        <FileText className="size-5" />
                      </div>
                      <h4 className="font-bold text-sm text-[#1A3D84]">
                        Informe Consolidado General
                      </h4>
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                        Tabla general con todos los candidatos clasificados (Terna Final, Reserva,
                        Descartado, Veto) y desglose de evaluadoras.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        exportConsolidadoPdf(
                          candidateResults,
                          isDemo ? ["A", "B", "C", "D"] : EVALUATORS,
                        )
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A3D84] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#15326c] transition cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>Descargar Consolidado (PDF)</span>
                    </button>
                  </div>

                  {/* Report 2: Fichas individuales */}
                  <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                    <div>
                      <div className="flex size-10 items-center justify-center rounded-lg bg-[#83A686]/10 text-[#2F4F32] mb-3">
                        <FileText className="size-5" />
                      </div>
                      <h4 className="font-bold text-sm text-[#2F4F32]">Fichas por Candidato</h4>
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                        Dossier individual candidato por candidato con puntuación P1 a P5 de cada
                        evaluadora y comentarios cualitativos.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => exportFichaCandidatosPdf(candidateResults)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#83A686] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#6c8e6f] transition cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>Descargar Fichas (PDF)</span>
                    </button>
                  </div>

                  {/* Report 3: Auditoria */}
                  <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                    <div>
                      <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 mb-3">
                        <Clock className="size-5" />
                      </div>
                      <h4 className="font-bold text-sm text-gray-800">
                        Reporte de Auditoría y Tiempos
                      </h4>
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                        Estado de evaluadoras, estado de PINs asignados y registro cronológico de
                        eventos para trazabilidad.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => exportAuditoriaPdf(usersList, getActivityEvents())}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition cursor-pointer"
                    >
                      <Download className="size-3.5" />
                      <span>Descargar Auditoría (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* Danger Zone: Reseteo Total exclusivo para Sindy */}
                {isSindy && (
                  <div className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50/60 p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E1061E]/10 text-[#E1061E]">
                          <AlertOctagon className="size-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#E1061E] uppercase tracking-wider">
                            Zona de Peligro · Reseteo Total de Evaluaciones
                          </h4>
                          <p className="mt-1 text-xs text-gray-600 leading-relaxed max-w-xl">
                            Genera y descarga automáticamente un{" "}
                            <strong>archivo Excel (.xlsx)</strong> con el respaldo completo de todas
                            las evaluaciones, y luego vacía la base de datos de Supabase para
                            iniciar un nuevo proceso.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmInput("");
                          setConfirmCheck(false);
                          setShowConfirmReset(true);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-[#E1061E] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#c7051a] transition cursor-pointer shrink-0"
                      >
                        <Trash2 className="size-4" />
                        <span>Reseteo Total (Peligro)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Doble Confirmación Estricta */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border-2 border-red-300 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#E1061E]">
                <AlertOctagon className="size-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#E1061E] leading-tight">
                  Confirmación de Reseteo Total
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Esta acción es destructiva e irreversible.
                </p>
              </div>
            </div>

            {/* Warning steps */}
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-950 space-y-2">
              <p className="font-semibold text-red-900">
                El sistema ejecutará automáticamente la siguiente secuencia:
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-red-800">
                <li>
                  <strong>Backup Excel (.xlsx):</strong> Descargará el libro con la hoja{" "}
                  <em>Dashboard</em> (resumen) y la hoja <em>Datos Crudos</em> (todas las
                  evaluaciones).
                </li>
                <li>
                  <strong>Borrado Definitivo:</strong> Eliminará todas las filas de la tabla{" "}
                  <code className="font-mono bg-red-100 px-1 py-0.5 rounded">evaluations</code> en
                  Supabase y vaciará el estado de la interfaz.
                </li>
              </ol>
            </div>

            {/* Checkbox confirmation */}
            <label
              htmlFor="reset-check"
              className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 cursor-pointer hover:bg-gray-100/70 transition-colors select-none"
            >
              <input
                id="reset-check"
                type="checkbox"
                checked={confirmCheck}
                onChange={(e) => setConfirmCheck(e.target.checked)}
                className="mt-0.5 size-4 accent-[#E1061E] cursor-pointer"
              />
              <span className="leading-tight">
                Confirmo que deseo descargar el backup en Excel y{" "}
                <strong>borrar todas las evaluaciones</strong> de la base de datos.
              </span>
            </label>

            {/* Security Word Challenge */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-word-input"
                className="block text-xs font-bold uppercase tracking-wider text-gray-700 text-center"
              >
                Escribí <span className="text-[#E1061E]">BORRAR</span> para habilitar:
              </label>
              <input
                id="confirm-word-input"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
                placeholder="BORRAR"
                autoFocus
                disabled={isResetting}
                className="w-full text-center font-mono text-base font-extrabold tracking-widest text-[#E1061E] placeholder:text-gray-300 rounded-xl border-2 border-red-300 bg-white py-2.5 px-3 focus:border-[#E1061E] focus:outline-none focus:ring-2 focus:ring-[#E1061E]/20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                disabled={isResetting}
                className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={confirmInput.trim() !== "BORRAR" || !confirmCheck || isResetting}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#E1061E] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#c7051a] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Descargar y Borrar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
