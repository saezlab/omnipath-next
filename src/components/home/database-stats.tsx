"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import dbStats from "@/data/db-stats.json";
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
  database: string;
  interaction_type: string;
  unique_reference_count: number;
}

interface ReferenceRecordPairStat {
  database: string;
  interaction_type: string;
  reference_record_pair_count: number;
}

interface ReferenceByYearStat {
  publication_year: string;
  reference_count: number;
}

interface CommercialUseStat {
  database: string;
  record_type: string;
  total_records: number;
  license: string;
  isCommercialUse: boolean | null;
}

interface MaintenanceStat {
  resource: string;
  total_entries: number;
  maintenance_category: string;
}

interface EvidenceTypeStat {
  database: string;
  evidence_type: string;
  entry_count: number;
}

interface ReferenceByInteractionStat {
  interaction: string;
  reference_count: number;
  references: string;
}

interface ResourceOverlapStat {
  number_of_resources: number;
  entry_type: string;
  number_of_entries: number;
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
  const refRecordPairs = plotData.referenceRecordPairs || [];
  const refsByYear = (plotData.referencesByYear || []).filter((item: ReferenceByYearStat) => 
    item.publication_year !== 'Unknown' && parseInt(item.publication_year) >= 1980
  ).sort((a: ReferenceByYearStat, b: ReferenceByYearStat) => 
    parseInt(a.publication_year) - parseInt(b.publication_year)
  );
  const commercialUse = plotData.commercialUseAvailability || [];
  const maintenanceStatus = plotData.maintenanceStatus || [];
  const evidenceTypes = plotData.entriesByEvidenceType || [];
  const topInteractions = plotData.referencesByInteraction || [];
  const resourceOverlap = plotData.resourceOverlap || [];
  const multiResourceExamples = plotData.multiResourceExamples || [];

  // Aggregate maintenance status by category
  const maintenanceByCategory = maintenanceStatus.reduce((acc: Record<string, number>, item: MaintenanceStat) => {
    const category = item.maintenance_category;
    acc[category] = (acc[category] || 0) + item.total_entries;
    return acc;
  }, {});

  const maintenancePieData = Object.entries(maintenanceByCategory).map(([category, count]) => ({
    name: category.replace('_', ' '),
    value: count
  }));

  // Aggregate commercial use data
  const commercialUseAgg = commercialUse.reduce((acc: Record<string, number>, item: CommercialUseStat) => {
    const key = item.isCommercialUse === true ? 'Commercial Use Allowed' : 
                item.isCommercialUse === false ? 'Non-Commercial Only' : 'Unknown License';
    acc[key] = (acc[key] || 0) + item.total_records;
    return acc;
  }, {});

  const commercialPieData = Object.entries(commercialUseAgg).map(([name, value]) => ({ name, value }));

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
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Literature References by Year</CardTitle>
                <CardDescription>
                  Distribution of references by publication year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={refsByYear}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="publication_year" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="reference_count" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Referenced Interactions</CardTitle>
                <CardDescription>
                  Interactions with the most literature references
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Interaction</th>
                        <th className="text-right py-2">References</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topInteractions.slice(0, 20).map((item: ReferenceByInteractionStat, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 text-xs">{item.interaction}</td>
                          <td className="text-right py-2">{item.reference_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

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
                        <td className="py-2">{item.database}</td>
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
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {maintenancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={MAINTENANCE_COLORS[entry.name.replace(' ', '_')] || COLORS[index % COLORS.length]} />
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
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {commercialPieData.map((entry, index) => (
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
                Detailed list of resources and their maintenance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Resource</th>
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceStatus
                      .sort((a: MaintenanceStat, b: MaintenanceStat) => b.total_entries - a.total_entries)
                      .map((item: MaintenanceStat, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.resource}</td>
                        <td className="py-2">
                          <span 
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: `${MAINTENANCE_COLORS[item.maintenance_category] || '#8884d8'}20`,
                              color: MAINTENANCE_COLORS[item.maintenance_category] || '#8884d8'
                            }}
                          >
                            {item.maintenance_category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-right py-2">{item.total_entries.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entries by Evidence Type</CardTitle>
              <CardDescription>
                Distribution of curated, high-throughput, and predicted data across databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Database</th>
                      <th className="text-left py-2">Evidence Type</th>
                      <th className="text-right py-2">Entries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceTypes
                      .sort((a: EvidenceTypeStat, b: EvidenceTypeStat) => b.entry_count - a.entry_count)
                      .map((item: EvidenceTypeStat, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.database}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.evidence_type === 'curated' ? 'bg-green-100 text-green-800' :
                            item.evidence_type === 'high-throughput' ? 'bg-blue-100 text-blue-800' :
                            item.evidence_type === 'predicted' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.evidence_type}
                          </span>
                        </td>
                        <td className="text-right py-2">{item.entry_count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Evidence type summary */}
          <div className="grid gap-4 md:grid-cols-3">
            {['curated', 'high-throughput', 'predicted'].map(evidenceType => {
              const total = evidenceTypes
                .filter((item: EvidenceTypeStat) => item.evidence_type === evidenceType)
                .reduce((sum: number, item: EvidenceTypeStat) => sum + item.entry_count, 0);
              
              return (
                <Card key={evidenceType}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg capitalize">{evidenceType}</CardTitle>
                    <CardDescription className="text-sm">Total entries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      across {evidenceTypes.filter((item: EvidenceTypeStat) => item.evidence_type === evidenceType).length} databases
                    </p>
                  </CardContent>
                </Card>
              );
            })}
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