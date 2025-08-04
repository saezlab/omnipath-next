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
} from "@/utils/database-treemap-data";

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
  height = 1400, // Further increased height for all rows
}: GridVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();

    // Configuration
    const CONFIG = {
      dimensions: {
        width,
        height,
        margin: { top: 60, right: 40, bottom: 40, left: 200 }, // More space for combined left labels, less on right
        gridGap: 4,
        minRowHeight: 30,  // Minimum row height
        maxRowHeight: 120, // Maximum row height
        baseRowHeight: 50, // Base row height for scaling
        leftLabelWidth: 180, // Wider for combined labels
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
      tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
      g!: d3.Selection<SVGGElement, unknown, null, undefined>;
      innerWidth!: number;
      innerHeight!: number;
      gridWidth!: number;
      gridHeight!: number;

      constructor(
        config: typeof CONFIG,
        svg: SVGSVGElement,
        tooltip: HTMLDivElement
      ) {
        this.config = config;
        this.data = generateGridData();
        this.tooltip = d3.select(tooltip);
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
        this.renderTitle();
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
          .attr("fill", "#f8f9fa")
          .attr("stroke", "#e9ecef")
          .attr("stroke-width", 1);

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
          .padding(1)
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
          .on("mouseover", (event: any, d: any) => this.handlePartitionHover(event, d))
          .on("mouseout", () => this.handlePartitionHoverOut());

        // Add labels for larger partitions
        partitions.append("text")
          .attr("x", (d: any) => (d.x0 + d.x1) / 2)
          .attr("y", (d: any) => (d.y0 + d.y1) / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("font-size", (d: any) => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            const fontSize = Math.min(12, Math.min(width / 4, height / 2));
            return fontSize < 8 ? "0px" : `${fontSize}px`; // Hide if too small
          })
          .style("fill", "white")
          .style("font-weight", "600")
          .style("pointer-events", "none")
          .style("text-shadow", "0 0 2px rgba(0,0,0,0.8)")
          .text((d: any) => {
            const width = d.x1 - d.x0;
            const height = d.y1 - d.y0;
            if (width < 40 || height < 20) return "";
            
            const name = d.data.name;
            const maxChars = Math.floor(width / 6);
            return name.length > maxChars ? name.substring(0, maxChars - 1) + "…" : name;
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
            .attr("fill", "rgba(249, 250, 251, 0.8)")
            .attr("stroke", "#e5e7eb")
            .attr("stroke-width", 1)
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
              .style("font-size", "14px")
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
            let indent, fontSize, fontWeight, textColor, yOffset;
            
            if (isMainCategory) {
              // Single-row main categories (Intercellular, Complexes, Enzyme-Substrate)
              indent = 15;
              fontSize = "13px";
              fontWeight = "700";
              textColor = "#1f2937";
              yOffset = 0;
            } else if (cells.length > 1) {
              // Subcategories under multi-row categories (with rotated headers)
              indent = 55; // More space for rotated header + separator
              fontSize = "12px";
              fontWeight = "600";
              textColor = "#4b5563";
              yOffset = 0;
            } else {
              // Fallback
              indent = 15;
              fontSize = "12px";
              fontWeight = "600";
              textColor = "#4b5563";
              yOffset = 0;
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

      handlePartitionHover(event: any, d: any) {
        const resource = d.data;
        const tooltipContent = `
          <strong>${resource.name}</strong><br/>
          Database: ${resource.database}<br/>
          Category: ${resource.category}<br/>
          ${resource.subcategory ? `Subcategory: ${resource.subcategory}<br/>` : ''}
          Records: ${resource.size.toLocaleString()}<br/>
          ${resource.interactionType ? `Type: ${resource.interactionType.replace(/_/g, ' ')}<br/>` : ''}
          ${resource.originalName && resource.originalName !== resource.name ? `Original: ${resource.originalName}` : ''}
        `;
        
        this.tooltip
          .style("opacity", 0.9)
          .html(tooltipContent)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");

        // Highlight effect
        d3.select(event.currentTarget.parentNode)
          .select("rect")
          .style("stroke", "#374151")
          .style("stroke-width", 2);
      }

      handlePartitionHoverOut() {
        this.tooltip.style("opacity", 0);
        
        // Remove highlight
        d3.selectAll(".partition rect")
          .style("stroke", "white")
          .style("stroke-width", 0.5);
      }
    }

    // Initialize visualization
    new DatabaseGridVisualizationD3(CONFIG, svgRef.current, tooltipRef.current);

  }, [width, height]);

  return (
    <>
      <div className="relative">
        <svg ref={svgRef} />
        <div
          ref={tooltipRef}
          className="fixed text-left p-2 text-xs bg-white text-black pointer-events-none opacity-0 z-[1000] font-medium border border-gray-300 rounded shadow-lg"
          style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          }}
        />
      </div>
    </>
  );
}