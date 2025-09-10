import { getComplexesData } from "@/features/complexes-browser/api/queries"
import { resolveIdentifiers } from "@/lib/search-utils"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const species = searchParams.get('species') || '9606'
    
    if (!query) {
      return NextResponse.json({ complexEntries: [] })
    }

    // Resolve identifiers using utility function
    const { resolvedIdentifiers } = await resolveIdentifiers(query, species)
    
    if (resolvedIdentifiers.length === 0) {
      return NextResponse.json({ complexEntries: [] })
    }

    // Fetch complexes data
    const data = await getComplexesData(resolvedIdentifiers)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in complexes API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch complexes data' },
      { status: 500 }
    )
  }
}