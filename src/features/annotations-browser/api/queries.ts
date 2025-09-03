"use server";

import { db } from "@/db";
import { annotations, uniprotProteins } from "@/db/drizzle/schema";
import { eq, or, inArray } from "drizzle-orm";
import { SearchIdentifiersResponse } from "@/db/queries";


export async function getProteinAnnotations(identifierResults: SearchIdentifiersResponse) {
  if (identifierResults.length === 0) {
    // No identifiers found, return empty results
    return {
      annotations: [],
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
    whereConditions.push(inArray(annotations.uniprot, uniprotAccessions));
  }
  
  if (geneSymbols.length > 0) {
    whereConditions.push(inArray(annotations.genesymbol, geneSymbols));
  }
  
  if (whereConditions.length === 0) {
    return {
      annotations: [],
    };
  }
  
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
    .where(or(...whereConditions));
    
  return {
    annotations: results,
  };
}
  
export type GetProteinAnnotationsResponse = Awaited<
  ReturnType<typeof getProteinAnnotations>
>;

export async function getProteinInformation(identifierResults: SearchIdentifiersResponse) {
  if (identifierResults.length === 0) {
    return null;
  }
  
  // Get the first (best match) UniProt accession
  const primaryAccession = identifierResults[0].uniprotAccession;
  
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
      involvementInDisease: uniprotProteins.involvementInDisease,
      postTranslationalModification: uniprotProteins.postTranslationalModification,
      ecNumber: uniprotProteins.ecNumber,
      geneOntology: uniprotProteins.geneOntology,
      transmembrane: uniprotProteins.transmembrane,
      pathway: uniprotProteins.pathway,
      activityRegulation: uniprotProteins.activityRegulation,
      pubmedId: uniprotProteins.pubmedId,
      ensembl: uniprotProteins.ensembl,
      kegg: uniprotProteins.kegg,
      pdb: uniprotProteins.pdb,
      chembl: uniprotProteins.chembl,
      alphafolddb: uniprotProteins.alphafolddb,
    })
    .from(uniprotProteins)
    .where(eq(uniprotProteins.entry, primaryAccession))
    .limit(1);
    
  return result[0] || null;
}

export type GetProteinInformationResponse = Awaited<
  ReturnType<typeof getProteinInformation>
>;