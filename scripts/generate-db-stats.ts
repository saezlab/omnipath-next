import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

async function generateDatabaseStats() {
  console.log('Generating database statistics...');

  // Select DATABASE_URL based on NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';
  const databaseUrl = nodeEnv === 'production' 
    ? process.env.DATABASE_URL_PROD 
    : process.env.DATABASE_URL_DEV;
  
  if (!databaseUrl) {
    console.error(`Error: DATABASE_URL_${nodeEnv === 'production' ? 'PROD' : 'DEV'} is not set`);
    console.error(`Current NODE_ENV: ${nodeEnv}`);
    process.exit(1);
  }

  console.log(`Environment: ${nodeEnv}`);
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    // 1. Existing queries
    console.log('Querying interactions table...');
    const interactionsStats = await db.execute(sql`
      WITH unnested_sources AS (
        SELECT unnest(string_to_array(sources, ';')) AS source
        FROM interactions
        WHERE sources IS NOT NULL AND sources != '' AND sources != ''
      )
      SELECT 
        source,
        COUNT(*)::int AS record_count
      FROM unnested_sources
      WHERE source IS NOT NULL AND source != ''
      GROUP BY source
      ORDER BY record_count DESC
    `);
    console.log(`✓ Interactions: Found ${interactionsStats.length} unique sources`);

    // 1b. Interactions source-type combinations
    console.log('Querying interactions source-type combinations...');
    const interactionsSourceTypeStats = await db.execute(sql`
      WITH unnested_sources AS (
        SELECT 
          unnest(string_to_array(sources, ';')) AS source,
          type
        FROM interactions
        WHERE sources IS NOT NULL AND sources != '' AND sources != '' AND type IS NOT NULL
      )
      SELECT 
        source,
        type,
        COUNT(*)::int AS record_count
      FROM unnested_sources
      WHERE source IS NOT NULL AND source != ''
      GROUP BY source, type
      ORDER BY source, record_count DESC
    `);
    console.log(`✓ Interactions source-type: Found ${interactionsSourceTypeStats.length} unique combinations`);

    // 2. enz_sub table - sources array
    console.log('Querying enz_sub table...');
    const enz_subStats = await db.execute(sql`
      WITH unnested_sources AS (
        SELECT unnest(string_to_array(sources, ';')) AS source
        FROM enz_sub
        WHERE sources IS NOT NULL AND sources != '' AND sources != ''
      )
      SELECT 
        source,
        COUNT(*)::int AS record_count
      FROM unnested_sources
      WHERE source IS NOT NULL AND source != ''
      GROUP BY source
      ORDER BY record_count DESC
    `);
    console.log(`✓ enz_sub: Found ${enz_subStats.length} unique sources`);

    // 3. Complexes table - sources array
    console.log('Querying complexes table...');
    const complexesStats = await db.execute(sql`
      WITH unnested_sources AS (
        SELECT unnest(string_to_array(sources, ';')) AS source
        FROM complexes
        WHERE sources IS NOT NULL AND sources != '' AND sources != ''
      )
      SELECT 
        source,
        COUNT(*)::int AS record_count
      FROM unnested_sources
      WHERE source IS NOT NULL AND source != ''
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
        -- Interactions table - extract source from reference format "SOURCE:ID"
        SELECT 
          split_part(unnest(string_to_array("references", ';')), ':', 1) AS source,
          type AS interaction_type,
          split_part(unnest(string_to_array("references", ';')), ':', 2) AS reference
        FROM interactions
        WHERE "references" IS NOT NULL AND "references" != ''
        
        UNION ALL
        
        -- Enzyme-substrate relationships - extract source from reference format "SOURCE:ID"
        SELECT 
          split_part(unnest(string_to_array("references", ';')), ':', 1) AS source,
          'enzyme-substrate' AS interaction_type,
          split_part(unnest(string_to_array("references", ';')), ':', 2) AS reference
        FROM enz_sub
        WHERE "references" IS NOT NULL AND "references" != ''
        
        UNION ALL
        
        -- Complexes - cartesian product of sources and plain reference IDs
        SELECT 
          unnest(string_to_array(sources, ';')) AS source,
          'complex' AS interaction_type,
          unnest(string_to_array("references", ';')) AS reference
        FROM complexes
        WHERE sources IS NOT NULL AND sources != '' AND sources != ''
          AND "references" IS NOT NULL 
          AND "references" != ''
      )
      SELECT 
        source AS database,
        interaction_type,
        COUNT(DISTINCT reference)::int AS unique_reference_count
      FROM all_refs
      WHERE source != '' AND reference != ''
      GROUP BY source, interaction_type
      ORDER BY source, interaction_type
    `);
    console.log(`✓ Literature references by database and type: ${literatureRefsByDatabaseAndType.length} combinations`);

    // b) Number of unique references by database and interaction types
    console.log('Querying unique references by database and interaction type...');
    const uniqueRefsByDatabaseAndType = await db.execute(sql`
      WITH all_refs AS (
        -- Interactions table - extract source from reference format "SOURCE:ID"
        SELECT 
          split_part(unnest(string_to_array("references", ';')), ':', 1) AS source,
          type AS interaction_type,
          split_part(unnest(string_to_array("references", ';')), ':', 2) AS reference
        FROM interactions
        WHERE "references" IS NOT NULL AND "references" != ''
        
        UNION ALL
        
        -- Enzyme-substrate relationships - extract source from reference format "SOURCE:ID"
        SELECT 
          split_part(unnest(string_to_array("references", ';')), ':', 1) AS source,
          'enzyme-substrate' AS interaction_type,
          split_part(unnest(string_to_array("references", ';')), ':', 2) AS reference
        FROM enz_sub
        WHERE "references" IS NOT NULL AND "references" != ''
        
        UNION ALL
        
        -- Complexes - cartesian product of sources and plain reference IDs
        SELECT 
          unnest(string_to_array(sources, ';')) AS source,
          'complex' AS interaction_type,
          unnest(string_to_array("references", ';')) AS reference
        FROM complexes
        WHERE sources IS NOT NULL AND sources != '' AND sources != ''
          AND "references" IS NOT NULL 
          AND "references" != ''
      )
      SELECT 
        source AS database,
        interaction_type,
        COUNT(DISTINCT reference)::int AS unique_reference_count
      FROM all_refs
      WHERE source != '' AND reference != ''
      GROUP BY source, interaction_type
      ORDER BY source, interaction_type
    `);
    console.log(`✓ Unique references by database and type: ${uniqueRefsByDatabaseAndType.length} combinations`);

    // c) Aggregate interaction type counts (combine lncrna_post_transcriptional with post_transcriptional)
    console.log('Querying aggregate interaction type counts...');
    const aggregateInteractionTypes = await db.execute(sql`
      WITH all_interactions AS (
        SELECT 
          CASE 
            WHEN type = 'lncrna_post_transcriptional' THEN 'post_transcriptional'
            ELSE type
          END AS interaction_type
        FROM interactions
        WHERE type IS NOT NULL
        
        UNION ALL
        
        SELECT 'enzyme-substrate' AS interaction_type
        FROM enz_sub
        
        UNION ALL
        
        SELECT 'complex' AS interaction_type
        FROM complexes
      )
      SELECT 
        interaction_type,
        COUNT(*)::int AS count
      FROM all_interactions
      GROUP BY interaction_type
      ORDER BY count DESC
    `);
    console.log(`✓ Aggregate interaction types: ${aggregateInteractionTypes.length} types`);





    // h) Overlap across resources
    console.log('Querying resource overlap...');
    const resourceOverlap = await db.execute(sql`
      WITH entry_resource_mapping AS (
        -- Interactions: using source-target pair as entry identifier
        SELECT 
          CONCAT(source, '-', target) AS entry_id,
          'interaction' AS entry_type,
          unnest(string_to_array(sources, ';')) AS resource
        FROM interactions
        WHERE sources IS NOT NULL AND sources != ''
        
        UNION ALL
        
        -- Enzyme-substrate: using enzyme-substrate-modification as entry identifier
        SELECT 
          CONCAT(enzyme, '-', substrate, '-', COALESCE(modification, 'none')) AS entry_id,
          'enzyme-substrate' AS entry_type,
          unnest(string_to_array(sources, ';')) AS resource
        FROM enz_sub
        WHERE sources IS NOT NULL AND sources != ''
        
        UNION ALL
        
        -- Complexes: using complex name as entry identifier
        SELECT 
          name AS entry_id,
          'complex' AS entry_type,
          unnest(string_to_array(sources, ';')) AS resource
        FROM complexes
        WHERE sources IS NOT NULL AND sources != '' AND name IS NOT NULL
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


    console.log('Writing results to JSON file...');
    // Combine all results
    const dbStats = {
      // Original stats
      interactions: interactionsStats,
      interactionsSourceType: interactionsSourceTypeStats,
      enz_sub: enz_subStats,
      complexes: complexesStats,
      annotations: annotationsStats,
      intercell: intercellStats,
      
      // New plot data
      plotData: {
        literatureRefsByDatabaseAndType,
        uniqueRefsByDatabaseAndType,
        aggregateInteractionTypes,
        resourceOverlap
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
    console.log(`- enz_sub: ${enz_subStats.length} unique sources`);
    console.log(`- Complexes: ${complexesStats.length} unique sources`);
    console.log(`- Annotations: ${annotationsStats.length} unique sources`);
    console.log(`- Intercell: ${intercellStats.length} unique sources`);
    console.log('\nPlot data generated:');
    console.log(`- Literature refs by database/type: ${literatureRefsByDatabaseAndType.length} combinations`);
    console.log(`- Unique refs by database/type: ${uniqueRefsByDatabaseAndType.length} combinations`);
    console.log(`- Aggregate interaction types: ${aggregateInteractionTypes.length} types`);
    console.log(`- Resource overlap: ${resourceOverlap.length} combinations`);

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