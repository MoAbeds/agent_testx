'use client';

import { auth } from "@/lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Terminal, Mail, Loader2, Lock, User, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error("[Auth] Google Sign-In Error:", error);
      if (error.code === 'auth/popup-closed-by-user') return;
      
      // FALLBACK: Use Redirect if popup is blocked
      import("firebase/auth").then(({ signInWithRedirect }) => {
        signInWithRedirect(auth, provider);
      });
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return alert("Password must be at least 6 characters.");
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/4 right-1/2 translate-x-1/2 w-[600px] h-[600px] bg-terminal/5 rounded-full blur-[120px]" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 group relative z-10">
        <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110">
          <img src="/logo.svg" alt="Mojo Guardian" className="w-full h-full" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white font-serif">
          Mojo <span className="text-terminal">Guardian</span>
        </span>
      </Link>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-b from-terminal/10 to-transparent rounded-2xl blur-xl opacity-50" />
        <div className="relative bg-gray-900/60 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terminal/10 border border-terminal/20 text-[10px] text-terminal font-bold uppercase tracking-widest mb-6">
            <Sparkles size={12} />
            Free 14-Day Trial
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Create your account
          </h1>
          <p className="text-gray-400 mb-8 text-sm">
            Start automating your SEO infrastructure today.
          </p>

          <form onSubmit={handleEmailSignup} className="space-y-4 mb-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-terminal focus:ring-1 focus:ring-terminal/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Work Email</label>
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
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-terminal focus:ring-1 focus:ring-terminal/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-terminal hover:bg-green-400 text-black font-bold rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Get Started'}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0d0d0d] px-2 text-gray-500 font-bold tracking-widest">Or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-terminal hover:underline font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
