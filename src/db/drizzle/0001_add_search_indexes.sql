-- Add indexes for faster searching by gene symbols and UniProt IDs

-- Annotations table indexes
CREATE INDEX idx_annotations_uniprot ON annotations(uniprot);
CREATE INDEX idx_annotations_genesymbol ON annotations(genesymbol);

-- Interactions table indexes
CREATE INDEX idx_interactions_source_genesymbol ON interactions(source_genesymbol);
CREATE INDEX idx_interactions_target_genesymbol ON interactions(target_genesymbol);
CREATE INDEX idx_interactions_source ON interactions(source);
CREATE INDEX idx_interactions_target ON interactions(target);