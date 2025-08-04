/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { voronoiTreemap } from "d3-voronoi-treemap";
import {
  VoronoiNode,
  getAllDatabaseData
} from "@/utils/database-treemap-data";

// RWTH Color Palette
const rwthColors = {
  // Main colors
  haverlockBlue: "rgb(23, 111, 193)",
  jordyBlue: "rgb(131, 167, 221)",
  yellowGreen: "rgb(166, 216, 28)",
  orange: "rgb(248, 157, 14)",
  yellow: "rgb(255, 242, 0)",
  maroon: "rgb(237, 7, 114)",
  atoll: "rgb(10, 97, 103)",
  darkCyan: "rgb(0, 170, 176)",
  forestGreen: "rgb(76, 189, 56)",
  tomato: "rgb(210, 32, 39)",
  hibiscus: "rgb(158, 22, 57)",
  blueMarguerite: "rgb(114, 100, 185)",
  seance: "rgb(91, 32, 95)",
  // Lighter variations
  lightSteelBlue: "rgb(191, 207, 238)",
  hotPink: "rgb(241, 67, 142)",
  goldenFizz: "rgb(255, 246, 64)",
  paradiso: "rgb(57, 125, 128)",
  mediumTurquoise: "rgb(64, 191, 188)",
  apple: "rgb(121, 205, 93)",
  conifer: "rgb(188, 225, 78)",
  mysin: "rgb(250, 178, 63)",
  firebrick: "rgb(219, 77, 65)",
  cabaret: "rgb(177, 64, 84)",
  eminence: "rgb(120, 67, 122)",
  lavender: "rgb(145, 130, 201)"
};

// Database colors using RWTH palette
const databaseColors = {
  Interactions: rwthColors.haverlockBlue,
  "Enzyme-Substrate": rwthColors.tomato,
  Complexes: rwthColors.forestGreen,
  Annotations: rwthColors.orange,
  Intercellular: rwthColors.seance
};

// Interaction type colors with distinct RWTH colors from full palette
const interactionTypeColors = {
  "transcriptional": rwthColors.haverlockBlue,    // Blue
  "post_translational": rwthColors.darkCyan,     // Dark Cyan (changed from forestGreen to avoid conflict with Complexes)
  "mirna_transcriptional": rwthColors.maroon,    // Pink/Red
  "post_transcriptional": rwthColors.orange,     // Orange
  "small_molecule_protein": rwthColors.seance    // Purple
};

