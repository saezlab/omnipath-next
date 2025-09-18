export interface PubMedPublication {
  pmid: string;
  title: string | null;
  journal: string | null;
  publicationDate: string | null;
  authors: string[];
  doi: string | null;
  url: string;
}

export interface CompoundLiteratureResponse {
  pubmedIds: string[];
  publications: PubMedPublication[];
}
