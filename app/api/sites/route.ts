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

    // Detect platform
    let platform: 'wordpress' | 'nextjs' | 'other' = 'other';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://${normalizedDomain}`, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'MojoBot/1.0' }
      }).catch(() => null);
      
      if (response) {
        const text = await response.text();
        const headers = Object.fromEntries(response.headers.entries());
        
        if (text.includes('wp-content') || text.includes('wp-includes') || headers['x-powered-by']?.toLowerCase().includes('wordpress')) {
          platform = 'wordpress';
        } else if (text.includes('_next/static') || headers['x-powered-by']?.toLowerCase().includes('next.js')) {
          platform = 'nextjs';
        }
      }
      clearTimeout(timeoutId);
    } catch (e) {
      console.error('Platform detection failed:', e);
    }

    return NextResponse.json({ 
      site: {
        id,
        domain: normalizedDomain,
        platform
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
