"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import dbStats from "@/data/db-stats.json";
import maintenanceCategories from "@/data/resources_by_maintenance_category.json";

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

export function AuxiliaryChartsPanel() {
  const svgRef = useRef<SVGSVGElement>(null);

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
      width: 1000,
      height: 580,
      margin: { top: 20, right: 160, bottom: 60, left: 40 },
      chartWidth: 280,
      chartHeight: 240,
      legendWidth: 140,
      gap: 20
    };

    // Helper function to create data mappings
    const createDataMappings = () => {
      const allSources = new Set<string>();
      databases.forEach(db => {
        db.data.forEach(item => allSources.add(item.source));
      });

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

      Array.from(allSources).forEach(source => {
        if (!sourceMaintenanceMap[source]) {
          unmappedSources.push(source);
        }
      });

      return { sourceMaintenanceMap, unmappedSources };
    };

    const { sourceMaintenanceMap } = createDataMappings();

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

      // 2. Records per database (percentages)
      const recordsData: D3ChartData[] = databases.map(db => {
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
        
        return {
          category: db.title,
          frequent: total > 0 ? ((maintenanceBreakdown.frequent / total) * 100) : 0,
          infrequent: total > 0 ? ((maintenanceBreakdown.infrequent / total) * 100) : 0,
          one_time_paper: total > 0 ? ((maintenanceBreakdown.one_time_paper / total) * 100) : 0,
          discontinued: total > 0 ? ((maintenanceBreakdown.discontinued / total) * 100) : 0,
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

    // D3 Chart creation function
    const createStackedBarChart = (
      container: d3.Selection<SVGGElement, unknown, null, undefined>,
      data: D3ChartData[],
      x: number,
      y: number,
      width: number,
      height: number,
      yAxisLabel: string = "",
      isPercentage: boolean = false
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
    };

    // Create overlap chart
    const createOverlapChart = (
      container: d3.Selection<SVGGElement, unknown, null, undefined>,
      data: OverlapData[],
      x: number,
      y: number,
      width: number,
      height: number,
      yAxisLabel: string = ""
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
    };

    // Create maintenance legend (for upper row)
    const createMaintenanceLegend = (
      container: d3.Selection<SVGGElement, unknown, null, undefined>,
      x: number,
      y: number
    ) => {
      const legendG = container.append("g")
        .attr("transform", `translate(${x},${y})`);

      const maintenanceItems = [
        { name: "Frequent", color: CHART_COLORS.maintenance.frequent },
        { name: "Infrequent", color: CHART_COLORS.maintenance.infrequent },
        { name: "One Time Paper", color: CHART_COLORS.maintenance.one_time_paper },
        { name: "Discontinued", color: CHART_COLORS.maintenance.discontinued }
      ];

      maintenanceItems.forEach((item, i) => {
        const itemG = legendG.append("g")
          .attr("transform", `translate(0, ${i * 22})`);

        itemG.append("rect")
          .attr("width", 14)
          .attr("height", 14)
          .attr("fill", item.color);

        itemG.append("text")
          .attr("x", 20)
          .attr("y", 10)
          .attr("class", "legend-text")
          .style("font-size", "12px")
          .style("fill", "#374151")
          .text(item.name);
      });
    };

    // Create overlap legend (for lower row)
    const createOverlapLegend = (
      container: d3.Selection<SVGGElement, unknown, null, undefined>,
      x: number,
      y: number
    ) => {
      const legendG = container.append("g")
        .attr("transform", `translate(${x},${y})`);

      const overlapItems = [
        { name: "1 resource", color: CHART_COLORS.overlap[0] },
        { name: "2 resources", color: CHART_COLORS.overlap[1] },
        { name: "3 resources", color: CHART_COLORS.overlap[2] },
        { name: "4 resources", color: CHART_COLORS.overlap[3] },
        { name: "5+ resources", color: CHART_COLORS.overlap[4] }
      ];

      overlapItems.forEach((item, i) => {
        const itemG = legendG.append("g")
          .attr("transform", `translate(0, ${i * 22})`);

        itemG.append("rect")
          .attr("width", 14)
          .attr("height", 14)
          .attr("fill", item.color);

        itemG.append("text")
          .attr("x", 20)
          .attr("y", 10)
          .attr("class", "legend-text")
          .style("font-size", "12px")
          .style("fill", "#374151")
          .text(item.name);
      });
    };

    // Layout charts in a grid
    const chartX = CONFIG.gap;
    const chartY = CONFIG.gap;

    // Row 1: Resources and References (absolute values)
    createStackedBarChart(g, resourcesData, chartX, chartY, CONFIG.chartWidth, CONFIG.chartHeight,
      "Number of resources", false);
    
    createStackedBarChart(g, referencesData, chartX + CONFIG.chartWidth + CONFIG.gap, chartY, 
      CONFIG.chartWidth, CONFIG.chartHeight,
      "Number of references", false);

    // Row 2: Records % and Resource Overlap %
    createStackedBarChart(g, recordsData, chartX, chartY + CONFIG.chartHeight + CONFIG.gap, 
      CONFIG.chartWidth, CONFIG.chartHeight,
      "Records by maintenance (%)", true);
    
    createOverlapChart(g, combinedOverlapData, chartX + CONFIG.chartWidth + CONFIG.gap, 
      chartY + CONFIG.chartHeight + CONFIG.gap, CONFIG.chartWidth, CONFIG.chartHeight,
      "Resources per entry (%)");

    // Add legends on the right side, centered with each row
    const legendX = (CONFIG.chartWidth + CONFIG.gap) * 2 + CONFIG.gap;
    
    // Upper legend (maintenance) - centered vertically with upper row
    const upperLegendY = chartY + (CONFIG.chartHeight / 2) - (4 * 22 / 2); // 4 items * 22px spacing
    createMaintenanceLegend(g, legendX, upperLegendY);
    
    // Lower legend (overlap) - centered vertically with lower row
    const lowerLegendY = chartY + CONFIG.chartHeight + CONFIG.gap + (CONFIG.chartHeight / 2) - (5 * 22 / 2); // 5 items * 22px spacing
    createOverlapLegend(g, legendX, lowerLegendY);

  }, []);

  return (
    <div className="relative">
      <button
        onClick={downloadSVG}
        className="absolute top-2 right-2 z-10 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        Download SVG
      </button>
      <svg ref={svgRef} />
    </div>
  );
}