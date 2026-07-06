import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SafeIcon } from './SharedComponents';

// --- [5-5] FltInfoView (FLT INFO) ---
export const FltInfoView = ({ p }) => {
  const {
    currentFlightInfo, selectedDep, selectedArr, formatTime, trafficTimeRange,
    setTrafficTimeRange, depTrafficMode, setDepTrafficMode, arrTrafficMode, setArrTrafficMode, relatedTraffic, handleAirlineSelect,
    setSelectedDep, setSelectedArr, setSelectedFlightId, selectedFlightId, selectedAirlineCode,
    selectedAirline, selectedCallsign, availableFlights, airlineCodes, airlines,
    callsigns, availableDeps, availableArrs, forceANASelection, handleTrafficSelect
  } = p;

  // ★ コンボボックス用の状態管理
  const [isFltOpen, setIsFltOpen] = useState(false);
  const fltRef = useRef(null);

  // コンボボックスの外側をクリックした時に閉じる処理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fltRef.current && !fltRef.current.contains(event.target)) {
        setIsFltOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ユーザーが入力した文字と、選択されたエアラインで候補リストを絞り込む
  const filteredFlights = useMemo(() => {
    let flights = availableFlights;
    // 左で選択されているエアラインがあれば、それで絞り込む
    if (selectedAirlineCode) {
      flights = flights.filter(f => f.airlineCode === selectedAirlineCode);
    }

    if (!selectedFlightId) return flights;
    return flights.filter(f =>
      f.flightNo.toLowerCase().includes(selectedFlightId.toLowerCase())
    );
  }, [availableFlights, selectedFlightId, selectedAirlineCode]);

  // ★ プルダウン選択時のハンドラーを追加 (一方をOFFにする)
  const handleDepModeChange = (e) => {
    const val = e.target.value;
    setDepTrafficMode(val);
    if (val !== 'OFF') setArrTrafficMode('OFF');
  };

  const handleArrModeChange = (e) => {
    const val = e.target.value;
    setArrTrafficMode(val);
    if (val !== 'OFF') setDepTrafficMode('OFF');
  };

  return (
    <div className="flex flex-col gap-1 w-full flex-1 animate-in fade-in duration-300 mt-0.5">
      {/* --- FLIGHT INFORMATION & TRAFFIC SECTION --- */}
      <div className="bg-slate-800/80 rounded-[1.5rem] p-1.5 lg:p-2 shadow-2xl border border-slate-700 flex flex-col gap-1.5 relative mt-0 w-full">
        {/* ★紫色の左線を綺麗に角丸に収めるための専用背景レイヤー */}
        <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
        </div>

        {/* 上段: 基本フライト情報 */}
        <div className="flex flex-col gap-2 w-full relative z-10">

          {/* ★ 1行目: タイトル */}
          <div className="flex items-center gap-1.5 pl-2 pt-0.5 shrink-0">
            <SafeIcon name="Map" className="w-4 h-4 text-purple-400" />
            <h2 className="text-[12px] lg:text-[14px] xl:text-[15px] font-black uppercase tracking-widest text-purple-100 whitespace-nowrap leading-none">FLT INFO</h2>
          </div>

          {/* ★ 2行目: 入力コントロール群 (サイズ拡大・文字拡大) */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full pl-2 pr-1">
            {/* Code Select */}
            <div className="relative group w-[60px] lg:w-[75px] xl:w-[90px] shrink-0">
              <select
                value={selectedAirlineCode}
                onChange={(e) => handleAirlineSelect('code', e.target.value)}
                className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-purple-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-purple-400 transition-colors w-full truncate"
              >
                <option value="">Code</option>
                {airlineCodes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-purple-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-purple-400">
                <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
              </div>
            </div>

            {/* Name Select */}
            <div className="relative group min-w-[120px] flex-[2]">
              <select
                value={selectedAirline}
                onChange={(e) => handleAirlineSelect('name', e.target.value)}
                className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-purple-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-purple-400 transition-colors w-full truncate"
              >
                <option value="">Airline Name</option>
                {airlines.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-purple-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-purple-400">
                <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
              </div>
            </div>

            {/* Call Sign Select */}
            <div className="relative group min-w-[90px] flex-[1.5]">
              <select
                value={selectedCallsign}
                onChange={(e) => handleAirlineSelect('callsign', e.target.value)}
                className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-purple-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-purple-400 transition-colors w-full truncate"
              >
                <option value="">Call Sign</option>
                {callsigns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-purple-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-purple-400">
                <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
              </div>
            </div>

            {/* ★ FLT NO Select (Combo Box) */}
            <div className="relative group w-[70px] lg:w-[85px] xl:w-[100px] shrink-0" ref={fltRef}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={selectedFlightId}
                onChange={(e) => {
                  setSelectedFlightId(e.target.value);
                  setIsFltOpen(true);
                }}
                onFocus={() => setIsFltOpen(true)}
                placeholder="FLT NO."
                className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-purple-400 shadow-md appearance-none hover:bg-slate-500 hover:border-purple-400 transition-colors w-full truncate uppercase placeholder:text-slate-400 placeholder:normal-case placeholder:font-bold"
              />
              <div
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-purple-500/40 p-0.5 lg:p-1 rounded-md cursor-pointer transition-colors border border-slate-500 group-hover:border-purple-400"
                onClick={() => setIsFltOpen(!isFltOpen)}
              >
                <SafeIcon name="ChevronDown" className={`w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white transition-transform ${isFltOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* ドロップダウンリスト (下に開く) */}
              {isFltOpen && (
                <div className="absolute top-[110%] left-0 w-[130px] bg-slate-700 border border-slate-400 rounded-lg shadow-2xl z-50 max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col py-1 mt-1">
                  {filteredFlights.length > 0 ? (
                    filteredFlights.map((f, idx) => (
                      <button
                        key={`${f.airlineCode}-${f.flightNo}-${idx}`}
                        onClick={() => {
                          setSelectedFlightId(f.flightNo);
                          handleAirlineSelect('code', f.airlineCode);
                          setIsFltOpen(false);
                        }}
                        className="text-left px-3 py-2 text-[11px] lg:text-[13px] font-black text-white hover:bg-purple-500 transition-colors flex items-center gap-2"
                      >
                        <span className="text-purple-300 w-[24px] shrink-0 text-center">{f.airlineCode}</span>
                        <span className="truncate">{f.flightNo}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-[11px] text-slate-400 font-bold whitespace-nowrap text-center">No match</div>
                  )}
                </div>
              )}
            </div>

            {/* DEP Select */}
            <div className="relative group w-[60px] lg:w-[75px] xl:w-[90px] shrink-0">
              <select
                value={selectedDep}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDep(val);
                  setSelectedFlightId("");
                  if (val) forceANASelection();
                }}
                disabled={availableDeps.length === 0}
                className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-sky-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-sky-400 transition-colors w-full truncate disabled:opacity-50 disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                <option value="">DEP</option>
                {selectedDep && !availableDeps.includes(selectedDep) && <option value={selectedDep}>{selectedDep}</option>}
                {availableDeps.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-sky-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-sky-400">
                <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
              </div>
            </div>

            {/* ARR Select */}
            <div className="relative group w-[60px] lg:w-[75px] xl:w-[90px] shrink-0">
              <select
                value={selectedArr}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedArr(val);
                  setSelectedFlightId("");
                  if (val) forceANASelection();
                }}
                disabled={availableArrs.length === 0}
                className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-emerald-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-emerald-400 transition-colors w-full truncate disabled:opacity-50 disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                <option value="">ARR</option>
                {selectedArr && !availableArrs.includes(selectedArr) && <option value={selectedArr}>{selectedArr}</option>}
                {availableArrs.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-emerald-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-emerald-400">
                <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
              </div>
            </div>
          </div>

          {/* ★ 3行目: Information Badges (表示窓) 再び2行構成（縦並び flex-col, justify-center）に戻す */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 w-full pl-2 pr-1">
            {[
              { label: 'DEP', val: currentFlightInfo?.origin || selectedDep || '--', color: 'text-white' },
              { label: 'ARR', val: currentFlightInfo?.dest || selectedArr || '--', color: 'text-white' },
              { label: 'DEP(LCL)', val: formatTime(currentFlightInfo?.dep), color: 'text-sky-400' },
              { label: 'ARR(LCL)', val: formatTime(currentFlightInfo?.arr), color: 'text-emerald-400' },
              { label: 'EQUIP', val: currentFlightInfo?.equipCode || '--', color: 'text-slate-200' },
              { label: 'SPEED', val: currentFlightInfo?.speed || '--', color: 'text-cyan-400' }
            ].map((info, idx) => (
              <div key={info.label + idx} className="flex-1 bg-slate-900/60 rounded-md px-2.5 py-1.5 border border-slate-700 shadow-inner flex flex-col justify-center overflow-hidden min-w-[75px]">
                <span className="text-[9px] lg:text-[10px] xl:text-[11px] font-bold text-slate-400 uppercase leading-none mb-1 whitespace-nowrap tracking-tighter text-center">{info.label}</span>
                <span className={`text-[15px] lg:text-[17px] xl:text-[19px] font-mono font-black leading-none truncate tracking-tighter text-center ${info.color}`}>{info.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 下段: トラフィック情報 */}
        {currentFlightInfo && (
          <div className="mt-1 pt-1.5 border-t border-slate-700/50 flex flex-col gap-1 w-full relative z-10 pl-2 pr-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <SafeIcon name="Radar" className="w-4 h-4 text-purple-400" />
                <span className="text-[12px] lg:text-[14px] xl:text-[15px] font-black text-purple-100 uppercase tracking-widest leading-none mt-0.5">Traffic Watch</span>

                <div className="relative group flex items-center h-full ml-2">
                  <select
                    value={trafficTimeRange}
                    onChange={(e) => setTrafficTimeRange(Number(e.target.value))}
                    className="bg-slate-600 border border-slate-400 rounded-md text-[10px] lg:text-[11px] xl:text-[12px] font-black text-white pl-2 pr-5 py-0.5 outline-none focus:border-purple-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-purple-400 transition-colors tracking-widest leading-none"
                  >
                    {[10, 20, 30, 40, 50, 60].map(min => (
                      <option key={min} value={min}>±{min} MINS</option>
                    ))}
                  </select>
                  <SafeIcon name="ChevronDown" className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-200 group-hover:text-white pointer-events-none transition-colors" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-600 shadow-sm">
                  <span className="text-[9px] xl:text-[10px] font-black text-sky-400 pl-1.5 uppercase whitespace-nowrap">DEP AIRPORT {currentFlightInfo?.origin && currentFlightInfo.origin !== '--' ? `(${currentFlightInfo.origin})` : ''}</span>
                  <div className="relative group flex items-center h-full">
                    <select
                      value={depTrafficMode}
                      onChange={handleDepModeChange}
                      className="bg-slate-600 border border-slate-500 rounded-md text-[9px] xl:text-[10px] font-black text-white pl-2 pr-5 py-0.5 outline-none focus:border-sky-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-sky-400 transition-colors"
                    >
                      <option value="DEP">DEP</option>
                      <option value="ARR">ARR</option>
                      <option value="ALL">ALL</option>
                      <option value="OFF">OFF</option>
                    </select>
                    <SafeIcon name="ChevronDown" className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-200 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-600 shadow-sm">
                  <span className="text-[9px] xl:text-[10px] font-black text-emerald-400 pl-1.5 uppercase whitespace-nowrap">ARR AIRPORT {currentFlightInfo?.dest && currentFlightInfo.dest !== '--' ? `(${currentFlightInfo.dest})` : ''}</span>
                  <div className="relative group flex items-center h-full">
                    <select
                      value={arrTrafficMode}
                      onChange={handleArrModeChange}
                      className="bg-slate-600 border border-slate-500 rounded-md text-[9px] xl:text-[10px] font-black text-white pl-2 pr-5 py-0.5 outline-none focus:border-emerald-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-emerald-400 transition-colors"
                    >
                      <option value="OFF">OFF</option>
                      <option value="DEP">DEP</option>
                      <option value="ARR">ARR</option>
                      <option value="ALL">ALL</option>
                    </select>
                    <SafeIcon name="ChevronDown" className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-200 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* ★ 案1＆2融合: リスト型（電光掲示板風）レイアウト + アライメントとレスポンシブの調整 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 w-full pb-0.5 mt-0.5">
              {relatedTraffic.length > 0 ? relatedTraffic.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => handleTrafficSelect(t)}
                  className={`relative rounded-lg px-2.5 py-2.5 border shadow-sm flex items-center w-full overflow-hidden cursor-pointer transition-all group ${t._isCurrent
                      ? 'bg-purple-900/80 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)] z-10 scale-[1.01]'
                      : 'bg-slate-900/60 border-slate-600 hover:bg-slate-800 hover:border-purple-400 hover:shadow-md'
                    }`}
                >
                  <div className="flex items-center w-full gap-1.5 relative z-10">

                    {/* 1. 時間 */}
                    <div className="w-[38px] xl:w-[42px] shrink-0 text-left">
                      <span className={`text-[14px] xl:text-[15px] font-mono font-black leading-none ${t._tType === 'DEP' ? 'text-sky-400' : 'text-emerald-400'}`}>
                        {formatTime(t._tTime)}
                      </span>
                    </div>

                    {/* 2. 縦線 */}
                    <div className="w-[1px] h-8 bg-slate-600/50 shrink-0 hidden sm:block"></div>

                    {/* 3. 便名 & コールサイン */}
                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={`text-[13px] xl:text-[14px] font-black truncate leading-none transition-colors ${t._isCurrent ? 'text-purple-300' : 'text-white group-hover:text-purple-300'}`}>
                          {t.airlineCode} {t.flightNo}
                        </span>
                        <span className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate leading-none">
                          {t.callsign || t.callSign || t.airline || "---"}
                        </span>
                      </div>
                    </div>

                    {/* 4. 機材 */}
                    <div className="w-[36px] xl:w-[42px] shrink-0 text-right">
                      <span className="text-[11px] xl:text-[12px] font-bold text-slate-300 truncate leading-none">
                        {t.equipCode}
                      </span>
                    </div>

                    {/* 5. TO/FM 目的地 + 基準空港 */}
                    <div className="w-[74px] xl:w-[82px] shrink-0 flex flex-col items-start justify-center">
                      <div className="flex items-center justify-start gap-1">
                        {t._tType === 'DEP' ? (
                          <>
                            <span className="inline-block w-[22px] text-center bg-sky-500/20 text-sky-400 px-1 py-0.5 rounded-[4px] font-black tracking-widest text-[9px] xl:text-[10px] border border-sky-500/30">TO</span>
                            <span className="text-white text-[13px] xl:text-[14px] font-black truncate">{t.dest}</span>
                          </>
                        ) : (
                          <>
                            <span className="inline-block w-[22px] text-center bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded-[4px] font-black tracking-widest text-[9px] xl:text-[10px] border border-emerald-500/30">FM</span>
                            <span className="text-white text-[13px] xl:text-[14px] font-black truncate">{t.origin}</span>
                          </>
                        )}
                      </div>
                      <span className={`text-[8.5px] font-bold mt-0.5 leading-none ${t._basePort === (currentFlightInfo?.origin || selectedDep) ? 'text-sky-400/80' : 'text-emerald-400/80'}`}>
                        @ {t._basePort}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-3 text-center text-[12px] xl:text-[13px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/40 rounded-lg border border-slate-600/50 border-dashed">
                  No other traffic within ±{trafficTimeRange} mins
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};