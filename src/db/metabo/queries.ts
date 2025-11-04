"use server"

import { sql } from "drizzle-orm";
import { metaboClient, metaboDB } from ".";
import {
  entityIdentifiers,
} from "./schema";

export interface IdentifierInfo {
  type: string;
  typeAccession?: string;
  value: string;
}

export interface CompoundSearchResult {
  id: string;
  entityId: string;
  canonicalSmiles: string | null;
  inchi: string | null;
  formula: string | null;
  molecularWeight: number | null;
  exactMass: number | null;
  logp: number | null;
  hbd: number | null;
  hba: number | null;
  tpsa: number | null;
  rotatableBonds: number | null;
  aromaticRings: number | null;
  heavyAtoms: number | null;
  identifiers?: IdentifierInfo[];
}

export interface SearchFilters {
  molecularWeightMin?: number;
  molecularWeightMax?: number;
  logpMin?: number;
  logpMax?: number;
  lipinskiCompliant?: boolean;
}

export async function searchCompounds(
  query: string,
  limit: number = 20,
  offset: number = 0,
  filters?: SearchFilters
): Promise<CompoundSearchResult[]> {
  const startTime = Date.now();
  console.log(`[Search] Starting search for "${query}"`);

  // Ensure type cache is loaded
  const cacheStart = Date.now();
  await initializeTypeCache();
  console.log(`[Search] Cache init took ${Date.now() - cacheStart}ms`);

  // Search by identifiers first using prefix search
  const autocompleteStart = Date.now();
  const identifierMatches = await getCompoundAutocomplete(query, limit);
  console.log(`[Search] Autocomplete took ${Date.now() - autocompleteStart}ms, found ${identifierMatches.length} matches`);

  if (identifierMatches.length > 0) {
    // Batch load all compound details in a single query
    const entityIds = identifierMatches
      .map(m => m.entityId)
      .filter(Boolean)
      .map(id => Number(id));

    if (entityIds.length === 0) {
      console.log(`[Search] No valid entity IDs, falling back to text search`);
      return searchCompoundsByText(query, limit, offset, filters);
    }

    // Build filter conditions
    let filterConditions = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters) {
      const conditions = [];
      if (filters.molecularWeightMin !== undefined) {
        conditions.push(`c.molecular_weight >= $${paramIndex}`);
        params.push(filters.molecularWeightMin);
        paramIndex++;
      }
      if (filters.molecularWeightMax !== undefined) {
        conditions.push(`c.molecular_weight <= $${paramIndex}`);
        params.push(filters.molecularWeightMax);
        paramIndex++;
      }
      if (filters.logpMin !== undefined) {
        conditions.push(`c.logp >= $${paramIndex}`);
        params.push(filters.logpMin);
        paramIndex++;
      }
      if (filters.logpMax !== undefined) {
        conditions.push(`c.logp <= $${paramIndex}`);
        params.push(filters.logpMax);
        paramIndex++;
      }
      if (filters.lipinskiCompliant) {
        conditions.push('c.molecular_weight <= 500 AND c.logp <= 5 AND c.hbd <= 5 AND c.hba <= 10');
      }
      if (conditions.length > 0) {
        filterConditions = ' AND ' + conditions.join(' AND ');
      }
    }

    // Single query to get all compounds with their identifiers
    const batchQuery = `
      SELECT
        c.id,
        ec.entity_id,
        c.canonical_smiles,
        c.inchi,
        c.formula,
        c.molecular_weight,
        c.exact_mass,
        c.logp,
        c.hbd,
        c.hba,
        c.tpsa,
        c.rotatable_bonds,
        c.aromatic_rings,
        c.heavy_atoms,
        json_agg(
          json_build_object(
            'type_id', ei.id_type_id,
            'value', ei.id_value
          ) ORDER BY ei.id_value
        ) FILTER (WHERE ei.id_value IS NOT NULL) as identifiers
      FROM compound c
      INNER JOIN entity_compound ec ON c.id = ec.compound_id
      LEFT JOIN entity_identifiers ei ON ec.entity_id = ei.entity_id
      WHERE ec.entity_id = ANY($${paramIndex})${filterConditions}
      GROUP BY c.id, ec.entity_id, c.canonical_smiles, c.inchi, c.formula, c.molecular_weight, c.exact_mass,
               c.logp, c.hbd, c.hba, c.tpsa, c.rotatable_bonds, c.aromatic_rings, c.heavy_atoms
      ORDER BY c.molecular_weight
      LIMIT ${limit}
    `;

    params.push(entityIds);

    const batchStart = Date.now();
    const results = await metaboClient.unsafe(batchQuery, params);
    console.log(`[Search] Batch query for ${entityIds.length} entities took ${Date.now() - batchStart}ms, returned ${results.length} compounds`);

    const finalResults = results.map((row: any) => ({
      id: row.id.toString(),
      entityId: row.entity_id?.toString() || '',
      canonicalSmiles: row.canonical_smiles,
      inchi: row.inchi,
      formula: row.formula,
      molecularWeight: row.molecular_weight,
      exactMass: row.exact_mass,
      logp: row.logp,
      hbd: row.hbd ? Number(row.hbd) : null,
      hba: row.hba ? Number(row.hba) : null,
      tpsa: row.tpsa,
      rotatableBonds: row.rotatable_bonds ? Number(row.rotatable_bonds) : null,
      aromaticRings: row.aromatic_rings ? Number(row.aromatic_rings) : null,
      heavyAtoms: row.heavy_atoms ? Number(row.heavy_atoms) : null,
      identifiers: mapIdentifiers(row.identifiers || []),
    }));

    console.log(`[Search] Total search time: ${Date.now() - startTime}ms`);
    return finalResults;
  }

  // Fallback to text search if no identifier matches
  console.log(`[Search] No identifier matches, falling back to text search`);
  const textResults = await searchCompoundsByText(query, limit, offset, filters);
  console.log(`[Search] Total search time: ${Date.now() - startTime}ms`);
  return textResults;
}

