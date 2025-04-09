"use server";

import { db } from "@/db";
import { annotations } from "@/db/drizzle/schema";
import { eq, or } from "drizzle-orm";
import { sql } from "drizzle-orm";


export async function getProteinAnnotations(query: string) {
  query = query.trim().toUpperCase();
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
          eq(annotations.genesymbol, query),
          eq(annotations.uniprot, query)
        )
      )  
    return {
      annotations: results,
    };
  }
  
  export type GetProteinAnnotationsResponse = Awaited<
    ReturnType<typeof getProteinAnnotations>
  >;