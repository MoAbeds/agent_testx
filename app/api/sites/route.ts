import { NextRequest, NextResponse } from 'next/server';
import { createSite } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { domain, userId } = await request.json();

    if (!domain || !userId) {
      console.error('[API] Missing domain or userId');
      return NextResponse.json(
        { error: 'Domain and userId are required' },
        { status: 400 }
      );
    }

    // Normalize domain
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .toLowerCase();

    // Create the site in Firestore
    const { id, apiKey } = await createSite(userId, normalizedDomain);

    return NextResponse.json({ 
      site: {
        id,
        domain: normalizedDomain,
      },
      apiKey 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: `Failed to create site: ${error.message || 'Unknown Firestore error'}` },
      { status: 500 }
    );
  }
}
