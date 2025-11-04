import { relations } from "drizzle-orm/relations";
import { entity, membershipEvidence, source, interactionEvidence, interaction, membership, entityToEvidence, entityEvidence, interactionToEvidence, membershipToEvidence, references, evidenceReference, entityIdentifiers, entityCompound, compound } from "./schema";

export const membershipEvidenceRelations = relations(membershipEvidence, ({one, many}) => ({
	entity_roleId: one(entity, {
		fields: [membershipEvidence.roleId],
		references: [entity.entityId],
		relationName: "membershipEvidence_roleId_entity_entityId"
	}),
	source: one(source, {
		fields: [membershipEvidence.sourceId],
		references: [source.id]
	}),
	entity_parentEntityId: one(entity, {
		fields: [membershipEvidence.parentEntityId],
		references: [entity.entityId],
		relationName: "membershipEvidence_parentEntityId_entity_entityId"
	}),
	entity_entityId: one(entity, {
		fields: [membershipEvidence.entityId],
		references: [entity.entityId],
		relationName: "membershipEvidence_entityId_entity_entityId"
	}),
	membershipToEvidences: many(membershipToEvidence),
	evidenceReferences: many(evidenceReference),
}));

export const entityRelations = relations(entity, ({one, many}) => ({
	membershipEvidences_roleId: many(membershipEvidence, {
		relationName: "membershipEvidence_roleId_entity_entityId"
	}),
	membershipEvidences_parentEntityId: many(membershipEvidence, {
		relationName: "membershipEvidence_parentEntityId_entity_entityId"
	}),
	membershipEvidences_entityId: many(membershipEvidence, {
		relationName: "membershipEvidence_entityId_entity_entityId"
	}),
	entity: one(entity, {
		fields: [entity.entityTypeId],
		references: [entity.entityId],
		relationName: "entity_entityTypeId_entity_entityId"
	}),
	entities: many(entity, {
		relationName: "entity_entityTypeId_entity_entityId"
	}),
	interactionEvidences_entityIdA: many(interactionEvidence, {
		relationName: "interactionEvidence_entityIdA_entity_entityId"
	}),
	interactionEvidences_entityIdB: many(interactionEvidence, {
		relationName: "interactionEvidence_entityIdB_entity_entityId"
	}),
	interactionEvidences_interactionTypeId: many(interactionEvidence, {
		relationName: "interactionEvidence_interactionTypeId_entity_entityId"
	}),
	interactionEvidences_detectionMethodId: many(interactionEvidence, {
		relationName: "interactionEvidence_detectionMethodId_entity_entityId"
	}),
	interactionEvidences_causalMechanismId: many(interactionEvidence, {
		relationName: "interactionEvidence_causalMechanismId_entity_entityId"
	}),
	interactionEvidences_causalStatementId: many(interactionEvidence, {
		relationName: "interactionEvidence_causalStatementId_entity_entityId"
	}),
	interactions_aId: many(interaction, {
		relationName: "interaction_aId_entity_entityId"
	}),
	interactions_bId: many(interaction, {
		relationName: "interaction_bId_entity_entityId"
	}),
	memberships_parentEntityId: many(membership, {
		relationName: "membership_parentEntityId_entity_entityId"
	}),
	memberships_entityId: many(membership, {
		relationName: "membership_entityId_entity_entityId"
	}),
	entityToEvidences: many(entityToEvidence),
	entityEvidences_entityTypeId: many(entityEvidence, {
		relationName: "entityEvidence_entityTypeId_entity_entityId"
	}),
	entityEvidences_entityId: many(entityEvidence, {
		relationName: "entityEvidence_entityId_entity_entityId"
	}),
	entityIdentifiers_idTypeId: many(entityIdentifiers, {
		relationName: "entityIdentifiers_idTypeId_entity_entityId"
	}),
	entityIdentifiers_entityId: many(entityIdentifiers, {
		relationName: "entityIdentifiers_entityId_entity_entityId"
	}),
	entityCompounds: many(entityCompound),
}));

export const sourceRelations = relations(source, ({many}) => ({
	membershipEvidences: many(membershipEvidence),
	interactionEvidences: many(interactionEvidence),
	entityToEvidences: many(entityToEvidence),
	interactionToEvidences: many(interactionToEvidence),
	entityEvidences: many(entityEvidence),
	membershipToEvidences: many(membershipToEvidence),
}));

export const interactionEvidenceRelations = relations(interactionEvidence, ({one, many}) => ({
	entity_entityIdA: one(entity, {
		fields: [interactionEvidence.entityIdA],
		references: [entity.entityId],
		relationName: "interactionEvidence_entityIdA_entity_entityId"
	}),
	entity_entityIdB: one(entity, {
		fields: [interactionEvidence.entityIdB],
		references: [entity.entityId],
		relationName: "interactionEvidence_entityIdB_entity_entityId"
	}),
	entity_interactionTypeId: one(entity, {
		fields: [interactionEvidence.interactionTypeId],
		references: [entity.entityId],
		relationName: "interactionEvidence_interactionTypeId_entity_entityId"
	}),
	entity_detectionMethodId: one(entity, {
		fields: [interactionEvidence.detectionMethodId],
		references: [entity.entityId],
		relationName: "interactionEvidence_detectionMethodId_entity_entityId"
	}),
	entity_causalMechanismId: one(entity, {
		fields: [interactionEvidence.causalMechanismId],
		references: [entity.entityId],
		relationName: "interactionEvidence_causalMechanismId_entity_entityId"
	}),
	entity_causalStatementId: one(entity, {
		fields: [interactionEvidence.causalStatementId],
		references: [entity.entityId],
		relationName: "interactionEvidence_causalStatementId_entity_entityId"
	}),
	source: one(source, {
		fields: [interactionEvidence.sourceId],
		references: [source.id]
	}),
	interactionToEvidences: many(interactionToEvidence),
	evidenceReferences: many(evidenceReference),
}));

