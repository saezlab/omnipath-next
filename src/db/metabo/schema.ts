import { pgTable, foreignKey, bigint, doublePrecision, varchar, integer, json, index, smallint, text, primaryKey, customType} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


// Custom type for PostgreSQL mol type (RDKit)
const mol = customType<{ data: string; notNull: false; default: false }>({
  dataType() {
    return "mol";
  },
});
const bfp = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
	return "bfp";
  },
});


export const membershipEvidence = pgTable("membership_evidence", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	stoichiometry: doublePrecision(),
	parentIdentifier: varchar("parent_identifier"),
	parentIdentifierType: varchar("parent_identifier_type"),
	sourceId: integer("source_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentEntityId: bigint("parent_entity_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityId: bigint("entity_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	roleId: bigint("role_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [entity.entityId],
			name: "fk_membership_evidence_role_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [source.id],
			name: "fk_membership_evidence_source_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.parentEntityId],
			foreignColumns: [entity.entityId],
			name: "fk_membership_evidence_parent_entity_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entity.entityId],
			name: "fk_membership_evidence_entity_id"
		}).onDelete("restrict"),
]);

export const entity = pgTable("entity", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityId: bigint("entity_id", { mode: "number" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityTypeId: bigint("entity_type_id", { mode: "number" }),
	sourceIds: integer("source_ids").array(),
	sourceCount: integer("source_count"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityEvidenceIds: bigint("entity_evidence_ids", { mode: "number" }).array(),
	annotationUnion: json("annotation_union"),
	memberCount: integer("member_count"),
	parentCount: integer("parent_count"),
}, (table) => [
	foreignKey({
			columns: [table.entityTypeId],
			foreignColumns: [table.entityId],
			name: "fk_entity_entity_type_id"
		}).onDelete("restrict"),
]);

export const references = pgTable("references", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	type: varchar(),
	value: varchar(),
});

export const interactionEvidence = pgTable("interaction_evidence", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	sourceId: integer("source_id"),
	sentence: varchar(),
	interactionAnnotations: json("interaction_annotations"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityIdA: bigint("entity_id_a", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityIdB: bigint("entity_id_b", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	interactionTypeId: bigint("interaction_type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	detectionMethodId: bigint("detection_method_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	causalMechanismId: bigint("causal_mechanism_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	causalStatementId: bigint("causal_statement_id", { mode: "number" }),
}, (table) => [
	index("idx_interaction_evidence_source_id").using("btree", table.sourceId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.entityIdA],
			foreignColumns: [entity.entityId],
			name: "fk_interaction_evidence_entity_id_a"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.entityIdB],
			foreignColumns: [entity.entityId],
			name: "fk_interaction_evidence_entity_id_b"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.interactionTypeId],
			foreignColumns: [entity.entityId],
			name: "fk_interaction_evidence_interaction_type_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.detectionMethodId],
			foreignColumns: [entity.entityId],
			name: "fk_interaction_evidence_detection_method_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.causalMechanismId],
			foreignColumns: [entity.entityId],
			name: "fk_interaction_evidence_causal_mechanism_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.causalStatementId],
			foreignColumns: [entity.entityId],
			name: "fk_interaction_evidence_causal_statement_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [source.id],
			name: "fk_interaction_evidence_source_id"
		}).onDelete("restrict"),
]);

export const interaction = pgTable("interaction", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	interactionId: bigint("interaction_id", { mode: "number" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	aId: bigint("a_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bId: bigint("b_id", { mode: "number" }),
	dirCode: smallint("dir_code"),
	signCode: smallint("sign_code"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	interactionEvidenceIds: bigint("interaction_evidence_ids", { mode: "number" }).array(),
	sourceIds: integer("source_ids").array(),
	sourceCount: integer("source_count"),
	evidenceCount: integer("evidence_count"),
}, (table) => [
	index("idx_interaction_a_id_inc").using("btree", table.aId.asc().nullsLast().op("int8_ops"), table.interactionId.asc().nullsLast().op("int8_ops"), table.bId.asc().nullsLast().op("int8_ops"), table.evidenceCount.asc().nullsLast().op("int8_ops")),
	index("idx_interaction_b_id").using("btree", table.bId.asc().nullsLast().op("int8_ops")),
	index("idx_interaction_b_id_inc").using("btree", table.bId.asc().nullsLast().op("int8_ops"), table.interactionId.asc().nullsLast().op("int8_ops"), table.aId.asc().nullsLast().op("int8_ops"), table.evidenceCount.asc().nullsLast().op("int8_ops")),
	index("idx_interaction_evidence_desc").using("btree", table.evidenceCount.desc().nullsFirst().op("int8_ops"), table.interactionId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.aId],
			foreignColumns: [entity.entityId],
			name: "fk_interaction_a_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.bId],
			foreignColumns: [entity.entityId],
			name: "fk_interaction_b_id"
		}).onDelete("restrict"),
]);

export const source = pgTable("source", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	name: varchar(),
	url: varchar(),
	description: varchar(),
});

export const membership = pgTable("membership", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	membershipId: bigint("membership_id", { mode: "number" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentEntityId: bigint("parent_entity_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityId: bigint("entity_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	membershipEvidenceIds: bigint("membership_evidence_ids", { mode: "number" }).array(),
	sourceIds: integer("source_ids").array(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	roleIds: bigint("role_ids", { mode: "number" }).array(),
	stoichiometryValues: doublePrecision("stoichiometry_values").array(),
	sourceCount: integer("source_count"),
}, (table) => [
	index("idx_membership_entity_id").using("btree", table.entityId.asc().nullsLast().op("int8_ops")),
	index("idx_membership_parent_entity_id").using("btree", table.parentEntityId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.parentEntityId],
			foreignColumns: [entity.entityId],
			name: "fk_membership_parent_entity_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entity.entityId],
			name: "fk_membership_entity_id"
		}).onDelete("restrict"),
]);

export const entityToEvidence = pgTable("entity_to_evidence", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityId: bigint("entity_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityEvidenceId: bigint("entity_evidence_id", { mode: "number" }),
	sourceId: integer("source_id"),
}, (table) => [
	index("idx_entity_to_evidence_entity_source").using("btree", table.entityId.asc().nullsLast().op("int4_ops"), table.sourceId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entity.entityId],
			name: "fk_entity_to_evidence_entity_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.entityEvidenceId],
			foreignColumns: [entityEvidence.id],
			name: "fk_entity_to_evidence_entity_evidence_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [source.id],
			name: "fk_entity_to_evidence_source_id"
		}).onDelete("restrict"),
]);

