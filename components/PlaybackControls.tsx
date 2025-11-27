import React from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

interface PlaybackControlsProps {
  currentStep: number;
  maxSteps: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStepChange: (step: number) => void;
  onAddStep: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStep,
  maxSteps,
  isPlaying,
  onPlayPause,
  onStepChange,
  onAddStep
}) => {
  return (
    <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30 shadow-sm">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        
        {/* Play/Pause & Nav Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStepChange(0)}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-full transition-colors"
            title="Reset to Start"
          >
            <SkipBack size={20} />
          </button>
          
          <button
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-full transition-colors"
            disabled={currentStep === 0}
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={onPlayPause}
            className={`w-12 h-12 flex items-center justify-center rounded-full text-white shadow-md transition-all transform hover:scale-105 ${
              isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>

          <button
            onClick={() => onStepChange(Math.min(maxSteps, currentStep + 1))}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-full transition-colors"
            disabled={currentStep === maxSteps}
          >
            <ChevronRight size={24} />
          </button>

          <button
            onClick={() => onStepChange(maxSteps)}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-full transition-colors"
            title="Jump to End"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Progress Bar & Label */}
        <div className="flex-1 w-full flex flex-col gap-1">
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-semibold text-slate-700">
              Step <span className="text-teal-700 text-lg">{currentStep}</span> <span className="text-slate-400 font-normal">/ {maxSteps}</span>
            </span>
            <div className="flex items-center gap-2">
               <span className="text-xs font-medium uppercase tracking-wider text-slate-400 hidden sm:inline-block">
                {currentStep === 0 ? 'Start' : currentStep === maxSteps ? 'Finish' : 'Treatment in Progress'}
              </span>
              <button 
                onClick={onAddStep}
                className="flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded hover:bg-teal-100 transition-colors border border-teal-200"
                title="Add a new step to the end"
              >
                <PlusCircle size={12} /> Add Step
              </button>
            </div>
          </div>
          
          <input
            type="range"
            min={0}
            max={maxSteps}
            value={currentStep}
            onChange={(e) => onStepChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          
          <div className="flex justify-between text-[10px] text-slate-400 px-1">
            <span>0</span>
            <span>{Math.round(maxSteps / 2)}</span>
            <span>{maxSteps}</span>
          </div>
        </div>

      </div>
    </div>
  );
};