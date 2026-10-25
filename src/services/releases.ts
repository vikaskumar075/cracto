import { getPool } from "@/lib/db";
import { TOTAL_STEPS, computeStatus } from "@/lib/constants";
import { Release } from "@/types";

function rowToRelease(row: Record<string, unknown>): Release {
  const stepsCompleted = (row.steps_completed as number[]) ?? [];
  return {
    id: row.id as string,
    name: row.name as string,
    date: (row.date as Date).toISOString(),
    status: computeStatus(stepsCompleted),
    additionalInfo: (row.additional_info as string) ?? null,
    stepsCompleted,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export async function getReleases(): Promise<Release[]> {
  const db = getPool();
  const { rows } = await db.query(
    "SELECT * FROM releases ORDER BY created_at DESC"
  );
  return rows.map(rowToRelease);
}

export async function getReleaseById(id: string): Promise<Release | null> {
  const db = getPool();
  const { rows } = await db.query("SELECT * FROM releases WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  return rowToRelease(rows[0]);
}

export async function createRelease(input: {
  name: string;
  date: string;
  additionalInfo?: string;
}): Promise<Release> {
  const db = getPool();
  const { rows } = await db.query(
    `INSERT INTO releases (name, date, additional_info, steps_completed)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.name, input.date, input.additionalInfo ?? null, []]
  );
  return rowToRelease(rows[0]);
}

export async function updateRelease(input: {
  id: string;
  additionalInfo?: string | null;
  stepsCompleted?: number[];
}): Promise<Release | null> {
  const db = getPool();

  // Clamp step indices to valid range
  const validSteps = input.stepsCompleted
    ? [...new Set(input.stepsCompleted.filter((s) => s >= 0 && s < TOTAL_STEPS))]
    : undefined;

  const { rows } = await db.query(
    `UPDATE releases
     SET additional_info = COALESCE($2, additional_info),
         steps_completed = COALESCE($3, steps_completed),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      input.id,
      input.additionalInfo !== undefined ? input.additionalInfo : null,
      validSteps ? `{${validSteps.join(",")}}` : null,
    ]
  );
  if (rows.length === 0) return null;
  return rowToRelease(rows[0]);
}

export async function deleteRelease(id: string): Promise<boolean> {
  const db = getPool();
  const { rowCount } = await db.query("DELETE FROM releases WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
