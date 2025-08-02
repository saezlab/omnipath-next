/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { voronoiTreemap } from "d3-voronoi-treemap";
import {
  VoronoiNode,
  getAllDatabaseData,
  databaseColors,
  interactionTypeColors,
  annotationCategoryColors
} from "@/utils/database-treemap-data";

// Process data with linear weights
function processDataWithLinearWeights() {
  const dbData = getAllDatabaseData();
  
  // Function to update weights to linear scale
  const updateWeights = (node: VoronoiNode) => {
    if (node.children) {
      node.children.forEach(child => {
        updateWeights(child);
      });
    } else if (node.weight) {
      // Convert from log scale to linear
      const actualCount = Math.round(Math.pow(10, node.weight) - 1);
      node.weight = actualCount;
    }
  };
  
  // Update all weights to linear scale
  Object.values(dbData).forEach(category => {
    updateWeights(category);
  });
  
  return dbData;
}

// Create a single circle visualization
function createCircleVisualization(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: VoronoiNode,
  size: number,
  title: string
) {
  const margin = { top: 40, right: 20, bottom: 20, left: 20 };
  const radius = (size - margin.left - margin.right) / 2;
  
  // Create circling polygon
  const _2PI = 2 * Math.PI;
  const circlingPolygon: [number, number][] = [];
  const points = 60;
  const increment = _2PI / points;
  
  for (let a = 0, i = 0; i < points; i++, a += increment) {
    circlingPolygon.push([
      radius + radius * Math.cos(a),
      radius + radius * Math.sin(a)
    ]);
  }

  // Create hierarchy
  const hierarchy = d3.hierarchy(data)
    .sum(d => d.weight || 0);

  // Create voronoi treemap
  const _voronoiTreemap = voronoiTreemap()
    .clip(circlingPolygon);
  
  _voronoiTreemap(hierarchy);

  // Setup SVG group
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Draw background circle
  g.append("circle")
    .attr("cx", radius)
    .attr("cy", radius)
    .attr("r", radius)
    .attr("fill", "#f8f9fa")
    .attr("stroke", "#e9ecef")
    .attr("stroke-width", 2);

  // Get all leaf nodes
  const leaves = hierarchy.leaves();

  // Calculate polygon area and dimensions
  const calculatePolygonMetrics = (polygon: any) => {
    const xs = polygon.map((p: [number, number]) => p[0]);
    const ys = polygon.map((p: [number, number]) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // Calculate area using shoelace formula
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      area += polygon[i][0] * polygon[j][1];
      area -= polygon[j][0] * polygon[i][1];
    }
    area = Math.abs(area) / 2;
    
    return {
      width: maxX - minX,
      height: maxY - minY,
      area: area,
      minDimension: Math.min(maxX - minX, maxY - minY)
    };
  };

  // Draw cells
  g.append("g")
    .selectAll(".cell")
    .data(leaves)
    .enter()
    .append("path")
    .attr("class", "cell")
    .attr("d", (d: any) => `M${d.polygon.join(",")}z`)
    .style("fill", (d: any) => {
      // Slightly vary the color based on size for better visual distinction
      const baseColor = d3.color(d.parent.data.color);
      const sizeFactor = d.value / d.parent.value;
      return baseColor ? baseColor.darker(0.5 - sizeFactor * 0.7) : d.parent.data.color;
    })
    .style("stroke", "white")
    .style("stroke-width", 1.5)
    .style("opacity", 0.9);

  // Draw thicker borders for main category boundaries
  const mainCategoryNodes = hierarchy.children || [];
  g.append("g")
    .selectAll(".main-category-border")
    .data(mainCategoryNodes)
    .enter()
    .append("path")
    .attr("class", "main-category-border")
    .attr("d", (d: any) => `M${d.polygon.join(",")}z`)
    .style("fill", "none")
    .style("stroke", "white")
    .style("stroke-width", 5)
    .style("pointer-events", "none");

  // Draw labels with smart sizing
  const labels = g.append("g")
    .selectAll(".label")
    .data(leaves)
    .enter()
    .append("g")
    .attr("class", "label")
    .attr("transform", (d: any) => `translate(${d.polygon.site.x},${d.polygon.site.y})`);

  labels.append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", (d: any) => {
      const metrics = calculatePolygonMetrics(d.polygon);
      // Base font size on area, but cap it
      const baseFontSize = Math.sqrt(metrics.area) / 6;
      return `${Math.min(baseFontSize, 14, metrics.minDimension / 3)}px`;
    })
    .style("fill", "white")
    .style("font-weight", "600")
    .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)")
    .style("pointer-events", "none")
    .text((d: any) => {
      const metrics = calculatePolygonMetrics(d.polygon);
      
      // Only show text if the cell has minimum area
      if (metrics.area < 100) return "";
      
      // Use shorter text for smaller cells
      if (metrics.area < 400) {
        // Show initials or first few letters
        return d.data.name.substring(0, 3);
      } else if (metrics.area < 1000) {
        // Show abbreviated code
        return d.data.code || d.data.name.substring(0, 6);
      } else {
        // Show full name if it fits
        const estimatedTextWidth = d.data.name.length * 7; // rough estimate
        return estimatedTextWidth < metrics.width * 0.8 ? d.data.name : d.data.code;
      }
    });

  // Add title
  svg.append("text")
    .attr("x", size / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "600")
    .style("fill", "#374151")
    .text(title);

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
      let tooltip = `${d.data.name}\n${d.value.toLocaleString()} records\nDatabase: ${d.parent.data.name}`;
      
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
}

