import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    // 1. Get all sites
    const sitesSnap = await getDocs(collection(db, "sites"));
    const results = [];

    for (const siteDoc of sitesSnap.docs) {
      const siteId = siteDoc.id;
      const siteData = siteDoc.data();

      // Only run for PRO users or if autopilot is enabled
      if (siteData.autopilotEnabled !== false) { 
        
        try {
          // Trigger the Brain API for this site
          // We call it internally via the absolute URL or by extracting the logic
          // For simplicity and reliability, we'll hit the brain endpoint
          const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
          const host = req.headers.get('host');
          
          await axios.post(`${protocol}://${host}/api/agent/brain`, { siteId }, {
            timeout: 30000
          });

          results.push({ siteId, domain: siteData.domain, status: 'optimized' });
        } catch (e: any) {
          console.error(`[Autopilot] Failed for ${siteData.domain}:`, e.message);
          results.push({ siteId, domain: siteData.domain, status: 'failed', error: e.message });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      details: results
    });

  } catch (error: any) {
    console.error("Autopilot Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
