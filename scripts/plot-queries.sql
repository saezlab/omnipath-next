-- SQL Queries for OmniPath Data Visualization Plots
-- Note: These queries assume PostgreSQL syntax with array support

-- a) Number of literature references by combined database and interaction type
-- This counts unique references across all databases grouped by source and interaction type
WITH all_refs AS (
  -- Interactions table
  SELECT 
    unnest(sources) AS source,
    type AS interaction_type,
    unnest(string_to_array("references", ';')) AS reference
  FROM interactions
  WHERE sources IS NOT NULL 
    AND "references" IS NOT NULL 
    AND "references" != ''
  
  UNION ALL
  
  -- Enzyme-substrate relationships
  SELECT 
    unnest(sources) AS source,
    'enzyme-substrate' AS interaction_type,
    unnest(string_to_array("references", ';')) AS reference
  FROM enzsub
  WHERE sources IS NOT NULL 
    AND "references" IS NOT NULL 
    AND "references" != ''
  
  UNION ALL
  
  -- Complexes
  SELECT 
    unnest(sources) AS source,
    'complex' AS interaction_type,
    unnest(string_to_array("references", ';')) AS reference
  FROM complexes
  WHERE sources IS NOT NULL 
    AND "references" IS NOT NULL 
    AND "references" != ''
)
SELECT 
  source AS database,
  interaction_type,
  COUNT(DISTINCT reference) AS unique_reference_count
FROM all_refs
GROUP BY source, interaction_type
ORDER BY source, interaction_type;

-- b) Number of reference-record pairs by database and interaction types
-- This counts the total number of reference-record associations
WITH reference_record_pairs AS (
  -- Interactions table
  SELECT 
    unnest(sources) AS source,
    type AS interaction_type,
    id AS record_id,
    unnest(string_to_array("references", ';')) AS reference
  FROM interactions
  WHERE sources IS NOT NULL 
    AND "references" IS NOT NULL 
    AND "references" != ''
  
  UNION ALL
  
  -- Enzyme-substrate relationships
  SELECT 
    unnest(sources) AS source,
    'enzyme-substrate' AS interaction_type,
    id AS record_id,
    unnest(string_to_array("references", ';')) AS reference
  FROM enzsub
  WHERE sources IS NOT NULL 
    AND "references" IS NOT NULL 
    AND "references" != ''
  
  UNION ALL
  
  -- Complexes
  SELECT 
    unnest(sources) AS source,
    'complex' AS interaction_type,
    id AS record_id,
    unnest(string_to_array("references", ';')) AS reference
  FROM complexes
  WHERE sources IS NOT NULL 
    AND "references" IS NOT NULL 
    AND "references" != ''
)
SELECT 
  source AS database,
  interaction_type,
  COUNT(*) AS reference_record_pair_count
FROM reference_record_pairs
GROUP BY source, interaction_type
ORDER BY source, interaction_type;

-- c) Literature references by year of publication
-- Extract year from PubMed IDs (assuming format PMID:12345678 where first 2-4 digits after PMID: might indicate year)
-- Note: This is a simplified approach - actual publication year would require external PubMed API lookup
WITH all_pmids AS (
  SELECT DISTINCT unnest(string_to_array("references", ';')) AS reference
  FROM interactions
  WHERE "references" IS NOT NULL AND "references" != ''
  
  UNION
  
  SELECT DISTINCT unnest(string_to_array("references", ';')) AS reference
  FROM enzsub
  WHERE "references" IS NOT NULL AND "references" != ''
  
  UNION
  
  SELECT DISTINCT unnest(string_to_array("references", ';')) AS reference
  FROM complexes
  WHERE "references" IS NOT NULL AND "references" != ''
)
SELECT 
  reference,
  -- Extract year from reference if it contains a 4-digit year pattern
  CASE 
    WHEN reference ~ '\b(19|20)\d{2}\b' 
    THEN substring(reference from '\b((19|20)\d{2})\b')
    ELSE 'Unknown'
  END AS publication_year
FROM all_pmids
WHERE reference IS NOT NULL
ORDER BY publication_year DESC;

