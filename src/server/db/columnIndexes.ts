// src/server/db/columnIndexes.ts
import { sql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { db } from "~/server/db";
import { rows } from "~/server/db/schema";

type ColumnType = "text" | "number" | "singleSelect" | "attachment";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function short(id: string) {
  return id.replaceAll("-", "").slice(0, 8);
}

function makeIndexName(tableId: string, columnId: string, suffix: string) {
  const name = `r_${short(tableId)}_${short(columnId)}_${suffix}`.toLowerCase();
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error("Bad index name");
  return name;
}

function quoteIdent(ident: string) {
  // for schema/table names coming from drizzle config
  return `"${ident.replaceAll('"', '""')}"`;
}

function rowsQualifiedName() {
  const cfg = getTableConfig(rows);
  const name = quoteIdent(cfg.name);
  return cfg.schema ? `${quoteIdent(cfg.schema)}.${name}` : name;
}

let trgmEnsured = false;
async function ensurePgTrgm() {
  if (trgmEnsured) return;
  try {
    await db.execute(sql.raw(`CREATE EXTENSION IF NOT EXISTS pg_trgm`));
  } finally {
    // If your DB role cannot create extensions, do this in a migration instead.
    trgmEnsured = true;
  }
}

export async function createIndexesForColumn(args: {
  tableId: string;
  columnId: string;
  type: ColumnType;
}) {
  const { tableId, columnId, type } = args;

  if (!uuidRe.test(tableId) || !uuidRe.test(columnId)) {
    throw new Error("Invalid tableId/columnId");
  }

  const targetTable = rowsQualifiedName();

  // UUIDs are safe, but keep escaping for completeness
  const key = columnId.replaceAll("'", "''");

  if (type === "number") {
    const idx = makeIndexName(tableId, columnId, "num_sort");

    await db.execute(
      sql.raw(`
        CREATE INDEX IF NOT EXISTS "${idx}"
        ON ${targetTable} (table_id, ((values->>'${key}')::double precision))
        WHERE (values->>'${key}') ~ '^-?\\d+(\\.\\d+)?$'
      `)
    );
  } else {
    const idx = makeIndexName(tableId, columnId, "txt_sort");

    await db.execute(
      sql.raw(`
        CREATE INDEX IF NOT EXISTS "${idx}"
        ON ${targetTable} (table_id, (values->>'${key}'))
      `)
    );

    await ensurePgTrgm();
    const trigramIdx = makeIndexName(tableId, columnId, "txt_trgm");

    await db.execute(
      sql.raw(`
        CREATE INDEX IF NOT EXISTS "${trigramIdx}"
        ON ${targetTable} USING gin ((values->>'${key}') gin_trgm_ops)
      `)
    );
  }
}
