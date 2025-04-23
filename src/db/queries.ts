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