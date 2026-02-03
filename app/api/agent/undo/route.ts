import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { ruleId, siteId } = await request.json();
    if (!ruleId || !siteId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const ruleRef = doc(db, "rules", ruleId);
    const ruleSnap = await getDoc(ruleRef);
    if (!ruleSnap.exists()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await updateDoc(ruleRef, { isActive: false });
    await logEvent(siteId, 'UNDO_ACTION', ruleSnap.data().targetPath, { message: `Reverted optimization`, ruleId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
