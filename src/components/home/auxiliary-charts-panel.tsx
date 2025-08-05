"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import dbStats from "@/data/db-stats.json";
import maintenanceCategories from "@/data/resources_by_maintenance_category.json";
import resourcesByLicense from "@/data/resources_by_license.json";
import { cleanSourceName } from "@/utils/database-treemap-data";

interface DatabaseSection {
  title: string;
  data: Array<{ source: string; record_count: number }>;
  description: string;
}

const CHART_COLORS = {
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


interface D3ChartData {
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

interface OverlapData {
  entryType: string;
  '1 resource': number;
  '2 resources': number;
  '3 resources': number;
  '4 resources': number;
  '5+ resources': number;
  totalEntries: number;
}

// Deduplicate sources by cleaned name (same logic as treemap)
function deduplicateSources(sources: Array<{ source: string; record_count: number }>): Array<{ source: string; record_count: number }> {
  // Resources to exclude from plots (composite databases or no licenses)
  const excludedResources = new Set(['CPAD', 'CollecTRI', 'DoRothEA', 'cellsignal.com']);
  
  const deduplicatedMap = new Map<string, { source: string; record_count: number }>();
  sources.forEach(item => {
    const cleanedName = cleanSourceName(item.source);
    
    // Skip excluded resources
    if (excludedResources.has(cleanedName)) {
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
      // If existing is original, keep it and add record count
    }
  });
  return Array.from(deduplicatedMap.values());
}

export function AuxiliaryChartsPanel() {
  const svgRef = useRef<SVGSVGElement>(null);

  const databases: DatabaseSection[] = [
    {
      title: "Interactions",
      data: deduplicateSources(dbStats.interactions),
      description: "Molecular interactions between proteins"
    },
    {
      title: "Enzyme-Substrate",
      data: deduplicateSources(dbStats.enzsub),
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

  // Download SVG function
  const downloadSVG = () => {
    if (!svgRef.current) return;

    const svgElement = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const styleTag = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleTag.textContent = `
      text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      .chart-title {
        font-size: 14px;
        font-weight: 600;
      }
      .chart-subtitle {
        font-size: 11px;
        fill: #6b7280;
      }
      .legend-title {
        font-size: 13px;
        font-weight: 600;
      }
      .legend-subtitle {
        font-size: 11px;
        font-weight: 500;
        fill: #4b5563;
      }
      .legend-text {
        font-size: 10px;
        fill: #374151;
      }
    `;
    styleElement.appendChild(styleTag);
    svgElement.insertBefore(styleElement, svgElement.firstChild);
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'auxiliary-database-statistics.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Configuration
    const CONFIG = {
      width: 1600,
      height: 800,
      margin: { top: 30, right: 250, bottom: 80, left: 50 },
      chartWidth: 420,
      chartHeight: 320,
      legendWidth: 180,
      gap: 30
    };

    // Helper function to create data mappings
    const createDataMappings = () => {
      const allSources = new Set<string>();
      databases.forEach(db => {
        db.data.forEach(item => allSources.add(item.source));
      });

      const sourceMaintenanceMap: Record<string, string> = {};
      const sourceLicenseMap: Record<string, string> = {};
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
            sourceMaintenanceMap[matchingSource] = category;
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

      // Log unmapped license sources to console for later mapping
      if (unmappedLicenseSources.length > 0) {
        console.log('Resources without license mapping:', unmappedLicenseSources);
      }

      return { 
        sourceMaintenanceMap, 
        sourceLicenseMap,
        unmappedSources: unmappedMaintenanceSources,
        unmappedLicenseSources 
      };
    };

    const { sourceMaintenanceMap, sourceLicenseMap } = createDataMappings();

    // Prepare chart data
    const prepareChartData = () => {
      // 1. Resources per database
      const resourcesData: D3ChartData[] = databases.map(db => {
        const maintenanceBreakdown: Record<string, number> = {
          frequent: 0,
          infrequent: 0,
          one_time_paper: 0,
          discontinued: 0
        };

        const licenseBreakdown: Record<string, number> = {
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
      const recordsData: D3ChartData[] = databases.map(db => {
        const maintenanceBreakdown: Record<string, number> = {
          frequent: 0,
          infrequent: 0,
          one_time_paper: 0,
          discontinued: 0
        };

        const licenseBreakdown: Record<string, number> = {
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
      const referencesData: D3ChartData[] = databases.map(db => {
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

        const priorityOrder = ['frequent', 'infrequent', 'one_time_paper', 'discontinued'];
        const maintenanceBreakdown: Record<string, number> = {
          frequent: 0,
          infrequent: 0,
          one_time_paper: 0,
          discontinued: 0
        };

        Object.values(referenceMap).forEach(refInfo => {
          let bestCategory = 'discontinued';
          
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
    };

    const { resourcesData, recordsData, referencesData, combinedOverlapData } = prepareChartData();

    // Set up main SVG
    const svg = d3.select(svgRef.current)
      .attr("width", CONFIG.width)
      .attr("height", CONFIG.height);


    // Main group for content
    const g = svg.append("g")
      .attr("transform", `translate(${CONFIG.margin.left},${CONFIG.margin.top})`);

    // Create grouped bar chart with maintenance and license side by side
    const createGroupedBarChart = (
      container: d3.Selection<SVGGElement, unknown, null, undefined>,
      data: D3ChartData[],
      x: number,
      y: number,
      width: number,
      height: number,
      yAxisLabel: string = "",
      isPercentage: boolean = false,
      label: string = ""
    ) => {
      const chartG = container.append("g")
        .attr("transform", `translate(${x},${y})`);

      const margin = { top: 10, right: 20, bottom: 60, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const innerG = chartG.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Scales
      const xScale = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, innerWidth])
        .padding(0.2);

      // Create sub-scale for grouped bars (maintenance vs license)
      const xSubScale = d3.scaleBand()
        .domain(['maintenance', 'license'])
        .range([0, xScale.bandwidth()])
        .padding(0.1);

      const maxMaintenanceValue = d3.max(data, d => 
        d.frequent + d.infrequent + d.one_time_paper + d.discontinued) || 0;
      const maxLicenseValue = d3.max(data, d => 
        (d.academic_nonprofit || 0) + (d.commercial || 0)) || 0;
      
      const yScale = d3.scaleLinear()
        .domain([0, isPercentage ? 100 : Math.max(maxMaintenanceValue, maxLicenseValue)])
        .range([innerHeight, 0]);

      // Maintenance stacks
      const maintenanceStack = d3.stack<D3ChartData>()
        .keys(['frequent', 'infrequent', 'one_time_paper', 'discontinued'])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const maintenanceSeries = maintenanceStack(data);

      // License stacks
      const licenseStack = d3.stack<D3ChartData>()
        .keys(['academic_nonprofit', 'commercial'])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const licenseSeries = licenseStack(data);

      // Draw maintenance bars
      const maintenanceGroups = innerG.selectAll(".maintenance-series")
        .data(maintenanceSeries)
        .enter().append("g")
        .attr("class", "maintenance-series")
        .attr("fill", (_, i) => {
          const colors = [
            CHART_COLORS.maintenance.frequent,
            CHART_COLORS.maintenance.infrequent,
            CHART_COLORS.maintenance.one_time_paper,
            CHART_COLORS.maintenance.discontinued
          ];
          return colors[i];
        });

      maintenanceGroups.each(function(seriesData, seriesIndex) {
        d3.select(this).selectAll("rect")
          .data(seriesData)
          .enter().append("rect")
          .attr("x", d => xScale(d.data.category)! + xSubScale('maintenance')!)
          .attr("y", d => yScale(d[1]))
          .attr("height", d => yScale(d[0]) - yScale(d[1]))
          .attr("width", xSubScale.bandwidth())
          .append("title")
          .text(d => {
            const keys = ['frequent', 'infrequent', 'one_time_paper', 'discontinued'];
            const seriesName = keys[seriesIndex] || 'unknown';
            const value = d[1] - d[0];
            const displayValue = isPercentage ? `${value.toFixed(1)}%` : value.toLocaleString();
            const categoryName = seriesName.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            return `${d.data.category} - Maintenance\\n${categoryName}: ${displayValue}`;
          });
      });

      // Draw license bars
      const licenseGroups = innerG.selectAll(".license-series")
        .data(licenseSeries)
        .enter().append("g")
        .attr("class", "license-series")
        .attr("fill", (_, i) => {
          const colors = [
            CHART_COLORS.license.academic_nonprofit,
            CHART_COLORS.license.commercial
          ];
          return colors[i];
        });

      licenseGroups.each(function(seriesData, seriesIndex) {
        d3.select(this).selectAll("rect")
          .data(seriesData)
          .enter().append("rect")
          .attr("x", d => xScale(d.data.category)! + xSubScale('license')!)
          .attr("y", d => yScale(d[1]))
          .attr("height", d => yScale(d[0]) - yScale(d[1]))
          .attr("width", xSubScale.bandwidth())
          .append("title")
          .text(d => {
            const keys = ['academic_nonprofit', 'commercial'];
            const seriesName = keys[seriesIndex] || 'unknown';
            const value = d[1] - d[0];
            const displayValue = isPercentage ? `${value.toFixed(1)}%` : value.toLocaleString();
            const categoryName = seriesName.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            return `${d.data.category} - License\\n${categoryName}: ${displayValue}`;
          });
      });

      // X axis
      innerG.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

      // Y axis with formatting
      const yAxis = d3.axisLeft(yScale);
      if (!isPercentage) {
        yAxis.tickFormat(d3.format(".0s"));
      }
      
      innerG.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "10px");

      // Y axis label
      if (yAxisLabel) {
        innerG.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (innerHeight / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .style("font-size", "11px")
          .text(yAxisLabel);
      }

      // Add chart label (a, b, c, d)
      if (label) {
        chartG.append("text")
          .attr("x", -5)
          .attr("y", 15)
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .style("fill", "#374151")
          .text(label);
      }

    };

    // D3 Chart creation function
    const createStackedBarChart = (
      container: d3.Selection<SVGGElement, unknown, null, undefined>,
      data: D3ChartData[],
      x: number,
      y: number,
      width: number,
      height: number,
      yAxisLabel: string = "",
      isPercentage: boolean = false,
      label: string = ""
    ) => {
      const chartG = container.append("g")
        .attr("transform", `translate(${x},${y})`);

      const margin = { top: 10, right: 20, bottom: 60, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const innerG = chartG.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Scales
      const xScale = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, innerWidth])
        .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, isPercentage ? 100 : d3.max(data, d => 
          (d.frequent + d.infrequent + d.one_time_paper + d.discontinued)) || 0])
        .range([innerHeight, 0]);

      // Stack data
      const stack = d3.stack<D3ChartData>()
        .keys(['frequent', 'infrequent', 'one_time_paper', 'discontinued'])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const series = stack(data);

      // Stack keys for reference
      const stackKeys = ['frequent', 'infrequent', 'one_time_paper', 'discontinued'];

      // Draw bars
      const seriesGroups = innerG.selectAll(".series")
        .data(series)
        .enter().append("g")
        .attr("class", "series")
        .attr("fill", (_, i) => {
          const colors = [
            CHART_COLORS.maintenance.frequent,
            CHART_COLORS.maintenance.infrequent,
            CHART_COLORS.maintenance.one_time_paper,
            CHART_COLORS.maintenance.discontinued
          ];
          return colors[i];
        });

      seriesGroups.each(function(seriesData, seriesIndex) {
        d3.select(this).selectAll("rect")
          .data(seriesData)
          .enter().append("rect")
          .attr("x", d => xScale(d.data.category)!)
          .attr("y", d => yScale(d[1]))
          .attr("height", d => yScale(d[0]) - yScale(d[1]))
          .attr("width", xScale.bandwidth())
          .append("title")
          .text(d => {
            const seriesName = stackKeys[seriesIndex] || 'unknown';
            const value = d[1] - d[0];
            const displayValue = isPercentage ? `${value.toFixed(1)}%` : value.toLocaleString();
            const categoryName = seriesName.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            
            let totalText = '';
            if (d.data.total !== undefined) {
              totalText = `\nTotal: ${d.data.total.toLocaleString()} resources`;
            } else if (d.data.totalRecords !== undefined) {
              totalText = `\nTotal: ${d.data.totalRecords.toLocaleString()} records`;
            }
            
            return `${d.data.category}\n${categoryName}: ${displayValue}${totalText}`;
          });
      });

      // X axis
      innerG.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

      // Y axis with formatting
      const yAxis = d3.axisLeft(yScale);
      
      // Format numbers for non-percentage charts
      if (!isPercentage) {
        yAxis.tickFormat(d3.format(".0s"));
      }
      
      innerG.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "10px");

      // Y axis label
      if (yAxisLabel) {
        innerG.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (innerHeight / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .style("font-size", "11px")
          .text(yAxisLabel);
      }

      // Add chart label (a, b, c, d)
      if (label) {
        chartG.append("text")
          .attr("x", -5)
          .attr("y", 15)
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .style("fill", "#374151")
          .text(label);
      }
    };


    // Create overlap chart
    const createOverlapChart = (
      container: d3.Selection<SVGGElement, unknown, null, undefined>,
      data: OverlapData[],
      x: number,
      y: number,
      width: number,
      height: number,
      yAxisLabel: string = "",
      label: string = ""
    ) => {
      const chartG = container.append("g")
        .attr("transform", `translate(${x},${y})`);

      const margin = { top: 10, right: 20, bottom: 60, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const innerG = chartG.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Scales
      const xScale = d3.scaleBand()
        .domain(data.map(d => d.entryType))
        .range([0, innerWidth])
        .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, 0]);

      // Stack data
      const stack = d3.stack<OverlapData>()
        .keys(['1 resource', '2 resources', '3 resources', '4 resources', '5+ resources'])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const series = stack(data);

      // Stack keys for overlap chart
      const overlapKeys = ['1 resource', '2 resources', '3 resources', '4 resources', '5+ resources'];

      // Draw bars
      const overlapSeriesGroups = innerG.selectAll(".series")
        .data(series)
        .enter().append("g")
        .attr("class", "series")
        .attr("fill", (_, i) => CHART_COLORS.overlap[i]);

      overlapSeriesGroups.each(function(seriesData, seriesIndex) {
        d3.select(this).selectAll("rect")
          .data(seriesData)
          .enter().append("rect")
          .attr("x", d => xScale(d.data.entryType)!)
          .attr("y", d => yScale(d[1]))
          .attr("height", d => yScale(d[0]) - yScale(d[1]))
          .attr("width", xScale.bandwidth())
          .append("title")
          .text(d => {
            const seriesName = overlapKeys[seriesIndex] || 'Unknown';
            const value = d[1] - d[0];
            return `${d.data.entryType}\n${seriesName}: ${value.toFixed(1)}%\nTotal entries: ${d.data.totalEntries.toLocaleString()}`;
          });
      });

      // X axis
      innerG.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

      // Y axis
      innerG.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "10px");

      // Y axis label
      if (yAxisLabel) {
        innerG.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (innerHeight / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .style("font-size", "11px")
          .text(yAxisLabel);
      }

      // Add chart label (a, b, c, d)
      if (label) {
        chartG.append("text")
          .attr("x", -5)
          .attr("y", 15)
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .style("fill", "#374151")
          .text(label);
      }
    };

    // Create combined legend for maintenance and license
    const createCombinedLegend = (
      container: d3.Selection<SVGGElement, unknown, null, undefined>,
      x: number,
      y: number
    ) => {
      const legendG = container.append("g")
        .attr("transform", `translate(${x},${y})`);

      // Maintenance section
      legendG.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("class", "legend-title")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .style("fill", "#374151")
        .text("Maintenance");

      const maintenanceItems = [
        { name: "Frequent", color: CHART_COLORS.maintenance.frequent },
        { name: "Infrequent", color: CHART_COLORS.maintenance.infrequent },
        { name: "One Time Paper", color: CHART_COLORS.maintenance.one_time_paper },
        { name: "Discontinued", color: CHART_COLORS.maintenance.discontinued }
      ];

      maintenanceItems.forEach((item, i) => {
        const itemG = legendG.append("g")
          .attr("transform", `translate(0, ${20 + i * 26})`);

        itemG.append("rect")
          .attr("width", 16)
          .attr("height", 16)
          .attr("fill", item.color);

        itemG.append("text")
          .attr("x", 22)
          .attr("y", 11)
          .attr("class", "legend-text")
          .style("font-size", "14px")
          .style("fill", "#374151")
          .text(item.name);
      });

      // License section
      const licenseYOffset = 20 + maintenanceItems.length * 26 + 20;
      
      legendG.append("text")
        .attr("x", 0)
        .attr("y", licenseYOffset)
        .attr("class", "legend-title")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .style("fill", "#374151")
        .text("License");

      const licenseItems = [
        { name: "Academic/Nonprofit", color: CHART_COLORS.license.academic_nonprofit },
        { name: "Commercial", color: CHART_COLORS.license.commercial }
      ];

      licenseItems.forEach((item, i) => {
        const itemG = legendG.append("g")
          .attr("transform", `translate(0, ${licenseYOffset + 20 + i * 26})`);

        itemG.append("rect")
          .attr("width", 16)
          .attr("height", 16)
          .attr("fill", item.color);

        itemG.append("text")
          .attr("x", 22)
          .attr("y", 11)
          .attr("class", "legend-text")
          .style("font-size", "14px")
          .style("fill", "#374151")
          .text(item.name);
      });

      // Overlap section
      const overlapYOffset = licenseYOffset + 20 + licenseItems.length * 26 + 20;
      
      legendG.append("text")
        .attr("x", 0)
        .attr("y", overlapYOffset)
        .attr("class", "legend-title")
        .style("font-size", "16px")
        .style("font-weight", "600")
        .style("fill", "#374151")
        .text("Resource Overlap");

      const overlapItems = [
        { name: "1 resource", color: CHART_COLORS.overlap[0] },
        { name: "2 resources", color: CHART_COLORS.overlap[1] },
        { name: "3 resources", color: CHART_COLORS.overlap[2] },
        { name: "4 resources", color: CHART_COLORS.overlap[3] },
        { name: "5+ resources", color: CHART_COLORS.overlap[4] }
      ];

      overlapItems.forEach((item, i) => {
        const itemG = legendG.append("g")
          .attr("transform", `translate(0, ${overlapYOffset + 20 + i * 26})`);

        itemG.append("rect")
          .attr("width", 16)
          .attr("height", 16)
          .attr("fill", item.color);

        itemG.append("text")
          .attr("x", 22)
          .attr("y", 11)
          .attr("class", "legend-text")
          .style("font-size", "14px")
          .style("fill", "#374151")
          .text(item.name);
      });
    };



    // Layout charts in a grid
    const chartX = CONFIG.gap;
    const chartY = CONFIG.gap;

    // Row 1: Resources with grouped bars (maintenance + license)
    createGroupedBarChart(g, resourcesData, chartX, chartY, CONFIG.chartWidth, CONFIG.chartHeight,
      "Resources by Category", false, "a)");
    
    // Row 1: References (maintenance only)
    createStackedBarChart(g, referencesData, chartX + CONFIG.chartWidth + CONFIG.gap, chartY, 
      CONFIG.chartWidth, CONFIG.chartHeight,
      "References by maintenance", false, "b)");

    // Row 2: Records % with grouped bars (maintenance + license)
    createGroupedBarChart(g, recordsData, chartX, chartY + CONFIG.chartHeight + CONFIG.gap, 
      CONFIG.chartWidth, CONFIG.chartHeight,
      "Records by Category (%)", true, "c)");
    
    // Row 2: Resource Overlap %
    createOverlapChart(g, combinedOverlapData, chartX + CONFIG.chartWidth + CONFIG.gap, 
      chartY + CONFIG.chartHeight + CONFIG.gap, CONFIG.chartWidth, CONFIG.chartHeight,
      "Resources per entry (%)", "d)");

    // Add combined legend on the right side
    const legendX = (CONFIG.chartWidth + CONFIG.gap) * 2 + CONFIG.gap;
    const combinedLegendY = chartY + 20;
    createCombinedLegend(g, legendX, combinedLegendY);

  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <button
          onClick={downloadSVG}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          Download SVG
        </button>
      </div>
      <svg ref={svgRef} />
    </div>
  );
}