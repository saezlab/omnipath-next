"use server";

import { db } from "@/db";
import { enzSub } from "@/db/drizzle/schema";
import { or, inArray, and } from "drizzle-orm";
import { SearchIdentifiersResponse } from "@/db/queries";

export async function getEnzSubData(identifierResults: SearchIdentifiersResponse) {
  if (identifierResults.length === 0) {
    return {
      enzSubData: [],
    };
  }
  
  // Extract unique uniprot accessions and gene symbols
  const uniprotAccessions = [...new Set(identifierResults.map(r => r.uniprotAccession))];
  const geneSymbols = [...new Set(identifierResults
    .filter(r => r.identifierType.includes('gene'))
    .map(r => r.identifierValue.toUpperCase())
  )];
  
  // Build the where conditions for both enzyme and substrate fields
  const whereConditions = [];
  
  if (uniprotAccessions.length > 0) {
    whereConditions.push(
      inArray(enzSub.enzyme, uniprotAccessions),
      inArray(enzSub.substrate, uniprotAccessions)
    );
  }
  
  if (geneSymbols.length > 0) {
    whereConditions.push(
      inArray(enzSub.enzymeGenesymbol, geneSymbols),
      inArray(enzSub.substrateGenesymbol, geneSymbols)
    );
  }
  
  if (whereConditions.length === 0) {
    return {
      enzSubData: [],
    };
  }
  
  const results = await db
    .select({
      id: enzSub.id,
      enzyme: enzSub.enzyme,
      enzymeGenesymbol: enzSub.enzymeGenesymbol,
      substrate: enzSub.substrate,
      substrateGenesymbol: enzSub.substrateGenesymbol,
      isoforms: enzSub.isoforms,
      residueType: enzSub.residueType,
      residueOffset: enzSub.residueOffset,
      modification: enzSub.modification,
      sources: enzSub.sources,
      references: enzSub.references,
      curationEffort: enzSub.curationEffort,
      ncbiTaxId: enzSub.ncbiTaxId,
    })
    .from(enzSub)
    .where(or(...whereConditions));
    
  return {
    enzSubData: results,
  };
}

export async function getEnzSubDataAmongProteins(proteinIds: string[]) {
  if (proteinIds.length === 0) {
    return {
      enzSubData: [],
    };
  }
  
  // Split protein IDs into uniprot accessions and gene symbols
  const uniprotAccessions = proteinIds.filter(id => id.match(/^[A-Z0-9]{6,10}$/));
  const geneSymbols = proteinIds.filter(id => !id.match(/^[A-Z0-9]{6,10}$/));
  
  // Build where conditions for both enzyme AND substrate being in the search set
  const enzymeConditions = [];
  const substrateConditions = [];
  
  if (uniprotAccessions.length > 0) {
    enzymeConditions.push(inArray(enzSub.enzyme, uniprotAccessions));
    substrateConditions.push(inArray(enzSub.substrate, uniprotAccessions));
  }
  
  if (geneSymbols.length > 0) {
    enzymeConditions.push(inArray(enzSub.enzymeGenesymbol, geneSymbols));
    substrateConditions.push(inArray(enzSub.substrateGenesymbol, geneSymbols));
  }
  
  if (enzymeConditions.length === 0 || substrateConditions.length === 0) {
    return {
      enzSubData: [],
    };
  }
  
  // Both enzyme AND substrate must be in the searched protein set
  const results = await db
    .select({
      id: enzSub.id,
      enzyme: enzSub.enzyme,
      enzymeGenesymbol: enzSub.enzymeGenesymbol,
      substrate: enzSub.substrate,
      substrateGenesymbol: enzSub.substrateGenesymbol,
      isoforms: enzSub.isoforms,
      residueType: enzSub.residueType,
      residueOffset: enzSub.residueOffset,
      modification: enzSub.modification,
      sources: enzSub.sources,
      references: enzSub.references,
      curationEffort: enzSub.curationEffort,
      ncbiTaxId: enzSub.ncbiTaxId,
    })
    .from(enzSub)
    .where(and(
      or(...enzymeConditions),
      or(...substrateConditions)
    ));
    
  return {
    enzSubData: results,
  };
}

export type GetEnzSubDataResponse = Awaited<
  ReturnType<typeof getEnzSubData>
>;