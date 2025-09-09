"use server";

import { db } from "@/db";
import { interactions } from "@/db/drizzle/schema";
import { and, inArray, or } from "drizzle-orm";
import { SearchIdentifiersResponse } from "@/db/queries";

export async function searchProteinNeighbors(identifierResults: SearchIdentifiersResponse) {
  if (identifierResults.length === 0) {
    return {
      interactions: [],
    };
  }
  
  // Extract unique uniprot accessions and gene symbols
  const uniprotAccessions = [...new Set(identifierResults.map(r => r.uniprotAccession))];
  const geneSymbols = [...new Set(identifierResults
    .filter(r => r.identifierType.includes('gene'))
    .map(r => r.identifierValue.toUpperCase())
  )];
  
  // Combine all protein identifiers
  const allProteinIds = [...uniprotAccessions, ...geneSymbols].filter(Boolean);
  
  if (allProteinIds.length === 0) {
    return {
      interactions: [],
    };
  }
  
  // Always get all interactions involving these proteins (neighbors approach)
  // This works for both single and multiple proteins
  const whereConditions = [];
  
  if (uniprotAccessions.length > 0) {
    whereConditions.push(
      inArray(interactions.source, uniprotAccessions),
      inArray(interactions.target, uniprotAccessions)
    );
  }
  
  if (geneSymbols.length > 0) {
    whereConditions.push(
      inArray(interactions.sourceGenesymbol, geneSymbols),
      inArray(interactions.targetGenesymbol, geneSymbols)
    );
  }
  
  const results = await db
    .select()
    .from(interactions)
    .where(or(...whereConditions));
    
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
