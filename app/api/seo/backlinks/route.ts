import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId } = await req.json();
    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists()) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const siteData = siteSnap.data();

    const dfseoLogin = process.env.DATAFORSEO_LOGIN;
    const dfseoPassword = process.env.DATAFORSEO_PASSWORD;

    if (!dfseoLogin || !dfseoPassword) {
      return NextResponse.json({ error: 'DataForSEO credentials not configured' }, { status: 500 });
    }

    const auth = Buffer.from(`${dfseoLogin}:${dfseoPassword}`).toString('base64');
    const domain = siteData.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // 1. Fetch Backlink Summary from DataForSEO
    const response = await axios.post('https://api.dataforseo.com/v3/backlinks/summary/live', 
      [{ target: domain, internal_list_limit: 10 }],
      { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );

    const result = response.data?.tasks?.[0]?.result?.[0];
    if (!result) {
      return NextResponse.json({ error: 'No backlink data found' }, { status: 404 });
    }

    const backlinkData = {
      rank: result.rank || 0,
      backlinks: result.backlinks || 0,
      referringPages: result.referring_pages || 0,
      referringDomains: result.referring_domains || 0,
      referringMainDomains: result.referring_main_domains || 0,
      referringIps: result.referring_ips || 0,
      referringSubnets: result.referring_subnets || 0,
      updatedAt: new Date().toISOString()
    };

    // 2. Store in site profile
    await updateDoc(siteRef, { 
      backlinksData: JSON.stringify(backlinkData) 
    });

    return NextResponse.json({ success: true, data: backlinkData });

  } catch (error: any) {
    console.error("Backlink API Error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch backlink data' }, { status: 500 });
  }
}
