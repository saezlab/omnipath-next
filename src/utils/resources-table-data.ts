import dbStats from "@/data/db-stats.json";
import maintenanceCategories from "@/data/resources_by_maintenance_category.json";
import resourcesByLicense from "@/data/resources_by_license.json";
import { cleanSourceName } from "@/utils/database-treemap-data";

export interface ResourceData {
  name: string;
  originalNames: string[];
  categories: string[];
  subcategories: string[];
  recordCount: number;
  recordsByCategory: Record<string, number>;
  license: "academic_nonprofit" | "commercial" | "unknown";
  maintenance: "frequent updates" | "infrequent updates" | "no updates" | "unknown";
}

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

const sourceToAnnotationCategory = new Map<string, string>();
Object.entries(ANNOTATION_SOURCE_GROUPS).forEach(([category, sources]) => {
  sources.forEach(source => {
    sourceToAnnotationCategory.set(source.toLowerCase(), category);
  });
});

function getMaintenanceStatus(resourceName: string): ResourceData["maintenance"] {
  const lowerName = resourceName.toLowerCase();
  
  if ((maintenanceCategories["frequent updates"] as string[]).some(r => r.toLowerCase() === lowerName)) {
    return "frequent updates";
  }
  if ((maintenanceCategories["infrequent updates"] as string[]).some(r => r.toLowerCase() === lowerName)) {
    return "infrequent updates";
  }
  if ((maintenanceCategories["no updates"] as string[]).some(r => r.toLowerCase() === lowerName)) {
    return "no updates";
  }
  return "unknown";
}

function getLicenseType(resourceName: string): ResourceData["license"] {
  const lowerName = resourceName.toLowerCase();
  
  if ((resourcesByLicense.academic_nonprofit as string[]).some(r => r.toLowerCase() === lowerName)) {
    return "academic_nonprofit";
  }
  if ((resourcesByLicense.commercial as string[]).some(r => r.toLowerCase() === lowerName)) {
    return "commercial";
  }
  return "unknown";
}

function getInteractionType(type: string): string {
  switch(type) {
    case "transcriptional": return "Transcriptional";
    case "post_translational": return "Post-translational";
    case "mirna_transcriptional": return "miRNA Transcriptional";
    case "post_transcriptional": return "Post-transcriptional";
    case "lncrna_post_transcriptional": return "Post-transcriptional";
    case "small_molecule_protein": return "Small Molecule-Protein";
    default: return "Other";
  }
}

