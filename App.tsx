import React, { useState, useEffect, useRef } from 'react';
import { JsonUploader } from './components/JsonUploader';
import { Odontogram } from './components/Odontogram';
import { PlanStats } from './components/PlanStats';
import { ToothDetails } from './components/ToothDetails';
import { GlobalTimeline } from './components/GlobalTimeline';
import { StepsBreakdown } from './components/StepsBreakdown';
import { PlaybackControls } from './components/PlaybackControls';
import { DentalSetup } from './types';
import { LayoutDashboard, ArrowLeft, Download } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<DentalSetup | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  
  // Playback state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const maxSteps = data ? Math.max(data.upperEndIn, data.lowerEndIn, 40) : 0; 

  // Reset state when new data loads
  const handleDataLoad = (newData: DentalSetup) => {
    setData(newData);
    setSelectedTooth(null);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleDataUpdate = (newData: DentalSetup) => {
    setData({ ...newData });
  };

  const handleAddStep = () => {
    if (!data) return;
    const newMax = maxSteps + 1;
    const newData = {
      ...data,
      upperEndIn: newMax,
      lowerEndIn: newMax,
    };
    setData(newData);
    setCurrentStep(newMax); // Jump to new step
  };

  const handleDownload = () => {
    if (!data) return;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `orthoplan-${data.id || "setup"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If at end, restart
      if (currentStep >= maxSteps) {
        setCurrentStep(0);
      }
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 600); // 600ms per step
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, maxSteps]);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <LayoutDashboard className="text-teal-600" />
            <h1 className="text-xl font-bold text-slate-800">OrthoPlan Viewer</h1>
          </div>
        </header>
        <main className="flex-1 px-4 pb-12">
          <JsonUploader onDataLoaded={handleDataLoad} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-teal-600" />
          <h1 className="text-xl font-bold text-slate-800">OrthoPlan Viewer</h1>
          <span className="mx-2 text-slate-300">|</span>
          <span className="text-sm text-slate-500 font-medium">{data.setupName}</span>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={handleDownload}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            title="Download JSON"
          >
            <Download size={16} />
            Download
          </button>
          <button 
            onClick={() => { setData(null); setSelectedTooth(null); setIsPlaying(false); }}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={16} />
            Upload New File
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left/Center Panel (Scrollable) */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Playback Controls (Sticky Top) */}
          <PlaybackControls 
            data={data}
            currentStep={currentStep}
            maxSteps={maxSteps}
            isPlaying={isPlaying}
            onPlayPause={togglePlay}
            onStepChange={(s) => { setIsPlaying(false); setCurrentStep(s); }}
            onAddStep={handleAddStep}
          />

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <PlanStats data={data} />
              
              <Odontogram 
                data={data} 
                currentStep={currentStep}
                onToothSelect={(id) => setSelectedTooth(id === selectedTooth ? null : id)} 
                selectedTooth={selectedTooth}
              />
              
              <StepsBreakdown data={data} currentStep={currentStep} />
              
              <GlobalTimeline data={data} />
            </div>
          </div>
        </div>

        {/* Right Panel (Details/Editor) */}
        <div className={`
          fixed inset-y-0 right-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-40 md:static md:transform-none md:shadow-none border-l border-slate-200
          ${selectedTooth ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0 md:border-l-0'}
        `}>
          <ToothDetails 
            data={data} 
            toothId={selectedTooth} 
            currentStep={currentStep}
            onClose={() => setSelectedTooth(null)} 
            onUpdate={handleDataUpdate}
          />
        </div>

      </div>
    </div>
  );
}