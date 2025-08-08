/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import dbStats from "@/data/db-stats.json";
import maintenanceCategories from "@/data/resources_by_maintenance_category.json";
import resourcesByLicense from "@/data/resources_by_license.json";
import resourcesDetails from "@/data/resources-details.json";

// ============================================================================
// SHARED TYPES AND INTERFACES
// ============================================================================

export interface VoronoiNode {
  name: string;
  weight?: number;
  color?: string;
  children?: VoronoiNode[];
  code?: string;
  category?: string;
  originalName?: string;
  interactionType?: string;
}

export interface LicenseDetails {
  name: string;
  fullName: string;
  attribution: string;
  url?: string;
}

export interface ResourceUrls {
  articles?: string[];
  webpages?: string[];
}

export interface ResourceData {
  name: string;
  originalNames: string[];
  categories: string[];
  subcategories: string[];
  recordCount: number;
  recordsByCategory: Record<string, number>;
  license: "academic_nonprofit" | "commercial" | "unknown";
  maintenance: "frequent updates" | "infrequent updates" | "no updates" | "unknown";
  
  // Enhanced fields from YAML data
  licenseDetails?: LicenseDetails;
  urls?: ResourceUrls;
  pubmeds?: number[];
  emails?: Array<[string, string]>; // [email, name] tuples
  recommend?: string;
  descriptions?: string[];
}

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export const colorSchemes = {
  default: {
    databases: {
      Interactions: "#176fc1",      // Havelock blue
      "Enzyme-Substrate": "#d22027", // Tomato
      Complexes: "#4cbd38",          // Forest green
      Annotations: "#f89d0e",        // Orange
      Intercellular: "#5b205f"       // Seance
    },
    interactionTypes: {
      "transcriptional": "#176fc1",      // Havelock blue
      "post_translational": "#00acc1",   // Cyan
      "mirna_transcriptional": "#5e35b1", // Deep purple
      "post_transcriptional": "#1e88e5",  // Bright blue
      "small_molecule_protein": "#00897b" // Teal
    },
    annotationCategories: {
      "Cell-cell communication": "#f89d0e",    // Orange
      "Localization (subcellular)": "#ef5350", // Red
      "Membrane localization & topology": "#ab47bc", // Purple
      "Extracellular matrix, adhesion": "#42a5f5",   // Light blue
      "Vesicles, secretome": "#66bb6a",       // Green
      "Function, pathway": "#ffa726",         // Amber
      "Signatures": "#8d6e63",               // Brown
      "Disease, cancer": "#ec407a",          // Pink
      "Protein classes & families": "#5c6bc0", // Indigo
      "Cell type, tissue": "#26a69a",        // Teal
      "Transcription factors": "#d4e157"     // Lime
    }
  },
  alternative: {
    databases: {
      Interactions: "#2563eb",      // Bright blue
      "Enzyme-Substrate": "#dc2626", // Red
      Complexes: "#16a34a",          // Green
      Annotations: "#ea580c",        // Orange
      Intercellular: "#7c3aed"       // Purple
    },
    interactionTypes: {
      "transcriptional": "#1e40af",
      "post_translational": "#2563eb",
      "mirna_transcriptional": "#3b82f6",
      "post_transcriptional": "#60a5fa",
      "small_molecule_protein": "#93bbfc"
    },
    annotationCategories: {
      "Cell-cell communication": "#dc2626",
      "Localization (subcellular)": "#ef4444",
      "Membrane localization & topology": "#f97316",
      "Extracellular matrix, adhesion": "#fb923c",
      "Vesicles, secretome": "#fbbf24",
      "Function, pathway": "#84cc16",
      "Signatures": "#22c55e",
      "Disease, cancer": "#06b6d4",
      "Protein classes & families": "#3b82f6",
      "Cell type, tissue": "#8b5cf6",
      "Transcription factors": "#ec4899"
    }
  }
};

// Backward compatibility exports
export const databaseColors = colorSchemes.default.databases;
export const interactionTypeColors = colorSchemes.default.interactionTypes;
export const annotationCategoryColors = colorSchemes.default.annotationCategories;
export const databaseColorsAlt = colorSchemes.alternative.databases;
export const interactionTypeColorsAlt = colorSchemes.alternative.interactionTypes;
export const annotationCategoryColorsAlt = colorSchemes.alternative.annotationCategories;