export async function searchCompoundByEntityId(entityId: string): Promise<CompoundSearchResult[]> {
  // Fast direct lookup by entity ID
  const compoundDetails = await getCompoundByEntityId(entityId);
  return compoundDetails ? [compoundDetails] : [];
}

export async function searchCompoundsByText(
  query: string,
  limit: number = 20,
  offset: number = 0,
  filters?: SearchFilters
): Promise<CompoundSearchResult[]> {
  // Ensure type cache is loaded
  await initializeTypeCache();

  const searchQuery = query.trim().toUpperCase();

  // Build filter conditions for the query
  let filterConditions = '';
  const params: any[] = [searchQuery];
  let paramIndex = 2;

  if (filters) {
    const conditions = [];
    if (filters.molecularWeightMin !== undefined) {
      conditions.push(`c.molecular_weight >= $${paramIndex}`);
      params.push(filters.molecularWeightMin);
      paramIndex++;
    }
    if (filters.molecularWeightMax !== undefined) {
      conditions.push(`c.molecular_weight <= $${paramIndex}`);
      params.push(filters.molecularWeightMax);
      paramIndex++;
    }
    if (filters.logpMin !== undefined) {
      conditions.push(`c.logp >= $${paramIndex}`);
      params.push(filters.logpMin);
      paramIndex++;
    }
    if (filters.logpMax !== undefined) {
      conditions.push(`c.logp <= $${paramIndex}`);
      params.push(filters.logpMax);
      paramIndex++;
    }
    if (filters.lipinskiCompliant) {
      conditions.push('c.molecular_weight <= 500 AND c.logp <= 5 AND c.hbd <= 5 AND c.hba <= 10');
    }
    if (conditions.length > 0) {
      filterConditions = ' AND ' + conditions.join(' AND ');
    }
  }

  // Optimized query:
  // 1. Use prefix search on identifiers (can use text_pattern_ops index)
  // 2. Use exact match or prefix on formula (formulas are typically short)
  // 3. Pre-filter compounds before the expensive joins
  // 4. Apply LIMIT early to reduce rows before aggregation
  const textSearchQuery = `
    WITH matching_entities AS (
      -- Find entity IDs that match the search prefix
      SELECT DISTINCT ei.entity_id
      FROM entity_identifiers ei
      WHERE ei.id_value_small ILIKE $1 || '%'
      LIMIT ${limit * 2}
    ),
    matching_compounds AS (
      -- Get compounds for matching entities, or compounds with matching formula
      SELECT DISTINCT
        c.id,
        ec.entity_id,
        c.canonical_smiles,
        c.inchi,
        c.formula,
        c.molecular_weight,
        c.exact_mass,
        c.logp,
        c.hbd,
        c.hba,
        c.tpsa,
        c.rotatable_bonds,
        c.aromatic_rings,
        c.heavy_atoms
      FROM compound c
      INNER JOIN entity_compound ec ON c.id = ec.compound_id
      WHERE (
        ec.entity_id IN (SELECT entity_id FROM matching_entities)
        OR c.formula ILIKE $1 || '%'
        OR c.formula ILIKE '%' || $1
      )${filterConditions}
      ORDER BY c.molecular_weight
      LIMIT ${limit}
      OFFSET ${offset}
    )
    SELECT
      mc.*,
      json_agg(
        json_build_object(
          'type_id', ei.id_type_id,
          'value', ei.id_value
        ) ORDER BY ei.id_value
      ) FILTER (WHERE ei.id_value IS NOT NULL) as identifiers
    FROM matching_compounds mc
    LEFT JOIN entity_identifiers ei ON mc.entity_id = ei.entity_id
    GROUP BY mc.id, mc.entity_id, mc.canonical_smiles, mc.inchi, mc.formula, mc.molecular_weight, mc.exact_mass,
             mc.logp, mc.hbd, mc.hba, mc.tpsa, mc.rotatable_bonds, mc.aromatic_rings, mc.heavy_atoms
    ORDER BY mc.molecular_weight
  `;

  const results = await metaboClient.unsafe(textSearchQuery, params);

  return results.map((row: any) => ({
    id: row.id.toString(),
    entityId: row.entity_id?.toString() || '',
    canonicalSmiles: row.canonical_smiles,
    inchi: row.inchi,
    formula: row.formula,
    molecularWeight: row.molecular_weight,
    exactMass: row.exact_mass,
    logp: row.logp,
    hbd: row.hbd ? Number(row.hbd) : null,
    hba: row.hba ? Number(row.hba) : null,
    tpsa: row.tpsa,
    rotatableBonds: row.rotatable_bonds ? Number(row.rotatable_bonds) : null,
    aromaticRings: row.aromatic_rings ? Number(row.aromatic_rings) : null,
    heavyAtoms: row.heavy_atoms ? Number(row.heavy_atoms) : null,
    identifiers: mapIdentifiers(row.identifiers || []),
  }));
}

