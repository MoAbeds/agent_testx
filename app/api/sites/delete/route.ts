import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    // 1. Delete associated Pages
    const pagesQ = query(collection(db, "pages"), where("siteId", "==", siteId));
    const pagesSnap = await getDocs(pagesQ);
    for (const d of pagesSnap.docs) await deleteDoc(doc(db, "pages", d.id));

    // 2. Delete associated Rules
    const rulesQ = query(collection(db, "rules"), where("siteId", "==", siteId));
    const rulesSnap = await getDocs(rulesQ);
    for (const d of rulesSnap.docs) await deleteDoc(doc(db, "rules", d.id));

    // 3. Delete associated Events
    const eventsQ = query(collection(db, "events"), where("siteId", "==", siteId));
    const eventsSnap = await getDocs(eventsQ);
    for (const d of eventsSnap.docs) await deleteDoc(doc(db, "events", d.id));

    // 4. Delete the Site
    await deleteDoc(doc(db, "sites", siteId));

    return NextResponse.json({ 
      success: true, 
      message: 'Site and all associated data removed successfully' 
    });

  } catch (error) {
    console.error('Delete Site error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