// ============================================================================
// ANNOTATION SOURCE GROUPS
// ============================================================================

const ANNOTATION_SOURCE_GROUPS = {
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

// Create a map for quick lookup
const sourceToCategory = new Map<string, string>();
Object.entries(ANNOTATION_SOURCE_GROUPS).forEach(([category, sources]) => {
  sources.forEach(source => {
    sourceToCategory.set(source.toLowerCase(), category);
  });
});

// ============================================================================
// SHARED UTILITY FUNCTIONS
// ============================================================================

export function cleanSourceName(sourceName: string): string {
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

// Load resource details from YAML data
function loadResourceDetails(): Map<string, any> {
  const resourceDetailsMap = new Map<string, any>();
  
  // Load from consolidated JSON file
  Object.entries(resourcesDetails).forEach(([resourceName, data]) => {
    // Store with both original name and cleaned name for flexible lookup
    resourceDetailsMap.set(resourceName, data);
    const cleanedName = cleanSourceName(resourceName);
    if (cleanedName !== resourceName) {
      resourceDetailsMap.set(cleanedName, data);
    }
  });
  
  return resourceDetailsMap;
}

// Shared license/maintenance mapping functions
function createLicenseMaintenanceMaps() {
  const sourceMaintenanceMap: Record<string, ResourceData["maintenance"]> = {};
  const sourceLicenseMap: Record<string, ResourceData["license"]> = {};
  
  // Map maintenance categories
  Object.entries(maintenanceCategories).forEach(([category, resources]) => {
    (resources as string[]).forEach(resource => {
      const cleanedResource = cleanSourceName(resource);
      // Store mapping for both original and cleaned names, using lowercase keys for case-insensitive lookup
      sourceMaintenanceMap[resource.toLowerCase()] = category as ResourceData["maintenance"];
      sourceMaintenanceMap[cleanedResource.toLowerCase()] = category as ResourceData["maintenance"];
    });
  });

  // Map license categories
  resourcesByLicense.academic_nonprofit.forEach(resource => {
    const cleanedResource = cleanSourceName(resource);
    // Store mapping for both original and cleaned names, using lowercase keys for case-insensitive lookup
    sourceLicenseMap[resource.toLowerCase()] = 'academic_nonprofit';
    sourceLicenseMap[cleanedResource.toLowerCase()] = 'academic_nonprofit';
  });

  resourcesByLicense.commercial.forEach(resource => {
    const cleanedResource = cleanSourceName(resource);
    // Store mapping for both original and cleaned names, using lowercase keys for case-insensitive lookup
    sourceLicenseMap[resource.toLowerCase()] = 'commercial';
    sourceLicenseMap[cleanedResource.toLowerCase()] = 'commercial';
  });

  return { sourceMaintenanceMap, sourceLicenseMap };
}

// Simplified deduplication function - always uses highest count logic
function deduplicateSources(
  sources: Array<{ source: string; record_count: number }>, 
  options: {
    excludeResources?: Set<string>;
    preserveOriginalItem?: boolean;
  } = {}
): any[] {
  const { 
    excludeResources = new Set(),
    preserveOriginalItem = false 
  } = options;
  
  const deduplicatedMap = new Map<string, any>();
  
  sources.forEach(item => {
    const cleanedName = cleanSourceName(item.source);
    
    // Skip excluded resources
    if (excludeResources.has(cleanedName)) {
      return;
    }
    
    const existing = deduplicatedMap.get(cleanedName);
    
    if (!existing) {
      // First occurrence of this cleaned name
      const newItem = preserveOriginalItem ? item : { source: cleanedName, record_count: item.record_count };
      deduplicatedMap.set(cleanedName, newItem);
    } else {
      // Always keep the one with higher record count
      // If counts are equal, prefer the original name (matches cleaned name exactly)
      const isCurrentOriginal = item.source === cleanedName;
      const isExistingOriginal = existing.source === cleanedName;
      
      if (item.record_count > existing.record_count || 
          (item.record_count === existing.record_count && isCurrentOriginal && !isExistingOriginal)) {
        const newItem = preserveOriginalItem ? item : { source: cleanedName, record_count: item.record_count };
        deduplicatedMap.set(cleanedName, newItem);
      }
    }
  });
  
  return Array.from(deduplicatedMap.values());
}

// ============================================================================
// VISUALIZATION DATA PROCESSING (for combined-database-visualization.tsx)
// ============================================================================

// Process interaction types with deduplication
export function processInteractionTypes(): VoronoiNode[] {
  const typeGroups = new Map<string, any[]>();
  
  dbStats.interactionsSourceType.forEach(item => {
    let type = item.type;
    if (type === 'lncrna_post_transcriptional') {
      type = 'post_transcriptional';
    }
    
    if (!typeGroups.has(type)) {
      typeGroups.set(type, []);
    }
    typeGroups.get(type)!.push(item);
  });
  
  const interactionSubsections = [];
  const targetTypes = ['transcriptional', 'post_translational', 'mirna_transcriptional', 'post_transcriptional', 'small_molecule_protein'];
  
  for (const type of targetTypes) {
    const sources = typeGroups.get(type) || [];
    if (sources.length > 0) {
      const deduplicatedSources = deduplicateSources(sources, { preserveOriginalItem: true });
      const sortedSources = deduplicatedSources.sort((a, b) => b.record_count - a.record_count);
      
      interactionSubsections.push({
        name: type === 'mirna_transcriptional' ? 'miRNA Transcriptional' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        color: interactionTypeColors[type as keyof typeof interactionTypeColors],
        children: sortedSources.map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            originalName: d.source,
            interactionType: type,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      });
    }
  }
  
  return interactionSubsections;
}

// Process annotations by category with deduplication
export function processAnnotationsByCategory(): VoronoiNode[] {
  const categoryGroups = new Map<string, any[]>();
  
  dbStats.annotations.forEach(item => {
    const category = sourceToCategory.get(item.source.toLowerCase()) || "Other";
    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, []);
    }
    categoryGroups.get(category)!.push(item);
  });
  
  const annotationSubsections = [];
  
  for (const [category, sources] of categoryGroups.entries()) {
    if (sources.length > 0 && category !== "Other") {
      const deduplicatedSources = deduplicateSources(sources, { preserveOriginalItem: true });
      const sortedSources = deduplicatedSources.sort((a, b) => b.record_count - a.record_count);
      
      annotationSubsections.push({
        name: category,
        color: annotationCategoryColors[category as keyof typeof annotationCategoryColors] || "#999",
        children: sortedSources.map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            originalName: d.source,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      });
    }
  }
  
  return annotationSubsections.sort((a, b) => 
    b.children.reduce((sum, c) => sum + c.weight, 0) - 
    a.children.reduce((sum, c) => sum + c.weight, 0)
  );
}

