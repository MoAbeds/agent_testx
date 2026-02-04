import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

export { db };

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.error("[AuthHook] Auth instance is null. Check Firebase config.");
      setLoading(false);
      return;
    }

    console.log("[AuthHook] Initializing listener...");

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        console.log("[AuthHook] Auth detected:", u.uid);
        setUser(u); // SET USER IMMEDIATELY to stop loading state
        setLoading(false); 

        // Then fetch profile in background
        const userRef = doc(db, "users", u.uid);
        onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            console.log("[AuthHook] Profile synced.");
            setUser({ ...u, ...snap.data() });
          }
        });
      } else {
        console.log("[AuthHook] No user session.");
        setUser(null);
        setLoading(false);
      }
    }, (error) => {
      console.error("[AuthHook] Auth State Error:", error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
