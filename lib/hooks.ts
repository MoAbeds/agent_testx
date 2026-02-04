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
        // Set basic auth user immediately
        setUser(u);
        setLoading(false); 

        // SYNC FIREBASE PROFILE
        try {
          const userRef = doc(db, "users", u.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUser({ ...u, ...snap.data() });
          }
        } catch (e) {
          // If profile sync fails (e.g. permission denied on new account),
          // we still have the basic auth user so the dashboard doesn't hang.
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
