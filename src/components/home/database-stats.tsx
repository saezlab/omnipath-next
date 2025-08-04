"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import dbStats from "@/data/db-stats.json";
import resourcesMetadata from "@/data/resources.json";
import maintenanceCategories from "@/data/resources_by_maintenance_category.json";
import { DatabaseVoronoiTreemap } from "./database-voronoi-treemap";

interface SourceStat {
  source: string;
  record_count: number;
}

interface SourceTypeStat {
  source: string;
  type: string;
  record_count: number;
}

interface DatabaseSection {
  title: string;
  data: SourceStat[];
  description: string;
}

interface LiteratureRefStat {
  database: string | null;
  interaction_type: string;
  unique_reference_count: number;
}

interface ResourceMetadata {
  type?: string | string[];
  license?: string;
  full_name?: string;
  [key: string]: any;
}

interface MultiResourceExample {
  entry_id: string;
  entry_type: string;
  resource_count: number;
  resources: string[];
}

// Color schemes for different charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff6b6b'];
const MAINTENANCE_COLORS: Record<string, string> = {
  'frequent': '#00C49F',
  'infrequent': '#FFBB28',
  'one_time_paper': '#FF8042',
  'discontinued': '#ff6b6b',
  'unknown': '#8884d8'
};

export function DatabaseStats() {
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

  const totalRecords = databases.reduce((acc, db) => 
    acc + db.data.reduce((sum, item) => sum + item.record_count, 0), 0
  );

  // Process plot data
  const plotData = dbStats.plotData || {};
  const litRefsByDb = plotData.literatureRefsByDatabaseAndType || [];
  const aggregateInteractionTypes = plotData.aggregateInteractionTypes || [];
  const resourceOverlap = plotData.resourceOverlap || [];
  const multiResourceExamples = plotData.multiResourceExamples || [];

  // Generate maintenance data from JSON files
  const getAllSources = () => {
    const sources = new Set<string>();
    databases.forEach(db => {
      db.data.forEach(item => sources.add(item.source));
    });
    return Array.from(sources);
  };

  const allSources = getAllSources();
  
  // Calculate maintenance status from maintenance categories
  const maintenanceByCategory: Record<string, number> = {};
  for (const [category, resources] of Object.entries(maintenanceCategories)) {
    const resourceList = resources as string[];
    let categoryCount = 0;
    
    resourceList.forEach(resource => {
      // Find matching sources in our database stats (case-insensitive)
      const matchingSources = allSources.filter(source => 
        source.toLowerCase() === resource.toLowerCase()
      );
      
      matchingSources.forEach(source => {
        // Sum up records from all databases for this source
        let sourceTotal = 0;
        databases.forEach(db => {
          const sourceData = db.data.find(item => item.source === source);
          if (sourceData) {
            sourceTotal += sourceData.record_count;
          }
        });
        categoryCount += sourceTotal;
      });
    });
    
    if (categoryCount > 0) {
      maintenanceByCategory[category] = categoryCount;
    }
  }

  const maintenancePieData = Object.entries(maintenanceByCategory).map(([category, count]) => ({
    name: category.replace('_', ' '),
    value: count
  }));

  // Generate commercial use data from resources metadata
  const commercialUseAgg: Record<string, number> = {};
  
  allSources.forEach(source => {
    // Find resource metadata (case-insensitive)
    const resourceKey = Object.keys(resourcesMetadata).find(key => 
      key.toLowerCase() === source.toLowerCase()
    );
    
    if (resourceKey) {
      const resource = (resourcesMetadata as any)[resourceKey] as ResourceMetadata;
      const license = resource.license || 'Unknown';
      
      const isCommercial = license !== 'Unknown' && 
        !license.toLowerCase().includes('nc') && 
        !license.toLowerCase().includes('non-commercial');
      
      const key = isCommercial ? 'Commercial Use Allowed' : 
                  license === 'Unknown' ? 'Unknown License' : 'Non-Commercial Only';
      
      // Sum up records from all databases for this source
      let sourceTotal = 0;
      databases.forEach(db => {
        const sourceData = db.data.find(item => item.source === source);
        if (sourceData) {
          sourceTotal += sourceData.record_count;
        }
      });
      
      commercialUseAgg[key] = (commercialUseAgg[key] || 0) + sourceTotal;
    } else {
      // Unknown license
      let sourceTotal = 0;
      databases.forEach(db => {
        const sourceData = db.data.find(item => item.source === source);
        if (sourceData) {
          sourceTotal += sourceData.record_count;
        }
      });
      commercialUseAgg['Unknown License'] = (commercialUseAgg['Unknown License'] || 0) + sourceTotal;
    }
  });

  const commercialPieData = Object.entries(commercialUseAgg).map(([name, value]) => ({ name, value }));

  // Generate evidence type data from resources metadata
  const evidenceTypeAgg: Record<string, number> = {};
  
  allSources.forEach(source => {
    // Find resource metadata (case-insensitive)
    const resourceKey = Object.keys(resourcesMetadata).find(key => 
      key.toLowerCase() === source.toLowerCase()
    );
    
    if (resourceKey) {
      const resource = (resourcesMetadata as any)[resourceKey] as ResourceMetadata;
      const typeValue = resource.type;
      const type = (Array.isArray(typeValue) ? typeValue.join(' ') : typeValue || 'unknown').toLowerCase();
      
      let evidenceCategory = 'Other';
      if (type.includes('literature curated') && type.includes('high')) {
        evidenceCategory = 'Literature Curated & High Throughput';
      } else if (type.includes('literature curated')) {
        evidenceCategory = 'Literature Curated';
      } else if (type.includes('high throughput') || type.includes('high-throughput')) {
        evidenceCategory = 'High Throughput';
      } else if (type.includes('prediction')) {
        evidenceCategory = 'Predicted';
      } else if (type.includes('combined')) {
        evidenceCategory = 'Combined';
      }
      
      // Sum up records from all databases for this source
      let sourceTotal = 0;
      databases.forEach(db => {
        const sourceData = db.data.find(item => item.source === source);
        if (sourceData) {
          sourceTotal += sourceData.record_count;
        }
      });
      
      evidenceTypeAgg[evidenceCategory] = (evidenceTypeAgg[evidenceCategory] || 0) + sourceTotal;
    }
  });

  const evidenceTypePieData = Object.entries(evidenceTypeAgg).map(([name, value]) => ({ name, value }));

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Database Statistics</h2>
        <p className="text-muted-foreground mt-2">
          Explore the sources and composition of our integrated databases
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Last updated: {new Date(dbStats.generatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {databases.map((db) => (
          <Card key={db.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{db.title}</CardTitle>
              <CardDescription className="text-sm">{db.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{db.data.length}</div>
              <p className="text-xs text-muted-foreground">unique sources</p>
              <div className="text-sm mt-1">
                {db.data.reduce((sum, item) => sum + item.record_count, 0).toLocaleString()} records
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total</CardTitle>
            <CardDescription className="text-sm">Across all databases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">total records</p>
          </CardContent>
        </Card>
      </div>

      {/* Voronoi Treemap - prominently displayed above tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Database Overview - Voronoi Treemap</CardTitle>
          <CardDescription>
            Hierarchical visualization of all databases and their sources. Circle size represents the logarithm of record counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseVoronoiTreemap />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="overlap">Overlap</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab - Original content */}
        <TabsContent value="overview" className="space-y-4">
          <Tabs defaultValue="interactions" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              {databases.map((db) => (
                <TabsTrigger key={db.title} value={db.title.toLowerCase()}>
                  {db.title}
                </TabsTrigger>
              ))}
              <TabsTrigger value="source-types">
                Source-Types
              </TabsTrigger>
            </TabsList>
            
            {databases.map((db) => (
              <TabsContent key={db.title} value={db.title.toLowerCase()} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Sources</CardTitle>
                    <CardDescription>
                      Distribution of records across the top 10 data sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={db.data.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="source" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            fontSize={12}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="record_count" className="fill-primary" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {db.data.length > 10 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>All Sources</CardTitle>
                      <CardDescription>
                        Complete list of all {db.data.length} sources
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Source</th>
                              <th className="text-right py-2">Records</th>
                              <th className="text-right py-2">Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {db.data.map((item, index) => {
                              const total = db.data.reduce((sum, d) => sum + d.record_count, 0);
                              const percentage = ((item.record_count / total) * 100).toFixed(2);
                              return (
                                <tr key={index} className="border-b">
                                  <td className="py-2">{item.source}</td>
                                  <td className="text-right py-2">{item.record_count.toLocaleString()}</td>
                                  <td className="text-right py-2">{percentage}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}

            <TabsContent value="source-types" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interactions: Source-Type Combinations</CardTitle>
                  <CardDescription>
                    Shows which sources provide which interaction types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Source</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-right py-2">Records</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbStats.interactionsSourceType?.map((item: SourceTypeStat, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{item.source}</td>
                            <td className="py-2">
                              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                                {item.type}
                              </span>
                            </td>
                            <td className="text-right py-2">{item.record_count.toLocaleString()}</td>
                          </tr>
                        )) || []}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aggregate Interaction Types</CardTitle>
              <CardDescription>
                Distribution of interactions by type (lncrna_post_transcriptional combined with post_transcriptional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregateInteractionTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="interaction_type" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" className="fill-primary" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Literature References by Database and Type</CardTitle>
              <CardDescription>
                Number of unique references across databases and interaction types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Database</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-right py-2">Unique References</th>
                    </tr>
                  </thead>
                  <tbody>
                    {litRefsByDb.map((item: LiteratureRefStat, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.database || 'Unknown'}</td>
                        <td className="py-2">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                            {item.interaction_type}
                          </span>
                        </td>
                        <td className="text-right py-2">{item.unique_reference_count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Status</CardTitle>
                <CardDescription>
                  Resources categorized by update frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={maintenancePieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {maintenancePieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={MAINTENANCE_COLORS[maintenancePieData[index].name.replace(' ', '_')] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commercial Use Availability</CardTitle>
                <CardDescription>
                  Distribution of records by license type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={commercialPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {commercialPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resources by Maintenance Category</CardTitle>
              <CardDescription>
                Distribution of resources across maintenance categories with their total records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(maintenanceCategories).map(([category, resources]) => {
                  const resourceList = resources as string[];
                  const categoryRecords = maintenanceByCategory[category] || 0;
                  const matchingResources = resourceList.filter(resource => 
                    allSources.some(source => source.toLowerCase() === resource.toLowerCase())
                  );
                  
                  return (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold capitalize">{category.replace('_', ' ')}</h4>
                        <span className="text-sm text-muted-foreground">
                          {categoryRecords.toLocaleString()} records
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {matchingResources.map((resource, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: `${MAINTENANCE_COLORS[category] || '#8884d8'}20`,
                              color: MAINTENANCE_COLORS[category] || '#8884d8'
                            }}
                          >
                            {resource}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Types Distribution</CardTitle>
              <CardDescription>
                Distribution of records by evidence type based on resource classifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={evidenceTypePieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {evidenceTypePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Evidence type summary */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {evidenceTypePieData.map(({ name, value }) => (
              <Card key={name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <CardDescription className="text-sm">Total records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {((value / totalRecords) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Overlap Tab */}
        <TabsContent value="overlap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Overlap</CardTitle>
              <CardDescription>
                How many entries appear in multiple resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceOverlap}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="number_of_resources" 
                      label={{ value: 'Number of Resources', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Number of Entries', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    {['interaction', 'enzyme-substrate', 'complex'].map((type, index) => (
                      <Bar 
                        key={type}
                        dataKey={type === resourceOverlap[0]?.entry_type ? "number_of_entries" : undefined}
                        name={type}
                        fill={COLORS[index]}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Examples of Multi-Resource Entries</CardTitle>
              <CardDescription>
                Specific entries that appear in multiple resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Entry</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-center py-2">Resources</th>
                      <th className="text-left py-2">Resource List</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiResourceExamples.map((item: MultiResourceExample, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 text-xs font-mono">{item.entry_id}</td>
                        <td className="py-2">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                            {item.entry_type}
                          </span>
                        </td>
                        <td className="text-center py-2">{item.resource_count}</td>
                        <td className="py-2 text-xs">{item.resources.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}