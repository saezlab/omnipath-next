"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {databases.map((db) => (
              <Card key={`summary-${db.title}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{db.title} Sources</CardTitle>
                  <CardDescription className="text-sm">Complete source list</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1">Source</th>
                          <th className="text-right py-1">Records</th>
                        </tr>
                      </thead>
                      <tbody>
                        {db.data.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-1 text-xs">{item.source}</td>
                            <td className="text-right py-1 text-xs">{item.record_count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}