export const interactionToEvidence = pgTable("interaction_to_evidence", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	interactionId: bigint("interaction_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	interactionEvidenceId: bigint("interaction_evidence_id", { mode: "number" }),
	sourceId: integer("source_id"),
}, (table) => [
	index("idx_interaction_to_evidence_int_source").using("btree", table.interactionId.asc().nullsLast().op("int4_ops"), table.sourceId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.interactionId],
			foreignColumns: [interaction.interactionId],
			name: "fk_interaction_to_evidence_interaction_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.interactionEvidenceId],
			foreignColumns: [interactionEvidence.id],
			name: "fk_interaction_to_evidence_interaction_evidence_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [source.id],
			name: "fk_interaction_to_evidence_source_id"
		}).onDelete("restrict"),
]);

export const entityEvidence = pgTable("entity_evidence", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	sourceId: integer("source_id"),
	annotations: json(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityId: bigint("entity_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityTypeId: bigint("entity_type_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [source.id],
			name: "fk_entity_evidence_source_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.entityTypeId],
			foreignColumns: [entity.entityId],
			name: "fk_entity_evidence_entity_type_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entity.entityId],
			name: "fk_entity_evidence_entity_id"
		}).onDelete("restrict"),
]);

export const membershipToEvidence = pgTable("membership_to_evidence", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	membershipId: bigint("membership_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	membershipEvidenceId: bigint("membership_evidence_id", { mode: "number" }),
	sourceId: integer("source_id"),
}, (table) => [
	index("idx_membership_to_evidence_mem_source").using("btree", table.membershipId.asc().nullsLast().op("int4_ops"), table.sourceId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.membershipId],
			foreignColumns: [membership.membershipId],
			name: "fk_membership_to_evidence_membership_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.membershipEvidenceId],
			foreignColumns: [membershipEvidence.id],
			name: "fk_membership_to_evidence_membership_evidence_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [source.id],
			name: "fk_membership_to_evidence_source_id"
		}).onDelete("restrict"),
]);

