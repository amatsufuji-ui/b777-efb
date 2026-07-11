import React from 'react';
import { SafeIcon } from './SharedComponents';
import { formatNum, formatWeightDisplay, parseWeightInput } from '../utils/flightCalc';


export const DashboardView = ({ state, updateState, computed, aircraftRegistrationList, handleRegChange, setAircraftType, cruiseWtInputText, setCruiseWtInputText, ldgWtInputText, setLdgWtInputText }) => {
  const highlightToggleClass = (isActive, variant = "blue") => isActive ? `px-2 py-0.5 text-[9px] font-bold border-2 rounded transition-all tracking-wider ${variant === 'green' ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10' : variant === 'red' ? 'border-red-400 text-red-400 bg-red-400/10' : 'border-blue-400 text-blue-400 bg-blue-400/10'}` : "px-2 py-0.5 text-[9px] font-bold border border-slate-700 rounded transition-all tracking-wider text-slate-500 hover:text-slate-400";

  return (
    <div className="flex flex-col gap-1 overflow-y-auto flex-1 h-full pr-1 animate-in fade-in">
      
      {/* ================================== AIRCRAFT PROFILE ================================== */}
      <div className="flex flex-col bg-gradient-to-r from-slate-900 via-[#131c2f] to-slate-900 p-2 rounded-xl border border-slate-700/80 shadow-lg gap-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/3 h-full bg-blue-500/5 blur-xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 z-10 w-full">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-500/30 shadow-inner"><SafeIcon name="PlaneTakeoff" className="w-4 h-4 text-blue-400" /></div>
            <span className="text-white font-black tracking-tighter text-[11px] sm:text-xs uppercase drop-shadow-sm">AIRCRAFT PROFILE</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none min-w-[100px]">
              <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                <SafeIcon name="Hash" className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <select value={state.selectedReg} onChange={(e) => handleRegChange(e.target.value)} className="w-full bg-[#0f172a]/90 text-white text-[11px] font-black pl-7 pr-8 py-1.5 rounded-lg border border-slate-600 outline-none hover:border-blue-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 shadow-inner transition-all appearance-none cursor-pointer tracking-widest backdrop-blur-sm">
                <option value="">-- REG --</option>{aircraftRegistrationList?.map(ac => (<option key={ac.reg} value={ac.reg}>{ac.reg}</option>))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
                <SafeIcon name="ChevronDown" className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
            <div className="flex bg-[#05070a] rounded-md p-1 border border-slate-700 shadow-[inset_0_4px_6px_rgba(0,0,0,0.8)] w-full md:w-auto relative gap-0.5 sm:gap-1">
              {[{ type: "777-200", label: "772" }, { type: "777-300", label: "773" }, { type: "777-300ER", label: "77W" }, { type: "777F", label: "77F" }].map(d => (
                <button
                  key={d.type}
                  onClick={() => setAircraftType(d.type)}
                  className={`flex-1 md:flex-none px-3 py-1.5 text-[11px] sm:text-xs font-mono font-black rounded-sm transition-colors duration-150 whitespace-nowrap relative z-10 tracking-widest flex items-center justify-center
                    ${d.type === state.selectedType 
                      ? "text-fuchsia-400 bg-gradient-to-b from-[#334155] to-[#0f172a] shadow-[0_2px_4px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] border border-slate-600" 
                      : "text-slate-600 bg-gradient-to-b from-[#1e293b] to-[#0b101d] border border-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:text-slate-400"
                    }`}
                >
                  <span className="relative z-10 drop-shadow-md">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 w-full mt-0.5 border-t border-slate-700/50 pt-1.5 z-10">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] md:text-[10px] text-slate-300 font-bold w-full leading-none">
            <span className="flex items-center gap-1"><SafeIcon name="Maximize" className="w-3 h-3 text-blue-400" /> <span className="text-white font-black">{computed?.dim?.span || "60.9m"} x {computed?.dim?.length || "63.7m"} x {computed?.dim?.height || "18.6m"}</span></span>
            <span className="text-slate-500 hidden sm:inline">|</span><span>RFFS: <strong className="text-white font-black">ICAO 9 / FAA E</strong></span>
            <span className="text-slate-500 hidden sm:inline">|</span><span>OUTER GEAR: <strong className="text-white font-black">12.9M (CODE F)</strong></span>
            <span className="text-slate-500 hidden sm:inline">|</span><span>WASHOUT: <strong className="text-white font-black">{computed?.washout || "10,000-12,000FT"}</strong></span>
            <span className="text-slate-500 hidden sm:inline">|</span><span className="flex items-center gap-1"><SafeIcon name="Users" className="w-3 h-3 text-amber-400" /> <strong className="text-white font-black">{computed?.configText || "N/A"}</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] md:text-[10px] text-slate-300 font-bold w-full leading-none mt-1">
            <span>ETOPS: <strong className="text-white font-black">{computed?.etops || "423NM"}</strong></span><span className="text-slate-500 hidden sm:inline">|</span><span>T/O: <strong className="text-white font-black">{computed?.toSetting || "N/A"}</strong></span><span className="text-slate-500 hidden sm:inline">|</span><span>OXY: <strong className="text-white font-black truncate max-w-[200px] sm:max-w-none">{computed?.oxy || "N/A"}</strong></span><span className="text-slate-500 hidden sm:inline">|</span><span>ENG OIL: <strong className="text-white font-black">{computed?.engOil || "ABV 18"}</strong></span><span className="text-slate-500 hidden sm:inline">|</span><span>BRK TEMP: <strong className="text-white font-black">{computed?.brakeTemp || "N/A"}</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] md:text-[10px] text-slate-300 font-bold w-full leading-none mt-1">
             <span className="text-rose-400 tracking-wider flex items-center gap-0.5 uppercase whitespace-nowrap"><SafeIcon name="Wind" className="w-3 h-3" /> X-WIND</span>
             <span className="font-mono text-white font-black text-[8px] sm:text-[9px] truncate">DRY:38 | WET:25 | CC3:20(15) | CC2:15(10) | CC1:10 <span className="text-slate-400 font-bold">*() &lt;2700m</span></span>
             <span className="text-slate-500 hidden sm:inline ml-1">|</span>
             <span className="text-amber-500 tracking-wider flex items-center gap-0.5 uppercase whitespace-nowrap sm:ml-1"><SafeIcon name="AlertTriangle" className="w-3 h-3" /> DG MAX</span>
             <span>火薬類: <strong className="text-white font-black">{computed?.dgExp || "250kg(550lbs)"}</strong></span><span className="text-slate-500 hidden sm:inline">|</span><span>ISO: <strong className="text-white font-black">{computed?.dgIso || "32単位"}</strong></span><span className="text-slate-500 hidden sm:inline">|</span><span>DRY: <strong className="text-white font-black">{computed?.dgDry || "600kg"}</strong></span>
             <div className="flex items-center gap-1 ml-auto shrink-0">
               <span className="bg-slate-800 text-[8px] md:text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-600 shadow-sm text-slate-200 font-black">Taxi: {computed?.taxiFuelRate || 57} lbs/m</span>
               <span className="bg-slate-800 text-[8px] md:text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-600 shadow-sm text-slate-200 font-black">APU: 9 lbs/m</span>
             </div>
          </div>
        </div>
      </div>

   {/* ================================== CRUISE PERFORMANCE ================================== */}
      <div className="bg-[#131c2f] border border-slate-700 rounded-lg p-1.5 shadow-xl mt-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-cyan-400 font-bold tracking-widest text-[9px] border border-cyan-500/50 px-1.5 py-0.5 rounded-full bg-cyan-500/10 w-fit whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>CRUISE PERFORMANCE</div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 mr-1">MARGIN</span>
            <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700 shadow-inner">
              <button onClick={() => updateState('buffetMargin', '1.3G')} className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${(!state.buffetMargin || state.buffetMargin === '1.3G') ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>1.3G</button>
              <button onClick={() => updateState('buffetMargin', '1.5G')} className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${state.buffetMargin === '1.5G' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>1.5G</button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex w-full gap-1 overflow-x-auto hide-scrollbar">
            <div className="flex-1 min-w-[65px] border border-blue-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-blue-300 pb-0.5 tracking-wider">OPT ALT</div>
              <div className="flex-1 flex justify-center items-center"><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter leading-none">{formatNum(computed?.optAlt)}</span><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">FT</span></div>
            </div>
            <div className="flex-1 min-w-[65px] border border-orange-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-orange-300 pb-0.5 tracking-wider">MAX ALT</div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="flex items-baseline"><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter leading-none">{formatNum(computed?.maxAlt)}</span><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">FT</span></div>
                <span className="text-[9px] sm:text-[10px] font-bold text-orange-200 bg-orange-500/30 px-1.5 py-[1px] rounded mt-0.5 whitespace-nowrap leading-none">{computed?.limitReason || "N/A"}</span>
              </div>
            </div>
            <div className="flex-1 min-w-[65px] border border-purple-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-purple-300 pb-0.5 tracking-wider">VMO / MMO</div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="flex items-baseline"><span className="text-base sm:text-xl font-extrabold text-white font-mono tracking-tighter leading-none">{`${computed?.vmo || 330}/.${computed?.mmo?.toString().replace("0.", "") || "87"}`}</span></div>
                <span className="text-[9px] sm:text-[10px] font-bold text-purple-200 bg-purple-500/30 px-1.5 py-[1px] rounded mt-0.5 whitespace-nowrap">KIAS / MACH</span>
              </div>
            </div>
            <div className="flex-1 min-w-[70px] border border-indigo-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-indigo-300 pb-0.5 tracking-wider">FLAP UP MAN</div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="flex items-baseline"><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter leading-none">{computed?.flapUpManeuver || "N/A"}</span><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">KTS</span></div>
                <span className="text-[9px] sm:text-[10px] font-bold text-indigo-200 bg-indigo-500/30 px-1.5 py-[1px] rounded mt-0.5">Vref30 + 80</span>
              </div>
            </div>
            <div className={`flex-[1.2] min-w-[120px] bg-slate-800/80 border border-slate-700 border-t-[3px] ${computed?.minSpdBorderClass || "border-t-slate-500"} rounded flex flex-col justify-between items-center relative overflow-hidden p-1 group`}>
              <div className="absolute top-0.5 right-0.5 flex flex-col items-end gap-[2px]">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-200 bg-slate-900/80 px-1 rounded border border-slate-600 leading-none">{computed?.holdSpdLabelWt || "---"}</span><span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-200 bg-slate-900/80 px-1 rounded border border-slate-600 leading-none">{computed?.holdSpdLabelAlt || "---"}</span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 mt-0"><SafeIcon name="MapPin" className={`w-2.5 h-2.5 ${computed?.minSpdIconClass || "text-slate-400"}`} /> MINIMUM SPD</span>
              <div className="flex items-center gap-1 my-0.5">
                <div className="text-lg sm:text-2xl font-black tracking-tighter leading-none flex items-baseline gap-0.5">{computed?.holdSpdJsx || <span className="text-white">---</span>}<span className="text-[9px] sm:text-[10px] font-bold text-slate-300 tracking-normal ml-0.5">{computed?.spdUnit || "---"}</span></div>
              </div>
              <div className="mt-auto flex flex-row items-center justify-center bg-slate-900/50 py-0.5 px-1 rounded-md border border-slate-700/50 w-full"><span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-200 whitespace-nowrap text-center">{computed?.minSpdTypeJsx || "---"}</span></div>
            </div>
          </div>
          <div className="w-full border border-slate-700 rounded p-1.5 flex gap-2 bg-[#1e293b]">
            <div className="flex-[2] flex flex-col justify-center">
              <div className="flex justify-between items-end mb-0.5">
                <span className="text-[9px] sm:text-[10px] text-slate-200 font-bold tracking-wider">GROSS WT</span>
                <div className="flex items-center"><input type="text" inputMode="decimal" value={String(cruiseWtInputText).replace(/[kKｋＫ]/g, '')} onChange={(e) => setCruiseWtInputText(e.target.value.replace(/[kKｋＫ]/g, ''))} onBlur={() => { const w = parseWeightInput(cruiseWtInputText); if (w !== null) updateState('cruiseWeight', w); else setCruiseWtInputText(formatWeightDisplay(state.cruiseWeight)); }} className="bg-transparent text-right text-[11px] text-white font-bold font-mono w-12 border-b border-transparent hover:border-slate-500 focus:border-emerald-500 focus:outline-none transition-colors" /><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">KLBS</span></div>
              </div>
              <input type="range" step="1000" min={computed?.minCruiseWeight || 150000} max={computed?.maxCruiseWeight || 500000} value={computed?.clampedCruiseWeight || state.cruiseWeight} onChange={(e) => updateState('cruiseWeight', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 my-1.5" />
              <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-300 mt-0.5 font-mono"><span>{Math.round((computed?.minCruiseWeight || 150000) / 1000)}k</span><span>{Math.round((computed?.maxCruiseWeight || 500000) / 1000)}k</span></div>
            </div>
            <div className="w-px bg-slate-700 my-1 self-stretch"></div>
            <div className="flex-[1.5] flex flex-col justify-center min-w-[75px]">
              <div className="flex justify-between items-end mb-0.5"><span className="text-[9px] sm:text-[10px] text-slate-200 font-bold tracking-wider">CRZ ALT</span><span className="text-[11px] text-white font-bold font-mono"><span>{formatNum(state.cruiseAltitude)}</span><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">FT</span></span></div>
              <input type="range" min="0" max="43000" step="1000" value={state.cruiseAltitude} onChange={(e) => updateState('cruiseAltitude', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
              <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-300 mt-0.5 font-mono"><span>0</span><span>43k</span></div>
            </div>
            <div className="w-px bg-slate-700 my-1 self-stretch"></div>
            <div className="flex-[1] flex flex-col justify-center min-w-[60px]">
              <div className="flex justify-between items-end mb-0.5"><span className="text-[9px] sm:text-[10px] text-slate-200 font-bold tracking-wider">ISA DEV</span><span className="text-[11px] text-white font-bold font-mono">{(state.isaDev >= 0 ? '+' : '') + state.isaDev + '°C'}</span></div>
              <input type="range" min="-20" max="30" step="1" value={state.isaDev} onChange={(e) => updateState('isaDev', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
              <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-300 mt-0.5 font-mono"><span>-20</span><span>+30</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================== LANDING ADJUSTED DISTANCE ================================== */}
      <div className="bg-[#0b101d] border border-slate-700/80 rounded-lg p-1 sm:p-1.5 shadow-2xl space-y-1.5 mt-1">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-1">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 text-emerald-400 font-bold tracking-widest text-[9px] border border-emerald-500/50 px-1.5 py-0.5 rounded-full bg-emerald-500/10 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>LANDING</div>
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-300 font-mono pl-1">ADJUSTED DISTANCE</div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <div className="flex gap-0.5"><button className={highlightToggleClass(state.landingCondition === 'Normal', 'green')} onClick={() => updateState('landingCondition', 'Normal')}>NORMAL</button><button className={highlightToggleClass(state.landingCondition === '1 ENG INOP', 'red')} onClick={() => updateState('landingCondition', '1 ENG INOP')}>ENG INOP</button></div>
            <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
            <div className="flex gap-0.5"><button className={highlightToggleClass(state.selectedRwyCond === '6-DRY', 'green')} onClick={() => updateState('selectedRwyCond', '6-DRY')}>DRY</button><button className={highlightToggleClass(state.selectedRwyCond === '5-WET', 'blue')} onClick={() => updateState('selectedRwyCond', '5-WET')}>WET</button></div>
            <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
            <div className="flex items-center gap-0.5"><button className={highlightToggleClass(state.reverserConfig === 'Both')} onClick={() => updateState('reverserConfig', 'Both')}>BOTH</button><button className={highlightToggleClass(state.reverserConfig === 'One')} onClick={() => updateState('reverserConfig', 'One')}>ONE</button><button className={highlightToggleClass(state.reverserConfig === 'None', 'red')} onClick={() => updateState('reverserConfig', 'None')}>NO REV</button></div>
            <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5"><button className={highlightToggleClass(state.factConfig === '1.15', 'green')} onClick={() => updateState('factConfig', '1.15')}>FACT 1.15</button><button className={highlightToggleClass(state.factConfig === '1.00')} onClick={() => updateState('factConfig', '1.00')}>BASE 1.00</button></div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 font-mono hidden sm:inline ml-1 whitespace-nowrap">OAT 30℃ for DRY/WET</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 w-full">
          {/* ROW 1: N1, MAX MAN, MAX AUTO, AUTO 4 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 w-full">
            <div className="border border-pink-500/60 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
              <div className="text-center text-[9px] sm:text-[10px] font-black text-pink-300 pb-0.5 tracking-widest bg-[#131c2f]">TARGET N1</div>
              <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                <div className="flex justify-between items-baseline leading-none"><div className="flex items-baseline gap-1"><span className="text-[10px] sm:text-[12px] text-pink-200 font-bold">{computed?.activeFlaps?.[0] || '---'}</span><span className="text-[9px] sm:text-[10px] text-pink-300 font-mono font-bold tracking-tighter">{computed?.pchF1 || '---'}</span></div><div className="flex items-baseline"><span className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono tracking-tighter">{computed?.n1F1 || '---'}</span><span className="text-[9px] sm:text-[10px] text-emerald-300 font-bold ml-[1px]">%</span></div></div>
                <div className="flex justify-between items-baseline leading-none"><div className="flex items-baseline gap-1"><span className="text-[10px] sm:text-[12px] text-pink-200 font-bold">{computed?.activeFlaps?.[1] || '---'}</span><span className="text-[9px] sm:text-[10px] text-pink-300 font-mono font-bold tracking-tighter">{computed?.pchF2 || '---'}</span></div><div className="flex items-baseline"><span className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono tracking-tighter">{computed?.n1F2 || '---'}</span><span className="text-[9px] sm:text-[10px] text-emerald-300 font-bold ml-[1px]">%</span></div></div>
              </div>
              <div className="px-1 py-0.5 text-[9px] sm:text-[10px] text-pink-200 font-mono font-bold text-center flex justify-between mt-auto border-t border-pink-500/40 pt-0.5"><span>{computed?.engine || '---'}</span><span className="text-pink-200">Vref+{state.appSpeedAdditive}</span></div>
            </div>
            
            <div className="border border-slate-700 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full relative group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-500/30 group-hover:bg-sky-400/60 transition-colors"></div>
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#131c2f]">MAX MAN</div>
              <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[0] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distMan1)}</span></div>
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[1] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distMan2)}</span></div>
              </div>
              <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
            </div>

            <div className="border border-slate-700 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#131c2f]">MAX AUTO</div>
              <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[0] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distMax1)}</span></div>
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[1] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distMax2)}</span></div>
              </div>
              <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
            </div>

            <div className="border border-slate-700 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 4</div>
              <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[0] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distAb41)}</span></div>
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[1] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distAb42)}</span></div>
              </div>
              <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
            </div>
          </div>

          {/* ROW 2: AUTO 3, AUTO 2, AUTO 1, M TO FT (2列化) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 w-full mt-0.5">
            <div className="border border-slate-700 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 3</div>
              <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[0] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distAb31)}</span></div>
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[1] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distAb32)}</span></div>
              </div>
              <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
            </div>
            
            <div className="border border-slate-700 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 2</div>
              <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[0] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distAb21)}</span></div>
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[1] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distAb22)}</span></div>
              </div>
              <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
            </div>
            
            <div className="border border-slate-700 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 1</div>
              <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[0] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distAb11)}</span></div>
                <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[11px] text-slate-400 font-bold">{computed?.activeFlaps?.[1] || '---'}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed?.distAb12)}</span></div>
              </div>
              <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
            </div>

            {/* M TO FT BADGE (2列化・文字拡大) */}
            <div className="border border-slate-700 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full col-span-2 md:col-span-1">
              <div className="text-center text-[9px] sm:text-[10px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#131c2f]">M TO FT</div>
              <div className="flex-1 grid grid-cols-2 gap-x-2 py-0.5 px-1.5 font-mono items-center">
                <div className="flex flex-col justify-around h-full border-r border-slate-700/50 pr-1 gap-1">
                  <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">3000m:</span><span className="text-sm sm:text-base font-extrabold text-white tracking-tighter">9,843'</span></div>
                  <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">2800m:</span><span className="text-sm sm:text-base font-extrabold text-white tracking-tighter">9,186'</span></div>
                </div>
                <div className="flex flex-col justify-around h-full pl-0.5 gap-1">
                  <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">2500m:</span><span className="text-sm sm:text-base font-extrabold text-white tracking-tighter">8,202'</span></div>
                  <div className="flex justify-between items-baseline leading-none"><span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">2000m:</span><span className="text-sm sm:text-base font-extrabold text-white tracking-tighter">6,562'</span></div>
                </div>
              </div>
              <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: SLIDERS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 pt-1">
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827]">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[9px] sm:text-[10px] text-slate-200 font-bold tracking-wider">LANDING WT</span>
              <div className="flex items-center"><input type="text" inputMode="decimal" value={String(ldgWtInputText).replace(/[kKｋＫ]/g, '')} onChange={(e) => setLdgWtInputText(e.target.value.replace(/[kKｋＫ]/g, ''))} onBlur={() => { const w = parseWeightInput(ldgWtInputText); if (w !== null) updateState('landingWeight', w); else setLdgWtInputText(formatWeightDisplay(state.landingWeight)); }} className="bg-transparent text-right text-[11px] text-white font-bold font-mono w-12 border-b border-transparent hover:border-slate-500 focus:border-emerald-500 focus:outline-none transition-colors" /><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">KLBS</span></div>
            </div>
            <input type="range" step="1000" min={computed?.landingMinWeight || 280000} max={computed?.maxAvailableLdgWt || 800000} value={computed?.clampedLandingWeight || state.landingWeight} onChange={(e) => updateState('landingWeight', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 my-1.5" />
            <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-300 mt-0.5 font-mono"><span>{Math.round((computed?.landingMinWeight || 280000) / 1000)}k</span><span>MAX: {Math.round((computed?.maxAvailableLdgWt || 800000) / 1000)}k</span></div>
          </div>
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[9px] sm:text-[10px] text-slate-200 font-bold tracking-wider">WIND COMP</span><span className="text-[11px] text-white font-bold font-mono"><span>{computed?.windText || "0"}</span><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">KT</span></span>
            </div>
            <input type="range" min="-20" max="15" step="5" value={state.windComponent} onChange={(e) => updateState('windComponent', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
          </div>
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[9px] sm:text-[10px] text-slate-200 font-bold tracking-wider">APP SPD ADD</span><span className="text-[11px] text-white font-bold font-mono"><span>+{state.appSpeedAdditive}</span><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">KT</span></span>
            </div>
            <input type="range" min="0" max="30" step="5" value={state.appSpeedAdditive} onChange={(e) => updateState('appSpeedAdditive', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
          </div>
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[9px] sm:text-[10px] text-slate-200 font-bold tracking-wider">PRESS ALT</span><span className="text-[11px] text-white font-bold font-mono"><span>{formatNum(state.pressureAlt)}</span><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">FT</span></span>
            </div>
            <input type="range" min="0" max="8000" step="1000" value={state.pressureAlt} onChange={(e) => updateState('pressureAlt', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
          </div>
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[9px] sm:text-[10px] text-slate-200 font-bold tracking-wider">RWY SLOPE</span><span className="text-[11px] text-white font-bold font-mono"><span>{computed?.slopeText || "0"}</span><span className="text-[9px] sm:text-[10px] font-bold text-slate-300 ml-0.5">%</span></span>
            </div>
            <input type="range" min="-2" max="2" step="1" value={state.rwSlope} onChange={(e) => updateState('rwSlope', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
          </div>
        </div>
      </div>
    </div>
  );
};