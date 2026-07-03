import { neon } from "@neondatabase/serverless";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const url = process.env.DATABASE_URL;

/**
 * Uses `postgres.js` for local Docker PostgreSQL (TCP),
 * and `@neondatabase/serverless` for Neon cloud (HTTP).
 */
const isNeon = url.includes("neon.tech") || url.includes("neondb");

const localSql = postgres(url, { max: 10 });

export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  if (isNeon) {
    const n = neon(url);
    return n(strings, ...values);
  }
  return localSql.unsafe(
    strings.reduce(
      (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
      "",
    ),
    values as never[],
  );
};

sql.query = async <T = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
): Promise<T[]> => {
  if (isNeon) {
    const n = neon(url);
    return n.query(query, params) as Promise<T[]>;
  }
  return localSql.unsafe(query, params as never[]) as Promise<T[]>;
};

/** Execute a raw SQL string with positional $1, $2... parameters. */
export async function sqlQuery<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = [],
): Promise<T[]> {
  return sql.query(query, params) as Promise<T[]>;
}