export const interactionRelations = relations(interaction, ({one, many}) => ({
	entity_aId: one(entity, {
		fields: [interaction.aId],
		references: [entity.entityId],
		relationName: "interaction_aId_entity_entityId"
	}),
	entity_bId: one(entity, {
		fields: [interaction.bId],
		references: [entity.entityId],
		relationName: "interaction_bId_entity_entityId"
	}),
	interactionToEvidences: many(interactionToEvidence),
}));

export const membershipRelations = relations(membership, ({one, many}) => ({
	entity_parentEntityId: one(entity, {
		fields: [membership.parentEntityId],
		references: [entity.entityId],
		relationName: "membership_parentEntityId_entity_entityId"
	}),
	entity_entityId: one(entity, {
		fields: [membership.entityId],
		references: [entity.entityId],
		relationName: "membership_entityId_entity_entityId"
	}),
	membershipToEvidences: many(membershipToEvidence),
}));

export const entityToEvidenceRelations = relations(entityToEvidence, ({one}) => ({
	entity: one(entity, {
		fields: [entityToEvidence.entityId],
		references: [entity.entityId]
	}),
	entityEvidence: one(entityEvidence, {
		fields: [entityToEvidence.entityEvidenceId],
		references: [entityEvidence.id]
	}),
	source: one(source, {
		fields: [entityToEvidence.sourceId],
		references: [source.id]
	}),
}));

export const entityEvidenceRelations = relations(entityEvidence, ({one, many}) => ({
	entityToEvidences: many(entityToEvidence),
	source: one(source, {
		fields: [entityEvidence.sourceId],
		references: [source.id]
	}),
	entity_entityTypeId: one(entity, {
		fields: [entityEvidence.entityTypeId],
		references: [entity.entityId],
		relationName: "entityEvidence_entityTypeId_entity_entityId"
	}),
	entity_entityId: one(entity, {
		fields: [entityEvidence.entityId],
		references: [entity.entityId],
		relationName: "entityEvidence_entityId_entity_entityId"
	}),
	evidenceReferences: many(evidenceReference),
}));

export const interactionToEvidenceRelations = relations(interactionToEvidence, ({one}) => ({
	interaction: one(interaction, {
		fields: [interactionToEvidence.interactionId],
		references: [interaction.interactionId]
	}),
	interactionEvidence: one(interactionEvidence, {
		fields: [interactionToEvidence.interactionEvidenceId],
		references: [interactionEvidence.id]
	}),
	source: one(source, {
		fields: [interactionToEvidence.sourceId],
		references: [source.id]
	}),
}));

export const membershipToEvidenceRelations = relations(membershipToEvidence, ({one}) => ({
	membership: one(membership, {
		fields: [membershipToEvidence.membershipId],
		references: [membership.membershipId]
	}),
	membershipEvidence: one(membershipEvidence, {
		fields: [membershipToEvidence.membershipEvidenceId],
		references: [membershipEvidence.id]
	}),
	source: one(source, {
		fields: [membershipToEvidence.sourceId],
		references: [source.id]
	}),
}));

export const evidenceReferenceRelations = relations(evidenceReference, ({one}) => ({
	reference: one(references, {
		fields: [evidenceReference.referenceId],
		references: [references.id]
	}),
	entityEvidence: one(entityEvidence, {
		fields: [evidenceReference.entityEvidenceId],
		references: [entityEvidence.id]
	}),
	interactionEvidence: one(interactionEvidence, {
		fields: [evidenceReference.interactionEvidenceId],
		references: [interactionEvidence.id]
	}),
	membershipEvidence: one(membershipEvidence, {
		fields: [evidenceReference.membershipEvidenceId],
		references: [membershipEvidence.id]
	}),
}));

export const referencesRelations = relations(references, ({many}) => ({
	evidenceReferences: many(evidenceReference),
}));

export const entityIdentifiersRelations = relations(entityIdentifiers, ({one}) => ({
	entity_idTypeId: one(entity, {
		fields: [entityIdentifiers.idTypeId],
		references: [entity.entityId],
		relationName: "entityIdentifiers_idTypeId_entity_entityId"
	}),
	entity_entityId: one(entity, {
		fields: [entityIdentifiers.entityId],
		references: [entity.entityId],
		relationName: "entityIdentifiers_entityId_entity_entityId"
	}),
}));

export const entityCompoundRelations = relations(entityCompound, ({one}) => ({
	entity: one(entity, {
		fields: [entityCompound.entityId],
		references: [entity.entityId]
	}),
	compound: one(compound, {
		fields: [entityCompound.compoundId],
		references: [compound.id]
	}),
}));

export const compoundRelations = relations(compound, ({many}) => ({
	entityCompounds: many(entityCompound),
}));