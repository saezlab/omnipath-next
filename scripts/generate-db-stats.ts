import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

// Load metadata files
const maintenanceCategories = JSON.parse(
  readFileSync(join(process.cwd(), 'src/data/resources_by_maintenance_category.json'), 'utf-8')
);

const resourcesMetadata = JSON.parse(
  readFileSync(join(process.cwd(), 'src/data/resources.json'), 'utf-8')
);

// Create lookup maps
const maintenanceLookup: Record<string, string> = {};
for (const [category, resources] of Object.entries(maintenanceCategories)) {
  for (const resource of resources as string[]) {
    maintenanceLookup[resource] = category;
  }
}

async function generateDatabaseStats() {
  console.log('Generating database statistics...');

  // Create database connection
  const client = postgres({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'omnipath',
    password: process.env.DB_PASSWORD || 'omnipath123',
    database: process.env.DB_NAME || 'omnipath',
  });

  const db = drizzle(client);

  try {
    // 1. Existing queries
    console.log('Querying interactions table...');
    const interactionsStats = await db.execute(sql`
      WITH unnested_sources AS (
        SELECT unnest(sources) AS source
        FROM interactions
        WHERE sources IS NOT NULL
      )
      SELECT 
        source,
        COUNT(*)::int AS record_count
      FROM unnested_sources
      GROUP BY source
      ORDER BY record_count DESC
    `);
    console.log(`✓ Interactions: Found ${interactionsStats.length} unique sources`);

    // 1b. Interactions source-type combinations
    console.log('Querying interactions source-type combinations...');
    const interactionsSourceTypeStats = await db.execute(sql`
      WITH unnested_sources AS (
        SELECT 
          unnest(sources) AS source,
          type
        FROM interactions
        WHERE sources IS NOT NULL AND type IS NOT NULL
      )
      SELECT 
        source,
        type,
        COUNT(*)::int AS record_count
      FROM unnested_sources
      GROUP BY source, type
      ORDER BY source, record_count DESC
    `);
    console.log(`✓ Interactions source-type: Found ${interactionsSourceTypeStats.length} unique combinations`);

    // 2. Enzsub table - sources array
    console.log('Querying enzsub table...');
    const enzsubStats = await db.execute(sql`
      WITH unnested_sources AS (
        SELECT unnest(sources) AS source
        FROM enzsub
        WHERE sources IS NOT NULL
      )
      SELECT 
        source,
        COUNT(*)::int AS record_count
      FROM unnested_sources
      GROUP BY source
      ORDER BY record_count DESC
    `);
    console.log(`✓ Enzsub: Found ${enzsubStats.length} unique sources`);

    // 3. Complexes table - sources array
    console.log('Querying complexes table...');
    const complexesStats = await db.execute(sql`
      WITH unnested_sources AS (
        SELECT unnest(sources) AS source
        FROM complexes
        WHERE sources IS NOT NULL
      )
      SELECT 
        source,
        COUNT(*)::int AS record_count
      FROM unnested_sources
      GROUP BY source
      ORDER BY record_count DESC
    `);
    console.log(`✓ Complexes: Found ${complexesStats.length} unique sources`);

    // 4. Annotations table - single source, aggregate by record_id
    console.log('Querying annotations table...');
    const annotationsStats = await db.execute(sql`
      SELECT 
        source,
        COUNT(DISTINCT record_id)::int AS record_count
      FROM annotations
      WHERE source IS NOT NULL
      GROUP BY source
      ORDER BY record_count DESC
    `);
    console.log(`✓ Annotations: Found ${annotationsStats.length} unique sources`);

    // 5. Intercell table - database column
    console.log('Querying intercell table...');
    const intercellStats = await db.execute(sql`
      SELECT 
        database AS source,
        COUNT(*)::int AS record_count
      FROM intercell
      WHERE database IS NOT NULL
      GROUP BY database
      ORDER BY record_count DESC
    `);
    console.log(`✓ Intercell: Found ${intercellStats.length} unique sources`);

    // NEW QUERIES FOR PLOTS

    // a) Number of literature references by combined database and interaction type
    console.log('Querying literature references by database and interaction type...');
    const literatureRefsByDatabaseAndType = await db.execute(sql`
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
        COUNT(DISTINCT reference)::int AS unique_reference_count
      FROM all_refs
      GROUP BY source, interaction_type
      ORDER BY source, interaction_type
    `);
    console.log(`✓ Literature references by database and type: ${literatureRefsByDatabaseAndType.length} combinations`);

    // b) Number of reference-record pairs by database and interaction types
    console.log('Querying reference-record pairs...');
    const referenceRecordPairs = await db.execute(sql`
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
        COUNT(*)::int AS reference_record_pair_count
      FROM reference_record_pairs
      GROUP BY source, interaction_type
      ORDER BY source, interaction_type
    `);
    console.log(`✓ Reference-record pairs: ${referenceRecordPairs.length} combinations`);

    // c) Literature references by year of publication
    console.log('Querying literature references by year...');
    const referencesByYear = await db.execute(sql`
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
        CASE 
          WHEN reference ~ '\\b(19|20)\\d{2}\\b' 
          THEN substring(reference from '\\b((19|20)\\d{2})\\b')
          ELSE 'Unknown'
        END AS publication_year,
        COUNT(*)::int AS reference_count
      FROM all_pmids
      WHERE reference IS NOT NULL
      GROUP BY publication_year
      ORDER BY publication_year DESC
    `);
    console.log(`✓ References by year: ${referencesByYear.length} years`);

    // d) Availability of OmniPath data for commercial use - number of records by license and database
    console.log('Querying commercial use availability...');
    const commercialUseAvailability = await db.execute(sql`
      WITH database_record_counts AS (
        SELECT 
          unnest(sources) AS database,
          'interaction' AS record_type,
          COUNT(*)::int AS record_count
        FROM interactions
        WHERE sources IS NOT NULL
        GROUP BY unnest(sources)
        
        UNION ALL
        
        SELECT 
          unnest(sources) AS database,
          'enzyme-substrate' AS record_type,
          COUNT(*)::int AS record_count
        FROM enzsub
        WHERE sources IS NOT NULL
        GROUP BY unnest(sources)
        
        UNION ALL
        
        SELECT 
          unnest(sources) AS database,
          'complex' AS record_type,
          COUNT(*)::int AS record_count
        FROM complexes
        WHERE sources IS NOT NULL
        GROUP BY unnest(sources)
        
        UNION ALL
        
        SELECT 
          source AS database,
          'annotation' AS record_type,
          COUNT(*)::int AS record_count
        FROM annotations
        WHERE source IS NOT NULL
        GROUP BY source
        
        UNION ALL
        
        SELECT 
          database,
          'intercellular' AS record_type,
          COUNT(*)::int AS record_count
        FROM intercell
        WHERE database IS NOT NULL
        GROUP BY database
      )
      SELECT 
        database,
        record_type,
        SUM(record_count)::int AS total_records
      FROM database_record_counts
      GROUP BY database, record_type
      ORDER BY database, record_type
    `);
    
    // Enhance with license information
    const commercialUseWithLicense = commercialUseAvailability.map((row: any) => ({
      ...row,
      license: resourcesMetadata[row.database]?.license || 'Unknown',
      isCommercialUse: resourcesMetadata[row.database]?.license ? 
        !resourcesMetadata[row.database].license.toLowerCase().includes('nc') : null
    }));

    // e) Maintenance status of resources
    console.log('Querying maintenance status...');
    const maintenanceStatus = await db.execute(sql`
      WITH resource_entries AS (
        SELECT 
          unnest(sources) AS resource,
          COUNT(*)::int AS entry_count
        FROM interactions
        WHERE sources IS NOT NULL
        GROUP BY unnest(sources)
        
        UNION ALL
        
        SELECT 
          unnest(sources) AS resource,
          COUNT(*)::int AS entry_count
        FROM enzsub
        WHERE sources IS NOT NULL
        GROUP BY unnest(sources)
        
        UNION ALL
        
        SELECT 
          unnest(sources) AS resource,
          COUNT(*)::int AS entry_count
        FROM complexes
        WHERE sources IS NOT NULL
        GROUP BY unnest(sources)
        
        UNION ALL
        
        SELECT 
          source AS resource,
          COUNT(*)::int AS entry_count
        FROM annotations
        WHERE source IS NOT NULL
        GROUP BY source
        
        UNION ALL
        
        SELECT 
          database AS resource,
          COUNT(*)::int AS entry_count
        FROM intercell
        WHERE database IS NOT NULL
        GROUP BY database
      )
      SELECT 
        resource,
        SUM(entry_count)::int AS total_entries
      FROM resource_entries
      GROUP BY resource
      ORDER BY total_entries DESC
    `);
    
    // Enhance with maintenance category
    const maintenanceStatusWithCategory = maintenanceStatus.map((row: any) => ({
      ...row,
      maintenance_category: maintenanceLookup[row.resource] || 'unknown'
    }));

    // f) Number of entries by evidence type
    console.log('Querying entries by evidence type...');
    const entriesByEvidenceType = await db.execute(sql`
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
        COUNT(*)::int AS entry_count
      FROM evidence_data
      GROUP BY database, evidence_type
      ORDER BY database, evidence_type
    `);
    console.log(`✓ Entries by evidence type: ${entriesByEvidenceType.length} combinations`);

    // g) References by interaction (top 50)
    console.log('Querying references by interaction...');
    const referencesByInteraction = await db.execute(sql`
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
        reference_count::int,
        "references"
      FROM interaction_refs
      ORDER BY reference_count DESC
      LIMIT 50
    `);
    console.log(`✓ References by interaction: Top 50 interactions`);

    // h) Overlap across resources
    console.log('Querying resource overlap...');
    const resourceOverlap = await db.execute(sql`
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
          COUNT(DISTINCT resource)::int AS resource_count,
          array_agg(DISTINCT resource ORDER BY resource) AS resources
        FROM entry_resource_mapping
        GROUP BY entry_id, entry_type
      )
      SELECT 
        resource_count AS number_of_resources,
        entry_type,
        COUNT(*)::int AS number_of_entries
      FROM entry_resource_counts
      GROUP BY resource_count, entry_type
      ORDER BY entry_type, resource_count
    `);
    console.log(`✓ Resource overlap: ${resourceOverlap.length} combinations`);

    // Examples of multi-resource entries
    console.log('Querying multi-resource entry examples...');
    const multiResourceExamples = await db.execute(sql`
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
          COUNT(DISTINCT resource)::int AS resource_count,
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
      LIMIT 20
    `);

    console.log('Writing results to JSON file...');
    // Combine all results
    const dbStats = {
      // Original stats
      interactions: interactionsStats,
      interactionsSourceType: interactionsSourceTypeStats,
      enzsub: enzsubStats,
      complexes: complexesStats,
      annotations: annotationsStats,
      intercell: intercellStats,
      
      // New plot data
      plotData: {
        literatureRefsByDatabaseAndType,
        referenceRecordPairs,
        referencesByYear,
        commercialUseAvailability: commercialUseWithLicense,
        maintenanceStatus: maintenanceStatusWithCategory,
        entriesByEvidenceType,
        referencesByInteraction,
        resourceOverlap,
        multiResourceExamples
      },
      
      generatedAt: new Date().toISOString(),
    };

    // Write to JSON file
    const outputPath = join(process.cwd(), 'src/data/db-stats.json');
    writeFileSync(outputPath, JSON.stringify(dbStats, null, 2));

    console.log(`Database statistics generated successfully at ${outputPath}`);
    console.log('Summary:');
    console.log(`- Interactions: ${interactionsStats.length} unique sources`);
    console.log(`- Interactions source-type: ${interactionsSourceTypeStats.length} unique combinations`);
    console.log(`- Enzsub: ${enzsubStats.length} unique sources`);
    console.log(`- Complexes: ${complexesStats.length} unique sources`);
    console.log(`- Annotations: ${annotationsStats.length} unique sources`);
    console.log(`- Intercell: ${intercellStats.length} unique sources`);
    console.log('\nPlot data generated:');
    console.log(`- Literature refs by database/type: ${literatureRefsByDatabaseAndType.length} combinations`);
    console.log(`- Reference-record pairs: ${referenceRecordPairs.length} combinations`);
    console.log(`- References by year: ${referencesByYear.length} years`);
    console.log(`- Commercial use availability: ${commercialUseWithLicense.length} database/type combinations`);
    console.log(`- Maintenance status: ${maintenanceStatusWithCategory.length} resources`);
    console.log(`- Entries by evidence type: ${entriesByEvidenceType.length} combinations`);
    console.log(`- References by interaction: Top 50 interactions`);
    console.log(`- Resource overlap: ${resourceOverlap.length} combinations`);
    console.log(`- Multi-resource examples: ${multiResourceExamples.length} examples`);

  } catch (error) {
    console.error('Error generating database statistics:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }

  process.exit(0);
}

generateDatabaseStats();