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
  height = 700,
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
        margin: { top: 60, right: 240, bottom: 40, left: 40 },
        gridGap: 4,
        rowHeight: 50,
        labelWidth: 200,
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
        { key: 'enzymeSubstrate', data: dbData.enzymeSubstrate, name: 'Enzyme-Substrate' },
        { key: 'complexes', data: dbData.complexes, name: 'Complexes' },
        { key: 'annotations', data: dbData.annotations, name: 'Annotations' },
        { key: 'intercellular', data: dbData.intercellular, name: 'Intercellular' }
      ];

      mainCategories.forEach(mainCat => {
        if (mainCat.key === 'interactions') {
          // For interactions, use interaction types as subcategories
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
          // For annotations, use annotation categories as subcategories
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
          // For other categories, use all resources directly
          const resources: DatabaseResource[] = mainCat.data.children?.map((resource: VoronoiNode, idx: number) => ({
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
            subcategory: 'All',
            resources,
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
        const { gridGap, rowHeight, labelWidth } = this.config.dimensions;
        
        // Sort data by category and subcategory for consistent ordering
        const sortedData = [...this.data].sort((a, b) => {
          // Define category order
          const categoryOrder = ['Interactions', 'Annotations', 'Enzyme-Substrate', 'Complexes', 'Intercellular'];
          const categoryA = categoryOrder.indexOf(a.category);
          const categoryB = categoryOrder.indexOf(b.category);
          
          if (categoryA !== categoryB) {
            return categoryA - categoryB;
          }
          
          // Within category, sort by subcategory
          return a.subcategory.localeCompare(b.subcategory);
        });

        // Calculate row layout - one row per database/subcategory
        const rowWidth = this.gridWidth - labelWidth - 20; // Leave space for label
        
        sortedData.forEach((cell, index) => {
          cell.x = 0;
          cell.y = index * (rowHeight + gridGap);
          cell.width = rowWidth;
          cell.height = rowHeight;
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

        // Add row labels on the right side
        const { labelWidth } = this.config.dimensions;
        
        cellGroups.append("text")
          .attr("class", "row-label")
          .attr("x", d => d.width + 12)
          .attr("y", d => d.height / 2)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "middle")
          .style("font-size", "13px")
          .style("font-weight", "600")
          .style("fill", "#374151")
          .text(d => {
            if (d.subcategory === 'All') {
              return d.category;
            }
            // For interaction types, show clean formatted name
            if (d.category === 'Interactions') {
              return d.subcategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            // For annotations, show full category name
            return d.subcategory;
          });

        // Add category indicators (colored squares) next to labels
        cellGroups.append("rect")
          .attr("class", "category-indicator")
          .attr("x", d => d.width + 12 + this.getTextWidth(d) + 8)
          .attr("y", d => d.height / 2 - 6)
          .attr("width", 12)
          .attr("height", 12)
          .attr("rx", 2)
          .attr("fill", d => {
            if (d.category === 'Interactions') {
              return this.config.colors.database.Interactions;
            } else if (d.category === 'Annotations') {
              return this.config.colors.database.Annotations;
            } else {
              return this.config.colors.database[d.category as keyof typeof this.config.colors.database] || "#6b7280";
            }
          })
          .attr("stroke", "white")
          .attr("stroke-width", 1);
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

      getTextWidth(d: GridCell): number {
        // Estimate text width - in a real implementation you'd measure actual text
        let text = '';
        if (d.subcategory === 'All') {
          text = d.category;
        } else if (d.category === 'Interactions') {
          text = d.subcategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else {
          text = d.subcategory;
        }
        return text.length * 7.5; // Approximate character width
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