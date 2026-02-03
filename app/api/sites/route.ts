import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Normalize domain (strip protocol, trailing slashes)
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .toLowerCase();

    // Generate unique API key
    const apiKey = `mojo_${randomUUID().replace(/-/g, '')}`;

    // Get first user from DB (MVP approach)
    // In production, use session/auth
    let user = await prisma.user.findFirst();
    
    if (!user) {
      // Create a default user if none exists
      user = await prisma.user.create({
        data: {
          email: 'admin@localhost',
          name: 'Admin',
        },
      });
    }

    // Check if site already exists for this user
    const existingSite = await prisma.site.findFirst({
      where: {
        domain: normalizedDomain,
        userId: user.id,
      },
    });

    if (existingSite) {
      return NextResponse.json(
        { error: 'Site already exists' },
        { status: 409 }
      );
    }

    // Create the site
    const site = await prisma.site.create({
      data: {
        domain: normalizedDomain,
        apiKey,
        userId: user.id,
      },
    });

    return NextResponse.json({ 
      site: {
        id: site.id,
        domain: site.domain,
        createdAt: site.createdAt,
      },
      apiKey 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
