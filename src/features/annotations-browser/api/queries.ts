"use server";

import { db } from "@/db";
import { annotations } from "@/db/drizzle/schema";
import { eq, or } from "drizzle-orm";
import { sql } from "drizzle-orm";


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
          eq(sql`lower(${annotations.genesymbol})`, query.toLowerCase()),
          eq(sql`lower(${annotations.uniprot})`, query.toLowerCase())
        )
      )  
    return {
      annotations: results,
    };
  }
  
  export type GetProteinAnnotationsResponse = Awaited<
    ReturnType<typeof getProteinAnnotations>
  >;