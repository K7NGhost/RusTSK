import Database from "@tauri-apps/plugin-sql";
import type { CaseStartupPayload, CaseSummary } from "./types";

const CONNECTION_URL_CANDIDATES = [
  "postgres://postgres@127.0.0.1:55432/postgres?sslmode=disable",
  "postgres://postgres@127.0.0.1:55432/postgres",
];
const CONNECTION_TIMEOUT_MS = 1500;
const QUERY_TIMEOUT_MS = 5000;
const CONNECT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 250;
let dbPromise: Promise<Database> | null = null;
let schemaReady = false;
let schemaInitPromise: Promise<void> | null = null;

type DbCaseRow = {
  id: string;
  name: string;
  casePath: string;
  schemaName: string;
  createdAt: string;
  openedAt: string | null;
};

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

function nowId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
}

async function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    task
      .then((result) => {
        window.clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      let lastError: unknown = null;
      for (let i = 0; i < CONNECT_ATTEMPTS; i += 1) {
        for (const url of CONNECTION_URL_CANDIDATES) {
          try {
            const db = await withTimeout(
              Database.load(url),
              CONNECTION_TIMEOUT_MS,
              `Database.load timeout for ${url}`,
            );
            await withTimeout(
              db.select("SELECT 1"),
              CONNECTION_TIMEOUT_MS,
              `SELECT 1 timeout for ${url}`,
            );
            return db;
          } catch (err) {
            lastError = err;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
      dbPromise = null;
      throw (
        lastError ??
        new Error(
          "Unable to connect to embedded postgres at 127.0.0.1:55432. Check src-tauri/postgres runtime files and startup logs.",
        )
      );
    })();
  }
  return dbPromise;
}

function shouldResetConnection(error: unknown): boolean {
  const message = String(error ?? "").toLowerCase();
  return (
    message.includes("unexpected postmaster exit") ||
    message.includes("connection") ||
    message.includes("closed") ||
    message.includes("broken pipe") ||
    message.includes("terminating")
  );
}

async function execute(sql: string): Promise<void> {
  const db = await getDb();
  try {
    await withTimeout(
      db.execute(sql),
      QUERY_TIMEOUT_MS,
      "Database execute timed out",
    );
  } catch (error) {
    if (shouldResetConnection(error)) {
      dbPromise = null;
      schemaReady = false;
      schemaInitPromise = null;
    }
    throw error;
  }
}

async function select<T>(sql: string): Promise<T> {
  const db = await getDb();
  try {
    return await withTimeout(
      db.select<T>(sql),
      QUERY_TIMEOUT_MS,
      "Database query timed out",
    );
  } catch (error) {
    if (shouldResetConnection(error)) {
      dbPromise = null;
      schemaReady = false;
      schemaInitPromise = null;
    }
    throw error;
  }
}

async function ensureSchema(): Promise<void> {
  if (schemaReady) {
    return;
  }
  if (schemaInitPromise) {
    return schemaInitPromise;
  }

  schemaInitPromise = (async () => {
  await execute("CREATE SCHEMA IF NOT EXISTS case_service;");
  await execute(`
    CREATE TABLE IF NOT EXISTS case_service.cases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      case_path TEXT NOT NULL,
      schema_name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      opened_at TIMESTAMPTZ
    );
  `);
  await execute(`
    ALTER TABLE case_service.cases
    DROP CONSTRAINT IF EXISTS cases_case_path_key;
  `);
  await execute(`
    CREATE INDEX IF NOT EXISTS cases_case_path_idx
    ON case_service.cases (case_path);
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS case_service.recent_cases (
      case_id TEXT PRIMARY KEY REFERENCES case_service.cases(id) ON DELETE CASCADE,
      last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS case_service.evidence_sources (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES case_service.cases(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL,
      source_path TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS case_service.ingest_jobs (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES case_service.cases(id) ON DELETE CASCADE,
      evidence_source_id TEXT NOT NULL REFERENCES case_service.evidence_sources(id) ON DELETE CASCADE,
      plugin_name TEXT,
      status TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMPTZ,
      error_message TEXT
    );
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS case_service.artifacts (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES case_service.cases(id) ON DELETE CASCADE,
      artifact_type TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
    schemaReady = true;
  })();

  try {
    await schemaInitPromise;
  } finally {
    if (!schemaReady) {
      schemaInitPromise = null;
    }
  }
}

function mapCaseRow(row: DbCaseRow): CaseSummary {
  return {
    id: row.id,
    name: row.name,
    casePath: row.casePath,
    schemaName: row.schemaName,
    createdAt: row.createdAt,
    openedAt: row.openedAt,
  };
}

export async function getCaseStartupPayload(): Promise<CaseStartupPayload> {
  await ensureSchema();
  const recentRows = await select<DbCaseRow[]>(
    `
    SELECT c.id,
           c.name,
           c.case_path AS "casePath",
           c.schema_name AS "schemaName",
           c.created_at::TEXT AS "createdAt",
           c.opened_at::TEXT AS "openedAt"
    FROM case_service.recent_cases rc
    JOIN case_service.cases c ON c.id = rc.case_id
    ORDER BY rc.last_opened_at DESC
    LIMIT 15;
    `,
  );
  return { recentCases: recentRows.map(mapCaseRow) };
}

export async function createCase(
  name: string,
  casePath: string,
): Promise<CaseSummary> {
  await ensureSchema();

  const caseId = nowId("case");
  const schemaName = `case_${caseId}`;
  const safeName = sqlEscape(name.trim());
  const safePath = sqlEscape(casePath.trim());

  await execute(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
  await execute(`
    INSERT INTO case_service.cases (id, name, case_path, schema_name, opened_at)
    VALUES ('${caseId}', '${safeName}', '${safePath}', '${schemaName}', NOW());
  `);
  await execute(`
    INSERT INTO case_service.recent_cases (case_id, last_opened_at)
    VALUES ('${caseId}', NOW())
    ON CONFLICT (case_id) DO UPDATE SET last_opened_at = EXCLUDED.last_opened_at;
  `);

  const rows = await select<DbCaseRow[]>(
    `
    SELECT id,
           name,
           case_path AS "casePath",
           schema_name AS "schemaName",
           created_at::TEXT AS "createdAt",
           opened_at::TEXT AS "openedAt"
    FROM case_service.cases
    WHERE id = '${caseId}'
    LIMIT 1;
    `,
  );

  if (!rows[0]) {
    throw new Error("createCase failed to return created case");
  }
  return mapCaseRow(rows[0]);
}

export async function openCase(caseIdOrPath: string): Promise<CaseSummary> {
  await ensureSchema();
  const lookup = sqlEscape(caseIdOrPath.trim());

  await execute(`
    UPDATE case_service.cases
    SET opened_at = NOW()
    WHERE id = '${lookup}' OR case_path = '${lookup}';
  `);
  await execute(`
    INSERT INTO case_service.recent_cases (case_id, last_opened_at)
    SELECT id, NOW() FROM case_service.cases
    WHERE id = '${lookup}' OR case_path = '${lookup}'
    ON CONFLICT (case_id) DO UPDATE SET last_opened_at = EXCLUDED.last_opened_at;
  `);

  const rows = await select<DbCaseRow[]>(
    `
    SELECT id,
           name,
           case_path AS "casePath",
           schema_name AS "schemaName",
           created_at::TEXT AS "createdAt",
           opened_at::TEXT AS "openedAt"
    FROM case_service.cases
    WHERE id = '${lookup}' OR case_path = '${lookup}'
    ORDER BY opened_at DESC NULLS LAST
    LIMIT 1;
    `,
  );

  if (!rows[0]) {
    throw new Error(`case not found for '${caseIdOrPath}'`);
  }
  return mapCaseRow(rows[0]);
}
