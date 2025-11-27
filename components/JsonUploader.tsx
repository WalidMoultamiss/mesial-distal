import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { DentalSetup } from '../types';

interface JsonUploaderProps {
  onDataLoaded: (data: DentalSetup) => void;
}

const SAMPLE_JSON = {
  "id": "57a2a6a4-bcf6-4318-be89-8facb903502d",
  "setupName": "Setup",
  "upperEndIn": 15,
  "lowerEndIn": 46,
  "upperStartFrom": 0,
  "lowerStartFrom": 0,
  "version": null,
  "maxAligners": 15,
  "manAligners": 46,
  "attachCount": 15,
  "bracketCount": 0,
  "maxIpr": 0,
  "manIpr": 4.7,
  "attachList": [
    { "name": "Att_1", "tooth": "16", "beginTime": 0, "endTime": 15, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "13", "beginTime": 0, "endTime": 15, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "12", "beginTime": 0, "endTime": 15, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "22", "beginTime": 0, "endTime": 15, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "23", "beginTime": 0, "endTime": 15, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "26", "beginTime": 0, "endTime": 15, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "35", "beginTime": 0, "endTime": 46, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "33", "beginTime": 0, "endTime": 46, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "32", "beginTime": 0, "endTime": 46, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "31", "beginTime": 0, "endTime": 46, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "41", "beginTime": 0, "endTime": 46, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "42", "beginTime": 0, "endTime": 46, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "43", "beginTime": 0, "endTime": 46, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "44", "beginTime": 0, "endTime": 46, "attachGuid": "..." },
    { "name": "Att_1", "tooth": "46", "beginTime": 0, "endTime": 46, "attachGuid": "..." }
  ],
  "precisionCutList": [],
  "iprList": [
    { "tooth": "36", "step": 4, "mesialIpr": 0.25, "distalIpr": 0 },
    { "tooth": "35", "step": 4, "mesialIpr": 0, "distalIpr": 0.25 },
    { "tooth": "46", "step": 4, "mesialIpr": 0.2, "distalIpr": 0 }
  ],
  "extractList": [],
  "positionersList": { "upper": [0], "lower": [0] }
};

export const JsonUploader: React.FC<JsonUploaderProps> = ({ onDataLoaded }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    try {
      if (!input.trim()) {
        setError("Please paste your JSON content first.");
        return;
      }
      const parsed = JSON.parse(input);
      // Basic validation
      if (!parsed.id || !Array.isArray(parsed.attachList)) {
        throw new Error("Invalid format: Missing 'id' or 'attachList'.");
      }
      setError(null);
      onDataLoaded(parsed as DentalSetup);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadSample = () => {
    setInput(JSON.stringify(SAMPLE_JSON, null, 2));
    onDataLoaded(SAMPLE_JSON as any as DentalSetup);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200 mt-10">
      <div className="text-center mb-8">
        <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">OrthoPlan JSON Viewer</h2>
        <p className="text-slate-500 mt-2">Paste your setup JSON file below to visualize the treatment plan.</p>
      </div>

      <div className="space-y-4">
        <textarea
          className="w-full h-64 p-4 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
          placeholder="Paste JSON here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleParse}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Upload size={18} />
            Visualize Plan
          </button>
          <button
            onClick={loadSample}
            className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Load Sample
          </button>
        </div>
      </div>
    </div>
  );
};
