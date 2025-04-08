"use server";

import { db } from "@/db";
import { annotations } from "@/db/drizzle/schema";
import { ilike, or } from "drizzle-orm";


export async function getProteinAnnotations(query: string) {
    const results = await db
      .select({
        uniprot: annotations.uniprot,
        genesymbol: annotations.genesymbol,
        entityType: annotations.entityType,
        source: annotations.source,
        label: annotations.label,
        value: annotations.value,
        recordId: annotations.recordId
      })
      .from(annotations)
      .where(
        or(
          ilike(annotations.genesymbol, `%${query}%`),
          ilike(annotations.uniprot, `%${query}%`)
        )
      )
      .limit(1000);
  
    return {
      annotations: results,
    };
  }
  
  export type GetProteinAnnotationsResponse = Awaited<
    ReturnType<typeof getProteinAnnotations>
  >;