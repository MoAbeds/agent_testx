import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!db) return NextResponse.json([]);

    const q = query(
      collection(db, "events"), 
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const rawEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      occurredAt: doc.data().occurredAt?.toDate?.() || new Date()
    }));

    // Sort in memory to avoid index requirements
    const events = rawEvents.sort((a: any, b: any) => b.occurredAt - a.occurredAt);

    if (events.length === 0) {
      return NextResponse.json([
        {
          id: 'init',
          type: 'INFO',
          path: 'System',
          details: JSON.stringify({ message: 'System initialized. Waiting for agent traffic...' }),
          occurredAt: new Date(),
        }
      ]);
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
