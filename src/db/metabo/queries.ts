"use server"

import { eq, ilike } from "drizzle-orm";
import { metaboClient, metaboDB } from ".";
import {
  canonicalStructuresInGold,
  compoundIdentifiersInGold,
  compoundsInGold
} from "./schema";

export interface CompoundSearchResult {
  canonicalId: string;
  canonicalSmiles: string;
  inchikey: string | null;
  formula: string | null;
  molecularWeight: number | null;
  exactMass: number | null;
  logp: number | null;
  hbd: number | null;
  hba: number | null;
  tpsa: number | null;
  isDrug: boolean | null;
  isLipid: boolean | null;
  isMetabolite: boolean | null;
  identifiers?: Array<{
    type: string;
    value: string;
  }>;
}

export interface SearchFilters {
  molecularWeightMin?: number;
  molecularWeightMax?: number;
  logpMin?: number;
  logpMax?: number;
  isDrug?: boolean;
  isLipid?: boolean;
  isMetabolite?: boolean;
  lipinskiCompliant?: boolean;
}

export async function searchCompounds(
  query: string,
  limit: number = 20,
  offset: number = 0,
  filters?: SearchFilters
): Promise<CompoundSearchResult[]> {
  // Always search identifiers first
  const identifierMatches = await getCompoundAutocomplete(query, limit);

  if (identifierMatches.length > 0) {
    // Get compound details for all identifier matches
    const results = [];
    for (const match of identifierMatches) {
      if (match.canonicalId) {
        const compoundDetails = await getCompoundDetails(match.canonicalId);
        if (compoundDetails) {
          results.push(compoundDetails);
        }
      }
    }
    return results;
  }

  return [];
}

export async function searchCompoundByCanonicalId(canonicalId: string): Promise<CompoundSearchResult[]> {
  // Fast direct lookup by canonical ID
  const compoundDetails = await getCompoundDetails(canonicalId);
  return compoundDetails ? [compoundDetails] : [];
}