export function getAllResources(): ResourceData[] {
  const resourcesMap = new Map<string, {
    originalNames: Set<string>;
    categories: Set<string>;
    subcategories: Set<string>;
    recordsByCategory: Record<string, number>;
    totalRecords: number;
  }>();
  
  // Process interactions by type
  dbStats.interactionsSourceType.forEach(item => {
    const cleanedName = cleanSourceName(item.source);
    
    if (!resourcesMap.has(cleanedName)) {
      resourcesMap.set(cleanedName, {
        originalNames: new Set(),
        categories: new Set(),
        subcategories: new Set(),
        recordsByCategory: {},
        totalRecords: 0
      });
    }
    
    const resource = resourcesMap.get(cleanedName)!;
    resource.originalNames.add(item.source);
    resource.categories.add("Interactions");
    const subcategory = getInteractionType(item.type);
    if (subcategory !== "Other") {
      resource.subcategories.add(subcategory);
    }
    resource.recordsByCategory["Interactions"] = (resource.recordsByCategory["Interactions"] || 0) + item.record_count;
    resource.totalRecords += item.record_count;
  });
  
  // Process annotations
  dbStats.annotations.forEach(item => {
    const cleanedName = cleanSourceName(item.source);
    
    if (!resourcesMap.has(cleanedName)) {
      resourcesMap.set(cleanedName, {
        originalNames: new Set(),
        categories: new Set(),
        subcategories: new Set(),
        recordsByCategory: {},
        totalRecords: 0
      });
    }
    
    const resource = resourcesMap.get(cleanedName)!;
    resource.originalNames.add(item.source);
    resource.categories.add("Annotations");
    const subcategory = sourceToAnnotationCategory.get(item.source.toLowerCase()) || "Other";
    if (subcategory !== "Other") {
      resource.subcategories.add(subcategory);
    }
    resource.recordsByCategory["Annotations"] = (resource.recordsByCategory["Annotations"] || 0) + item.record_count;
    resource.totalRecords += item.record_count;
  });
  
  // Process enzyme-substrate
  dbStats.enz_sub.forEach(item => {
    const cleanedName = cleanSourceName(item.source);
    
    if (!resourcesMap.has(cleanedName)) {
      resourcesMap.set(cleanedName, {
        originalNames: new Set(),
        categories: new Set(),
        subcategories: new Set(),
        recordsByCategory: {},
        totalRecords: 0
      });
    }
    
    const resource = resourcesMap.get(cleanedName)!;
    resource.originalNames.add(item.source);
    resource.categories.add("Enzyme-Substrate");
    resource.recordsByCategory["Enzyme-Substrate"] = (resource.recordsByCategory["Enzyme-Substrate"] || 0) + item.record_count;
    resource.totalRecords += item.record_count;
  });
  
  // Process complexes
  dbStats.complexes.forEach(item => {
    const cleanedName = cleanSourceName(item.source);
    
    if (!resourcesMap.has(cleanedName)) {
      resourcesMap.set(cleanedName, {
        originalNames: new Set(),
        categories: new Set(),
        subcategories: new Set(),
        recordsByCategory: {},
        totalRecords: 0
      });
    }
    
    const resource = resourcesMap.get(cleanedName)!;
    resource.originalNames.add(item.source);
    resource.categories.add("Complexes");
    resource.recordsByCategory["Complexes"] = (resource.recordsByCategory["Complexes"] || 0) + item.record_count;
    resource.totalRecords += item.record_count;
  });
  
  // Process intercellular
  dbStats.intercell.forEach(item => {
    const cleanedName = cleanSourceName(item.source);
    
    if (!resourcesMap.has(cleanedName)) {
      resourcesMap.set(cleanedName, {
        originalNames: new Set(),
        categories: new Set(),
        subcategories: new Set(),
        recordsByCategory: {},
        totalRecords: 0
      });
    }
    
    const resource = resourcesMap.get(cleanedName)!;
    resource.originalNames.add(item.source);
    resource.categories.add("Intercellular");
    resource.recordsByCategory["Intercellular"] = (resource.recordsByCategory["Intercellular"] || 0) + item.record_count;
    resource.totalRecords += item.record_count;
  });
  
  // Convert to final format
  const results: ResourceData[] = [];
  resourcesMap.forEach((data, name) => {
    results.push({
      name,
      originalNames: Array.from(data.originalNames),
      categories: Array.from(data.categories).sort(),
      subcategories: Array.from(data.subcategories).sort(),
      recordCount: data.totalRecords,
      recordsByCategory: data.recordsByCategory,
      license: getLicenseType(name),
      maintenance: getMaintenanceStatus(name)
    });
  });
  
  return results.sort((a, b) => b.recordCount - a.recordCount);
}

export function getResourceStats() {
  const resources = getAllResources();
  
  const stats = {
    total: resources.length,
    byCategory: {} as Record<string, number>,
    byLicense: {} as Record<string, number>,
    byMaintenance: {} as Record<string, number>,
    totalRecords: 0
  };
  
  resources.forEach(resource => {
    // Count by categories (a resource can be in multiple categories)
    resource.categories.forEach(category => {
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });
    
    // Count by license
    stats.byLicense[resource.license] = (stats.byLicense[resource.license] || 0) + 1;
    
    // Count by maintenance
    stats.byMaintenance[resource.maintenance] = (stats.byMaintenance[resource.maintenance] || 0) + 1;
    
    // Total records
    stats.totalRecords += resource.recordCount;
  });
  
  return stats;
}

export const maintenanceColors = {
  "frequent updates": "#4cbd38",       // Green - actively maintained
  "infrequent updates": "#f89d0e",     // Orange - occasionally updated
  "no updates": "#d22027",             // Red - no updates
  unknown: "#6b7280"                   // Gray - unknown status
};

export const licenseColors = {
  academic_nonprofit: "#176fc1", // Blue - academic/non-profit
  commercial: "#059669",         // Green - commercial
  unknown: "#6b7280"            // Gray - unknown
};