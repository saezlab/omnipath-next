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
}

// IBM Design Library color-blind safe palette
const databaseColors = {
  Interactions: "#648fff",      // Blue
  "Enzyme-Substrate": "#fe6100", // Orange
  Complexes: "#785ef0",          // Purple
  Annotations: "#dc267f",        // Magenta
  Intercellular: "#ffb000"       // Yellow
};

// Function to generate shades of a color
function generateShades(baseColor: string, count: number): string[] {
  const color = d3.color(baseColor);
  if (!color) return [baseColor];
  
  const shades: string[] = [];
  for (let i = 0; i < count; i++) {
    const factor = i / (count - 1);
    shades.push(color.darker(factor * 1.5).toString());
  }
  return shades;
}

// Generate interaction type colors as shades of the main Interactions color
const interactionShades = generateShades(databaseColors.Interactions, 5);
const interactionTypeColors = {
  "transcriptional": interactionShades[0],
  "post_translational": interactionShades[1],
  "mirna_transcriptional": interactionShades[2],
  "post_transcriptional": interactionShades[3],
  "small_molecule_protein": interactionShades[4]
};

// Generate annotation category colors as shades of the main Annotations color
const annotationShades = generateShades(databaseColors.Annotations, 11);
const annotationCategories = [
  "Cell-cell communication",
  "Localization (subcellular)",
  "Membrane localization & topology",
  "Extracellular matrix, adhesion",
  "Vesicles, secretome",
  "Function, pathway",
  "Signatures",
  "Disease, cancer",
  "Protein classes & families",
  "Cell type, tissue",
  "Transcription factors"
];

