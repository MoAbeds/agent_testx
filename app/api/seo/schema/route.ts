import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { siteId, pagePath } = await request.json();
    if (!siteId || !pagePath) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    // 1. Fetch Site & Page Content
    const siteSnap = await getDoc(doc(db, "sites", siteId));
    const pageId = `${siteId}_${pagePath.replace(/\//g, '_')}`;
    const pageSnap = await getDoc(doc(db, "pages", pageId));

    if (!siteSnap.exists() || !pageSnap.exists()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const pageData = pageSnap.data();
    const siteData = siteSnap.data();

    // 2. AI Generate Schema JSON-LD
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const prompt = `Generate expert JSON-LD Schema Markup for this page.
URL: https://${siteData.domain}${pagePath}
Title: ${pageData.title}
Content Snippet: ${pageData.description || 'General business page'}
Type: Detect if it should be Article, Service, Organization, or Product.
RETURN ONLY RAW JSON. NO MARKDOWN.`;

    const result = await model.generateContent(prompt);
    const schemaJson = result.response.text().trim();

    // 3. Log it as a suggestion for now (User can apply)
    await logEvent(siteId, 'SCHEMA_SUGGESTED', pagePath, { schema: schemaJson });

    return NextResponse.json({ success: true, schema: JSON.parse(schemaJson) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
