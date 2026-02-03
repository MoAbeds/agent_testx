import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { upsertPage, logEvent } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
  // Better regex to catch various link formats
  const regex = /href=["'](https?:\/\/[^"']+|(?:\/|(?!\/))[^"'\s>]+)["']/gi;
  let match;
  
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  while ((match = regex.exec(html)) !== null) {
    let href = match[1];
    
    // Ignore anchors, mailto, tel, etc.
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;

    // Normalize links
    if (href.startsWith('/')) {
      links.push(href);
    } else if (href.includes(cleanDomain)) {
      try {
        const url = new URL(href);
        // Ensure it's actually on the same domain
        if (url.hostname.replace(/^www\./, '') === cleanDomain.replace(/^www\./, '')) {
          links.push(url.pathname);
        }
      } catch (e) {}
    }
  }
  return Array.from(new Set(links));
}

export async function POST(request: NextRequest) {
  try {
    const { domain, maxPages = 20 } = await request.json();
    if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });

    // 1. Find Site
    const sitesRef = collection(db, "sites");
    const qSite = query(sitesRef, where("domain", "==", domain));
    const siteSnap = await getDocs(qSite);
    if (siteSnap.empty) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const site = { id: siteSnap.docs[0].id, ...siteSnap.docs[0].data() as any };

    // --- NEW: Trigger WordPress Internal Bridge ---
    const cleanDomainForTrigger = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const protocolForTrigger = cleanDomainForTrigger.includes('localhost') ? 'http' : 'https';
    const triggerUrl = `${protocolForTrigger}://${cleanDomainForTrigger}/?mojo_action=scrape&key=${site.apiKey}`;
    
    console.log(`[Crawler] Triggering internal bridge: ${triggerUrl}`);
    try {
      await fetch(triggerUrl, { 
        method: 'GET',
        headers: { 'User-Agent': 'MojoServer/1.0' },
        next: { revalidate: 0 }
      });
      // Wait 2 seconds for the plugin to process and push data to /api/sites/ingest
      await new Promise(r => setTimeout(r, 2000));
    } catch (triggerError) {
      console.warn(`[Crawler] Internal bridge trigger failed:`, triggerError);
    }
    // ----------------------------------------------

    // 2. Clear old issues (unless they were just ingested by the bridge)
    // The bridge push to /api/sites/ingest handles its own clearing.
    // If we run the external scanner, we might want to skip clearing if we trust the bridge more.
    // But for now, we'll let the external scanner find anything the internal one missed (like 404s).

    const queue = ['/'];
    const visited = new Set<string>();
    const results = [];

    while (queue.length > 0 && visited.size < maxPages) {
      const path = queue.shift();
      if (!path || visited.has(path)) continue;
      visited.add(path);

      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const protocol = cleanDomain.includes('localhost') ? 'http' : 'https';
      const url = `${protocol}://${cleanDomain}${path}`;

      try {
        const response = await fetch(url, { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MojoScanner/3.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          next: { revalidate: 0 }
        });
        const status = response.status;
        console.log(`[Crawler] Fetched ${path} - Status: ${status}`);
        
        if (!response.ok) {
          console.error(`[Crawler] Failed to fetch ${path}: ${status} ${response.statusText}`);
          if (status === 404) {
            await logEvent(site.id, '404_DETECTED', path, { message: `Broken link found during scan` });
          }
          results.push({ path, status });
          continue;
        }
        const html = await response.text();
        const title = extractTitle(html);
        const metaDesc = extractMetaDescription(html);
        const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
        const h1 = h1Match ? h1Match[1].trim() : null;

        if (!title || title.length < 10 || !metaDesc || metaDesc.length < 50 || !h1) {
          await logEvent(site.id, 'SEO_GAP', path, { 
            message: `SEO issues found: ${!title ? 'Missing Title' : title.length < 10 ? 'Title too short' : ''} ${!metaDesc ? 'Missing Meta' : metaDesc.length < 50 ? 'Meta too short' : ''} ${!h1 ? 'Missing H1' : ''}`.trim()
          });
        }

        await upsertPage(site.id, path, { title, metaDesc, h1, status });
        results.push({ path, status });

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
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
