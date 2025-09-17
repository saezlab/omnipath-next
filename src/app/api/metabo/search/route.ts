import { NextRequest, NextResponse } from 'next/server';
import {
  searchCompounds,
  searchCompoundsBySubstructure,
  searchCompoundsBySimilarity,
  SearchFilters
} from '@/db/metabo/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const mode = searchParams.get('mode') || 'text'; // text, substructure, similarity
    const limit = parseInt(searchParams.get('limit') || '20');
    const threshold = parseFloat(searchParams.get('threshold') || '0.7'); // for similarity search

    // Parse filters
    const filters: SearchFilters = {};

    const molWeightMin = searchParams.get('molWeightMin');
    if (molWeightMin) filters.molecularWeightMin = parseFloat(molWeightMin);

    const molWeightMax = searchParams.get('molWeightMax');
    if (molWeightMax) filters.molecularWeightMax = parseFloat(molWeightMax);

    const logpMin = searchParams.get('logpMin');
    if (logpMin) filters.logpMin = parseFloat(logpMin);

    const logpMax = searchParams.get('logpMax');
    if (logpMax) filters.logpMax = parseFloat(logpMax);

    const isDrug = searchParams.get('isDrug');
    if (isDrug) filters.isDrug = isDrug === 'true';

    const isLipid = searchParams.get('isLipid');
    if (isLipid) filters.isLipid = isLipid === 'true';

    const isMetabolite = searchParams.get('isMetabolite');
    if (isMetabolite) filters.isMetabolite = isMetabolite === 'true';

    const lipinskiCompliant = searchParams.get('lipinskiCompliant');
    if (lipinskiCompliant) filters.lipinskiCompliant = lipinskiCompliant === 'true';

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    let results;

    switch (mode) {
      case 'substructure':
        results = await searchCompoundsBySubstructure(query, limit, filters);
        break;
      case 'similarity':
        results = await searchCompoundsBySimilarity(query, threshold, limit, filters);
        break;
      case 'text':
      default:
        results = await searchCompounds(query, limit, filters);
        break;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in metabo search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}