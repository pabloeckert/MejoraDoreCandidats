CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator text NOT NULL,
  candidate_id text NOT NULL,
  p1 smallint NOT NULL, p2 smallint NOT NULL, p3 smallint NOT NULL, p4 smallint NOT NULL, p5 smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluator, candidate_id)
);
GRANT SELECT, INSERT, UPDATE ON public.evaluations TO anon, authenticated;
GRANT ALL ON public.evaluations TO service_role;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read evals" ON public.evaluations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert evals" ON public.evaluations FOR INSERT TO anon, authenticated WITH CHECK (p1 BETWEEN 1 AND 3 AND p2 BETWEEN 1 AND 3 AND p3 BETWEEN 1 AND 3 AND p4 BETWEEN 1 AND 3 AND p5 BETWEEN 1 AND 3 AND evaluator IN ('Cecilia','Dahiana','Silvana','Sindy'));
CREATE POLICY "update evals" ON public.evaluations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (p1 BETWEEN 1 AND 3 AND p2 BETWEEN 1 AND 3 AND p3 BETWEEN 1 AND 3 AND p4 BETWEEN 1 AND 3 AND p5 BETWEEN 1 AND 3 AND evaluator IN ('Cecilia','Dahiana','Silvana','Sindy'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluations;