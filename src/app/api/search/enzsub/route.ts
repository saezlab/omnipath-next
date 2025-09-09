import { searchMultipleIdentifiers } from "@/db/queries"
import { getEnzSubData } from "@/features/enzsub-browser/api/queries"
import { NextRequest, NextResponse } from "next/server"

function parseQueries(queryString: string): string[] {
  return queryString
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const species = searchParams.get('species') || '9606'
    
    if (!query) {
      return NextResponse.json({ enzSubData: [] })
    }

    // First resolve identifiers
    const proteins = parseQueries(query)
    const results = await searchMultipleIdentifiers(proteins, 1, species)
    
    // Group results by protein
    const identifierResults: Record<string, any> = {}
    proteins.forEach((protein) => {
      const proteinResults = results.filter(result => 
        result.identifierValue.toLowerCase().includes(protein.trim().toLowerCase()) ||
        protein.trim().toLowerCase().includes(result.identifierValue.toLowerCase())
      )
      identifierResults[protein] = proteinResults
    })

    // Create flattened list
    const resolvedIdentifiers = Object.values(identifierResults).flat()
    
    if (resolvedIdentifiers.length === 0) {
      return NextResponse.json({ enzSubData: [] })
    }

    // Fetch enzyme-substrate data
    const data = await getEnzSubData(resolvedIdentifiers)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in enzsub API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enzyme-substrate data' },
      { status: 500 }
    )
  }
}