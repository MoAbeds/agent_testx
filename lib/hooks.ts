'use client';

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

export { db };

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        // 1. Set basic auth user immediately to stop loading
        setUser(u);
        setLoading(false); 

        // 2. Sync/Create Firestore profile
        const userRef = doc(db, "users", u.uid);
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUser({ ...u, ...snap.data() });
          } else {
            // AUTO-PROVISION Profile if missing (Default to FREE)
            setDoc(userRef, {
              email: u.email,
              plan: 'FREE',
              createdAt: serverTimestamp()
            }, { merge: true });
            setUser({ ...u, plan: 'FREE' });
          }
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
