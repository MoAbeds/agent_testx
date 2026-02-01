import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { path, title, metaDescription } = await req.json();

    if (!path || !title || !metaDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the default site (for now, just the first one)
    const site = await prisma.site.findFirst();

    if (!site) {
      return NextResponse.json({ error: 'No site found. Please seed the database.' }, { status: 404 });
    }

    // Create the rule
    const rule = await prisma.optimizationRule.create({
      data: {
        siteId: site.id,
        targetPath: path,
        type: 'REWRITE_META',
        payload: JSON.stringify({ title, metaDescription }),
        isActive: true, // Auto-activate for this demo
        confidence: 1.0, // Manual rule = 100% confidence
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