// Process enzyme-substrate data with deduplication
export function processEnzymeSubstrate(): VoronoiNode[] {
  const deduplicatedSources = deduplicateSources(dbStats.enz_sub, { preserveOriginalItem: true });
  return deduplicatedSources.map(d => {
    const cleanedName = cleanSourceName(d.source);
    return {
      name: cleanedName,
      originalName: d.source,
      weight: Math.log10(d.record_count + 1),
      code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
    };
  });
}

// Process complexes data with deduplication
export function processComplexes(): VoronoiNode[] {
  const deduplicatedSources = deduplicateSources(dbStats.complexes, { preserveOriginalItem: true });
  return deduplicatedSources.map(d => {
    const cleanedName = cleanSourceName(d.source);
    return {
      name: cleanedName,
      originalName: d.source,
      weight: Math.log10(d.record_count + 1),
      code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
    };
  });
}

// Process intercellular data with deduplication
export function processIntercellular(): VoronoiNode[] {
  const deduplicatedSources = deduplicateSources(dbStats.intercell, { preserveOriginalItem: true });
  return deduplicatedSources.map(d => {
    const cleanedName = cleanSourceName(d.source);
    return {
      name: cleanedName,
      originalName: d.source,
      weight: Math.log10(d.record_count + 1),
      code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
    };
  });
}

