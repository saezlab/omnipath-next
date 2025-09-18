"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { CompoundLiteratureResponse, PubMedPublication } from '@/features/metabo/types';

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
  const [isLiteratureOpen, setIsLiteratureOpen] = useState(false);
  const [isLoadingLiterature, setIsLoadingLiterature] = useState(false);
  const [literatureError, setLiteratureError] = useState<string | null>(null);
  const [pubmedIds, setPubmedIds] = useState<string[] | null>(null);
  const [publications, setPublications] = useState<PubMedPublication[] | null>(null);

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

  const loadLiterature = useCallback(async () => {
    if (!canonicalId) {
      setLiteratureError('Unable to locate literature for this compound');
      setPubmedIds([]);
      setPublications([]);
      return;
    }

    try {
      setIsLoadingLiterature(true);
      setLiteratureError(null);
      setPublications(null);

      const response = await fetch(`/api/metabo/compound/${canonicalId}/publications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Unable to fetch literature for this compound');
      }

      const data: CompoundLiteratureResponse = await response.json();

      const ids = Array.isArray(data?.pubmedIds)
        ? data.pubmedIds.map((pmid) => pmid.toString())
        : [];

      setPubmedIds(ids);

      const summaries = Array.isArray(data?.publications)
        ? data.publications.map((publication) => ({
            ...publication,
            pmid: publication.pmid.toString(),
            title: publication.title ?? null,
            journal: publication.journal ?? null,
            publicationDate: publication.publicationDate ?? null,
            doi: publication.doi ?? null,
            authors: Array.isArray(publication.authors) ? publication.authors : [],
            url: publication.url || `https://pubmed.ncbi.nlm.nih.gov/${publication.pmid}/`,
          }))
        : [];

      setPublications(summaries);
    } catch (err) {
      console.error('Error loading compound literature:', err);
      setLiteratureError('Failed to load literature. Please try again.');
      setPubmedIds(null);
      setPublications(null);
    } finally {
      setIsLoadingLiterature(false);
    }
  }, [canonicalId]);

  const handleLiteratureOpenChange = useCallback(
    (open: boolean) => {
      setIsLiteratureOpen(open);
      if (open && pubmedIds === null && !isLoadingLiterature) {
        void loadLiterature();
      }
      if (!open) {
        setLiteratureError(null);
      }
    },
    [isLoadingLiterature, loadLiterature, pubmedIds]
  );

  const formattedPublications = useMemo(() => {
    if (!publications) return null;
    return publications.map((publication) => {
      const authors = publication.authors.slice(0, 5);
      const authorLabel = authors.length > 0
        ? `${authors.join(', ')}${publication.authors.length > authors.length ? ' et al.' : ''}`
        : null;

      return {
        ...publication,
        authorLabel,
      };
    });
  }, [publications]);

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
    <div className="flex flex-col items-center gap-3" style={width ? { width } : undefined}>
      {structureDisplay}

      {canonicalId && (
        <Dialog open={isLiteratureOpen} onOpenChange={handleLiteratureOpenChange}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-center"
            >
              {isLoadingLiterature && pubmedIds === null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching literature
                </>
              ) : (
                'Show literature'
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>PubMed Literature</DialogTitle>
              <DialogDescription>
                {compoundName
                  ? `PubMed references associated with ${compoundName}.`
                  : 'PubMed references associated with this compound.'}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-[120px] space-y-4">
              {isLoadingLiterature && pubmedIds === null ? (
                <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading PubMed IDs…</span>
                </div>
              ) : literatureError ? (
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertDescription>{literatureError}</AlertDescription>
                  </Alert>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void loadLiterature()}
                    disabled={isLoadingLiterature}
                  >
                    {isLoadingLiterature ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Retrying…
                      </>
                    ) : (
                      'Retry'
                    )}
                  </Button>
                </div>
              ) : formattedPublications && formattedPublications.length > 0 ? (
                <ScrollArea className="max-h-[52vh] pr-2">
                  <div className="space-y-3">
                    {formattedPublications.map((publication) => (
                      <div
                        key={publication.pmid}
                        className="rounded-md border border-border/60 bg-muted/30 p-3"
                      >
                        <div className="flex flex-col gap-1">
                          <a
                            href={publication.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold leading-snug hover:text-primary"
                          >
                            {publication.title || `PubMed entry ${publication.pmid}`}
                          </a>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {publication.authorLabel && (
                              <p>{publication.authorLabel}</p>
                            )}
                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                              {publication.journal && (
                                <span className="font-medium text-foreground/80">
                                  {publication.journal}
                                </span>
                              )}
                              {publication.publicationDate && (
                                <span>{publication.publicationDate}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge asChild variant="outline" className="text-[11px]">
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/${publication.pmid}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              PMID {publication.pmid}
                            </a>
                          </Badge>
                          {publication.doi && (
                            <Badge asChild variant="secondary" className="text-[11px]">
                              <a
                                href={`https://doi.org/${publication.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                DOI {publication.doi}
                              </a>
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : pubmedIds && pubmedIds.length > 0 ? (
                <ScrollArea className="max-h-[52vh] pr-2">
                  <div className="flex flex-wrap gap-2">
                    {pubmedIds.map((pmid) => (
                      <Badge key={pmid} asChild variant="outline" className="text-xs">
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          PMID {pmid}
                        </a>
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No PubMed references available for this compound.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
