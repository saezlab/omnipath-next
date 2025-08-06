import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

// Load maintenance and license categorization data
const maintenanceCategories = JSON.parse(
  readFileSync(join(process.cwd(), 'src/data/resources_by_maintenance_category.json'), 'utf-8')
);
const resourcesByLicense = JSON.parse(
  readFileSync(join(process.cwd(), 'src/data/resources_by_license.json'), 'utf-8')
);

// Resources to exclude from plots (composite databases or no licenses)
const EXCLUDED_RESOURCES = ['CPAD', 'CollecTRI', 'DoRothEA', 'cellsignal.com'];

// Source name cleaning function
function cleanSourceName(sourceName: string): string {
  const underscoreIndex = sourceName.indexOf('_');
  if (underscoreIndex > 0) {
    const beforeUnderscore = sourceName.substring(0, underscoreIndex);
    const afterUnderscore = sourceName.substring(underscoreIndex + 1);
    if (/^[A-Za-z]/.test(afterUnderscore)) {
      return beforeUnderscore;
    }
  }
  return sourceName;
}

// Create maintenance category mapping
function getMaintenanceCategory(resource: string): string {
  const cleanedResource = cleanSourceName(resource).toLowerCase();
  
  for (const [category, resources] of Object.entries(maintenanceCategories)) {
    for (const r of resources as string[]) {
      if (cleanSourceName(r).toLowerCase() === cleanedResource) {
        return category;
      }
    }
  }
  return 'unknown';
}

// Create license category mapping
function getLicenseCategory(resource: string): string {
  const cleanedResource = cleanSourceName(resource).toLowerCase();
  
  for (const r of resourcesByLicense.academic_nonprofit as string[]) {
    if (cleanSourceName(r).toLowerCase() === cleanedResource) {
      return 'academic_nonprofit';
    }
  }
  
  for (const r of resourcesByLicense.commercial as string[]) {
    if (cleanSourceName(r).toLowerCase() === cleanedResource) {
      return 'commercial';
    }
  }
  
  return 'unknown';
}

