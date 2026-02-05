import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { siteId, keyword } = await request.json();

    if (!siteId || !keyword) {
      return NextResponse.json({ error: 'siteId and keyword are required' }, { status: 400 });
    }

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    const site = siteSnap.data();
    const targetDomain = site.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const serperKey = process.env.SERPER_API_KEY;
    if (!serperKey) {
      return NextResponse.json({ error: 'SERPER_API_KEY is not configured' }, { status: 500 });
    }

    // Fetch SERP from Serper.dev
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: keyword, gl: 'us', hl: 'en', num: 100 },
      { headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' } }
    );

    const organic = response.data.organic || [];
    let position = -1;

    // Map results and find position
    const results = organic.map((item: any, index: number) => {
      const isMine = item.link.includes(targetDomain);
      if (isMine && position === -1) {
        position = index + 1;
      }
      return {
        position: index + 1,
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        isMine
      };
    });

    return NextResponse.json({
      success: true,
      keyword,
      position,
      results: results.slice(0, 50), // Show top 50
      metadata: {
        totalResults: response.data.searchParameters?.totalResults || 0,
        timeTaken: response.data.searchParameters?.timeTaken || 0
      }
    });

  } catch (error: any) {
    console.error('SERP Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch SERP data' }, { status: 500 });
  }
}
