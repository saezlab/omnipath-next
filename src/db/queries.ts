"use server"

import { db } from ".";
import { uniprotIdentifiers    } from "./drizzle/schema";
import { sql, or } from "drizzle-orm";

export async function searchIdentifiers(query: string, limit: number = 10) {
  const results = await db
    .select({
      uniprotAccession: uniprotIdentifiers.uniprotAccession,
      identifierType: uniprotIdentifiers.identifierType,
      identifierValue: uniprotIdentifiers.identifierValue,
    })
    .from(uniprotIdentifiers)
    .where(
      or(
        sql`${uniprotIdentifiers.identifierValue} ILIKE ${query + '%'}`,
        sql`${uniprotIdentifiers.uniprotAccession} ILIKE ${query + '%'}`
      )
    )
    .limit(limit);

  return results;
}

export type SearchIdentifiersResponse = Awaited<ReturnType<typeof searchIdentifiers>>;

export async function executeReadOnlyQuery(query: string): Promise<Record<string, unknown>[]> {
  const trimmedQuery = query.trim().toUpperCase();
  if (!trimmedQuery.startsWith("SELECT")) {
    throw new Error("Only read-only queries (starting with SELECT) are allowed.");
  }

  try {
    // Let TypeScript infer the type from db.execute
    // It might return the rows array directly when using sql.raw()
    const results = await db.execute(sql.raw(query));
    // Assuming results is the array of rows
    return results as Record<string, unknown>[];
  } catch (error: unknown) { // Use unknown instead of any
    console.error("Error executing raw SQL query:", error);
    // Type check the error before accessing properties
    let errorMessage = 'Database query execution failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    throw new Error(errorMessage);
  }
}