// Count resources for sizing calculations
export function getResourceCounts() {
  const counts = {
    interactions: new Set(dbStats.interactionsSourceType.map(item => cleanSourceName(item.source))).size,
    annotations: new Set(dbStats.annotations.map(item => cleanSourceName(item.source))).size,
    intercellular: new Set(dbStats.intercell.map(item => cleanSourceName(item.source))).size,
    complexes: new Set(dbStats.complexes.map(item => cleanSourceName(item.source))).size,
    enzymeSubstrate: new Set(dbStats.enz_sub.map(item => cleanSourceName(item.source))).size
  };
  
  return counts;
}

// Calculate proportional sizes for treemaps
export function calculateTreemapSizes(minSize: number = 180, maxSize: number = 380) {
  const resourceCounts = getResourceCounts();
  const totalResources = Object.values(resourceCounts).reduce((a, b) => a + b, 0);
  
  const calculateSize = (count: number): number => {
    const proportion = count / totalResources;
    return Math.max(minSize, Math.min(maxSize, minSize + (maxSize - minSize) * proportion * 3));
  };
  
  return {
    interactions: calculateSize(resourceCounts.interactions),
    annotations: calculateSize(resourceCounts.annotations),
    intercellular: calculateSize(resourceCounts.intercellular),
    complexes: calculateSize(resourceCounts.complexes),
    enzymeSubstrate: calculateSize(resourceCounts.enzymeSubstrate)
  };
}

// Get all database data in a structured format
export function getAllDatabaseData() {
  return {
    interactions: {
      name: "Interactions",
      color: databaseColors.Interactions,
      children: processInteractionTypes()
    },
    enzymeSubstrate: {
      name: "Enzyme-Substrate",
      color: databaseColors["Enzyme-Substrate"],
      children: processEnzymeSubstrate()
    },
    complexes: {
      name: "Complexes",
      color: databaseColors.Complexes,
      children: processComplexes()
    },
    annotations: {
      name: "Annotations",
      color: databaseColors.Annotations,
      children: processAnnotationsByCategory()
    },
    intercellular: {
      name: "Intercellular",
      color: databaseColors.Intercellular,
      children: processIntercellular()
    }
  };
}

// Get all database data with alternative colors
export function getAllDatabaseDataAlt() {
  const data = getAllDatabaseData();
  const altScheme = colorSchemes.alternative;
  
  // Apply alternative colors
  data.interactions.color = altScheme.databases.Interactions;
  data.enzymeSubstrate.color = altScheme.databases["Enzyme-Substrate"];
  data.complexes.color = altScheme.databases.Complexes;
  data.annotations.color = altScheme.databases.Annotations;
  data.intercellular.color = altScheme.databases.Intercellular;
  
  // Apply alternative interaction type colors
  data.interactions.children.forEach(child => {
    const type = child.name.toLowerCase().replace(/ /g, '_').replace('mirna_transcriptional', 'mirna_transcriptional');
    if (type in altScheme.interactionTypes) {
      child.color = altScheme.interactionTypes[type as keyof typeof altScheme.interactionTypes];
    }
  });
  
  // Apply alternative annotation category colors
  data.annotations.children.forEach(child => {
    if (child.name in altScheme.annotationCategories) {
      child.color = altScheme.annotationCategories[child.name as keyof typeof altScheme.annotationCategories];
    }
  });
  
  return data;
}

// ============================================================================
// TABLE DATA PROCESSING (for resources-table.tsx)
// ============================================================================

