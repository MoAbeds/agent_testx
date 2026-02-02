import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // 1. Authenticate the Agent
  const authHeader = request.headers.get('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
  }

  console.log(`[API] Agent Checked In: ${apiKey}`);

  // 2. Find Site by API Key (DB Lookup)
  const site = await prisma.site.findUnique({
    where: { apiKey }
  });

  if (!site) {
    console.log(`[API] Agent Auth Failed: Invalid API Key ${apiKey}`);
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
  }

  console.log(`[API] Agent Syncing: ${site.domain} (${site.id})`);

  // 3. Fetch Active Rules (DB Lookup)
  const dbRules = await prisma.optimizationRule.findMany({
    where: { 
      siteId: site.id,
      isActive: true 
    }
  });

  console.log(`[API] Found ${dbRules.length} active rules for ${site.domain}`);

  // 4. Transform DB Rules into Manifest Format
  const formattedRules: Record<string, any> = {};

  dbRules.forEach(rule => {
    try {
      // Parse the JSON string payload back into an object
      const payload = JSON.parse(rule.payload);
      
      // Ensure we use the exact path as the key
      const cleanPath = rule.targetPath.startsWith('/') ? rule.targetPath : `/${rule.targetPath}`;
      
      // Merge payload into the rule object (flattened for the agent)
      formattedRules[cleanPath] = {
        ...payload,
        ruleId: rule.id,
        type: rule.type
      };
    } catch (e) {
      console.error(`Failed to parse rule payload for ${rule.id}`, e);
    }
  });

  const manifest = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: "1.0.6-db",
      siteId: site.id,
      domain: site.domain
    },
    rules: formattedRules
  };

  // 5. Return the Manifest
  return NextResponse.json(manifest);
}
