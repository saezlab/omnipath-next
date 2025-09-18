"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { CompoundSearchResult } from "@/db/metabo/queries";
import { SearchMode } from "./metabo-search-interface";
import { MoleculeStructure } from "./molecule-structure";
import { CompoundLiteratureResponse, PubMedPublication } from "@/features/metabo/types";

interface CompoundResultsProps {
  results: CompoundSearchResult[];
  isLoading: boolean;
  query: string;
  searchMode: SearchMode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  /** Optional: handle the “Show literature” action at the card level */
  onShowLiterature?: (compound: CompoundSearchResult) => void;
}

/**
 * Unified panel: consistent header + scroll area with fixed height.
 */
function Panel({
  title,
  children,
  className,
  headerRight,
  id,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      role="region"
      aria-labelledby={id}
      className={`flex h-[420px] min-h-[420px] flex-col overflow-hidden rounded-lg border border-border/60 bg-muted/30 ${
        className || ""
      }`}
    >
      <div className="border-b border-border/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
        <span id={id}>{title}</span>
        {headerRight}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">{children}</div>
    </section>
  );
}

/**
 * Single, consistent row for any labeled value.
 */
function ItemRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b last:border-b-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`${mono ? "font-mono break-all" : ""} text-sm`}>{children}</div>
    </div>
  );
}

