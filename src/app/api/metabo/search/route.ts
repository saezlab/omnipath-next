import { NextRequest, NextResponse } from 'next/server';
import {
  searchCompounds,
  searchCompoundByEntityId,
  searchCompoundsBySubstructure,
  searchCompoundsBySimilarity,
  SearchFilters
} from '@/db/metabo/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const entityId = searchParams.get('entityId');
    const mode = searchParams.get('mode') || 'text'; // text, substructure, similarity
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
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

    const lipinskiCompliant = searchParams.get('lipinskiCompliant');
    if (lipinskiCompliant) filters.lipinskiCompliant = lipinskiCompliant === 'true';

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    let results;

    // Fast path: if we have entityId from autocomplete selection
    if (entityId) {
      results = await searchCompoundByEntityId(entityId);
    } else {
      switch (mode) {
        case 'substructure':
          results = await searchCompoundsBySubstructure(query, limit, offset, filters);
          break;
        case 'similarity':
          results = await searchCompoundsBySimilarity(query, threshold, limit, offset, filters);
          break;
        case 'text':
        default:
          results = await searchCompounds(query, limit, offset, filters);
          break;
      }
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