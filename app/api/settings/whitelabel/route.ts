import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { siteId, agencyName, customLogo, footerText } = await req.json();
    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

    const siteRef = doc(db, "sites", siteId);
    await updateDoc(siteRef, {
      whitelabel: {
        agencyName,
        customLogo,
        footerText,
        updatedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
