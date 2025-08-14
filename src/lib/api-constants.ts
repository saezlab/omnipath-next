// Shared constants for API endpoints

export const DATABASE_SCHEMA_DESCRIPTION = `Execute a read-only SQL query (must start with SELECT) against the database.
Available tables and their columns:
- annotations: id, uniprot, genesymbol, entity_type, source, label, value, record_id
- complexes: id, name, components (array), components_genesymbols (array), stoichiometry, sources (array), references, identifiers
- enzsub: id, enzyme, enzyme_genesymbol, substrate, substrate_genesymbol, isoforms, residue_type, residue_offset, modification, sources (array), references, curation_effort, ncbi_tax_id
- interactions: id, source, target, source_genesymbol, target_genesymbol, is_directed, is_stimulation, is_inhibition, consensus_direction, consensus_stimulation, consensus_inhibition, sources (array), references, omnipath, kinaseextra, ligrecextra, pathwayextra, mirnatarget, dorothea, collectri, tf_target, lncrna_mrna, tf_mirna, small_molecule, dorothea_curated, dorothea_chipseq, dorothea_tfbs, dorothea_coexp, dorothea_level (array), type, curation_effort, extra_attrs (jsonb), evidences (jsonb), ncbi_tax_id_source, entity_type_source, ncbi_tax_id_target, entity_type_target
- intercell: id, category, parent, database, scope, aspect, source, uniprot, genesymbol, entity_type, consensus_score, transmitter, receiver, secreted, plasma_membrane_transmembrane, plasma_membrane_peripheral
- uniprot_identifiers: id, uniprot_accession, identifier_type, identifier_value

Example queries:
• Canonical pathways for a protein:
  SELECT * FROM annotations WHERE source IN ('SignaLink_pathway', 'SIGNOR', 'NetPath', 'KEGG-PC') AND (uniprot = '<uniprot_accession>' OR genesymbol = '<genesymbol>')

• Find transcription factor regulators:
  SELECT * FROM interactions WHERE collectri AND (target = '<uniprot_accession>' OR target_genesymbol = '<genesymbol>')

• Find TF suppressors (inhibitors):
  SELECT * FROM interactions WHERE collectri AND (target = '<uniprot_accession>' OR target_genesymbol = '<genesymbol>') AND is_inhibition = TRUE

• Check if protein is a transcription factor:
  SELECT * FROM annotations WHERE source = 'TFcensus' AND value = 'a' AND (uniprot = '<uniprot_accession>' OR genesymbol = '<genesymbol>')

• Find ligands of a receptor:
  SELECT source_genesymbol FROM interactions WHERE ligrecextra AND (target = '<uniprot_accession>' OR target_genesymbol = '<genesymbol>')

• Basic interaction query:
  SELECT source_genesymbol, target_genesymbol, type FROM interactions WHERE source_genesymbol = 'EGFR'`;

export const SYSTEM_PROMPT = `You are OmniPath AI, an assistant for querying molecular interactions and biological data.

Key behaviors:
- Be concise and informative
- Summarize results >100 entries
- Ask for clarification if needed

Today: ${new Date().toLocaleDateString()}`;

export const SQL_VALIDATION_ERROR = "Invalid query. Only SELECT statements are allowed.";

export function handleSqlError(error: unknown): string {
  console.error("Error executing SQL query tool:", error);
  let errorMessage = 'Unknown database error';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    errorMessage = error.message;
  }
  return errorMessage;
}

export function validateSqlQuery(sqlQuery: string): boolean {
  return sqlQuery.trim().toUpperCase().startsWith("SELECT");
}