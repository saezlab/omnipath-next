import { NextRequest, NextResponse } from 'next/server';
import { getCompoundPublications } from '@/db/metabo/queries';
import { CompoundLiteratureResponse, PubMedPublication } from '@/features/metabo/types';

const PUBMED_TOOL = process.env.NCBI_TOOL || 'omnipath-next';
const PUBMED_EMAIL = process.env.NCBI_EMAIL;

async function fetchPubMedSummaries(pmids: string[]): Promise<PubMedPublication[]> {
  if (pmids.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    db: 'pubmed',
    id: pmids.join(','),
    retmode: 'json',
    tool: PUBMED_TOOL,
  });

  if (PUBMED_EMAIL) {
    params.set('email', PUBMED_EMAIL);
  }

  const response = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    // We prefer fresh data because the compound references might evolve
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`PubMed ESummary request failed with status ${response.status}`);
  }

  const data = await response.json();
  const result = data?.result ?? {};

  return pmids.map((pmid) => {
    const entry = result[pmid];
    const authors = Array.isArray(entry?.authors)
      ? entry.authors
          .map((author: { name?: string }) => author?.name)
          .filter((name: string | undefined): name is string => Boolean(name))
      : [];
    const articleIds = Array.isArray(entry?.articleids) ? entry.articleids : [];
    const doi = articleIds.find((idObj: { idtype?: string }) => idObj?.idtype === 'doi')?.value ?? null;

    const publicationDate = entry?.sortpubdate || entry?.pubdate || null;

    return {
      pmid,
      title: entry?.title ?? null,
      journal: entry?.fulljournalname ?? entry?.source ?? null,
      publicationDate,
      authors,
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    } satisfies PubMedPublication;
  });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Compound ID is required' }, { status: 400 });
    }

    const pubmedIds = await getCompoundPublications(id);
    let publications: PubMedPublication[] = [];

    if (pubmedIds.length > 0) {
      try {
        publications = await fetchPubMedSummaries(pubmedIds);
      } catch (summaryError) {
        console.error('Error fetching PubMed summaries:', summaryError);
      }
    }

    const payload: CompoundLiteratureResponse = {
      pubmedIds,
      publications,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching compound publications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
