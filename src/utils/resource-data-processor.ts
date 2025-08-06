/* eslint-disable @typescript-eslint/no-explicit-any */

import dbStats from "@/data/db-stats.json";
import maintenanceCategories from "@/data/resources_by_maintenance_category.json";
import resourcesByLicense from "@/data/resources_by_license.json";

// Resources to exclude from plots (composite databases or no licenses)
const EXCLUDED_RESOURCES = new Set(['CPAD', 'CollecTRI', 'DoRothEA', 'cellsignal.com']);

// Source name cleaning function
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
export function deduplicateSources(sources: Array<{ source: string; record_count: number }>): Array<{ source: string; record_count: number }> {
  const deduplicatedMap = new Map<string, { source: string; record_count: number }>();
  
  sources.forEach(item => {
    const cleanedName = cleanSourceName(item.source);
    
    // Skip excluded resources
    if (EXCLUDED_RESOURCES.has(cleanedName)) {
      return;
    }
    
    const existing = deduplicatedMap.get(cleanedName);
    
    if (!existing) {
      // First occurrence of this cleaned name
      deduplicatedMap.set(cleanedName, { source: cleanedName, record_count: item.record_count });
    } else {
      // Check if current item is the original (matches cleaned name exactly)
      const isCurrentOriginal = item.source === cleanedName;
      const isExistingOriginal = existing.source === cleanedName;
      
      if (isCurrentOriginal && !isExistingOriginal) {
        // Current is original, existing is secondary - replace
        deduplicatedMap.set(cleanedName, { source: cleanedName, record_count: item.record_count });
      } else if (!isCurrentOriginal && !isExistingOriginal) {
        // Both are secondary sources - keep the one with higher record count, but aggregate
        existing.record_count += item.record_count;
      } else if (!isCurrentOriginal && isExistingOriginal) {
        // Existing is original, add current record count to it
        existing.record_count += item.record_count;
      }
    }
  });
  
  return Array.from(deduplicatedMap.values());
}

// Database section interface
export interface DatabaseSection {
  title: string;
  data: Array<{ source: string; record_count: number }>;
  description: string;
}

// Get all database sections with deduplicated data
export function getDatabaseSections(): DatabaseSection[] {
  return [
    {
      title: "Interactions",
      data: deduplicateSources(dbStats.interactions),
      description: "Molecular interactions between proteins"
    },
    {
      title: "Enzyme-Substrate",
      data: deduplicateSources(dbStats.enz_sub),
      description: "Enzyme-substrate relationships"
    },
    {
      title: "Complexes",
      data: deduplicateSources(dbStats.complexes),
      description: "Protein complex compositions"
    },
    {
      title: "Annotations",
      data: deduplicateSources(dbStats.annotations),
      description: "Functional annotations and properties"
    },
    {
      title: "Intercellular",
      data: deduplicateSources(dbStats.intercell),
      description: "Intercellular communication molecules"
    }
  ];
}

// Resource categorization types
export type MaintenanceCategory = 'frequent' | 'infrequent' | 'one_time_paper' | 'discontinued';
export type LicenseCategory = 'academic_nonprofit' | 'commercial';

// Create mappings for resources to categories
export interface ResourceMappings {
  sourceMaintenanceMap: Record<string, MaintenanceCategory>;
  sourceLicenseMap: Record<string, LicenseCategory>;
  unmappedMaintenanceSources: string[];
  unmappedLicenseSources: string[];
}

export function createResourceMappings(): ResourceMappings {
  const databases = getDatabaseSections();
  const allSources = new Set<string>();
  
  databases.forEach(db => {
    db.data.forEach(item => allSources.add(item.source));
  });

  const sourceMaintenanceMap: Record<string, MaintenanceCategory> = {};
  const sourceLicenseMap: Record<string, LicenseCategory> = {};
  const unmappedMaintenanceSources: string[] = [];
  const unmappedLicenseSources: string[] = [];
  
  // Map maintenance categories (using cleaned names for matching)
  Object.entries(maintenanceCategories).forEach(([category, resources]) => {
    (resources as string[]).forEach(resource => {
      const cleanedResource = cleanSourceName(resource);
      const matchingSource = Array.from(allSources).find(source => 
        cleanSourceName(source).toLowerCase() === cleanedResource.toLowerCase()
      );
      if (matchingSource) {
        sourceMaintenanceMap[matchingSource] = category as MaintenanceCategory;
      }
    });
  });

  // Map license categories (using cleaned names for matching)
  resourcesByLicense.academic_nonprofit.forEach(resource => {
    const cleanedResource = cleanSourceName(resource);
    const matchingSource = Array.from(allSources).find(source => 
      cleanSourceName(source).toLowerCase() === cleanedResource.toLowerCase()
    );
    if (matchingSource) {
      sourceLicenseMap[matchingSource] = 'academic_nonprofit';
    }
  });

  resourcesByLicense.commercial.forEach(resource => {
    const cleanedResource = cleanSourceName(resource);
    const matchingSource = Array.from(allSources).find(source => 
      cleanSourceName(source).toLowerCase() === cleanedResource.toLowerCase()
    );
    if (matchingSource) {
      sourceLicenseMap[matchingSource] = 'commercial';
    }
  });

  // Find unmapped sources
  Array.from(allSources).forEach(source => {
    if (!sourceMaintenanceMap[source]) {
      unmappedMaintenanceSources.push(source);
    }
    if (!sourceLicenseMap[source]) {
      unmappedLicenseSources.push(source);
    }
  });

  return { 
    sourceMaintenanceMap, 
    sourceLicenseMap,
    unmappedMaintenanceSources,
    unmappedLicenseSources 
  };
}

