"use server";

import { db } from "@/db";
import { intercell } from "@/db/drizzle/schema";
import { or, inArray } from "drizzle-orm";
import { SearchIdentifiersResponse } from "@/db/queries";

export async function getIntercellData(identifierResults: SearchIdentifiersResponse) {
  if (identifierResults.length === 0) {
    return {
      intercellEntries: [],
    };
  }
  
  // Extract unique uniprot accessions and gene symbols
  const uniprotAccessions = [...new Set(identifierResults.map(r => r.uniprotAccession))];
  const geneSymbols = [...new Set(identifierResults
    .filter(r => r.identifierType.includes('gene'))
    .map(r => r.identifierValue.toUpperCase())
  )];
  
  // Build the where conditions
  const whereConditions = [];
  
  if (uniprotAccessions.length > 0) {
    whereConditions.push(inArray(intercell.uniprot, uniprotAccessions));
  }
  
  if (geneSymbols.length > 0) {
    whereConditions.push(inArray(intercell.genesymbol, geneSymbols));
  }
  
  if (whereConditions.length === 0) {
    return {
      intercellEntries: [],
    };
  }
  
  const results = await db
    .select({
      id: intercell.id,
      category: intercell.category,
      parent: intercell.parent,
      database: intercell.database,
      scope: intercell.scope,
      aspect: intercell.aspect,
      source: intercell.source,
      uniprot: intercell.uniprot,
      genesymbol: intercell.genesymbol,
      entityType: intercell.entityType,
      consensusScore: intercell.consensusScore,
      transmitter: intercell.transmitter,
      receiver: intercell.receiver,
      secreted: intercell.secreted,
      plasmaMembraneTransmembrane: intercell.plasmaMembraneTransmembrane,
      plasmaMembranePeripheral: intercell.plasmaMembranePeripheral,
    })
    .from(intercell)
    .where(or(...whereConditions));
    
  return {
    intercellEntries: results,
  };
}

export type GetIntercellDataResponse = Awaited<
  ReturnType<typeof getIntercellData>
>;