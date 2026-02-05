'use client';

import { useAuth } from '@/lib/hooks';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Globe, Trophy, ExternalLink, Loader2, Target, BarChart3, AlertCircle } from 'lucide-react';
import SiteManager from '@/components/SiteManager';

interface SiteData {
  id: string;
  domain: string;
  userId: string;
  targetKeywords?: string;
  [key: string]: any;
}

function SerpsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [allSites, setAllSites] = useState<SiteData[]>([]);
  const [site, setSite] = useState<SiteData | null>(null);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [myPosition, setMyPosition] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savedKeywords, setSavedKeywords] = useState<any[]>([]);

  const selectedSiteId = searchParams.get('siteId');

  // 1. Fetch sites belonging to the user
  useEffect(() => {
    if (!user?.uid || !db) return;
    const q = query(collection(db, "sites"), where("userId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const sites = snap.docs.map(d => ({ id: d.id, ...d.data() } as SiteData));
      setAllSites(sites);
      const current = selectedSiteId ? sites.find(s => s.id === selectedSiteId) : sites[0];
      setSite(current || null);

      if (current?.targetKeywords) {
        try {
          const kwData = JSON.parse(current.targetKeywords);
          setSavedKeywords(kwData.detailed || []);
        } catch (e) {
          setSavedKeywords([]);
        }
      } else {
        setSavedKeywords([]);
      }

      setInitialLoading(false);
    });
  }, [user?.uid, selectedSiteId]);

  const handleSearch = async (kw?: any) => {
    // If kw is a synthetic event (from onSubmit), treat it as undefined
    const actualKw = typeof kw === 'string' ? kw : undefined;
    const targetKeyword = actualKw || keyword;
    
    if (!site?.id || !targetKeyword.trim()) return;

    setLoading(true);
    if (typeof kw === 'string') setKeyword(kw);

    try {
      const res = await fetch('/api/seo/serp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: site.id, keyword: targetKeyword.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setMyPosition(data.position);
      } else {
        setResults([]);
        setMyPosition(-1);
      }
    } catch (error) {
      console.error(error);
      setResults([]);
      setMyPosition(-1);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-terminal" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-serif">SERP Tracker</h1>
          <p className="text-gray-400">Analyze real-time Google search results and your positioning.</p>
        </div>
        <SiteManager sites={allSites} currentSiteId={site?.id || ''} />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Saved Keywords */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 shadow-sm h-fit">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <BarChart3 size={14} />
              Target Keywords
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
              {savedKeywords.length === 0 ? (
                <p className="text-xs text-gray-600 italic">No keywords discovered yet. Run a scan in the Guardian.</p>
              ) : (
                savedKeywords.map((kw, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(kw.keyword)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono transition-all border ${
                      keyword === kw.keyword 
                        ? 'bg-terminal/10 border-terminal/30 text-terminal' 
                        : 'bg-black border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {kw.keyword}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main: Search & Results */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 shadow-sm">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter target keyword..."
                  className="w-full bg-black border border-gray-800 rounded-xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-terminal transition-all font-mono text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !keyword.trim()}
                className="px-8 py-3.5 bg-terminal text-black font-black uppercase tracking-widest rounded-xl hover:bg-green-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Target size={18} />}
                Scan SERP
              </button>
            </form>
          </div>

          {results.length > 0 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4 text-terminal">
                    <div className="p-2 bg-terminal/10 rounded-lg"><Trophy size={20} /></div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Current Position</span>
                  </div>
                  <p className="text-4xl font-black text-white font-mono">
                    {myPosition > 0 ? `#${myPosition}` : 'NR'}
                  </p>
                  <p className="text-xs text-gray-600 mt-2 uppercase tracking-tighter">
                    {myPosition > 0 ? 'Top 100 Result Found' : 'Not in Top 100'}
                  </p>
                </div>

                <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4 text-blue-400">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><Globe size={20} /></div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Landscape</span>
                  </div>
                  <p className="text-4xl font-black text-white font-mono">{results.length}</p>
                  <p className="text-xs text-gray-600 mt-2 uppercase tracking-tighter">Top Competitors Analyzed</p>
                </div>

                <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-4 text-purple-400">
                    <div className="p-2 bg-purple-500/10 rounded-lg"><BarChart3 size={20} /></div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Keyword Intensity</span>
                  </div>
                  <p className="text-4xl font-black text-white font-mono">High</p>
                  <p className="text-xs text-gray-600 mt-2 uppercase tracking-tighter">Intent Analysis Active</p>
                </div>
              </div>

              {/* Results List */}
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={16} className="text-gray-500" />
                    Live Ranking Data
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500 truncate max-w-[200px]">{keyword}</span>
                </div>
                <div className="divide-y divide-gray-800">
                  {results.map((item) => (
                    <div 
                      key={item.position} 
                      className={`p-6 hover:bg-white/[0.02] transition-colors ${item.isMine ? 'bg-terminal/5 border-l-4 border-l-terminal' : ''}`}
                    >
                      <div className="flex gap-6">
                        <div className="shrink-0 flex flex-col items-center justify-center w-12">
                          <span className={`text-lg font-black font-mono ${item.position <= 3 ? 'text-terminal' : 'text-gray-600'}`}>
                            {item.position}
                          </span>
                          {item.position <= 3 && <div className="h-1 w-4 bg-terminal mt-1 rounded-full shadow-[0_0_8px_#22c55e]" />}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`text-lg font-bold hover:underline flex items-center gap-2 ${item.isMine ? 'text-terminal' : 'text-blue-400'}`}
                            >
                              {item.title}
                              <ExternalLink size={14} className="opacity-50" />
                            </a>
                            {item.isMine && (
                              <span className="bg-terminal text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                                Your Site
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-mono truncate">{item.link}</p>
                          <p className="text-sm text-gray-400 leading-relaxed max-w-4xl">{item.snippet}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {results.length === 0 && !loading && (
            <div className="p-20 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10 text-center flex flex-col items-center">
              <Search className="text-gray-800 mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-500">Ready to Analyze</h3>
              <p className="text-gray-600 mt-2 max-w-sm">Enter a keyword or select one from your target list to see how you stack up against the competition.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SerpsPage() {
  return (
    <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="animate-spin text-terminal" size={48} /></div>}>
      <SerpsContent />
    </Suspense>
  );
}
