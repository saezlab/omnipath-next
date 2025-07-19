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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/export';
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
}

export function ResultsTable<TData extends DataRow>({
  columns,
  data,
  initialSortKey,
  initialSortDirection,
  onRowClick,
  tableClassName,
  headerRowClassName,
  bodyRowClassName,
  scrollAreaClassName = "rounded-md border",
  maxHeight = "max-h-96",
  showSearch = true,
  searchKeys,
  searchPlaceholder = "Search within table...",
  showExport = true,
  exportFilenamePrefix = 'table_export',
  resultsPerPage = 15,
  maxCellChars, // Destructure new prop
}: ResultsTableProps<TData>) {
  const [sortKey, setSortKey] = useState<keyof TData | string | null>(initialSortKey ?? null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(initialSortDirection ?? null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key: keyof TData | string) => {
    if (!columns.find(col => col.accessorKey === key)?.enableSorting) return;

    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
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

    if (sortKey && sortDirection) {
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
  }, [data, searchTerm, showSearch, searchKeys, sortKey, sortDirection, columns]);

  // Pagination logic
  const totalPages = Math.ceil(processedData.length / resultsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    const end = start + resultsPerPage;
    return processedData.slice(start, end);
  }, [processedData, currentPage, resultsPerPage]);

  // Reset to page 1 when search term or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortKey, sortDirection]);

  // Internal export handler
  const handleInternalExport = () => {
    if (processedData.length === 0) {
        console.warn("No data to export.");
        return;
    }
    const filename = `${exportFilenamePrefix}_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(processedData, filename); // Use processedData directly if exportToCSV handles object arrays
  };

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground px-4 py-2">No results found.</p>;
  }

  return (
    <div className={scrollAreaClassName}>
      {(showSearch || showExport) && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
          <div className="flex-grow">
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
              disabled={processedData.length === 0}
              className="h-8 flex-shrink-0"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      )}
      <ScrollArea className={cn("relative", maxHeight, scrollAreaClassName, "overflow-auto")}>
        <TooltipProvider>
          <Table className={cn("w-full table-fixed", tableClassName)}>
            <TableHeader>
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
              {paginatedData.map((row, rowIndex) => (
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {totalPages > 1 && (
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