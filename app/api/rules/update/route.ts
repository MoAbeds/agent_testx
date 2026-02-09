import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { ruleId, siteId, isActive, userId, payload } = await request.json(); // Added payload
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

    // Update data
    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (payload) updateData.payload = JSON.stringify(payload); // Support payload updates

    await updateDoc(ruleRef, updateData);

    // 🔒 AUTO-CLEANUP: If rule is approved (isActive=true), REMOVE the corresponding "SEO_GAP" issue
    if (isActive) {
      const targetPath = ruleSnap.data().targetPath;
      const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
      const pathVariants = [targetPath, normalizedPath, normalizedPath.substring(1)]; // Try "/path", "path", and whatever is in DB

      console.log(`[Auto-Cleanup] Attempting to remove issues for: ${targetPath}`);
      console.log(`[Auto-Cleanup] Variants: ${JSON.stringify(pathVariants)}`);

      // Execute deletion for all variants
      const eventsRef = collection(db, "events");
      const issueQuery = query(
        eventsRef, 
        where("siteId", "==", siteId)
        // Removed type filter to catch ALL issue types for this path
      );
      
      const issueSnap = await getDocs(issueQuery);
      
      let deletedCount = 0;
      // Filter manually for path match to handle slash discrepancies
      for (const docSnap of issueSnap.docs) {
        const issuePath = docSnap.data().path;
        if (pathVariants.includes(issuePath)) {
          console.log(`[Auto-Cleanup] MATCH FOUND: Deleting resolved issue ${docSnap.id} (Type: ${docSnap.data().type}) for path ${issuePath}`);
          await deleteDoc(doc(db, "events", docSnap.id));
          deletedCount++;
        }
      }
      console.log(`[Auto-Cleanup] Total deleted: ${deletedCount}`);
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
