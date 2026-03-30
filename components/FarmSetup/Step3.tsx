"use client";
import { useState } from 'react';
import { Sprout, Check, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step3Props {
  data: { previousCrop: string };
  updateData: (data: Partial<{ previousCrop: string }>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function Step3({ data, updateData, onSubmit, onBack }: Step3Props) {
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  const handleComplete = () => {
    if (!data.previousCrop.trim()) {
      setError("Please outline your previous crop history.");
      return;
    }
    setError('');
    setCompleting(true);
    setTimeout(() => {
       onSubmit();
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Agricultural Heritage</h2>
        <p className="text-white/40 text-sm max-w-sm">Understanding your crop rotation helps our AI identify nutrient patterns.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest pl-1">Historical Yield Data</label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative flex items-center bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-1 shadow-inner min-h-[140px] items-start">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-green-500 ml-1 mt-1">
                 <Sprout size={22} />
              </div>
              <textarea 
                placeholder="E.g., Wheat, Rice, Sugarcane (3 last seasons)"
                className="flex-1 bg-transparent border-none py-4 px-4 text-white placeholder-white/20 focus:outline-none focus:ring-0 text-lg font-medium resize-none"
                value={data.previousCrop}
                onChange={(e) => updateData({ previousCrop: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-3">
              <div className="p-2 h-fit bg-emerald-500/10 text-emerald-400 rounded-lg">
                 <Sparkles size={16} />
              </div>
              <div>
                 <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Benefit</h4>
                 <p className="text-[11px] text-white/40 leading-relaxed font-medium">Rotation data enables 24% more accurate pest cycle predictions.</p>
              </div>
           </div>
           <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-3">
              <div className="p-2 h-fit bg-blue-500/10 text-blue-400 rounded-lg">
                 <AlertCircle size={16} />
              </div>
              <div>
                 <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Rotation</h4>
                 <p className="text-[11px] text-white/40 leading-relaxed font-medium">Maintains soil biodiversity and nutrient levels naturally.</p>
              </div>
           </div>
        </div>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-rose-500 text-xs font-semibold pl-1 uppercase tracking-tighter">
          {error}
        </motion.p>
      )}

      <div className="flex justify-between pt-4 border-t border-white/5 mt-auto">
        <button 
          onClick={onBack}
          disabled={completing}
          className="text-white/40 hover:text-white font-bold py-4 px-8 rounded-2xl hover:bg-white/5 transition-colors uppercase tracking-widest text-[10px]"
        >
          BACKTRACK
        </button>
        <button 
          onClick={handleComplete}
          disabled={completing}
          className="relative group/next bg-green-500 hover:bg-green-400 text-black font-extrabold py-4 px-10 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:translate-y-[-2px] hover:shadow-[0_20px_40px_rgba(34,197,94,0.5)] min-w-[200px] flex items-center justify-center gap-2"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/next:translate-y-0 transition-transform duration-500" />
          <span className="relative z-10">
            {completing ? "INITIATING SYSTEM..." : "COMPLETE OPS"}
          </span>
          {!completing && <Check size={20} className="relative z-10" />}
        </button>
      </div>
    </div>
  );
}
