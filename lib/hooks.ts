'use client';

import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

export { db };

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    // Safety timeout: If auth takes > 5s, stop loading
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Auth check timed out.");
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      clearTimeout(timer);
      if (u) {
        console.log("[AuthHook] Auth detected, fetching profile...");
        // Listen to user profile in Firestore
        const userRef = doc(db, "users", u.uid);
        const unsubscribeProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            console.log("[AuthHook] Profile found.");
            setUser({ ...u, ...snap.data() });
          } else {
            console.log("[AuthHook] Profile missing, using basic user.");
            setUser(u);
          }
          setLoading(false);
        }, (error) => {
          console.error("[AuthHook] Profile Error:", error);
          setUser(u); // Fallback to basic auth user
          setLoading(false);
        });
      } else {
        console.log("[AuthHook] No user found.");
        setUser(null);
        setLoading(false);
      }
    }, (error) => {
      console.error("[AuthHook] Auth State Error:", error);
      clearTimeout(timer);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}
