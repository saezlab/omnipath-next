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
  interactionTypeColors
} from "@/utils/database-treemap-data";

export function DatabaseVoronoiTreemap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get processed data from utility
  const dbData = getAllDatabaseData();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Get container dimensions
    const containerWidth = containerRef.current.offsetWidth;
    const svgSize = Math.min(containerWidth, 800);
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const radius = (svgSize - margin.left - margin.right) / 2;
    
    // Transform data into hierarchical format
    const hierarchicalData: VoronoiNode = {
      name: "OmniPath",
      children: [
        dbData.interactions,
        dbData.enzymeSubstrate,
        dbData.complexes,
        dbData.annotations,
        dbData.intercellular
      ]
    };

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
    const hierarchy = d3.hierarchy(hierarchicalData)
      .sum(d => d.weight || 0);

    // Create voronoi treemap
    const _voronoiTreemap = voronoiTreemap()
      .clip(circlingPolygon);
    
    _voronoiTreemap(hierarchy);

    // Setup SVG
    const svg = d3.select(svgRef.current)
      .attr("width", svgSize)
      .attr("height", svgSize);

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

    // Font scale
    const fontScale = d3.scaleLinear()
      .domain([d3.min(leaves, d => d.value) || 0, d3.max(leaves, d => d.value) || 1])
      .range([8, 16])
      .clamp(true);

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
        return baseColor ? baseColor.darker(0.5 - sizeFactor) : d.parent.data.color;
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

    // Calculate polygon bounds for each cell
    const calculatePolygonBounds = (polygon: any) => {
      const xs = polygon.map((p: [number, number]) => p[0]);
      const ys = polygon.map((p: [number, number]) => p[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return {
        width: maxX - minX,
        height: maxY - minY
      };
    };

    // Draw labels
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
        const bounds = calculatePolygonBounds(d.polygon);
        const fontSize = fontScale(d.value);
        // Adjust font size to fit within cell
        return `${Math.min(fontSize, bounds.width / 8, bounds.height / 2)}px`;
      })
      .style("fill", "white")
      .style("font-weight", "600")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)")
      .style("pointer-events", "none")
      .text((d: any) => {
        const bounds = calculatePolygonBounds(d.polygon);
        const minDimension = Math.min(bounds.width, bounds.height);
        
        // Only show text if the cell is large enough
        if (minDimension < 20) return "";
        
        // Use shorter text for smaller cells
        if (minDimension < 40) {
          // Show first few letters
          return d.data.name.substring(0, 3);
        } else if (minDimension < 60) {
          // Show abbreviated code
          return d.data.code || d.data.name.substring(0, 6);
        } else {
          // Show full name if it fits
          const estimatedTextWidth = d.data.name.length * 6; // rough estimate
          return estimatedTextWidth < bounds.width * 0.8 ? d.data.name : d.data.code;
        }
      });

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
        let tooltip = `${d.data.name}\n${actualCount.toLocaleString()} records\nDatabase: ${d.parent.data.name}`;
        
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


  }, []);

  return (
    <div ref={containerRef} className="w-full space-y-6">
      {/* Treemap visualization */}
      <div className="flex justify-center">
        <svg ref={svgRef}></svg>
      </div>
      
      {/* Legend */}
      <div className="space-y-4">
        {/* Main databases legend */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Databases</h4>
          <div className="flex flex-wrap gap-4">
            {Object.entries(databaseColors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-sm border border-gray-300" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm text-gray-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Interaction types legend */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Interaction Types</h4>
          <div className="flex flex-wrap gap-4">
            {Object.entries(interactionTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-sm border border-gray-300" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm text-gray-600">
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}