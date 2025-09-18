"use client"

import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type OpenChemLibModule = {
  Molecule: typeof import('openchemlib')['Molecule'];
};

interface MoleculeStructureProps {
  smiles: string;
  width?: number;
  height?: number;
  className?: string;
  canonicalId?: string;
  compoundName?: string;
}

export function MoleculeStructure({
  smiles,
  width = 250,
  height = 250,
  className = "",
  canonicalId,
  compoundName
}: MoleculeStructureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [OCL, setOCL] = useState<OpenChemLibModule | null>(null);

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


  const structureDisplay = (() => {
    const baseClassName = cn('shrink-0', className);
    const dimensions = { width, height };

    if (isLoading) {
      return <Skeleton className={cn('rounded-md', baseClassName)} style={dimensions} />;
    }

    if (error) {
      return (
        <Alert className={cn('flex items-center justify-center text-center', baseClassName)} style={dimensions}>
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div
        ref={containerRef}
        className={baseClassName}
        style={dimensions}
      />
    );
  })();

  return (
    <div className="flex flex-col items-center" style={width ? { width } : undefined}>
      {structureDisplay}
    </div>
  );
}
