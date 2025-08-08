"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  getAllDatabaseData,
  databaseColors,
  interactionTypeColors,
  annotationCategoryColors,
  VoronoiNode,
  cleanSourceName,
  deduplicateSourcesForCharts
} from "@/utils/database-data";
import dbStats from "@/data/db-stats.json";
import maintenanceCategories from "@/data/resources_by_maintenance_category.json";
import resourcesByLicense from "@/data/resources_by_license.json";

interface CombinedVisualizationProps {
  width?: number;
  height?: number;
}

interface DatabaseResource {
  id: string;
  name: string;
  database: string;
  category: string;
  subcategory?: string;
  size: number;
  color: string;
  weight: number;
  code?: string;
  originalName?: string;
  interactionType?: string;
}

interface GridCell {
  category: string;
  subcategory: string;
  resources: DatabaseResource[];
  x: number;
  y: number;
  width: number;
  height: number;
}

interface D3ChartData {
  category: string;
  'frequent updates': number;
  'infrequent updates': number;
  'no updates': number;
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
    'frequent updates': '#4cbd38',    // Green - active/good
    'infrequent updates': '#f89d0e',  // Orange - caution  
    'no updates': '#d22027', // Red - no updates
    unknown: '#6b7280'
  },
  license: {
    academic_nonprofit: '#9333ea', // Purple - academic/nonprofit
    commercial: '#059669'          // Green - commercial
  },
  overlap: ['#176fc1', '#00acc1', '#5e35b1', '#f89d0e', '#d22027']
};


