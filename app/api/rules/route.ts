import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { siteId, path, title, metaDescription } = await req.json();

    if (!siteId || !path || !title || !metaDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ruleRef = await addDoc(collection(db, "rules"), {
      siteId,
      targetPath: path,
      type: 'REWRITE_META',
      payload: JSON.stringify({ title, metaDescription }),
      isActive: true, 
      confidence: 1.0, 
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ id: ruleRef.id, success: true });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
