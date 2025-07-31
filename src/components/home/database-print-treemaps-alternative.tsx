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

// Professional color palette with better contrast
const databaseColors = {
  Interactions: "#2563eb",      // Bright blue
  "Enzyme-Substrate": "#dc2626", // Red
  Complexes: "#16a34a",          // Green
  Annotations: "#ea580c",        // Orange
  Intercellular: "#7c3aed"       // Purple
};

// Interaction type colors - darker shades for better contrast
const interactionTypeColors = {
  "transcriptional": "#1e40af",
  "post_translational": "#2563eb",
  "mirna_transcriptional": "#3b82f6",
  "post_transcriptional": "#60a5fa",
  "small_molecule_protein": "#93bbfc"
};

// Annotation category colors - vibrant colors for better visibility
const annotationCategoryColors = {
  "Cell-cell communication": "#dc2626",
  "Localization (subcellular)": "#ef4444",
  "Membrane localization & topology": "#f97316",
  "Extracellular matrix, adhesion": "#fb923c",
  "Vesicles, secretome": "#fbbf24",
  "Function, pathway": "#84cc16",
  "Signatures": "#22c55e",
  "Disease, cancer": "#06b6d4",
  "Protein classes & families": "#3b82f6",
  "Cell type, tissue": "#8b5cf6",
  "Transcription factors": "#ec4899"
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
  size: number
) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  // Set viewBox for proper scaling
  svg.attr("viewBox", `0 0 ${size} ${size}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const margin = { top: 2, right: 2, bottom: 2, left: 2 };
  const width = size - margin.left - margin.right;
  const height = size - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create rectangular clipping polygon
  const rectangularPolygon: [number, number][] = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height]
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
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#f5f5f5")
    .attr("stroke", "#333")
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
    .style("stroke", "#333")
    .style("stroke-width", 2)
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

  useEffect(() => {
    const treemapSize = 420; // Larger size for better visibility

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
            .sort((a, b) => b.record_count - a.record_count)
            .slice(0, 15); // Limit sources for clarity
          
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
            .sort((a, b) => b.record_count - a.record_count)
            .slice(0, 10); // Limit sources for clarity
          
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
      ).slice(0, 8); // Top 8 categories for clarity
    };

    // Create individual treemaps
    if (interactionsRef.current) {
      const interactionsData: VoronoiNode = {
        name: "Interactions",
        color: databaseColors.Interactions,
        children: processInteractionTypes()
      };
      createTreemap(interactionsRef.current, interactionsData, treemapSize);
    }

    if (enzymeSubstrateRef.current) {
      const enzymeSubstrateData: VoronoiNode = {
        name: "Enzyme-Substrate",
        color: databaseColors["Enzyme-Substrate"],
        children: dbStats.enzsub.slice(0, 30).map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            originalName: d.source,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      };
      createTreemap(enzymeSubstrateRef.current, enzymeSubstrateData, treemapSize);
    }

    if (complexesRef.current) {
      const complexesData: VoronoiNode = {
        name: "Complexes",
        color: databaseColors.Complexes,
        children: dbStats.complexes.slice(0, 30).map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            originalName: d.source,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      };
      createTreemap(complexesRef.current, complexesData, treemapSize);
    }

    if (annotationsRef.current) {
      const annotationsData: VoronoiNode = {
        name: "Annotations",
        color: databaseColors.Annotations,
        children: processAnnotationsByCategory()
      };
      createTreemap(annotationsRef.current, annotationsData, treemapSize);
    }

    if (intercellularRef.current) {
      const intercellularData: VoronoiNode = {
        name: "Intercellular",
        color: databaseColors.Intercellular,
        children: dbStats.intercell.slice(0, 30).map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            originalName: d.source,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      };
      createTreemap(intercellularRef.current, intercellularData, treemapSize);
    }
  }, []);

  return (
    <div className="w-full py-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: "Arial, sans-serif" }}>
        OmniPath Database Contents
      </h2>

      {/* Treemaps container */}
      <div className="max-w-7xl mx-auto px-4">
        {/* First row - 3 treemaps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          <div className="flex justify-center">
            <svg ref={enzymeSubstrateRef} width={420} height={420} style={{ display: "block" }}></svg>
          </div>
          <div className="flex justify-center">
            <svg ref={interactionsRef} width={420} height={420} style={{ display: "block" }}></svg>
          </div>
          <div className="flex justify-center">
            <svg ref={complexesRef} width={420} height={420} style={{ display: "block" }}></svg>
          </div>
        </div>

        {/* Second row - 2 treemaps + legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          <div className="flex justify-center">
            <svg ref={intercellularRef} width={420} height={420} style={{ display: "block" }}></svg>
          </div>
          <div className="flex justify-center">
            <svg ref={annotationsRef} width={420} height={420} style={{ display: "block" }}></svg>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center">
            <div className="w-[420px] h-[420px] bg-white p-4">
              <div className="h-full" style={{ fontFamily: "Arial, sans-serif" }}>
                {/* Three column layout for everything */}
                <div className="grid grid-cols-2 gap-6 h-full">
                  {/* Left column - Database Categories and Interaction Types */}
                  <div className="flex flex-col">
                    {/* Database categories - only in left column */}
                    <div className="mb-6">
                      <h3 className="font-bold mb-3 text-lg text-gray-900">Database Categories</h3>
                      <div className="space-y-2">
                        {Object.entries(databaseColors).map(([category, color]) => (
                          <div key={category} className="flex items-center gap-3">
                            <div 
                              className="w-5 h-5 rounded flex-shrink-0" 
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-base font-medium text-gray-800">{category}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interaction Types */}
                    <div className="flex-1">
                      <h4 className="font-bold mb-3 text-base text-gray-800">Interaction Types</h4>
                      <div className="space-y-2">
                        {Object.entries(interactionTypeColors).map(([type, color]) => (
                          <div key={type} className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-sm flex-shrink-0" 
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-sm text-gray-700">
                              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right column - Annotation Categories */}
                  <div>
                    <h4 className="font-bold mb-3 text-base text-gray-800">Annotation Categories</h4>
                    <div className="space-y-2">
                      {Object.entries(annotationCategoryColors).slice(0, 8).map(([category, color]) => (
                        <div key={category} className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-sm flex-shrink-0" 
                            style={{ backgroundColor: color }}
                          ></div>
                          <span className="text-sm text-gray-700">{category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}