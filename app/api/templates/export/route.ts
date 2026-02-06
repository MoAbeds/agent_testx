import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, siteId, templateName } = await req.json();
    if (!userId || !siteId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists() || siteSnap.data().userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const siteData = siteSnap.data();

    // Extract success patterns
    const blueprint = {
      userId,
      name: templateName || `${siteData.domain} Success Pattern`,
      industryDeepDive: siteData.industryDeepDive || null,
      targetKeywords: siteData.targetKeywords || null,
      customSchema: siteData.customSchema || null,
      structure: {
        platform: siteData.platform || 'unknown',
        strategyMode: 'AUTHORITY_BUILDER'
      },
      createdAt: serverTimestamp()
    };

    const templateRef = await addDoc(collection(db, "blueprints"), blueprint);

    return NextResponse.json({ 
      success: true, 
      templateId: templateRef.id,
      message: 'Niche Blueprint exported successfully.' 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
