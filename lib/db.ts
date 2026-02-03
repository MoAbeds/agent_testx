import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

// --- SITES ---

export async function createSite(userId: string, domain: string) {
  const apiKey = `mojo_${Math.random().toString(36).substring(2, 15)}`;
  const siteRef = await addDoc(collection(db, "sites"), {
    userId,
    domain,
    apiKey,
    createdAt: serverTimestamp(),
    targetKeywords: null
  });
  return { id: siteRef.id, apiKey };
}

export async function getSites(userId: string) {
  const q = query(collection(db, "sites"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getSiteByApiKey(apiKey: string) {
  const q = query(collection(db, "sites"), where("apiKey", "==", apiKey), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// --- PAGES ---

export async function upsertPage(siteId: string, path: string, data: any) {
  const pageId = `${siteId}_${path.replace(/\//g, '_')}`;
  const pageRef = doc(db, "pages", pageId);
  await setDoc(pageRef, {
    siteId,
    path,
    ...data,
    lastCrawled: serverTimestamp()
  }, { merge: true });
}

export async function getPages(siteId: string) {
  const q = query(collection(db, "pages"), where("siteId", "==", siteId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// --- RULES ---

export async function createRule(siteId: string, targetPath: string, type: string, payload: any) {
  const ruleRef = await addDoc(collection(db, "rules"), {
    siteId,
    targetPath,
    type,
    payload: JSON.stringify(payload),
    isActive: true,
    confidence: 0.95,
    createdAt: serverTimestamp()
  });
  return ruleRef.id;
}

export async function getActiveRules(siteId: string) {
  const q = query(collection(db, "rules"), where("siteId", "==", siteId), where("isActive", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// --- EVENTS ---

export async function logEvent(siteId: string, type: string, path: string, details: any) {
  await addDoc(collection(db, "events"), {
    siteId,
    type,
    path,
    details: JSON.stringify(details),
    occurredAt: serverTimestamp()
  });
}

export async function getEvents(siteId: string, limitCount = 50) {
  const q = query(
    collection(db, "events"), 
    where("siteId", "==", siteId), 
    orderBy("occurredAt", "desc"), 
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
