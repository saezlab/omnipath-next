import { relations } from "drizzle-orm/relations";
import { canonicalStructuresInGold, inputToCanonicalInGold, compoundsInGold, lipidMetadataInGold, drugMetadataInGold, compoundIdentifiersInGold, compoundPublicationsInGold, compoundSourceDatabasesInGold, sourceDatabasesInGold } from "./schema";

export const inputToCanonicalInGoldRelations = relations(inputToCanonicalInGold, ({one}) => ({
	canonicalStructuresInGold: one(canonicalStructuresInGold, {
		fields: [inputToCanonicalInGold.canonicalId],
		references: [canonicalStructuresInGold.canonicalId]
	}),
}));

export const canonicalStructuresInGoldRelations = relations(canonicalStructuresInGold, ({many}) => ({
	inputToCanonicalInGolds: many(inputToCanonicalInGold),
	compoundsInGolds: many(compoundsInGold),
}));

export const lipidMetadataInGoldRelations = relations(lipidMetadataInGold, ({one}) => ({
	compoundsInGold: one(compoundsInGold, {
		fields: [lipidMetadataInGold.compoundId],
		references: [compoundsInGold.compoundId]
	}),
}));

export const compoundsInGoldRelations = relations(compoundsInGold, ({one, many}) => ({
	lipidMetadataInGolds: many(lipidMetadataInGold),
	drugMetadataInGolds: many(drugMetadataInGold),
	canonicalStructuresInGold: one(canonicalStructuresInGold, {
		fields: [compoundsInGold.canonicalId],
		references: [canonicalStructuresInGold.canonicalId]
	}),
	compoundIdentifiersInGolds: many(compoundIdentifiersInGold),
	compoundPublicationsInGolds: many(compoundPublicationsInGold),
	compoundSourceDatabasesInGolds: many(compoundSourceDatabasesInGold),
}));

export const drugMetadataInGoldRelations = relations(drugMetadataInGold, ({one}) => ({
	compoundsInGold: one(compoundsInGold, {
		fields: [drugMetadataInGold.compoundId],
		references: [compoundsInGold.compoundId]
	}),
}));

export const compoundIdentifiersInGoldRelations = relations(compoundIdentifiersInGold, ({one}) => ({
	compoundsInGold: one(compoundsInGold, {
		fields: [compoundIdentifiersInGold.compoundId],
		references: [compoundsInGold.compoundId]
	}),
}));

export const compoundPublicationsInGoldRelations = relations(compoundPublicationsInGold, ({one}) => ({
	compoundsInGold: one(compoundsInGold, {
		fields: [compoundPublicationsInGold.compoundId],
		references: [compoundsInGold.compoundId]
	}),
}));

export const compoundSourceDatabasesInGoldRelations = relations(compoundSourceDatabasesInGold, ({one}) => ({
	compoundsInGold: one(compoundsInGold, {
		fields: [compoundSourceDatabasesInGold.compoundId],
		references: [compoundsInGold.compoundId]
	}),
	sourceDatabasesInGold: one(sourceDatabasesInGold, {
		fields: [compoundSourceDatabasesInGold.databaseId],
		references: [sourceDatabasesInGold.databaseId]
	}),
}));

export const sourceDatabasesInGoldRelations = relations(sourceDatabasesInGold, ({many}) => ({
	compoundSourceDatabasesInGolds: many(compoundSourceDatabasesInGold),
}));