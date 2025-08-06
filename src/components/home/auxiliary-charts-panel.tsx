"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { 
  processChartData,
  CHART_COLORS
} from "@/utils/resource-data-processor";



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


export function AuxiliaryChartsPanel() {
  const svgRef = useRef<SVGSVGElement>(null);

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
      width: 1450,
      height: 400,
      margin: { top: 30, right: 140, bottom: 60, left: 180 },
      chartWidth: 260,
      chartHeight: 280,
      legendWidth: 140,
      gap: 20
    };

    // Get pre-processed chart data from centralized module
    const { resourcesData, recordsData, referencesData, combinedOverlapData } = processChartData();

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
      const yAxis = d3.axisLeft(yScale)
        .ticks(5);
      if (!isPercentage) {
        yAxis.tickFormat(d3.format(".0s"));
      }
      
      innerG.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-weight", "500");

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
      const yAxis = d3.axisLeft(yScale)
        .ticks(5);
      
      // Format numbers for non-percentage charts
      if (!isPercentage) {
        yAxis.tickFormat(d3.format(".0s"));
      }
      
      innerG.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-weight", "500");

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
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-weight", "500");

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

    // Create maintenance and license legend (left side)
    const createMaintenanceLicenseLegend = (
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
        .style("font-size", "14px")
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
          .attr("transform", `translate(0, ${18 + i * 22})`);

        itemG.append("rect")
          .attr("width", 14)
          .attr("height", 14)
          .attr("fill", item.color);

        itemG.append("text")
          .attr("x", 18)
          .attr("y", 10)
          .attr("class", "legend-text")
          .style("font-size", "12px")
          .style("fill", "#374151")
          .text(item.name);
      });

      // License section
      const licenseYOffset = 18 + maintenanceItems.length * 22 + 16;
      
      legendG.append("text")
        .attr("x", 0)
        .attr("y", licenseYOffset)
        .attr("class", "legend-title")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .style("fill", "#374151")
        .text("License");

      const licenseItems = [
        { name: "Academic/Nonprofit", color: CHART_COLORS.license.academic_nonprofit },
        { name: "Commercial", color: CHART_COLORS.license.commercial }
      ];

      licenseItems.forEach((item, i) => {
        const itemG = legendG.append("g")
          .attr("transform", `translate(0, ${licenseYOffset + 18 + i * 22})`);

        itemG.append("rect")
          .attr("width", 14)
          .attr("height", 14)
          .attr("fill", item.color);

        itemG.append("text")
          .attr("x", 18)
          .attr("y", 10)
          .attr("class", "legend-text")
          .style("font-size", "12px")
          .style("fill", "#374151")
          .text(item.name);
      });
    };

    // Create resource overlap legend (right side)
    const createOverlapLegend = (
      container: d3.Selection<SVGGElement, unknown, null, undefined>,
      x: number,
      y: number
    ) => {
      const legendG = container.append("g")
        .attr("transform", `translate(${x},${y})`);
      
      legendG.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("class", "legend-title")
        .style("font-size", "14px")
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
          .attr("transform", `translate(0, ${18 + i * 22})`);

        itemG.append("rect")
          .attr("width", 14)
          .attr("height", 14)
          .attr("fill", item.color);

        itemG.append("text")
          .attr("x", 18)
          .attr("y", 10)
          .attr("class", "legend-text")
          .style("font-size", "12px")
          .style("fill", "#374151")
          .text(item.name);
      });
    };



    // Layout charts in a single row
    const chartY = CONFIG.gap;
    let currentX = 0;

    // Chart 1: Resources with grouped bars (maintenance + license)
    createGroupedBarChart(g, resourcesData, currentX, chartY, CONFIG.chartWidth, CONFIG.chartHeight,
      "Resources by Category", false, "a)");
    currentX += CONFIG.chartWidth + CONFIG.gap;
    
    // Chart 2: References (maintenance only)
    createStackedBarChart(g, referencesData, currentX, chartY, 
      CONFIG.chartWidth, CONFIG.chartHeight,
      "References by maintenance", false, "b)");
    currentX += CONFIG.chartWidth + CONFIG.gap;

    // Chart 3: Records % with grouped bars (maintenance + license)
    createGroupedBarChart(g, recordsData, currentX, chartY, 
      CONFIG.chartWidth, CONFIG.chartHeight,
      "Records by Category (%)", true, "c)");
    currentX += CONFIG.chartWidth + CONFIG.gap;
    
    // Chart 4: Resource Overlap %
    createOverlapChart(g, combinedOverlapData, currentX, chartY, 
      CONFIG.chartWidth, CONFIG.chartHeight,
      "Resources per entry (%)", "d)");

    // Calculate total width of all charts
    const totalChartsWidth = CONFIG.chartWidth * 4 + CONFIG.gap * 3;

    // Add maintenance & license legend on the LEFT side (same row as charts)
    const leftLegendX = -CONFIG.legendWidth - 20;
    const leftLegendY = chartY + 20;
    createMaintenanceLicenseLegend(g, leftLegendX, leftLegendY);

    // Add resource overlap legend on the RIGHT side (same row as charts)
    const rightLegendX = totalChartsWidth + CONFIG.gap;
    const rightLegendY = chartY + 20;
    createOverlapLegend(g, rightLegendX, rightLegendY);

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