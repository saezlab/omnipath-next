import { relations } from "drizzle-orm/relations";
import { uniprotProteins, uniprotIdentifiers } from "./schema";

export const uniprotIdentifiersRelations = relations(uniprotIdentifiers, ({one}) => ({
	uniprotProtein: one(uniprotProteins, {
		fields: [uniprotIdentifiers.proteinId],
		references: [uniprotProteins.id]
	}),
}));

export const uniprotProteinsRelations = relations(uniprotProteins, ({many}) => ({
	uniprotIdentifiers: many(uniprotIdentifiers),
}));