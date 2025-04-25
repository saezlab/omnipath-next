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

export async function executeReadOnlyQuery(query: string): Promise<any[]> {
  const trimmedQuery = query.trim().toUpperCase();
  if (!trimmedQuery.startsWith("SELECT")) {
    throw new Error("Only read-only queries (starting with SELECT) are allowed.");
  }

  try {
    const results = await db.execute(sql.raw(query));
    // The exact structure of results might depend on the database driver (e.g., rows, fields)
    // Adjust this based on what db.execute returns for your setup
    // Assuming it returns an array of result objects or just the rows directly
    return results as any[];
  } catch (error: any) {
    console.error("Error executing raw SQL query:", error);
    // Re-throw an error that includes the original message
    throw new Error(String(error?.message || error || 'Database query execution failed'));
  }
}


