import React, { useMemo } from 'react';
import { DentalSetup } from '../types';

interface OdontogramProps {
  data: DentalSetup;
  currentStep: number;
  onToothSelect: (toothId: string) => void;
  selectedTooth: string | null;
}

// FDI Notation
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

// --- Sub-components ---

interface IprMarkerProps {
  value: number;
}

const IprMarker: React.FC<IprMarkerProps> = ({ value }) => {
  return (
    <div className="w-0 relative flex justify-center items-center z-20">
      <div className="absolute -top-4 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-bounce whitespace-nowrap border border-white">
        {Number(value.toFixed(2))}
      </div>
    </div>
  );
};

interface ToothProps {
  id: number;
  data: DentalSetup;
  currentStep: number;
  selectedTooth: string | null;
  onToothSelect: (toothId: string) => void;
}

const Tooth: React.FC<ToothProps> = ({ id, data, currentStep, selectedTooth, onToothSelect }) => {
  const idStr = id.toString();
  
  // 1. Is there an attachment ACTIVE at this step?
  const activeAttachment = data.attachList.find(
    a => a.tooth === idStr && currentStep >= a.beginTime && currentStep <= a.endTime
  );

  // 2. Is there IPR happening EXACTLY at this step? (Used for highlighting the tooth body only)
  const iprActionThisStep = data.iprList.find(
    i => i.tooth === idStr && i.step === currentStep
  );

  // 3. Total IPR accumulated up to this step (Past history)
  const accumulatedIPR = data.iprList
    .filter(i => i.tooth === idStr && i.step <= currentStep)
    .reduce((acc, curr) => acc + curr.mesialIpr + curr.distalIpr, 0);

  const isSelected = selectedTooth === idStr;

  // Base styles
  let borderColor = "border-slate-200";
  let bgColor = "bg-white";
  let textColor = "text-slate-400";
  let shadow = "";
  let transform = "";

  // Dynamic Styling based on Step State
  if (iprActionThisStep) {
    // IPR Action happening NOW -> High alert style
    borderColor = "border-rose-500 ring-2 ring-rose-200";
    bgColor = "bg-rose-50";
    textColor = "text-rose-700";
    shadow = "shadow-md";
    transform = "scale-105";
  } else if (activeAttachment && accumulatedIPR > 0) {
    borderColor = "border-purple-400";
    bgColor = "bg-purple-50";
    textColor = "text-purple-700";
  } else if (activeAttachment) {
    borderColor = "border-blue-400";
    bgColor = "bg-blue-50";
    textColor = "text-blue-700";
  } else if (accumulatedIPR > 0) {
    // Only past IPR, no active action
    borderColor = "border-rose-200";
    bgColor = "bg-white";
    textColor = "text-rose-600";
  }

  // Selection override
  if (isSelected) {
    borderColor = "border-teal-500 ring-2 ring-teal-200";
    bgColor = iprActionThisStep ? "bg-rose-100" : (activeAttachment ? "bg-blue-100" : "bg-teal-50"); 
  }

  const totalIPRDisplay = accumulatedIPR > 0 ? accumulatedIPR.toFixed(2) : null;

  return (
    <div 
      onClick={() => onToothSelect(idStr)}
      className={`relative w-10 h-12 sm:w-12 sm:h-14 flex flex-col items-center justify-center border-2 rounded-lg m-1 cursor-pointer transition-all duration-300 hover:shadow-lg ${borderColor} ${bgColor} ${shadow} ${transform}`}
    >
      <span className={`text-xs sm:text-sm font-bold ${textColor}`}>{id}</span>
      
      {/* Visual Indicators */}
      <div className="flex gap-0.5 mt-1 absolute bottom-1">
        {activeAttachment && (
          <div className="w-2 h-2 rounded-full bg-blue-500" title={`Attachment: ${activeAttachment.name}`}></div>
        )}
        {accumulatedIPR > 0 && !iprActionThisStep && (
          <div className="w-2 h-2 rounded-full bg-rose-300" title={`Total IPR: ${totalIPRDisplay}mm`}></div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

export const Odontogram: React.FC<OdontogramProps> = ({ data, currentStep, onToothSelect, selectedTooth }) => {
  
  // Create a lookup for IPR values at the current step for efficiency
  const currentStepIprMap = useMemo(() => {
    const map: Record<string, { m: number, d: number }> = {};
    const relevantIpr = data.iprList.filter(i => i.step === currentStep);
    relevantIpr.forEach(i => {
      map[i.tooth] = { m: i.mesialIpr, d: i.distalIpr };
    });
    return map;
  }, [data, currentStep]);

  const getIpr = (id: number) => currentStepIprMap[id.toString()] || { m: 0, d: 0 };

  const renderQuadrant = (teeth: number[], direction: 'distal-to-mesial' | 'mesial-to-distal') => {
    const nodes: React.ReactNode[] = [];
    
    teeth.forEach((id, index) => {
      nodes.push(
        <Tooth 
          key={id} 
          id={id} 
          data={data} 
          currentStep={currentStep} 
          selectedTooth={selectedTooth} 
          onToothSelect={onToothSelect} 
        />
      );

      // Check for interdental IPR between this tooth and the next
      if (index < teeth.length - 1) {
        const nextId = teeth[index + 1];
        const currentVals = getIpr(id);
        const nextVals = getIpr(nextId);
        
        let totalIpr = 0;
        
        if (direction === 'distal-to-mesial') {
          // RIGHT Quadrants (e.g. 18->17). Order is Distal->Mesial.
          // Interface is: Current Mesial + Next Distal
          totalIpr = currentVals.m + nextVals.d;
        } else {
          // LEFT Quadrants (e.g. 21->22). Order is Mesial->Distal.
          // Interface is: Current Distal + Next Mesial
          totalIpr = currentVals.d + nextVals.m;
        }

        if (totalIpr > 0.01) {
          nodes.push(<IprMarker key={`ipr-${id}-${nextId}`} value={totalIpr} />);
        }
      }
    });

    return nodes;
  };

  // Midline Calculations
  // Upper: Between 11 (Right Q1 end) and 21 (Left Q2 start)
  const upperMidlineIpr = getIpr(11).m + getIpr(21).m;
  
  // Lower: Between 41 (Right Q4 end) and 31 (Left Q3 start)
  const lowerMidlineIpr = getIpr(41).m + getIpr(31).m;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <span>Dentition Map</span>
          <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Step {currentStep}</span>
        </h3>
        
        {/* Legend */}
        <div className="hidden sm:flex gap-4 text-xs text-slate-500">
           <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span>Attachment</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div>
            <span>IPR Action</span>
          </div>
           <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-300"></div>
            <span>Past IPR</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 items-center overflow-x-auto pb-4">
        {/* Upper Arch */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Maxilla (Upper)</span>
          <div className="flex justify-center">
            {/* Right Side (18-11) */}
            <div className="flex">
              {renderQuadrant(UPPER_RIGHT, 'distal-to-mesial')}
            </div>
            
            {/* Midline Gap */}
            <div className="w-6 sm:w-10 relative flex justify-center items-center">
               {upperMidlineIpr > 0.01 && <IprMarker value={upperMidlineIpr} />}
            </div>

            {/* Left Side (21-28) */}
            <div className="flex">
              {renderQuadrant(UPPER_LEFT, 'mesial-to-distal')}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full max-w-2xl h-px bg-slate-100"></div>

        {/* Lower Arch */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex justify-center">
            {/* Right Side (48-41) */}
            <div className="flex">
              {renderQuadrant(LOWER_RIGHT, 'distal-to-mesial')}
            </div>

            {/* Midline Gap */}
            <div className="w-6 sm:w-10 relative flex justify-center items-center">
              {lowerMidlineIpr > 0.01 && <IprMarker value={lowerMidlineIpr} />}
            </div>

            {/* Left Side (31-38) */}
            <div className="flex">
              {renderQuadrant(LOWER_LEFT, 'mesial-to-distal')}
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Mandible (Lower)</span>
        </div>
      </div>
    </div>
  );
};
