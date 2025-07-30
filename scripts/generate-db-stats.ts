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
    // 1. Interactions table - sources array
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

    console.log('Writing results to JSON file...');
    // Combine all results
    const dbStats = {
      interactions: interactionsStats,
      interactionsSourceType: interactionsSourceTypeStats,
      enzsub: enzsubStats,
      complexes: complexesStats,
      annotations: annotationsStats,
      intercell: intercellStats,
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