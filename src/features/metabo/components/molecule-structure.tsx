"use client"

import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface MoleculeStructureProps {
  smiles: string;
  width?: number;
  height?: number;
  className?: string;
}

export function MoleculeStructure({
  smiles,
  width = 250,
  height = 250,
  className = ""
}: MoleculeStructureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [OCL, setOCL] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadOCL = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Import OpenChemLib
        const { Molecule } = await import('openchemlib');
        setOCL({ Molecule });

      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load OpenChemLib:', err);
        setError('Failed to load molecular visualization library');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadOCL();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!OCL || !smiles || !containerRef.current) return;

    const container = containerRef.current;

    const renderMolecule = async () => {
      try {
        setError(null);

        // Clear previous content
        container.innerHTML = '';

        // Create molecule from SMILES
        const molecule = OCL.Molecule.fromSmiles(smiles);
        if (!molecule) {
          setError('Invalid molecular structure');
          return;
        }

        // Generate SVG
        const svgString = molecule.toSVG(width, height);
        if (!svgString) {
          setError('Failed to generate structure visualization');
          return;
        }

        // Insert SVG into container
        container.innerHTML = svgString;

        // Style the SVG element
        const svgElement = container.querySelector('svg');
        if (svgElement) {
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.display = 'block';
        }

      } catch (err) {
        console.error('Error rendering molecule:', err);
        setError('Failed to render molecular structure');
      }
    };

    renderMolecule();
  }, [OCL, smiles, width, height]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Skeleton className="rounded-lg" style={{ width, height }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={{ width, height }}>
        <Alert className="h-full flex items-center justify-center">
          <AlertDescription className="text-center text-sm">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`border rounded-lg bg-white ${className}`}
      style={{ width, height }}
    />
  );
}