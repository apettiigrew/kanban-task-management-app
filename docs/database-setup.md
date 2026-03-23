# Database Setup

Run on your machine before or after DB scripts, as you prefer; migrations should use `DIRECT_URL` as `postgres` (or your migration user).

```bash
cd /path/to/kanban-app
npx prisma migrate dev --schema=./src/prisma/schema.prisma
npx prisma generate --schema=./src/prisma/schema.prisma
```

---

## Script 1 — App role + privileges (run as `postgres`)

```sql
-- 1) Role (pick a strong password; URL-encode it in DATABASE_URL if needed)
CREATE ROLE kanban_app WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

-- 2) Database connect (Supabase default DB name is often "postgres")
GRANT CONNECT ON DATABASE postgres TO kanban_app;

-- 3) Schema
GRANT USAGE ON SCHEMA public TO kanban_app;

-- 4) Existing tables & sequences
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kanban_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kanban_app;

-- 5) Future objects created by migrations run as postgres
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kanban_app;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO kanban_app;
```

If your database is **not** named `postgres`, change the `GRANT CONNECT ON DATABASE ...` line to match **Project Settings → Database → Database name**.

---

## Script 2 — Helper for RLS + execute grant (run as `postgres`)

```sql
CREATE OR REPLACE FUNCTION public.kanban_current_user_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT current_setting('app.current_user_id', true);
$$;

GRANT EXECUTE ON FUNCTION public.kanban_current_user_id() TO kanban_app;
```

---

## Script 3 — RLS + policies (run as `postgres`)

Optional **first block**: drop policies if you need to re-run this script (safe if policies never existed — Postgres will error on missing names unless you use `IF EXISTS`).

```sql
-- Optional: idempotent teardown (PostgreSQL 15+ supports IF EXISTS on DROP POLICY)
DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_insert ON public.projects;
DROP POLICY IF EXISTS projects_update ON public.projects;
DROP POLICY IF EXISTS projects_delete ON public.projects;

DROP POLICY IF EXISTS columns_select ON public.columns;
DROP POLICY IF EXISTS columns_insert ON public.columns;
DROP POLICY IF EXISTS columns_update ON public.columns;
DROP POLICY IF EXISTS columns_delete ON public.columns;

DROP POLICY IF EXISTS cards_select ON public.cards;
DROP POLICY IF EXISTS cards_insert ON public.cards;
DROP POLICY IF EXISTS cards_update ON public.cards;
DROP POLICY IF EXISTS cards_delete ON public.cards;

DROP POLICY IF EXISTS labels_select ON public.labels;
DROP POLICY IF EXISTS labels_insert ON public.labels;
DROP POLICY IF EXISTS labels_update ON public.labels;
DROP POLICY IF EXISTS labels_delete ON public.labels;

DROP POLICY IF EXISTS checklists_select ON public.checklists;
DROP POLICY IF EXISTS checklists_insert ON public.checklists;
DROP POLICY IF EXISTS checklists_update ON public.checklists;
DROP POLICY IF EXISTS checklists_delete ON public.checklists;

DROP POLICY IF EXISTS checklist_items_select ON public.checklist_items;
DROP POLICY IF EXISTS checklist_items_insert ON public.checklist_items;
DROP POLICY IF EXISTS checklist_items_update ON public.checklist_items;
DROP POLICY IF EXISTS checklist_items_delete ON public.checklist_items;

DROP POLICY IF EXISTS card_labels_select ON public.card_labels;
DROP POLICY IF EXISTS card_labels_insert ON public.card_labels;
DROP POLICY IF EXISTS card_labels_update ON public.card_labels;
DROP POLICY IF EXISTS card_labels_delete ON public.card_labels;
```

### Enable RLS

