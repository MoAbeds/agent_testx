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
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
  }

  // 3. Fetch Active Rules (DB Lookup)
  const dbRules = await prisma.optimizationRule.findMany({
    where: { 
      siteId: site.id,
      isActive: true 
    }
  });

  // 4. Transform DB Rules into Manifest Format
  const formattedRules: Record<string, any> = {};

  dbRules.forEach(rule => {
    try {
      // Parse the JSON string payload back into an object
      const payload = JSON.parse(rule.payload);
      
      // Merge payload into the rule object (flattened for the agent)
      formattedRules[rule.targetPath] = {
        ...payload,
        ruleId: rule.id
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
