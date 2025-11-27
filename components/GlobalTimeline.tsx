import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DentalSetup } from '../types';

interface GlobalTimelineProps {
  data: DentalSetup;
}

export const GlobalTimeline: React.FC<GlobalTimelineProps> = ({ data }) => {
  // Aggregate IPR by step
  const iprByStep: Record<number, number> = {};
  const maxStep = Math.max(data.upperEndIn, data.lowerEndIn, ...data.iprList.map(i => i.step));

  // Initialize all steps
  for (let i = 1; i <= maxStep; i++) {
    iprByStep[i] = 0;
  }

  // Sum up IPR
  data.iprList.forEach(entry => {
    if (iprByStep[entry.step] !== undefined) {
      iprByStep[entry.step] += (entry.mesialIpr + entry.distalIpr);
    }
  });

  const chartData = Object.keys(iprByStep).map(step => ({
    step: `Step ${step}`,
    amount: parseFloat(iprByStep[parseInt(step)].toFixed(2))
  }));

  // Only show chart if there is data
  if (chartData.every(d => d.amount === 0)) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">IPR Distribution by Step</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="step" 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              label={{ value: 'mm', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="amount" fill="#f43f5e" name="Total IPR (mm)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
