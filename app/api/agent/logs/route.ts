import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) return NextResponse.json({ events: [] });

    // SERVER-SIDE FILTERING: The ultimate guard.
    // We only fetch events that specifically match this siteId.
    const q = query(
      collection(db, "events"),
      where("siteId", "==", siteId),
      orderBy("occurredAt", "desc"),
      limit(50)
    );

    const snap = await getDocs(q);
    const events = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
