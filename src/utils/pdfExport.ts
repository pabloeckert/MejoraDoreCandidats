import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CandidateResult } from "@/types";
import type { UserRecord, ActivityEvent } from "@/lib/auth";
import { QUESTIONS } from "@/data";
import { STATUS_LABEL } from "@/utils/scoring";

const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1).replace(".", ","));

export function exportConsolidadoPdf(results: CandidateResult[], evaluatorsList: string[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateFormatted = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  // Top Accent Bars (Mejora Continua: Azul #1A3D84, Rojo #E1061E, Amarillo #F7CC13)
  doc.setFillColor(26, 61, 132); // #1A3D84
  doc.rect(0, 0, pageWidth, 4, "F");
  doc.setFillColor(247, 204, 19); // #F7CC13
  doc.rect(0, 4, pageWidth * 0.4, 1.5, "F");
  doc.setFillColor(225, 6, 30); // #E1061E
  doc.rect(pageWidth * 0.4, 4, pageWidth * 0.2, 1.5, "F");

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(26, 61, 132);
  doc.text("MEJORA CONTINUA", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text("Evaluación de Candidatos a Supervisor · Doré Panadería y Cafetería", 14, 24);

  doc.setFontSize(8);
  doc.setTextColor(225, 6, 30);
  doc.text("DOCUMENTO INTERNO Y CONFIDENCIAL", 14, 29);

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Fecha y hora de emisión: ${dateFormatted}`, pageWidth - 14, 29, { align: "right" });

  doc.setDrawColor(229, 231, 235);
  doc.line(14, 32, pageWidth - 14, 32);

  // Table Body preparation
  const tableData = results.map((r) => {
    const evDetails = evaluatorsList
      .map((ev) => {
        const e = r.evaluations.find((x) => x.evaluator === ev);
        if (!e) return `${ev}: Pendiente`;
        const sub = QUESTIONS.reduce((sum, q) => sum + e[q.key] * q.weight, 0);
        return `${ev}: ${sub} pts`;
      })
      .join("\n");

    let statusText = STATUS_LABEL[r.status];
    if (r.status === "veto") {
      const vetoReasons = r.evaluations
        .filter((e) => e.p2 === 1 || e.p4 === 1)
        .map((e) => `${e.evaluator} (P${e.p2 === 1 ? "2" : "4"}=1)`);
      if (vetoReasons.length > 0) {
        statusText += `\n${vetoReasons.join(", ")}`;
      }
    }

    return [
      r.candidate.name,
      r.candidate.shift,
      `${r.candidate.start} a ${r.candidate.end}`,
      `${r.count} de 4`,
      fmt(r.score),
      statusText,
      evDetails,
    ];
  });

  autoTable(doc, {
    startY: 36,
    head: [["Candidato", "Turno", "Horario", "Evals", "Puntaje", "Estado Final", "Evaluadoras"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [26, 61, 132],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [43, 43, 43],
      lineColor: [243, 244, 246],
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: "bold" },
      1: { cellWidth: 16 },
      2: { cellWidth: 20 },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      5: { cellWidth: 34 },
      6: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text.includes("Terna Final")) {
          data.cell.styles.textColor = [59, 91, 62];
          data.cell.styles.fontStyle = "bold";
        } else if (text.includes("Veto")) {
          data.cell.styles.textColor = [225, 6, 30];
          data.cell.styles.fontStyle = "bold";
        } else if (text.includes("Reserva")) {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // Footer notes
  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 200;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    "Criterios: Terna Final (>= 28 pts), Reserva (20 a 27 pts), Descartado (< 20 pts). Veto automático si P2 o P4 = 1.",
    14,
    finalY + 10,
  );
  doc.text(
    'Mejora Continua — "No motiva, clarifica" — Sistema de Evaluación Doré',
    pageWidth - 14,
    finalY + 10,
    { align: "right" },
  );

  const filename = `candidatos-dore-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export function exportFichaCandidatosPdf(results: CandidateResult[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateFormatted = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  results.forEach((r, idx) => {
    if (idx > 0) doc.addPage();

    // Top Brand Bar
    doc.setFillColor(26, 61, 132);
    doc.rect(0, 0, pageWidth, 4, "F");

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 61, 132);
    doc.text("FICHA INDIVIDUAL DE EVALUACIÓN", 14, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Mejora Continua · Doré Panadería y Cafetería · ${dateFormatted}`, 14, 21);

    // Candidate Overview Box
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, 26, pageWidth - 28, 26, 2, 2, "F");
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, 26, pageWidth - 28, 26, 2, 2, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(43, 43, 43);
    doc.text(r.candidate.name, 18, 34);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Turno: ${r.candidate.shift} (${r.candidate.start} - ${r.candidate.end})`, 18, 40);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Puntaje Final: ${fmt(r.score)} / 33 pts`, 18, 47);

    // Status Pill in Box
    doc.setFontSize(10);
    if (r.status === "terna") {
      doc.setTextColor(59, 91, 62);
      doc.text("Estado: TERNA FINAL", pageWidth - 20, 36, { align: "right" });
    } else if (r.status === "veto") {
      doc.setTextColor(225, 6, 30);
      doc.text("Estado: VETO AUTOMÁTICO", pageWidth - 20, 36, { align: "right" });
    } else if (r.status === "reserva") {
      doc.setTextColor(217, 119, 6);
      doc.text("Estado: EN RESERVA", pageWidth - 20, 36, { align: "right" });
    } else {
      doc.setTextColor(107, 114, 128);
      doc.text("Estado: DESCARTADO", pageWidth - 20, 36, { align: "right" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Evaluaciones: ${r.count} de 4`, pageWidth - 20, 42, { align: "right" });

    // Table of individual evaluations
    const rows = r.evaluations.map((e) => {
      const sub = QUESTIONS.reduce((sum, q) => sum + e[q.key] * q.weight, 0);
      return [
        e.evaluator,
        String(e.p1),
        String(e.p2) + (e.p2 === 1 ? " (!)" : ""),
        String(e.p3),
        String(e.p4) + (e.p4 === 1 ? " (!)" : ""),
        String(e.p5),
        `${sub} / 33`,
        e.comment || "—",
      ];
    });

    autoTable(doc, {
      startY: 57,
      head: [
        [
          "Evaluadora",
          "P1 (x2)\nPersonal",
          "P2 (x3)\nConting.",
          "P3 (x2)\nCalidad",
          "P4 (x3)\nRespons.",
          "P5 (x1)\nMotivac.",
          "Subtotal",
          "Observaciones cualitativas",
        ],
      ],
      body: rows.length > 0 ? rows : [["Sin evaluaciones registradas", "", "", "", "", "", "", ""]],
      theme: "grid",
      headStyles: {
        fillColor: [26, 61, 132],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [43, 43, 43],
      },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: "bold" },
        1: { cellWidth: 16, halign: "center" },
        2: { cellWidth: 16, halign: "center" },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 16, halign: "center" },
        5: { cellWidth: 16, halign: "center" },
        6: { cellWidth: 18, halign: "center", fontStyle: "bold" },
        7: { cellWidth: "auto", fontStyle: "italic" },
      },
      didParseCell: (data) => {
        if (
          data.section === "body" &&
          (data.column.index === 2 || data.column.index === 4) &&
          String(data.cell.raw).includes("(!)")
        ) {
          data.cell.styles.fillColor = [254, 242, 242];
          data.cell.styles.textColor = [225, 6, 30];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const finalY =
      (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 120;

    // Reference Rubric summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(26, 61, 132);
    doc.text("Guía rápida de criterios de ponderación:", 14, finalY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(
      "• P1 Manejo de personal (x2) | P2 Contingencias (x3, crítica) | P3 Protocolos y calidad (x2)\n" +
        "• P4 Delimitación de responsabilidad (x3, crítica) | P5 Compatibilidad y motivación (x1)\n" +
        "• Escala: 1 = Insuficiente (Veto en P2 o P4) | 2 = Cumple estándar | 3 = Sobresaliente",
      14,
      finalY + 15,
    );
  });

  const filename = `fichas-candidatos-dore-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export function exportAuditoriaPdf(users: UserRecord[], events: ActivityEvent[]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const dateFormatted = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  // Top Bar
  doc.setFillColor(26, 61, 132);
  doc.rect(0, 0, pageWidth, 4, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(26, 61, 132);
  doc.text("INFORME DE GESTIÓN Y AUDITORÍA DE EVALUADORAS", 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Mejora Continua · Auditoría de Sistema · ${dateFormatted}`, 14, 21);

  // Table 1: Users
  const userRows = users.map((u) => [
    u.nombre,
    "Activo",
    "Acceso directo",
    u.tutorial_visto ? "Sí" : "No",
    u.last_access ? new Date(u.last_access).toLocaleTimeString("es-AR") : "Sin ingresos",
  ]);

  autoTable(doc, {
    startY: 28,
    head: [["Evaluadora", "Estado", "Acceso", "Tutorial Visto", "Último Acceso"]],
    body: userRows,
    theme: "striped",
    headStyles: {
      fillColor: [26, 61, 132],
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
  });

  const finalY1 =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 100;

  // Table 2: Recent Activity
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(26, 61, 132);
  doc.text("Registro de Eventos Recientes", 14, finalY1 + 10);

  const eventRows = events
    .slice(0, 30)
    .map((ev) => [
      new Date(ev.creado_en).toLocaleTimeString("es-AR"),
      ev.usuario,
      ev.tipo.toUpperCase(),
      ev.candidato_id || "—",
      ev.detalles || "—",
    ]);

  autoTable(doc, {
    startY: finalY1 + 14,
    head: [["Hora", "Usuario", "Acción", "Candidato", "Detalles"]],
    body: eventRows.length > 0 ? eventRows : [["—", "—", "Sin eventos", "—", "—"]],
    theme: "striped",
    headStyles: {
      fillColor: [107, 114, 128],
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
    },
  });

  const filename = `auditoria-dore-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
