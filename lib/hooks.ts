import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export { db };

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // ⚡ OPTIMIZATION: Set user immediately to resolve loading state
        setUser(u);
        setLoading(false); 

        // Sync Firestore profile in background (don't block the UI)
        try {
          const userRef = doc(db, "users", u.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUser({ ...u, ...snap.data() });
          }
        } catch (e) {
          console.error("[Auth] Profile sync failed:", e);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
