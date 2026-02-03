import { NextRequest, NextResponse } from 'next/server';
import { getSiteByApiKey, getActiveRules } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
  }

  const site = await getSiteByApiKey(apiKey);

  if (!site) {
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
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
    meta: {
      generatedAt: new Date().toISOString(),
      siteId: site.id,
      domain: (site as any).domain
    },
    rules: formattedRules
  });
}
