import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const userId = searchParams.get('userId');

    if (!siteId || !userId) {
      return NextResponse.json({ events: [], error: "MISSING_PARAMS" });
    }

    // 1. OWNERSHIP VERIFICATION (Server-Side)
    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    
    if (!siteSnap.exists()) {
      return NextResponse.json({ events: [], error: "SITE_NOT_FOUND" });
    }

    const siteData = siteSnap.data();
    if (siteData.userId !== userId) {
      console.error(`[SECURITY] AUTH VIOLATION: User ${userId} tried to access Site ${siteId}`);
      return NextResponse.json({ events: [], error: "UNAUTHORIZED" }, { status: 403 });
    }

    // 2. FETCH EVENTS (Server-Side Filtered)
    const q = query(
      collection(db, "events"),
      where("siteId", "==", siteId),
      limit(50)
    );

    const snap = await getDocs(q);
    const events = snap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => {
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