-- d) Availability of OmniPath data for commercial use - number of records by license and database
-- Note: License information is not directly available in the current schema
-- This query would need to be enhanced with external resource metadata
-- For now, we'll count records by database which could be joined with license information
WITH database_record_counts AS (
  SELECT 
    unnest(sources) AS database,
    'interaction' AS record_type,
    COUNT(*) AS record_count
  FROM interactions
  WHERE sources IS NOT NULL
  GROUP BY unnest(sources)
  
  UNION ALL
  
  SELECT 
    unnest(sources) AS database,
    'enzyme-substrate' AS record_type,
    COUNT(*) AS record_count
  FROM enzsub
  WHERE sources IS NOT NULL
  GROUP BY unnest(sources)
  
  UNION ALL
  
  SELECT 
    unnest(sources) AS database,
    'complex' AS record_type,
    COUNT(*) AS record_count
  FROM complexes
  WHERE sources IS NOT NULL
  GROUP BY unnest(sources)
  
  UNION ALL
  
  SELECT 
    source AS database,
    'annotation' AS record_type,
    COUNT(*) AS record_count
  FROM annotations
  WHERE source IS NOT NULL
  GROUP BY source
  
  UNION ALL
  
  SELECT 
    database,
    'intercellular' AS record_type,
    COUNT(*) AS record_count
  FROM intercell
  WHERE database IS NOT NULL
  GROUP BY database
)
SELECT 
  database,
  record_type,
  SUM(record_count) AS total_records
FROM database_record_counts
GROUP BY database, record_type
ORDER BY database, record_type;

-- e) Maintenance status of resources: number of resources and entries by update frequency
-- This query uses the maintenance categories from the JSON file
-- You'll need to join this with the actual maintenance status data
WITH resource_entries AS (
  SELECT 
    unnest(sources) AS resource,
    COUNT(*) AS entry_count
  FROM interactions
  WHERE sources IS NOT NULL
  GROUP BY unnest(sources)
  
  UNION ALL
  
  SELECT 
    unnest(sources) AS resource,
    COUNT(*) AS entry_count
  FROM enzsub
  WHERE sources IS NOT NULL
  GROUP BY unnest(sources)
  
  UNION ALL
  
  SELECT 
    unnest(sources) AS resource,
    COUNT(*) AS entry_count
  FROM complexes
  WHERE sources IS NOT NULL
  GROUP BY unnest(sources)
  
  UNION ALL
  
  SELECT 
    source AS resource,
    COUNT(*) AS entry_count
  FROM annotations
  WHERE source IS NOT NULL
  GROUP BY source
  
  UNION ALL
  
  SELECT 
    database AS resource,
    COUNT(*) AS entry_count
  FROM intercell
  WHERE database IS NOT NULL
  GROUP BY database
)
SELECT 
  resource,
  SUM(entry_count) AS total_entries,
  -- Maintenance category would be joined from external data
  'TODO: Join with maintenance_category' AS maintenance_status
FROM resource_entries
GROUP BY resource
ORDER BY total_entries DESC;

-- f) Number of entries by evidence type (curated, high-throughput, predicted) in each combined database
-- This uses the evidences JSONB field in interactions table
WITH evidence_data AS (
  SELECT 
    unnest(sources) AS database,
    CASE 
      WHEN evidences::text ILIKE '%curated%' THEN 'curated'
      WHEN evidences::text ILIKE '%high[_-]?throughput%' THEN 'high-throughput'
      WHEN evidences::text ILIKE '%predicted%' THEN 'predicted'
      WHEN curation_effort > 0 THEN 'curated'
      ELSE 'other'
    END AS evidence_type
  FROM interactions
  WHERE sources IS NOT NULL
  
  UNION ALL
  
  -- Enzyme-substrate entries (using curation_effort as proxy)
  SELECT 
    unnest(sources) AS database,
    CASE 
      WHEN curation_effort > 0 THEN 'curated'
      ELSE 'other'
    END AS evidence_type
  FROM enzsub
  WHERE sources IS NOT NULL
)
SELECT 
  database,
  evidence_type,
  COUNT(*) AS entry_count