export async function searchCompoundsByText(
  query: string,
  limit: number = 20,
  offset: number = 0,
  filters?: SearchFilters
): Promise<CompoundSearchResult[]> {
  // Use raw SQL for better performance with complex joins and filtering
  let whereConditions = [];
  let params: any[] = [];
  let paramIndex = 1;

  // Text search conditions
  if (query.trim()) {
    whereConditions.push(`(
      ci.identifier_value ILIKE $${paramIndex} OR
      cs.inchikey ILIKE $${paramIndex} OR
      cs.canonical_smiles ILIKE $${paramIndex} OR
      cs.formula ILIKE $${paramIndex}
    )`);
    params.push(`%${query.trim()}%`);
    paramIndex++;
  }

  // Apply filters
  if (filters) {
    if (filters.molecularWeightMin !== undefined) {
      whereConditions.push(`cs.molecular_weight >= $${paramIndex}`);
      params.push(filters.molecularWeightMin);
      paramIndex++;
    }
    if (filters.molecularWeightMax !== undefined) {
      whereConditions.push(`cs.molecular_weight <= $${paramIndex}`);
      params.push(filters.molecularWeightMax);
      paramIndex++;
    }
    if (filters.logpMin !== undefined) {
      whereConditions.push(`cs.logp >= $${paramIndex}`);
      params.push(filters.logpMin);
      paramIndex++;
    }
    if (filters.logpMax !== undefined) {
      whereConditions.push(`cs.logp <= $${paramIndex}`);
      params.push(filters.logpMax);
      paramIndex++;
    }
    if (filters.isDrug !== undefined) {
      whereConditions.push(`c.is_drug = $${paramIndex}`);
      params.push(filters.isDrug);
      paramIndex++;
    }
    if (filters.isLipid !== undefined) {
      whereConditions.push(`c.is_lipid = $${paramIndex}`);
      params.push(filters.isLipid);
      paramIndex++;
    }
    if (filters.isMetabolite !== undefined) {
      whereConditions.push(`c.is_metabolite = $${paramIndex}`);
      params.push(filters.isMetabolite);
      paramIndex++;
    }
    if (filters.lipinskiCompliant) {
      whereConditions.push(`(
        cs.molecular_weight <= 500 AND
        cs.logp <= 5 AND
        cs.hbd <= 5 AND
        cs.hba <= 10
      )`);
    }
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query_sql = `
    SELECT DISTINCT
      cs.canonical_id,
      cs.canonical_smiles,
      cs.inchikey,
      cs.formula,
      cs.molecular_weight,
      cs.exact_mass,
      cs.logp,
      cs.hbd,
      cs.hba,
      cs.tpsa,
      c.is_drug,
      c.is_lipid,
      c.is_metabolite
    FROM gold.canonical_structures cs
    LEFT JOIN gold.compounds c ON cs.canonical_id = c.canonical_id
    LEFT JOIN gold.compound_identifiers ci ON c.compound_id = ci.compound_id
    ${whereClause}
    ORDER BY cs.molecular_weight NULLS LAST
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);

  const results = await metaboClient.unsafe(query_sql, params);

  return results.map((row: any) => ({
    canonicalId: row.canonical_id.toString(),
    canonicalSmiles: row.canonical_smiles,
    inchikey: row.inchikey,
    formula: row.formula,
    molecularWeight: row.molecular_weight,
    exactMass: row.exact_mass,
    logp: row.logp,
    hbd: row.hbd,
    hba: row.hba,
    tpsa: row.tpsa,
    isDrug: row.is_drug,
    isLipid: row.is_lipid,
    isMetabolite: row.is_metabolite,
  }));
}

export async function searchCompoundsBySubstructure(
  smiles: string,
  limit: number = 20,
  offset: number = 0,
  filters?: SearchFilters
): Promise<CompoundSearchResult[]> {
  try {
    // First validate the SMILES string
    const validateQuery = `SELECT mol_from_smiles($1) IS NOT NULL as valid`;
    const validationResult = await metaboClient.unsafe(validateQuery, [smiles]);

    if (!validationResult[0]?.valid) {
      console.warn(`Invalid SMILES pattern: ${smiles}`);
      // Fallback to text search for invalid SMILES
      return searchCompounds(smiles, limit, offset, filters);
    }

    // Use raw SQL for RDKit substructure search with proper casting
    let whereClause = `cs.mol @> mol_from_smiles($1)`;
    const params: any[] = [smiles];
    let paramIndex = 2;

    // Add filters to WHERE clause
    if (filters) {
      if (filters.molecularWeightMin !== undefined) {
        whereClause += ` AND cs.molecular_weight >= $${paramIndex}`;
        params.push(filters.molecularWeightMin);
        paramIndex++;
      }
      if (filters.molecularWeightMax !== undefined) {
        whereClause += ` AND cs.molecular_weight <= $${paramIndex}`;
        params.push(filters.molecularWeightMax);
        paramIndex++;
      }
      if (filters.logpMin !== undefined) {
        whereClause += ` AND cs.logp >= $${paramIndex}`;
        params.push(filters.logpMin);
        paramIndex++;
      }
      if (filters.logpMax !== undefined) {
        whereClause += ` AND cs.logp <= $${paramIndex}`;
        params.push(filters.logpMax);
        paramIndex++;
      }
      if (filters.isDrug !== undefined) {
        whereClause += ` AND c.is_drug = $${paramIndex}`;
        params.push(filters.isDrug);
        paramIndex++;
      }
      if (filters.isLipid !== undefined) {
        whereClause += ` AND c.is_lipid = $${paramIndex}`;
        params.push(filters.isLipid);
        paramIndex++;
      }
      if (filters.isMetabolite !== undefined) {
        whereClause += ` AND c.is_metabolite = $${paramIndex}`;
        params.push(filters.isMetabolite);
        paramIndex++;
      }
      if (filters.lipinskiCompliant) {
        whereClause += ` AND cs.molecular_weight <= 500 AND cs.logp <= 5 AND cs.hbd <= 5 AND cs.hba <= 10`;
      }
    }

    const query = `
      SELECT
        cs.canonical_id,
        cs.canonical_smiles,
        cs.inchikey,
        cs.formula,
        cs.molecular_weight,
        cs.exact_mass,
        cs.logp,
        cs.hbd,
        cs.hba,
        cs.tpsa,
        c.is_drug,
        c.is_lipid,
        c.is_metabolite
      FROM gold.canonical_structures cs
      LEFT JOIN gold.compounds c ON cs.canonical_id = c.canonical_id
      WHERE ${whereClause}
      ORDER BY cs.molecular_weight
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const results = await metaboClient.unsafe(query, params);

    return results.map((row: any) => ({
      canonicalId: row.canonical_id.toString(),
      canonicalSmiles: row.canonical_smiles,
      inchikey: row.inchikey,
      formula: row.formula,
      molecularWeight: row.molecular_weight,
      exactMass: row.exact_mass,
      logp: row.logp,
      hbd: row.hbd,
      hba: row.hba,
      tpsa: row.tpsa,
      isDrug: row.is_drug,
      isLipid: row.is_lipid,
      isMetabolite: row.is_metabolite,
    }));
  } catch (error) {
    console.error('Substructure search error:', error);
    // Fallback to text search if RDKit operations fail
    return searchCompounds(smiles, limit, offset, filters);
  }
}

