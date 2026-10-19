import { describe, expect, it } from "vitest";
import { MAX_SCORE } from "../data";
import type { Evaluation } from "../types";
import { computeResult, statusFor, weightedTotal } from "./scoring";

const c = { id: "x", name: "X", shift: "Mañana" as const, start: "08:30", end: "09:10" };
const ev = (
  p: [1 | 2 | 3, 1 | 2 | 3, 1 | 2 | 3, 1 | 2 | 3, 1 | 2 | 3],
  who: Evaluation["evaluator"] = "Cecilia",
): Evaluation => ({
  evaluator: who,
  candidate_id: "x",
  p1: p[0],
  p2: p[1],
  p3: p[2],
  p4: p[3],
  p5: p[4],
});

describe("scoring", () => {
  it("max is 33", () => expect(MAX_SCORE).toBe(33));
  it("applies weights 2,3,2,3,1", () =>
    expect(weightedTotal(ev([1, 2, 3, 2, 1]))).toBe(2 + 6 + 6 + 6 + 1));
  it("averages evaluators", () => {
    const r = computeResult(c, [ev([3, 3, 3, 3, 3]), ev([2, 2, 2, 2, 2], "Sindy")]);
    expect(r.score).toBe(27.5);
    expect(r.count).toBe(2);
    expect(r.provisional).toBe(true);
  });
  it("vetoes if any evaluator gives 1 in P2", () => {
    expect(computeResult(c, [ev([3, 3, 3, 3, 3]), ev([3, 1, 3, 3, 3], "Sindy")]).status).toBe(
      "veto",
    );
  });
  it("vetoes if any evaluator gives 1 in P4", () => {
    expect(computeResult(c, [ev([3, 3, 3, 1, 3])]).status).toBe("veto");
  });
  it("thresholds", () => {
    expect(statusFor(19.9, false)).toBe("descartado");
    expect(statusFor(20, false)).toBe("reserva");
    expect(statusFor(26.9, false)).toBe("reserva");
    expect(statusFor(27, false)).toBe("terna");
  });
});
