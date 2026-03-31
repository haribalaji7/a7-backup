"use client";
import { useState } from 'react';

interface Step2Props {
  data: { soilType: string; season: string; crop?: string };
  updateData: (data: Partial<{ soilType: string; season: string; crop?: string }>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2({ data, updateData, onNext, onBack }: Step2Props) {
  const [error, setError] = useState('');

  const crops = ['Wheat', 'Rice', 'Cotton', 'Corn', 'Soybean', 'Sugarcane', 'Groundnut', 'Potato', 'Tomato', 'Vegetables'];
  const soils = ['Black', 'Red', 'Sandy', 'Loamy'];

  const handleNext = () => {
    if (!data.soilType || !data.season || !data.crop) {
      setError("Please select all fields");
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="page-title">Step 2: Crop Details</div>
      <p className="page-subtitle">Select your soil type, season, and main crop</p>

      <div className="field">
        <label className="field-label">Soil Type</label>
        <div className="grid grid-cols-4 gap-2">
          {soils.map(s => (
            <button
              key={s}
              onClick={() => updateData({ soilType: s })}
              className={`btn-option ${data.soilType === s ? 'active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label">Season</label>
        <select 
          className="field-select"
          value={data.season}
          onChange={(e) => updateData({ season: e.target.value })}
        >
          <option value="">Select season</option>
          <option value="Monsoon">Monsoon</option>
          <option value="Winter">Winter</option>
          <option value="Summer">Summer</option>
        </select>
      </div>

      <div className="field">
        <label className="field-label">Main Crop</label>
        <div className="grid grid-cols-2 gap-2">
          {crops.map(c => (
            <button
              key={c}
              onClick={() => updateData({ crop: c })}
              className={`btn-option ${data.crop === c ? 'active' : ''}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button onClick={handleNext} className="btn-primary">Next</button>
      </div>
    </div>
  );
}
