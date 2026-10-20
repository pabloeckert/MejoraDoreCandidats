import { describe, expect, it } from "vitest";
import { DEMO_CANDIDATES, DEMO_EVALUATIONS } from "./data.demo";
import { computeResult } from "./utils/scoring";

describe("data.demo.ts - Verificación de estados de ejemplo", () => {
  it("Ejemplo Terna: promedio 30,5 -> Terna Final (no provisorio, 4 evaluaciones)", () => {
    const candidate = DEMO_CANDIDATES.find((c) => c.id === "demo-terna")!;
    const res = computeResult(candidate, DEMO_EVALUATIONS);

    expect(res.count).toBe(4);
    expect(res.score).toBeCloseTo(30.5, 2);
    expect(res.status).toBe("terna");
    expect(res.provisional).toBe(false);
  });

  it("Ejemplo Reserva: promedio 23 -> En Reserva", () => {
    const candidate = DEMO_CANDIDATES.find((c) => c.id === "demo-reserva")!;
    const res = computeResult(candidate, DEMO_EVALUATIONS);

    expect(res.count).toBe(4);
    expect(res.score).toBeCloseTo(23, 2);
    expect(res.status).toBe("reserva");
    expect(res.provisional).toBe(false);
  });

  it("Ejemplo Descartado: promedio 19,25 -> Descartado", () => {
    const candidate = DEMO_CANDIDATES.find((c) => c.id === "demo-descartado")!;
    const res = computeResult(candidate, DEMO_EVALUATIONS);

    expect(res.count).toBe(4);
    expect(res.score).toBeCloseTo(19.25, 2);
    expect(res.status).toBe("descartado");
    expect(res.provisional).toBe(false);
  });

  it("Ejemplo Veto: promedio 31 pero Veto Automático (C puso 1 en Contingencias)", () => {
    const candidate = DEMO_CANDIDATES.find((c) => c.id === "demo-veto")!;
    const res = computeResult(candidate, DEMO_EVALUATIONS);

    expect(res.count).toBe(3);
    expect(res.score).toBeCloseTo(31, 2);
    expect(res.status).toBe("veto");
  });

  it("Ejemplo Pendiente: promedio 25,5, 2 de 4 evaluaciones, estado provisorio (atenuado)", () => {
    const candidate = DEMO_CANDIDATES.find((c) => c.id === "demo-pendiente")!;
    const res = computeResult(candidate, DEMO_EVALUATIONS);

    expect(res.count).toBe(2);
    expect(res.score).toBeCloseTo(25.5, 2);
    expect(res.provisional).toBe(true);
  });
});