export async function searchCompoundsBySubstructure(
  smiles: string,
  limit: number = 20,
  offset: number = 0,
  filters?: SearchFilters
): Promise<CompoundSearchResult[]> {
  const startTime = Date.now();
  console.log(`[Substructure] Starting search for "${smiles}"`);

  try {
    // Ensure type cache is loaded
    await initializeTypeCache();

    // First validate the SMILES string
    const validateStart = Date.now();
    const validateQuery = `SELECT mol_from_smiles($1) IS NOT NULL as valid`;
    const validationResult = await metaboClient.unsafe(validateQuery, [smiles]);
    console.log(`[Substructure] Validation took ${Date.now() - validateStart}ms`);

    if (!validationResult[0]?.valid) {
      console.warn(`Invalid SMILES pattern: ${smiles}`);
      // Fallback to text search for invalid SMILES
      return searchCompounds(smiles, limit, offset, filters);
    }

    // Build filter conditions
    let whereClause = `c.mol @> mol_from_smiles($1)`;
    const params: any[] = [smiles];
    let paramIndex = 2;

    // Add filters to WHERE clause
    if (filters) {
      if (filters.molecularWeightMin !== undefined) {
        whereClause += ` AND c.molecular_weight >= $${paramIndex}`;
        params.push(filters.molecularWeightMin);
        paramIndex++;
      }
      if (filters.molecularWeightMax !== undefined) {
        whereClause += ` AND c.molecular_weight <= $${paramIndex}`;
        params.push(filters.molecularWeightMax);
        paramIndex++;
      }
      if (filters.logpMin !== undefined) {
        whereClause += ` AND c.logp >= $${paramIndex}`;
        params.push(filters.logpMin);
        paramIndex++;
      }
      if (filters.logpMax !== undefined) {
        whereClause += ` AND c.logp <= $${paramIndex}`;
        params.push(filters.logpMax);
        paramIndex++;
      }
      if (filters.lipinskiCompliant) {
        whereClause += ` AND c.molecular_weight <= 500 AND c.logp <= 5 AND c.hbd <= 5 AND c.hba <= 10`;
      }
    }

    // Optimized query: use single query with json_agg to get all data at once
    const query = `
      SELECT
        c.id,
        ec.entity_id,
        c.canonical_smiles,
        c.inchi,
        c.formula,
        c.molecular_weight,
        c.exact_mass,
        c.logp,
        c.hbd,
        c.hba,
        c.tpsa,
        c.rotatable_bonds,
        c.aromatic_rings,
        c.heavy_atoms,
        (
          SELECT json_agg(
            json_build_object(
              'type_id', ei.id_type_id,
              'value', ei.id_value
            )
          )
          FROM entity_identifiers ei
          WHERE ei.entity_id = ec.entity_id
        ) as identifiers
      FROM compound c
      LEFT JOIN entity_compound ec ON c.id = ec.compound_id
      WHERE ${whereClause}
      ORDER BY c.molecular_weight
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const queryStart = Date.now();
    const results = await metaboClient.unsafe(query, params);
    console.log(`[Substructure] Main query took ${Date.now() - queryStart}ms, returned ${results.length} compounds`);

    const finalResults = results.map((row: any) => ({
      id: row.id.toString(),
      entityId: row.entity_id?.toString() || '',
      canonicalSmiles: row.canonical_smiles,
      inchi: row.inchi,
      formula: row.formula,
      molecularWeight: row.molecular_weight,
      exactMass: row.exact_mass,
      logp: row.logp,
      hbd: row.hbd,
      hba: row.hba,
      tpsa: row.tpsa,
      rotatableBonds: row.rotatable_bonds,
      aromaticRings: row.aromatic_rings,
      heavyAtoms: row.heavy_atoms,
      identifiers: mapIdentifiers(row.identifiers || []),
    }));

    console.log(`[Substructure] Total time: ${Date.now() - startTime}ms`);
    return finalResults;
  } catch (error) {
    console.error('Substructure search error:', error);
    // Fallback to text search if RDKit operations fail
    return searchCompounds(smiles, limit, offset, filters);
  }
}

export async function searchCompoundsBySimilarity(
  smiles: string,
  threshold: number = 0.3,
  limit: number = 20,
  offset: number = 0,
  filters?: SearchFilters
): Promise<(CompoundSearchResult & { similarity: number })[]> {
  const startTime = Date.now();
  console.log(`[Similarity] Starting search for "${smiles}" with threshold ${threshold}`);

  try {
    // Ensure type cache is loaded
    await initializeTypeCache();

    // First validate the SMILES string
    const validateStart = Date.now();
    const validateQuery = `SELECT mol_from_smiles($1) IS NOT NULL as valid`;
    const validationResult = await metaboClient.unsafe(validateQuery, [smiles]);
    console.log(`[Similarity] Validation took ${Date.now() - validateStart}ms`);

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
        filterConditions.push(`c.molecular_weight >= $${paramIndex}`);
        params.push(filters.molecularWeightMin);
        paramIndex++;
      }
      if (filters.molecularWeightMax !== undefined) {
        filterConditions.push(`c.molecular_weight <= $${paramIndex}`);
        params.push(filters.molecularWeightMax);
        paramIndex++;
      }
      if (filters.logpMin !== undefined) {
        filterConditions.push(`c.logp >= $${paramIndex}`);
        params.push(filters.logpMin);
        paramIndex++;
      }
      if (filters.logpMax !== undefined) {
        filterConditions.push(`c.logp <= $${paramIndex}`);
        params.push(filters.logpMax);
        paramIndex++;
      }
      if (filters.lipinskiCompliant) {
        filterConditions.push(`c.molecular_weight <= 500 AND c.logp <= 5 AND c.hbd <= 5 AND c.hba <= 10`);
      }
    }

    const additionalFilters = filterConditions.length > 0 ? ` AND ${filterConditions.join(' AND ')}` : '';

    // Optimized query: use pre-computed morgan_fp column with GiST index
    // The morgan_fp column is already computed, so we use it directly with the % operator
    // which leverages the idx_compound_morgan_fp_gist index
    const query = `
      WITH query_fp AS (
        SELECT morganbv_fp(mol_from_smiles($1)) as query_fp
      ),
      similar_compounds AS (
        SELECT
          c.id,
          ec.entity_id,
          c.canonical_smiles,
          c.inchi,
          c.formula,
          c.molecular_weight,
          c.exact_mass,
          c.logp,
          c.hbd,
          c.hba,
          c.tpsa,
          c.rotatable_bonds,
          c.aromatic_rings,
          c.heavy_atoms,
          tanimoto_sml(c.morgan_fp, query_fp.query_fp) as similarity
        FROM compound c
        LEFT JOIN entity_compound ec ON c.id = ec.compound_id
        CROSS JOIN query_fp
        WHERE c.morgan_fp IS NOT NULL${additionalFilters}
          AND c.morgan_fp % query_fp.query_fp
        ORDER BY tanimoto_sml(c.morgan_fp, query_fp.query_fp) DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      )
      SELECT
        sc.*,
        (
          SELECT json_agg(
            json_build_object(
              'type_id', ei.id_type_id,
              'value', ei.id_value
            )
          )
          FROM entity_identifiers ei
          WHERE ei.entity_id = sc.entity_id
        ) as identifiers
      FROM similar_compounds sc
      WHERE sc.similarity >= $2
      ORDER BY sc.similarity DESC
    `;

    params.push(limit, offset);

    const queryStart = Date.now();
    const results = await metaboClient.unsafe(query, params);
    console.log(`[Similarity] Main query took ${Date.now() - queryStart}ms, returned ${results.length} compounds`);

    const finalResults = results.map((row: any) => ({
      id: row.id.toString(),
      entityId: row.entity_id?.toString() || '',
      canonicalSmiles: row.canonical_smiles,
      inchi: row.inchi,
      formula: row.formula,
      molecularWeight: row.molecular_weight,
      exactMass: row.exact_mass,
      logp: row.logp,
      hbd: row.hbd,
      hba: row.hba,
      tpsa: row.tpsa,
      rotatableBonds: row.rotatable_bonds,
      aromaticRings: row.aromatic_rings,
      heavyAtoms: row.heavy_atoms,
      similarity: row.similarity,
      identifiers: mapIdentifiers(row.identifiers || []),
    }));

    console.log(`[Similarity] Total time: ${Date.now() - startTime}ms`);
    return finalResults;
  } catch (error) {
    console.error('Similarity search error:', error);
    // Fallback to text search if RDKit operations fail
    const fallbackResults = await searchCompounds(smiles, limit, offset, filters);
    return fallbackResults.map(result => ({ ...result, similarity: 0 }));
  }
}

async function getCompoundIdentifiersByEntityIds(entityIds: string[]): Promise<Map<string, IdentifierInfo[]>> {
  if (entityIds.length === 0) return new Map();

  // Ensure type cache is loaded
  await initializeTypeCache();

  const entityIdNumbers = entityIds.map(id => Number(id)).filter(id => !isNaN(id));

  if (entityIdNumbers.length === 0) return new Map();

  const results = await metaboDB
    .select({
      entityId: entityIdentifiers.entityId,
      idTypeId: entityIdentifiers.idTypeId,
      idValue: entityIdentifiers.idValue,
    })
    .from(entityIdentifiers)
    .where(sql`${entityIdentifiers.entityId} = ANY(ARRAY[${sql.join(entityIdNumbers.map(id => sql`${id}::bigint`), sql`, `)}])`);

  // Group identifiers by entity ID using cached type names and accessions
  const identifierMap = new Map<string, IdentifierInfo[]>();

  for (const row of results) {
    const entityId = row.entityId?.toString();
    if (!entityId || !row.idValue) continue;

    if (!identifierMap.has(entityId)) {
      identifierMap.set(entityId, []);
    }

    identifierMap.get(entityId)!.push(
      mapIdentifier(row.idTypeId, row.idValue)
    );
  }

  return identifierMap;
}

// Cache for identifier type names (maps type ID to name)
// This cache is now populated from CV terms for better consistency
const typeNameCache = new Map<number, string>();
const typeAccessionCache = new Map<number, string>();
let typeCacheInitialized = false;

async function initializeTypeCache() {
  if (typeCacheInitialized) return;

  try {
    const startTime = Date.now();
    console.log('[TypeCache] Initializing type cache from CV terms...');

    // Initialize CV term cache first
    await initializeCvTermCache();

    // Populate type caches from CV term cache
    const cvTerms = await getAllCvTerms();

    for (const term of cvTerms) {
      const entityId = Number(term.entityId);
      if (!isNaN(entityId)) {
        typeNameCache.set(entityId, term.name);
        typeAccessionCache.set(entityId, term.accession);
      }
    }

    typeCacheInitialized = true;
    console.log(`[TypeCache] Initialized ${typeNameCache.size} types in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('Failed to initialize type cache:', error);
  }
}

