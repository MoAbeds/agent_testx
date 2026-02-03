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
  const regex = /<a[^>]+href=["']([^"']*)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    let href = match[1];
    if (href.startsWith('/')) {
      links.push(href);
    } else if (href.startsWith(domain) || href.startsWith(`https://${domain}`) || href.startsWith(`http://${domain}`)) {
      try {
        const url = new URL(href);
        links.push(url.pathname);
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
    const site = { id: siteSnap.docs[0].id, ...siteSnap.docs[0].data() };

    // 2. Clear old issues
    const eventsRef = collection(db, "events");
    const qEvents = query(eventsRef, where("siteId", "==", site.id));
    const eventsSnap = await getDocs(qEvents);
    for (const d of eventsSnap.docs) {
      if (['404_DETECTED', 'SEO_GAP'].includes(d.data().type)) {
        await deleteDoc(doc(db, "events", d.id));
      }
    }

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
          headers: { 'User-Agent': 'MojoScanner/2.0' },
          next: { revalidate: 0 }
        });
        const status = response.status;
        
        if (status === 404) {
          await logEvent(site.id, '404_DETECTED', path, { message: `Broken link found during scan` });
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
