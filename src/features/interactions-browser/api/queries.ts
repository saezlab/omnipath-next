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
  const uniprotAccessions = [...new Set(identifierResults
    .filter(r => !r.identifierType || r.identifierType.toLowerCase().includes('protein') || r.identifierType === 'UniProtKB')
    .map(r => r.uniprotAccession)
  )];
  const geneSymbols = [...new Set(identifierResults
    .filter(r => r.identifierType && r.identifierType.toLowerCase().includes('gene'))
    .map(r => r.identifierValue.toUpperCase())
  )];
  
  // Extract other entity types (complex, mirna, etc.)
  const otherEntityTypes = [...new Set(identifierResults
    .filter(r => r.identifierType && !r.identifierType.toLowerCase().includes('protein') && !r.identifierType.toLowerCase().includes('gene') && r.identifierType !== 'UniProtKB')
    .map(r => ({ type: r.identifierType.toLowerCase(), value: r.identifierValue }))
  )];
  
  // Combine all protein identifiers
  const allProteinIds = [...uniprotAccessions, ...geneSymbols].filter(Boolean);
  const allEntityValues = [...allProteinIds, ...otherEntityTypes.map(e => e.value)].filter(Boolean);
  
  if (allEntityValues.length === 0) {
    return {
      interactions: [],
    };
  }
  
  // Build WHERE conditions for different entity types
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
  
  // Add conditions for other entity types (search in both source and target)
  if (otherEntityTypes.length > 0) {
    const otherValues = otherEntityTypes.map(e => e.value);
    whereConditions.push(
      inArray(interactions.source, otherValues),
      inArray(interactions.target, otherValues),
      inArray(interactions.sourceGenesymbol, otherValues),
      inArray(interactions.targetGenesymbol, otherValues)
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
