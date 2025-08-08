# PubMed ID Lookup Task

## Objective
Look up and add PubMed IDs for resources in `src/data/resources-details.json` that currently don't have them.

## Current Status
- **Total resources**: 235
- **Missing PubMed IDs**: 189 resources (80%)
- **Target file**: `/Users/jschaul/Code/omnipath-next/src/data/resources-details.json`

## Priority Groups for Lookup

### Priority 1: Resources with Direct Article URLs (10 resources)
1. **TLR** - PMID: 16738560 ✓ (Found: "A comprehensive map of the toll-like receptor signaling network")
2. **WikiPathways** - Needs lookup
3. **MINT** - Needs lookup  
4. **Ataxia** - Needs lookup
5. **HSN (Human Signaling Network)** - Needs lookup
6. **CancerCellMap** - Needs lookup
7. **KEGG** - Needs lookup
8. **BioCarta** - Needs lookup
9. **Laudanna** - Needs lookup
10. **CST (Cell Signaling Technology)** - Needs lookup

### Priority 2: Well-known Major Databases (30+ resources)
- ENCODE, UniProt, ChEMBL, DrugBank, COSMIC, PDB, JASPAR, etc.

### Priority 3: Resource Variants/Families
- DoRothEA variants (DoRothEA, DoRothEA_A, DoRothEA_B, etc.)
- FANTOM variants (Fantom4, Fantom5, FANTOM)

## Task Assignment Strategy
1. Create 4 parallel subagents
2. Each agent handles 2-3 priority 1 resources + some priority 2 resources
3. Agents should return JSON format updates for easy merging

## JSON Format
Resources should have their `pubmeds` field updated like this:
```json
"resource_name": {
  "pubmeds": [
    12345678,
    87654321
  ]
}
```

## Notes
- Some resources may have multiple relevant publications
- Include primary/founding publications as priority
- Verify PubMed IDs are valid before adding