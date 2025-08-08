"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import {
  getAllDatabaseData,
  databaseColors,
  interactionTypeColors,
  annotationCategoryColors,
  VoronoiNode
} from "@/utils/database-data";

interface GridVisualizationProps {
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

export default function DatabaseGridVisualization({
  width = 1200,
  height = 1000,
}: GridVisualizationProps) {
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
    `;
    styleElement.appendChild(styleTag);
    svgElement.insertBefore(styleElement, svgElement.firstChild);
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'database-grid-visualization.svg';
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
      dimensions: {
        width,
        height,
        margin: { top: 60, right: 40, bottom: 40, left: 210 }, // More space for combined left labels, less on right
        gridGap: 0,
        minRowHeight: 30,  // Minimum row height
        maxRowHeight: 120, // Maximum row height
        baseRowHeight: 50, // Base row height for scaling
        leftLabelWidth: 200, // Wider for combined labels
      },
      colors: {
        database: databaseColors,
        interactionTypes: interactionTypeColors,
        annotationCategories: annotationCategoryColors,
      }
    };

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

    // Visualization class
    class DatabaseGridVisualizationD3 {
      config: typeof CONFIG;
      data: GridCell[];
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
      g!: d3.Selection<SVGGElement, unknown, null, undefined>;
      innerWidth!: number;
      innerHeight!: number;
      gridWidth!: number;
      gridHeight!: number;

      constructor(
        config: typeof CONFIG,
        svg: SVGSVGElement
      ) {
        this.config = config;
        this.data = generateGridData();
        this.svg = d3.select(svg);

        this.setupDimensions();
        this.setupSVG();
        this.calculateLayout();
        this.render();
      }

      setupDimensions() {
        const { width, height, margin } = this.config.dimensions;
        this.innerWidth = width - margin.left - margin.right;
        this.innerHeight = height - margin.top - margin.bottom;
        this.gridWidth = this.innerWidth;
        this.gridHeight = this.innerHeight;
        
        // Note: Height validation will be done after layout calculation since heights are now variable
      }

      setupSVG() {
        const { width, height, margin } = this.config.dimensions;

        this.svg
          .attr("width", width)
          .attr("height", height);

        this.g = this.svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
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
          .style("fill", "white")
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
              .style("fill", "#374151")
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
            
            if (isMainCategory) {
              // Single-row main categories (Intercellular, Complexes, Enzyme-Substrate)
              indent = 15;
              fontSize = "14px"; // Slightly larger for main categories
              fontWeight = "700";
              textColor = "#1f2937";
            } else if (cells.length > 1) {
              // Subcategories under multi-row categories (with rotated headers)
              indent = 55; // More space for rotated header + separator
              fontSize = "11px"; // Reduced for subcategories to fit better
              fontWeight = "600";
              textColor = "#4b5563";
            } else {
              // Fallback
              indent = 15;
              fontSize = "11px";
              fontWeight = "600";
              textColor = "#4b5563";
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

      renderTitle() {
        this.svg.append("text")
          .attr("x", this.config.dimensions.width / 2)
          .attr("y", 25)
          .attr("text-anchor", "middle")
          .style("font-size", "18px")
          .style("font-weight", "600")
          .style("fill", "#1f2937")
          .text("Database Resource Grid");
      }

    }

    // Initialize visualization
    new DatabaseGridVisualizationD3(CONFIG, svgRef.current);

  }, [width, height]);

  return (
    <>
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
    </>
  );
}