export default function CombinedDatabaseVisualization({
  width = 1250,
  height = 1400,
}: CombinedVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);

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
    downloadLink.download = 'combined-database-visualization.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const renderVisualization = () => {
      // Clear previous visualization
      d3.select(svgRef.current).selectAll("*").remove();

    // Configuration
    const CONFIG = {
      dimensions: {
        width,
        height,
        margin: { top: 60, right: 40, bottom: 40, left: 210 },
        gridGap: 0,
        minRowHeight: 30,
        maxRowHeight: 120,
        baseRowHeight: 50,
        leftLabelWidth: 200,
      },
      grid: {
        height: 900,  // Height for Figure A (grid)
        yPosition: 60  // Y position for grid
      },
      charts: {
        height: 400,  // Height for charts section
        yPosition: 950,  // Y position for charts with some spacing from grid
        chartWidth: 200,  // Adjusted for better fit
        chartHeight: 280,
        legendWidth: 140,
        gap: 5,  // Gap for better spacing
        margin: { top: 30, right: 40, bottom: 60, left: 210 }  // Match grid left margin
      },
      colors: {
        database: databaseColors,
        interactionTypes: interactionTypeColors,
        annotationCategories: annotationCategoryColors,
        maintenance: CHART_COLORS.maintenance,
        license: CHART_COLORS.license,
        overlap: CHART_COLORS.overlap
      }
    };

    // Set up main SVG
    const svg = d3.select(svgRef.current)
      .attr("width", CONFIG.dimensions.width)
      .attr("height", CONFIG.dimensions.height);

    // Add main title
    svg.append("text")
      .attr("x", CONFIG.dimensions.width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("font-weight", "700")
      .style("fill", () => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        return isDarkMode ? "white" : "black";
      })
      .text("OmniPath Database Resources");


    // Create group for grid visualization
    const gridG = svg.append("g")
      .attr("transform", `translate(${CONFIG.dimensions.margin.left},${CONFIG.grid.yPosition})`);

    // Get real database data
    const dbData = getAllDatabaseData();
    
    // Transform data for grid layout
    const generateGridData = (): GridCell[] => {
      const cells: GridCell[] = [];
      
      // Main database categories
      const mainCategories = [
        { key: 'interactions', data: dbData.interactions, name: 'Interactions' },
        { key: 'annotations', data: dbData.annotations, name: 'Annotations' },
        { key: 'intercellular', data: dbData.intercellular, name: 'Intercellular' },
        { key: 'complexes', data: dbData.complexes, name: 'Complexes' },
        { key: 'enzymeSubstrate', data: dbData.enzymeSubstrate, name: 'Enzyme-Substrate' }
      ];

      mainCategories.forEach(mainCat => {
        if (mainCat.key === 'interactions') {
          // Add subcategory rows for interaction types (no main row)
          mainCat.data.children.forEach((interactionType: VoronoiNode) => {
            const resources: DatabaseResource[] = interactionType.children?.map((resource: VoronoiNode, idx: number) => ({
              id: `${mainCat.key}-${interactionType.name}-${idx}`,
              name: resource.name,
              database: resource.originalName || resource.name,
              category: mainCat.name,
              subcategory: interactionType.name,
              size: Math.pow(10, resource.weight || 0) - 1,
              weight: resource.weight || 0,
              color: interactionType.color || CONFIG.colors.interactionTypes[resource.interactionType as keyof typeof CONFIG.colors.interactionTypes] || "#6b7280",
              code: resource.code,
              originalName: resource.originalName,
              interactionType: resource.interactionType
            })) || [];

            cells.push({
              category: mainCat.name,
              subcategory: interactionType.name,
              resources,
              x: 0, y: 0, width: 0, height: 0
            });
          });
        } else if (mainCat.key === 'annotations') {
          // Add subcategory rows for annotation categories (no main row)
          mainCat.data.children.forEach((annotationCat: VoronoiNode) => {
            const resources: DatabaseResource[] = annotationCat.children?.map((resource: VoronoiNode, idx: number) => ({
              id: `${mainCat.key}-${annotationCat.name}-${idx}`,
              name: resource.name,
              database: resource.originalName || resource.name,
              category: mainCat.name,
              subcategory: annotationCat.name,
              size: Math.pow(10, resource.weight || 0) - 1,
              weight: resource.weight || 0,
              color: annotationCat.color || CONFIG.colors.annotationCategories[annotationCat.name as keyof typeof CONFIG.colors.annotationCategories] || "#6b7280",
              code: resource.code,
              originalName: resource.originalName
            })) || [];

            cells.push({
              category: mainCat.name,
              subcategory: annotationCat.name,
              resources,
              x: 0, y: 0, width: 0, height: 0
            });
          });
        } else {
          // For Intercellular, Complexes, Enzyme-Substrate - create one row with all resources
          const allResources: DatabaseResource[] = mainCat.data.children?.map((resource: VoronoiNode, idx: number) => ({
            id: `${mainCat.key}-${idx}`,
            name: resource.name,
            database: resource.originalName || resource.name,
            category: mainCat.name,
            size: Math.pow(10, resource.weight || 0) - 1,
            weight: resource.weight || 0,
            color: mainCat.data.color || "#6b7280",
            code: resource.code,
            originalName: resource.originalName
          })) || [];

          cells.push({
            category: mainCat.name,
            subcategory: mainCat.name, // Use category name as subcategory for single rows
            resources: allResources,
            x: 0, y: 0, width: 0, height: 0
          });
        }
      });
      
      return cells;
    };

    // Grid visualization class
    class DatabaseGridVisualizationD3 {
      config: typeof CONFIG;
      data: GridCell[];
      g: d3.Selection<SVGGElement, unknown, null, undefined>;
      innerWidth!: number;
      innerHeight!: number;
      gridWidth!: number;
      gridHeight!: number;

      constructor(
        config: typeof CONFIG,
        g: d3.Selection<SVGGElement, unknown, null, undefined>
      ) {
        this.config = config;
        this.data = generateGridData();
        this.g = g;

        this.setupDimensions();
        this.calculateLayout();
        this.render();
      }

      setupDimensions() {
        const { width, margin } = this.config.dimensions;
        this.innerWidth = width - margin.left - margin.right;
        this.innerHeight = this.config.grid.height - 100; // Leave space for labels
        this.gridWidth = this.innerWidth;
        this.gridHeight = this.innerHeight;
      }

      calculateLayout() {
        const { gridGap, minRowHeight, maxRowHeight, baseRowHeight } = this.config.dimensions;
        
        // Sort data by category and subcategory for consistent ordering
        const sortedData = [...this.data].sort((a, b) => {
          // Define category order
          const categoryOrder = ['Interactions', 'Annotations', 'Intercellular', 'Complexes', 'Enzyme-Substrate'];
          const categoryA = categoryOrder.indexOf(a.category);
          const categoryB = categoryOrder.indexOf(b.category);
          
          if (categoryA !== categoryB) {
            return categoryA - categoryB;
          }
          
          // Within category, sort by subcategory
          return a.subcategory.localeCompare(b.subcategory);
        });

        // Calculate proportional row heights based on resource count
        const resourceCounts = sortedData.map(cell => cell.resources.length);
        const maxResourceCount = Math.max(...resourceCounts);
        const minResourceCount = Math.min(...resourceCounts);
        
        // Calculate heights proportional to resource count
        const rowHeights = resourceCounts.map(count => {
          if (maxResourceCount === minResourceCount) {
            return baseRowHeight; // All rows same height if counts are equal
          }
          
          // Scale between min and max height based on resource count
          const ratio = (count - minResourceCount) / (maxResourceCount - minResourceCount);
          return minRowHeight + (maxRowHeight - minRowHeight) * ratio;
        });

        // Calculate row layout with proportional heights
        const rowWidth = this.gridWidth; // Full width since no right labels
        let currentY = 0;
        
        sortedData.forEach((cell, index) => {
          cell.x = 0;
          cell.y = currentY;
          cell.width = rowWidth;
          cell.height = rowHeights[index];
          currentY += rowHeights[index] + gridGap;
        });
        
        // Update the data reference
        this.data = sortedData;
      }

      render() {
        this.renderGrid();
      }

      renderGrid() {
        const cellGroups = this.g.selectAll(".cell-group")
          .data(this.data)
          .enter()
          .append("g")
          .attr("class", "cell-group")
          .attr("transform", d => `translate(${d.x}, ${d.y})`);

        // Draw cell background
        cellGroups.append("rect")
          .attr("class", "cell-background")
          .attr("width", d => d.width)
          .attr("height", d => d.height)
          .attr("fill", "none")
          .attr("stroke", "none");

        // Create treemap for each cell
        cellGroups.each((d, i, nodes) => {
          this.renderCellTreemap(d3.select(nodes[i] as SVGGElement), d);
        });

        // Add combined hierarchical labels on the left side
        this.addHierarchicalLeftLabels();
      }

      renderCellTreemap(cellGroup: d3.Selection<SVGGElement, GridCell, null, undefined>, cellData: GridCell) {
        if (cellData.resources.length === 0) return;

        // Create treemap layout
        const treemap = d3.treemap()
          .size([cellData.width, cellData.height])
          .padding(2) // Increased padding for better label spacing
          .round(true);

        const root = d3.hierarchy({ children: cellData.resources } as any)
          .sum((d: any) => d.size);

        treemap(root);

        // Draw partitions
        const partitions = cellGroup.selectAll(".partition")
          .data(root.leaves())
          .enter()
          .append("g")
          .attr("class", "partition");

        partitions.append("rect")
          .attr("x", (d: any) => d.x0)
          .attr("y", (d: any) => d.y0)
          .attr("width", (d: any) => d.x1 - d.x0)
          .attr("height", (d: any) => d.y1 - d.y0)
          .attr("fill", (d: any) => d.data.color)
          .attr("stroke", "white")
          .attr("stroke-width", 0.5)
          .style("cursor", "pointer")
          .append("title")
          .text((d: any) => {
            const resource = d.data;
            let tooltip = `${resource.name}\nDatabase: ${resource.database}\nCategory: ${resource.category}`;
            
            if (resource.subcategory && resource.subcategory !== resource.category) {
              tooltip += `\nSubcategory: ${resource.subcategory}`;
            }
            
            tooltip += `\nRecords: ${resource.size.toLocaleString()}`;
            
            if (resource.interactionType) {
              tooltip += `\nType: ${resource.interactionType.replace(/_/g, ' ')}`;
            }
            
            if (resource.originalName && resource.originalName !== resource.name) {
              tooltip += `\nOriginal: ${resource.originalName}`;
            }
            
            return tooltip;
          });

        // Add labels for larger partitions
        partitions.append("text")
          .attr("x", (d: any) => (d.x0 + d.x1) / 2)
          .attr("y", (d: any) => (d.y0 + d.y1) / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("font-size", (d: any) => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            const area = width * height;
            
            // Account for padding in font size calculations
            const textPadding = 8; // 4px padding on each side
            const availableWidth = width - textPadding;
            const availableHeight = height - 4; // 2px top/bottom padding
            
            if (availableWidth <= 0 || availableHeight <= 0) return "0px";
            
            // Dynamic font sizing based on available space (more conservative)
            let fontSize;
            if (area > 4000) {
              // Large partitions: increase font size for better readability
              fontSize = Math.min(14, Math.min(availableWidth / 3.5, availableHeight / 2));
            } else if (area > 1600) {
              // Medium partitions: moderate font size
              fontSize = Math.min(10, Math.min(availableWidth / 4, availableHeight / 2.2));
            } else if (area > 600) {
              // Small partitions: use minimum readable size
              fontSize = Math.max(5, Math.min(7, Math.min(availableWidth / 5, availableHeight / 2.8)));
            } else {
              // Very small partitions: hide text
              fontSize = 0;
            }
            
            // Ensure minimum readable size is 5pt, hide if smaller
            return fontSize < 5 ? "0px" : `${Math.max(5, fontSize)}px`;
          })
          .style("fill", () => {
            // Always use white text for maximum contrast on colored backgrounds
            return "white";
          })
          .style("font-weight", "600")
          .style("pointer-events", "none")
          .style("text-shadow", "0 0 2px rgba(0,0,0,0.8)")
          .text((d: any) => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            const area = width * height;
            
            // Don't show text for very small areas
            if (area < 600) return ""; // Increased threshold due to padding
            
            const name = d.data.name;
            // Add padding margins to prevent overflow
            const textPadding = 8; // 4px padding on each side
            const availableWidth = width - textPadding;
            
            if (availableWidth <= 0) return "";
            
            // Adjust character calculation based on font size with more conservative spacing
            let charWidth;
            if (area > 4000) {
              charWidth = 6.5; // More conservative for larger fonts
            } else if (area > 1600) {
              charWidth = 5.5;
            } else {
              charWidth = 4.5; // More space per character for smaller fonts
            }
            
            const maxChars = Math.floor(availableWidth / charWidth);
            if (maxChars <= 1) return "";
            
            return name.length > maxChars ? name.substring(0, Math.max(1, maxChars - 1)) + "…" : name;
          });
      }

      addHierarchicalLeftLabels() {
        // Group rows by category to determine category sections
        const categoryGroups = new Map<string, GridCell[]>();
        this.data.forEach(cell => {
          if (!categoryGroups.has(cell.category)) {
            categoryGroups.set(cell.category, []);
          }
          categoryGroups.get(cell.category)!.push(cell);
        });

        // Add borders between main database categories
        const categoryOrder = ['Interactions', 'Annotations', 'Intercellular', 'Complexes', 'Enzyme-Substrate'];
        const orderedCategories = categoryOrder.filter(cat => categoryGroups.has(cat));
        
        orderedCategories.forEach((category, index) => {
          if (index > 0) { // Skip first category, no border above it
            const prevCategory = orderedCategories[index - 1];
            const prevCells = categoryGroups.get(prevCategory)!;
            const currentCells = categoryGroups.get(category)!;
            
            const prevMaxY = Math.max(...prevCells.map(c => c.y + c.height));
            const currentMinY = Math.min(...currentCells.map(c => c.y));
            
            // Center the border in the gap between categories
            const borderY = (prevMaxY + currentMinY) / 2;
            
            // Add horizontal border line centered in the gap
            this.g.append("line")
              .attr("class", "category-border")
              .attr("x1", -this.config.dimensions.leftLabelWidth + 5)
              .attr("x2", -10)
              .attr("y1", borderY)
              .attr("y2", borderY)
              .attr("stroke", "#d1d5db")
              .attr("stroke-width", 1);
          }
        });

        // Add labels for each row and category sections
        categoryGroups.forEach((cells, category) => {
          const minY = Math.min(...cells.map(c => c.y));
          const maxY = Math.max(...cells.map(c => c.y + c.height));

          // Add category section background
          this.g.append("rect")
            .attr("class", "category-section-bg")
            .attr("x", -this.config.dimensions.leftLabelWidth + 5)
            .attr("y", minY - 2)
            .attr("width", this.config.dimensions.leftLabelWidth - 10)
            .attr("height", maxY - minY + 4)
            .attr("fill", "none")
            .attr("stroke", "none")
            .attr("rx", 4);

          // Add category header (only for multi-row categories)
          if (cells.length > 1) {
            const centerY = (minY + maxY) / 2;
            
            // Rotate headers 90 degrees for Interactions and Annotations
            this.g.append("text")
              .attr("class", "category-header")
              .attr("x", -this.config.dimensions.leftLabelWidth + 25)
              .attr("y", centerY)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("transform", `rotate(-90, ${-this.config.dimensions.leftLabelWidth + 25}, ${centerY})`)
              .style("font-size", "15px")
              .style("font-weight", "700")
              .style("fill", () => {
                const isDarkMode = document.documentElement.classList.contains('dark');
                return isDarkMode ? "white" : "black";
              })
              .style("letter-spacing", "1px")
              .text(category.toUpperCase());
              
            // Add vertical separator line to the right of rotated text
            this.g.append("line")
              .attr("class", "category-separator")
              .attr("x1", -this.config.dimensions.leftLabelWidth + 45)
              .attr("x2", -this.config.dimensions.leftLabelWidth + 45)
              .attr("y1", minY + 5)
              .attr("y2", maxY - 5)
              .attr("stroke", "#d1d5db")
              .attr("stroke-width", 1);
          }

          // Add individual row labels
          cells.forEach(cell => {
            const rowCenterY = cell.y + cell.height / 2;
            
            // Determine the text to show
            let labelText = '';
            let isMainCategory = false;
            
            if (cell.category === 'Interactions') {
              labelText = cell.subcategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            } else if (cell.category === 'Annotations') {
              labelText = this.shortenSubcategoryText(cell.subcategory);
            } else {
              // Single-row databases (Intercellular, Complexes, Enzyme-Substrate)
              labelText = cell.category.toUpperCase();
              isMainCategory = true;
            }

            // Position text based on whether it's in a multi-row category
            let indent, fontSize, fontWeight, textColor;
            
            const isDarkMode = document.documentElement.classList.contains('dark');
            
            if (isMainCategory) {
              // Single-row main categories (Intercellular, Complexes, Enzyme-Substrate)
              indent = 15;
              fontSize = "14px"; // Slightly larger for main categories
              fontWeight = "700";
              textColor = isDarkMode ? "white" : "black";
            } else if (cells.length > 1) {
              // Subcategories under multi-row categories (with rotated headers)
              indent = 55; // More space for rotated header + separator
              fontSize = "11px"; // Reduced for subcategories to fit better
              fontWeight = "600";
              textColor = isDarkMode ? "#e5e7eb" : "#111827";
            } else {
              // Fallback
              indent = 15;
              fontSize = "11px";
              fontWeight = "600";
              textColor = isDarkMode ? "#e5e7eb" : "#111827";
            }
            
            // For subcategories in multi-row sections, just use row center
            // The header and separator provide the visual grouping
            const adjustedY = rowCenterY;

            // Handle multi-line text
            if (labelText.includes('\n')) {
              const lines = labelText.split('\n');
              const lineHeight = parseInt(fontSize) * 1.1; // 1.1x line height
              const totalHeight = (lines.length - 1) * lineHeight;
              const startY = adjustedY - totalHeight / 2;

              lines.forEach((line, lineIndex) => {
                this.g.append("text")
                  .attr("class", "row-label")
                  .attr("x", -this.config.dimensions.leftLabelWidth + indent)
                  .attr("y", startY + lineIndex * lineHeight)
                  .attr("text-anchor", "start")
                  .attr("dominant-baseline", "middle")
                  .style("font-size", fontSize)
                  .style("font-weight", fontWeight)
                  .style("fill", textColor)
                  .style("letter-spacing", isMainCategory ? "1px" : "0px")
                  .text(line);
              });
            } else {
              // Single line text
              this.g.append("text")
                .attr("class", "row-label")
                .attr("x", -this.config.dimensions.leftLabelWidth + indent)
                .attr("y", adjustedY)
                .attr("text-anchor", "start")
                .attr("dominant-baseline", "middle")
                .style("font-size", fontSize)
                .style("font-weight", fontWeight)
                .style("fill", textColor)
                .style("letter-spacing", isMainCategory ? "1px" : "0px")
                .text(labelText);
            }
          });
        });
      }

      shortenSubcategoryText(text: string): string {
        // Define abbreviations for common long terms
        const abbreviations: { [key: string]: string } = {
          'Cell-cell communication': 'Cell-cell comm.',
          'Localization (subcellular)': 'Subcellular loc.',
          'Membrane localization & topology': 'Membrane\nloc. & topology', // Two-line version
          // Alternative single-line version: 'Membrane loc.',
          'Extracellular matrix, adhesion': 'ECM & adhesion',
          'Vesicles, secretome': 'Vesicles & secretome',
          'Function, pathway': 'Function & pathway',
          'Disease, cancer': 'Disease & cancer',
          'Protein classes & families': 'Protein classes',
          'Cell type, tissue': 'Cell type & tissue',
          'Transcription factors': 'TF factors'
        };

        // Check if we have a specific abbreviation
        if (abbreviations[text]) {
          return abbreviations[text];
        }

        // If text is longer than 20 characters, apply generic shortening
        if (text.length > 20) {
          // Try to break at common word boundaries
          if (text.includes(' & ')) {
            const parts = text.split(' & ');
            if (parts[0].length <= 12) {
              return parts[0] + ' & ' + this.truncateText(parts[1], 8);
            }
          }
          
          if (text.includes(', ')) {
            const parts = text.split(', ');
            if (parts[0].length <= 15) {
              return parts[0] + ', ' + this.truncateText(parts[1], 6);
            }
          }

          // Fallback: truncate with ellipsis
          return this.truncateText(text, 18);
        }

        return text;
      }

      truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 1) + '…';
      }
    }

    // Add Figure A label to grid
    gridG.append("text")
      .attr("x", -200)
      .attr("y", 15)
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", () => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        return isDarkMode ? "white" : "black";
      })
      .text("A)");

    // Initialize grid visualization
    new DatabaseGridVisualizationD3(CONFIG, gridG);

    // Create group for charts
    const chartsG = svg.append("g")
      .attr("transform", `translate(${CONFIG.charts.margin.left},${CONFIG.charts.yPosition})`);

    // Prepare database sections for charts
    const databases: DatabaseSection[] = [
      {
        title: "Interactions",
        data: deduplicateSourcesForCharts(dbStats.interactions),
        description: "Molecular interactions between proteins"
      },
      {
        title: "Enzyme-Substrate",
        data: deduplicateSourcesForCharts(dbStats.enz_sub),
        description: "Enzyme-substrate relationships"
      },
      {
        title: "Complexes",
        data: deduplicateSourcesForCharts(dbStats.complexes),
        description: "Protein complex compositions"
      },
      {
        title: "Annotations",
        data: deduplicateSourcesForCharts(dbStats.annotations),
        description: "Functional annotations and properties"
      },
      {
        title: "Intercellular",
        data: deduplicateSourcesForCharts(dbStats.intercell),
        description: "Intercellular communication molecules"
      }
    ];

    // Helper function to create data mappings
    const createDataMappings = () => {
      const allSources = new Set<string>();
      databases.forEach(db => {
        db.data.forEach(item => allSources.add(item.source));
      });

      const sourceMaintenanceMap: Record<string, string> = {};
      const sourceLicenseMap: Record<string, string> = {};
      
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

      return { sourceMaintenanceMap, sourceLicenseMap };
    };

    const { sourceMaintenanceMap, sourceLicenseMap } = createDataMappings();

    // Prepare chart data
    const prepareChartData = () => {
      // 1. Resources per database
      const resourcesData: D3ChartData[] = databases.map(db => {
        const maintenanceBreakdown: Record<string, number> = {
          'frequent updates': 0,
          'infrequent updates': 0,
          'no updates': 0
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
          'frequent updates': maintenanceBreakdown['frequent updates'],
          'infrequent updates': maintenanceBreakdown['infrequent updates'],
          'no updates': maintenanceBreakdown['no updates'],
          academic_nonprofit: licenseBreakdown.academic_nonprofit,
          commercial: licenseBreakdown.commercial,
          total: db.data.length
        };
      });

      // 2. Records per database (percentages)
      const recordsData: D3ChartData[] = databases.map(db => {
        const maintenanceBreakdown: Record<string, number> = {
          'frequent updates': 0,
          'infrequent updates': 0,
          'no updates': 0
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
          'frequent updates': total > 0 ? ((maintenanceBreakdown['frequent updates'] / total) * 100) : 0,
          'infrequent updates': total > 0 ? ((maintenanceBreakdown['infrequent updates'] / total) * 100) : 0,
          'no updates': total > 0 ? ((maintenanceBreakdown['no updates'] / total) * 100) : 0,
          academic_nonprofit: total > 0 ? ((licenseBreakdown.academic_nonprofit / total) * 100) : 0,
          commercial: total > 0 ? ((licenseBreakdown.commercial / total) * 100) : 0,
          totalRecords: total
        };
      });

      // 3. References per database - simplified approach
      const referencesData: D3ChartData[] = databases
        .filter(db => !['Annotations', 'Intercellular'].includes(db.title))
        .map(db => {
        const dbNames = db.data.map(d => d.source);
        const literatureRefs = (dbStats.plotData?.literatureRefsByDatabaseAndType || [])
          .filter((ref: any) => dbNames.includes(ref.database));
        
        const maintenanceBreakdown: Record<string, number> = {
          'frequent updates': 0,
          'infrequent updates': 0,
          'no updates': 0
        };

        // Simply aggregate reference counts by database maintenance category
        literatureRefs.forEach((ref: any) => {
          const category = sourceMaintenanceMap[ref.database];
          if (category) {
            maintenanceBreakdown[category] += ref.unique_reference_count;
          }
        });

        const totalReferences = Object.values(maintenanceBreakdown).reduce((sum, count) => sum + count, 0);

        return {
          category: db.title,
          'frequent updates': maintenanceBreakdown['frequent updates'],
          'infrequent updates': maintenanceBreakdown['infrequent updates'],
          'no updates': maintenanceBreakdown['no updates'],
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
        d['frequent updates'] + d['infrequent updates'] + d['no updates']) || 0;
      const maxLicenseValue = d3.max(data, d => 
        (d.academic_nonprofit || 0) + (d.commercial || 0)) || 0;
      
      const yScale = d3.scaleLinear()
        .domain([0, isPercentage ? 100 : Math.max(maxMaintenanceValue, maxLicenseValue)])
        .range([innerHeight, 0]);

      // Maintenance stacks
      const maintenanceStack = d3.stack<D3ChartData>()
        .keys(['frequent updates', 'infrequent updates', 'no updates'])
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
            CHART_COLORS.maintenance['frequent updates'],
            CHART_COLORS.maintenance['infrequent updates'],
            CHART_COLORS.maintenance['no updates']
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
            const keys = ['frequent updates', 'infrequent updates', 'no updates'];
            const seriesName = keys[seriesIndex] || 'unknown';
            const value = d[1] - d[0];
            const displayValue = isPercentage ? `${value.toFixed(1)}%` : value.toLocaleString();
            const categoryName = seriesName.replace(/\b\w/g, (l: string) => l.toUpperCase());
            return `${d.data.category} - Maintenance\n${categoryName}: ${displayValue}`;
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
            const categoryName = seriesName.replace(/\b\w/g, (l: string) => l.toUpperCase());
            return `${d.data.category} - License\n${categoryName}: ${displayValue}`;
          });
      });

      // X axis
      innerG.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "12px");

      // Y axis with formatting
      const yAxis = d3.axisLeft(yScale)
        .ticks(5);
      if (!isPercentage) {
        yAxis.tickFormat(d3.format(".0s"));
      }
      
      innerG.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "14px")
        .style("font-weight", "500");

      // Y axis label
      if (yAxisLabel) {
        innerG.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (innerHeight / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .style("font-size", "13px")
          .text(yAxisLabel);
      }

      // Add chart label (A, B, C, D, E)
      if (label) {
        chartG.append("text")
          .attr("x", -15)
          .attr("y", 15)
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .style("fill", () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            return isDarkMode ? "white" : "black";
          })
          .text(label);
      }

    };

    // D3 Chart creation function for stacked bars
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
          (d['frequent updates'] + d['infrequent updates'] + d['no updates'])) || 0])
        .range([innerHeight, 0]);

      // Stack data
      const stack = d3.stack<D3ChartData>()
        .keys(['frequent updates', 'infrequent updates', 'no updates'])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const series = stack(data);

      // Stack keys for reference
      const stackKeys = ['frequent updates', 'infrequent updates', 'no updates'];

      // Draw bars
      const seriesGroups = innerG.selectAll(".series")
        .data(series)
        .enter().append("g")
        .attr("class", "series")
        .attr("fill", (_, i) => {
          const colors = [
            CHART_COLORS.maintenance['frequent updates'],
            CHART_COLORS.maintenance['infrequent updates'],
            CHART_COLORS.maintenance['no updates']
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
            const categoryName = seriesName.replace(/\b\w/g, (l: string) => l.toUpperCase());
            
            let totalText = '';
            if (d.data.total !== undefined) {
              totalText = `\nTotal: ${d.data.total.toLocaleString()} references`;
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
        .style("font-size", "12px");

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
        .style("font-size", "14px")
        .style("font-weight", "500");

      // Y axis label
      if (yAxisLabel) {
        innerG.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (innerHeight / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .style("font-size", "13px")
          .text(yAxisLabel);
      }

      // Add chart label (A, B, C, D, E)
      if (label) {
        chartG.append("text")
          .attr("x", -15)
          .attr("y", 15)
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .style("fill", () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            return isDarkMode ? "white" : "black";
          })
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
        .style("font-size", "12px");

      // Y axis
      innerG.append("g")
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll("text")
        .style("font-size", "14px")
        .style("font-weight", "500");

      // Y axis label
      if (yAxisLabel) {
        innerG.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (innerHeight / 2))
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .style("font-size", "13px")
          .text(yAxisLabel);
      }

      // Add chart label (A, B, C, D, E)
      if (label) {
        chartG.append("text")
          .attr("x", -15)
          .attr("y", 15)
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .style("fill", () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            return isDarkMode ? "white" : "black";
          })
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
        .style("fill", () => {
          const isDarkMode = document.documentElement.classList.contains('dark');
          return isDarkMode ? "white" : "black";
        })
        .text("Maintenance");

      const maintenanceItems = [
        { name: "Frequent Updates", color: CHART_COLORS.maintenance['frequent updates'] },
        { name: "Infrequent Updates", color: CHART_COLORS.maintenance['infrequent updates'] },
        { name: "No Updates", color: CHART_COLORS.maintenance['no updates'] }
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
          .style("fill", () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            return isDarkMode ? "#e5e7eb" : "#111827";
          })
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
        .style("fill", () => {
          const isDarkMode = document.documentElement.classList.contains('dark');
          return isDarkMode ? "white" : "black";
        })
        .text("License");

      const licenseItems = [
        { name: "Academic", color: CHART_COLORS.license.academic_nonprofit },
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
          .style("fill", () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            return isDarkMode ? "#e5e7eb" : "#111827";
          })
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
        .style("fill", () => {
          const isDarkMode = document.documentElement.classList.contains('dark');
          return isDarkMode ? "white" : "black";
        })
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
          .style("fill", () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            return isDarkMode ? "#e5e7eb" : "#111827";
          })
          .text(item.name);
      });
    };

    // Layout charts in a single row
    const chartY = CONFIG.charts.gap;
    let currentX = 0;

    // Chart B: Resources with grouped bars (maintenance + license)
    createGroupedBarChart(chartsG, resourcesData, currentX, chartY, CONFIG.charts.chartWidth, CONFIG.charts.chartHeight,
      "Resources by Category", false, "B)");
    currentX += CONFIG.charts.chartWidth + CONFIG.charts.gap;
    
    // Chart C: Records % with grouped bars (maintenance + license)
    createGroupedBarChart(chartsG, recordsData, currentX, chartY, 
      CONFIG.charts.chartWidth, CONFIG.charts.chartHeight,
      "Records by Category (%)", true, "C)");
    currentX += CONFIG.charts.chartWidth + CONFIG.charts.gap;

    // Chart D: References (maintenance only)
    createStackedBarChart(chartsG, referencesData, currentX, chartY, 
      CONFIG.charts.chartWidth, CONFIG.charts.chartHeight,
      "References by maintenance", false, "D)");
    currentX += CONFIG.charts.chartWidth + CONFIG.charts.gap;
    
    // Chart E: Resource Overlap %
    createOverlapChart(chartsG, combinedOverlapData, currentX, chartY, 
      CONFIG.charts.chartWidth, CONFIG.charts.chartHeight,
      "Resources per entry (%)", "E)");

    // Calculate total width of all charts
    const totalChartsWidth = CONFIG.charts.chartWidth * 4 + CONFIG.charts.gap * 3;
    
    // Position legends closer to charts to reduce wasted space
    // Left legend positioned closer to first chart
    const leftLegendX = -CONFIG.charts.legendWidth - 40;
    const leftLegendY = chartY + 20;
    createMaintenanceLicenseLegend(chartsG, leftLegendX, leftLegendY);

    // Right legend positioned closer to last chart
    const rightLegendX = totalChartsWidth + 40;
    const rightLegendY = chartY + 20;
    createOverlapLegend(chartsG, rightLegendX, rightLegendY);

    // Add horizontal separator line between grid and charts, extending to legends
    const separatorY = 940;
    
    svg.append("line")
      .attr("x1", CONFIG.charts.margin.left + leftLegendX - 20)
      .attr("x2", CONFIG.charts.margin.left + rightLegendX + CONFIG.charts.legendWidth + 20)
      .attr("y1", separatorY)
      .attr("y2", separatorY)
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.7);
    };

    // Initial render
    renderVisualization();

    // Create an observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Re-render visualization when theme changes
          renderVisualization();
        }
      });
    });

    // Start observing the document element for class changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, [width, height]);

  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} />
      <div className="mt-4">
        <button
          onClick={downloadSVG}
          className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 transition-colors"
        >
          Download as SVG
        </button>
      </div>
    </div>
  );
}