FROM evidence_data
GROUP BY database, evidence_type
ORDER BY database, evidence_type;

-- g) References by interaction
-- Top interactions by number of references
WITH interaction_refs AS (
  SELECT 
    CONCAT(source_genesymbol, ' -> ', target_genesymbol) AS interaction,
    array_length(string_to_array("references", ';'), 1) AS reference_count,
    "references"
  FROM interactions
  WHERE source_genesymbol IS NOT NULL 
    AND target_genesymbol IS NOT NULL
    AND "references" IS NOT NULL 
    AND "references" != ''
)
SELECT 
  interaction,
  reference_count,
  "references"
FROM interaction_refs
ORDER BY reference_count DESC
LIMIT 50;

-- h) Overlap across resources in the interactions, enzyme-substrate and complexes databases
-- Number of resources by entry (shows which entries appear in multiple resources)
WITH entry_resource_mapping AS (
  -- Interactions: using source-target pair as entry identifier
  SELECT 
    CONCAT(source, '-', target) AS entry_id,
    'interaction' AS entry_type,
    unnest(sources) AS resource
  FROM interactions
  WHERE sources IS NOT NULL
  
  UNION ALL
  
  -- Enzyme-substrate: using enzyme-substrate-modification as entry identifier
  SELECT 
    CONCAT(enzyme, '-', substrate, '-', COALESCE(modification, 'none')) AS entry_id,
    'enzyme-substrate' AS entry_type,
    unnest(sources) AS resource
  FROM enzsub
  WHERE sources IS NOT NULL
  
  UNION ALL
  
  -- Complexes: using complex name as entry identifier
  SELECT 
    name AS entry_id,
    'complex' AS entry_type,
    unnest(sources) AS resource
  FROM complexes
  WHERE sources IS NOT NULL AND name IS NOT NULL
),
entry_resource_counts AS (
  SELECT 
    entry_id,
    entry_type,
    COUNT(DISTINCT resource) AS resource_count,
    array_agg(DISTINCT resource ORDER BY resource) AS resources
  FROM entry_resource_mapping
  GROUP BY entry_id, entry_type
)
SELECT 
  resource_count AS number_of_resources,
  entry_type,
  COUNT(*) AS number_of_entries
FROM entry_resource_counts
GROUP BY resource_count, entry_type
ORDER BY entry_type, resource_count;

-- Additional query: Show specific examples of entries that appear in multiple resources
WITH entry_resource_mapping AS (
  SELECT 
    CONCAT(source_genesymbol, '-', target_genesymbol) AS entry_id,
    'interaction' AS entry_type,
    unnest(sources) AS resource
  FROM interactions
  WHERE sources IS NOT NULL 
    AND source_genesymbol IS NOT NULL 
    AND target_genesymbol IS NOT NULL
  
  UNION ALL
  
  SELECT 
    CONCAT(enzyme_genesymbol, '-', substrate_genesymbol, '-', COALESCE(modification, 'none')) AS entry_id,
    'enzyme-substrate' AS entry_type,
    unnest(sources) AS resource
  FROM enzsub
  WHERE sources IS NOT NULL 
    AND enzyme_genesymbol IS NOT NULL 
    AND substrate_genesymbol IS NOT NULL
  
  UNION ALL
  
  SELECT 
    name AS entry_id,
    'complex' AS entry_type,
    unnest(sources) AS resource
  FROM complexes
  WHERE sources IS NOT NULL AND name IS NOT NULL
),
multi_resource_entries AS (
  SELECT 
    entry_id,
    entry_type,
    COUNT(DISTINCT resource) AS resource_count,
    array_agg(DISTINCT resource ORDER BY resource) AS resources
  FROM entry_resource_mapping
  GROUP BY entry_id, entry_type
  HAVING COUNT(DISTINCT resource) > 1
)
SELECT 
  entry_id,
  entry_type,
  resource_count,
  resources
FROM multi_resource_entries
ORDER BY resource_count DESC, entry_type, entry_id
LIMIT 20;