async function generateUnifiedDatabaseStats() {
  console.log('Generating unified database statistics...');

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
    // Create a unified query that collects all resources from all tables
    console.log('Querying all resources from database...');
    
    // First, let's check what type the sources column actually is
    console.log('Checking database schema...');
    const schemaCheck = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('interactions', 'enzsub', 'complexes') 
      AND column_name = 'sources'
      ORDER BY table_name;
    `);
    
    console.log('Sources column info:', schemaCheck);

    // Let's check what the sources data actually looks like
    const sampleData = await db.execute(sql`
      SELECT sources, LENGTH(sources) as len 
      FROM interactions 
      WHERE sources IS NOT NULL 
      LIMIT 5;
    `);
    console.log('Sample sources data:', sampleData);

    const unifiedResourcesQuery = await db.execute(sql`
      WITH unnested_interactions AS (
        SELECT 
          TRIM(unnest(string_to_array(sources, ';'))) AS resource,
          'Interactions' AS database_category,
          type AS subcategory,
          id,
          "references"
        FROM interactions
        WHERE sources IS NOT NULL AND sources != ''
      ),
      interaction_stats AS (
        SELECT 
          resource,
          database_category,
          subcategory,
          COUNT(*)::int AS record_count,
          COUNT(DISTINCT id)::int AS unique_entries,
          array_agg(DISTINCT TRIM(ref_part) ORDER BY TRIM(ref_part)) FILTER (WHERE ref_part IS NOT NULL AND TRIM(ref_part) != '') AS unique_references
        FROM unnested_interactions
        LEFT JOIN LATERAL unnest(string_to_array("references", ';')) AS ref_part ON true
        GROUP BY resource, database_category, subcategory
      ),
      unnested_enz_sub AS (
        SELECT 
          TRIM(unnest(string_to_array(sources, ';'))) AS resource,
          'Enzyme-Substrate' AS database_category,
          'Enzyme-Substrate' AS subcategory,
          id,
          "references"
        FROM enz_sub
        WHERE sources IS NOT NULL AND sources != ''
      ),
      enz_sub_stats AS (
        SELECT 
          resource,
          database_category,
          subcategory,
          COUNT(*)::int AS record_count,
          COUNT(DISTINCT id)::int AS unique_entries,
          array_agg(DISTINCT TRIM(ref_part) ORDER BY TRIM(ref_part)) FILTER (WHERE ref_part IS NOT NULL AND TRIM(ref_part) != '') AS unique_references
        FROM unnested_enz_sub
        LEFT JOIN LATERAL unnest(string_to_array("references", ';')) AS ref_part ON true
        GROUP BY resource, database_category, subcategory
      ),
      unnested_complexes AS (
        SELECT 
          TRIM(unnest(string_to_array(sources, ';'))) AS resource,
          'Complexes' AS database_category,
          'Complexes' AS subcategory,
          id,
          "references"
        FROM complexes
        WHERE sources IS NOT NULL AND sources != ''
      ),
      complexes_stats AS (
        SELECT 
          resource,
          database_category,
          subcategory,
          COUNT(*)::int AS record_count,
          COUNT(DISTINCT id)::int AS unique_entries,
          array_agg(DISTINCT TRIM(ref_part) ORDER BY TRIM(ref_part)) FILTER (WHERE ref_part IS NOT NULL AND TRIM(ref_part) != '') AS unique_references
        FROM unnested_complexes
        LEFT JOIN LATERAL unnest(string_to_array("references", ';')) AS ref_part ON true
        GROUP BY resource, database_category, subcategory
      ),
      all_resources AS (
        SELECT * FROM interaction_stats
        UNION ALL
        SELECT * FROM enz_sub_stats
        UNION ALL
        SELECT * FROM complexes_stats
        UNION ALL
        -- Annotations
        SELECT 
          source AS resource,
          'Annotations' AS database_category,
          source AS subcategory,
          COUNT(DISTINCT record_id)::int AS record_count,
          COUNT(DISTINCT record_id)::int AS unique_entries,
          ARRAY[]::text[] AS unique_references
        FROM annotations
        WHERE source IS NOT NULL
        GROUP BY source
        UNION ALL
        -- Intercellular
        SELECT 
          database AS resource,
          'Intercellular' AS database_category,
          'Intercellular' AS subcategory,
          COUNT(*)::int AS record_count,
          COUNT(DISTINCT id)::int AS unique_entries,
          ARRAY[]::text[] AS unique_references
        FROM intercell
        WHERE database IS NOT NULL
        GROUP BY database
      )
      SELECT 
        resource,
        database_category,
        subcategory,
        SUM(record_count)::int AS record_count,
        SUM(unique_entries)::int AS unique_entries,
        array_agg(DISTINCT ref ORDER BY ref) FILTER (WHERE ref IS NOT NULL) AS unique_references
      FROM all_resources
      CROSS JOIN LATERAL unnest(COALESCE(unique_references, ARRAY[]::text[])) AS ref
      GROUP BY resource, database_category, subcategory
      ORDER BY database_category, subcategory, resource
    `);

    console.log(`✓ Found ${unifiedResourcesQuery.length} resource-category combinations`);

    // Annotation subcategory mapping (from filter-sidebar.tsx)
    const ANNOTATION_SOURCE_GROUPS: Record<string, string[]> = {
      "Cell-cell communication": ["Baccin2019", "CellCall", "CellCellInteractions", "CellChatDB", "CellChatDB_complex", "Cellinker", "Cellinker_complex", "CellPhoneDB", "CellPhoneDB_complex", "CellTalkDB", "connectomeDB2020", "EMBRACE", "Guide2Pharma", "iTALK", "HPMR", "ICELLNET", "ICELLNET_complex", "Kirouac2010", "LRdb", "Ramilowski2015", "scConnect", "scConnect_complex", "SignaLink_function", "Surfaceome", "talklr"],
      "Localization (subcellular)": ["ComPPI", "Exocarta", "HPA_subcellular", "HPA_secretome", "HumanCellMap", "LOCATE", "Ramilowski_location", "UniProt_location", "Vesiclepedia", "Wang"],
      "Membrane localization & topology": ["Almen2009", "CellPhoneDB", "CSPA", "LOCATE", "Membranome", "OPM", "Phobius", "Ramilowski_location", "TopDB", "UniProt_topology"],
      "Extracellular matrix, adhesion": ["Matrisome", "MatrixDB", "Integrins", "MCAM", "Zhong2015"],
      "Vesicles, secretome": ["Almen2009", "Exocarta", "Vesiclepedia"],
      "Function, pathway": ["CellChatDB", "GO_Intercell", "KEGG", "KEGG-PC", "NetPath", "SignaLink_pathway", "SignaLink_function", "CORUM_Funcat", "CORUM_GO", "SIGNOR", "PROGENy", "MSigDB", "UniProt_keyword", "Wang"],
      "Signatures": ["CytoSig", "PanglaoDB", "PROGENy"],
      "Disease, cancer": ["DisGeNet", "CancerGeneCensus", "IntOGen", "CancerSEA", "CancerDrugsDB", "DGIdb", "CPAD"],
      "Protein classes & families": ["Adhesome", "DGIdb", "UniProt_family", "GPCRdb", "HPMR", "kinase.com", "Phosphatome", "TFcensus", "TCDB", "InterPro", "HGNC", "OPM"],
      "Cell type, tissue": ["HPA_tissue", "CSPA_celltype", "CellTypist", "UniProt_tissue", "EMBRACE"],
      "Transcription factors": ["Lambert2018", "TFcensus"]
    };

    // Function to get annotation subcategory
    function getAnnotationSubcategory(source: string): string {
      const sourceLower = source.toLowerCase();
      for (const [category, sources] of Object.entries(ANNOTATION_SOURCE_GROUPS)) {
        for (const s of sources) {
          if (s.toLowerCase() === sourceLower) {
            return category;
          }
        }
      }
      return "Other";
    }

    // Process and enrich the data
    const processedResources = unifiedResourcesQuery.map((row: any) => {
      const cleanedName = cleanSourceName(row.resource);
      
      // Skip excluded resources
      if (EXCLUDED_RESOURCES.includes(cleanedName)) {
        return null;
      }

      // Handle annotation subcategories
      let subcategory = row.subcategory;
      if (row.database_category === 'Annotations') {
        subcategory = getAnnotationSubcategory(row.resource);
      }

      // For interactions, format the type
      if (row.database_category === 'Interactions' && subcategory) {
        // Handle lncrna_post_transcriptional
        if (subcategory === 'lncrna_post_transcriptional') {
          subcategory = 'post_transcriptional';
        }
        // Format type name
        subcategory = subcategory === 'mirna_transcriptional' 
          ? 'miRNA Transcriptional' 
          : subcategory.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      }

      return {
        resource: row.resource,
        cleaned_resource: cleanedName,
        database_category: row.database_category,
        subcategory: subcategory,
        record_count: row.record_count,
        unique_entries: row.unique_entries,
        unique_references: row.unique_references || [],
        maintenance_category: getMaintenanceCategory(row.resource),
        license_category: getLicenseCategory(row.resource)
      };
    }).filter(Boolean); // Remove nulls (excluded resources)

    // Aggregate by cleaned resource name
    const resourceMap = new Map<string, any>();
    
    processedResources.forEach((resource: any) => {
      const key = `${resource.cleaned_resource}_${resource.database_category}_${resource.subcategory}`;
      
      if (resourceMap.has(key)) {
        const existing = resourceMap.get(key);
        existing.record_count += resource.record_count;
        existing.unique_entries += resource.unique_entries;
        // Merge unique references arrays
        const allRefs = [...(existing.unique_references || []), ...(resource.unique_references || [])];
        existing.unique_references = [...new Set(allRefs)].sort();
      } else {
        resourceMap.set(key, {
          ...resource,
          resource: resource.cleaned_resource // Use cleaned name as the resource name
        });
      }
    });

    const finalResources = Array.from(resourceMap.values());

    // Generate literature references by database and type (to match original format)
    console.log('Querying literature references by database and interaction type...');
    const literatureRefsByDatabaseAndType = await db.execute(sql`
      WITH all_refs AS (
        -- Interactions table
        SELECT 
          TRIM(unnest(string_to_array(sources, ';'))) AS database,
          type AS interaction_type,
          TRIM(unnest(string_to_array("references", ';'))) AS reference
        FROM interactions
        WHERE sources IS NOT NULL 
          AND "references" IS NOT NULL 
          AND "references" != ''
        
        UNION ALL
        
        -- Enzyme-substrate relationships
        SELECT 
          TRIM(unnest(string_to_array(sources, ';'))) AS database,
          'enzyme-substrate' AS interaction_type,
          TRIM(unnest(string_to_array("references", ';'))) AS reference
        FROM enz_sub
        WHERE sources IS NOT NULL 
          AND "references" IS NOT NULL 
          AND "references" != ''
        
        UNION ALL
        
        -- Complexes
        SELECT 
          TRIM(unnest(string_to_array(sources, ';'))) AS database,
          'complex' AS interaction_type,
          TRIM(unnest(string_to_array("references", ';'))) AS reference
        FROM complexes
        WHERE sources IS NOT NULL 
          AND "references" IS NOT NULL 
          AND "references" != ''
      )
      SELECT 
        database,
        interaction_type,
        COUNT(DISTINCT reference)::int AS unique_reference_count
      FROM all_refs
      WHERE reference IS NOT NULL AND reference != ''
      GROUP BY database, interaction_type
      ORDER BY database, interaction_type
    `);
    
    console.log(`✓ Literature references by database and type: ${literatureRefsByDatabaseAndType.length} combinations`);

    // Also generate the overlap data
    console.log('Querying resource overlap...');
    const resourceOverlap = await db.execute(sql`
      WITH entry_resource_mapping AS (
        -- Interactions: using source-target pair as entry identifier
        SELECT 
          CONCAT(source, '-', target) AS entry_id,
          'interaction' AS entry_type,
          TRIM(unnest(string_to_array(sources, ';'))) AS resource
        FROM interactions
        WHERE sources IS NOT NULL AND sources != ''
        
        UNION ALL
        
        -- Enzyme-substrate: using enzyme-substrate-modification as entry identifier
        SELECT 
          CONCAT(enzyme, '-', substrate, '-', COALESCE(modification, 'none')) AS entry_id,
          'enzyme-substrate' AS entry_type,
          TRIM(unnest(string_to_array(sources, ';'))) AS resource
        FROM enz_sub
        WHERE sources IS NOT NULL AND sources != ''
        
        UNION ALL
        
        -- Complexes: using complex name as entry identifier
        SELECT 
          name AS entry_id,
          'complex' AS entry_type,
          TRIM(unnest(string_to_array(sources, ';'))) AS resource
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

    console.log('Writing results to JSON file...');
    
    // Create the unified stats object
    const unifiedStats = {
      resources: finalResources,
      resourceOverlap: resourceOverlap,
      plotData: {
        literatureRefsByDatabaseAndType: literatureRefsByDatabaseAndType
      },
      metadata: {
        totalResources: new Set(finalResources.map((r: any) => r.cleaned_resource)).size,
        totalRecords: finalResources.reduce((sum: number, r: any) => sum + r.record_count, 0),
        totalReferences: finalResources.reduce((sum: number, r: any) => sum + (r.unique_references?.length || 0), 0),
        categoryCounts: {
          interactions: finalResources.filter((r: any) => r.database_category === 'Interactions').length,
          annotations: finalResources.filter((r: any) => r.database_category === 'Annotations').length,
          intercellular: finalResources.filter((r: any) => r.database_category === 'Intercellular').length,
          complexes: finalResources.filter((r: any) => r.database_category === 'Complexes').length,
          enzymeSubstrate: finalResources.filter((r: any) => r.database_category === 'Enzyme-Substrate').length
        }
      },
      generatedAt: new Date().toISOString(),
    };

    // Write to JSON file
    const outputPath = join(process.cwd(), 'src/data/unified-db-stats.json');
    writeFileSync(outputPath, JSON.stringify(unifiedStats, null, 2));

    console.log(`Unified database statistics generated successfully at ${outputPath}`);
    console.log('Summary:');
    console.log(`- Total unique resources: ${unifiedStats.metadata.totalResources}`);
    console.log(`- Total records: ${unifiedStats.metadata.totalRecords.toLocaleString()}`);
    console.log(`- Total references: ${unifiedStats.metadata.totalReferences.toLocaleString()}`);
    console.log('\nCategory breakdown:');
    Object.entries(unifiedStats.metadata.categoryCounts).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}`);
    });

  } catch (error) {
    console.error('Error generating unified database statistics:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }

  process.exit(0);
}

generateUnifiedDatabaseStats();