import { NextRequest, NextResponse } from 'next/server';
import { getSiteByApiKey, getActiveRules, logEvent } from '@/lib/db';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Support Authorization header, X-Api-Key header, or ?key= query param
  const authHeader = request.headers.get('Authorization');
  const customHeader = request.headers.get('X-Api-Key');
  const urlKey = request.nextUrl.searchParams.get('key');

  let apiKey = authHeader?.replace('Bearer ', '') || customHeader || urlKey;

  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Missing API Key' }, { status: 401 });
  }

  const site = await getSiteByApiKey(apiKey);

  if (!site) {
    return NextResponse.json({ success: false, error: 'Invalid API Key' }, { status: 403 });
  }

  // 1. Log heartbeat event
  await logEvent(site.id, 'HEARTBEAT', 'Agent Handshake', { 
    agent: request.headers.get('user-agent') || 'unknown' 
  });

  // 2. UPDATE SITE DOC: Mark as "Live" for Onboarding Checklist
  try {
    await updateDoc(doc(db, "sites", site.id), {
      lastAgentHandshake: serverTimestamp()
    });
  } catch(e) {
    console.error("Failed to update handshake timestamp", e);
  }

  const dbRules = await getActiveRules(site.id);
  const formattedRules: Record<string, any> = {};

  dbRules.forEach((rule: any) => {
    try {
      const payload = JSON.parse(rule.payload);
      const cleanPath = rule.targetPath.startsWith('/') ? rule.targetPath : `/${rule.targetPath}`;
      formattedRules[cleanPath] = {
        ...payload,
        ruleId: rule.id,
        type: rule.type
      };
    } catch (e) {
      console.error(`Failed to parse rule payload for ${rule.id}`, e);
    }
  });

  return NextResponse.json({
    success: true,
    status: 'active',
    message: 'Sync successful',
    meta: {
      generatedAt: new Date().toISOString(),
      siteId: site.id,
      domain: (site as any).domain
    },
    rules: formattedRules
  });
}
