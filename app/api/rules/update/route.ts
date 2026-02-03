import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { ruleId, siteId, isActive } = await request.json();
    if (!ruleId || !siteId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const ruleRef = doc(db, "rules", ruleId);
    const ruleSnap = await getDoc(ruleRef);
    if (!ruleSnap.exists()) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

    // Update status
    await updateDoc(ruleRef, { isActive: !!isActive });

    // Log the event
    const actionType = isActive ? 'RULE_APPROVED' : 'RULE_DEACTIVATED';
    await logEvent(siteId, actionType, ruleSnap.data().targetPath, { 
      message: isActive ? `User approved optimization` : `User deactivated rule`, 
      ruleId 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rule update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
