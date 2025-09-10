import { getIntercellData } from "@/features/intercell-browser/api/queries"
import { resolveIdentifiers } from "@/lib/search-utils"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const species = searchParams.get('species') || '9606'
    
    if (!query) {
      return NextResponse.json({ intercellEntries: [] })
    }

    // Resolve identifiers using utility function
    const { resolvedIdentifiers } = await resolveIdentifiers(query, species)
    
    if (resolvedIdentifiers.length === 0) {
      return NextResponse.json({ intercellEntries: [] })
    }

    // Fetch intercell data
    const data = await getIntercellData(resolvedIdentifiers)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in intercell API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intercell data' },
      { status: 500 }
    )
  }
}