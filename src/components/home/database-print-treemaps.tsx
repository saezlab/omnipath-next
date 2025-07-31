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
  category?: string;
  originalName?: string;
  interactionType?: string;
}

// IBM colorblind-friendly palette
const databaseColors = {
  Interactions: "#1192e8",      // IBM Blue 60
  "Enzyme-Substrate": "#da1e28", // IBM Red 60
  Complexes: "#198038",          // IBM Green 60
  Annotations: "#ff832b",        // IBM Orange 50
  Intercellular: "#8a3ffc"       // IBM Purple 60
};

// IBM colorblind-friendly interaction type colors
const interactionTypeColors = {
  "transcriptional": "#0f62fe",      // IBM Blue 60
  "post_translational": "#1192e8",   // IBM Blue 50
  "mirna_transcriptional": "#4589ff", // IBM Blue 40
  "post_transcriptional": "#78a9ff",  // IBM Blue 30
  "small_molecule_protein": "#a6c8ff" // IBM Blue 20
};

// IBM colorblind-friendly annotation category colors
const annotationCategoryColors = {
  "Cell-cell communication": "#da1e28",    // IBM Red 60
  "Localization (subcellular)": "#fa4d56", // IBM Red 50
  "Membrane localization & topology": "#ff832b", // IBM Orange 50
  "Extracellular matrix, adhesion": "#ffb000",   // IBM Gold 40
  "Vesicles, secretome": "#f1c21b",       // IBM Yellow 30
  "Function, pathway": "#198038",         // IBM Green 60
  "Signatures": "#24a148",               // IBM Green 50
  "Disease, cancer": "#1192e8",          // IBM Blue 50
  "Protein classes & families": "#0f62fe", // IBM Blue 60
  "Cell type, tissue": "#8a3ffc",        // IBM Purple 60
  "Transcription factors": "#d12771"     // IBM Magenta 60
};

// Source groups from filter sidebar
const ANNOTATION_SOURCE_GROUPS = {
  "Cell-cell communication": ["Baccin2019", "CellCall", "CellCellInteractions", "CellChatDB", "CellChatDB_complex", "Cellinker", "Cellinker_complex", "CellPhoneDB", "CellPhoneDB_complex", "CellTalkDB", "connectomeDB2020", "EMBRACE", "Guide2Pharma", "iTALK", "HPMR", "ICELLNET", "ICELLNET_complex", "Kirouac2010", "LRdb", "Ramilowski2015", "scConnect", "scConnect_complex", "SignaLink_function", "Surfaceome", "talklr"],
  "Localization (subcellular)": ["ComPPI", "Exocarta", "HPA_subcellular", "HPA_secretome", "HumanCellMap", "LOCATE", "Ramilowski_location", "UniProt_location", "Vesiclepedia", "Wang"],
  "Membrane localization & topology": ["Almen2009", "CellPhoneDB", "CSPA", "LOCATE", "Membranome", "OPM", "Phobius", "Ramilowski_location", "TopDB", "UniProt_topology"],
  "Extracellular matrix, adhesion": ["Matrisome", "MatrixDB", "Integrins", "MCAM", "Zhong2015"],
  "Vesicles, secretome": ["Almen2009", "Exocarta", "Vesiclepedia"],
  "Function, pathway": ["CellChatDB", "GO_Intercell", "KEGG", "KEGG-PC", "NetPath", "SignaLink_pathway", "SignaLink_function", "CORUM_Funcat", "CORUM_GO", "SIGNOR", "PROGENy", "MSigDB", "UniProt_keyword", "Wang"],
  "Signatures": ["CytoSig", "PanglaoDB", "PROGENy"],
  "Disease, cancer": ["DisGeNet", "CancerGeneCensus", "IntOGen", "CancerSEA", "CancerDrugsDB", "DGIdb", "CPAD"],
  "Protein classes & families": ["Adhesome", "DGIdb", "UniProt_family", "GPCRdb", "HPMR", "kinase.com", "Phosphatome", "TFcensus", "TCDB", "InterPro", "HGNC", "OPM"],
  "Cell type, tissue": ["HPA_tissue", "CSPA_celltype", "CellTypist", "UniProt_tissue", "EMBRACE"],
  "Transcription factors": ["Lambert2018", "TFcensus"]
};

// Create a map for quick lookup
const sourceToCategory = new Map<string, string>();
Object.entries(ANNOTATION_SOURCE_GROUPS).forEach(([category, sources]) => {
  sources.forEach(source => {
    sourceToCategory.set(source.toLowerCase(), category);
  });
});

function cleanSourceName(sourceName: string): string {
  const underscoreIndex = sourceName.indexOf('_');
  if (underscoreIndex > 0) {
    const beforeUnderscore = sourceName.substring(0, underscoreIndex);
    const afterUnderscore = sourceName.substring(underscoreIndex + 1);
    if (/^[A-Za-z]/.test(afterUnderscore)) {
      return beforeUnderscore;
    }
  }
  return sourceName;
}

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

