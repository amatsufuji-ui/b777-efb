import React from 'react';
import { SafeIcon } from './SharedComponents';
import { BUDDYCOM_LINKS } from '../data/flightData';

// --- [5-4] BuddyCommView (BUDDY COMM) ---
export const BuddyCommView = ({ p }) => {
  const { aircraftRegistrationList, selectedReg, handleRegChange } = p;
  const handleOpen = (reg) => {
    handleRegChange(reg);
    const url = BUDDYCOM_LINKS[reg] || `http://info.ana.co.jp/buddycomm/${reg}.html`;
    if (url) { window.open(url, '_blank'); window.dispatchEvent(new CustomEvent('show-toast', { detail: `${reg} のBUDDY COMMを開きました` })); }
  };
  return (
    <div className="flex flex-col items-center h-full w-full bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-700 mt-0.5 animate-in fade-in overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
      <div className="flex items-center justify-between w-full p-2 border-b border-slate-700/50 bg-slate-900/30 shrink-0"><div className="flex items-center gap-2 px-2"><SafeIcon name="Link" className="w-4 h-4 text-rose-400" /><h2 className="text-sm font-black uppercase tracking-widest text-rose-100">BUDDY COMM</h2></div></div>
      <div className="flex-1 w-full p-3 overflow-y-auto"><div className="max-w-[800px] mx-auto flex flex-col gap-4"><div className="bg-slate-900/60 p-4 rounded-xl border border-slate-600 shadow-inner flex flex-col items-start gap-4"><div className="flex items-center gap-2 border-b border-slate-700 w-full pb-2"><SafeIcon name="MousePointerClick" className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-300 font-bold uppercase">機番を選択してBUDDY COMMを開く</span></div><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 w-full">
        {aircraftRegistrationList.map((ac) => {
          const isSelected = selectedReg === ac.reg;
          return (
            <button key={ac.reg} onClick={() => handleOpen(ac.reg)} className={`py-3 px-2 rounded-lg border font-mono font-black text-xs transition-all flex flex-col items-center justify-center gap-1 shadow-md ${isSelected ? 'bg-rose-600 text-white border-rose-400 scale-105' : 'bg-slate-800 text-rose-300 border-slate-600 hover:border-rose-400 hover:bg-slate-700'}`}>
              <span>{ac.reg}</span><span className={`text-[8px] font-sans px-1.5 py-0.5 rounded ${isSelected ? 'bg-rose-800/50 text-rose-100' : 'bg-slate-900 text-slate-400'}`}>{ac.type}</span>
            </button>
          );
        })}
      </div></div></div></div>
    </div>
  );
};