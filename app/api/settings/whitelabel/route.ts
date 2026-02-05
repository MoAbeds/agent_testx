import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, logoUrl, agencyName, primaryColor } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      whitelabel: {
        logoUrl,
        agencyName,
        primaryColor
      },
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Whitelabel Update Error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