// Annotation category colors with distinct RWTH colors
const annotationCategoryColors = {
  "Cell-cell communication": rwthColors.orange,
  "Localization (subcellular)": rwthColors.tomato,
  "Membrane localization & topology": rwthColors.hibiscus,
  "Extracellular matrix, adhesion": rwthColors.jordyBlue,
  "Vesicles, secretome": rwthColors.forestGreen,
  "Function, pathway": rwthColors.yellowGreen,
  "Signatures": rwthColors.atoll,
  "Disease, cancer": rwthColors.maroon,
  "Protein classes & families": rwthColors.blueMarguerite,
  "Cell type, tissue": rwthColors.darkCyan,
  "Transcription factors": rwthColors.yellow
};

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
  const margin = { top: 40, right: 20, bottom: 40, left: 20 };
  const radius = (Math.min(size - margin.left - margin.right, size - margin.top - margin.bottom)) / 2;
  
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
      // Get the appropriate color from our RWTH palette
      let baseColorString;
      
      // Check if this is an interaction type
      if (d.data.interactionType && interactionTypeColors[d.data.interactionType as keyof typeof interactionTypeColors]) {
        baseColorString = interactionTypeColors[d.data.interactionType as keyof typeof interactionTypeColors];
      }
      // Check if this is an annotation category (parent name is the category)
      else if (d.parent.data.name && annotationCategoryColors[d.parent.data.name as keyof typeof annotationCategoryColors]) {
        baseColorString = annotationCategoryColors[d.parent.data.name as keyof typeof annotationCategoryColors];
      }
      // Special handling for direct database children (Enzyme-Substrate, Complexes, Intercellular)
      else if (d.parent.data.name && databaseColors[d.parent.data.name as keyof typeof databaseColors]) {
        baseColorString = databaseColors[d.parent.data.name as keyof typeof databaseColors];
      }
      // Use database color as fallback for deeper hierarchies
      else {
        const dbName = d.parent.parent ? d.parent.parent.data.name : d.parent.data.name;
        baseColorString = databaseColors[dbName as keyof typeof databaseColors] || rwthColors.atoll; // fallback color
      }
      
      // Use consistent base colors without size-based variation
      return baseColorString;
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
    .style("pointer-events", "none")
    .text((d: any) => {
      const metrics = calculatePolygonMetrics(d.polygon);
      
      // Only show text if the cell has minimum area (increased threshold for article version)
      if (metrics.area < 1000) return "";
      
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
  
  const exportToSVG = () => {
    if (!svgRef1.current || !svgRef2.current) return;
    
    // Create a combined SVG containing both circles and legends
    const svgSize = Math.min(containerRef.current?.offsetWidth || 600 * 0.6, 600);
    const legendWidth = 280;
    const gap = 10;
    const combinedWidth = svgSize + legendWidth + 40; // Circle + legend + padding
    const combinedHeight = svgSize * 2 + gap; // Two circles stacked + gap
    
    // Create new SVG element
    const combinedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    combinedSvg.setAttribute("width", combinedWidth.toString());
    combinedSvg.setAttribute("height", combinedHeight.toString());
    combinedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Add style element for font
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
      text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      }
    `;
    combinedSvg.appendChild(style);
    
    
    // Clone and position first SVG
    const svg1Clone = svgRef1.current.cloneNode(true) as SVGSVGElement;
    const g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g1.setAttribute("transform", "translate(0, 0)");
    while (svg1Clone.firstChild) {
      g1.appendChild(svg1Clone.firstChild);
    }
    combinedSvg.appendChild(g1);
    
    // Add first legend
    const legend1Height = Object.keys(annotationCategoryColors).length * 20 + 75;
    const legend1YOffset = (svgSize - legend1Height) / 2; // Center vertically
    const legend1Group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    legend1Group.setAttribute("transform", `translate(${svgSize + 12}, ${legend1YOffset})`);
    
    // Legend background (no border)
    const legend1Bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    legend1Bg.setAttribute("width", "264");
    legend1Bg.setAttribute("height", legend1Height.toString());
    legend1Bg.setAttribute("fill", "transparent");
    legend1Group.appendChild(legend1Bg);
    
    // Annotations header with white square
    let yOffset = 16;
    const annotSquare = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    annotSquare.setAttribute("x", "8");
    annotSquare.setAttribute("y", (yOffset - 10).toString());
    annotSquare.setAttribute("width", "16");
    annotSquare.setAttribute("height", "16");
    annotSquare.setAttribute("fill", "white");
    annotSquare.setAttribute("stroke", "#d1d5db");
    annotSquare.setAttribute("stroke-width", "1");
    annotSquare.setAttribute("rx", "2");
    legend1Group.appendChild(annotSquare);
    
    const annotHeader = document.createElementNS("http://www.w3.org/2000/svg", "text");
    annotHeader.setAttribute("x", "32");
    annotHeader.setAttribute("y", yOffset.toString());
    annotHeader.setAttribute("font-size", "14");
    annotHeader.setAttribute("font-weight", "600");
    annotHeader.setAttribute("fill", "#374151");
    annotHeader.textContent = "Annotations";
    legend1Group.appendChild(annotHeader);
    
    // Annotation categories
    yOffset += 20;
    Object.entries(annotationCategoryColors).forEach(([category, color]) => {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", "24");
      rect.setAttribute("y", (yOffset - 9).toString());
      rect.setAttribute("width", "12");
      rect.setAttribute("height", "12");
      rect.setAttribute("fill", color);
      rect.setAttribute("stroke", "#d1d5db");
      rect.setAttribute("stroke-width", "1");
      rect.setAttribute("rx", "2");
      legend1Group.appendChild(rect);
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "40");
      text.setAttribute("y", (yOffset + 1).toString());
      text.setAttribute("font-size", "14");
      text.setAttribute("fill", "#4b5563");
      text.setAttribute("line-height", "1.25");
      text.textContent = category;
      legend1Group.appendChild(text);
      
      yOffset += 20;
    });
    
    // Intercellular
    yOffset += 16;
    const intercellularRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    intercellularRect.setAttribute("x", "8");
    intercellularRect.setAttribute("y", (yOffset - 10).toString());
    intercellularRect.setAttribute("width", "16");
    intercellularRect.setAttribute("height", "16");
    intercellularRect.setAttribute("fill", databaseColors["Intercellular"]);
    intercellularRect.setAttribute("stroke", "#d1d5db");
    intercellularRect.setAttribute("stroke-width", "1");
    intercellularRect.setAttribute("rx", "2");
    legend1Group.appendChild(intercellularRect);
    
    const intercellularText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    intercellularText.setAttribute("x", "32");
    intercellularText.setAttribute("y", (yOffset + 2).toString());
    intercellularText.setAttribute("font-size", "14");
    intercellularText.setAttribute("font-weight", "600");
    intercellularText.setAttribute("fill", "#374151");
    intercellularText.textContent = "Intercellular";
    legend1Group.appendChild(intercellularText);
    
    combinedSvg.appendChild(legend1Group);
    
    // Clone and position second SVG (below the first one)
    const svg2Clone = svgRef2.current.cloneNode(true) as SVGSVGElement;
    const g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g2.setAttribute("transform", `translate(0, ${svgSize + gap})`);
    while (svg2Clone.firstChild) {
      g2.appendChild(svg2Clone.firstChild);
    }
    combinedSvg.appendChild(g2);
    
    // Add second legend
    const legend2Height = Object.keys(interactionTypeColors).length * 20 + 110;
    const legend2YOffset = svgSize + gap + (svgSize - legend2Height) / 2; // Center vertically
    const legend2Group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    legend2Group.setAttribute("transform", `translate(${svgSize + 12}, ${legend2YOffset})`);
    
    // Legend background (no border)
    const legend2Bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    legend2Bg.setAttribute("width", "264");
    legend2Bg.setAttribute("height", legend2Height.toString());
    legend2Bg.setAttribute("fill", "transparent");
    legend2Group.appendChild(legend2Bg);
    
    // Interactions header with white square
    yOffset = 16;
    const interSquare = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    interSquare.setAttribute("x", "8");
    interSquare.setAttribute("y", (yOffset - 10).toString());
    interSquare.setAttribute("width", "16");
    interSquare.setAttribute("height", "16");
    interSquare.setAttribute("fill", "white");
    interSquare.setAttribute("stroke", "#d1d5db");
    interSquare.setAttribute("stroke-width", "1");
    interSquare.setAttribute("rx", "2");
    legend2Group.appendChild(interSquare);
    
    const interHeader = document.createElementNS("http://www.w3.org/2000/svg", "text");
    interHeader.setAttribute("x", "32");
    interHeader.setAttribute("y", yOffset.toString());
    interHeader.setAttribute("font-size", "14");
    interHeader.setAttribute("font-weight", "600");
    interHeader.setAttribute("fill", "#374151");
    interHeader.textContent = "Interactions";
    legend2Group.appendChild(interHeader);
    
    // Interaction types
    yOffset += 20;
    Object.entries(interactionTypeColors).forEach(([type, color]) => {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", "24");
      rect.setAttribute("y", (yOffset - 9).toString());
      rect.setAttribute("width", "12");
      rect.setAttribute("height", "12");
      rect.setAttribute("fill", color);
      rect.setAttribute("stroke", "#d1d5db");
      rect.setAttribute("stroke-width", "1");
      rect.setAttribute("rx", "2");
      legend2Group.appendChild(rect);
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "40");
      text.setAttribute("y", (yOffset + 1).toString());
      text.setAttribute("font-size", "14");
      text.setAttribute("fill", "#4b5563");
      text.setAttribute("line-height", "1.25");
      text.textContent = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      legend2Group.appendChild(text);
      
      yOffset += 20;
    });
    
    // Enzyme-Substrate
    yOffset += 16;
    const enzymeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    enzymeRect.setAttribute("x", "8");
    enzymeRect.setAttribute("y", (yOffset - 10).toString());
    enzymeRect.setAttribute("width", "16");
    enzymeRect.setAttribute("height", "16");
    enzymeRect.setAttribute("fill", databaseColors["Enzyme-Substrate"]);
    enzymeRect.setAttribute("stroke", "#d1d5db");
    enzymeRect.setAttribute("stroke-width", "1");
    enzymeRect.setAttribute("rx", "2");
    legend2Group.appendChild(enzymeRect);
    
    const enzymeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    enzymeText.setAttribute("x", "32");
    enzymeText.setAttribute("y", (yOffset + 2).toString());
    enzymeText.setAttribute("font-size", "14");
    enzymeText.setAttribute("font-weight", "600");
    enzymeText.setAttribute("fill", "#374151");
    enzymeText.textContent = "Enzyme-Substrate";
    legend2Group.appendChild(enzymeText);
    
    // Complexes
    yOffset += 20;
    const complexRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    complexRect.setAttribute("x", "8");
    complexRect.setAttribute("y", (yOffset - 10).toString());
    complexRect.setAttribute("width", "16");
    complexRect.setAttribute("height", "16");
    complexRect.setAttribute("fill", databaseColors["Complexes"]);
    complexRect.setAttribute("stroke", "#d1d5db");
    complexRect.setAttribute("stroke-width", "1");
    complexRect.setAttribute("rx", "2");
    legend2Group.appendChild(complexRect);
    
    const complexText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    complexText.setAttribute("x", "32");
    complexText.setAttribute("y", (yOffset + 2).toString());
    complexText.setAttribute("font-size", "14");
    complexText.setAttribute("font-weight", "600");
    complexText.setAttribute("fill", "#374151");
    complexText.textContent = "Complexes";
    legend2Group.appendChild(complexText);
    
    combinedSvg.appendChild(legend2Group);
    
    // Convert to string and download
    const svgString = new XMLSerializer().serializeToString(combinedSvg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "database-resources-treemap.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Get processed data with linear weights
  const dbData = processDataWithLinearWeights();

  useEffect(() => {
    if (!svgRef1.current || !svgRef2.current || !containerRef.current) return;

    // Clear previous content
    d3.select(svgRef1.current).selectAll("*").remove();
    d3.select(svgRef2.current).selectAll("*").remove();

    // Get container dimensions
    const containerWidth = containerRef.current.offsetWidth;
    const svgSize = Math.min(containerWidth * 0.6, 600);
    
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

    createCircleVisualization(svg1, annotationsIntercellularData, svgSize, "");
    createCircleVisualization(svg2, interactionsData, svgSize, "");

  }, [databaseColors, interactionTypeColors, annotationCategoryColors]);

  return (
    <div ref={containerRef} className="w-full space-y-1">
      {/* Title and Export Button */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-4 mb-1">
          <h3 className="text-lg font-semibold text-gray-800">Database Resources (Linear Scale)</h3>
          <button
            onClick={exportToSVG}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors duration-200 flex items-center gap-1"
            title="Export as SVG"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export SVG
          </button>
        </div>
        <p className="text-sm text-gray-600">Cell sizes are proportional to record counts</p>
      </div>
      
      {/* First circle with legend */}
      <div className="flex items-center justify-center gap-3 max-w-6xl mx-auto">
        <div className="flex-shrink-0">
          <svg ref={svgRef1}></svg>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-white rounded-lg p-2 w-64">
            <div className="space-y-3">
              {/* Annotations with categories */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: "white" }}
                  ></div>
                  <span className="text-sm font-semibold text-gray-700">Annotations</span>
                </div>
                {/* Annotation categories indented */}
                <div className="ml-6 space-y-1">
                  {Object.entries(annotationCategoryColors).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm text-gray-600 leading-tight">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Intercellular */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: databaseColors["Intercellular"] }}
                  ></div>
                  <span className="text-sm font-semibold text-gray-700">Intercellular</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Second circle with legend */}
      <div className="flex items-center justify-center gap-3 max-w-6xl mx-auto">
        <div className="flex-shrink-0">
          <svg ref={svgRef2}></svg>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-white rounded-lg p-2 w-64">
            <div className="space-y-3">
              {/* Interactions with types */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: "white" }}
                  ></div>
                  <span className="text-sm font-semibold text-gray-700">Interactions</span>
                </div>
                {/* Interaction types indented */}
                <div className="ml-6 space-y-1">
                  {Object.entries(interactionTypeColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm text-gray-600 leading-tight">
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
                    className="w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: databaseColors["Enzyme-Substrate"] }}
                  ></div>
                  <span className="text-sm font-semibold text-gray-700">Enzyme-Substrate</span>
                </div>
              </div>
              
              {/* Complexes */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0" 
                    style={{ backgroundColor: databaseColors["Complexes"] }}
                  ></div>
                  <span className="text-sm font-semibold text-gray-700">Complexes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}