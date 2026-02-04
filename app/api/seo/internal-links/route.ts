import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();
    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

    // 1. Get all pages for this site
    const pagesQ = query(collection(db, "pages"), where("siteId", "==", siteId));
    const pagesSnap = await getDocs(pagesQ);
    const pages = pagesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    if (pages.length < 2) return NextResponse.json({ success: true, message: 'Need more pages for linking' });

    let linkCount = 0;

    // 2. Simple Algorithm: Find path names in other pages' content
    // This will be upgraded to AI-semantic matching in Phase 2
    for (const sourcePage of pages) {
      for (const targetPage of pages) {
        if (sourcePage.id === targetPage.id) continue;
        
        // Extract a "slug name" to look for
        const slug = targetPage.path.split('/').pop()?.replace(/-/g, ' ');
        if (!slug || slug.length < 4) continue;

        const content = (sourcePage.description || '').toLowerCase();
        if (content.includes(slug.toLowerCase())) {
          // Found a potential internal link opportunity
          await addDoc(collection(db, "events"), {
            siteId,
            type: 'LINK_OPPORTUNITY',
            path: sourcePage.path,
            details: JSON.stringify({
              targetPath: targetPage.path,
              anchorText: slug,
              reason: `Contextual match found for "${slug}"`
            }),
            occurredAt: serverTimestamp()
          });
          linkCount++;
        }
      }
    }

    return NextResponse.json({ success: true, opportunitiesFound: linkCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
