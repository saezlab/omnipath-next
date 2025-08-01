/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { voronoiTreemap } from "d3-voronoi-treemap";
import {
  VoronoiNode,
  getAllDatabaseDataAlt,
  interactionTypeColorsAlt,
  annotationCategoryColorsAlt
} from "@/utils/database-treemap-data";

function createTreemap(
  svgElement: SVGSVGElement,
  data: VoronoiNode,
  width: number,
  height: number
) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  // Set viewBox for proper scaling
  svg.attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  const actualWidth = width - margin.left - margin.right;
  const actualHeight = height - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create rectangular clipping polygon
  const rectangularPolygon: [number, number][] = [
    [0, 0],
    [actualWidth, 0],
    [actualWidth, actualHeight],
    [0, actualHeight]
  ];

  // Create hierarchy
  const hierarchy = d3.hierarchy(data)
    .sum(d => d.weight || 0);

  // Create voronoi treemap
  const _voronoiTreemap = voronoiTreemap()
    .clip(rectangularPolygon);
  
  _voronoiTreemap(hierarchy);

  // Draw background rectangle
  g.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", actualWidth)
    .attr("height", actualHeight)
    .attr("fill", "#f5f5f5");

  // Get all nodes
  const leaves = hierarchy.leaves();
  const parents = hierarchy.descendants().filter(d => d.children && d.depth > 0);

  // Font scale
  const fontScale = d3.scaleLinear()
    .domain([d3.min(leaves, d => d.value) || 0, d3.max(leaves, d => d.value) || 1])
    .range([6, 11])
    .clamp(true);

  // Draw parent cells (categories/types) first
  g.append("g")
    .selectAll(".parent-cell")
    .data(parents)
    .enter()
    .append("path")
    .attr("class", "parent-cell")
    .attr("d", (d: any) => `M${d.polygon.join(",")}z`)
    .style("fill", (d: any) => d.data.color || "#e0e0e0")
    .style("opacity", 0.3);

  // Draw leaf cells
  g.append("g")
    .selectAll(".cell")
    .data(leaves)
    .enter()
    .append("path")
    .attr("class", "cell")
    .attr("d", (d: any) => `M${d.polygon.join(",")}z`)
    .style("fill", (d: any) => {
      if (d.parent?.data.color) {
        const baseColor = d3.color(d.parent.data.color);
        const sizeFactor = d.value / d.parent.value;
        return baseColor ? baseColor.darker(0.3 - sizeFactor * 0.3).toString() : d.parent.data.color;
      }
      return "#ccc";
    })
    .style("stroke", "#fff")
    .style("stroke-width", 0.3)
    .style("opacity", 0.9);

  // Add hover effects
  g.append("g")
    .selectAll(".hoverer")
    .data(leaves)
    .enter()
    .append("path")
    .attr("class", "hoverer")
    .attr("d", (d: any) => `M${d.polygon.join(",")}z`)
    .style("fill", "transparent")
    .style("stroke", "transparent")
    .style("stroke-width", 0)
    .style("cursor", "pointer")
    .on("mouseenter", function() {
      d3.select(this)
        .style("stroke", "white")
        .style("stroke-width", 3);
    })
    .on("mouseleave", function() {
      d3.select(this)
        .style("stroke", "transparent")
        .style("stroke-width", 0);
    })
    .append("title")
    .text((d: any) => {
      const actualCount = Math.round(Math.pow(10, d.value) - 1);
      
      // Get the root database name - go up the hierarchy to find it
      let databaseName = d.parent.data.name;
      if (d.parent.parent && d.parent.parent.data.name !== "root") {
        databaseName = d.parent.parent.data.name;
      }
      
      let tooltip = `${d.data.name}\n${actualCount.toLocaleString()} records\nDatabase: ${databaseName}`;
      
      // Show interaction type if available
      if (d.data.interactionType) {
        tooltip += `\nType: ${d.data.interactionType.replace(/_/g, ' ')}`;
      }
      
      // Show original name if it was cleaned
      if (d.data.originalName && d.data.originalName !== d.data.name) {
        tooltip += `\nOriginal: ${d.data.originalName}`;
      }
      
      return tooltip;
    });

  // Calculate polygon bounds
  const calculatePolygonBounds = (polygon: any) => {
    const xs = polygon.map((p: [number, number]) => p[0]);
    const ys = polygon.map((p: [number, number]) => p[1]);
    return {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
      minX: Math.min(...xs),
      minY: Math.min(...ys)
    };
  };

  // Skip drawing category/type labels as requested

  // Draw source labels
  g.append("g")
    .selectAll(".label")
    .data(leaves)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("transform", (d: any) => `translate(${d.polygon.site.x},${d.polygon.site.y})`)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", (d: any) => {
      const bounds = calculatePolygonBounds(d.polygon);
      const fontSize = fontScale(d.value);
      return `${Math.min(fontSize, bounds.width / 8, bounds.height / 2)}px`;
    })
    .style("font-family", "Arial, sans-serif")
    .style("fill", "white")
    .style("font-weight", "500")
    .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)")
    .style("pointer-events", "none")
    .text((d: any) => {
      const bounds = calculatePolygonBounds(d.polygon);
      const minDimension = Math.min(bounds.width, bounds.height);
      
      if (minDimension < 15) return "";
      
      if (minDimension < 30) {
        return d.data.code || d.data.name.substring(0, 3);
      } else {
        const estimatedTextWidth = d.data.name.length * 5;
        return estimatedTextWidth < bounds.width * 0.8 ? d.data.name : d.data.code;
      }
    });
}