export const evidenceReference = pgTable("evidence_reference", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	referenceId: bigint("reference_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityEvidenceId: bigint("entity_evidence_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	interactionEvidenceId: bigint("interaction_evidence_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	membershipEvidenceId: bigint("membership_evidence_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.referenceId],
			foreignColumns: [references.id],
			name: "fk_evidence_reference_reference_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.entityEvidenceId],
			foreignColumns: [entityEvidence.id],
			name: "fk_evidence_reference_entity_evidence_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.interactionEvidenceId],
			foreignColumns: [interactionEvidence.id],
			name: "fk_evidence_reference_interaction_evidence_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.membershipEvidenceId],
			foreignColumns: [membershipEvidence.id],
			name: "fk_evidence_reference_membership_evidence_id"
		}).onDelete("restrict"),
]);

export const entityIdentifiers = pgTable("entity_identifiers", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityId: bigint("entity_id", { mode: "number" }),
	idValue: varchar("id_value"),
	sources: integer().array(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idTypeId: bigint("id_type_id", { mode: "number" }),
	idValueSmall: text("id_value_small").generatedAlwaysAs(sql`
CASE
    WHEN (octet_length((id_value)::text) <= 1000) THEN id_value
    ELSE NULL::character varying
END`),
}, (table) => [
	index("idx_entity_identifiers_entity_id").using("btree", table.entityId.asc().nullsLast().op("int8_ops")),
	index("idx_entity_identifiers_type_value").using("btree", table.idTypeId.asc().nullsLast().op("int8_ops"), table.idValue.asc().nullsLast().op("text_ops")).where(sql`(length((id_value)::text) < 1000)`),
	index("idx_entity_identifiers_type_value_prefix").using("btree", sql`id_type_id`, sql`"left"((id_value)::text, 255)`),
	index("idx_entity_identifiers_type_value_small").using("btree", table.idTypeId.asc().nullsLast().op("int8_ops"), table.idValueSmall.asc().nullsLast().op("int8_ops"), table.entityId.asc().nullsLast().op("text_pattern_ops"), table.idValue.asc().nullsLast().op("int8_ops")).where(sql`(id_value_small IS NOT NULL)`),
	index("idx_entity_identifiers_value_pattern").using("btree", table.idValue.asc().nullsLast().op("text_pattern_ops")).where(sql`(length((id_value)::text) < 1000)`),
	index("idx_entity_identifiers_value_small_pattern").using("btree", table.idValueSmall.asc().nullsLast().op("text_pattern_ops"), table.idTypeId.asc().nullsLast().op("text_pattern_ops"), table.entityId.asc().nullsLast().op("text_pattern_ops"), table.idValue.asc().nullsLast().op("text_pattern_ops")).where(sql`(id_value_small IS NOT NULL)`),
	foreignKey({
			columns: [table.idTypeId],
			foreignColumns: [entity.entityId],
			name: "fk_entity_identifiers_id_type_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entity.entityId],
			name: "fk_entity_identifiers_entity_id"
		}).onDelete("restrict"),
]);

export const compound = pgTable("compound", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().notNull(),
	structureKey: varchar("structure_key"),
	canonicalSmiles: varchar("canonical_smiles"),
	inchi: varchar(),
	formula: varchar(),
	molecularWeight: doublePrecision("molecular_weight"),
	exactMass: doublePrecision("exact_mass"),
	tpsa: doublePrecision(),
	logp: doublePrecision(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	hbd: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	hba: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	rotatableBonds: bigint("rotatable_bonds", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	aromaticRings: bigint("aromatic_rings", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	heavyAtoms: bigint("heavy_atoms", { mode: "number" }),
	// TODO: failed to parse database type 'mol'
	mol: mol("mol"),
	// TODO: failed to parse database type 'bfp'
	morganFp: bfp("morgan_fp"),
}, (table) => [
	index("idx_compound_mol_gist").using("gist", table.mol.asc().nullsLast().op("gist_mol_ops")),
	index("idx_compound_morgan_fp_gist").using("gist", table.morganFp.asc().nullsLast().op("gist_bfp_ops")),
]);

export const entityCompound = pgTable("entity_compound", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	entityId: bigint("entity_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	compoundId: bigint("compound_id", { mode: "number" }).notNull(),
}, (table) => [
	index("idx_entity_compound_compound_id").using("btree", table.compoundId.asc().nullsLast().op("int8_ops")),
	index("idx_entity_compound_entity_id").using("btree", table.entityId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.entityId],
			foreignColumns: [entity.entityId],
			name: "fk_entity_compound_entity_id"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.compoundId],
			foreignColumns: [compound.id],
			name: "fk_entity_compound_compound_id"
		}).onDelete("restrict"),
	primaryKey({ columns: [table.entityId, table.compoundId], name: "pk_entity_compound"}),
]);
