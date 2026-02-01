import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple HTML parser functions to avoid cheerio's undici dependency issues
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractMetaDescription(html: string): string | null {
  // Match meta description with various quote styles and attribute orders
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Find the site by domain
    const site = await prisma.site.findFirst({
      where: { domain }
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found. Please add the site first.' },
        { status: 404 }
      );
    }

    // Fetch the homepage HTML
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    let html: string;
    let status: number;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MojoSEO-Scanner/1.0'
        }
      });
      status = response.status;
      html = await response.text();
    } catch (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch ${url}: ${fetchError}` },
        { status: 502 }
      );
    }

    // Parse HTML to extract SEO data
    const title = extractTitle(html);
    const metaDesc = extractMetaDescription(html);

    // Upsert the page (homepage = path "/")
    const page = await prisma.page.upsert({
      where: {
        siteId_path: {
          siteId: site.id,
          path: '/'
        }
      },
      update: {
        title,
        metaDesc,
        status,
        lastCrawled: new Date()
      },
      create: {
        siteId: site.id,
        path: '/',
        title,
        metaDesc,
        status,
        lastCrawled: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      page: {
        id: page.id,
        path: page.path,
        title: page.title,
        metaDesc: page.metaDesc,
        status: page.status,
        lastCrawled: page.lastCrawled
      }
    });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
