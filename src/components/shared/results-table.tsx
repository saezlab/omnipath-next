"use client";

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { exportToTSV } from '@/lib/utils/export';
import { Pagination } from "@/features/interactions-browser/components/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Generic type for row data
type DataRow = Record<string, unknown>;

// Type for column definition
export interface ColumnDef<TData extends DataRow> {
  accessorKey: keyof TData | string; // Key in the data object or a custom string key
  header: React.ReactNode | (({ column }: { column: ColumnDef<TData> }) => React.ReactNode);
  cell: ({ row }: { row: TData }) => React.ReactNode;
  enableSorting?: boolean;
  headerClassName?: string;
  cellClassName?: string;
}

interface ResultsTableProps<TData extends DataRow> {
  columns: ColumnDef<TData>[];
  data: TData[];
  exportData?: TData[]; // Optional full dataset for export
  initialSortKey?: keyof TData | string;
  initialSortDirection?: 'asc' | 'desc';
  onRowClick?: (row: TData) => void;
  tableClassName?: string;
  headerRowClassName?: string;
  bodyRowClassName?: string;
  scrollAreaClassName?: string;
  maxHeight?: string; // e.g., 'max-h-96'
  showSearch?: boolean;
  searchKeys?: (keyof TData | string)[];
  searchPlaceholder?: string;
  showExport?: boolean;
  exportFilenamePrefix?: string;
  resultsPerPage?: number;
  maxCellChars?: number; // New prop for max characters
  resultsCount?: number; // Optional results count to display in toolbar
  resultsLabel?: string; // Optional label for results count (e.g., "interactions", "results")
  // Infinite scroll props
  infiniteScroll?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  // External sort control props
  sortKey?: keyof TData | string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSortChange?: (key: keyof TData | string, direction: 'asc' | 'desc') => void;
}

