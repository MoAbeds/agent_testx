'use client';

import { useState } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function AddKeywordButton({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAdd = async () => {
    if (!keyword.trim()) return;
    setLoading(true);

    try {
      const siteRef = doc(db, "sites", siteId);
      const siteSnap = await getDoc(siteRef);
      
      if (siteSnap.exists()) {
        const data = siteSnap.data();
        let targetKeywords = { detailed: [] };
        
        try {
          if (data.targetKeywords) {
            targetKeywords = JSON.parse(data.targetKeywords);
          }
        } catch (e) {
          console.error("Failed to parse existing keywords", e);
        }

        // Add the new keyword
        const newKeyword = {
          keyword: keyword.trim(),
          relevance: 'Manual',
          competition: 'Custom',
          results: '0'
        };

        const updatedDetailed = [newKeyword, ...(targetKeywords.detailed || [])];
        const updatedData = {
          ...targetKeywords,
          detailed: updatedDetailed,
          updatedAt: new Date().toISOString()
        };

        await updateDoc(siteRef, {
          targetKeywords: JSON.stringify(updatedData)
        });

        setKeyword('');
        setShowInput(false);
      }
    } catch (error) {
      console.error("Error adding keyword:", error);
      alert("Failed to add keyword.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {showInput ? (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
          <input 
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Enter keyword..."
            className="bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-terminal outline-none w-40"
            autoFocus
          />
          <button 
            onClick={handleAdd}
            disabled={loading || !keyword.trim()}
            className="text-terminal hover:text-green-400 p-1 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={16} />}
          </button>
          <button 
            onClick={() => setShowInput(false)}
            className="text-gray-500 hover:text-gray-300 p-1"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setShowInput(true)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors bg-gray-800/50 px-2 py-1 rounded border border-gray-700"
        >
          <Plus size={12} />
          Add Keyword
        </button>
      )}
    </div>
  );
}
