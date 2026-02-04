import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const userId = searchParams.get('userId');

    if (!siteId) {
      return NextResponse.json({ events: [], message: "No siteId" });
    }

    // Server-side filtering
    const q = query(
      collection(db, "events"),
      where("siteId", "==", siteId),
      limit(50)
    );

    const snap = await getDocs(q);
    const events = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a: any, b: any) => {
      const tA = a.occurredAt?.seconds || 0;
      const tB = b.occurredAt?.seconds || 0;
      return tB - tA;
    });

    return NextResponse.json({ 
      success: true,
      events: events 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
