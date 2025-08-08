/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { voronoiTreemap } from "d3-voronoi-treemap";
import {
  VoronoiNode,
  getAllDatabaseData,
  calculateTreemapSizes,
  interactionTypeColors,
  annotationCategoryColors
} from "@/utils/database-data";

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

  // Create circular clipping polygon
  const centerX = actualWidth / 2;
  const centerY = actualHeight / 2;
  const radius = Math.min(actualWidth, actualHeight) / 2 - 5; // Small margin
  
  // Generate points for a circle
  const numPoints = 60; // More points for smoother circle
  const circularPolygon: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    circularPolygon.push([x, y]);
  }

  // Create hierarchy
  const hierarchy = d3.hierarchy(data)
    .sum(d => d.weight || 0);

  // Create voronoi treemap
  const _voronoiTreemap = voronoiTreemap()
    .clip(circularPolygon);
  
  _voronoiTreemap(hierarchy);

  // Draw background circle
  g.append("circle")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("r", radius)
    .attr("fill", "#f5f5f5")
    .attr("stroke", "#e0e0e0")
    .attr("stroke-width", 1);

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
      // Use the parent's color directly for better distinction
      if (d.parent?.data.color) {
        return d.parent.data.color;
      }
      return "#ccc";
    })
    .style("stroke", "#fff")
    .style("stroke-width", 0.5)
    .style("opacity", 0.9);

  // Draw thicker borders for subcategory boundaries (depth 1 nodes with children)
  const subcategoryNodes = hierarchy.descendants().filter(d => d.children && d.depth === 1);
  g.append("g")
    .selectAll(".subcategory-border")
    .data(subcategoryNodes)
    .enter()
    .append("path")
    .attr("class", "subcategory-border")
    .attr("d", (d: any) => `M${d.polygon.join(",")}z`)
    .style("fill", "none")
    .style("stroke", "#fff")
    .style("stroke-width", 2)
    .style("pointer-events", "none");

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

export function DatabasePrintTreemaps() {
  const interactionsRef = useRef<SVGSVGElement>(null);
  const enzymeSubstrateRef = useRef<SVGSVGElement>(null);
  const complexesRef = useRef<SVGSVGElement>(null);
  const annotationsRef = useRef<SVGSVGElement>(null);
  const intercellularRef = useRef<SVGSVGElement>(null);

  const sizes = calculateTreemapSizes();
  const dbData = getAllDatabaseData();

  useEffect(() => {
    // Create individual treemaps
    if (interactionsRef.current) {
      createTreemap(interactionsRef.current, dbData.interactions, sizes.interactions, sizes.interactions);
    }

    if (enzymeSubstrateRef.current) {
      createTreemap(enzymeSubstrateRef.current, dbData.enzymeSubstrate, sizes.enzymeSubstrate, sizes.enzymeSubstrate);
    }

    if (complexesRef.current) {
      createTreemap(complexesRef.current, dbData.complexes, sizes.complexes, sizes.complexes);
    }

    if (annotationsRef.current) {
      createTreemap(annotationsRef.current, dbData.annotations, sizes.annotations, sizes.annotations);
    }

    if (intercellularRef.current) {
      createTreemap(intercellularRef.current, dbData.intercellular, sizes.intercellular, sizes.intercellular);
    }
  }, []);

  return (
    <div className="w-full py-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: "Arial, sans-serif" }}>
        OmniPath Database Contents
      </h2>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-4 justify-center">
          {/* Left side - smaller databases */}
          <div className="flex flex-wrap gap-3 justify-end items-center" style={{ width: "250px" }}>
            <div style={{ width: `${sizes.intercellular}px`, height: `${sizes.intercellular}px` }}>
              <svg ref={intercellularRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
            
            <div style={{ width: `${sizes.complexes}px`, height: `${sizes.complexes}px` }}>
              <svg ref={complexesRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
            
            <div style={{ width: `${sizes.enzymeSubstrate}px`, height: `${sizes.enzymeSubstrate}px` }}>
              <svg ref={enzymeSubstrateRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
          </div>

          {/* Center - main databases aligned with their legends */}
          <div className="flex flex-col gap-4">
            {/* Interactions row */}
            <div className="flex items-center gap-4">
              <div style={{ width: `${sizes.interactions}px`, height: `${sizes.interactions}px` }}>
                <svg ref={interactionsRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
              </div>
              <div style={{ width: "280px" }}>
                <h4 className="font-bold mb-3 text-base text-gray-800">Interaction Types</h4>
                <div className="space-y-2">
                  {Object.entries(interactionTypeColors).map(([type, color]) => (
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

            {/* Annotations row */}
            <div className="flex items-center gap-4">
              <div style={{ width: `${sizes.annotations}px`, height: `${sizes.annotations}px` }}>
                <svg ref={annotationsRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
              </div>
              <div style={{ width: "280px" }}>
                <h4 className="font-bold mb-3 text-base text-gray-800">Annotation Categories</h4>
                <div className="space-y-1.5">
                  {Object.entries(annotationCategoryColors).map(([category, color]) => (
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