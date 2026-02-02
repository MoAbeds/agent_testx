import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple HTML parsers
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractMetaDescription(html: string): string | null {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractLinks(html: string, domain: string): string[] {
  const links: string[] = [];
  const regex = /<a[^>]+href=["']([^"']*)["'][^>]*>/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    let href = match[1];
    
    // Normalize links
    if (href.startsWith('/')) {
      links.push(href);
    } else if (href.startsWith(domain) || href.startsWith(`https://${domain}`) || href.startsWith(`http://${domain}`)) {
      try {
        const url = new URL(href);
        links.push(url.pathname);
      } catch (e) {}
    }
  }
  // Return unique internal paths
  return Array.from(new Set(links));
}

export async function POST(request: NextRequest) {
  try {
    const { domain, maxPages = 20 } = await request.json();

    if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });

    const site = await prisma.site.findFirst({ where: { domain } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    const queue = ['/'];
    const visited = new Set<string>();
    const results = [];

    while (queue.length > 0 && visited.size < maxPages) {
      const path = queue.shift();
      if (!path || visited.has(path)) continue;
      visited.add(path);

      const url = `https://${domain}${path}`;
      try {
        const response = await fetch(url, { headers: { 'User-Agent': 'MojoScanner/2.0' } });
        const status = response.status;
        
        if (status === 404) {
          // Log 404 in AgentEvents for the "Undo/Fix" system
          await prisma.agentEvent.create({
            data: {
              siteId: site.id,
              type: '404_DETECTED',
              path: path,
              details: JSON.stringify({ message: `Broken link found during scan` })
            }
          });
        }

        const html = await response.text();
        const title = extractTitle(html);
        const metaDesc = extractMetaDescription(html);
        const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
        const h1 = h1Match ? h1Match[1].trim() : null;

        // Check for SEO Gaps
        if (!title || title.length < 10 || !metaDesc || metaDesc.length < 50 || !h1) {
          await prisma.agentEvent.create({
            data: {
              siteId: site.id,
              type: 'SEO_GAP',
              path: path,
              details: JSON.stringify({ 
                message: `SEO issues found: ${!title ? 'Missing Title' : title.length < 10 ? 'Title too short' : ''} ${!metaDesc ? 'Missing Meta' : metaDesc.length < 50 ? 'Meta too short' : ''} ${!h1 ? 'Missing H1' : ''}`.trim()
              })
            }
          });
        }

        // Save Page
        await prisma.page.upsert({
          where: { siteId_path: { siteId: site.id, path } },
          update: { title, metaDesc, h1, status, lastCrawled: new Date() },
          create: { siteId: site.id, path, title, metaDesc, h1, status, lastCrawled: new Date() }
        });

        results.push({ path, status });

        // Extract and add new links to queue
        if (status === 200) {
          const newLinks = extractLinks(html, domain);
          for (const link of newLinks) {
            if (!visited.has(link)) queue.push(link);
          }
        }
      } catch (e) {
        console.error(`Failed crawling ${path}:`, e);
      }
    }

    return NextResponse.json({ success: true, pagesCrawled: results.length, results });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
