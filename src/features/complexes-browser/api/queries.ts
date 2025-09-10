"use server";

import { db } from "@/db";
import { complexes } from "@/db/drizzle/schema";
import { SearchIdentifiersResponse } from "@/db/queries";
import { ComplexEntry } from "../types";

export async function getComplexesData(identifierResults: SearchIdentifiersResponse) {
  if (identifierResults.length === 0) {
    return {
      complexEntries: [],
    };
  }
  
  // Extract unique identifiers to search for in complexes
  const uniprotAccessions = [...new Set(identifierResults.map(r => r.uniprotAccession))];
  const geneSymbols = [...new Set(identifierResults
    .filter(r => r.identifierType.includes('gene'))
    .map(r => r.identifierValue.toUpperCase())
  )];
  
  // Get all complexes since we need to check components field client-side
  const allComplexes = await db
    .select({
      id: complexes.id,
      name: complexes.name,
      components: complexes.components,
      componentsGenesymbols: complexes.componentsGenesymbols,
      stoichiometry: complexes.stoichiometry,
      sources: complexes.sources,
      references: complexes.references,
      identifiers: complexes.identifiers,
    })
    .from(complexes);
  
  // Filter complexes that contain any of the searched proteins
  const matchingComplexes = allComplexes.filter(complex => {
    // Parse components and gene symbols
    const componentsList = complex.components?.split("_").map(c => c.trim()) || [];
    const geneSymbolsList = complex.componentsGenesymbols?.split("_").map(g => g.trim().toUpperCase()) || [];
    
    // Check if any searched protein is in this complex
    const hasMatchingUniprot = uniprotAccessions.some(acc => 
      componentsList.includes(acc)
    );
    
    const hasMatchingGene = geneSymbols.some(gene => 
      geneSymbolsList.includes(gene)
    );
    
    return hasMatchingUniprot || hasMatchingGene;
  });
  
  return {
    complexEntries: matchingComplexes as ComplexEntry[],
  };
}

export type GetComplexesDataResponse = Awaited<
  ReturnType<typeof getComplexesData>
>;