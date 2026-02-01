import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // In a real app, you'd check session/auth here to ensure the user owns the site
  
  // Fetch the last 20 events
  const events = await prisma.agentEvent.findMany({
    take: 20,
    orderBy: {
      occurredAt: 'desc',
    },
    include: {
      site: true // include site info if needed
    }
  });

  // If no events exist yet (fresh DB), return some "system init" logs
  if (events.length === 0) {
    return NextResponse.json([
        {
            id: 'init',
            type: 'INFO',
            path: 'System',
            details: JSON.stringify({ message: 'System initialized. Waiting for agent traffic...' }),
            occurredAt: new Date(),
        }
    ]);
  }

  return NextResponse.json(events);
}
