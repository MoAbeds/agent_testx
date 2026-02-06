import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, siteId, templateId } = await req.json();
    if (!userId || !siteId || !templateId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const templateRef = doc(db, "blueprints", templateId);
    const templateSnap = await getDoc(templateRef);
    if (!templateSnap.exists() || templateSnap.data().userId !== userId) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists() || siteSnap.data().userId !== userId) {
      return NextResponse.json({ error: 'Site not found' }, { status: 403 });
    }

    const blueprint = templateSnap.data();

    // Apply the success pattern to the new site
    await updateDoc(siteRef, {
      industryDeepDive: blueprint.industryDeepDive,
      targetKeywords: blueprint.targetKeywords,
      customSchema: blueprint.customSchema,
      strategyMode: blueprint.structure?.strategyMode || 'GROWTH',
      clonedFrom: blueprint.name,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully applied '${blueprint.name}' success pattern to ${siteSnap.data().domain}.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
