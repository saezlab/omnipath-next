"use server";

import { db } from "@/db";
import { complexes } from "@/db/drizzle/schema";
import { SearchIdentifiersResponse } from "@/db/queries";
import { ComplexEntry } from "../types";

// In-memory cache for fast access within the same process
type CachedComplex = {
  id: number;
  name: string | null;
  components: string | null;
  componentsGenesymbols: string | null;
  stoichiometry: string | null;
  sources: string | null;
  references: string | null;
  identifiers: string | null;
};

let memoryCache: {
  data: CachedComplex[] | null;
} = {
  data: null,
};

// Get all complexes with permanent in-memory caching
async function getCachedAllComplexes() {
  // Return cached data if available
  if (memoryCache.data) {
    return memoryCache.data;
  }
  
  // Fetch fresh data from database
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
  
  // Update cache
  memoryCache.data = allComplexes;
  
  return allComplexes;
}

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
  
  // Get all complexes from cache
  const allComplexes = await getCachedAllComplexes();
  
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
