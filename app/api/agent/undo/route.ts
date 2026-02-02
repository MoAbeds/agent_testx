import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { ruleId, siteId } = await request.json();

    if (!ruleId || !siteId) {
      return NextResponse.json({ error: 'ruleId and siteId are required' }, { status: 400 });
    }

    // 1. Find the rule
    const rule = await prisma.optimizationRule.findUnique({
      where: { id: ruleId }
    });

    if (!rule || rule.siteId !== siteId) {
      return NextResponse.json({ error: 'Rule not found or unauthorized' }, { status: 404 });
    }

    // 2. Deactivate the rule
    const updatedRule = await prisma.optimizationRule.update({
      where: { id: ruleId },
      data: { isActive: false }
    });

    // 3. Log the "Undo" event
    await prisma.agentEvent.create({
      data: {
        siteId,
        type: 'UNDO_ACTION',
        path: rule.targetPath,
        details: JSON.stringify({ 
          message: `User undid optimization for ${rule.targetPath}`,
          previousType: rule.type,
          ruleId: rule.id
        })
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Action successfully undone',
      rule: updatedRule 
    });

  } catch (error) {
    console.error('Undo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
