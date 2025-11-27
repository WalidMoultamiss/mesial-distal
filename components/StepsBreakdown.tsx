import React, { useMemo, useEffect, useRef } from 'react';
import { DentalSetup } from '../types';
import { Paperclip, Scissors, ArrowRightToLine, ArrowLeftToLine } from 'lucide-react';

interface StepsBreakdownProps {
  data: DentalSetup;
  currentStep: number;
}

export const StepsBreakdown: React.FC<StepsBreakdownProps> = ({ data, currentStep }) => {
  const rowRefs = useRef<{ [key: number]: HTMLTableRowElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const stepsData = useMemo(() => {
    const maxStep = Math.max(
      data.upperEndIn,
      data.lowerEndIn,
      ...data.attachList.map((a) => a.endTime),
      ...data.iprList.map((i) => i.step)
    );

    const steps = [];
    for (let i = 0; i <= maxStep; i++) {
      // Attachments active at this step (inclusive of begin and end)
      const activeAttachments = data.attachList
        .filter((a) => i >= a.beginTime && i <= a.endTime)
        .sort((a, b) => Number(a.tooth) - Number(b.tooth));

      // IPR events happening exactly at this step
      const iprEvents = data.iprList
        .filter((ipr) => ipr.step === i)
        .sort((a, b) => Number(a.tooth) - Number(b.tooth));

      steps.push({
        step: i,
        attachments: activeAttachments,
        ipr: iprEvents,
      });
    }
    return steps;
  }, [data]);

  // Scroll logic: Scroll the container ONLY, avoiding window scroll
  useEffect(() => {
    const row = rowRefs.current[currentStep];
    const container = containerRef.current;

    if (row && container) {
      // Calculate the position of the row relative to the container
      const rowTop = row.offsetTop;
      const rowHeight = row.clientHeight;
      const containerHeight = container.clientHeight;

      // Calculate the scroll position to center the row
      // We use the container's scroll function instead of row.scrollIntoView()
      // to prevent the main browser window from jumping.
      const targetScrollTop = rowTop - (containerHeight / 2) + (rowHeight / 2);

      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [currentStep]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-6 overflow-hidden flex flex-col max-h-[600px]">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-800">Step-by-Step Breakdown</h3>
          <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
            {stepsData.length} Steps
          </span>
        </div>
      </div>
      
      <div ref={containerRef} className="overflow-y-auto flex-1 relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold w-24 border-r border-slate-100">Step</th>
              <th className="px-6 py-4 font-semibold w-1/2 border-r border-slate-100">
                <div className="flex items-center gap-2">
                  <Paperclip size={14} />
                  Active Attachments
                </div>
              </th>
              <th className="px-6 py-4 font-semibold w-1/2">
                <div className="flex items-center gap-2">
                  <Scissors size={14} />
                  IPR Actions
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stepsData.map((row) => {
              const isActive = row.step === currentStep;
              return (
                <tr 
                  key={row.step} 
                  ref={el => rowRefs.current[row.step] = el}
                  className={`transition-colors duration-300 ${isActive ? 'bg-teal-50 ring-2 ring-inset ring-teal-500/20' : 'hover:bg-slate-50 group'}`}
                >
                  <td className="px-6 py-4 border-r border-slate-100">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold transition-all ${
                      isActive 
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-110' 
                        : 'bg-slate-100 border-slate-200 text-slate-600 group-hover:bg-white group-hover:border-teal-200 group-hover:text-teal-700'
                    }`}>
                      {row.step}
                    </div>
                  </td>
                  
                  {/* Attachments Column */}
                  <td className="px-6 py-4 align-top border-r border-slate-100">
                    {row.attachments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {row.attachments.map((att, idx) => {
                          const isStart = att.beginTime === row.step;
                          const isEnd = att.endTime === row.step;
                          
                          let badgeClass = "bg-blue-50 text-blue-700 border-blue-100";
                          let icon = null;
                          let title = "Active";

                          if (isStart) {
                            badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100 font-medium";
                            icon = <ArrowRightToLine size={12} className="mr-1 text-emerald-600" />;
                            title = "Starts this step";
                          } else if (isEnd) {
                            badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                            icon = <ArrowLeftToLine size={12} className="mr-1 text-amber-600" />;
                            title = "Ends this step";
                          } else if (isActive) {
                             // Slightly darker for active row
                             badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
                          }

                          return (
                            <span 
                              key={`${att.tooth}-${idx}`} 
                              title={`Tooth ${att.tooth} - ${title}`}
                              className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${badgeClass} transition-all cursor-help`}
                            >
                              {icon}
                              T{att.tooth}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs italic">No active attachments</span>
                    )}
                  </td>

                  {/* IPR Column */}
                  <td className="px-6 py-4 align-top">
                    {row.ipr.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {row.ipr.map((ipr, idx) => (
                          <div 
                            key={`${ipr.tooth}-${idx}`}
                            className={`flex items-center gap-2 border px-3 py-1.5 rounded-md text-rose-800 shadow-sm transition-transform ${isActive ? 'bg-white border-rose-300 scale-105 shadow-md' : 'bg-rose-50 border-rose-100'}`}
                          >
                            <span className="font-bold text-xs">T{ipr.tooth}</span>
                            <div className="h-3 w-px bg-rose-200"></div>
                            <div className="text-[10px] uppercase font-medium tracking-tight flex gap-2">
                              {ipr.mesialIpr > 0 && <span>M: {ipr.mesialIpr}</span>}
                              {ipr.distalIpr > 0 && <span>D: {ipr.distalIpr}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs italic">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};