```sql
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         FORCE ROW LEVEL SECURITY;

ALTER TABLE public.columns          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns          FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards            FORCE ROW LEVEL SECURITY;

ALTER TABLE public.checklists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists       FORCE ROW LEVEL SECURITY;

ALTER TABLE public.checklist_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items  FORCE ROW LEVEL SECURITY;

ALTER TABLE public.labels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels           FORCE ROW LEVEL SECURITY;

ALTER TABLE public.card_labels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_labels      FORCE ROW LEVEL SECURITY;
```

### Policies

```sql
-- projects
CREATE POLICY projects_select ON public.projects
  FOR SELECT USING ("userId" = public.kanban_current_user_id());

CREATE POLICY projects_insert ON public.projects
  FOR INSERT WITH CHECK ("userId" = public.kanban_current_user_id());

CREATE POLICY projects_update ON public.projects
  FOR UPDATE
  USING ("userId" = public.kanban_current_user_id())
  WITH CHECK ("userId" = public.kanban_current_user_id());

CREATE POLICY projects_delete ON public.projects
  FOR DELETE USING ("userId" = public.kanban_current_user_id());

-- columns
CREATE POLICY columns_select ON public.columns
  FOR SELECT USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "columns"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY columns_insert ON public.columns
  FOR INSERT WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "columns"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY columns_update ON public.columns
  FOR UPDATE
  USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "columns"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  )
  WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "columns"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY columns_delete ON public.columns
  FOR DELETE USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "columns"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  );

-- cards
CREATE POLICY cards_select ON public.cards
  FOR SELECT USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "cards"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.columns c
      WHERE c.id = "cards"."columnId"
        AND c."projectId" = "cards"."projectId"
        AND c."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY cards_insert ON public.cards
  FOR INSERT WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "cards"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.columns c
      WHERE c.id = "cards"."columnId"
        AND c."projectId" = "cards"."projectId"
        AND c."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY cards_update ON public.cards
  FOR UPDATE
  USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "cards"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.columns c
      WHERE c.id = "cards"."columnId"
        AND c."projectId" = "cards"."projectId"
        AND c."userId" = public.kanban_current_user_id()
    )
  )
  WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "cards"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.columns c
      WHERE c.id = "cards"."columnId"
        AND c."projectId" = "cards"."projectId"
        AND c."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY cards_delete ON public.cards
  FOR DELETE USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "cards"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
    AND EXISTS (
      SELECT 1 FROM public.columns c
      WHERE c.id = "cards"."columnId"
        AND c."projectId" = "cards"."projectId"
        AND c."userId" = public.kanban_current_user_id()
    )
  );

-- labels
CREATE POLICY labels_select ON public.labels
  FOR SELECT USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "labels"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY labels_insert ON public.labels
  FOR INSERT WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "labels"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY labels_update ON public.labels
  FOR UPDATE
  USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "labels"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  )
  WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "labels"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY labels_delete ON public.labels
  FOR DELETE USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = "labels"."projectId"
        AND p."userId" = public.kanban_current_user_id()
    )
  );

-- checklists
CREATE POLICY checklists_select ON public.checklists
  FOR SELECT USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = "checklists"."cardId"
        AND c."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY checklists_insert ON public.checklists
  FOR INSERT WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = "checklists"."cardId"
        AND c."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY checklists_update ON public.checklists
  FOR UPDATE
  USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = "checklists"."cardId"
        AND c."userId" = public.kanban_current_user_id()
    )
  )
  WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = "checklists"."cardId"
        AND c."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY checklists_delete ON public.checklists
  FOR DELETE USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.cards c
      WHERE c.id = "checklists"."cardId"
        AND c."userId" = public.kanban_current_user_id()
    )
  );

-- checklist_items
CREATE POLICY checklist_items_select ON public.checklist_items
  FOR SELECT USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.checklists cl
      WHERE cl.id = "checklist_items"."checklistId"
        AND cl."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY checklist_items_insert ON public.checklist_items
  FOR INSERT WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.checklists cl
      WHERE cl.id = "checklist_items"."checklistId"
        AND cl."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY checklist_items_update ON public.checklist_items
  FOR UPDATE
  USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.checklists cl
      WHERE cl.id = "checklist_items"."checklistId"
        AND cl."userId" = public.kanban_current_user_id()
    )
  )
  WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.checklists cl
      WHERE cl.id = "checklist_items"."checklistId"
        AND cl."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY checklist_items_delete ON public.checklist_items
  FOR DELETE USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1 FROM public.checklists cl
      WHERE cl.id = "checklist_items"."checklistId"
        AND cl."userId" = public.kanban_current_user_id()
    )
  );

-- card_labels
CREATE POLICY card_labels_select ON public.card_labels
  FOR SELECT USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.cards c
      JOIN public.labels l ON l.id = "card_labels"."labelId"
      WHERE c.id = "card_labels"."cardId"
        AND c."projectId" = l."projectId"
        AND c."userId" = public.kanban_current_user_id()
        AND l."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY card_labels_insert ON public.card_labels
  FOR INSERT WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.cards c
      JOIN public.labels l ON l.id = "card_labels"."labelId"
      WHERE c.id = "card_labels"."cardId"
        AND c."projectId" = l."projectId"
        AND c."userId" = public.kanban_current_user_id()
        AND l."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY card_labels_update ON public.card_labels
  FOR UPDATE
  USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.cards c
      JOIN public.labels l ON l.id = "card_labels"."labelId"
      WHERE c.id = "card_labels"."cardId"
        AND c."projectId" = l."projectId"
        AND c."userId" = public.kanban_current_user_id()
        AND l."userId" = public.kanban_current_user_id()
    )
  )
  WITH CHECK (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.cards c
      JOIN public.labels l ON l.id = "card_labels"."labelId"
      WHERE c.id = "card_labels"."cardId"
        AND c."projectId" = l."projectId"
        AND c."userId" = public.kanban_current_user_id()
        AND l."userId" = public.kanban_current_user_id()
    )
  );

CREATE POLICY card_labels_delete ON public.card_labels
  FOR DELETE USING (
    "userId" = public.kanban_current_user_id()
    AND EXISTS (
      SELECT 1
      FROM public.cards c
      JOIN public.labels l ON l.id = "card_labels"."labelId"
      WHERE c.id = "card_labels"."cardId"
        AND c."projectId" = l."projectId"
        AND c."userId" = public.kanban_current_user_id()
        AND l."userId" = public.kanban_current_user_id()
    )
  );
```

