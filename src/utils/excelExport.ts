import ExcelJS from "exceljs";
import fileSaver from "file-saver";
import { CANDIDATES } from "@/data";
import { computeAll, STATUS_LABEL } from "./scoring";
import type { Evaluation } from "@/types";

const saveAs = fileSaver.saveAs || fileSaver;

export async function generateEvaluationsBackupExcel(evaluations: Evaluation[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Mejora Continua";
  workbook.created = new Date();

  const results = computeAll(evaluations);
  const totalCandidates = CANDIDATES.length;

  const ternaCount = results.filter((r) => r.status === "terna").length;
  const reservaCount = results.filter((r) => r.status === "reserva").length;
  const descartadoCount = results.filter((r) => r.status === "descartado").length;
  const vetoCount = results.filter((r) => r.status === "veto").length;
  const totalEvaluationsCount = evaluations.length;

  // ----------------------------------------------------
  // HOJA 1: Dashboard
  // ----------------------------------------------------
  const sheetDashboard = workbook.addWorksheet("Dashboard", {
    views: [{ showGridLines: true }],
  });

  // Título Principal Banner A1:E2
  sheetDashboard.mergeCells("A1:E2");
  const titleCell = sheetDashboard.getCell("A1");
  titleCell.value = "MEJORA CONTINUA - BACKUP DE EVALUACIONES";
  titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1A3D84" }, // Azul Mejora Continua
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  // Metadatos
  const dateFormatted = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  sheetDashboard.getCell("A4").value = "Fecha de Backup:";
  sheetDashboard.getCell("A4").font = { bold: true, color: { argb: "FF1A3D84" } };
  sheetDashboard.getCell("B4").value = dateFormatted;

  sheetDashboard.getCell("A5").value = "Cliente:";
  sheetDashboard.getCell("A5").font = { bold: true, color: { argb: "FF1A3D84" } };
  sheetDashboard.getCell("B5").value = "Doré Panadería y Cafetería";

  sheetDashboard.getCell("D4").value = "Total Evaluaciones:";
  sheetDashboard.getCell("D4").font = { bold: true, color: { argb: "FF1A3D84" } };
  sheetDashboard.getCell("E4").value = `${totalEvaluationsCount} cargadas`;

  sheetDashboard.getCell("D5").value = "Garante Metodológico:";
  sheetDashboard.getCell("D5").font = { bold: true, color: { argb: "FF1A3D84" } };
  sheetDashboard.getCell("E5").value = "Mejora Continua";

  // Tabla Resumen de Estados (Fila 7)
  const summaryHeaderRow = sheetDashboard.getRow(7);
  summaryHeaderRow.values = ["Estado", "Candidatos", "Porcentaje", "Criterio / Descripción"];
  summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  summaryHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A3D84" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const summaryData = [
    [
      "Terna Final",
      ternaCount,
      `${Math.round((ternaCount / totalCandidates) * 100)}%`,
      "Puntaje ≥ 26 puntos sin veto",
    ],
    [
      "En Reserva",
      reservaCount,
      `${Math.round((reservaCount / totalCandidates) * 100)}%`,
      "Puntaje entre 20 y 25 puntos sin veto",
    ],
    [
      "Descartado",
      descartadoCount,
      `${Math.round((descartadoCount / totalCandidates) * 100)}%`,
      "Puntaje < 20 puntos",
    ],
    [
      "Veto Técnico",
      vetoCount,
      `${Math.round((vetoCount / totalCandidates) * 100)}%`,
      "Puntaje 1 en pregunta crítica P2 (Contingencias) o P4 (Delimitación)",
    ],
    ["Total Candidatos", totalCandidates, "100%", "8 postulantes evaluados"],
  ];

  summaryData.forEach((row, i) => {
    const r = sheetDashboard.getRow(8 + i);
    r.values = row;
    r.font = { size: 10, bold: i === summaryData.length - 1 };
    r.getCell(2).alignment = { horizontal: "center" };
    r.getCell(3).alignment = { horizontal: "center" };
    if (i === summaryData.length - 1) {
      r.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "double", color: { argb: "FF1A3D84" } },
        };
      });
    }
  });

  // Tabla Resumen por Candidato (Fila 15)
  const candHeaderRow = sheetDashboard.getRow(15);
  candHeaderRow.values = [
    "Candidato",
    "Turno",
    "Horario",
    "Evaluaciones",
    "Puntaje Promedio",
    "Estado Consolidado",
  ];
  candHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  candHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A3D84" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  results.forEach((res, i) => {
    const r = sheetDashboard.getRow(16 + i);
    r.values = [
      res.candidate.name,
      res.candidate.shift,
      `${res.candidate.start} a ${res.candidate.end}`,
      `${res.count} de 4`,
      res.score !== null ? res.score.toFixed(1) : "—",
      STATUS_LABEL[res.status],
    ];
    r.font = { size: 10 };
    r.getCell(4).alignment = { horizontal: "center" };
    r.getCell(5).alignment = { horizontal: "center" };
    r.getCell(6).alignment = { horizontal: "center" };
  });

  sheetDashboard.columns = [
    { width: 28 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 45 },
    { width: 22 },
  ];

  // ----------------------------------------------------
  // HOJA 2: Datos Crudos
  // ----------------------------------------------------
  const sheetRaw = workbook.addWorksheet("Datos Crudos", {
    views: [{ showGridLines: true }],
  });

  const rawHeaders = [
    "Fecha y Hora",
    "Evaluadora",
    "Candidato",
    "P1 (x1)",
    "P2 (x3)",
    "P3 (x2)",
    "P4 (x3)",
    "P5 (x2)",
    "Total (máx 33)",
    "Estado",
    "Observaciones / Justificación",
  ];

  const rawHeaderRow = sheetRaw.getRow(1);
  rawHeaderRow.values = rawHeaders;
  rawHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  rawHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A3D84" }, // Azul Mejora Continua
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  evaluations.forEach((e, idx) => {
    const cand = CANDIDATES.find((c) => c.id === e.candidate_id);
    const candName = cand ? cand.name : e.candidate_id;
    const candResult = results.find((r) => r.candidate.id === e.candidate_id);
    const candStatus = candResult ? STATUS_LABEL[candResult.status] : "—";
    const totalWeighted = e.p1 * 1 + e.p2 * 3 + e.p3 * 2 + e.p4 * 3 + e.p5 * 2;

    const row = sheetRaw.getRow(2 + idx);
    row.values = [
      e.created_at ? new Date(e.created_at).toLocaleString("es-AR") : "—",
      e.evaluator,
      candName,
      e.p1,
      e.p2,
      e.p3,
      e.p4,
      e.p5,
      totalWeighted,
      candStatus,
      e.comment || "",
    ];
    row.font = { size: 9 };
    for (let c = 4; c <= 9; c++) {
      row.getCell(c).alignment = { horizontal: "center" };
    }
  });

  sheetRaw.columns = [
    { width: 20 },
    { width: 14 },
    { width: 26 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 14 },
    { width: 16 },
    { width: 45 },
  ];

  // Escribir archivo y disparar descarga
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const fileName = `mejora-continua-backup-evaluaciones-${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);
}
