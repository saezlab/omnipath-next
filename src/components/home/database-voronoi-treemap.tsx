/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { voronoiTreemap } from "d3-voronoi-treemap";
import dbStats from "@/data/db-stats.json";

interface VoronoiNode {
  name: string;
  weight?: number;
  color?: string;
  children?: VoronoiNode[];
  code?: string;
}

// Database colors - using a scientifically inspired palette
const databaseColors = {
  Interactions: "#2E86AB",        // Ocean blue - for molecular interactions
  "Enzyme-Substrate": "#A23B72",  // Deep magenta - for enzymatic processes
  Complexes: "#F18F01",           // Amber orange - for protein complexes
  Annotations: "#C73E1D",         // Rust red - for functional annotations
  Intercellular: "#6A994E"        // Forest green - for cell communication
};

// Interaction type colors - blue-adjacent palette for clear distinction while maintaining cohesion
const interactionTypeColors = {
  "transcriptional": "#2E86AB",          // Main blue - core gene regulation (matches parent)
  "post_translational": "#4A5568",       // Slate gray-blue - protein modifications
  "mirna_transcriptional": "#7C3AED",    // Purple-blue - miRNA regulation
  "post_transcriptional": "#0891B2",     // Cyan-blue - RNA processing  
  "small_molecule_protein": "#059669"    // Teal-green - drug/chemical interactions
};

export function DatabaseVoronoiTreemap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Get container dimensions
    const containerWidth = containerRef.current.offsetWidth;
    const svgSize = Math.min(containerWidth, 800);
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const radius = (svgSize - margin.left - margin.right) / 2;

    // Function to clean source names by removing _word suffixes
    const cleanSourceName = (sourceName: string): string => {
      // Remove everything after underscore + word pattern
      const underscoreIndex = sourceName.indexOf('_');
      if (underscoreIndex > 0) {
        const beforeUnderscore = sourceName.substring(0, underscoreIndex);
        const afterUnderscore = sourceName.substring(underscoreIndex + 1);
        
        // Check if what comes after underscore looks like a word (contains letters)
        if (/^[A-Za-z]/.test(afterUnderscore)) {
          return beforeUnderscore;
        }
      }
      return sourceName;
    };

    // Function to process interaction types as subsections within Interactions
    const processInteractionTypes = () => {
      // Group interactions by type
      const typeGroups = new Map<string, any[]>();
      
      dbStats.interactionsSourceType.forEach(item => {
        let type = item.type;
        
        // Combine post_transcriptional and lncrna_post_transcriptional
        if (type === 'lncrna_post_transcriptional') {
          type = 'post_transcriptional';
        }
        
        if (!typeGroups.has(type)) {
          typeGroups.set(type, []);
        }
        typeGroups.get(type)!.push(item);
      });
      
      // Convert to children format for interaction subsections
      const interactionSubsections = [];
      const targetTypes = ['mirna_transcriptional', 'post_transcriptional', 'small_molecule_protein', 'transcriptional', 'post_translational'];
      
      for (const type of targetTypes) {
        const sources = typeGroups.get(type) || [];
        if (sources.length > 0) {
          // Sort by record count and take top sources
          const sortedSources = sources
            .sort((a, b) => b.record_count - a.record_count)
            .slice(0, type === 'post_translational' ? 40 : 20);
          
          interactionSubsections.push({
            name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            color: interactionTypeColors[type as keyof typeof interactionTypeColors],
            children: sortedSources.map(d => {
              const cleanedName = cleanSourceName(d.source);
              return {
                name: cleanedName,
                originalName: d.source,
                interactionType: type,
                weight: Math.log10(d.record_count + 1),
                code: cleanedName.length > 15 ? cleanedName.substring(0, 12) + "..." : cleanedName
              };
            })
          });
        }
      }
      
      return interactionSubsections;
    };

    // Transform data into hierarchical format
    const hierarchicalData: VoronoiNode = {
      name: "OmniPath",
      children: [
        {
          name: "Interactions",
          color: databaseColors.Interactions,
          children: processInteractionTypes()
        },
        {
          name: "Enzyme-Substrate",
          color: databaseColors["Enzyme-Substrate"],
          children: dbStats.enzsub.slice(0, 50).map(d => {
            const cleanedName = cleanSourceName(d.source);
            return {
              name: cleanedName,
              originalName: d.source,
              weight: Math.log10(d.record_count + 1),
              code: cleanedName.length > 15 ? cleanedName.substring(0, 12) + "..." : cleanedName
            };
          })
        },
        {
          name: "Complexes",
          color: databaseColors.Complexes,
          children: dbStats.complexes.map(d => {
            const cleanedName = cleanSourceName(d.source);
            return {
              name: cleanedName,
              originalName: d.source,
              weight: Math.log10(d.record_count + 1),
              code: cleanedName.length > 15 ? cleanedName.substring(0, 12) + "..." : cleanedName
            };
          })
        },
        {
          name: "Annotations",
          color: databaseColors.Annotations,
          children: dbStats.annotations.slice(0, 50).map(d => {
            const cleanedName = cleanSourceName(d.source);
            return {
              name: cleanedName,
              originalName: d.source,
              weight: Math.log10(d.record_count + 1),
              code: cleanedName.length > 15 ? cleanedName.substring(0, 12) + "..." : cleanedName
            };
          })
        },
        {
          name: "Intercellular",
          color: databaseColors.Intercellular,
          children: dbStats.intercell.slice(0, 50).map(d => {
            const cleanedName = cleanSourceName(d.source);
            return {
              name: cleanedName,
              originalName: d.source,
              weight: Math.log10(d.record_count + 1),
              code: cleanedName.length > 15 ? cleanedName.substring(0, 12) + "..." : cleanedName
            };
          })
        }
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