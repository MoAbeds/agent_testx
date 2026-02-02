import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    // Delete the site (Prisma Cascade will handle pages, rules, and events)
    await prisma.site.delete({
      where: { id: siteId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Site and all associated data removed successfully' 
    });

  } catch (error) {
    console.error('Delete Site error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
