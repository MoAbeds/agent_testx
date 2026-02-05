import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!db) return NextResponse.json([]);

    // 1. Get user's sites first to ensure isolation
    const sitesQuery = query(collection(db, "sites"), where("userId", "==", userId));
    const sitesSnap = await getDocs(sitesQuery);
    const siteIds = sitesSnap.docs.map(doc => doc.id);

    if (siteIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch events ONLY for these sites
    // Firestore 'in' operator handles up to 30 items
    const q = query(
      collection(db, "events"), 
      where("siteId", "in", siteIds.slice(0, 30)),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const rawEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      occurredAt: doc.data().occurredAt?.toDate?.() || new Date()
    }));

    // Sort in memory
    const events = rawEvents.sort((a: any, b: any) => b.occurredAt - a.occurredAt);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
