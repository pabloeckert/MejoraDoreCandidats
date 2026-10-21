import { useState } from "react";
import { AlertOctagon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEvalStore } from "@/store";
import { generateEvaluationsBackupExcel } from "@/utils/excelExport";

interface ResetConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetConfirmDialog({ isOpen, onClose }: ResetConfirmDialogProps) {
  const { evaluations, resetAll } = useEvalStore();
  const [confirmInput, setConfirmInput] = useState("");
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isResetting) return;
    setConfirmInput("");
    setConfirmCheck(false);
    onClose();
  };

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
      handleClose();
    } catch (err) {
      console.error("Error durante el reseteo:", err);
      toast.error("Ocurrió un error al procesar el reseteo total.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-red-300 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#E1061E]">
            <AlertOctagon className="size-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#E1061E] leading-tight">
              Confirmación de Reseteo Total (Peligro)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Esta acción es destructiva e irreversible. Exclusiva para Sindy.
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
              <em>Dashboard</em> (resumen) y la hoja <em>Datos Crudos</em> (todas las evaluaciones).
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
          htmlFor="reset-check-dialog"
          className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 cursor-pointer hover:bg-gray-100/70 transition-colors select-none"
        >
          <input
            id="reset-check-dialog"
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
            htmlFor="confirm-word-dialog"
            className="block text-xs font-bold uppercase tracking-wider text-gray-700 text-center"
          >
            Escribí <span className="text-[#E1061E]">BORRAR</span> para habilitar:
          </label>
          <input
            id="confirm-word-dialog"
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
            onClick={handleClose}
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
  );
}