const annotationCategoryColors: Record<string, string> = {};
annotationCategories.forEach((category, index) => {
  annotationCategoryColors[category] = annotationShades[index];
});

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
  size: number,
  title: string
) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  // Set viewBox for proper scaling - extend in all directions for circular labels
  const padding = 120; // Padding for labels around the entire circle
  const svgWidth = size + padding * 2;
  const svgHeight = size + padding * 2;
  svg.attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const margin = { top: 5, right: 5, bottom: 30, left: 5 };
  const radius = (size - margin.top - margin.bottom) / 2;

  // Add title below the circle - centered in the extended viewBox
  svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", svgHeight - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "Arial, sans-serif")
    .text(title);

  const g = svg.append("g")
    .attr("transform", `translate(${svgWidth/2},${svgHeight/2 - 10})`);

  // Create circular clipping polygon
  const _2PI = 2 * Math.PI;
  const circlingPolygon: [number, number][] = [];
  const points = 60;
  const increment = _2PI / points;
  
  for (let a = 0, i = 0; i < points; i++, a += increment) {
    circlingPolygon.push([
      radius * Math.cos(a),
      radius * Math.sin(a)
    ]);
  }

  // Create hierarchy
  const hierarchy = d3.hierarchy(data)
    .sum(d => d.weight || 0);

  // Create voronoi treemap
  const _voronoiTreemap = voronoiTreemap()
    .clip(circlingPolygon);
  
  _voronoiTreemap(hierarchy);

  // Draw background circle
  g.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", radius)
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
      // For databases without subtypes, use the main color directly
      if (!d.parent || d.parent.depth === 0) {
        return data.color || "#ccc";
      }
      // For subtypes, use the predefined shade
      if (d.parent?.data.color) {
        return d.parent.data.color;
      }
      return "#ccc";
    })
    .style("stroke", "#fff")
    .style("stroke-width", 0.5)
    .style("opacity", 0.9);

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

  // Separate edge sections from inner sections
  const edgeSections: any[] = [];
  const innerSections: any[] = [];
  
  parents.forEach((d: any) => {
    // Find all points of the polygon that are on or near the circle edge
    const edgePoints = d.polygon.filter((point: [number, number]) => {
      const distFromCenter = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
      return Math.abs(distFromCenter - radius) < radius * 0.1; // Within 10% of radius
    });
    
    if (edgePoints.length > 0) {
      edgeSections.push(d);
    } else {
      innerSections.push(d);
    }
  });

  // Draw external labels positioned around the circle (only for edge sections)
  if (edgeSections.length > 0) {
    g.append("g")
      .selectAll(".radial-label")
      .data(edgeSections)
      .enter()
      .append("text")
      .attr("class", "radial-label")
      .attr("x", (d: any) => {
        // Find edge points and calculate midpoint angle (same logic as above)
        const edgePoints = d.polygon.filter((point: [number, number]) => {
          const distFromCenter = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
          return Math.abs(distFromCenter - radius) < radius * 0.1;
        });
        
        const angles = edgePoints.map((point: [number, number]) => 
          Math.atan2(point[1], point[0])
        );
        const normalizedAngles = angles.map((angle: number) => angle < 0 ? angle + 2 * Math.PI : angle).sort();
        
        let minAngle = normalizedAngles[0];
        let maxAngle = normalizedAngles[normalizedAngles.length - 1];
        
        const angleSpan = maxAngle - minAngle;
        if (angleSpan > Math.PI) {
          const gaps = [];
          for (let i = 1; i < normalizedAngles.length; i++) {
            gaps.push({
              size: normalizedAngles[i] - normalizedAngles[i-1],
              startAngle: normalizedAngles[i-1],
              endAngle: normalizedAngles[i]
            });
          }
          gaps.push({
            size: (2 * Math.PI - maxAngle) + minAngle,
            startAngle: maxAngle,
            endAngle: minAngle + 2 * Math.PI
          });
          
          const largestGap = gaps.reduce((max, gap) => gap.size > max.size ? gap : max);
          minAngle = largestGap.endAngle % (2 * Math.PI);
          maxAngle = largestGap.startAngle;
        }
        
        let midAngle;
        if (maxAngle < minAngle) {
          midAngle = ((maxAngle + 2 * Math.PI + minAngle) / 2) % (2 * Math.PI);
        } else {
          midAngle = (minAngle + maxAngle) / 2;
        }
        
        return (radius + 50) * Math.cos(midAngle);
      })
      .attr("y", (d: any) => {
        // Same midpoint angle calculation for Y coordinate
        const edgePoints = d.polygon.filter((point: [number, number]) => {
          const distFromCenter = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
          return Math.abs(distFromCenter - radius) < radius * 0.1;
        });
        
        const angles = edgePoints.map((point: [number, number]) => 
          Math.atan2(point[1], point[0])
        );
        const normalizedAngles = angles.map((angle: number) => angle < 0 ? angle + 2 * Math.PI : angle).sort();
        
        let minAngle = normalizedAngles[0];
        let maxAngle = normalizedAngles[normalizedAngles.length - 1];
        
        const angleSpan = maxAngle - minAngle;
        if (angleSpan > Math.PI) {
          const gaps = [];
          for (let i = 1; i < normalizedAngles.length; i++) {
            gaps.push({
              size: normalizedAngles[i] - normalizedAngles[i-1],
              startAngle: normalizedAngles[i-1],
              endAngle: normalizedAngles[i]
            });
          }
          gaps.push({
            size: (2 * Math.PI - maxAngle) + minAngle,
            startAngle: maxAngle,
            endAngle: minAngle + 2 * Math.PI
          });
          
          const largestGap = gaps.reduce((max, gap) => gap.size > max.size ? gap : max);
          minAngle = largestGap.endAngle % (2 * Math.PI);
          maxAngle = largestGap.startAngle;
        }
        
        let midAngle;
        if (maxAngle < minAngle) {
          midAngle = ((maxAngle + 2 * Math.PI + minAngle) / 2) % (2 * Math.PI);
        } else {
          midAngle = (minAngle + maxAngle) / 2;
        }
        
        return (radius + 50) * Math.sin(midAngle);
      })
      .attr("text-anchor", (d: any) => {
        // Use midpoint angle for text anchor determination
        const edgePoints = d.polygon.filter((point: [number, number]) => {
          const distFromCenter = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
          return Math.abs(distFromCenter - radius) < radius * 0.1;
        });
        
        const angles = edgePoints.map((point: [number, number]) => 
          Math.atan2(point[1], point[0])
        );
        const normalizedAngles = angles.map((angle: number) => angle < 0 ? angle + 2 * Math.PI : angle).sort();
        
        let minAngle = normalizedAngles[0];
        let maxAngle = normalizedAngles[normalizedAngles.length - 1];
        
        const angleSpan = maxAngle - minAngle;
        if (angleSpan > Math.PI) {
          const gaps = [];
          for (let i = 1; i < normalizedAngles.length; i++) {
            gaps.push({
              size: normalizedAngles[i] - normalizedAngles[i-1],
              startAngle: normalizedAngles[i-1],
              endAngle: normalizedAngles[i]
            });
          }
          gaps.push({
            size: (2 * Math.PI - maxAngle) + minAngle,
            startAngle: maxAngle,
            endAngle: minAngle + 2 * Math.PI
          });
          
          const largestGap = gaps.reduce((max, gap) => gap.size > max.size ? gap : max);
          minAngle = largestGap.endAngle % (2 * Math.PI);
          maxAngle = largestGap.startAngle;
        }
        
        let midAngle;
        if (maxAngle < minAngle) {
          midAngle = ((maxAngle + 2 * Math.PI + minAngle) / 2) % (2 * Math.PI);
        } else {
          midAngle = (minAngle + maxAngle) / 2;
        }
        
        // Adjust text anchor based on position around circle
        if (midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2) {
          return "end"; // Left side of circle
        }
        return "start"; // Right side of circle
      })
      .attr("dominant-baseline", "middle")
      .style("font-size", "11px")
      .style("font-family", "Arial, sans-serif")
      .style("fill", "#333")
      .style("font-weight", "600")
      .text((d: any) => d.data.name);
  }

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

  // Draw overlay labels for inner sections (sections not touching the edge)
  if (innerSections.length > 0) {
    g.append("g")
      .selectAll(".inner-label")
      .data(innerSections)
      .enter()
      .append("text")
      .attr("class", "inner-label")
      .attr("transform", (d: any) => `translate(${d.polygon.site.x},${d.polygon.site.y})`)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", "12px")
      .style("font-family", "Arial, sans-serif")
      .style("fill", "#333")
      .style("font-weight", "600")
      .style("text-shadow", "0 0 3px white, 0 0 6px white")
      .text((d: any) => d.data.name);
  }
}

