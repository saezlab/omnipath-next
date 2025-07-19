export function exportToTSV<T extends Record<string, unknown>>(data: T[], filename: string) {
  if (!data.length) return;

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create TSV content
  const tsvContent = [
    headers.join('\t'), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Properly serialize different types of values
        if (value === null || value === undefined) {
          return '';
        } else if (Array.isArray(value)) {
          // Convert arrays to semicolon-separated strings
          return value.map(item => String(item)).join('; ').replace(/\t/g, ' ');
        } else if (typeof value === 'object') {
          // Convert objects to JSON string
          return JSON.stringify(value).replace(/\t/g, ' ');
        } else {
          // Convert primitives to string and replace tabs with spaces
          return String(value).replace(/\t/g, ' ');
        }
      }).join('\t')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.tsv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 