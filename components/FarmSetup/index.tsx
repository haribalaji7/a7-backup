"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, CheckCircle2, ShieldCheck, Database } from 'lucide-react';

import SidebarNav from './SidebarNav';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';

export type WizardData = {
  location: string;
  landArea: string;
  soilType: string;
  season: string;
  previousCrop: string;
};

export default function FarmSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const [data, setData] = useState<WizardData>({
    location: "",
    landArea: "",
    soilType: "",
    season: "",
    previousCrop: "",
  });

  const updateData = (newData: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const completeSetup = () => {
    if (typeof window !== 'undefined') {
       localStorage.setItem('farm_setup_data', JSON.stringify(data));
    }
    
    setToast("Farm intelligence synchronized successfully.");
    
    setTimeout(() => {
       router.push("/");
    }, 2000);
  };

  if (!isReady) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#020202] text-white selection:bg-green-500/30 font-sans tracking-tight overflow-hidden relative">
       
      {/* Immersive Bokeh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-emerald-900/40 blur-[150px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1.1, 1, 1.1], x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-green-950/40 blur-[120px] rounded-full" 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-10" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1040px] h-[640px] bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex overflow-hidden relative z-20"
      >
        {/* Left Interactive Sidebar */}
        <div className="w-[300px] bg-white/[0.02] border-r border-white/5 p-8 flex flex-col relative overflow-hidden">
          <div className="mb-10 flex items-center gap-3">
             <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <Bot className="text-black" size={24} />
             </div>
             <div>
                <h2 className="font-extrabold text-sm tracking-widest text-white leading-none">AGRI-OS</h2>
                <p className="text-[10px] text-green-500 font-bold tracking-tighter uppercase mt-1">v2.4 Core</p>
             </div>
          </div>

          <SidebarNav currentStep={currentStep} />

          <div className="mt-auto space-y-4">
             <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                   <ShieldCheck className="text-blue-400" size={14} />
                   <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Privacy Secured</span>
                </div>
                <p className="text-[11px] text-white/20 leading-relaxed">End-to-end encrypted satellite data synchronization for your farm.</p>
             </div>
          </div>
        </div>

        {/* Right Dynamic Form Area */}
        <div className="flex-1 p-12 flex flex-col relative overflow-hidden">
          
          <div className="absolute top-12 right-12 flex gap-4 opacity-20 pointer-events-none">
             <Database size={24} />
             <Sparkles size={24} />
          </div>

          <div className="relative z-10 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                {currentStep === 1 && (
                  <Step1 data={data} updateData={updateData} onNext={nextStep} />
                )}
                {currentStep === 2 && (
                  <Step2 data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />
                )}
                {currentStep === 3 && (
                  <Step3 data={data} updateData={updateData} onSubmit={completeSetup} onBack={prevStep} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </motion.div>

      {/* Completion Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-12 bg-white text-black p-4 px-8 rounded-full shadow-[0_20px_50px_rgba(34,197,94,0.4)] z-[100] flex items-center gap-4 border border-green-500/50"
          >
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