---

## Script 4 — `.env` templates (not SQL)

**Migrations** (`DIRECT_URL`) — keep `postgres` (or migration user):

```env
DIRECT_URL="postgresql://postgres.[REF]:[POSTGRES_PASSWORD]@[HOST]:5432/postgres"
```

**App runtime** (`DATABASE_URL`) — use `kanban_app` + pooler (example shape; match your Supabase dashboard):

```env
DATABASE_URL="postgresql://kanban_app.[REF]:[KANBAN_APP_PASSWORD]@[POOLER_HOST]:6543/postgres?pgbouncer=true"
```

Use the exact host/user format Supabase shows for pooling vs. direct; only the username and password change to `kanban_app`.

---

## Script 5 — Quick manual RLS test (as `kanban_app`, optional)

```sql
SELECT set_config('app.current_user_id', 'user-a-id', true);
SELECT id, "userId" FROM public.projects LIMIT 5;

SELECT set_config('app.current_user_id', 'user-b-id', true);
SELECT id, "userId" FROM public.projects LIMIT 5;
```

---

**Order summary:** migrate schema with `postgres` → Script 1 (role + grants) → Script 2 (function) → Script 3 (RLS) → point `DATABASE_URL` at `kanban_app` → keep using `queryAsUser` in the app.

> If `DROP POLICY IF EXISTS` errors on an older Postgres version, remove that block and run policy creation only once, or drop policies manually by name.
