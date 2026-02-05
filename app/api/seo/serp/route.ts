import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

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

    // 📈 LOG RANK HISTORY
    await addDoc(collection(db, "rank_history"), {
      siteId,
      keyword,
      position: position > 0 ? position : 101, // 101 represents "off the charts"
      timestamp: serverTimestamp()
    });

    // Fetch last 10 historical points for the chart
    // SECURITY: We fetch without complex sorting to avoid mandatory composite index errors in production
    const historyQ = query(
      collection(db, "rank_history"),
      where("siteId", "==", siteId),
      where("keyword", "==", keyword),
      limit(20)
    );
    const historySnap = await getDocs(historyQ);
    const history = historySnap.docs
      .map(d => ({
        position: d.data().position,
        timestamp: d.data().timestamp?.seconds || 0,
        date: d.data().timestamp?.toDate?.()?.toLocaleDateString() || 'Just now'
      }))
      .sort((a, b) => a.timestamp - b.timestamp) // Sort in memory
      .slice(-10); // Take latest 10

    return NextResponse.json({
      success: true,
      keyword,
      position,
      history,
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
