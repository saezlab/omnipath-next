"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { SearchFilters } from './metabo-search-interface';
import { useState, useEffect } from 'react';

interface PropertyFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export function PropertyFilters({ filters, onFiltersChange }: PropertyFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: SearchFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Molecular Weight */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Molecular Weight (Da)</Label>
          <div className="space-y-2">
            <Slider
              value={[localFilters.molecularWeightMin || 0, localFilters.molecularWeightMax || 1000]}
              onValueChange={([min, max]) => {
                updateFilter('molecularWeightMin', min > 0 ? min : undefined);
                updateFilter('molecularWeightMax', max < 1000 ? max : undefined);
              }}
              max={1000}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{localFilters.molecularWeightMin || 0}</span>
              <span>{localFilters.molecularWeightMax || 1000}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* LogP */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">LogP</Label>
          <div className="space-y-2">
            <Slider
              value={[localFilters.logpMin || -5, localFilters.logpMax || 10]}
              onValueChange={([min, max]) => {
                updateFilter('logpMin', min > -5 ? min : undefined);
                updateFilter('logpMax', max < 10 ? max : undefined);
              }}
              max={10}
              min={-5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{localFilters.logpMin || -5}</span>
              <span>{localFilters.logpMax || 10}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Compound Types */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Compound Types</Label>

          <div className="flex items-center justify-between">
            <Label htmlFor="drug-filter" className="text-sm">Drugs</Label>
            <Switch
              id="drug-filter"
              checked={localFilters.isDrug || false}
              onCheckedChange={(checked) =>
                updateFilter('isDrug', checked ? true : undefined)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lipid-filter" className="text-sm">Lipids</Label>
            <Switch
              id="lipid-filter"
              checked={localFilters.isLipid || false}
              onCheckedChange={(checked) =>
                updateFilter('isLipid', checked ? true : undefined)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="metabolite-filter" className="text-sm">Metabolites</Label>
            <Switch
              id="metabolite-filter"
              checked={localFilters.isMetabolite || false}
              onCheckedChange={(checked) =>
                updateFilter('isMetabolite', checked ? true : undefined)
              }
            />
          </div>
        </div>

        <Separator />

        {/* Drug-likeness */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Drug-likeness</Label>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="lipinski-filter" className="text-sm">Lipinski Rule of Five</Label>
              <p className="text-xs text-muted-foreground">
                MW ≤ 500, LogP ≤ 5, HBD ≤ 5, HBA ≤ 10
              </p>
            </div>
            <Switch
              id="lipinski-filter"
              checked={localFilters.lipinskiCompliant || false}
              onCheckedChange={(checked) =>
                updateFilter('lipinskiCompliant', checked ? true : undefined)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}