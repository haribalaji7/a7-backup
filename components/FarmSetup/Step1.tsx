"use client";
import { useState } from 'react';
import { MapPin, Target, Loader2, Maximize, Ghost } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step1Props {
  data: { location: string; landArea: string };
  updateData: (data: Partial<{ location: string; landArea: string }>) => void;
  onNext: () => void;
}

export default function Step1({ data, updateData, onNext }: Step1Props) {
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [error, setError] = useState('');

  const getLocation = () => {
    setLoadingLoc(true);
    if (!navigator.geolocation) {
       setError("Geolocation is not supported by your browser.");
       setLoadingLoc(false);
       return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const result = await res.json();
        const cityOrVillage = result.address.city || result.address.town || result.address.village || result.address.county || "Unknown Location";
        updateData({ location: cityOrVillage });
      } catch (e) {
        setError("Failed to fetch location automatically.");
      } finally {
        setLoadingLoc(false);
      }
    }, () => {
       setError("Permission denied or location unavailable.");
       setLoadingLoc(false);
    });
  };

  const handleNext = () => {
    if (!data.location.trim() || !data.landArea.trim()) {
      setError("Please fill out both fields to proceed.");
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Geographic Hub</h2>
        <p className="text-white/40 text-sm max-w-sm">Every smart farm starts with accurate geographic grounding. Where is the pulse of your soil?</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest pl-1">Primary Operation Base</label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative flex items-center bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-1 shadow-inner h-[60px]">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-green-500 ml-1">
                 <MapPin size={22} />
              </div>
              <input 
                type="text" 
                placeholder="E.g., Ludhiana, Punjab"
                className="flex-1 bg-transparent border-none py-4 px-4 text-white placeholder-white/20 focus:outline-none focus:ring-0 text-lg font-medium"
                value={data.location}
                onChange={(e) => updateData({ location: e.target.value })}
              />
              <button 
                onClick={getLocation} 
                className="h-full px-6 flex items-center gap-2 group/btn border-l border-white/5"
              >
                {loadingLoc ? (
                   <Loader2 size={20} className="animate-spin text-green-500" />
                ) : (
                   <div className="bg-white/5 p-2 rounded-xl group-hover/btn:bg-green-500/10 transition-colors">
                     <Target size={20} className="text-white/40 group-hover/btn:text-green-500" />
                   </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest pl-1">Total Coverage Area</label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative flex items-center bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-1 shadow-inner h-[60px]">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-green-500 ml-1">
                 <Maximize size={22} />
              </div>
              <input 
                type="number" 
                placeholder="0.0"
                className="flex-1 bg-transparent border-none py-4 px-4 text-white placeholder-white/20 focus:outline-none focus:ring-0 text-lg font-medium"
                value={data.landArea}
                onChange={(e) => updateData({ landArea: e.target.value })}
              />
              <div className="px-6 flex items-center gap-2 border-l border-white/5 h-full opacity-40">
                <span className="text-sm font-bold tracking-widest text-white uppercase italic">ACRES</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-rose-500 text-xs font-semibold pl-1 uppercase tracking-tighter"
        >
          {error}
        </motion.p>
      )}

      <div className="flex justify-end pt-4 border-t border-white/5 mt-auto">
        <button 
          onClick={handleNext}
          className="relative group/next bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-10 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:translate-y-[-2px] hover:shadow-[0_15px_30px_rgba(34,197,94,0.4)]"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/next:translate-y-0 transition-transform duration-500" />
          <span className="relative z-10">NEXT PHASE</span>
        </button>
      </div>
    </div>
  );
}
