import { boolean, index, integer, jsonb, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";



export const annotations = pgTable("annotations", {
	id: serial().primaryKey().notNull(),
	uniprot: varchar(),
	genesymbol: varchar(),
	entityType: varchar("entity_type"),
	source: varchar(),
	label: varchar(),
	value: varchar(),
	recordId: integer("record_id"),
}, (table) => [
	index("idx_annotations_genesymbol").using("btree", table.genesymbol.asc().nullsLast().op("text_ops")),
	index("idx_annotations_uniprot").using("btree", table.uniprot.asc().nullsLast().op("text_ops")),
]);

export const complexes = pgTable("complexes", {
	id: serial().primaryKey().notNull(),
	name: varchar(),
	components: varchar().array(),
	componentsGenesymbols: varchar("components_genesymbols").array(),
	stoichiometry: varchar(),
	sources: varchar().array(),
	references: varchar(),
	identifiers: varchar(),
});

export const enzsub = pgTable("enzsub", {
	id: serial().primaryKey().notNull(),
	enzyme: varchar(),
	enzymeGenesymbol: varchar("enzyme_genesymbol"),
	substrate: varchar(),
	substrateGenesymbol: varchar("substrate_genesymbol"),
	isoforms: varchar(),
	residueType: varchar("residue_type"),
	residueOffset: integer("residue_offset"),
	modification: varchar(),
	sources: varchar().array(),
	references: varchar(),
	curationEffort: integer("curation_effort"),
	ncbiTaxId: integer("ncbi_tax_id"),
});

export const interactions = pgTable("interactions", {
	id: serial().primaryKey().notNull(),
	source: varchar(),
	target: varchar(),
	sourceGenesymbol: varchar("source_genesymbol"),
	targetGenesymbol: varchar("target_genesymbol"),
	isDirected: boolean("is_directed"),
	isStimulation: boolean("is_stimulation"),
	isInhibition: boolean("is_inhibition"),
	consensusDirection: boolean("consensus_direction"),
	consensusStimulation: boolean("consensus_stimulation"),
	consensusInhibition: boolean("consensus_inhibition"),
	sources: varchar().array(),
	references: varchar(),
	omnipath: boolean(),
	kinaseextra: boolean(),
	ligrecextra: boolean(),
	pathwayextra: boolean(),
	mirnatarget: boolean(),
	dorothea: boolean(),
	collectri: boolean(),
	tfTarget: boolean("tf_target"),
	lncrnaMrna: boolean("lncrna_mrna"),
	tfMirna: boolean("tf_mirna"),
	smallMolecule: boolean("small_molecule"),
	dorotheaCurated: boolean("dorothea_curated"),
	dorotheaChipseq: boolean("dorothea_chipseq"),
	dorotheaTfbs: boolean("dorothea_tfbs"),
	dorotheaCoexp: boolean("dorothea_coexp"),
	dorotheaLevel: varchar("dorothea_level").array(),
	type: varchar(),
	curationEffort: integer("curation_effort"),
	extraAttrs: jsonb("extra_attrs"),
	evidences: jsonb(),
	ncbiTaxIdSource: integer("ncbi_tax_id_source"),
	entityTypeSource: varchar("entity_type_source"),
	ncbiTaxIdTarget: integer("ncbi_tax_id_target"),
	entityTypeTarget: varchar("entity_type_target"),
}, (table) => [
	index("idx_interactions_source").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("idx_interactions_source_genesymbol").using("btree", table.sourceGenesymbol.asc().nullsLast().op("text_ops")),
	index("idx_interactions_target").using("btree", table.target.asc().nullsLast().op("text_ops")),
	index("idx_interactions_target_genesymbol").using("btree", table.targetGenesymbol.asc().nullsLast().op("text_ops")),
]);

export const intercell = pgTable("intercell", {
	id: serial().primaryKey().notNull(),
	category: varchar(),
	parent: varchar(),
	database: varchar(),
	scope: varchar(),
	aspect: varchar(),
	source: varchar(),
	uniprot: varchar(),
	genesymbol: varchar(),
	entityType: varchar("entity_type"),
	consensusScore: integer("consensus_score"),
	transmitter: boolean(),
	receiver: boolean(),
	secreted: boolean(),
	plasmaMembraneTransmembrane: boolean("plasma_membrane_transmembrane"),
	plasmaMembranePeripheral: boolean("plasma_membrane_peripheral"),
});

export const uniprotIdentifiers = pgTable("uniprot_identifiers", {
	id: serial().primaryKey().notNull(),
	uniprotAccession: varchar("uniprot_accession", { length: 30 }).notNull(),
	identifierType: varchar("identifier_type", { length: 50 }).notNull(),
	identifierValue: text("identifier_value").notNull(),
}, (table) => [
	index("idx_uniprot_identifiers_accession").using("btree", table.uniprotAccession.asc().nullsLast().op("text_ops")),
	index("idx_uniprot_identifiers_type").using("btree", table.identifierType.asc().nullsLast().op("text_ops")),
	index("idx_uniprot_identifiers_value_prefix").using("btree", table.identifierValue.asc().nullsLast().op("text_pattern_ops")),
]);
