import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { checkVolatility } from "@/lib/seo/volatility";
import { logEvent } from "@/lib/db";
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, siteId } = await req.json();
    if (!userId || !siteId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists() || siteSnap.data().userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || !userSnap.data().gscConnected) {
      return NextResponse.json({ error: 'Google Search Console not connected' }, { status: 400 });
    }

    const domain = siteSnap.data().domain;
    const previousGscDataRaw = siteSnap.data().gscData;
    const previousGscData = previousGscDataRaw ? JSON.parse(previousGscDataRaw) : null;

    // Mocked GSC Data Fetch
    const mockGscData = {
      clicks: 1240,
      impressions: 45800,
      ctr: 2.7,
      position: 14.2,
      estimatedRoi: 4250,
      moatIndex: 68,
      topKeywords: [
        { query: "autonomous seo agent", clicks: 120, impressions: 5000, position: 4.2, status: 'STRIKE_ZONE', moat: 82 },
        { query: "how to fix 404 with ai", clicks: 85, impressions: 3200, position: 8.1, status: 'OPPORTUNITY', moat: 45 },
        { query: "mojo guardian seo", clicks: 210, impressions: 1200, position: 1.1, status: 'RANKED', moat: 95 }
      ],
      syncedAt: new Date().toISOString()
    };

    // PHASE 4: Check Volatility
    const volResult = await checkVolatility(siteId, mockGscData, previousGscData);
    
    if (volResult.isVolatile) {
      // Trigger "Defense Plan" via Brain
      await logEvent(siteId, 'ALGORITHM_ALERT', domain, { 
        message: volResult.message,
        severity: 'high',
        drop: volResult.dropPercentage
      });

      // Internal call to Brain to generate Defense Rules
      try {
        const protocol = req.nextUrl.protocol || 'https:';
        const host = req.headers.get('host');
        await axios.post(`${protocol}//${host}/api/agent/brain`, { 
          siteId, 
          userId,
          mode: 'DEFENSE' 
        });
      } catch (e) {
        console.error("Defense Trigger Error:", e);
      }
    }

    await updateDoc(siteRef, {
      gscData: JSON.stringify(mockGscData),
      previousGscData: previousGscDataRaw,
      lastVolatilityReport: JSON.stringify(volResult)
    });

    return NextResponse.json({ 
      success: true, 
      data: mockGscData,
      volatility: volResult
    });

  } catch (error: any) {
    console.error('GSC Sync Error:', error);
    return NextResponse.json({ error: 'Failed to sync with Google' }, { status: 500 });
  }
}
