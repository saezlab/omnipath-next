// --- Import the new shared table and its types --- 
import { ResultsTable, ColumnDef } from "@/components/shared/results-table";
import { useState } from 'react'; // Import useState
import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea component exists
import { Button } from '@/components/ui/button'; // Assuming Button component exists
import { AlertCircle, Pencil } from 'lucide-react'; // Icon for errors and Pencil icon

// Type for a single row in the SQL results
type SqlResultRow = Record<string, unknown>;

// Type for the result object returned by the executeSql tool
interface SqlToolResult {
  results: SqlResultRow[];
  totalCount: number;
  limited: boolean;
}

// Update ToolResult to include SqlToolResult and explicit error type
interface SqlToolError {
    error: string;
}
type ToolResult = SqlToolResult | SqlToolError; 

// Update CustomToolInvocation args
interface CustomToolInvocation {
  toolName: string;
  args: { sqlQuery: string }; // Changed from query to sqlQuery
  state: string; // e.g., "pending", "success", "error"
  result?: ToolResult;
}

// Add onRerunQuery prop
export const ToolResponse = ({ 
    toolInvocation,
    onRerunQuery 
}: { 
    toolInvocation: CustomToolInvocation,
    onRerunQuery?: (newQuery: string) => void 
}) => {
  const { toolName, result, args, state } = toolInvocation;
  const [editedQuery, setEditedQuery] = useState(args.sqlQuery);
  const [isEditingQuery, setIsEditingQuery] = useState(false); // State for edit mode

  // Early exit for pending or unknown states without results yet
  if (state === 'pending' || !result) {
     // Optionally render a loading indicator or nothing
     // console.log("Tool state is pending or no result yet:", state);
     return null; 
  }

  switch (toolName) {
    case "executeSql":
      const isError = 'error' in result;
      const sqlResult = result as SqlToolResult; // Cast for success case
      const sqlError = result as SqlToolError; // Cast for error case

      // --- Define columns for the ResultsTable (only if not error and data is valid) ---
      const columns: ColumnDef<SqlResultRow>[] = !isError && sqlResult?.results?.length > 0
        ? Object.keys(sqlResult.results[0]).map(key => ({
            accessorKey: key,
            header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            cell: ({ row }) => {
                const value = row[key];
                return typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : String(value ?? '');
            },
            enableSorting: true,
        }))
        : [];
      // --- End of column definition --- 

      // --- Handle Rerun ---
      const handleRerun = () => {
        if (onRerunQuery) {
            onRerunQuery(editedQuery);
            setIsEditingQuery(false); // Optionally close editor on rerun
        } else {
            console.warn("onRerunQuery prop not provided to ToolResponse");
        }
      };

      return (
        <div className="flex flex-col gap-3 pt-2">
            {/* SQL Query Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {isError ? 'Failed SQL Query:' : 'Executed SQL:'}
                    </p>
                    {/* Show Edit button only if callback is provided and not already editing */}
                    {onRerunQuery && !isEditingQuery && (
                        <Button 
                            variant="ghost" 
                            size="icon" // Corrected size
                            onClick={() => setIsEditingQuery(true)}
                            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 h-6 w-6" // Adjust size/styling
                        >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit Query</span>
                        </Button>
                    )}
                </div>
                {/* Show query text only when not editing */}
                {!isEditingQuery && (
                     <pre className="p-2 text-xs font-mono bg-zinc-100 dark:bg-zinc-900 rounded overflow-x-auto">
                        <code>{args.sqlQuery}</code>
                    </pre>
                )}
            </div>

            {/* Edit Controls Section (conditional) */}
            {isEditingQuery && onRerunQuery && (
                <div className="flex flex-col gap-2 border border-dashed border-zinc-300 dark:border-zinc-700 p-3 rounded-md">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Edit query:</p>
                    <Textarea
                        value={editedQuery}
                        onChange={(e) => setEditedQuery(e.target.value)}
                        className="text-xs font-mono bg-zinc-100 dark:bg-zinc-900"
                        rows={Math.max(3, Math.min(10, editedQuery.split('\n').length))} // Ensure min 3 rows
                    />
                    <div className="flex gap-2 self-start">
                        <Button onClick={handleRerun} size="sm">
                            Rerun Query
                        </Button>
                         <Button onClick={() => setIsEditingQuery(false)} size="sm" variant="outline">
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Error Display Section (conditional) */}
            {isError && (
                 <div className="flex items-center gap-2 p-2 text-sm border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 rounded text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Error:</span>
                    <span className="font-mono text-xs">{sqlError.error}</span>
                </div>
            )}

            {/* Results Table Section (conditional) */}
            {!isError && (
                <div >
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Results:</p>
                    <div>
                        {/* Use the new ResultsTable component */}
                        <ResultsTable 
                            columns={columns} 
                            data={sqlResult.results || []} // Handle cases where results might be undefined initially
                            scrollAreaClassName="rounded-md border"
                            maxHeight="max-h-60" 
                            showSearch={true} 
                            showExport={true} 
                            searchPlaceholder="Search results..."
                            maxCellChars={10}
                        />
                    </div>
                    {sqlResult.limited && (
                    <p className="text-xs text-muted-foreground pt-2">
                            Showing first {sqlResult.results.length} of {sqlResult.totalCount} total results.
                        </p>
                    )}
                </div>
            )}
        </div>
      );
    // --- Removed cases for searchInteractions and getAnnotations ---
    default:
       console.warn(`Received response for unknown tool: ${toolName}`);
      return <p className="text-sm text-muted-foreground">Unknown tool response format.</p>;
  }
}; 