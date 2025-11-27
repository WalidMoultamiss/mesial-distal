import React from 'react';
import { DentalSetup, Attachment, IprEntry } from '../types';
import { Timer, ArrowRightLeft, Plus, Trash2, Save, X } from 'lucide-react';

interface ToothDetailsProps {
  data: DentalSetup;
  toothId: string | null;
  currentStep: number;
  onClose: () => void;
  onUpdate: (data: DentalSetup) => void;
}

export const ToothDetails: React.FC<ToothDetailsProps> = ({ 
  data, 
  toothId, 
  currentStep, 
  onClose, 
  onUpdate 
}) => {
  if (!toothId) return null;

  const attachments = data.attachList.filter(a => a.tooth === toothId);
  const iprEvents = data.iprList.filter(i => i.tooth === toothId).sort((a, b) => a.step - b.step);

  // --- Handlers for Attachments ---

  const handleAddAttachment = () => {
    const newAtt: Attachment = {
      name: "New_Att",
      tooth: toothId,
      beginTime: currentStep,
      endTime: Math.max(data.upperEndIn, data.lowerEndIn),
      attachGuid: crypto.randomUUID()
    };
    const newData = {
      ...data,
      attachList: [...data.attachList, newAtt]
    };
    onUpdate(newData);
  };

  const handleUpdateAttachment = (guid: string, field: keyof Attachment, value: any) => {
    const newData = {
      ...data,
      attachList: data.attachList.map(a => 
        a.attachGuid === guid ? { ...a, [field]: value } : a
      )
    };
    onUpdate(newData);
  };

  const handleDeleteAttachment = (guid: string) => {
    const newData = {
      ...data,
      attachList: data.attachList.filter(a => a.attachGuid !== guid)
    };
    onUpdate(newData);
  };

  // --- Handlers for IPR ---

  const currentStepIpr = data.iprList.find(i => i.tooth === toothId && i.step === currentStep);

  const handleUpdateIpr = (field: 'mesialIpr' | 'distalIpr', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return; // Basic validation

    let newIprList = [...data.iprList];
    const existingIndex = newIprList.findIndex(i => i.tooth === toothId && i.step === currentStep);

    if (existingIndex >= 0) {
      // Update existing
      newIprList[existingIndex] = {
        ...newIprList[existingIndex],
        [field]: numValue
      };
      
      // Remove if both zero (optional, but keeps data clean)
      if (newIprList[existingIndex].mesialIpr === 0 && newIprList[existingIndex].distalIpr === 0) {
        newIprList.splice(existingIndex, 1);
      }
    } else {
      // Create new
      if (numValue > 0) {
        const newEntry: IprEntry = {
          tooth: toothId,
          step: currentStep,
          mesialIpr: 0,
          distalIpr: 0,
          [field]: numValue
        };
        newIprList.push(newEntry);
      }
    }

    onUpdate({ ...data, iprList: newIprList });
  };


  return (
    <div className="bg-white border-l border-slate-200 w-full md:w-80 flex-shrink-0 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="font-bold text-slate-800">Tooth {toothId}</h3>
          <p className="text-xs text-slate-500">Editing at Step {currentStep}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded">
          <X size={18} />
        </button>
      </div>
      
      <div className="overflow-y-auto flex-1 p-4 space-y-8">
        
        {/* IPR Editor (Current Step) */}
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
          <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ArrowRightLeft size={14} /> IPR at Step {currentStep}
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-rose-600 uppercase mb-1">Mesial (mm)</label>
              <input 
                type="number" 
                step="0.05"
                min="0"
                className="w-full p-2 text-sm border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-400 outline-none text-rose-900 bg-white"
                value={currentStepIpr?.mesialIpr || 0}
                onChange={(e) => handleUpdateIpr('mesialIpr', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-rose-600 uppercase mb-1">Distal (mm)</label>
              <input 
                type="number" 
                step="0.05"
                min="0"
                className="w-full p-2 text-sm border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-400 outline-none text-rose-900 bg-white"
                value={currentStepIpr?.distalIpr || 0}
                onChange={(e) => handleUpdateIpr('distalIpr', e.target.value)}
              />
            </div>
          </div>
          <p className="text-[10px] text-rose-500 mt-2 leading-tight">
            Adjust values to add IPR for this specific step. Set to 0 to remove.
          </p>
        </div>

        {/* Attachments Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Timer size={14} /> Attachments
            </h4>
            <button 
              onClick={handleAddAttachment}
              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 flex items-center gap-1 font-medium"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {attachments.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-lg">
              No attachments configured.
            </p>
          ) : (
            <div className="space-y-3">
              {attachments.map((att) => (
                <div key={att.attachGuid} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm group hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-slate-700 text-sm">{att.name}</span>
                    <button 
                      onClick={() => handleDeleteAttachment(att.attachGuid)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Start Step</label>
                      <input 
                        type="number"
                        className="w-full p-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                        value={att.beginTime}
                        onChange={(e) => handleUpdateAttachment(att.attachGuid, 'beginTime', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">End Step</label>
                      <input 
                        type="number"
                        className="w-full p-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                        value={att.endTime}
                        onChange={(e) => handleUpdateAttachment(att.attachGuid, 'endTime', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IPR History List */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            History Log
          </h4>
          <div className="border-l-2 border-slate-100 ml-2 space-y-4 py-2">
            {iprEvents.length === 0 ? (
              <p className="pl-4 text-sm text-slate-400 italic">No IPR history.</p>
            ) : (
              iprEvents.map((ipr, idx) => (
                <div key={idx} className="ml-4 relative">
                  <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${ipr.step === currentStep ? 'bg-rose-500 ring-2 ring-rose-200' : 'bg-slate-300'}`}></div>
                  <div className={`text-xs p-2 rounded border ${ipr.step === currentStep ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="font-bold text-slate-700 block mb-1">Step {ipr.step}</span>
                    <div className="flex gap-3 text-slate-600">
                      {ipr.mesialIpr > 0 && <span>M: {ipr.mesialIpr}</span>}
                      {ipr.distalIpr > 0 && <span>D: {ipr.distalIpr}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};