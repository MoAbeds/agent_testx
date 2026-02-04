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
      return NextResponse.json({ events: [], message: "Missing siteId or userId" });
    }

    // 1. HARD SECURITY CHECK: Does this site actually belong to this userId?
    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    
    if (!siteSnap.exists()) {
      return NextResponse.json({ events: [], error: "SITE_NOT_FOUND" });
    }

    const siteData = siteSnap.data();
    if (siteData.userId !== userId) {
      console.error(`[SECURITY] AUTH VIOLATION: User ${userId} tried to access Site ${siteId} (Owner: ${siteData.userId})`);
      return NextResponse.json({ events: [], error: "UNAUTHORIZED_ACCESS" }, { status: 403 });
    }

    // 2. Fetch only for this site if authorized
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
      events: events,
      siteDomain: siteData.domain 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
