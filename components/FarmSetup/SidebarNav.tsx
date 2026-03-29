"use client";
import { motion } from 'framer-motion';
import { Check, MapPin, Layers, Sprout } from 'lucide-react';

interface SidebarNavProps {
  currentStep: number;
}

export default function SidebarNav({ currentStep }: SidebarNavProps) {
  const steps = [
    { id: 1, name: "Location", icon: MapPin, desc: "Where is your farm?" },
    { id: 2, name: "Soil & Season", icon: Layers, desc: "Soil profile & season" },
    { id: 3, name: "Crop History", icon: Sprout, desc: "Past yields & crop" }
  ];

  return (
    <div className="w-full flex flex-col gap-6 py-4">
      <div className="mb-4">
        <h3 className="text-white/40 uppercase text-[10px] font-bold tracking-[0.2em]">Farm Configuration</h3>
      </div>
      
      <div className="flex flex-col gap-4">
        {steps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex items-center gap-4 group cursor-default">
              {/* Connector line */}
              {step.id !== 3 && (
                <div className="absolute left-5 top-10 w-0.5 h-10 bg-white/5 overflow-hidden">
                  <motion.div 
                    className="w-full h-full bg-green-500"
                    initial={{ height: 0 }}
                    animate={{ height: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}

              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isActive || isCompleted ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.03)",
                  borderColor: isActive ? "rgba(34, 197, 94, 0.5)" : isCompleted ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.05)",
                  color: isActive || isCompleted ? "#22c55e" : "#555"
                }}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500 relative z-10 ${
                  isActive ? "shadow-[0_0_20px_rgba(34,197,94,0.15)]" : ""
                }`}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
              </motion.div>

              <div className="flex flex-col">
                <span className={`text-sm font-bold transition-all duration-300 ${
                  isActive ? "text-white" : isCompleted ? "text-white/80" : "text-white/20"
                }`}>
                  {step.name}
                </span>
                <span className={`text-[11px] transition-all duration-300 ${
                  isActive ? "text-green-500/70" : "text-white/10"
                }`}>
                  {step.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
