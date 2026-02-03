import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { upsertPage, logEvent } from '@/lib/db';
import https from 'https';
import axios from 'axios';

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
  const regex = /href=["'](https?:\/\/[^"']+|(?:\/|(?!\/))[^"'\s>]+)["']/gi;
  let match;
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  while ((match = regex.exec(html)) !== null) {
    let href = match[1];
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    if (href.startsWith('/')) {
      links.push(href);
    } else if (href.includes(cleanDomain)) {
      try {
        const url = new URL(href);
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

    const sitesRef = collection(db, "sites");
    const qSite = query(sitesRef, where("domain", "==", domain));
    const siteSnap = await getDocs(qSite);
    if (siteSnap.empty) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const site = { id: siteSnap.docs[0].id, ...siteSnap.docs[0].data() as any };

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const protocol = cleanDomain.includes('localhost') ? 'http' : 'https';
    
    // Trigger WordPress Internal Bridge
    const triggerUrl = `${protocol}://${cleanDomain}/?mojo_action=scrape&key=${site.apiKey}`;
    console.log(`[Crawler] Triggering internal bridge: ${triggerUrl}`);
    
    try {
      // Use Axios with custom agent to bypass SSL checks for bridge trigger
      await axios.get(triggerUrl, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        headers: { 'User-Agent': 'MojoServer/1.0' },
        timeout: 10000
      });
      await new Promise(r => setTimeout(r, 2000));
    } catch (triggerError: any) {
      console.warn(`[Crawler] Internal bridge trigger failed (SSL/Network):`, triggerError.message);
    }

    const queue = ['/'];
    const visited = new Set<string>();
    const results = [];

    // Custom Axios instance for the crawl to bypass SSL errors
    const scraper = axios.create({
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MojoScanner/3.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
      timeout: 15000,
      validateStatus: () => true // Don't throw on 404
    });

    while (queue.length > 0 && visited.size < maxPages) {
      const path = queue.shift();
      if (!path || visited.has(path)) continue;
      visited.add(path);

      const url = `${protocol}://${cleanDomain}${path}`;

      try {
        const response = await scraper.get(url);
        const status = response.status;
        console.log(`[Crawler] Fetched ${path} - Status: ${status}`);
        
        if (status === 404) {
          await logEvent(site.id, '404_DETECTED', path, { message: `Broken link found during scan` });
          await upsertPage(site.id, path, { status: 404 });
        }

        if (status === 200 && typeof response.data === 'string') {
          const html = response.data;
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
          
          const newLinks = extractLinks(html, domain);
          for (const link of newLinks) {
            if (!visited.has(link)) queue.push(link);
          }
        }
        
        results.push({ path, status });
      } catch (e: any) {
        console.error(`Failed crawling ${path}:`, e.message);
      }
    }

    return NextResponse.json({ success: true, pagesCrawled: results.length, results });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
