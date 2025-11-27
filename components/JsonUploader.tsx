import React, { useState, useEffect } from 'react';
import { Upload, FileText, AlertCircle, Cloud, ArrowRight, Eye, Link as LinkIcon } from 'lucide-react';
import { DentalSetup } from '../types';
import { getDocumentAlignersInfoV2, NemoConfig } from '../nemo-functions';

interface JsonUploaderProps {
  onDataLoaded: (data: DentalSetup) => void;
}

const PRESETS = [
  { 
    id: 'f411c674-7e0c-435c-87bf-d0a6cd3e1709', 
    label: 'Case 1', 
    url: 'https://downloads-default.nemocloud-services.com/DownloadUploadService/nemobox/app/workspace/patient/documents/editor/f411c674-7e0c-435c-87bf-d0a6cd3e1709?currentPage=%7B%22page%22:1,%22size%22:10%7D&patientId=3cf398fe-b855-4394-8760-7d4c0b20b7e6&centerId=293-52-09-19'
  },
  { 
    id: 'b6374d75-81a6-4a38-af29-e7e230e5182a', 
    label: 'Case 2', 
    url: 'https://downloads-default.nemocloud-services.com/DownloadUploadService/nemobox/app/workspace/patient/documents/editor/b6374d75-81a6-4a38-af29-e7e230e5182a?currentPage=%7B%22page%22:1,%22size%22:10%7D&patientId=64169f8e-fee6-453d-9de2-802028bdecaa&centerId=293-52-09-19'
  },
  { 
    id: '56c20be7-a184-48ee-8069-97322ca60b82', 
    label: 'Case 3', 
    url: 'https://downloads-default.nemocloud-services.com/DownloadUploadService/nemobox/app/workspace/patient/documents/editor/56c20be7-a184-48ee-8069-97322ca60b82?currentPage=%7B%22page%22:1,%22size%22:10%7D&patientId=a7969c67-cd55-4e00-a161-26b9ad1ad79a&centerId=293-52-09-19'
  }
];

const SAMPLE_JSON = {
  "id": "57a2a6a4-bcf6-4318-be89-8facb903502d",
  "setupName": "Setup",
  "upperEndIn": 16,
  "lowerEndIn": 47,
  "upperStartFrom": 1,
  "lowerStartFrom": 1,
  "version": null,
  "maxAligners": 16,
  "manAligners": 47,
  "attachCount": 15,
  "bracketCount": 0,
  "maxIpr": 0,
  "manIpr": 4.7,
  "attachList": [
    { "name": "Att_1", "tooth": "16", "beginTime": 1, "endTime": 16, "attachGuid": "43C0C100-61F0-4A33-BB5A-9BAFBF6FF44A" },
    { "name": "Att_1", "tooth": "13", "beginTime": 1, "endTime": 16, "attachGuid": "977195E7-A345-47A6-A6A0-5A7E089DD824" },
    { "name": "Att_1", "tooth": "12", "beginTime": 1, "endTime": 16, "attachGuid": "CEDD5BAC-E87A-4864-9A7B-5AB11B4D065F" },
    { "name": "Att_1", "tooth": "22", "beginTime": 1, "endTime": 16, "attachGuid": "3AEB752C-C854-464E-9942-A84354B2ECCD" },
    { "name": "Att_1", "tooth": "23", "beginTime": 1, "endTime": 16, "attachGuid": "11B95267-8E81-4014-999F-5DDD51485448" },
    { "name": "Att_1", "tooth": "26", "beginTime": 1, "endTime": 16, "attachGuid": "37D197BA-020F-4926-AE99-DBC5683FCE94" },
    { "name": "Att_1", "tooth": "35", "beginTime": 1, "endTime": 47, "attachGuid": "65B398AC-63FD-4B8B-A150-01DD9CCA8C8D" },
    { "name": "Att_1", "tooth": "33", "beginTime": 1, "endTime": 47, "attachGuid": "39538EEC-8B43-470D-99F3-07DA0A95840E" },
    { "name": "Att_1", "tooth": "32", "beginTime": 1, "endTime": 47, "attachGuid": "581E045B-7113-480B-9020-2A7507EBB0F0" },
    { "name": "Att_1", "tooth": "31", "beginTime": 1, "endTime": 47, "attachGuid": "3C569781-ACBE-4AD2-A526-043FFB6B64F8" },
    { "name": "Att_1", "tooth": "41", "beginTime": 1, "endTime": 47, "attachGuid": "DD415B4A-ACAA-467B-8A1D-2CD8793C4929" },
    { "name": "Att_1", "tooth": "42", "beginTime": 1, "endTime": 47, "attachGuid": "767ECB7C-B54A-4D4E-B668-4C91ECD0CEA2" },
    { "name": "Att_1", "tooth": "43", "beginTime": 1, "endTime": 47, "attachGuid": "0C1759E6-A2A3-4C97-83C8-13B9ADB7B918" },
    { "name": "Att_1", "tooth": "44", "beginTime": 1, "endTime": 47, "attachGuid": "D5A05D8B-2BFF-46C9-B335-9696DF88FEEA" },
    { "name": "Att_1", "tooth": "46", "beginTime": 1, "endTime": 47, "attachGuid": "E3950FBB-AB5C-4F66-A66B-F174040C723D" }
  ],
  "precisionCutList": [],
  "iprList": [
    { "tooth": "36", "step": 5, "mesialIpr": 0.25, "distalIpr": 0 },
    { "tooth": "35", "step": 5, "mesialIpr": 0, "distalIpr": 0.25 },
    { "tooth": "46", "step": 5, "mesialIpr": 0.2, "distalIpr": 0 }
  ],
  "extractList": [],
  "positionersList": { "upper": [1], "lower": [1] }
};

