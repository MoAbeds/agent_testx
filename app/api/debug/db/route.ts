import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to count users to see if DB is reachable
    const count = await prisma.user.count();
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Database connected', 
      userCount: count,
      env: {
        url: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database connection failed', 
      error: String(error)
    }, { status: 500 });
  }
}