export function ResultsTable<TData extends DataRow>({
  columns,
  data,
  exportData,
  initialSortKey,
  initialSortDirection,
  onRowClick,
  tableClassName,
  headerRowClassName,
  bodyRowClassName,
  maxHeight = "max-h-96",
  showSearch = true,
  searchKeys,
  searchPlaceholder = "Search within table...",
  showExport = true,
  exportFilenamePrefix = 'table_export',
  resultsPerPage = 15,
  maxCellChars, // Destructure new prop
  resultsCount, // Optional results count
  resultsLabel = "results", // Default label
  // Infinite scroll props
  infiniteScroll = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  // External sort control props
  sortKey: externalSortKey,
  sortDirection: externalSortDirection,
  onSortChange,
}: ResultsTableProps<TData>) {
  const [internalSortKey, setInternalSortKey] = useState<keyof TData | string | null>(initialSortKey ?? null);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc' | null>(initialSortDirection ?? null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Use external sort state if provided, otherwise use internal state
  const sortKey = externalSortKey !== undefined ? externalSortKey : internalSortKey;
  const sortDirection = externalSortDirection !== undefined ? externalSortDirection : internalSortDirection;

  const handleSort = (key: keyof TData | string) => {
    if (!columns.find(col => col.accessorKey === key)?.enableSorting) return;

    if (onSortChange) {
      // Use external sort control
      const newDirection = sortKey === key ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
      onSortChange(key, newDirection);
    } else {
      // Use internal sort control
      if (internalSortKey === key) {
        setInternalSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setInternalSortKey(key);
        setInternalSortDirection('asc');
      }
    }
  };

  const processedData = useMemo(() => {
    let filteredData = [...data];

    // Determine search keys: use provided keys or default to all column accessors
    const keysToSearch = (searchKeys && searchKeys.length > 0)
      ? searchKeys
      : columns.map(col => col.accessorKey);

    // Apply search filtering
    if (showSearch && searchTerm && keysToSearch.length > 0) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filteredData = filteredData.filter(row =>
        keysToSearch.some(key => {
          const value = row[key];
          // Ensure value exists and can be converted to string before searching
          return value !== null && value !== undefined &&
                 value.toString().toLowerCase().includes(lowerCaseSearchTerm);
        })
      );
    }

    // Only apply internal sorting if not using external sort control
    if (sortKey && sortDirection && !onSortChange) {
      const columnDef = columns.find(col => col.accessorKey === sortKey);
      if (columnDef?.enableSorting) {
        filteredData.sort((a, b) => {
          const valA = a[sortKey];
          const valB = b[sortKey];
          if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
          if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    return filteredData;
  }, [data, searchTerm, showSearch, searchKeys, sortKey, sortDirection, columns, onSortChange]);

  // Pagination logic (only for non-infinite scroll)
  const totalPages = Math.ceil(processedData.length / resultsPerPage);
  const displayData = useMemo(() => {
    if (infiniteScroll) {
      return processedData; // Show all data for infinite scroll
    } else {
      const start = (currentPage - 1) * resultsPerPage;
      const end = start + resultsPerPage;
      return processedData.slice(start, end);
    }
  }, [processedData, currentPage, resultsPerPage, infiniteScroll]);

  // Reset to page 1 when search term or sort changes (only for pagination mode)
  React.useEffect(() => {
    if (!infiniteScroll) {
      setCurrentPage(1);
    }
  }, [searchTerm, sortKey, sortDirection, infiniteScroll]);

  // Intersection observer for infinite scroll
  React.useEffect(() => {
    if (!infiniteScroll || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [infiniteScroll, hasMore, loadingMore, onLoadMore]);

  // Internal export handler
  const handleInternalExport = () => {
    const dataToExport = exportData || processedData;
    if (dataToExport.length === 0) {
        console.warn("No data to export.");
        return;
    }
    const filename = `${exportFilenamePrefix}_${new Date().toISOString().split('T')[0]}`;
    exportToTSV(dataToExport, filename); // Use exportData if available, otherwise processedData
  };

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground px-4 py-2">No results found.</p>;
  }

  return (
    <div>
      {(showSearch || showExport || resultsCount !== undefined) && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-primary/20">
          <div className="flex items-center gap-4 flex-grow">
            {resultsCount !== undefined && (
              <div className="text-sm text-muted-foreground">
                {resultsCount} {resultsLabel}
              </div>
            )}
            {showSearch && (
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 max-w-xs"
              />
            )}
          </div>
          {showExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInternalExport}
              disabled={(exportData || processedData).length === 0}
              className="h-8 flex-shrink-0"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      )}
      <div className={cn("relative", infiniteScroll ? "h-full overflow-auto" : `${maxHeight} overflow-auto`)}>
        <TooltipProvider>
          <Table className={cn("w-full min-w-max", tableClassName)}>
            <TableHeader className={infiniteScroll ? "sticky top-0 bg-background z-10" : ""}>
              <TableRow className={headerRowClassName}>
                {columns.map((column) => {
                  const headerContent = typeof column.header === 'function'
                    ? column.header({ column })
                    : column.header;
                  const tooltipText = typeof column.header === 'string'
                    ? column.header
                    : String(column.accessorKey);

                  return (
                    <TableHead
                      key={String(column.accessorKey)}
                      onClick={() => column.enableSorting && handleSort(column.accessorKey)}
                      className={cn(
                        column.enableSorting ? "cursor-pointer" : "",
                        column.headerClassName
                      )}
                    >
                      {(() => {
                        const isTruncated = maxCellChars && typeof tooltipText === 'string' && tooltipText.length > maxCellChars;
                        const content = (
                          <div className="flex items-center gap-1">
                            {isTruncated ? `${tooltipText.slice(0, maxCellChars)}...` : headerContent}
                            {column.enableSorting && (
                              <ArrowUpDown className="h-3 w-3 text-muted-foreground/70" />
                            )}
                            {sortKey === column.accessorKey && sortDirection && (
                              <span className="text-xs font-normal text-muted-foreground">
                                ({sortDirection})
                              </span>
                            )}
                          </div>
                        );

                        if (isTruncated) {
                          return (
                            <Tooltip delayDuration={150}>
                              <TooltipTrigger asChild>{content}</TooltipTrigger>
                              <TooltipContent>
                                <p>{tooltipText}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return content; // Render content directly if not truncated
                      })()}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick ? "cursor-pointer hover:bg-muted/50" : "", bodyRowClassName)}
                >
                  {columns.map((column) => {
                    const cellContent = column.cell({ row });
                    // Attempt to get a string representation of the raw value for the tooltip
                    let tooltipText = '';
                    try {
                      const rawValue = row[column.accessorKey];
                      if (rawValue !== null && rawValue !== undefined) {
                        if (typeof rawValue === 'object') {
                          // Basic object/array stringification, might need refinement
                          tooltipText = JSON.stringify(rawValue);
                        } else {
                          tooltipText = String(rawValue);
                        }
                      }
                    } catch (error) {
                      // Fallback if accessorKey doesn't exist or other error
                      console.error("Error getting tooltip text for cell:", error);
                      tooltipText = 'Error getting value';
                    }
                    // If cellContent is a simple string/number, use that as tooltip fallback if tooltipText is empty
                    if (!tooltipText && (typeof cellContent === 'string' || typeof cellContent === 'number')) {
                        tooltipText = String(cellContent);
                    }

                    return (
                      <TableCell
                        key={`${rowIndex}-${String(column.accessorKey)}`}
                        className={cn(
                          "text-xs",
                          column.cellClassName
                        )}
                      >
                        {(() => {
                          const isTruncated = maxCellChars && typeof tooltipText === 'string' && tooltipText.length > maxCellChars;
                          // Check if the cell content is primitive and truncation applies
                          const applyGenericTruncation = isTruncated && tooltipText && (typeof cellContent === 'string' || typeof cellContent === 'number');

                          if (applyGenericTruncation) {
                            // Use the potentially complex tooltipText for truncation length check, 
                            // but display the primitive cellContent (if available) truncated, 
                            // falling back to truncated tooltipText.
                            const textToTruncate = (typeof cellContent === 'string' || typeof cellContent === 'number') 
                                                  ? String(cellContent) 
                                                  : tooltipText; 
                            const truncatedDisplay = `${textToTruncate.slice(0, maxCellChars)}...`;
                            
                            return (
                              <Tooltip delayDuration={150}>
                                <TooltipTrigger asChild>
                                  <div>{truncatedDisplay}</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {/* Always show the full original tooltipText in the tooltip */}
                                  <p>{tooltipText}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          }
                          // If not applying generic truncation (either not truncated, or cellContent is complex), 
                          // render the original cellContent.
                          return cellContent; 
                        })()}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
        {/* Infinite scroll sentinel and loading indicator */}
        {infiniteScroll && (
          <>
            {hasMore && (
              <div ref={loadMoreRef} className="h-4 flex justify-center py-8">
                <div className="text-muted-foreground text-sm">
                  {loadingMore ? "Loading more..." : ""}
                </div>
              </div>
            )}
            {!hasMore && data.length > 0 && (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground text-sm">All results loaded</div>
              </div>
            )}
          </>
        )}
      </div>
      {!infiniteScroll && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            startIndex={(currentPage - 1) * resultsPerPage}
            endIndex={Math.min(currentPage * resultsPerPage, processedData.length)}
            totalItems={processedData.length}
            onPageChange={setCurrentPage}
          />
      )}
    </div>
  );
} 