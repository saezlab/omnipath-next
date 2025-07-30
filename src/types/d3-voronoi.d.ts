declare module 'd3-voronoi-treemap' {
  import { HierarchyNode } from 'd3-hierarchy';

  export interface VoronoiPolygon {
    site: {
      x: number;
      y: number;
      originalObject: any;
      originalIndex: number;
    };
    join: (separator?: string) => string;
  }

  export interface VoronoiHierarchyNode extends HierarchyNode<any> {
    polygon: VoronoiPolygon;
  }

  export interface VoronoiTreemap {
    (hierarchy: HierarchyNode<any>): void;
    clip(): [number, number][];
    clip(polygon: [number, number][]): this;
    convergenceRatio(): number;
    convergenceRatio(ratio: number): this;
    maxIterationCount(): number;
    maxIterationCount(count: number): this;
    minWeightRatio(): number;
    minWeightRatio(ratio: number): this;
    prng(): () => number;
    prng(generator: () => number): this;
  }

  export function voronoiTreemap(): VoronoiTreemap;
}

declare module 'd3-voronoi-map' {
  export * from 'd3-voronoi-map';
}

declare module 'd3-weighted-voronoi' {
  export * from 'd3-weighted-voronoi';
}