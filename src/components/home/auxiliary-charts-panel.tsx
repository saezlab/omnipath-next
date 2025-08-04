"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dbStats from "@/data/db-stats.json";
import maintenanceCategories from "@/data/resources_by_maintenance_category.json";

interface DatabaseSection {
  title: string;
  data: Array<{ source: string; record_count: number }>;
  description: string;
}

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

  // 3. References per database with maintenance breakdown (reference-centric with priority)
  const referencesData = databases.map(db => {
    const dbNames = db.data.map(d => d.source);
    const literatureRefs = (dbStats.plotData?.literatureRefsByDatabaseAndType || [])
      .filter((ref: any) => dbNames.includes(ref.database));
    
    // Group references by unique reference, tracking all databases they appear in
    const referenceMap: Record<string, { count: number; databases: string[] }> = {};
    
    literatureRefs.forEach((ref: any) => {
      // Create unique key for each reference (could be improved with actual reference ID if available)
      const refKey = `${ref.interaction_type}_${ref.unique_reference_count}`;
      
      if (!referenceMap[refKey]) {
        referenceMap[refKey] = { count: ref.unique_reference_count, databases: [] };
      }
      referenceMap[refKey].databases.push(ref.database);
    });

    // Maintenance priority order: frequent > infrequent > one_time_paper > discontinued
    const priorityOrder = ['frequent', 'infrequent', 'one_time_paper', 'discontinued'];
    
    const maintenanceBreakdown: Record<string, number> = {
      frequent: 0,
      infrequent: 0,
      one_time_paper: 0,
      discontinued: 0
    };

    // Assign each reference to the best maintenance category it appears in
    Object.values(referenceMap).forEach(refInfo => {
      // Find the best maintenance category among all databases this reference appears in
      let bestCategory = 'discontinued'; // Start with lowest priority
      
      refInfo.databases.forEach(database => {
        const category = sourceMaintenanceMap[database];
        if (category) {
          const currentPriority = priorityOrder.indexOf(category);
          const bestPriority = priorityOrder.indexOf(bestCategory);
          
          // Lower index = higher priority
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

  // 4. Resource overlap data - combined as percentages
  const overlapData = dbStats.plotData?.resourceOverlap || [];
  
  // Helper function to group overlap data into percentages by entry type
  const createOverlapPercentageData = () => {
    const entryTypes = ['interaction', 'enzyme-substrate', 'complex'];
    
    return entryTypes.map(entryType => {
      const typeData = overlapData.filter((item: any) => item.entry_type === entryType);
      
      // Group by number of resources
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
          {/* Combined Legend for All Charts */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold mb-3">Chart Legend</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Maintenance Categories Legend */}
              <div>
                <h5 className="text-xs font-medium mb-2 text-gray-700">Maintenance Categories</h5>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: CHART_COLORS.maintenance.frequent}}></div>
                    <span className="text-xs">Frequent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: CHART_COLORS.maintenance.infrequent}}></div>
                    <span className="text-xs">Infrequent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: CHART_COLORS.maintenance.one_time_paper}}></div>
                    <span className="text-xs">One Time Paper</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: CHART_COLORS.maintenance.discontinued}}></div>
                    <span className="text-xs">Discontinued</span>
                  </div>
                </div>
              </div>
              
              {/* Resource Overlap Legend */}
              <div>
                <h5 className="text-xs font-medium mb-2 text-gray-700">Resource Overlap</h5>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: CHART_COLORS.overlap[0]}}></div>
                    <span className="text-xs">1 resource</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: CHART_COLORS.overlap[1]}}></div>
                    <span className="text-xs">2 resources</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: CHART_COLORS.overlap[2]}}></div>
                    <span className="text-xs">3 resources</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: CHART_COLORS.overlap[3]}}></div>
                    <span className="text-xs">4 resources</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: CHART_COLORS.overlap[4]}}></div>
                    <span className="text-xs">5+ resources</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {/* Row 1: Absolute Charts (Resources and References) */}
            <div className="grid gap-4 md:grid-cols-2">
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
                    Unique literature references by best maintenance status (priority: frequent {'>'}  infrequent {'>'}  one-time {'>'}  discontinued)
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

            {/* Row 2: Percentage Charts (Records % and Resource Overlap %) */}
            <div className="grid gap-4 md:grid-cols-2">
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
                        <Bar dataKey="frequent" stackId="a" fill={CHART_COLORS.maintenance.frequent} />
                        <Bar dataKey="infrequent" stackId="a" fill={CHART_COLORS.maintenance.infrequent} />
                        <Bar dataKey="one_time_paper" stackId="a" fill={CHART_COLORS.maintenance.one_time_paper} />
                        <Bar dataKey="discontinued" stackId="a" fill={CHART_COLORS.maintenance.discontinued} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Overlap Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resource Overlap Distribution (%)</CardTitle>
                  <CardDescription className="text-xs">
                    Percentage of entries by number of resources across entry types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={combinedOverlapData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="entryType" 
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
                            name
                          ]}
                          labelFormatter={(label: string) => {
                            const data = combinedOverlapData.find(d => d.entryType === label);
                            return `${label} (${data?.totalEntries?.toLocaleString()} total entries)`;
                          }}
                        />
                        <Bar dataKey="1 resource" stackId="a" fill={CHART_COLORS.overlap[0]} />
                        <Bar dataKey="2 resources" stackId="a" fill={CHART_COLORS.overlap[1]} />
                        <Bar dataKey="3 resources" stackId="a" fill={CHART_COLORS.overlap[2]} />
                        <Bar dataKey="4 resources" stackId="a" fill={CHART_COLORS.overlap[3]} />
                        <Bar dataKey="5+ resources" stackId="a" fill={CHART_COLORS.overlap[4]} />
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