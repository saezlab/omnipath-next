import { getProteinAnnotations } from "@/features/annotations-browser/api/queries"
import { resolveIdentifiers } from "@/lib/search-utils"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const species = searchParams.get('species') || '9606'
    
    if (!query) {
      return NextResponse.json({ annotations: [] })
    }

    // Resolve identifiers using utility function
    const { resolvedIdentifiers } = await resolveIdentifiers(query, species)
    
    if (resolvedIdentifiers.length === 0) {
      return NextResponse.json({ annotations: [] })
    }

    // Fetch annotations data
    const data = await getProteinAnnotations(resolvedIdentifiers)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error in annotations API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch annotations data' },
      { status: 500 }
    )
  }
}