export function getAllResources(): ResourceData[] {
  const { sourceMaintenanceMap, sourceLicenseMap } = createLicenseMaintenanceMaps();
  const resourceDetailsMap = loadResourceDetails();
  const resourceMap = new Map<string, ResourceData>();
  
  const processResource = (
    source: string,
    recordCount: number,
    category: string,
    subcategory?: string
  ) => {
    const cleanedName = cleanSourceName(source);
    const existing = resourceMap.get(cleanedName);
    
    if (existing) {
      // Add to existing resource
      if (!existing.categories.includes(category)) {
        existing.categories.push(category);
      }
      if (subcategory && !existing.subcategories.includes(subcategory)) {
        existing.subcategories.push(subcategory);
      }
      if (!existing.originalNames.includes(source)) {
        existing.originalNames.push(source);
      }
      existing.recordCount += recordCount;
      existing.recordsByCategory[category] = (existing.recordsByCategory[category] || 0) + recordCount;
    } else {
      // Get resource details from YAML data
      const details = resourceDetailsMap.get(cleanedName) || resourceDetailsMap.get(source);
      
      // Create new resource
      const newResource: ResourceData = {
        name: cleanedName,
        originalNames: [source],
        categories: [category],
        subcategories: subcategory ? [subcategory] : [],
        recordCount,
        recordsByCategory: { [category]: recordCount },
        license: sourceLicenseMap[cleanedName.toLowerCase()] || "unknown",
        maintenance: sourceMaintenanceMap[cleanedName.toLowerCase()] || "unknown"
      };
      
      // Merge YAML data if available
      if (details) {
        if (details.license) {
          newResource.licenseDetails = {
            name: details.license.name,
            fullName: details.license.full_name,
            attribution: details.license.attribution,
            url: details.license.url
          };
        }
        
        if (details.urls) {
          newResource.urls = {
            articles: details.urls.articles,
            webpages: details.urls.webpages
          };
        }
        
        if (details.pubmeds) {
          newResource.pubmeds = details.pubmeds;
        }
        
        if (details.emails) {
          newResource.emails = details.emails;
        }
        
        if (details.recommend) {
          newResource.recommend = details.recommend;
        }
        
        if (details.descriptions) {
          newResource.descriptions = details.descriptions;
        }
      }
      
      resourceMap.set(cleanedName, newResource);
    }
  };

  // Process interactions with subcategories
  dbStats.interactionsSourceType.forEach(item => {
    let type = item.type;
    if (type === 'lncrna_post_transcriptional') {
      type = 'post_transcriptional';
    }
    const subcategory = type === 'mirna_transcriptional' ? 'miRNA Transcriptional' 
      : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    processResource(item.source, item.record_count, "Interactions", subcategory);
  });

  // Process annotations with subcategories
  dbStats.annotations.forEach(item => {
    const subcategory = sourceToCategory.get(item.source.toLowerCase()) || "Other";
    if (subcategory !== "Other") {
      processResource(item.source, item.record_count, "Annotations", subcategory);
    }
  });

  // Process other databases without subcategories
  dbStats.enz_sub.forEach(item => {
    processResource(item.source, item.record_count, "Enzyme-Substrate");
  });

  dbStats.complexes.forEach(item => {
    processResource(item.source, item.record_count, "Complexes");
  });

  dbStats.intercell.forEach(item => {
    processResource(item.source, item.record_count, "Intercellular");
  });

  return Array.from(resourceMap.values()).sort((a, b) => b.recordCount - a.recordCount);
}

export function getResourceStats() {
  const resources = getAllResources();
  
  return {
    total: resources.length,
    totalRecords: resources.reduce((sum, r) => sum + r.recordCount, 0),
    byCategory: {
      Interactions: resources.filter(r => r.categories.includes("Interactions")).length,
      Annotations: resources.filter(r => r.categories.includes("Annotations")).length,
      "Enzyme-Substrate": resources.filter(r => r.categories.includes("Enzyme-Substrate")).length,
      Complexes: resources.filter(r => r.categories.includes("Complexes")).length,
      Intercellular: resources.filter(r => r.categories.includes("Intercellular")).length,
    },
    byLicense: {
      academic_nonprofit: resources.filter(r => r.license === "academic_nonprofit").length,
      commercial: resources.filter(r => r.license === "commercial").length,
      unknown: resources.filter(r => r.license === "unknown").length,
    },
    byMaintenance: {
      "frequent updates": resources.filter(r => r.maintenance === "frequent updates").length,
      "infrequent updates": resources.filter(r => r.maintenance === "infrequent updates").length,
      "no updates": resources.filter(r => r.maintenance === "no updates").length,
      unknown: resources.filter(r => r.maintenance === "unknown").length,
    }
  };
}

// ============================================================================
// CHART DATA PROCESSING (for combined-database-visualization.tsx charts)
// ============================================================================

// Deduplicate sources for chart usage 
export function deduplicateSourcesForCharts(sources: Array<{ source: string; record_count: number }>): Array<{ source: string; record_count: number }> {
  const excludedResources = new Set(['CPAD', 'CollecTRI', 'DoRothEA', 'cellsignal.com']);
  return deduplicateSources(sources, { excludeResources: excludedResources });
}