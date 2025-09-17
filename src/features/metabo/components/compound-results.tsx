"use client"

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompoundSearchResult } from '@/db/metabo/queries';
import { SearchMode } from './metabo-search-interface';
import { Loader2 } from 'lucide-react';
import { MoleculeStructure } from './molecule-structure';

interface CompoundResultsProps {
  results: CompoundSearchResult[];
  isLoading: boolean;
  query: string;
  searchMode: SearchMode;
}

export function CompoundResults({ results, isLoading, query, searchMode }: CompoundResultsProps) {
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
    </div>
  );
}

function CompoundCard({ compound }: { compound: CompoundSearchResult }) {
  const formatValue = (value: number | null) => {
    if (value === null) return 'N/A';
    return typeof value === 'number' ? value.toFixed(2) : value;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Molecule Structure Visualization */}
          <div className="md:col-span-1">
            <MoleculeStructure
              smiles={compound.canonicalSmiles}
              width={250}
              height={250}
              className="w-full"
            />
          </div>

          {/* Compound Information */}
          <div className="md:col-span-2 space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">Compound {compound.canonicalId}</h3>
                <div className="flex gap-1">
                  {compound.isDrug && (
                    <Badge variant="secondary">Drug</Badge>
                  )}
                  {compound.isLipid && (
                    <Badge variant="outline">Lipid</Badge>
                  )}
                  {compound.isMetabolite && (
                    <Badge variant="outline">Metabolite</Badge>
                  )}
                </div>
              </div>

              {compound.inchikey && (
                <div className="text-sm text-muted-foreground mb-1">
                  <span className="font-medium">InChI Key:</span> {compound.inchikey}
                </div>
              )}

              {compound.formula && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Formula:</span> {compound.formula}
                </div>
              )}
            </div>

            {/* SMILES */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium mb-1">SMILES</div>
              <code className="text-sm break-all">{compound.canonicalSmiles}</code>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
              <div className="pt-2">
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
        </div>
      </CardContent>
    </Card>
  );
}