'use client';

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
import { Mail, Loader2, Lock, Sparkles } from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // PRE-FETCH DASHBOARD
  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      if (auth) {
        setLoading(true);
        await setPersistence(auth, browserLocalPersistence);
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
          console.log("[Auth] Success. Navigating...");
          // HARD NAVIGATE for speed
          window.location.assign('/dashboard');
        }
      }
    } catch (error: any) {
      console.error("[Auth] Error:", error);
      setLoading(false);
      alert(`Auth Error: ${error.message}`);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (auth) {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, email, password);
        window.location.assign('/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      setLoading(false);
      alert(error.message);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400 text-sm">Sign in to manage your SEO infrastructure.</p>
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full pl-10 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-sm text-white focus:border-terminal outline-none transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-sm text-white focus:border-terminal outline-none transition-all"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-terminal hover:bg-green-400 text-black font-bold rounded-lg transition-all disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
        </button>
      </form>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0d0d0d] px-2 text-gray-500 font-bold">Or</span></div>
      </div>

      <button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-3 mb-8 group relative z-10">
        <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110">
          <img src="/logo.svg" alt="Mojo Guardian" className="w-full h-full" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white font-serif">
          Mojo <span className="text-terminal">Guardian</span>
        </span>
      </Link>

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