export const JsonUploader: React.FC<JsonUploaderProps> = ({ onDataLoaded }) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'cloud'>('paste');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Cloud Inputs
  const [docId, setDocId] = useState('');
  const [env, setEnv] = useState('production');
  const [authToken, setAuthToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Helper to extract ID from URL
  const extractIdFromInput = (value: string) => {
    // Regex for UUID v4
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = value.match(uuidRegex);
    return match ? match[0] : value.trim();
  };

  const handleDocIdChange = (val: string) => {
    const extracted = extractIdFromInput(val);
    setDocId(extracted);
  };

  const handlePresetSelect = (presetId: string) => {
    setDocId(presetId);
  };

  // Find matching preset for current DocID
  const currentPreset = PRESETS.find(p => p.id.toLowerCase() === docId.toLowerCase());

  // Adjust steps by -1 so that "step 1" in API becomes "Step 0" in Viewer.
  const adjustSteps = (data: DentalSetup): DentalSetup => {
    // Create a deep copy to avoid mutating the source immediately
    const newData = JSON.parse(JSON.stringify(data));

    // 1. Shift IPR steps
    if (Array.isArray(newData.iprList)) {
      newData.iprList = newData.iprList.map((item: any) => ({
        ...item,
        step: Math.max(0, (typeof item.step === 'number' ? item.step : parseInt(item.step)) - 1)
      }));
    }

    // 2. Shift Attachment times
    if (Array.isArray(newData.attachList)) {
      newData.attachList = newData.attachList.map((item: any) => ({
        ...item,
        beginTime: Math.max(0, (typeof item.beginTime === 'number' ? item.beginTime : parseInt(item.beginTime)) - 1),
        endTime: Math.max(0, (typeof item.endTime === 'number' ? item.endTime : parseInt(item.endTime)) - 1)
      }));
    }

    // 3. Shift Global Bounds
    if (typeof newData.upperEndIn === 'number') newData.upperEndIn = Math.max(0, newData.upperEndIn - 1);
    if (typeof newData.lowerEndIn === 'number') newData.lowerEndIn = Math.max(0, newData.lowerEndIn - 1);
    if (typeof newData.upperStartFrom === 'number') newData.upperStartFrom = Math.max(0, newData.upperStartFrom - 1);
    if (typeof newData.lowerStartFrom === 'number') newData.lowerStartFrom = Math.max(0, newData.lowerStartFrom - 1);

    // 4. Shift Positioners (if any)
    if (newData.positionersList) {
      if (Array.isArray(newData.positionersList.upper)) {
        newData.positionersList.upper = newData.positionersList.upper.map((s: number) => Math.max(0, s - 1));
      }
      if (Array.isArray(newData.positionersList.lower)) {
        newData.positionersList.lower = newData.positionersList.lower.map((s: number) => Math.max(0, s - 1));
      }
    }

    // 5. Shift extractions/cuts if present
    if (Array.isArray(newData.extractList)) {
      newData.extractList = newData.extractList.map((item: any) => ({
         ...item,
         step: Math.max(0, (item.step || 0) - 1)
      }));
    }
    if (Array.isArray(newData.precisionCutList)) {
      newData.precisionCutList = newData.precisionCutList.map((item: any) => ({
         ...item,
         beginTime: Math.max(0, (item.beginTime || 0) - 1),
         endTime: Math.max(0, (item.endTime || 0) - 1)
      }));
    }

    return newData;
  };

  const handleParse = () => {
    try {
      if (!input.trim()) {
        setError("Please paste your JSON content first.");
        return;
      }
      const parsed = JSON.parse(input);
      if (!parsed.id || !Array.isArray(parsed.attachList)) {
        throw new Error("Invalid format: Missing 'id' or 'attachList'.");
      }
      setError(null);
      // Apply the -1 shift logic
      const adjustedData = adjustSteps(parsed as DentalSetup);
      onDataLoaded(adjustedData);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const loadSample = () => {
    setInput(JSON.stringify(SAMPLE_JSON, null, 2));
    // Apply the -1 shift logic to sample data too
    const adjustedData = adjustSteps(SAMPLE_JSON as any as DentalSetup);
    onDataLoaded(adjustedData);
  };

  const handleCloudFetch = async () => {
    if (!docId.trim()) {
      setError("Please enter a Document ID.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const config: NemoConfig = {
        env: env,
        authHeader: authToken.trim() ? `Simse ${authToken.trim()}` : undefined
      };

      const data = await getDocumentAlignersInfoV2(docId.trim(), config);
      
      if (!data) {
        throw new Error("No data returned for this Document ID.");
      }
      
      // Apply the -1 shift logic
      const adjustedData = adjustSteps(data as DentalSetup);
      onDataLoaded(adjustedData);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to fetch data from cloud.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('paste'); setError(null); }}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'paste' 
                ? 'bg-white text-teal-600 border-b-2 border-teal-600' 
                : 'bg-slate-50 text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={18} />
            Paste JSON
          </button>
          <button
            onClick={() => { setActiveTab('cloud'); setError(null); }}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'cloud' 
                ? 'bg-white text-teal-600 border-b-2 border-teal-600' 
                : 'bg-slate-50 text-slate-500 hover:text-slate-700'
            }`}
          >
            <Cloud size={18} />
            Nemotec Cloud
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">OrthoPlan Viewer</h2>
            <p className="text-slate-500 mt-2">
              {activeTab === 'paste' ? 'Paste your setup JSON file below.' : 'Fetch directly from Nemotec services.'}
            </p>
          </div>

          {activeTab === 'paste' ? (
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
          ) : (
            <div className="space-y-4 max-w-lg mx-auto">
              
              {/* Preset Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Quick Select</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  value={PRESETS.some(p => p.id === docId) ? docId : ''}
                >
                  <option value="" disabled>Select a preset case...</option>
                  {PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

               <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Environment</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  value={env}
                  onChange={(e) => setEnv(e.target.value)}
                >
                  <option value="production">Production</option>
                  <option value="preprod">Pre-Production</option>
                  <option value="development">Development</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Document ID (or URL)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. 57a2a6a4-bcf6... or https://..."
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono text-sm"
                    value={docId}
                    onChange={(e) => handleDocIdChange(e.target.value)}
                  />
                  {currentPreset && (
                    <a 
                      href={currentPreset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center justify-center"
                      title="View Source in Nemotec"
                    >
                      <Eye size={20} />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Auth Token (Optional)</label>
                <input 
                  type="password"
                  placeholder="Simse token (if not using environment defaults)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                />
                <p className="text-xs text-slate-400">Leave empty if you don't have a specific token.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm mt-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                onClick={handleCloudFetch}
                disabled={isLoading}
                className={`w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all mt-4 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Fetching...
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    Load from Cloud
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};