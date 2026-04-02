# Read the current FarmSetup index.tsx and create a simpler version
with open('components/FarmSetup/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the complex bokeh background and large card with simpler page-style layout
new_wizard = '''"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Layers, Sprout } from 'lucide-react';

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
  { id: 1, title: "Location", icon: MapPin, desc: "Farm coordinates" },
  { id: 2, title: "Crop & Soil", icon: Layers, desc: "Growing conditions" },
  { id: 3, title: "History", icon: Sprout, desc: "Previous crops" },
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
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="page-title">Farm Setup</div>
        <div className="page-subtitle">Configure your farm details for AI-powered analysis</div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto mb-8">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0 }}>
          {steps.map((step, idx) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10,
                padding: '12px 20px',
                borderRadius: 12,
                background: currentStep >= step.id ? '#22c55e' : 'rgba(255,255,255,0.05)',
                border: currentStep >= step.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer'
              }}>
                <step.icon size={18} style={{ color: currentStep >= step.id ? '#000' : '#666' }} />
                <div>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: currentStep >= step.id ? '#000' : '#fff' 
                  }}>{step.title}</div>
                  <div style={{ fontSize: 10, color: currentStep >= step.id ? '#000' : '#666' }}>{step.desc}</div>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight size={20} style={{ color: '#333', margin: '0 8px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-4xl mx-auto">
        <div className="card" style={{ padding: 24, minHeight: 400 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
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

      {/* Success Toast */}
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
              color: '#000',
              padding: '16px 32px',
              borderRadius: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <CheckCircle2 size={20} />
            Farm setup completed!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}'''

# Find the start of the file and replace
if '"use client"' in content:
    # Keep imports and replace the rest
    import_end = content.find('export default function FarmSetupWizard')
    if import_end > 0:
        new_content = content[:import_end] + new_wizard
        with open('components/FarmSetup/index.tsx', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Simplified FarmSetup wizard to match other page styles!")
    else:
        print("Could not find replacement point")
else:
    print("File structure unexpected")