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

    // Database colors
    const databaseColors = {
      Interactions: "#8884d8",
      "Enzyme-Substrate": "#82ca9d",
      Complexes: "#ffc658",
      Annotations: "#ff7c7c",
      Intercellular: "#8dd1e1"
    };

    // Transform data into hierarchical format
    const hierarchicalData: VoronoiNode = {
      name: "OmniPath",
      children: [
        {
          name: "Interactions",
          color: databaseColors.Interactions,
          children: dbStats.interactions.slice(0, 100).map(d => ({
            name: d.source,
            weight: Math.log10(d.record_count + 1), // Log scale for better visualization
            code: d.source.length > 15 ? d.source.substring(0, 12) + "..." : d.source
          }))
        },
        {
          name: "Enzyme-Substrate",
          color: databaseColors["Enzyme-Substrate"],
          children: dbStats.enzsub.slice(0, 50).map(d => ({
            name: d.source,
            weight: Math.log10(d.record_count + 1),
            code: d.source.length > 15 ? d.source.substring(0, 12) + "..." : d.source
          }))
        },
        {
          name: "Complexes",
          color: databaseColors.Complexes,
          children: dbStats.complexes.map(d => ({
            name: d.source,
            weight: Math.log10(d.record_count + 1),
            code: d.source.length > 15 ? d.source.substring(0, 12) + "..." : d.source
          }))
        },
        {
          name: "Annotations",
          color: databaseColors.Annotations,
          children: dbStats.annotations.slice(0, 50).map(d => ({
            name: d.source,
            weight: Math.log10(d.record_count + 1),
            code: d.source.length > 15 ? d.source.substring(0, 12) + "..." : d.source
          }))
        },
        {
          name: "Intercellular",
          color: databaseColors.Intercellular,
          children: dbStats.intercell.slice(0, 50).map(d => ({
            name: d.source,
            weight: Math.log10(d.record_count + 1),
            code: d.source.length > 15 ? d.source.substring(0, 12) + "..." : d.source
          }))
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
    const cells = g.append("g")
      .selectAll(".cell")
      .data(leaves)
      .enter()
      .append("path")
      .attr("class", "cell")
      .attr("d", (d: any) => `M${d.polygon.join(",")}z`)
      .style("fill", (d: any) => d.parent.data.color)
      .style("stroke", "white")
      .style("stroke-width", 1)
      .style("opacity", 0.8);

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
      .style("font-size", (d: any) => `${fontScale(d.value)}px`)
      .style("fill", "white")
      .style("font-weight", "500")
      .style("pointer-events", "none")
      .text((d: any) => {
        const totalInDb = d.parent.value;
        const percentage = (d.value / totalInDb) * 100;
        return percentage > 5 ? d.data.name : (percentage > 2 ? d.data.code : "");
      });

    // Add hover effects
    const hoverers = g.append("g")
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
      .on("mouseenter", function(event, d: any) {
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
        return `${d.data.name}\n${actualCount.toLocaleString()} records\nDatabase: ${d.parent.data.name}`;
      });

    // Draw database labels
    const databaseLabels = g.append("g")
      .selectAll(".db-label")
      .data(hierarchy.children || [])
      .enter()
      .append("text")
      .attr("class", "db-label")
      .attr("x", (d: any) => {
        const leaves = d.leaves();
        const avgX = leaves.reduce((sum: number, leaf: any) => sum + leaf.polygon.site.x, 0) / leaves.length;
        return avgX;
      })
      .attr("y", (d: any) => {
        const leaves = d.leaves();
        const avgY = leaves.reduce((sum: number, leaf: any) => sum + leaf.polygon.site.y, 0) / leaves.length;
        return avgY;
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("fill", "rgba(0,0,0,0.7)")
      .style("pointer-events", "none")
      .text((d: any) => d.data.name);

  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <svg ref={svgRef}></svg>
    </div>
  );
}