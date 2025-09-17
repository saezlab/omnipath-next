import { NextRequest, NextResponse } from 'next/server';
import { getCompoundAutocomplete } from '@/db/metabo/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim() || query.length < 2) {
      return NextResponse.json([]);
    }

    const results = await getCompoundAutocomplete(query, limit);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in metabo autocomplete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}