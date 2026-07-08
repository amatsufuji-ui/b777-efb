import React, { useState } from 'react';
import { SafeIcon } from './SharedComponents';
import { B777_WIND_LIMITS } from '../data/perfData';
import { calculateWindComponentRow } from '../utils/flightCalc';

// --- [5-8] XwindView (XWIND) ---
export const XwindView = () => {
  const [selectedRwy, setSelectedRwy] = useState(null);
  const [isCopMode, setIsCopMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState({ row: null, col: null });
  // ★ Tailwindの制限値を管理するステート（デフォルト15kt）
  const [twLimit, setTwLimit] = useState(15);

  const runways = Array.from({ length: 36 }, (_, i) => String(i + 1).padStart(2, '0'));

  if (!selectedRwy) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] p-4 md:p-6 shadow-2xl border border-slate-700 animate-in fade-in">
        <div className="flex flex-col items-center gap-1 text-amber-400 mb-6">
          <SafeIcon name="Wind" className="w-10 h-10 md:w-12 md:h-12" />
          <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-widest text-center leading-tight">滑走路別<br />WIND COMPONENT</h2>
        </div>
        <div className="grid grid-cols-6 md:grid-cols-9 gap-2 md:gap-3 w-full max-w-4xl">
          {runways.map(rwy => (
            <button 
              key={rwy} 
              onClick={() => {
                setSelectedRwy(rwy);
                setTwLimit(15); // ★ 新たに滑走路を選んだときにデフォルトの15にリセット
              }} 
              className="bg-slate-700/80 hover:bg-amber-600 border border-slate-500 hover:border-amber-400 text-white font-bold py-2 md:py-3 rounded-xl transition-all shadow-md text-center text-xs md:text-sm tracking-widest"
            >
              {rwy}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const limitConfig = B777_WIND_LIMITS;
  const activeCols = isCopMode ? limitConfig.copCols : limitConfig.capCols;
  const rwyHeading = parseInt(selectedRwy, 10) * 10;

  const tableData = Array.from({ length: 17 }, (_, i) => {
    const diff = (i + 1) * 10; 
    let leftWind = rwyHeading - diff; if (leftWind <= 0) leftWind += 360;
    let rightWind = rwyHeading + diff; if (rightWind > 360) rightWind -= 360;
    const rowCalc = calculateWindComponentRow(selectedRwy, leftWind, limitConfig, isCopMode);
    
    // ★ 選択されたTailwind制限に達する限界風速を計算
    let twLimitVal = '-';
    if (diff > 90) {
      const rad = diff * (Math.PI / 180);
      const factor = -Math.cos(rad);
      if (factor > 0.01) { // ゼロ割りを防止
        twLimitVal = Math.floor(twLimit / factor);
      }
    }

    return { 
      leftWindStr: String(leftWind).padStart(3, '0'), 
      rightWindStr: String(rightWind).padStart(3, '0'), 
      vals: rowCalc.vals, 
      isTailwind: diff > 90,
      twLimitVal
    };
  });

  return (
    <div className="w-full h-full flex flex-col bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-700 animate-in fade-in overflow-hidden">
      <div className="bg-slate-900/60 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between border-b border-slate-600 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setSelectedRwy(null)} className="bg-slate-700 hover:bg-slate-600 text-white p-1.5 md:p-2 rounded-lg transition-colors shadow-sm border border-slate-500"><SafeIcon name="ArrowLeft" className="w-4 h-4 md:w-5 md:h-5" /></button>
          <h2 className="text-base md:text-xl font-black text-white tracking-widest flex items-center gap-2">RWY <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">{selectedRwy}</span></h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-700/80 p-1 rounded-lg border border-slate-600 shadow-inner">
            <button onClick={() => setIsCopMode(false)} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-xs font-black tracking-widest transition-all ${!isCopMode ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-600'}`}>CAP</button>
            <button onClick={() => setIsCopMode(true)} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-xs font-black tracking-widest transition-all ${isCopMode ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-600'}`}>COP</button>
          </div>
        </div>
      </div>
      <div className="p-1.5 md:p-3 overflow-y-auto custom-scrollbar flex-1 bg-slate-900/20">
        <div className="max-w-4xl mx-auto w-full pb-4">
          <table className="w-full table-fixed text-center border-collapse border border-slate-600 bg-slate-800/80 shadow-lg rounded-lg overflow-hidden">
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="bg-slate-700 text-slate-300 font-black text-[9px] md:text-[10px] p-1.5 md:p-2 border border-slate-600 shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                  <div className="mb-1 text-center whitespace-nowrap">L WIND</div>
                  <div className="flex flex-col mt-1 text-[7px] md:text-[8px] text-slate-400 text-center font-normal border-t border-slate-600 pt-1 w-full gap-[1px]">
                    <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter">T/O</div>
                    <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter">L/D</div>
                    <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter whitespace-nowrap">&ge;2700m</div>
                    <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter whitespace-nowrap">&lt;2700m</div>
                  </div>
                </th>
                {activeCols.map((col, idx) => (
                  <th key={idx} className={`text-white font-black p-1.5 md:p-2 border border-slate-600 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.5)] ${selectedCell.col === idx ? 'bg-sky-800/90' : 'bg-slate-700'} ${isCopMode && col.isCopHalf && selectedCell.col !== idx ? 'bg-sky-900/40' : ''}`}>
                    <div className="text-amber-400 text-xs md:text-sm">{isCopMode && col.isCopHalf ? `${col.val}/2` : col.val}</div>
                    <div className="flex flex-col mt-1 text-[6.5px] md:text-[7.5px] text-slate-300 font-normal border-t border-slate-600 pt-1 w-full gap-[1px]">
                      {col.labels.map((lbl, lIdx) => (<div key={lIdx} className={`h-[12px] flex items-center justify-center rounded-sm leading-none whitespace-nowrap tracking-tighter px-0.5 ${lbl !== '-' ? 'bg-slate-900/60' : ''}`}>{lbl}</div>))}
                    </div>
                  </th>
                ))}
                
                {/* ★ Tailwind (TW) Column Header (プルダウン化) ★ */}
                <th className={`text-white font-black p-1.5 md:p-2 border border-slate-600 transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.5)] ${selectedCell.col === 'TW' ? 'bg-rose-800/90' : 'bg-rose-950/50'}`}>
                  <div className="flex items-center justify-center gap-0.5">
                    <select
                      value={twLimit}
                      onChange={(e) => setTwLimit(Number(e.target.value))}
                      className="bg-rose-950/80 text-rose-400 border border-rose-700/50 rounded outline-none focus:ring-1 focus:ring-rose-500 text-xs md:text-sm font-black p-0.5 cursor-pointer w-auto text-center"
                    >
                      {Array.from({ length: 15 }, (_, i) => i + 1).map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                    <span className="text-[8px] md:text-[10px] text-rose-400">(TW)</span>
                  </div>
                  <div className="flex flex-col mt-1 text-[6.5px] md:text-[7.5px] text-slate-300 font-normal border-t border-slate-600 pt-1 w-full gap-[1px]">
                    <div className="h-[12px] flex items-center justify-center rounded-sm leading-none whitespace-nowrap tracking-tighter px-0.5 bg-rose-950/80">ALL</div>
                  </div>
                </th>

                <th className="bg-slate-700 text-slate-300 font-black text-[9px] md:text-[10px] p-1.5 md:p-2 border border-slate-600 hidden md:table-cell shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                  <div className="mb-1 text-center whitespace-nowrap">R WIND</div>
                  <div className="flex flex-col mt-1 text-[7px] md:text-[8px] text-slate-400 text-center font-normal border-t border-slate-600 pt-1 w-full gap-[1px]">
                    <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter">T/O</div>
                    <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter">L/D</div>
                    <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter whitespace-nowrap">&ge;2700m</div>
                    <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter whitespace-nowrap">&lt;2700m</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => {
                const bgClass = row.isTailwind ? 'bg-rose-950/20' : (idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60');
                const isRowHighlighted = selectedCell.row === idx;
                return (
                  <tr key={idx} className={`transition-colors hover:bg-slate-600/50 ${isRowHighlighted ? 'bg-sky-900/60' : bgClass}`}>
                    <td className={`font-black text-[10px] md:text-xs p-1.5 md:p-2 border border-slate-600 transition-colors cursor-pointer ${isRowHighlighted ? 'bg-sky-800 text-white' : 'bg-slate-700/90 text-sky-300'}`} onClick={() => setSelectedCell(prev => ({ row: prev.row === idx ? null : idx, col: prev.col }))}>{row.leftWindStr}</td>
                    
                    {/* Crosswind Cells */}
                    {activeCols.map((col, cIdx) => {
                      const rawVal = row.vals[col.val] || '-'; 
                      // 既存計算ロジックによって付与されているかもしれない "_" を無効化して純粋な値を取得
                      const displayVal = typeof rawVal === 'string' ? rawVal.replace(/_/g, '') : rawVal;
                      
                      // ★ 選択された Tailwind Limit に基づいて動的に超過を判定
                      const isTwLimited = row.isTailwind && row.twLimitVal !== '-' && displayVal !== '-' && Number(displayVal) >= row.twLimitVal;
                      
                      // TWで制限されている場合は、表示値をTW側の限界値に置き換える
                      const finalDisplayVal = isTwLimited ? row.twLimitVal : displayVal;
                      
                      const isColHighlighted = selectedCell.col === cIdx; const isTargetCell = isRowHighlighted && isColHighlighted; let cellBg = isCopMode && col.isCopHalf ? 'bg-sky-900/10' : '';
                      if (isTargetCell) cellBg = 'bg-sky-500/60 ring-inset ring-1 ring-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.5)] z-0 relative'; else if (isRowHighlighted || isColHighlighted) cellBg = 'bg-sky-800/40';
                      return (
                        <td key={cIdx} onClick={() => { if (selectedCell.row === idx && selectedCell.col === cIdx) { setSelectedCell({ row: null, col: null }); } else { setSelectedCell({ row: idx, col: cIdx }); } }} className={`text-white font-black text-[10px] md:text-xs p-1.5 md:p-2 border border-slate-600 transition-all cursor-pointer hover:bg-sky-700/50 ${cellBg}`}>
                          <span className={isTwLimited ? 'underline underline-offset-4 decoration-2 decoration-amber-500 text-amber-100' : ''}>{finalDisplayVal}</span>
                        </td>
                      );
                    })}

                    {/* ★ Tailwind (TW) Cell ★ */}
                    <td
                      onClick={() => {
                        if (selectedCell.row === idx && selectedCell.col === 'TW') {
                          setSelectedCell({ row: null, col: null });
                        } else {
                          setSelectedCell({ row: idx, col: 'TW' });
                        }
                      }}
                      className={`font-black text-[10px] md:text-xs p-1.5 md:p-2 border border-slate-600 transition-all cursor-pointer hover:bg-rose-800/50 ${
                        selectedCell.row === idx && selectedCell.col === 'TW'
                          ? 'bg-rose-600/60 ring-inset ring-1 ring-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.5)] z-0 relative text-white'
                          : (selectedCell.row === idx || selectedCell.col === 'TW')
                          ? 'bg-rose-900/40 text-rose-200'
                          : 'bg-rose-950/20 text-rose-300'
                      }`}
                    >
                      {row.twLimitVal}
                    </td>

                    <td className={`font-black text-[10px] md:text-xs p-1.5 md:p-2 border border-slate-600 hidden md:table-cell transition-colors cursor-pointer ${isRowHighlighted ? 'bg-sky-800 text-white' : 'bg-slate-700/90 text-emerald-300'}`} onClick={() => setSelectedCell(prev => ({ row: prev.row === idx ? null : idx, col: prev.col }))}>{row.rightWindStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex flex-wrap justify-center gap-4 mt-3 text-[10px] font-bold text-slate-400">
            {/* ★ 凡例テキストを "Limited by Tailwind" に変更 ★ */}
            <div className="flex items-center gap-1"><span className="text-amber-100 underline underline-offset-4 decoration-2 decoration-amber-500">{twLimit}</span> = Limited by Tailwind</div>
          </div>
        </div>
      </div>
    </div>
  );
};