export function DatabaseVoronoiTreemapTwoCircles() {
  const svgRef1 = useRef<SVGSVGElement>(null);
  const svgRef2 = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get processed data with linear weights
  const dbData = processDataWithLinearWeights();

  useEffect(() => {
    if (!svgRef1.current || !svgRef2.current || !containerRef.current) return;

    // Clear previous content
    d3.select(svgRef1.current).selectAll("*").remove();
    d3.select(svgRef2.current).selectAll("*").remove();

    // Get container dimensions
    const containerWidth = containerRef.current.offsetWidth;
    const svgSize = Math.min(containerWidth * 0.5, 500);
    
    // Setup SVGs
    const svg1 = d3.select(svgRef1.current)
      .attr("width", svgSize)
      .attr("height", svgSize);
      
    const svg2 = d3.select(svgRef2.current)
      .attr("width", svgSize)
      .attr("height", svgSize);

    // Create first circle: Annotations & Intercellular
    const annotationsIntercellularData: VoronoiNode = {
      name: "Annotations & Intercellular",
      children: [
        dbData.annotations,
        dbData.intercellular
      ]
    };

    // Create second circle: Interactions, Enzyme-Substrate & Complexes
    const interactionsData: VoronoiNode = {
      name: "Molecular Interactions",
      children: [
        dbData.interactions,
        dbData.enzymeSubstrate,
        dbData.complexes
      ]
    };

    createCircleVisualization(svg1, annotationsIntercellularData, svgSize, "Annotations & Intercellular");
    createCircleVisualization(svg2, interactionsData, svgSize, "Interactions, Enzymes & Complexes");

  }, []);

  return (
    <div ref={containerRef} className="w-full space-y-4">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">Database Resources (Linear Scale)</h3>
        <p className="text-sm text-gray-600 mt-1">Cell sizes are proportional to record counts</p>
      </div>
      
      {/* First circle with legend */}
      <div className="flex items-center justify-center gap-6 max-w-5xl mx-auto">
        <div className="flex-shrink-0">
          <svg ref={svgRef1}></svg>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-gray-50 rounded-lg p-3 w-80">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Annotations & Intercellular</h4>
            <div className="space-y-2">
              {/* Annotations with categories */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: databaseColors["Annotations"] }}
                  ></div>
                  <span className="text-xs font-semibold text-gray-700">Annotations</span>
                </div>
                {/* Annotation categories indented */}
                <div className="ml-5 space-y-0.5">
                  {Object.entries(annotationCategoryColors).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-sm border border-gray-300 flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs text-gray-600 leading-tight">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Intercellular */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: databaseColors["Intercellular"] }}
                  ></div>
                  <span className="text-xs font-semibold text-gray-700">Intercellular</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Second circle with legend */}
      <div className="flex items-center justify-center gap-6 max-w-5xl mx-auto">
        <div className="flex-shrink-0">
          <svg ref={svgRef2}></svg>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-gray-50 rounded-lg p-3 w-80">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Molecular Interactions</h4>
            <div className="space-y-2">
              {/* Interactions with types */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: databaseColors["Interactions"] }}
                  ></div>
                  <span className="text-xs font-semibold text-gray-700">Interactions</span>
                </div>
                {/* Interaction types indented */}
                <div className="ml-5 space-y-0.5">
                  {Object.entries(interactionTypeColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-sm border border-gray-300 flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-xs text-gray-600 leading-tight">
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Enzyme-Substrate */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: databaseColors["Enzyme-Substrate"] }}
                  ></div>
                  <span className="text-xs font-semibold text-gray-700">Enzyme-Substrate</span>
                </div>
              </div>
              
              {/* Complexes */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: databaseColors["Complexes"] }}
                  ></div>
                  <span className="text-xs font-semibold text-gray-700">Complexes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}