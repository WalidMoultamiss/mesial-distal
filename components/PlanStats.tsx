import React from 'react';
import { Layers, Scissors, Paperclip, Activity } from 'lucide-react';
import { DentalSetup } from '../types';

interface PlanStatsProps {
  data: DentalSetup;
}

export const PlanStats: React.FC<PlanStatsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
          <Layers size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Aligners</p>
          <div className="flex gap-2 items-baseline">
            <span className="text-xl font-bold text-slate-800">U:{data.upperEndIn}</span>
            <span className="text-sm text-slate-400">/</span>
            <span className="text-xl font-bold text-slate-800">L:{data.lowerEndIn}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
          <Scissors size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Total IPR</p>
          <p className="text-xl font-bold text-slate-800">{data.manIpr} mm</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          <Paperclip size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Attachments</p>
          <p className="text-xl font-bold text-slate-800">{data.attachList.length}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Setup ID</p>
          <p className="text-xs font-mono text-slate-800 truncate max-w-[100px]" title={data.id}>
            {data.id.split('-')[0]}...
          </p>
        </div>
      </div>

    </div>
  );
};
