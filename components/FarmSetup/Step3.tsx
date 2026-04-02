"use client";
import { useState } from 'react';

interface Step3Props {
  data: { previousCrop: string };
  updateData: (data: Partial<{ previousCrop: string }>) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function Step3({ data, updateData, onSubmit, onBack }: Step3Props) {
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!data.previousCrop.trim()) {
      setError("Please enter crop history");
      return;
    }
    onSubmit();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="page-title">Step 3: History</div>
      <p className="page-subtitle">Previous crop rotation history</p>

      <div className="field">
        <label className="field-label">Previous Crops</label>
        <textarea 
          placeholder="e.g., Wheat, Rice, Sugarcane (last 3 seasons)"
          className="field-input"
          value={data.previousCrop}
          onChange={(e) => updateData({ previousCrop: e.target.value })}
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button onClick={handleSubmit} className="btn-primary">Complete</button>
      </div>
    </div>
  );
}