// Chart data interfaces
export interface ChartDataPoint {
  category: string;
  frequent: number;
  infrequent: number;
  one_time_paper: number;
  discontinued: number;
  total?: number;
  totalRecords?: number;
  academic_nonprofit?: number;
  commercial?: number;
}

export interface OverlapData {
  entryType: string;
  '1 resource': number;
  '2 resources': number;
  '3 resources': number;
  '4 resources': number;
  '5+ resources': number;
  totalEntries: number;
}

// Process data for charts
export interface ProcessedChartData {
  resourcesData: ChartDataPoint[];
  recordsData: ChartDataPoint[];
  referencesData: ChartDataPoint[];
  combinedOverlapData: OverlapData[];
}

export function processChartData(): ProcessedChartData {
  const databases = getDatabaseSections();
  const { sourceMaintenanceMap, sourceLicenseMap } = createResourceMappings();

  // 1. Resources per database
  const resourcesData: ChartDataPoint[] = databases.map(db => {
    const maintenanceBreakdown: Record<MaintenanceCategory, number> = {
      frequent: 0,
      infrequent: 0,
      one_time_paper: 0,
      discontinued: 0
    };

    const licenseBreakdown: Record<LicenseCategory, number> = {
      academic_nonprofit: 0,
      commercial: 0
    };

    db.data.forEach(source => {
      const maintenanceCategory = sourceMaintenanceMap[source.source];
      if (maintenanceCategory) {
        maintenanceBreakdown[maintenanceCategory]++;
      }

      const licenseCategory = sourceLicenseMap[source.source];
      if (licenseCategory) {
        licenseBreakdown[licenseCategory]++;
      }
    });

    return {
      category: db.title,
      frequent: maintenanceBreakdown.frequent,
      infrequent: maintenanceBreakdown.infrequent,
      one_time_paper: maintenanceBreakdown.one_time_paper,
      discontinued: maintenanceBreakdown.discontinued,
      academic_nonprofit: licenseBreakdown.academic_nonprofit,
      commercial: licenseBreakdown.commercial,
      total: db.data.length
    };
  });

  // 2. Records per database (percentages)
  const recordsData: ChartDataPoint[] = databases.map(db => {
    const maintenanceBreakdown: Record<MaintenanceCategory, number> = {
      frequent: 0,
      infrequent: 0,
      one_time_paper: 0,
      discontinued: 0
    };

    const licenseBreakdown: Record<LicenseCategory, number> = {
      academic_nonprofit: 0,
      commercial: 0
    };

    db.data.forEach(source => {
      const maintenanceCategory = sourceMaintenanceMap[source.source];
      if (maintenanceCategory) {
        maintenanceBreakdown[maintenanceCategory] += source.record_count;
      }

      const licenseCategory = sourceLicenseMap[source.source];
      if (licenseCategory) {
        licenseBreakdown[licenseCategory] += source.record_count;
      }
    });

    const total = db.data.reduce((sum, item) => sum + item.record_count, 0);
    
    return {
      category: db.title,
      frequent: total > 0 ? ((maintenanceBreakdown.frequent / total) * 100) : 0,
      infrequent: total > 0 ? ((maintenanceBreakdown.infrequent / total) * 100) : 0,
      one_time_paper: total > 0 ? ((maintenanceBreakdown.one_time_paper / total) * 100) : 0,
      discontinued: total > 0 ? ((maintenanceBreakdown.discontinued / total) * 100) : 0,
      academic_nonprofit: total > 0 ? ((licenseBreakdown.academic_nonprofit / total) * 100) : 0,
      commercial: total > 0 ? ((licenseBreakdown.commercial / total) * 100) : 0,
      totalRecords: total
    };
  });

  // 3. References per database
  const referencesData: ChartDataPoint[] = databases.map(db => {
    const dbNames = db.data.map(d => d.source);
    const literatureRefs = (dbStats.plotData?.literatureRefsByDatabaseAndType || [])
      .filter((ref: any) => dbNames.includes(ref.database));
    
    const referenceMap: Record<string, { count: number; databases: string[] }> = {};
    
    literatureRefs.forEach((ref: any) => {
      const refKey = `${ref.interaction_type}_${ref.unique_reference_count}`;
      
      if (!referenceMap[refKey]) {
        referenceMap[refKey] = { count: ref.unique_reference_count, databases: [] };
      }
      referenceMap[refKey].databases.push(ref.database);
    });

    const priorityOrder: MaintenanceCategory[] = ['frequent', 'infrequent', 'one_time_paper', 'discontinued'];
    const maintenanceBreakdown: Record<MaintenanceCategory, number> = {
      frequent: 0,
      infrequent: 0,
      one_time_paper: 0,
      discontinued: 0
    };

    Object.values(referenceMap).forEach(refInfo => {
      let bestCategory: MaintenanceCategory = 'discontinued';
      
      refInfo.databases.forEach(database => {
        const category = sourceMaintenanceMap[database];
        if (category) {
          const currentPriority = priorityOrder.indexOf(category);
          const bestPriority = priorityOrder.indexOf(bestCategory);
          
          if (currentPriority < bestPriority) {
            bestCategory = category;
          }
        }
      });
      
      maintenanceBreakdown[bestCategory] += refInfo.count;
    });

    const totalReferences = Object.values(referenceMap).reduce((sum, refInfo) => sum + refInfo.count, 0);

    return {
      category: db.title,
      frequent: maintenanceBreakdown.frequent,
      infrequent: maintenanceBreakdown.infrequent,
      one_time_paper: maintenanceBreakdown.one_time_paper,
      discontinued: maintenanceBreakdown.discontinued,
      total: totalReferences
    };
  });

  // 4. Resource overlap data
  const overlapData = dbStats.plotData?.resourceOverlap || [];
  
  const createOverlapPercentageData = (): OverlapData[] => {
    const entryTypes = ['interaction', 'enzyme-substrate', 'complex'];
    
    return entryTypes.map(entryType => {
      const typeData = overlapData.filter((item: any) => item.entry_type === entryType);
      
      const grouped: Record<string, number> = {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5+': 0
      };

      typeData.forEach((item: any) => {
        if (item.number_of_resources === 1) {
          grouped['1'] += item.number_of_entries;
        } else if (item.number_of_resources === 2) {
          grouped['2'] += item.number_of_entries;
        } else if (item.number_of_resources === 3) {
          grouped['3'] += item.number_of_entries;
        } else if (item.number_of_resources === 4) {
          grouped['4'] += item.number_of_entries;
        } else if (item.number_of_resources >= 5) {
          grouped['5+'] += item.number_of_entries;
        }
      });

      const total = Object.values(grouped).reduce((sum, count) => sum + count, 0);
      
      return {
        entryType: entryType.charAt(0).toUpperCase() + entryType.slice(1).replace('-', ' '),
        '1 resource': total > 0 ? ((grouped['1'] / total) * 100) : 0,
        '2 resources': total > 0 ? ((grouped['2'] / total) * 100) : 0,
        '3 resources': total > 0 ? ((grouped['3'] / total) * 100) : 0,
        '4 resources': total > 0 ? ((grouped['4'] / total) * 100) : 0,
        '5+ resources': total > 0 ? ((grouped['5+'] / total) * 100) : 0,
        totalEntries: total
      };
    });
  };

  const combinedOverlapData = createOverlapPercentageData();

  return { resourcesData, recordsData, referencesData, combinedOverlapData };
}

// Get resource counts for sizing calculations
export function getResourceCounts() {
  const databases = getDatabaseSections();
  
  return {
    interactions: databases.find(db => db.title === "Interactions")?.data.length || 0,
    annotations: databases.find(db => db.title === "Annotations")?.data.length || 0,
    intercellular: databases.find(db => db.title === "Intercellular")?.data.length || 0,
    complexes: databases.find(db => db.title === "Complexes")?.data.length || 0,
    enzymeSubstrate: databases.find(db => db.title === "Enzyme-Substrate")?.data.length || 0
  };
}

// Color schemes for charts
export const CHART_COLORS = {
  primary: '#176fc1',
  secondary: '#d22027',
  tertiary: '#4cbd38',
  maintenance: {
    frequent: '#4cbd38',    // Green - active/good
    infrequent: '#f89d0e',  // Orange - caution
    one_time_paper: '#d22027', // Red - concerning
    discontinued: '#5b205f',   // Dark purple - problematic
    unknown: '#6b7280'
  },
  license: {
    academic_nonprofit: '#9333ea', // Purple - academic/nonprofit
    commercial: '#059669'          // Green - commercial
  },
  overlap: ['#176fc1', '#00acc1', '#5e35b1', '#f89d0e', '#d22027']
};