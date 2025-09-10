import { searchProteinNeighbors } from "@/features/interactions-browser/api/queries"
import { resolveIdentifiers } from "@/lib/search-utils"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const species = searchParams.get('species') || '9606'
    
    if (!query) {
      return NextResponse.json({ interactions: [] })
    }

    // Resolve identifiers using utility function
    const { resolvedIdentifiers } = await resolveIdentifiers(query, species)
    
    if (resolvedIdentifiers.length === 0) {
      return NextResponse.json({ interactions: [] })
    }

    // Fetch interactions data
    const data = await searchProteinNeighbors(resolvedIdentifiers)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in interactions API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interactions data' },
      { status: 500 }
    )
  }
}