export function CompoundResults({
  results,
  isLoading,
  query,
  searchMode,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onShowLiterature,
}: CompoundResultsProps) {
  const plural = results.length === 1 ? "compound" : "compounds";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Searching compounds…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!query) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Enter a search query to find compounds</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-2">No compounds found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search query or filters
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {results.length} {plural} found
        </h2>
      </div>

      <div className="grid gap-4">
        {results.map((compound) => (
          <CompoundCard
            key={compound.canonicalId}
            compound={compound}
            onShowLiterature={onShowLiterature}
          />
        ))}
      </div>

      {(hasMore || isLoadingMore) && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="px-8"
            aria-busy={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more…
              </>
            ) : (
              "Load More Results"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function CompoundCard({
  compound,
  onShowLiterature,
}: {
  compound: CompoundSearchResult;
  onShowLiterature?: (compound: CompoundSearchResult) => void;
}) {
  const [isLiteratureOpen, setIsLiteratureOpen] = useState(false);
  const [isLoadingLiterature, setIsLoadingLiterature] = useState(false);
  const [literatureError, setLiteratureError] = useState<string | null>(null);
  const [pubmedIds, setPubmedIds] = useState<string[] | null>(null);
  const [publications, setPublications] = useState<PubMedPublication[] | null>(null);

  const formatValue = (value: number | null): string => {
    if (value === null || value === undefined) return "N/A";
    return typeof value === "number" ? value.toFixed(2) : String(value);
  };

  const getPrimaryName = (
    identifiers?: Array<{ type: string; value: string }>
  ): string | null => {
    if (!identifiers || identifiers.length === 0) return null;
    const nameTypes = [
      "NAME",
      "Name",
      "Preferred Name",
      "Common Name",
      "IUPAC Name",
      "Synonym",
    ];
    for (const nameType of nameTypes) {
      const match = identifiers.find(
        (id) => id.type.toLowerCase() === nameType.toLowerCase()
      );
      if (match) return match.value;
    }
    return null;
  };

  const { primaryName, synonyms, dbIds } = useMemo(() => {
    const primary = getPrimaryName(compound.identifiers);
    const identifiers = compound.identifiers || [];
    const nameTypes = [
      "NAME",
      "Name",
      "Synonym",
      "IUPAC Name",
      "Common Name",
      "Preferred Name",
    ];

    const allNames = identifiers.filter((id) =>
      nameTypes.some((nameType) => id.type.toLowerCase() === nameType.toLowerCase())
    );
    const syns = allNames.filter((n) => n.value !== primary);
    const db = identifiers.filter(
      (id) => !nameTypes.some((nameType) => id.type.toLowerCase() === nameType.toLowerCase())
    );

    return { primaryName: primary, synonyms: syns, dbIds: db };
  }, [compound.identifiers]);

  const loadLiterature = useCallback(async () => {
    if (!compound.canonicalId) {
      setLiteratureError('Unable to locate literature for this compound');
      setPubmedIds([]);
      setPublications([]);
      return;
    }

    try {
      setIsLoadingLiterature(true);
      setLiteratureError(null);
      setPublications(null);

      const response = await fetch(`/api/metabo/compound/${compound.canonicalId}/publications`, {
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
  }, [compound.canonicalId]);

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


  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className=" space-y-4">
        {/* Top row: Name, ID, Type Badges, Show Literature */}
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-bold text-xl truncate">
                {primaryName || `Compound ${compound.canonicalId}`}
              </h3>
              <span className="text-xs text-muted-foreground">ID: {compound.canonicalId}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {compound.isDrug && <Badge variant="secondary">Drug</Badge>}
            {compound.isLipid && <Badge variant="secondary">Lipid</Badge>}
            {compound.isMetabolite && (
              <Badge variant="secondary">Metabolite</Badge>
            )}
          </div>

          <div className="flex justify-start md:justify-end">
            <Dialog open={isLiteratureOpen} onOpenChange={handleLiteratureOpenChange}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Show literature for ${primaryName || compound.canonicalId}`}
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
                    {primaryName
                      ? `PubMed references associated with ${primaryName}.`
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
          </div>
        </div>

        {/* 3-column content */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
          {/* 1) Structure + identifiers */}
          <Panel
            title="Structure & Identifiers"
            id={`structure-${compound.canonicalId}`}
          >
            <div className="flex flex-col items-center gap-4">
              <MoleculeStructure
                smiles={compound.canonicalSmiles}
                width={220}
                height={220}
                canonicalId={compound.canonicalId}
                compoundName={primaryName || `Compound ${compound.canonicalId}`}
                className="rounded-md"
              />

              <div className="w-full">
                <ItemRow label="SMILES" mono>
                  {compound.canonicalSmiles || "N/A"}
                </ItemRow>
                {compound.formula && (
                  <ItemRow label="Formula" mono>
                    {compound.formula}
                  </ItemRow>
                )}
                {compound.inchikey && (
                  <ItemRow label="InChI Key" mono>
                    {compound.inchikey}
                  </ItemRow>
                )}
              </div>
            </div>
          </Panel>

          {/* 2) Properties (one item per row) */}
          <Panel title="Properties" id={`props-${compound.canonicalId}`}>
            <div className="space-y-0">
              <ItemRow label="Molecular Weight">
                {formatValue(compound.molecularWeight)} Da
              </ItemRow>
              <ItemRow label="Exact Mass">{formatValue(compound.exactMass)} Da</ItemRow>
              <ItemRow label="LogP">{formatValue(compound.logp)}</ItemRow>
              <ItemRow label="TPSA">
                {formatValue(compound.tpsa)} <span className="font-mono">Å²</span>
              </ItemRow>
              <ItemRow label="H-Bond Donors">{compound.hbd ?? "N/A"}</ItemRow>
              <ItemRow label="H-Bond Acceptors">{compound.hba ?? "N/A"}</ItemRow>
              {compound.molecularWeight !== null &&
                compound.logp !== null &&
                compound.hbd !== null &&
                compound.hba !== null && (
                  <ItemRow label="Lipinski Rule of 5">
                    {compound.molecularWeight <= 500 &&
                    compound.logp <= 5 &&
                    compound.hbd <= 5 &&
                    compound.hba <= 10 ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Compliant
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Non-compliant</Badge>
                    )}
                  </ItemRow>
                )}
            </div>
          </Panel>

          {/* 3) Names & IDs */}
          <Panel title="Names & IDs" id={`ids-${compound.canonicalId}`}>
            <div className="space-y-0">
              {synonyms.length > 0 && (
                <ItemRow label="Synonyms">
                  <div className="flex flex-wrap gap-2">
                    {synonyms.map((synonym, i) => (
                      <Badge
                        key={`${synonym.value}-${i}`}
                        variant="outline"
                        className="text-xs whitespace-nowrap bg-background"
                        title={synonym.type}
                      >
                        {synonym.value}
                      </Badge>
                    ))}
                  </div>
                </ItemRow>
              )}

              <ItemRow label="Database IDs">
                {dbIds.length > 0 ? (
                  <div className="space-y-2">
                    {dbIds.map((id, index) => (
                      <div
                        key={`${id.type}-${id.value}-${index}`}
                        className="rounded-md border border-border/40 bg-background/95 p-3"
                      >
                        <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
                          {id.type}
                        </div>
                        <div className="font-mono text-xs break-all leading-tight">
                          {id.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="italic text-muted-foreground">No database IDs available</span>
                )}
              </ItemRow>
            </div>
          </Panel>
        </div>
      </CardContent>
    </Card>
  );
}

export default CompoundResults;