export async function searchCompoundsBySimilarity(
  smiles: string,
  threshold: number = 0.7,
  limit: number = 20,
  offset: number = 0,
  filters?: SearchFilters
): Promise<(CompoundSearchResult & { similarity: number })[]> {
  try {
    // First validate the SMILES string
    const validateQuery = `SELECT mol_from_smiles($1) IS NOT NULL as valid`;
    const validationResult = await metaboClient.unsafe(validateQuery, [smiles]);

    if (!validationResult[0]?.valid) {
      console.warn(`Invalid SMILES pattern: ${smiles}`);
      // Fallback to text search for invalid SMILES
      const fallbackResults = await searchCompounds(smiles, limit, offset, filters);
      return fallbackResults.map(result => ({ ...result, similarity: 0 }));
    }

    // Build filter conditions for the CTE
    let filterConditions = [];
    const params: any[] = [smiles, threshold];
    let paramIndex = 3;

    if (filters) {
      if (filters.molecularWeightMin !== undefined) {
        filterConditions.push(`cs.molecular_weight >= $${paramIndex}`);
        params.push(filters.molecularWeightMin);
        paramIndex++;
      }
      if (filters.molecularWeightMax !== undefined) {
        filterConditions.push(`cs.molecular_weight <= $${paramIndex}`);
        params.push(filters.molecularWeightMax);
        paramIndex++;
      }
      if (filters.logpMin !== undefined) {
        filterConditions.push(`cs.logp >= $${paramIndex}`);
        params.push(filters.logpMin);
        paramIndex++;
      }
      if (filters.logpMax !== undefined) {
        filterConditions.push(`cs.logp <= $${paramIndex}`);
        params.push(filters.logpMax);
        paramIndex++;
      }
      if (filters.isDrug !== undefined) {
        filterConditions.push(`c.is_drug = $${paramIndex}`);
        params.push(filters.isDrug);
        paramIndex++;
      }
      if (filters.isLipid !== undefined) {
        filterConditions.push(`c.is_lipid = $${paramIndex}`);
        params.push(filters.isLipid);
        paramIndex++;
      }
      if (filters.isMetabolite !== undefined) {
        filterConditions.push(`c.is_metabolite = $${paramIndex}`);
        params.push(filters.isMetabolite);
        paramIndex++;
      }
      if (filters.lipinskiCompliant) {
        filterConditions.push(`cs.molecular_weight <= 500 AND cs.logp <= 5 AND cs.hbd <= 5 AND cs.hba <= 10`);
      }
    }

    const additionalFilters = filterConditions.length > 0 ? ` AND ${filterConditions.join(' AND ')}` : '';

    const query = `
      WITH similarity_calc AS (
        SELECT
          cs.canonical_id,
          cs.canonical_smiles,
          cs.inchikey,
          cs.formula,
          cs.molecular_weight,
          cs.exact_mass,
          cs.logp,
          cs.hbd,
          cs.hba,
          cs.tpsa,
          c.is_drug,
          c.is_lipid,
          c.is_metabolite,
          tanimoto_sml(cs.morgan_fp, morganbv_fp(mol_from_smiles($1))) as similarity
        FROM gold.canonical_structures cs
        LEFT JOIN gold.compounds c ON cs.canonical_id = c.canonical_id
        WHERE cs.mol IS NOT NULL${additionalFilters}
      )
      SELECT *
      FROM similarity_calc
      WHERE similarity > $2
      ORDER BY similarity DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const results = await metaboClient.unsafe(query, params);

    return results.map((row: any) => ({
      canonicalId: row.canonical_id.toString(),
      canonicalSmiles: row.canonical_smiles,
      inchikey: row.inchikey,
      formula: row.formula,
      molecularWeight: row.molecular_weight,
      exactMass: row.exact_mass,
      logp: row.logp,
      hbd: row.hbd,
      hba: row.hba,
      tpsa: row.tpsa,
      isDrug: row.is_drug,
      isLipid: row.is_lipid,
      isMetabolite: row.is_metabolite,
      similarity: row.similarity,
    }));
  } catch (error) {
    console.error('Similarity search error:', error);
    // Fallback to text search if RDKit operations fail
    const fallbackResults = await searchCompounds(smiles, limit, offset, filters);
    return fallbackResults.map(result => ({ ...result, similarity: 0 }));
  }
}

export async function getCompoundAutocomplete(
  query: string,
  limit: number = 10
): Promise<Array<{ label: string; value: string; type: string; compoundId: string; canonicalId: string }>> {
  // Search in compound identifiers for autocomplete
  const results = await metaboDB
    .select({
      identifierValue: compoundIdentifiersInGold.identifierValue,
      identifierType: compoundIdentifiersInGold.identifierType,
      compoundId: compoundIdentifiersInGold.compoundId,
      canonicalId: compoundsInGold.canonicalId,
    })
    .from(compoundIdentifiersInGold)
    .leftJoin(compoundsInGold, eq(compoundIdentifiersInGold.compoundId, compoundsInGold.compoundId))
    .where(ilike(compoundIdentifiersInGold.identifierValue, `${query}%`))
    .orderBy(compoundIdentifiersInGold.identifierValue)
    .limit(limit);

  return results.map(row => ({
    label: row.identifierValue,
    value: row.identifierValue,
    type: row.identifierType,
    compoundId: row.compoundId.toString(),
    canonicalId: row.canonicalId?.toString() || '',
  }));
}

export async function getCompoundDetails(canonicalId: string): Promise<CompoundSearchResult & { identifiers: Array<{ type: string; value: string }> } | null> {
  // Get main compound data
  const compound = await metaboDB
    .select({
      canonicalId: canonicalStructuresInGold.canonicalId,
      canonicalSmiles: canonicalStructuresInGold.canonicalSmiles,
      inchikey: canonicalStructuresInGold.inchikey,
      formula: canonicalStructuresInGold.formula,
      molecularWeight: canonicalStructuresInGold.molecularWeight,
      exactMass: canonicalStructuresInGold.exactMass,
      logp: canonicalStructuresInGold.logp,
      hbd: canonicalStructuresInGold.hbd,
      hba: canonicalStructuresInGold.hba,
      tpsa: canonicalStructuresInGold.tpsa,
      isDrug: compoundsInGold.isDrug,
      isLipid: compoundsInGold.isLipid,
      isMetabolite: compoundsInGold.isMetabolite,
    })
    .from(canonicalStructuresInGold)
    .leftJoin(compoundsInGold, eq(canonicalStructuresInGold.canonicalId, compoundsInGold.canonicalId))
    .where(eq(canonicalStructuresInGold.canonicalId, BigInt(canonicalId)))
    .limit(1);

  if (compound.length === 0) return null;

  // Get all identifiers for this compound
  const identifiers = await metaboDB
    .select({
      type: compoundIdentifiersInGold.identifierType,
      value: compoundIdentifiersInGold.identifierValue,
    })
    .from(compoundIdentifiersInGold)
    .leftJoin(compoundsInGold, eq(compoundIdentifiersInGold.compoundId, compoundsInGold.compoundId))
    .where(eq(compoundsInGold.canonicalId, Number(canonicalId)));

  const result = compound[0];
  return {
    canonicalId: result.canonicalId.toString(),
    canonicalSmiles: result.canonicalSmiles,
    inchikey: result.inchikey,
    formula: result.formula,
    molecularWeight: result.molecularWeight,
    exactMass: result.exactMass,
    logp: result.logp,
    hbd: result.hbd,
    hba: result.hba,
    tpsa: result.tpsa,
    isDrug: result.isDrug,
    isLipid: result.isLipid,
    isMetabolite: result.isMetabolite,
    identifiers: identifiers,
  };
}

export type CompoundAutocompleteResponse = Awaited<ReturnType<typeof getCompoundAutocomplete>>;
export type CompoundDetailsResponse = Awaited<ReturnType<typeof getCompoundDetails>>;
export type CompoundSearchResponse = Awaited<ReturnType<typeof searchCompounds>>;
export type SubstructureSearchResponse = Awaited<ReturnType<typeof searchCompoundsBySubstructure>>;
export type SimilaritySearchResponse = Awaited<ReturnType<typeof searchCompoundsBySimilarity>>;