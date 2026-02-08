import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { ruleId, siteId, isActive, userId } = await request.json();
    if (!ruleId || !siteId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    // 🔒 OWNERSHIP VERIFICATION (CRITICAL)
    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists() || siteSnap.data().userId !== userId) {
      console.error(`[SECURITY] AUTH VIOLATION: User ${userId} tried to update Rule ${ruleId} for Site ${siteId}`);
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const ruleRef = doc(db, "rules", ruleId);
    const ruleSnap = await getDoc(ruleRef);
    if (!ruleSnap.exists()) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

    // Verify rule actually belongs to the site
    if (ruleSnap.data().siteId !== siteId) {
      return NextResponse.json({ error: 'Data mismatch' }, { status: 400 });
    }

    // Update status
    await updateDoc(ruleRef, { isActive: !!isActive });

    // 🔒 AUTO-CLEANUP: If rule is approved (isActive=true), REMOVE the corresponding "SEO_GAP" issue
    if (isActive) {
      const targetPath = ruleSnap.data().targetPath;
      const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
      const pathVariants = [targetPath, normalizedPath, normalizedPath.substring(1)]; // Try "/path", "path", and whatever is in DB

      // Execute deletion for all variants
      const eventsRef = collection(db, "events");
      const issueQuery = query(
        eventsRef, 
        where("siteId", "==", siteId),
        where("type", "==", "SEO_GAP")
      );
      
      const issueSnap = await getDocs(issueQuery);
      
      // Filter manually for path match to handle slash discrepancies
      issueSnap.docs.forEach(async (docSnap) => {
        const issuePath = docSnap.data().path;
        if (pathVariants.includes(issuePath)) {
          console.log(`[Auto-Cleanup] Deleting resolved issue ${docSnap.id} for path ${issuePath}`);
          await deleteDoc(doc(db, "events", docSnap.id));
        }
      });
    }

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
