import {
  pgTable,
  uuid,
  text,
  smallint,
  timestamp,
  boolean,
  integer,
  unique,
} from "drizzle-orm/pg-core";

export const evaluations = pgTable(
  "evaluations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evaluator: text("evaluator").notNull(),
    candidateId: text("candidate_id").notNull(),
    p1: smallint("p1").notNull(),
    p2: smallint("p2").notNull(),
    p3: smallint("p3").notNull(),
    p4: smallint("p4").notNull(),
    p5: smallint("p5").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("evaluations_evaluator_candidate_id_unique").on(t.evaluator, t.candidateId)],
);

export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull().unique(),
  pin: text("pin").notNull(),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow(),
  ultimoAcceso: timestamp("ultimo_acceso", { withTimezone: true }).defaultNow(),
  tutorialVisto: boolean("tutorial_visto").default(false),
  intentosFallidos: integer("intentos_fallidos").default(0),
  bloqueadoHasta: timestamp("bloqueado_hasta", { withTimezone: true }),
});
