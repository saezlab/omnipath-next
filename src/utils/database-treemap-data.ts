/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import dbStats from "@/data/db-stats.json";

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

// Color schemes
export const databaseColors = {
  Interactions: "#176fc1",      // Havelock blue
  "Enzyme-Substrate": "#d22027", // Tomato
  Complexes: "#4cbd38",          // Forest green
  Annotations: "#f89d0e",        // Orange
  Intercellular: "#5b205f"       // Seance
};

export const interactionTypeColors = {
  "transcriptional": "#176fc1",      // Havelock blue
  "post_translational": "#00acc1",   // Cyan
  "mirna_transcriptional": "#5e35b1", // Deep purple
  "post_transcriptional": "#1e88e5",  // Bright blue
  "small_molecule_protein": "#00897b" // Teal
};

export const annotationCategoryColors = {
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
};

// Alternative color schemes for the alternative visualization
export const databaseColorsAlt = {
  Interactions: "#2563eb",      // Bright blue
  "Enzyme-Substrate": "#dc2626", // Red
  Complexes: "#16a34a",          // Green
  Annotations: "#ea580c",        // Orange
  Intercellular: "#7c3aed"       // Purple
};

export const interactionTypeColorsAlt = {
  "transcriptional": "#1e40af",
  "post_translational": "#2563eb",
  "mirna_transcriptional": "#3b82f6",
  "post_transcriptional": "#60a5fa",
  "small_molecule_protein": "#93bbfc"
};

export const annotationCategoryColorsAlt = {
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
};

// Source groups from filter sidebar
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

// Data cleaning function
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

// Deduplicate sources by cleaned name
function deduplicateSources(sources: any[]): any[] {
  const deduplicatedMap = new Map<string, any>();
  sources.forEach(item => {
    const cleanedName = cleanSourceName(item.source);
    const existing = deduplicatedMap.get(cleanedName);
    
    if (!existing) {
      // First occurrence of this cleaned name
      deduplicatedMap.set(cleanedName, item);
    } else {
      // Check if current item is the original (matches cleaned name exactly)
      const isCurrentOriginal = item.source === cleanedName;
      const isExistingOriginal = existing.source === cleanedName;
      
      if (isCurrentOriginal && !isExistingOriginal) {
        // Current is original, existing is secondary - replace
        deduplicatedMap.set(cleanedName, item);
      } else if (!isCurrentOriginal && !isExistingOriginal) {
        // Both are secondary sources - keep the one with higher record count
        if (item.record_count > existing.record_count) {
          deduplicatedMap.set(cleanedName, item);
        }
      }
      // If existing is original, keep it regardless of record count
    }
  });
  return Array.from(deduplicatedMap.values());
}

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
      const deduplicatedSources = deduplicateSources(sources);
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
      const deduplicatedSources = deduplicateSources(sources);
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
  const deduplicatedSources = deduplicateSources(dbStats.enzsub);
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
  const deduplicatedSources = deduplicateSources(dbStats.complexes);
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
  const deduplicatedSources = deduplicateSources(dbStats.intercell);
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
    enzymeSubstrate: new Set(dbStats.enzsub.map(item => cleanSourceName(item.source))).size
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
  
  // Apply alternative colors
  data.interactions.color = databaseColorsAlt.Interactions;
  data.enzymeSubstrate.color = databaseColorsAlt["Enzyme-Substrate"];
  data.complexes.color = databaseColorsAlt.Complexes;
  data.annotations.color = databaseColorsAlt.Annotations;
  data.intercellular.color = databaseColorsAlt.Intercellular;
  
  // Apply alternative interaction type colors
  data.interactions.children.forEach(child => {
    const type = child.name.toLowerCase().replace(/ /g, '_').replace('mirna_transcriptional', 'mirna_transcriptional');
    if (type in interactionTypeColorsAlt) {
      child.color = interactionTypeColorsAlt[type as keyof typeof interactionTypeColorsAlt];
    }
  });
  
  // Apply alternative annotation category colors
  data.annotations.children.forEach(child => {
    if (child.name in annotationCategoryColorsAlt) {
      child.color = annotationCategoryColorsAlt[child.name as keyof typeof annotationCategoryColorsAlt];
    }
  });
  
  return data;
}