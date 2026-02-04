import { auth } from "@/lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
import { useState, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Mail, Loader2, Lock } from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Debug config on mount
  useEffect(() => {
    console.log("[AuthDebug] Config Check:", {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
  }, []);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      // Ensure persistence is set to local before sign-in
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error("[Auth] Google Sign-In Error:", error);
      alert(`Auth Error: ${error.message} (Code: ${error.code})`);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return alert("Please enter your email address first.");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-white text-center mb-2">
        Sign in to Mojo
      </h1>
      <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full pl-10 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-terminal focus:ring-1 focus:ring-terminal/20 transition-all"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 block">Password</label>
            <button type="button" onClick={handleForgotPassword} className="text-[10px] text-terminal hover:underline uppercase font-bold tracking-tight">Forgot?</button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-terminal focus:ring-1 focus:ring-terminal/20 transition-all"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-terminal hover:bg-green-400 text-black font-bold rounded-lg transition-all disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
        </button>
      </form>
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0d0d0d] px-2 text-gray-500 font-bold tracking-widest">Or</span></div>
      </div>
      <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors">
        Continue with Google
      </button>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="relative bg-gray-900/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
          <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-terminal" size={32} /></div>}>
            <LoginContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
