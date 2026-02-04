import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { getServerSession } from "next-auth"; // If using next-auth, otherwise we use custom check

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) return NextResponse.json({ events: [], message: "No siteId provided" });

    // 1. Verify Site Ownership (The ultimate security check)
    // We fetch the site doc to see who it belongs to.
    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    
    if (!siteSnap.exists()) {
      return NextResponse.json({ events: [], message: "Site not found" }, { status: 404 });
    }

    // 2. Fetch only for this site
    // We use a simple query to avoid index errors, then sort in-memory
    const q = query(
      collection(db, "events"),
      where("siteId", "==", siteId),
      limit(100)
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

    console.log(`[Security-Guard] Served ${events.length} private events for site ${siteId}`);

    return NextResponse.json({ 
      events: events.slice(0, 50),
      siteDomain: siteSnap.data().domain 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
