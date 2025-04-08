"use server";

import { db } from "@/db";
import { interactions } from "@/db/drizzle/schema";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";

export async function searchProteinNeighbors(query: string) {
  const results = await db
    .select()
    .from(interactions)
    .where(
      or(
        eq(sql`lower(${interactions.sourceGenesymbol})`, query.toLowerCase()),
        eq(sql`lower(${interactions.source})`, query.toLowerCase()),
        eq(sql`lower(${interactions.targetGenesymbol})`, query.toLowerCase()),
        eq(sql`lower(${interactions.target})`, query.toLowerCase())
      )
    )
  return {
    interactions: results,
  };
}

export async function getInteractionsAmongProteins(proteinIds: string[]) {
  const results = await db
    .select()
    .from(interactions)
    .where(
      and(
        inArray(interactions.source, proteinIds),
        inArray(interactions.target, proteinIds)
      )
    )
    .limit(1000);

  return {
    interactions: results,
  };
}

export type SearchProteinNeighborsResponse = Awaited<
  ReturnType<typeof searchProteinNeighbors>
>;

export type GetInteractionsAmongProteinsResponse = Awaited<
  ReturnType<typeof getInteractionsAmongProteins>
>;