// Helper function to map identifier data from DB to IdentifierInfo
function mapIdentifier(typeId: number | null | undefined, value: string | null | undefined): IdentifierInfo {
  const type = typeId ? typeNameCache.get(Number(typeId)) || 'unknown' : 'unknown';
  const typeAccession = typeId ? typeAccessionCache.get(Number(typeId)) : undefined;
  return {
    type,
    typeAccession,
    value: value || '',
  };
}

// Helper function to map array of identifiers from DB
function mapIdentifiers(identifiers: any[]): IdentifierInfo[] {
  return identifiers.map((i: any) => mapIdentifier(i.type_id, i.value));
}

// Cache for CV terms (maps entity ID to CV term details)
export interface CvTerm {
  entityId: string;
  name: string;
  accession: string;
  synonyms: string[];
}

const cvTermCache = new Map<string, CvTerm>();
let cvTermCacheInitialized = false;

async function initializeCvTermCache() {
  if (cvTermCacheInitialized) return;

  try {
    const startTime = Date.now();
    console.log('[CvTermCache] Initializing CV term cache...');

    // First find the entity IDs for the identifier types we need
    // Name: OM:0202, Synonym: OM:0203, CV Term Accession: OM:0204, Entity Type CV Term: OM:0012
    const accessionLookupQuery = `
      SELECT
        ei.entity_id,
        ei.id_value
      FROM entity_identifiers ei
      WHERE ei.id_value IN ('OM:0202', 'OM:0203', 'OM:0204', 'OM:0012')
    `;

    const accessionResults = await metaboClient.unsafe(accessionLookupQuery);

    let nameTypeId: number | null = null;
    let synonymTypeId: number | null = null;
    let accessionTypeId: number | null = null;
    let cvTermEntityTypeId: number | null = null;

    for (const row of accessionResults) {
      const entityId = Number(row.entity_id);
      switch (row.id_value) {
        case 'OM:0202':
          nameTypeId = entityId;
          break;
        case 'OM:0203':
          synonymTypeId = entityId;
          break;
        case 'OM:0204':
          accessionTypeId = entityId;
          break;
        case 'OM:0012':
          cvTermEntityTypeId = entityId;
          break;
      }
    }

    if (!cvTermEntityTypeId) {
      console.warn('[CvTermCache] Could not find CV Term entity type (OM:0012)');
      cvTermCacheInitialized = true;
      return;
    }

    console.log(`[CvTermCache] Found type IDs - Name: ${nameTypeId}, Synonym: ${synonymTypeId}, Accession: ${accessionTypeId}, CV Term Type: ${cvTermEntityTypeId}`);

    // Now query all entities of type CV Term with their identifiers
    const cvTermQuery = `
      WITH cv_term_entities AS (
        SELECT entity_id
        FROM entity
        WHERE entity_type_id = $1
      )
      SELECT
        e.entity_id,
        ei.id_type_id,
        ei.id_value
      FROM cv_term_entities e
      LEFT JOIN entity_identifiers ei ON e.entity_id = ei.entity_id
      WHERE ei.id_type_id IN ($2, $3, $4)
      ORDER BY e.entity_id
    `;

    const cvTermResults = await metaboClient.unsafe(
      cvTermQuery,
      [cvTermEntityTypeId, nameTypeId, synonymTypeId, accessionTypeId].filter(id => id !== null)
    );

    // Group results by entity ID
    const cvTermMap = new Map<string, { name?: string; accession?: string; synonyms: string[] }>();

    for (const row of cvTermResults) {
      const entityId = row.entity_id?.toString();
      if (!entityId) continue;

      if (!cvTermMap.has(entityId)) {
        cvTermMap.set(entityId, { synonyms: [] });
      }

      const term = cvTermMap.get(entityId)!;
      const typeId = Number(row.id_type_id);

      if (typeId === nameTypeId && row.id_value) {
        term.name = row.id_value;
      } else if (typeId === synonymTypeId && row.id_value) {
        term.synonyms.push(row.id_value);
      } else if (typeId === accessionTypeId && row.id_value) {
        term.accession = row.id_value;
      }
    }

    // Populate the cache with complete CV terms
    Array.from(cvTermMap.entries()).forEach(([entityId, termData]) => {
      if (termData.name && termData.accession) {
        cvTermCache.set(entityId, {
          entityId,
          name: termData.name,
          accession: termData.accession,
          synonyms: termData.synonyms,
        });
      }
    });

    cvTermCacheInitialized = true;
    console.log(`[CvTermCache] Initialized ${cvTermCache.size} CV terms in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('Failed to initialize CV term cache:', error);
  }
}

export async function getCvTermByEntityId(entityId: string): Promise<CvTerm | null> {
  await initializeCvTermCache();
  return cvTermCache.get(entityId) || null;
}

export async function getAllCvTerms(): Promise<CvTerm[]> {
  await initializeCvTermCache();
  return Array.from(cvTermCache.values());
}

export async function searchCvTerms(query: string): Promise<CvTerm[]> {
  await initializeCvTermCache();
  const normalizedQuery = query.toLowerCase().trim();

  return Array.from(cvTermCache.values()).filter(term =>
    term.name.toLowerCase().includes(normalizedQuery) ||
    term.accession.toLowerCase().includes(normalizedQuery) ||
    term.synonyms.some(syn => syn.toLowerCase().includes(normalizedQuery))
  );
}

export async function getCompoundAutocomplete(
  query: string,
  limit: number = 10
): Promise<Array<{ label: string; value: string; type: string; entityId: string }>> {
  const startTime = Date.now();

  // Ensure type cache is loaded
  const cacheStart = Date.now();
  await initializeTypeCache();
  console.log(`[Autocomplete] Cache init took ${Date.now() - cacheStart}ms`);

  // Use prefix search with text_pattern_ops index
  // This leverages idx_entity_identifiers_value_small_pattern
  const normalizedQuery = query.trim();

  const queryStart = Date.now();

  // Use raw SQL with proper index usage
  // text_pattern_ops index only works with byte-pattern operators (LIKE, ~, etc)
  // For case-insensitive search, we try both the original case and lowercase
  // Most chemical IDs are stored in a consistent case format
  const querySQL = `
    SELECT
      id_value,
      id_type_id,
      entity_id
    FROM entity_identifiers
    WHERE (
      id_value_small LIKE $1
      OR id_value_small LIKE $2
    )
    ORDER BY id_value_small
    LIMIT $3
  `;

  // Try both original case and lowercase for better matches
  const pattern1 = `${normalizedQuery}%`;
  const pattern2 = `${normalizedQuery.toLowerCase()}%`;

  const results = await metaboClient.unsafe(querySQL, [pattern1, pattern2, limit]);
  console.log(`[Autocomplete] Query for "${normalizedQuery}" took ${Date.now() - queryStart}ms, found ${results.length} results`);

  const mapped = results.map((row: any) => ({
    label: row.id_value || '',
    value: row.id_value || '',
    type: row.id_type_id ? typeNameCache.get(Number(row.id_type_id)) || 'unknown' : 'unknown',
    entityId: row.entity_id?.toString() || '',
  }));

  console.log(`[Autocomplete] Total time: ${Date.now() - startTime}ms`);
  return mapped;
}

export async function getCompoundByEntityId(entityId: string): Promise<CompoundSearchResult & { identifiers: IdentifierInfo[] } | null> {
  // Ensure type cache is loaded
  await initializeTypeCache();

  const entityIdNumber = Number(entityId);

  // Single query to get compound data and identifiers using a join
  const query = `
    SELECT
      c.id,
      ec.entity_id,
      c.canonical_smiles,
      c.inchi,
      c.formula,
      c.molecular_weight,
      c.exact_mass,
      c.logp,
      c.hbd,
      c.hba,
      c.tpsa,
      c.rotatable_bonds,
      c.aromatic_rings,
      c.heavy_atoms,
      json_agg(
        json_build_object(
          'type_id', ei.id_type_id,
          'value', ei.id_value
        ) ORDER BY ei.id_value
      ) FILTER (WHERE ei.id_value IS NOT NULL) as identifiers
    FROM compound c
    INNER JOIN entity_compound ec ON c.id = ec.compound_id
    LEFT JOIN entity_identifiers ei ON ec.entity_id = ei.entity_id
    WHERE ec.entity_id = $1
    GROUP BY c.id, ec.entity_id, c.canonical_smiles, c.inchi, c.formula, c.molecular_weight, c.exact_mass,
             c.logp, c.hbd, c.hba, c.tpsa, c.rotatable_bonds, c.aromatic_rings, c.heavy_atoms
    LIMIT 1
  `;

  const results = await metaboClient.unsafe(query, [entityIdNumber]);

  if (results.length === 0) return null;

  const row: any = results[0];

  return {
    id: row.id.toString(),
    entityId: row.entity_id?.toString() || '',
    canonicalSmiles: row.canonical_smiles,
    inchi: row.inchi,
    formula: row.formula,
    molecularWeight: row.molecular_weight,
    exactMass: row.exact_mass,
    logp: row.logp,
    hbd: row.hbd ? Number(row.hbd) : null,
    hba: row.hba ? Number(row.hba) : null,
    tpsa: row.tpsa,
    rotatableBonds: row.rotatable_bonds ? Number(row.rotatable_bonds) : null,
    aromaticRings: row.aromatic_rings ? Number(row.aromatic_rings) : null,
    heavyAtoms: row.heavy_atoms ? Number(row.heavy_atoms) : null,
    identifiers: mapIdentifiers(row.identifiers || []),
  };
}

export async function getCompoundPublications(entityId: string): Promise<string[]> {
  // PubMed and PubMed Central reference type accessions
  // These are stored directly in the references.type column
  const pubmedAccessions = ['MI:0446', 'MI:1042']; // PUBMED and PUBMED_CENTRAL

  // Get the entity_evidence_ids array from the entity table
  // Then use those IDs to find references through the evidence_reference join table
  // Note: "references" is a reserved keyword in PostgreSQL, so we need to quote it
  const query = `
    SELECT DISTINCT r.value
    FROM entity e
    CROSS JOIN LATERAL unnest(e.entity_evidence_ids) AS ee_id
    INNER JOIN evidence_reference er ON er.entity_evidence_id = ee_id
    INNER JOIN "references" r ON r.id = er.reference_id
    WHERE e.entity_id = $1
    AND r.type = ANY($2)
    ORDER BY r.value
  `;

  const results = await metaboClient.unsafe(query, [Number(entityId), pubmedAccessions]);
  return results.map((row: any) => row.value?.toString() || '').filter(Boolean);
}

export type CompoundAutocompleteResponse = Awaited<ReturnType<typeof getCompoundAutocomplete>>;
export type CompoundDetailsResponse = Awaited<ReturnType<typeof getCompoundByEntityId>>;
export type CompoundSearchResponse = Awaited<ReturnType<typeof searchCompounds>>;
export type SubstructureSearchResponse = Awaited<ReturnType<typeof searchCompoundsBySubstructure>>;
export type SimilaritySearchResponse = Awaited<ReturnType<typeof searchCompoundsBySimilarity>>;
export type CompoundPublicationsResponse = Awaited<ReturnType<typeof getCompoundPublications>>;
