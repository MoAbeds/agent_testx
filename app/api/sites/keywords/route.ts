import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { siteId } = await request.json();

    if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 });

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Serper API Key not configured' }, { status: 500 });

    // Fetch organic search results for the domain to see what it's known for
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `site:${site.domain}`,
        num: 10
      })
    });

    const data = await response.json();
    
    // Extract keywords from snippets and titles
    const textContext = [
      ...(data.organic?.map((r: any) => r.title) || []),
      ...(data.organic?.map((r: any) => r.snippet) || [])
    ].join(' ');

    // Extract brand/main topic from domain (e.g., example.com -> example)
    const domainParts = site.domain.replace(/^www\./, '').split('.');
    const brandName = domainParts.length > 1 ? domainParts[0] : site.domain;

    // Also get related searches to find high-value targets
    const relatedResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: brandName, // Search the brand/topic
      })
    });
    
    const relatedData = await relatedResponse.json();
    const relatedKeywords = relatedData.relatedSearches?.map((s: any) => s.query) || [];

    const keywords = {
      primary: brandName,
      topRanking: data.organic?.slice(0, 5).map((r: any) => r.title) || [],
      suggestions: relatedKeywords,
      updatedAt: new Date().toISOString()
    };

    // Update site with these keywords
    await prisma.site.update({
      where: { id: siteId },
      data: { targetKeywords: JSON.stringify(keywords) }
    });

    return NextResponse.json({ success: true, keywords });

  } catch (error) {
    console.error('Serper Keyword Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
