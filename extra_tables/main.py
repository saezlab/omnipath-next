#!/usr/bin/env python

import pathlib as pl

import pandas as pd

from pypath.inputs import uniprot
from pypath.inputs import genecards
from pypath.utils import uniprot as uniprot_datasheet


ORGANISMS = [9606, 10090, 10116]


def main(
        uniprot_desc: bool = False,
        genecards_desc: bool = False,
    ) -> None:

    args = locals()
    script_dir = pl.Path(__file__).parent
    out_dir = script_dir / 'out'
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / 'protein_info.csv'

    pd.concat([load(organism, **args) for organism in ORGANISMS]).to_csv(path)


def load(
        organism: int = 9606,
        uniprot_desc: bool = False,
        genecards_desc: bool = False,
    ) -> pd.DataFrame:

    result = uniprot.uniprot_query(
        f'organism_id:{organism}',
        # see all fields here:
        # https://www.uniprot.org/help/return_fields
        fields = [
            "accession",
            "protein_name",
            "gene_primary",
            "gene_synonym",
            "length",
            "mass",
            "keyword",
            "sequence",
            "ec",
            "cc_disease",
            "ft_transmem",
            "protein_families",
            "xref_refseq",
            "xref_pdb",
            "xref_alphafolddb",
            "xref_chembl",
            "xref_phosphositeplus",
            "xref_ensembl",
            "xref_kegg",
            "xref_signor",
        ],
    )

    result = pd.DataFrame(result)

    if uniprot_desc:

        result.uniprot_desc = [
            uniprot_utils.function(ac) for ac in result.accession
        ]

    if genecards_desc:

        empty = {'UniProt': None, 'NCBI': None, 'GeneCards': None}

        gc_data = [
            {**(genecards.genecards_summaries(ac) or empty), 'accession': ac}
            for ac in result.accession
        ]
        gc_data = pd.DataFrame(gc_data)

        result = pd.merge(result, gc_data, on = 'accession', how = 'left')

    return result


if __name__ == "__main__":

    main()