export function DatabasePrintTreemaps() {
  const interactionsRef = useRef<SVGSVGElement>(null);
  const enzymeSubstrateRef = useRef<SVGSVGElement>(null);
  const complexesRef = useRef<SVGSVGElement>(null);
  const annotationsRef = useRef<SVGSVGElement>(null);
  const intercellularRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Calculate sizes to ensure equal column widths and matching heights
    const columnWidth = 320; // Increased from 280
    const totalHeight = 700; // Increased from 600
    
    // Column 1: 3 square treemaps
    const col1TreemapSize = totalHeight / 3; // ~233x233 each
    
    // Column 2: 2 treemaps that are 1.5x the size
    const col2TreemapSize = totalHeight / 2; // 350x350 each

    // Process interaction types
    const processInteractionTypes = () => {
      const typeGroups = new Map<string, any[]>();
      
      dbStats.interactionsSourceType.forEach(item => {
        let type = item.type;
        if (type === 'lncrna_post_transcriptional') {
          type = 'post_transcriptional';
        }
        
        if (!typeGroups.has(type)) {
          typeGroups.set(type, []);
        }
        typeGroups.get(type)!.push(item);
      });
      
      const interactionSubsections = [];
      const targetTypes = ['transcriptional', 'post_translational', 'mirna_transcriptional', 'post_transcriptional', 'small_molecule_protein'];
      
      for (const type of targetTypes) {
        const sources = typeGroups.get(type) || [];
        if (sources.length > 0) {
          const sortedSources = sources
            .sort((a, b) => b.record_count - a.record_count);
          
          interactionSubsections.push({
            name: type === 'mirna_transcriptional' ? 'miRNA Transcriptional' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            color: interactionTypeColors[type as keyof typeof interactionTypeColors],
            children: sortedSources.map(d => {
              const cleanedName = cleanSourceName(d.source);
              return {
                name: cleanedName,
                originalName: d.source,
                interactionType: type,
                weight: Math.log10(d.record_count + 1),
                code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
              };
            })
          });
        }
      }
      
      return interactionSubsections;
    };

    // Process annotations by category
    const processAnnotationsByCategory = () => {
      const categoryGroups = new Map<string, any[]>();
      
      dbStats.annotations.forEach(item => {
        const category = sourceToCategory.get(item.source.toLowerCase()) || "Other";
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, []);
        }
        categoryGroups.get(category)!.push(item);
      });
      
      const annotationSubsections = [];
      
      for (const [category, sources] of categoryGroups.entries()) {
        if (sources.length > 0 && category !== "Other") {
          const sortedSources = sources
            .sort((a, b) => b.record_count - a.record_count);
          
          annotationSubsections.push({
            name: category,
            color: annotationCategoryColors[category as keyof typeof annotationCategoryColors] || "#999",
            children: sortedSources.map(d => {
              const cleanedName = cleanSourceName(d.source);
              return {
                name: cleanedName,
                originalName: d.source,
                weight: Math.log10(d.record_count + 1),
                code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
              };
            })
          });
        }
      }
      
      return annotationSubsections.sort((a, b) => 
        b.children.reduce((sum, c) => sum + c.weight, 0) - 
        a.children.reduce((sum, c) => sum + c.weight, 0)
      );
    };

    // Create individual treemaps
    if (interactionsRef.current) {
      const interactionsData: VoronoiNode = {
        name: "Interactions",
        color: databaseColors.Interactions,
        children: processInteractionTypes()
      };
      createTreemap(interactionsRef.current, interactionsData, columnWidth, col2TreemapSize);
    }

    if (enzymeSubstrateRef.current) {
      const enzymeSubstrateData: VoronoiNode = {
        name: "Enzyme-Substrate",
        color: databaseColors["Enzyme-Substrate"],
        children: dbStats.enzsub.map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            originalName: d.source,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      };
      createTreemap(enzymeSubstrateRef.current, enzymeSubstrateData, columnWidth, col1TreemapSize);
    }

    if (complexesRef.current) {
      const complexesData: VoronoiNode = {
        name: "Complexes",
        color: databaseColors.Complexes,
        children: dbStats.complexes.map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            originalName: d.source,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      };
      createTreemap(complexesRef.current, complexesData, columnWidth, col1TreemapSize);
    }

    if (annotationsRef.current) {
      const annotationsData: VoronoiNode = {
        name: "Annotations",
        color: databaseColors.Annotations,
        children: processAnnotationsByCategory()
      };
      createTreemap(annotationsRef.current, annotationsData, columnWidth, col2TreemapSize);
    }

    if (intercellularRef.current) {
      const intercellularData: VoronoiNode = {
        name: "Intercellular",
        color: databaseColors.Intercellular,
        children: dbStats.intercell.map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            originalName: d.source,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      };
      createTreemap(intercellularRef.current, intercellularData, columnWidth, col1TreemapSize);
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
        <div className="flex gap-2 justify-center">
          {/* Column 1: 3 databases vertically stacked */}
          <div className="flex flex-col" style={{ width: "320px", height: "700px" }}>
            <div style={{ width: "320px", height: "233px" }}>
              <svg ref={intercellularRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
            <div style={{ width: "320px", height: "233px" }}>
              <svg ref={complexesRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
            <div style={{ width: "320px", height: "234px" }}>
              <svg ref={enzymeSubstrateRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
          </div>

          {/* Column 2: 2 databases vertically stacked */}
          <div className="flex flex-col" style={{ width: "320px", height: "700px" }}>
            <div style={{ width: "320px", height: "350px" }}>
              <svg ref={interactionsRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
            <div style={{ width: "320px", height: "350px" }}>
              <svg ref={annotationsRef} style={{ display: "block", width: "100%", height: "100%" }}></svg>
            </div>
          </div>

          {/* Column 3: Labels */}
          <div className="flex flex-col" style={{ width: "280px", height: "700px", paddingLeft: "15px" }}>
            {/* Interaction Types - aligned with interactions treemap */}
            <div style={{ height: "350px" }} className="flex items-center">
              <div className="w-full">
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

            {/* Annotation Categories - aligned with annotations treemap */}
            <div style={{ height: "350px" }} className="flex items-center">
              <div className="w-full">
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