export function DatabasePrintTreemapsAlternative() {
  const interactionsRef = useRef<SVGSVGElement>(null);
  const enzymeSubstrateRef = useRef<SVGSVGElement>(null);
  const complexesRef = useRef<SVGSVGElement>(null);
  const annotationsRef = useRef<SVGSVGElement>(null);
  const intercellularRef = useRef<SVGSVGElement>(null);

  const dbData = getAllDatabaseDataAlt();

  useEffect(() => {
    // Calculate sizes to ensure equal column widths and matching heights
    const columnWidth = 280; // Equal width for all columns
    const totalHeight = 600; // Total height for the layout
    
    // Column 1: 3 square treemaps
    const col1TreemapSize = totalHeight / 3; // 200x200 each
    
    // Column 2: 2 treemaps that are 1.5x the size
    const col2TreemapSize = totalHeight / 2; // 300x300 each

    // Create individual treemaps
    if (interactionsRef.current) {
      createTreemap(interactionsRef.current, dbData.interactions, columnWidth, col2TreemapSize);
    }

    if (enzymeSubstrateRef.current) {
      createTreemap(enzymeSubstrateRef.current, dbData.enzymeSubstrate, columnWidth, col1TreemapSize);
    }

    if (complexesRef.current) {
      createTreemap(complexesRef.current, dbData.complexes, columnWidth, col1TreemapSize);
    }

    if (annotationsRef.current) {
      createTreemap(annotationsRef.current, dbData.annotations, columnWidth, col2TreemapSize);
    }

    if (intercellularRef.current) {
      createTreemap(intercellularRef.current, dbData.intercellular, columnWidth, col1TreemapSize);
    }
  }, []);

  return (
    <div className="w-full py-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: "Arial, sans-serif" }}>
        OmniPath Database Contents
      </h2>

      {/* Three column layout */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-4 justify-center">
          {/* Column 1: 3 databases vertically stacked */}
          <div className="flex flex-col" style={{ width: "280px", height: "600px" }}>
            <div style={{ width: "280px", height: "200px" }}>
              <svg ref={intercellularRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
            <div style={{ width: "280px", height: "200px" }}>
              <svg ref={complexesRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
            <div style={{ width: "280px", height: "200px" }}>
              <svg ref={enzymeSubstrateRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
          </div>

          {/* Column 2: 2 databases vertically stacked */}
          <div className="flex flex-col" style={{ width: "280px", height: "600px" }}>
            <div style={{ width: "280px", height: "300px" }}>
              <svg ref={interactionsRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
            <div style={{ width: "280px", height: "300px" }}>
              <svg ref={annotationsRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
          </div>

          {/* Column 3: Labels */}
          <div className="flex flex-col" style={{ width: "280px", height: "600px", paddingLeft: "20px" }}>
            {/* Interaction Types - aligned with interactions treemap */}
            <div style={{ height: "300px" }} className="flex items-center">
              <div className="w-full">
                <h4 className="font-bold mb-3 text-base text-gray-800">Interaction Types</h4>
                <div className="space-y-2">
                  {Object.entries(interactionTypeColorsAlt).map(([type, color]) => (
                    <div key={type} className="flex items-start gap-3">
                      <div 
                        className="w-4 h-4 rounded-sm flex-shrink-0 mt-0.5" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm text-gray-700 leading-5">
                        {type === 'mirna_transcriptional' ? 'miRNA Transcriptional' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Annotation Categories - aligned with annotations treemap */}
            <div style={{ height: "300px" }} className="flex items-center">
              <div className="w-full">
                <h4 className="font-bold mb-3 text-base text-gray-800">Annotation Categories</h4>
                <div className="space-y-1.5">
                  {Object.entries(annotationCategoryColorsAlt).map(([category, color]) => (
                    <div key={category} className="flex items-start gap-3">
                      <div 
                        className="w-4 h-4 rounded-sm flex-shrink-0 mt-0.5" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs text-gray-700 leading-4">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}