"use server";

import { db } from "@/db";
import { annotations, uniprotProteins } from "@/db/drizzle/schema";
import { eq, or } from "drizzle-orm";


export async function getProteinAnnotations(query: string) {
  query = query.trim().toUpperCase();
    const results = await db
      .select({
        uniprot: annotations.uniprot,
        genesymbol: annotations.genesymbol,
        entityType: annotations.entityType,
        source: annotations.source,
        label: annotations.label,
        value: annotations.value,
        recordId: annotations.recordId
      })
      .from(annotations)
      .where(
        or(
          eq(annotations.genesymbol, query),
          eq(annotations.uniprot, query)
        )
      )  
    return {
      annotations: results,
    };
  }
  
export type GetProteinAnnotationsResponse = Awaited<
  ReturnType<typeof getProteinAnnotations>
>;

export async function getProteinInformation(query: string) {
  query = query.trim().toUpperCase();
  
  const result = await db
    .select({
      entry: uniprotProteins.entry,
      entryName: uniprotProteins.entryName,
      proteinNames: uniprotProteins.proteinNames,
      length: uniprotProteins.length,
      mass: uniprotProteins.mass,
      geneNamesPrimary: uniprotProteins.geneNamesPrimary,
      geneNamesSynonym: uniprotProteins.geneNamesSynonym,
      organismId: uniprotProteins.organismId,
      functionCc: uniprotProteins.functionCc,
      subcellularLocation: uniprotProteins.subcellularLocation,
      keywords: uniprotProteins.keywords,
      proteinFamilies: uniprotProteins.proteinFamilies,
    })
    .from(uniprotProteins)
    .where(
      or(
        eq(uniprotProteins.entry, query),
        eq(uniprotProteins.geneNamesPrimary, query)
      )
    )
    .limit(1);
    
  return result[0] || null;
}

export type GetProteinInformationResponse = Awaited<
  ReturnType<typeof getProteinInformation>
>;