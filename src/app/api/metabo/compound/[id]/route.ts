import { NextRequest, NextResponse } from 'next/server';
import { getCompoundByEntityId } from '@/db/metabo/queries';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'Compound ID is required' },
        { status: 400 }
      );
    }

    const compound = await getCompoundByEntityId(id);

    if (!compound) {
      return NextResponse.json(
        { error: 'Compound not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(compound);
  } catch (error) {
    console.error('Error fetching compound details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}