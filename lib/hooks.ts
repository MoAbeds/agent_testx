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
        const userRef = doc(db, "users", u.uid);
        const unsubscribeProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            console.log("[AuthHook] Profile found.");
            setUser({ ...u, ...snap.data() });
          } else {
            console.log("[AuthHook] Profile missing, using basic auth.");
            setUser(u);
          }
          setLoading(false);
        }, (error) => {
          console.error("[AuthHook] Firestore Error:", error.message);
          setUser(u);
          setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        console.log("[AuthHook] No user session found.");
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
