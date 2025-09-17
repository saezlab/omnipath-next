import { pgTable, pgSchema, index, unique, bigserial, text, doublePrecision, integer, timestamp, foreignKey, bigint, varchar, serial, boolean, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const gold = pgSchema("gold");


export const canonicalStructuresInGold = gold.table("canonical_structures", {
	canonicalId: bigserial("canonical_id", { mode: "bigint" }).primaryKey().notNull(),
	canonicalSmiles: text("canonical_smiles").notNull(),
	// TODO: failed to parse database type 'mol'
	mol: unknown("mol").notNull(),
	inchi: text(),
	inchikey: text(),
	formula: text(),
	molecularWeight: doublePrecision("molecular_weight"),
	exactMass: doublePrecision("exact_mass"),
	tpsa: doublePrecision(),
	logp: doublePrecision(),
	hbd: integer(),
	hba: integer(),
	rotatableBonds: integer("rotatable_bonds"),
	aromaticRings: integer("aromatic_rings"),
	heavyAtoms: integer("heavy_atoms"),
	computedAt: timestamp("computed_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_canonical_inchikey").using("btree", table.inchikey.asc().nullsLast().op("text_ops")),
	index("idx_canonical_mol_gist").using("gist", table.mol.asc().nullsLast().op("gist_mol_ops")),
	index("idx_canonical_mw").using("btree", table.molecularWeight.asc().nullsLast().op("float8_ops")),
	unique("canonical_structures_canonical_smiles_key").on(table.canonicalSmiles),
]);

export const inputToCanonicalInGold = gold.table("input_to_canonical", {
	inputSmiles: text("input_smiles").primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	canonicalId: bigint("canonical_id", { mode: "number" }).notNull(),
	insertedAt: timestamp("inserted_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_itc_canonical_id").using("btree", table.canonicalId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.canonicalId],
			foreignColumns: [canonicalStructuresInGold.canonicalId],
			name: "input_to_canonical_canonical_id_fkey"
		}),
]);

export const lipidMetadataInGold = gold.table("lipid_metadata", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	compoundId: bigint("compound_id", { mode: "number" }).primaryKey().notNull(),
	lipidClassificationLevel: varchar("lipid_classification_level", { length: 100 }),
	lipidParent: varchar("lipid_parent", { length: 255 }),
	lipidComponents: text("lipid_components"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.compoundId],
			foreignColumns: [compoundsInGold.compoundId],
			name: "lipid_metadata_compound_id_fkey"
		}).onDelete("cascade"),
]);

export const sourceDatabasesInGold = gold.table("source_databases", {
	databaseId: serial("database_id").primaryKey().notNull(),
	databaseName: varchar("database_name", { length: 50 }).notNull(),
	databaseUrl: varchar("database_url", { length: 255 }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("source_databases_database_name_key").on(table.databaseName),
]);

export const drugMetadataInGold = gold.table("drug_metadata", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	compoundId: bigint("compound_id", { mode: "number" }).primaryKey().notNull(),
	approvalPhase: varchar("approval_phase", { length: 50 }),
	approvalYear: integer("approval_year"),
	atcCodes: text("atc_codes").array(),
	indications: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.compoundId],
			foreignColumns: [compoundsInGold.compoundId],
			name: "drug_metadata_compound_id_fkey"
		}).onDelete("cascade"),
]);

export const compoundsInGold = gold.table("compounds", {
	compoundId: bigserial("compound_id", { mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	canonicalId: bigint("canonical_id", { mode: "number" }),
	isDrug: boolean("is_drug").default(false),
	isLipid: boolean("is_lipid").default(false),
	isMetabolite: boolean("is_metabolite").default(false),
	loadedAt: timestamp("loaded_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_compounds_canonical_id").using("btree", table.canonicalId.asc().nullsLast().op("int8_ops")),
	index("idx_compounds_drugs").using("btree", table.compoundId.asc().nullsLast().op("int8_ops")).where(sql`(is_drug = true)`),
	foreignKey({
			columns: [table.canonicalId],
			foreignColumns: [canonicalStructuresInGold.canonicalId],
			name: "compounds_canonical_id_fkey"
		}),
	unique("compounds_canonical_id_key").on(table.canonicalId),
]);

export const compoundIdentifiersInGold = gold.table("compound_identifiers", {
	identifierId: bigserial("identifier_id", { mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	compoundId: bigint("compound_id", { mode: "number" }).notNull(),
	identifierType: varchar("identifier_type", { length: 50 }).notNull(),
	identifierValue: text("identifier_value").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_identifiers_type_value").using("btree", table.identifierType.asc().nullsLast().op("text_ops"), table.identifierValue.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.compoundId],
			foreignColumns: [compoundsInGold.compoundId],
			name: "compound_identifiers_compound_id_fkey"
		}).onDelete("cascade"),
	unique("compound_identifiers_compound_id_identifier_type_identifier_key").on(table.compoundId, table.identifierType, table.identifierValue),
]);

export const compoundPublicationsInGold = gold.table("compound_publications", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	compoundId: bigint("compound_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pmid: bigint({ mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.compoundId],
			foreignColumns: [compoundsInGold.compoundId],
			name: "compound_publications_compound_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.compoundId, table.pmid], name: "compound_publications_pkey"}),
]);

export const compoundSourceDatabasesInGold = gold.table("compound_source_databases", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	compoundId: bigint("compound_id", { mode: "number" }).notNull(),
	databaseId: integer("database_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.compoundId],
			foreignColumns: [compoundsInGold.compoundId],
			name: "compound_source_databases_compound_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.databaseId],
			foreignColumns: [sourceDatabasesInGold.databaseId],
			name: "compound_source_databases_database_id_fkey"
		}),
	primaryKey({ columns: [table.compoundId, table.databaseId], name: "compound_source_databases_pkey"}),
]);