export function DatabasePrintTreemaps() {
  const interactionsRef = useRef<SVGSVGElement>(null);
  const enzymeSubstrateRef = useRef<SVGSVGElement>(null);
  const complexesRef = useRef<SVGSVGElement>(null);
  const annotationsRef = useRef<SVGSVGElement>(null);
  const intercellularRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const treemapSize = 450; // Size to accommodate side labels

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
      createTreemap(interactionsRef.current, interactionsData, treemapSize, "Interactions");
    }

    if (enzymeSubstrateRef.current) {
      const enzymeSubstrateData: VoronoiNode = {
        name: "Enzyme-Substrate",
        color: databaseColors["Enzyme-Substrate"],
        children: dbStats.enzsub.slice(0, 30).map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      };
      createTreemap(enzymeSubstrateRef.current, enzymeSubstrateData, treemapSize, "Enzyme-Substrate");
    }

    if (complexesRef.current) {
      const complexesData: VoronoiNode = {
        name: "Complexes",
        color: databaseColors.Complexes,
        children: dbStats.complexes.slice(0, 30).map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      };
      createTreemap(complexesRef.current, complexesData, treemapSize, "Complexes");
    }

    if (annotationsRef.current) {
      const annotationsData: VoronoiNode = {
        name: "Annotations",
        color: databaseColors.Annotations,
        children: processAnnotationsByCategory()
      };
      createTreemap(annotationsRef.current, annotationsData, treemapSize, "Annotations");
    }

    if (intercellularRef.current) {
      const intercellularData: VoronoiNode = {
        name: "Intercellular",
        color: databaseColors.Intercellular,
        children: dbStats.intercell.slice(0, 30).map(d => {
          const cleanedName = cleanSourceName(d.source);
          return {
            name: cleanedName,
            weight: Math.log10(d.record_count + 1),
            code: cleanedName.length > 10 ? cleanedName.substring(0, 8) + ".." : cleanedName
          };
        })
      };
      createTreemap(intercellularRef.current, intercellularData, treemapSize, "Intercellular");
    }
  }, []);

  return (
    <div className="w-full py-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: "Arial, sans-serif" }}>
        OmniPath Database Contents
      </h2>

      {/* Treemaps container */}
      <div className="max-w-8xl mx-auto px-4 space-y-8">
        {/* Complex databases with legends */}
        
        {/* Interactions with integrated labels */}
        <div className="flex justify-center">
          <div className="text-center">
            <svg ref={interactionsRef} width={590} height={590} style={{ display: "block" }}></svg>
          </div>
        </div>

        {/* Annotations with integrated labels */}
        <div className="flex justify-center">
          <div className="text-center">
            <svg ref={annotationsRef} width={590} height={590} style={{ display: "block" }}></svg>
          </div>
        </div>

        {/* Simple databases - compact row */}
        <div>
          <h3 className="text-lg font-semibold text-center mb-4 text-gray-800" style={{ fontFamily: "Arial, sans-serif" }}>
            Other Database Types
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            <div className="flex justify-center">
              <svg ref={enzymeSubstrateRef} width={350} height={350} style={{ display: "block" }}></svg>
            </div>
            <div className="flex justify-center">
              <svg ref={complexesRef} width={350} height={350} style={{ display: "block" }}></svg>
            </div>
            <div className="flex justify-center">
              <svg ref={intercellularRef} width={350} height={350} style={{ display: "block" }}></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}