"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, MapPin, Layers, Sprout } from 'lucide-react';

import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';

export type WizardData = {
  location: string;
  landArea: string;
  soilType: string;
  season: string;
  previousCrop: string;
  lat?: number;
  lng?: number;
  crop?: string;
};

const steps = [
  { id: 1, title: "Location", icon: MapPin },
  { id: 2, title: "Crop & Soil", icon: Layers },
  { id: 3, title: "History", icon: Sprout },
];

export default function FarmSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);

  const [data, setData] = useState<WizardData>({
    location: "",
    landArea: "",
    soilType: "",
    season: "",
    previousCrop: "",
    lat: undefined,
    lng: undefined,
    crop: undefined,
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
    setCompleted(true);
    setTimeout(() => {
       router.push("/");
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <div className="page-title">Farm Setup</div>
      <p className="page-subtitle">Configure your farm details for AI-powered analysis</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div 
                onClick={() => step.id < currentStep && (step.id === 1 ? prevStep() : step.id === 2 ? setCurrentStep(2) : setCurrentStep(3))}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  cursor: step.id < currentStep ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (step.id < currentStep) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(34,197,94,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Icon size={16} style={{ color: currentStep >= step.id ? '#16a34a' : '#9ca3af' }} />
                <span style={{ 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: currentStep >= step.id ? '#16a34a' : '#9ca3af' 
                }}>{step.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight size={16} style={{ color: '#9ca3af', margin: '0 4px' }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 24, maxWidth: 500, margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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

      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#22c55e',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 8,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <CheckCircle2 size={18} />
            Setup complete!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
