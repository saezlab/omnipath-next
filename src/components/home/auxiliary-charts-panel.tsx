"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dbStats from "@/data/db-stats.json";
import resourcesMetadata from "@/data/resources.json";
import maintenanceCategories from "@/data/resources_by_maintenance_category.json";

interface DatabaseSection {
  title: string;
  data: Array<{ source: string; record_count: number }>;
  description: string;
}

interface ResourceMetadata {
  type?: string | string[];
  license?: string;
  [key: string]: unknown;
}

// Color scheme for charts
const CHART_COLORS = {
  resources: '#8b5cf6',
  records: '#3b82f6',
  references: '#10b981',
  maintenance: {
    resources: '#f59e0b',
    records: '#ef4444'
  },
  commercial: {
    allowed: '#10b981',
    nonCommercial: '#ef4444',
    unknown: '#6b7280'
  },
  overlap: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
};

export function AuxiliaryChartsPanel() {
  const databases: DatabaseSection[] = [
    {
      title: "Interactions",
      data: dbStats.interactions,
      description: "Molecular interactions between proteins"
    },
    {
      title: "Enzyme-Substrate",
      data: dbStats.enzsub,
      description: "Enzyme-substrate relationships"
    },
    {
      title: "Complexes",
      data: dbStats.complexes,
      description: "Protein complex compositions"
    },
    {
      title: "Annotations",
      data: dbStats.annotations,
      description: "Functional annotations and properties"
    },
    {
      title: "Intercellular",
      data: dbStats.intercell,
      description: "Intercellular communication molecules"
    }
  ];

  // Chart 1: Database Overview - Resources, Records, References
  const databaseOverviewData = databases.map(db => {
    const resourceCount = db.data.length;
    const recordCount = db.data.reduce((sum, item) => sum + item.record_count, 0);
    
    // Calculate total unique references for this database type
    const dbNames = db.data.map(d => d.source);
    const references = (dbStats.plotData?.literatureRefsByDatabaseAndType || [])
      .filter((ref: any) => dbNames.includes(ref.database))
      .reduce((sum: number, ref: any) => sum + ref.unique_reference_count, 0);

    return {
      category: db.title,
      Resources: resourceCount,
      Records: recordCount,
      References: references || 0
    };
  });

  // Chart 2: Maintenance Status
  const totalResources = new Set<string>();
  const totalRecords = databases.reduce((acc, db) => 
    acc + db.data.reduce((sum, item) => sum + item.record_count, 0), 0
  );
  
  databases.forEach(db => {
    db.data.forEach(item => totalResources.add(item.source));
  });

  const maintenanceData = Object.entries(maintenanceCategories).map(([category, resources]) => {
    const resourceList = resources as string[];
    let categoryRecordCount = 0;
    let categoryResourceCount = 0;

    resourceList.forEach(resource => {
      const resourceFound = Array.from(totalResources).some(source => 
        source.toLowerCase() === resource.toLowerCase()
      );
      
      if (resourceFound) {
        categoryResourceCount++;
        databases.forEach(db => {
          const sourceData = db.data.find(item => 
            item.source.toLowerCase() === resource.toLowerCase()
          );
          if (sourceData) {
            categoryRecordCount += sourceData.record_count;
          }
        });
      }
    });

    return {
      category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      "% Resources": ((categoryResourceCount / totalResources.size) * 100).toFixed(1),
      "% Records": ((categoryRecordCount / totalRecords) * 100).toFixed(1)
    };
  });

  // Chart 3: Commercial Use + Evidence Type
  const commercialEvidenceData = (() => {
    const evidenceTypes = ['High Throughput', 'Literature Curated', 'Combined/Other'];
    const result: any[] = [];

    evidenceTypes.forEach(evidenceType => {
      let commercialAllowed = 0;
      let nonCommercial = 0;
      let unknownLicense = 0;

      Array.from(totalResources).forEach(source => {
        const resourceKey = Object.keys(resourcesMetadata).find(key => 
          key.toLowerCase() === source.toLowerCase()
        );

        if (resourceKey) {
          const resource = (resourcesMetadata as Record<string, ResourceMetadata>)[resourceKey];
          const typeValue = resource.type;
          const type = (Array.isArray(typeValue) ? typeValue.join(' ') : typeValue || '').toLowerCase();
          const license = resource.license || 'Unknown';

          // Check evidence type
          let matchesType = false;
          if (evidenceType === 'High Throughput' && (type.includes('high throughput') || type.includes('high-throughput'))) {
            matchesType = true;
          } else if (evidenceType === 'Literature Curated' && type.includes('literature curated')) {
            matchesType = true;
          } else if (evidenceType === 'Combined/Other' && !type.includes('high throughput') && !type.includes('high-throughput') && !type.includes('literature curated')) {
            matchesType = true;
          }

          if (matchesType) {
            // Get record count for this source
            let sourceRecordCount = 0;
            databases.forEach(db => {
              const sourceData = db.data.find(item => item.source === source);
              if (sourceData) {
                sourceRecordCount += sourceData.record_count;
              }
            });

            // Categorize by license
            if (license === 'Unknown') {
              unknownLicense += sourceRecordCount;
            } else if (license.toLowerCase().includes('nc') || license.toLowerCase().includes('non-commercial')) {
              nonCommercial += sourceRecordCount;
            } else {
              commercialAllowed += sourceRecordCount;
            }
          }
        }
      });

      const total = commercialAllowed + nonCommercial + unknownLicense;
      if (total > 0) {
        result.push({
          evidenceType,
          'Commercial Allowed': ((commercialAllowed / total) * 100).toFixed(1),
          'Non-Commercial': ((nonCommercial / total) * 100).toFixed(1),
          'Unknown License': ((unknownLicense / total) * 100).toFixed(1)
        });
      }
    });

    return result;
  })();

  // Chart 4: Resource Overlap
  const resourceOverlapData = (() => {
    const overlapData = dbStats.plotData?.resourceOverlap || [];
    const result: any[] = [];

    ['interaction', 'enzyme-substrate', 'complex'].forEach(entryType => {
      const typeData = overlapData.filter((item: any) => item.entry_type === entryType);
      
      // Group by number of resources (1, 2, 3, 4, 5+)
      const grouped: Record<string, number> = {
        '1 resource': 0,
        '2 resources': 0,
        '3 resources': 0,
        '4 resources': 0,
        '5+ resources': 0
      };

      typeData.forEach((item: any) => {
        if (item.number_of_resources === 1) {
          grouped['1 resource'] += item.number_of_entries;
        } else if (item.number_of_resources === 2) {
          grouped['2 resources'] += item.number_of_entries;
        } else if (item.number_of_resources === 3) {
          grouped['3 resources'] += item.number_of_entries;
        } else if (item.number_of_resources === 4) {
          grouped['4 resources'] += item.number_of_entries;
        } else if (item.number_of_resources >= 5) {
          grouped['5+ resources'] += item.number_of_entries;
        }
      });

      result.push({
        entryType: entryType.charAt(0).toUpperCase() + entryType.slice(1).replace('-', ' '),
        ...grouped
      });
    });

    return result;
  })();

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Auxiliary Database Statistics</CardTitle>
          <CardDescription>
            Comprehensive overview of database characteristics for publication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chart 1: Database Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Database Overview</CardTitle>
                <CardDescription className="text-xs">
                  Resources, records, and references by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={databaseOverviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        fontSize={11}
                      />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend fontSize={11} />
                      <Bar dataKey="Resources" fill={CHART_COLORS.resources} />
                      <Bar dataKey="Records" fill={CHART_COLORS.records} />
                      <Bar dataKey="References" fill={CHART_COLORS.references} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Maintenance Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Maintenance Status</CardTitle>
                <CardDescription className="text-xs">
                  Percentage of resources and records by update frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={maintenanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        fontSize={11}
                      />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend fontSize={11} />
                      <Bar dataKey="% Resources" fill={CHART_COLORS.maintenance.resources} />
                      <Bar dataKey="% Records" fill={CHART_COLORS.maintenance.records} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 3: Commercial Use + Evidence */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Commercial Use by Evidence Type</CardTitle>
                <CardDescription className="text-xs">
                  License distribution across different evidence types (%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={commercialEvidenceData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="evidenceType" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        fontSize={11}
                      />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend fontSize={11} />
                      <Bar dataKey="Commercial Allowed" stackId="a" fill={CHART_COLORS.commercial.allowed} />
                      <Bar dataKey="Non-Commercial" stackId="a" fill={CHART_COLORS.commercial.nonCommercial} />
                      <Bar dataKey="Unknown License" stackId="a" fill={CHART_COLORS.commercial.unknown} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 4: Resource Overlap */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resource Overlap</CardTitle>
                <CardDescription className="text-xs">
                  Number of entries by resource count per record type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resourceOverlapData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="entryType" 
                        fontSize={11}
                      />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend fontSize={11} />
                      <Bar dataKey="1 resource" fill={CHART_COLORS.overlap[0]} />
                      <Bar dataKey="2 resources" fill={CHART_COLORS.overlap[1]} />
                      <Bar dataKey="3 resources" fill={CHART_COLORS.overlap[2]} />
                      <Bar dataKey="4 resources" fill={CHART_COLORS.overlap[3]} />
                      <Bar dataKey="5+ resources" fill={CHART_COLORS.overlap[4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}