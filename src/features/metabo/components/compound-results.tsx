"use client"

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompoundSearchResult } from '@/db/metabo/queries';
import { SearchMode } from './metabo-search-interface';
import { Loader2 } from 'lucide-react';
import { MoleculeStructure } from './molecule-structure';

interface CompoundResultsProps {
  results: CompoundSearchResult[];
  isLoading: boolean;
  query: string;
  searchMode: SearchMode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export function CompoundResults({
  results,
  isLoading,
  query,
  searchMode,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore
}: CompoundResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Searching compounds...</span>
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
          {results.length} compound{results.length !== 1 ? 's' : ''} found
        </h2>
        <div className="text-sm text-muted-foreground">
          Search mode: <span className="capitalize">{searchMode}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {results.map((compound) => (
          <CompoundCard key={compound.canonicalId} compound={compound} />
        ))}
      </div>

      {/* Load More Button */}
      {(hasMore || isLoadingMore) && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="px-8"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More Results'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function CompoundCard({ compound }: { compound: CompoundSearchResult }) {
  const formatValue = (value: number | null) => {
    if (value === null) return 'N/A';
    return typeof value === 'number' ? value.toFixed(2) : value;
  };

  // Extract primary name and organize identifiers
  const getPrimaryName = (identifiers?: Array<{ type: string; value: string }>) => {
    if (!identifiers || identifiers.length === 0) return null;

    // Priority order for primary names - include more variations
    const nameTypes = ['NAME', 'Name', 'Preferred Name', 'Common Name', 'IUPAC Name', 'Synonym'];

    for (const nameType of nameTypes) {
      const match = identifiers.find(id => id.type.toLowerCase() === nameType.toLowerCase());
      if (match) return match.value;
    }

    return null;
  };

  const organizeIdentifiers = (identifiers?: Array<{ type: string; value: string }>) => {
    if (!identifiers || identifiers.length === 0) return { synonyms: [], dbIds: [] };

    const nameTypes = ['NAME', 'Name', 'Synonym', 'IUPAC Name', 'Common Name', 'Preferred Name'];

    // Get all names/synonyms except the primary one
    const allNames = identifiers.filter(id =>
      nameTypes.some(nameType => id.type.toLowerCase() === nameType.toLowerCase())
    );
    const synonyms = allNames.filter(name => name.value !== primaryName);

    // Database IDs exclude all name types
    const dbIds = identifiers.filter(id =>
      !nameTypes.some(nameType => id.type.toLowerCase() === nameType.toLowerCase())
    );

    return { synonyms, dbIds };
  };

  const primaryName = getPrimaryName(compound.identifiers);
  const { synonyms, dbIds } = organizeIdentifiers(compound.identifiers);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[180px_minmax(0,1fr)200px] lg:gap-6 items-start">
          {/* Molecule Structure Visualization */}
          <div className="lg:col-auto flex flex-col">
            <div className="flex items-center justify-center">
              <MoleculeStructure
                smiles={compound.canonicalSmiles}
                width={180}
                height={180}
                canonicalId={compound.canonicalId}
                compoundName={primaryName || `Compound ${compound.canonicalId}`}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Main Compound Information */}
          <div className="space-y-3 min-w-0">
            {/* Header with Name and Badges */}
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-900 break-words">
                    {primaryName || `Compound ${compound.canonicalId}`}
                  </h3>
                  {primaryName && (
                    <p className="text-sm text-muted-foreground mt-1">Compound {compound.canonicalId}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {compound.isDrug && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">Drug</Badge>
                  )}
                  {compound.isLipid && (
                    <Badge variant="outline" className="border-purple-200 text-purple-700">Lipid</Badge>
                  )}
                  {compound.isMetabolite && (
                    <Badge variant="outline" className="border-green-200 text-green-700">Metabolite</Badge>
                  )}
                </div>
              </div>

              {/* Synonyms - Horizontal Scrollable */}
              {synonyms.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Synonyms</h4>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                    {synonyms.map((synonym, index) => (
                      <Badge key={index} variant="outline" className="text-xs whitespace-nowrap flex-shrink-0 bg-gray-50 hover:bg-gray-100 transition-colors">
                        {synonym.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-1.5 text-sm">
                {compound.formula && (
                  <div>
                    <span className="font-medium text-muted-foreground">Formula:</span> {compound.formula}
                  </div>
                )}
                {compound.inchikey && (
                  <div>
                    <span className="font-medium text-muted-foreground">InChI Key:</span>
                    <span className="font-mono ml-1">{compound.inchikey}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SMILES */}
            <div className="bg-muted p-3 rounded-lg border border-border/40">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">SMILES</div>
              <code className="text-sm break-all font-mono leading-relaxed">{compound.canonicalSmiles}</code>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Molecular Weight</div>
                <div>{formatValue(compound.molecularWeight)} Da</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">LogP</div>
                <div>{formatValue(compound.logp)}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">H-Bond Donors</div>
                <div>{compound.hbd || 'N/A'}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">H-Bond Acceptors</div>
                <div>{compound.hba || 'N/A'}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">TPSA</div>
                <div>{formatValue(compound.tpsa)} Ų</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Exact Mass</div>
                <div>{formatValue(compound.exactMass)} Da</div>
              </div>
            </div>

            {/* Lipinski compliance indicator */}
            {compound.molecularWeight !== null &&
             compound.logp !== null &&
             compound.hbd !== null &&
             compound.hba !== null && (
              <div className="pt-1">
                {compound.molecularWeight <= 500 &&
                 compound.logp <= 5 &&
                 compound.hbd <= 5 &&
                 compound.hba <= 10 ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Lipinski Compliant
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Lipinski Non-compliant
                  </Badge>
                )}
              </div>
            )}

          </div>

          {/* Database IDs - Right Column - Vertical Scrollable */}
          <div className="lg:col-auto w-full">
            <div className="lg:sticky lg:top-4 space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 border-b border-border pb-2">Database IDs</h4>
              {dbIds.length > 0 ? (
                <div className="max-h-[280px] overflow-y-auto pr-1.5 space-y-2">
                  {dbIds.map((id, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded-md border border-gray-100">
                      <div className="font-semibold text-xs text-gray-600 uppercase tracking-wide mb-0.5">{id.type}</div>
                      <div className="font-mono text-xs text-gray-900 break-all leading-tight">{id.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic bg-gray-50 p-3 rounded-lg text-center">
                  No database IDs available
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
