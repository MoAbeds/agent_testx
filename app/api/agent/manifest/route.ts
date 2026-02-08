import { NextRequest, NextResponse } from 'next/server';
import { getSiteByApiKey, getActiveRules, logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Support Authorization header, X-Api-Key header, or ?key= query param
  const authHeader = request.headers.get('Authorization');
  const customHeader = request.headers.get('X-Api-Key');
  const urlKey = request.nextUrl.searchParams.get('key');

  let apiKey = authHeader?.replace('Bearer ', '') || customHeader || urlKey;

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
  }

  const site = await getSiteByApiKey(apiKey);

  if (!site) {
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
  }

  // Log heartbeat to show agent is "Live" in Dashboard
  await logEvent(site.id, 'HEARTBEAT', 'Agent Handshake', { 
    agent: request.headers.get('user-agent') || 'unknown' 
  });

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
    status: 'connected',
    meta: {
      generatedAt: new Date().toISOString(),
      siteId: site.id,
      domain: (site as any).domain
    },
    rules: formattedRules
  });
}
