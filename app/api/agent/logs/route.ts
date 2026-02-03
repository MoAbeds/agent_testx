import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageNum = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 50;

    if (!db) return NextResponse.json({ error: 'Firestore not initialized' }, { status: 500 });

    // 1. Fetch sites for domain mapping
    const sitesSnap = await getDocs(collection(db, "sites"));
    const sitesMap: Record<string, string> = {};
    sitesSnap.forEach(doc => {
      sitesMap[doc.id] = doc.data().domain;
    });

    // 2. Fetch events
    const q = query(collection(db, "events"), limit(200));
    const snapshot = await getDocs(q);
    
    const allLogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      domain: sitesMap[(doc.data() as any).siteId] || 'unknown',
      occurredAt: (doc.data() as any).occurredAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));

    // 3. In-memory sort to avoid index requirement
    const sortedLogs = allLogs.sort((a: any, b: any) => 
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

    // 4. Pagination
    const start = (pageNum - 1) * pageSize;
    const paginatedLogs = sortedLogs.slice(start, start + pageSize);

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: sortedLogs.length,
        totalPages: Math.ceil(sortedLogs.length / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
