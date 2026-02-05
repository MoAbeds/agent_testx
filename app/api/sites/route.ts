import { NextRequest, NextResponse } from 'next/server';
import { createSite } from '@/lib/db';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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

    // 1. Check if site already exists for this user
    const sitesQuery = query(
      collection(db, "sites"), 
      where("userId", "==", userId),
      where("domain", "==", normalizedDomain)
    );
    const existingSites = await getDocs(sitesQuery);
    
    if (!existingSites.empty) {
      return NextResponse.json(
        { error: 'This site has already been added to your account.' },
        { status: 400 }
      );
    }

    // Create the site in Firestore
    const { id, apiKey } = await createSite(userId, normalizedDomain);

    // Detect platform
    let platform: 'wordpress' | 'nextjs' | 'other' = 'other';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      // Try HTTPS first, then fallback to HTTP
      let response = await fetch(`https://${normalizedDomain}`, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'MojoBot/1.0' }
      }).catch(() => null);

      if (!response) {
        response = await fetch(`http://${normalizedDomain}`, { 
          signal: controller.signal,
          headers: { 'User-Agent': 'MojoBot/1.0' }
        }).catch(() => null);
      }
      
      if (response) {
        const text = (await response.text()).toLowerCase();
        const headers = Object.fromEntries(
          Array.from(response.headers.entries()).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()])
        );
        
        const isWP = text.includes('wp-content') || 
                     text.includes('wp-includes') || 
                     text.includes('wp-json') ||
                     headers['x-powered-by']?.includes('wordpress') ||
                     headers['link']?.includes('wp-json');

        const isNext = text.includes('_next/static') || 
                       text.includes('__next_data__') ||
                       headers['x-powered-by']?.includes('next.js');

        if (isWP) {
          platform = 'wordpress';
        } else if (isNext) {
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
