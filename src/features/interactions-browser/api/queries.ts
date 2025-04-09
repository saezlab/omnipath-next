"use server";

import { db } from "@/db";
import { interactions } from "@/db/drizzle/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";

export async function searchProteinNeighbors(query: string) {
  query = query.trim().toUpperCase();
  const results = await db
    .select()
    .from(interactions)
    .where(
      or(
        eq(interactions.sourceGenesymbol, query),
        eq(interactions.source, query),
        eq(interactions.targetGenesymbol, query),
        eq(interactions.target, query)
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
