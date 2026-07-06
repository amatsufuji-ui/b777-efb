import React, { useState } from 'react';
import { SafeIcon } from './SharedComponents';
import { DG_DATA, ISOLATION_COLS_FINAL, ISOLATION_MATRIX_FINAL, ERG_DRILLS_FINAL, ERG_LETTERS_LEFT_FINAL, ERG_LETTERS_RIGHT_FINAL, SPECIAL_PAX_DATA } from '../data/docsData';

// --- [5-2] Docs2View (DOCS) ---
export const Docs2View = () => {
  const [activeTab, setActiveTab] = useState('classification');

  // --- 改行や特定のキーワード（[国内]/[国際]など）を安全にパースして表示する統合レンダラー ---
  const renderCellText = (text) => {
    if (!text) return null;

    let processedText = text;
    let hasWarning = false;

    // (※旅客機には搭載禁止) の特別なバッジ処理
    if (processedText.includes("(※旅客機には搭載禁止)")) {
      hasWarning = true;
      processedText = processedText.replace("(※旅客機には搭載禁止)", "").trim();
    }

    const lines = processedText.split('\n').map((line, idx) => {
      // [国内] と [国際] をタグに変換
      const parts = line.split(/(\[国内\]|\[国際\])/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part === '[国内]') {
          return <span key={pIdx} className="inline-block px-1.5 py-0.5 mr-1 bg-blue-500/20 text-blue-300 border border-blue-400/40 rounded text-[9px] font-black leading-none align-text-bottom tracking-widest shadow-sm">国内</span>;
        }
        if (part === '[国際]') {
          return <span key={pIdx} className="inline-block px-1.5 py-0.5 mr-1 bg-orange-500/20 text-orange-300 border border-orange-400/40 rounded text-[9px] font-black leading-none align-text-bottom tracking-widest shadow-sm">国際</span>;
        }
        return <span key={pIdx}>{part}</span>;
      });

      return (
        <span key={idx} className="block">
          {formattedLine}
        </span>
      );
    });

    return (
      <div className="flex flex-col gap-0.5">
        {hasWarning && <span className="text-[9px] sm:text-[10px] text-rose-400 font-black block mb-0.5 leading-tight border border-rose-500/30 bg-rose-950/40 w-fit max-w-full break-words px-1 py-0.5 rounded shadow-sm">(※旅客機には搭載禁止)</span>}
        {lines}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-700 mt-0.5 animate-in fade-in duration-300 overflow-hidden">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-2 lg:p-3 border-b border-slate-700/50 bg-slate-900/30 shrink-0 gap-2">
        <div className="flex items-center gap-2 px-2">
          <SafeIcon name="PackageWarning" className="w-4 h-4 lg:w-5 lg:h-5 text-pink-400" />
          <h2 className="text-sm lg:text-base font-black uppercase tracking-widest text-pink-100">DOCS</h2>
        </div>

        <div className="flex bg-slate-700/80 p-1 rounded-lg border border-slate-500 shadow-inner items-center shrink-0">
          <button
            onClick={() => setActiveTab('classification')}
            className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ${activeTab === 'classification' ? 'bg-pink-600 text-white border border-pink-400 shadow-[0_0_10px_rgba(219,39,119,0.5)]' : 'text-slate-300 border border-transparent hover:bg-slate-600'
              }`}
          >
            <SafeIcon name="List" className="w-3 h-3" />
            <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">分類表(DG)</span>
          </button>
          <button
            onClick={() => setActiveTab('erg')}
            className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ml-1 ${activeTab === 'erg' ? 'bg-rose-600 text-white border border-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.5)]' : 'text-slate-300 border border-transparent hover:bg-slate-600'
              }`}
          >
            <SafeIcon name="AlertTriangle" className="w-3 h-3" />
            <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">ERG CODE</span>
          </button>
          <button
            onClick={() => setActiveTab('special_pax')}
            className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ml-1 ${activeTab === 'special_pax' ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-slate-300 border border-transparent hover:bg-slate-600'
              }`}
          >
            <SafeIcon name="Users" className="w-3 h-3" />
            <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">配慮を要する旅客</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full p-2 lg:p-4 overflow-y-auto custom-scrollbar bg-slate-900/30">
        <div className="flex flex-col gap-6 lg:gap-8 max-w-[1400px] mx-auto pb-4">

          {/* ================================== */}
          {/* --- CLASSIFICATION SECTION --- */}
          {/* ================================== */}
          {activeTab === 'classification' && (
            <div className="flex flex-col gap-6 lg:gap-8 animate-in fade-in">

              {/* 要約規定セクション */}
              <div className="flex flex-col gap-3">
                <h3 className="text-pink-400 font-black tracking-widest text-sm flex items-center gap-2 border-b border-slate-700/80 pb-1.5 px-1">
                  <SafeIcon name="Info" className="w-4 h-4" /> 危険物の航空輸送に関する規定要約 (抜粋)
                </h3>

                <div className="flex flex-col gap-4">
                  {/* 最大許容搭載量 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg">
                    <h4 className="text-sky-400 font-black text-xs mb-2">1. 最大許容搭載量 (B777/B777F)</h4>
                    <div className="overflow-x-auto custom-scrollbar pb-1">
                      <table className="w-full text-left border-collapse min-w-[450px]">
                        <thead>
                          <tr className="bg-slate-700/50 text-slate-300 text-[9px] lg:text-[10px] border-b border-slate-600">
                            <th className="p-1.5 border-r border-slate-600 whitespace-nowrap w-[15%]">分類</th>
                            <th className="p-1.5 border-r border-slate-600 whitespace-nowrap w-[35%]">対象</th>
                            <th className="p-1.5 border-r border-slate-600 whitespace-nowrap w-[25%]">最大搭載量</th>
                            <th className="p-1.5 whitespace-nowrap w-[25%]">備考</th>
                          </tr>
                        </thead>
                        <tbody className="text-[10px] lg:text-[11px] text-slate-300">
                          {/* 火薬類 */}
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-sky-300">火薬類</td>
                            <td className="p-1.5 border-r border-slate-600/50">1貨物室あたり</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">250kg <span className="text-[9px] font-normal text-slate-400">(550lbs)</span></td>
                            <td className="p-1.5 text-[9px] text-slate-400">全機種共通</td>
                          </tr>
                          {/* 放射性物質 */}
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-sky-300" rowSpan="4">放射性物質</td>
                            <td className="p-1.5 border-r border-slate-600/50">1機あたり (B777)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">32 単位</td>
                            <td className="p-1.5 text-[9px] text-rose-300 bg-rose-500/10" rowSpan="4">核分裂物質の<br />搭載不可</td>
                          </tr>
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50">ULD/Bulk (B777)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">8 単位</td>
                          </tr>
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50">1機あたり (B777F)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">200 単位</td>
                          </tr>
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50">ULD/Bulk (B777F)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">50 単位</td>
                          </tr>
                          {/* ドライアイス */}
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-sky-300" rowSpan="3">ドライアイス</td>
                            <td className="p-1.5 border-r border-slate-600/50">1機 (-300/300ER)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">800kg</td>
                            <td className="p-1.5 text-[9px] text-slate-400" rowSpan="3"></td>
                          </tr>
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50">1機 (-200)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">600kg</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 border-r border-slate-600/50">1機 (B777F)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">2,300kg <span className="text-[9px] font-normal text-slate-400">(L/D 500kg)</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 危険物の隔離 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-3">
                      <h4 className="text-sky-400 font-black text-xs">2. 危険物の隔離</h4>
                      <ul className="text-slate-300 text-[10px] space-y-0.5 list-disc list-inside">
                        <li>隔離を要する物件同士は<strong className="text-rose-300">最低3m(10ft)の間隔</strong>を置く。</li>
                        <li>ドライアイスと動物間も<strong className="text-rose-300">最低3m(10ft)隔離</strong>。</li>
                        <li>放射性物質と火薬類(区分S以外)等は、<strong className="text-rose-300">同一貨物室に搭載不可</strong>。</li>
                      </ul>
                    </div>

                    <h5 className="text-slate-300 font-bold text-[10px] lg:text-xs mb-1.5 flex items-center gap-2 mt-4">
                      <SafeIcon name="Grid" className="w-3.5 h-3.5" /> 【告示別表第14】輸送許容物件相互の隔離表
                    </h5>
                    <div className="overflow-x-auto rounded-lg border border-slate-600/50 custom-scrollbar pb-1">
                      <table className="w-full text-center border-collapse min-w-[850px] text-[9px] lg:text-[10px]">
                        <thead>
                          <tr className="bg-slate-700/50 text-slate-300 border-b border-slate-600">
                            <th className="py-0.5 px-1 border-r border-slate-600 font-bold w-48 text-left whitespace-nowrap">分類または区分</th>
                            {ISOLATION_COLS_FINAL.map((col, idx) => {
                              return (
                                <th key={idx} className="py-0.5 px-1 border-r border-slate-600 font-mono font-black text-sky-400 text-center whitespace-nowrap align-middle bg-slate-900/40 tracking-tighter text-[13px] lg:text-[15px]">
                                  {col}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="text-slate-300">
                          {ISOLATION_MATRIX_FINAL.map((row, rIdx) => (
                            <tr key={rIdx} className={`border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors ${rIdx < 2 ? 'bg-slate-800/10' : ''}`}>
                              <td className="py-0.5 px-1 border-r border-slate-600/50 bg-slate-800/40">
                                <div className="flex items-center justify-between gap-1 w-full pl-0.5 pr-0">
                                  <span className="font-bold text-slate-200 text-[10px] lg:text-[11px] leading-tight text-left">
                                    {row.label}
                                  </span>
                                  {row.code && (
                                    <span className="text-[13px] lg:text-[15px] font-mono font-bold text-sky-400 tracking-tighter whitespace-nowrap shrink-0 text-right">
                                      {row.code}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {row.data.map((val, cIdx) => (
                                <td key={cIdx} className="py-0.5 px-1 border-r border-slate-600/50 align-middle">
                                  {val === '×' && <span className="text-rose-400 font-black text-[15px] lg:text-[17px]">×</span>}
                                  {val === '注' && <span className="text-amber-400 font-black text-[11px] lg:text-[13px]">注</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* ★ 危険物分類表（横スクロールなしの固定レイアウト） ★ */}
              <div className="flex flex-col gap-2 lg:gap-3">
                <h3 className="text-pink-400 font-black tracking-widest text-sm flex items-center gap-2 border-b border-slate-700/80 pb-1.5 px-1">
                  <SafeIcon name="List" className="w-4 h-4" /> 危険物分類表 (CLASSIFICATION)
                </h3>
                <div className="w-full overflow-x-auto rounded-xl border border-slate-600 shadow-xl bg-slate-800/50 custom-scrollbar">
                  <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-700 text-slate-200 border-b border-slate-500">
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black border-r border-slate-600 w-[12%] leading-tight">分類<br /> Class</th>
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black border-r border-slate-600 w-[16%] leading-tight">区分<br /> DIV</th>
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black border-r border-slate-600 w-[12%] text-center leading-tight">Code</th>
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black border-r border-slate-600 w-[25%] leading-tight">主な品名、他</th>
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black w-[35%] leading-tight">事故時の応急処理</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DG_DATA.flatMap((group, gIdx) =>
                        group.items.map((item, iIdx) => (
                          <tr key={`${gIdx}-${iIdx}`} className={`border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors ${iIdx === group.items.length - 1 ? 'border-b-2 border-b-slate-500' : ''}`}>
                            {iIdx === 0 && (
                              <td rowSpan={group.items.length} className="p-2 lg:p-3 border-r border-slate-600 align-top bg-slate-800/40 break-words">
                                <div className="flex flex-col gap-1 items-center text-center mt-1 lg:mt-2">
                                  <span className="text-xl lg:text-2xl font-black text-sky-400">{group.class}</span>
                                  <span className="text-[10px] lg:text-xs font-bold text-slate-300 whitespace-pre-wrap leading-tight">{renderCellText(group.name)}</span>
                                </div>
                              </td>
                            )}
                            <td className="p-2 lg:p-3 border-r border-slate-600/50 align-middle break-words">
                              <span className="text-[11px] lg:text-xs font-bold text-slate-200 whitespace-pre-wrap leading-relaxed block">
                                {renderCellText(item.div)}
                              </span>
                            </td>
                            <td className="p-2 lg:p-3 border-r border-slate-600/50 align-middle text-center break-words">
                              <div className="flex flex-col gap-2 items-center justify-center w-full">
                                {item.code.split('\n').map((c, cIdx) => (
                                  <span key={cIdx} className="text-[12px] lg:text-[14px] font-mono font-black text-sky-100 bg-sky-600/60 px-2 py-1 lg:py-1.5 rounded border border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)] leading-none block w-full max-w-full tracking-widest break-all">
                                    {c.trim()}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-2 lg:p-3 border-r border-slate-600/50 align-middle break-words">
                              <span className="text-[10px] lg:text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap block">
                                {renderCellText(item.desc)}
                              </span>
                            </td>
                            <td className="p-2 lg:p-3 align-middle break-words">
                              <span className="text-[10px] lg:text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap block">
                                {renderCellText(item.emergency)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================================== */}
          {/* --- ERG CODE SECTION --- */}
          {/* ================================== */}
          {activeTab === 'erg' && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              {/* Main Table */}
              <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 lg:p-4 shadow-lg">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-600/50 shadow-inner">
                    (S-6-2-8-②)
                  </span>
                  <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-600/50 shadow-inner">
                    (ICAO Doc 9481)
                  </span>
                </div>
                <h3 className="text-rose-400 font-black tracking-widest text-sm lg:text-base mb-2 flex items-center gap-2">
                  <SafeIcon name="AlertTriangle" className="w-5 h-5" /> Table 4-1. Aircraft Emergency Response Drills
                </h3>
                <ol className="list-decimal list-inside text-slate-200 text-[11px] md:text-xs font-bold space-y-1 mb-4 ml-1">
                  <li>適切な航空機の緊急手順を完了する。</li>
                  <li>可能な限り速やかな着陸を検討する。</li>
                  <li>以下のチャートからドリルを使用する。</li>
                </ol>

                <div className="w-full overflow-x-auto rounded-xl border border-slate-600 shadow-xl bg-slate-800/50">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-700 text-slate-200 border-b border-slate-500 text-[10px] lg:text-[11px]">
                        <th className="p-2 border-r border-slate-600 text-center whitespace-nowrap">ドリル番号</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">固有の危険性</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">航空機への危険性</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">搭乗者への危険性</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">漏出時の手順</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">消火手順</th>
                        <th className="p-2 w-1/6">追加の考慮事項</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ERG_DRILLS_FINAL.map((drill, idx) => (
                        <tr key={idx} className="border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors text-[10px] lg:text-[11px] leading-relaxed text-slate-300">
                          <td className="p-2 border-r border-slate-600/50 text-center align-top font-black text-white text-base bg-slate-800/40">{drill.no}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.inherent}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.acRisk}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.occRisk}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.spill}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.fire}</td>
                          <td className="p-2 align-top whitespace-pre-wrap">{drill.add}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drill Letters Table */}
              <div className="w-full overflow-x-auto rounded-xl border border-slate-600 shadow-xl bg-slate-800/50">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-700 text-slate-200 border-b border-slate-500 text-[10px] lg:text-[11px]">
                      <th className="p-2 border-r border-slate-600 text-center whitespace-nowrap">ドリルレター</th>
                      <th className="p-2 border-r border-slate-600 w-1/2">追加の危険性</th>
                      <th className="p-2 border-r border-slate-600 text-center whitespace-nowrap">ドリルレター</th>
                      <th className="p-2 w-1/2">追加の危険性</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const left = ERG_LETTERS_LEFT_FINAL[idx];
                      const right = ERG_LETTERS_RIGHT_FINAL[idx];
                      return (
                        <tr key={idx} className="border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors text-[10px] lg:text-[11px] leading-relaxed text-slate-300">
                          {left ? <td className="p-2 border-r border-slate-600/50 text-center align-middle font-black text-sky-400 text-base bg-slate-800/40">{left.letter}</td> : <td className="p-2 border-r border-slate-600/50 align-top bg-slate-800/40"></td>}
                          {left ? <td className="p-2 border-r border-slate-600/50 align-middle whitespace-pre-wrap font-bold text-slate-200">{left.hazard}</td> : <td className="p-2 border-r border-slate-600/50 align-top"></td>}
                          {right ? <td className="p-2 border-r border-slate-600/50 text-center align-middle font-black text-sky-400 text-base bg-slate-800/40">{right.letter}</td> : <td className="p-2 border-r border-slate-600/50 align-top bg-slate-800/40"></td>}
                          {right ? <td className="p-2 align-middle whitespace-pre-wrap font-bold text-slate-200">{right.hazard}</td> : <td className="p-2 align-top"></td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================== */}
          {/* --- SPECIAL PAX SECTION --- */}
          {/* ================================== */}
          {activeTab === 'special_pax' && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 lg:p-4 shadow-lg">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-600/50 shadow-inner">
                    (S-7-5)
                  </span>
                </div>
                <h3 className="text-indigo-400 font-black tracking-widest text-sm lg:text-base mb-2 flex items-center gap-2">
                  <SafeIcon name="Users" className="w-5 h-5" /> 配慮を要する旅客の搭乗要件
                </h3>
                <p className="text-slate-300 text-[10px] md:text-xs font-bold mb-4 ml-1">
                  安全確保および社会的要請に基づく、配慮を要する旅客（SPECIAL PAX）の搭乗要件・制限の要約です。
                </p>

                <div className="w-full overflow-x-auto rounded-xl border border-slate-600 shadow-xl bg-slate-800/50">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="bg-slate-700 text-slate-200 border-b border-slate-500 text-[10px] lg:text-[11px]">
                        <th className="p-2 border-r border-slate-600 text-center whitespace-nowrap w-36 lg:w-48">コード</th>
                        <th className="p-2 border-r border-slate-600 whitespace-nowrap w-32 lg:w-40">旅客種別</th>
                        <th className="p-2 border-r border-slate-600 w-1/3">定義 / 主な条件</th>
                        <th className="p-2 border-r border-slate-600 w-1/4">同伴者 / 付添者の要否</th>
                        <th className="p-2 border-r border-slate-600 whitespace-nowrap w-28 lg:w-32 text-center">非常口座席</th>
                        <th className="p-2 w-1/4">搭乗人数制限</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SPECIAL_PAX_DATA.map((pax, idx) => (
                        <tr key={idx} className="border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors text-[10px] lg:text-[11px] leading-relaxed text-slate-300">
                          <td className="p-2 border-r border-slate-600/50 text-center align-middle font-black text-indigo-300 text-sm lg:text-base bg-slate-800/40">
                            {renderCellText(pax.code)}
                          </td>
                          <td className="p-2 border-r border-slate-600/50 align-middle font-bold text-slate-200">
                            {pax.label}
                          </td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">
                            {renderCellText(pax.desc)}
                          </td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">
                            {renderCellText(pax.escort)}
                          </td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap font-bold">
                            {pax.seat.includes("不可") ? <span className="text-rose-400">{renderCellText(pax.seat)}</span> : renderCellText(pax.seat)}
                          </td>
                          <td className="p-2 align-top whitespace-pre-wrap">
                            {renderCellText(pax.limit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 共通規定セクション */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 mt-4">
                  {/* 付添者 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg">
                    <h4 className="text-indigo-300 font-black text-xs mb-2 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                      付添者 <span className="text-[9px] text-slate-400 font-normal">(AT/Qualified Escort)</span>
                    </h4>
                    <ul className="text-slate-300 text-[10px] lg:text-[11px] space-y-1 list-disc list-inside leading-relaxed">
                      <li><strong>12歳以上</strong>であること</li>
                      <li>緊急時に付添い対象者の<strong>脱出援助</strong>ができること</li>
                      <li>対象者<strong>以外</strong>の者の脱出援助の必要がないこと</li>
                      <li>対象者の状態を把握し、身の回りの世話ができること</li>
                      <li>対象者の<strong>隣席</strong>に着席すること</li>
                      <li><span className="text-sky-300 font-bold">視覚障がい旅客(BLND)の盲導犬</span>は付添者とみなす</li>
                    </ul>
                  </div>

                  {/* 脱出援助者 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg">
                    <h4 className="text-indigo-300 font-black text-xs mb-1 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                      脱出援助者 <span className="text-[9px] text-slate-400 font-normal">(EE)</span>
                    </h4>
                    <p className="text-[9px] text-amber-300/80 mb-2 leading-tight">
                      付添者を伴わない歩行障がい旅客(WCHC)が規定人数を超過した場合に確保する。
                    </p>
                    <ul className="text-slate-300 text-[10px] lg:text-[11px] space-y-1 list-disc list-inside leading-relaxed">
                      <li><strong>15歳以上</strong>で、援助することに同意していること</li>
                      <li>緊急時に援助対象者の<strong>脱出援助</strong>ができること</li>
                      <li>対象者<strong>以外</strong>の者の脱出援助の必要がないこと</li>
                      <li>対象者の<strong>前後左右4座席以内</strong>に着席すること<br />
                        <span className="text-[9px] text-slate-400 ml-3 inline-block mt-0.5 leading-tight">
                          ※対象者との間にGalley/Lav/Partition/非常口を挟まないこと。(通路は1席とみなす)
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* アシストシート等 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg flex flex-col gap-3">
                    <div>
                      <h4 className="text-indigo-300 font-black text-xs mb-2 border-b border-slate-700 pb-1">アシストシート</h4>
                      <ul className="text-slate-300 text-[10px] lg:text-[11px] space-y-1 list-disc list-inside leading-relaxed">
                        <li>座位の保持が困難な旅客の着席のために貸出す場合がある。</li>
                        <li>使用する旅客は<strong className="text-rose-400">非常口座席に指定不可</strong>。</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};