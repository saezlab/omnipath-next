"use client";

import React, { useState, useMemo } from 'react';
// Removed Table imports - using native HTML elements instead
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
  resultsLabel?: string; // Label for the results count (e.g., "interactions", "entities")
  // Infinite scroll props
  infiniteScroll?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  // External sort control props
  sortKey?: keyof TData | string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSortChange?: (key: keyof TData | string, direction: 'asc' | 'desc') => void;
  // Simple title props
  title?: string;
  titleCount?: number;
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
  showSearch = false,
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
  // Simple title props
  title,
  titleCount,
}: ResultsTableProps<TData>) {
  const [internalSortKey, setInternalSortKey] = useState<keyof TData | string | null>(initialSortKey ?? null);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc' | null>(initialSortDirection ?? null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  // Internal infinite scroll state
  const [displayedBatches, setDisplayedBatches] = useState(1);
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
      // Internal infinite scroll: show batches based on displayedBatches
      const itemsToShow = displayedBatches * resultsPerPage;
      return processedData.slice(0, itemsToShow);
    } else {
      const start = (currentPage - 1) * resultsPerPage;
      const end = start + resultsPerPage;
      return processedData.slice(start, end);
    }
  }, [processedData, currentPage, resultsPerPage, infiniteScroll, displayedBatches]);

  // Reset to page 1 when search term or sort changes (only for pagination mode)
  // Reset displayed batches when search term or sort changes (for infinite scroll)
  React.useEffect(() => {
    if (!infiniteScroll) {
      setCurrentPage(1);
    } else {
      setDisplayedBatches(1);
    }
  }, [searchTerm, sortKey, sortDirection, infiniteScroll]);

  // Intersection observer for infinite scroll
  React.useEffect(() => {
    if (!infiniteScroll) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;

        if (onLoadMore) {
          // External infinite scroll mode
          if (hasMore && !loadingMore) {
            onLoadMore();
          }
        } else {
          // Internal infinite scroll mode
          const totalAvailable = processedData.length;
          const currentlyShowing = displayedBatches * resultsPerPage;
          if (currentlyShowing < totalAvailable) {
            setDisplayedBatches(prev => prev + 1);
          }
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [infiniteScroll, hasMore, loadingMore, onLoadMore, processedData.length, displayedBatches, resultsPerPage]);

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
    <div className={cn("w-full max-w-full flex flex-col", infiniteScroll ? "h-full" : "")}>
      <div className={cn("relative w-full max-w-full overflow-hidden border border-primary/20 hover:border-primary/40 shadow-sm hover:shadow-md bg-background rounded-lg transition-all duration-200 flex flex-col", infiniteScroll ? "h-full" : "")}>
        {showExport && (
          <Button 
            variant="default"
            size="icon" 
            onClick={handleInternalExport}
            disabled={(exportData || processedData).length === 0}
            className="absolute top-2 right-4 h-8 w-8 z-50"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        {(showSearch || resultsCount !== undefined || title) && (
          <div className="flex flex-row items-center justify-start space-y-0 p-4 bg-background flex-shrink-0 min-w-0">
            <div className="flex items-center space-x-2 min-w-0 pr-12">
              {title && (
                <h3 className="text-lg font-semibold truncate">
                  {title}
                </h3>
              )}
              {titleCount !== undefined && (
                <span className="text-muted-foreground whitespace-nowrap">
                  ({titleCount.toLocaleString()})
                </span>
              )}
              {resultsCount !== undefined && !title && (
                <span className="text-muted-foreground whitespace-nowrap">
                  ({resultsCount.toLocaleString()} {resultsLabel})
                </span>
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
          </div>
        )}
        <div className={cn(
          "overflow-x-auto",
          infiniteScroll ? "flex-1 overflow-y-auto relative" : `overflow-y-auto ${maxHeight === "max-h-96" ? "max-h-[400px]" : maxHeight}`
        )}>
        <TooltipProvider>
          <table className={cn("w-full min-w-max caption-bottom text-sm", tableClassName)}>
            <thead className={cn(
              "[&_tr]:border-b [&_tr]:border-primary/20",
              infiniteScroll ? "sticky top-0 bg-background z-20 shadow-sm border-b" : ""
            )}>
              <tr className={cn(
                "hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-primary/20 transition-colors",
                headerRowClassName
              )}>
                {columns.map((column) => {
                  const headerContent = typeof column.header === 'function'
                    ? column.header({ column })
                    : column.header;
                  const tooltipText = typeof column.header === 'string'
                    ? column.header
                    : String(column.accessorKey);

                  return (
                    <th
                      key={String(column.accessorKey)}
                      onClick={() => column.enableSorting && handleSort(column.accessorKey)}
                      className={cn(
                        "text-foreground h-12 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
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
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {displayData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "hover:bg-muted/50 data-[state=selected]:bg-muted border-b border-primary/20 transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-muted/50" : "", 
                    bodyRowClassName
                  )}
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
                      <td
                        key={`${rowIndex}-${String(column.accessorKey)}`}
                        className={cn(
                          "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] text-xs",
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
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TooltipProvider>
        {/* Infinite scroll sentinel and loading indicator */}
        {infiniteScroll && (
          <>
            {(() => {
              if (onLoadMore) {
                // External infinite scroll mode
                return (
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
                );
              } else {
                // Internal infinite scroll mode
                const totalAvailable = processedData.length;
                const currentlyShowing = displayedBatches * resultsPerPage;
                const hasMoreInternal = currentlyShowing < totalAvailable;
                
                return (
                  <>
                    {hasMoreInternal && (
                      <div ref={loadMoreRef} className="h-4 flex justify-center py-8">
                        <div className="text-muted-foreground text-sm">
                          Scroll for more...
                        </div>
                      </div>
                    )}
                    {!hasMoreInternal && processedData.length > 0 && (
                      <div className="flex justify-center py-8">
                        <div className="text-muted-foreground text-sm">
                          All {processedData.length.toLocaleString()} results loaded
                        </div>
                      </div>
                    )}
                  </>
                );
              }
            })()}
          </>
        )}
        </div>
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