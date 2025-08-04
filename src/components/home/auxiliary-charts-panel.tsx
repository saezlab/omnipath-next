"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
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
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  tertiary: '#10b981',
  maintenance: {
    frequent: '#10b981',
    infrequent: '#f59e0b',
    one_time_paper: '#ef4444',
    discontinued: '#991b1b',
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

  // Get all unique sources
  const allSources = new Set<string>();
  databases.forEach(db => {
    db.data.forEach(item => allSources.add(item.source));
  });

  // Create a mapping of sources to their maintenance category
  const sourceMaintenanceMap: Record<string, string> = {};
  const unmappedSources: string[] = [];
  
  Object.entries(maintenanceCategories).forEach(([category, resources]) => {
    (resources as string[]).forEach(resource => {
      const matchingSource = Array.from(allSources).find(source => 
        source.toLowerCase() === resource.toLowerCase()
      );
      if (matchingSource) {
        sourceMaintenanceMap[matchingSource] = category;
      }
    });
  });

  // Find unmapped sources
  Array.from(allSources).forEach(source => {
    if (!sourceMaintenanceMap[source]) {
      unmappedSources.push(source);
    }
  });

  // Log unmapped sources for debugging
  if (unmappedSources.length > 0) {
    console.log('Unmapped sources:', unmappedSources.sort());
    console.log('Unmapped sources JSON:', JSON.stringify(unmappedSources.sort(), null, 2));
  }

  // Prepare data for charts
  
  // 1. Resources per database with maintenance breakdown
  const resourcesData = databases.map(db => {
    // Calculate resources by maintenance category for this database
    const maintenanceBreakdown: Record<string, number> = {
      frequent: 0,
      infrequent: 0,
      one_time_paper: 0,
      discontinued: 0
    };

    db.data.forEach(source => {
      const category = sourceMaintenanceMap[source.source];
      if (category) {
        maintenanceBreakdown[category]++;
      }
    });

    return {
      category: db.title,
      frequent: maintenanceBreakdown.frequent,
      infrequent: maintenanceBreakdown.infrequent,
      one_time_paper: maintenanceBreakdown.one_time_paper,
      discontinued: maintenanceBreakdown.discontinued,
      total: db.data.length
    };
  });

  // 2. Records per database with maintenance status breakdown (as percentages)
  const recordsData = databases.map(db => {
    // Calculate records by maintenance category for this database
    const maintenanceBreakdown: Record<string, number> = {
      frequent: 0,
      infrequent: 0,
      one_time_paper: 0,
      discontinued: 0
    };

    db.data.forEach(source => {
      const category = sourceMaintenanceMap[source.source];
      if (category) {
        maintenanceBreakdown[category] += source.record_count;
      }
    });

    const total = db.data.reduce((sum, item) => sum + item.record_count, 0);
    
    // Convert to percentages
    return {
      category: db.title,
      frequent: total > 0 ? ((maintenanceBreakdown.frequent / total) * 100) : 0,
      infrequent: total > 0 ? ((maintenanceBreakdown.infrequent / total) * 100) : 0,
      one_time_paper: total > 0 ? ((maintenanceBreakdown.one_time_paper / total) * 100) : 0,
      discontinued: total > 0 ? ((maintenanceBreakdown.discontinued / total) * 100) : 0,
      totalRecords: total // Keep for tooltip display
    };
  });

  // 3. References per database with maintenance breakdown
  const referencesData = databases.map(db => {
    const dbNames = db.data.map(d => d.source);
    const literatureRefs = (dbStats.plotData?.literatureRefsByDatabaseAndType || [])
      .filter((ref: any) => dbNames.includes(ref.database));
    
    // Calculate references by maintenance category
    const maintenanceBreakdown: Record<string, number> = {
      frequent: 0,
      infrequent: 0,
      one_time_paper: 0,
      discontinued: 0
    };

    literatureRefs.forEach((ref: any) => {
      const category = sourceMaintenanceMap[ref.database];
      if (category) {
        maintenanceBreakdown[category] += ref.unique_reference_count;
      }
    });

    const totalReferences = literatureRefs.reduce((sum: number, ref: any) => sum + ref.unique_reference_count, 0);

    return {
      category: db.title,
      frequent: maintenanceBreakdown.frequent,
      infrequent: maintenanceBreakdown.infrequent,
      one_time_paper: maintenanceBreakdown.one_time_paper,
      discontinued: maintenanceBreakdown.discontinued,
      total: totalReferences
    };
  });

  // 4. Resource overlap data - split by type
  const overlapData = dbStats.plotData?.resourceOverlap || [];
  
  // Helper function to group overlap data into 1,2,3,4,5+ categories
  const groupOverlapData = (filteredData: any[]) => {
    const grouped: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5+': 0
    };

    filteredData.forEach((item: any) => {
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

    return [
      { resources: '1', entries: grouped['1'] },
      { resources: '2', entries: grouped['2'] },
      { resources: '3', entries: grouped['3'] },
      { resources: '4', entries: grouped['4'] },
      { resources: '5+', entries: grouped['5+'] }
    ];
  };

  const interactionOverlapData = groupOverlapData(
    overlapData.filter((item: any) => item.entry_type === 'interaction')
  );

  const enzymeSubstrateOverlapData = groupOverlapData(
    overlapData.filter((item: any) => item.entry_type === 'enzyme-substrate')
  );

  const complexOverlapData = groupOverlapData(
    overlapData.filter((item: any) => item.entry_type === 'complex')
  );

  return (
    <div className="w-full space-y-6">
      {/* Debug: Show unmapped sources */}
      {unmappedSources.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-800">Unmapped Sources ({unmappedSources.length})</CardTitle>
            <CardDescription className="text-xs text-orange-600">
              Sources that need maintenance category mapping
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unmappedSources.sort().map((source, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-mono"
                >
                  {source}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Auxiliary Database Statistics</CardTitle>
          <CardDescription>
            Comprehensive overview of database characteristics for publication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Row 1: Database Overview Charts */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Resources Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resources per Database</CardTitle>
                  <CardDescription className="text-xs">
                    Number of unique data sources by maintenance status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resourcesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={11}
                        />
                        <YAxis fontSize={11} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `${value} resources`,
                            name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                          ]}
                          labelFormatter={(label: string) => {
                            const data = resourcesData.find(d => d.category === label);
                            return `${label} (${data?.total} total resources)`;
                          }}
                        />
                        <Legend 
                          fontSize={11}
                          formatter={(value: string) => value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        />
                        <Bar dataKey="frequent" stackId="a" fill={CHART_COLORS.maintenance.frequent} />
                        <Bar dataKey="infrequent" stackId="a" fill={CHART_COLORS.maintenance.infrequent} />
                        <Bar dataKey="one_time_paper" stackId="a" fill={CHART_COLORS.maintenance.one_time_paper} />
                        <Bar dataKey="discontinued" stackId="a" fill={CHART_COLORS.maintenance.discontinued} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Records Chart with Maintenance Breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Records per Database (%)</CardTitle>
                  <CardDescription className="text-xs">
                    Maintenance status breakdown as percentages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={recordsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={11}
                        />
                        <YAxis 
                          fontSize={11}
                          label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `${value.toFixed(1)}%`,
                            name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                          ]}
                          labelFormatter={(label: string) => {
                            const data = recordsData.find(d => d.category === label);
                            return `${label} (${data?.totalRecords?.toLocaleString()} records)`;
                          }}
                        />
                        <Legend 
                          fontSize={11}
                          formatter={(value: string) => value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        />
                        <Bar dataKey="frequent" stackId="a" fill={CHART_COLORS.maintenance.frequent} />
                        <Bar dataKey="infrequent" stackId="a" fill={CHART_COLORS.maintenance.infrequent} />
                        <Bar dataKey="one_time_paper" stackId="a" fill={CHART_COLORS.maintenance.one_time_paper} />
                        <Bar dataKey="discontinued" stackId="a" fill={CHART_COLORS.maintenance.discontinued} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* References Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">References per Database</CardTitle>
                  <CardDescription className="text-xs">
                    Unique literature references by maintenance status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={referencesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={11}
                        />
                        <YAxis fontSize={11} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `${value.toLocaleString()} references`,
                            name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                          ]}
                          labelFormatter={(label: string) => {
                            const data = referencesData.find(d => d.category === label);
                            return `${label} (${data?.total?.toLocaleString()} total references)`;
                          }}
                        />
                        <Legend 
                          fontSize={11}
                          formatter={(value: string) => value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        />
                        <Bar dataKey="frequent" stackId="a" fill={CHART_COLORS.maintenance.frequent} />
                        <Bar dataKey="infrequent" stackId="a" fill={CHART_COLORS.maintenance.infrequent} />
                        <Bar dataKey="one_time_paper" stackId="a" fill={CHART_COLORS.maintenance.one_time_paper} />
                        <Bar dataKey="discontinued" stackId="a" fill={CHART_COLORS.maintenance.discontinued} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Resource Overlap Charts */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Interaction Overlap */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Interaction Resource Overlap</CardTitle>
                  <CardDescription className="text-xs">
                    Entries by number of resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={interactionOverlapData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="resources" 
                          label={{ value: 'Number of Resources', position: 'insideBottom', offset: -5 }}
                          fontSize={11}
                        />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="entries" fill={CHART_COLORS.overlap[0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Enzyme-Substrate Overlap */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Enzyme-Substrate Resource Overlap</CardTitle>
                  <CardDescription className="text-xs">
                    Entries by number of resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={enzymeSubstrateOverlapData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="resources" 
                          label={{ value: 'Number of Resources', position: 'insideBottom', offset: -5 }}
                          fontSize={11}
                        />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="entries" fill={CHART_COLORS.overlap[1]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Complex Overlap */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Complex Resource Overlap</CardTitle>
                  <CardDescription className="text-xs">
                    Entries by number of resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={complexOverlapData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="resources" 
                          label={{ value: 'Number of Resources', position: 'insideBottom', offset: -5 }}
                          fontSize={11}
                        />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="entries" fill={CHART_COLORS.overlap[2]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}