"use client";
import { useState } from 'react';
import { Layers, CloudSun, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step2Props {
  data: { soilType: string; season: string };
  updateData: (data: Partial<{ soilType: string; season: string }>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2({ data, updateData, onNext, onBack }: Step2Props) {
  const [error, setError] = useState('');

  const soilOptions = [
    { value: 'Black', label: 'Black Soil', desc: 'Moisture retentive, rich in minerals' },
    { value: 'Red', label: 'Red Soil', desc: 'Well-draining, rich in iron' },
    { value: 'Sandy', label: 'Sandy Soil', desc: 'Coarse texture, high drainage' },
    { value: 'Loamy', label: 'Loamy Soil', desc: 'Balanced, fertile for most crops' }
  ];

  const handleNext = () => {
    if (!data.soilType || !data.season) {
      setError("Please select both soil type and current season.");
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Environmental Core</h2>
        <p className="text-white/40 text-sm max-w-sm">Help the AI optimize crop advice for your specific soil type and season.</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-3">
          {soilOptions.map(option => (
             <div 
               key={option.value} 
               onClick={() => updateData({ soilType: option.value })}
               className={`relative cursor-pointer group rounded-2xl border transition-all duration-300 p-4 ${
                 data.soilType === option.value 
                   ? "bg-green-500/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]" 
                   : "bg-white/5 border-white/5 hover:border-white/20"
               }`}
             >
               <div className="flex justify-between items-start mb-2">
                 <div className={`p-2 rounded-lg ${data.soilType === option.value ? "bg-green-500/20 text-green-500" : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60"} transition-all duration-300`}>
                    <Layers size={18} />
                 </div>
                 {data.soilType === option.value && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500">
                       <CheckCircle2 size={18} />
                    </motion.div>
                 )}
               </div>
               <h3 className="font-bold text-sm tracking-tight mb-1 text-white">{option.label}</h3>
               <p className="text-[10px] text-white/30 font-medium leading-relaxed">{option.desc}</p>
             </div>
          ))}
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest pl-1">Primary Cultivation Season</label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative flex items-center bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-1 shadow-inner h-[60px]">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-green-500 ml-1">
                 <CloudSun size={22} />
              </div>
              <select 
                className="flex-1 bg-transparent border-none py-4 px-4 text-white appearance-none focus:outline-none focus:ring-0 text-lg font-medium cursor-pointer"
                value={data.season}
                onChange={(e) => updateData({ season: e.target.value })}
              >
                <option value="" disabled className="bg-gray-900 text-white/50 italic">Select active season</option>
                {['Kharif', 'Rabi', 'Zaid'].map(s => (
                  <option key={s} value={s} className="bg-gray-900 text-white font-medium">{s} Season</option>
                ))}
              </select>
              <div className="px-6 flex items-center h-full opacity-40">
                <ChevronDown size={20} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-rose-500 text-xs font-semibold pl-1 uppercase tracking-tighter"
        >
          {error}
        </motion.p>
      )}

      <div className="flex justify-between pt-4 border-t border-white/5 mt-auto">
        <button 
          onClick={onBack}
          className="text-white/40 hover:text-white font-bold py-4 px-8 rounded-2xl hover:bg-white/5 transition-colors uppercase tracking-widest text-[10px]"
        >
          BACKTRACK
        </button>
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
