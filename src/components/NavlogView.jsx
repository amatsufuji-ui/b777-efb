import React, { useState, useRef, useEffect, useMemo } from 'react';

const MAX_ALT_DATA = {
  "772": [ [320, 43100, 43100, 43100, 43100, 43100, 43100], [340, 43100, 43100, 43100, 43100, 43100, 43100], [360, 42100, 43100, 43100, 43100, 43000, 42300], [380, 41000, 43100, 43100, 42900, 42200, 41400], [400, 40000, 43100, 42300, 42100, 41300, 40500], [420, 39000, 43100, 41400, 41200, 40500, 39600], [440, 38000, 42900, 40500, 40400, 39600, 38700], [460, 37100, 42100, 39600, 39600, 38800, 37900], [480, 36300, 41300, 38800, 38700, 37900, 37100], [500, 35500, 40500, 37900, 37900, 37100, 36100], [520, 34800, 39600, 37000, 37100, 36200, 35200], [540, 34000, 38800, 36100, 36200, 35400, 34300], [560, 33600, 38000, 35200, 35400, 34500, 33500] ],
  "773": [ [340, 43100, 43100, 43100, 43100, 43100, 43100], [360, 42300, 43100, 43100, 43100, 43100, 43100], [380, 41200, 43100, 43100, 43100, 42900, 42200], [400, 40100, 43100, 42200, 42600, 42100, 41400], [420, 39000, 43100, 41400, 41800, 41300, 40600], [440, 38000, 43100, 40600, 41100, 40500, 39700], [460, 37200, 42500, 39800, 40300, 39700, 38900], [480, 36400, 41700, 39000, 39500, 39000, 38100], [500, 35700, 40900, 38200, 38800, 37400, 36400], [520, 35000, 40200, 37400, 38000, 37400, 36400], [540, 34200, 39400, 36600, 37200, 36600, 35600] ],
  "77W": [ [380, 42800, 42500, 40400, 43100, 43100, 43000], [400, 41800, 41900, 39700, 43100, 43100, 42400], [420, 40700, 41300, 39000, 42700, 42600, 41700], [440, 39600, 40700, 38300, 42200, 42000, 41100], [460, 38800, 40100, 37600, 41700, 41400, 40400], [480, 38000, 39400, 36900, 41100, 40800, 39700], [500, 37400, 38800, 36200, 40600, 40200, 39100], [520, 36800, 38200, 35500, 40100, 39600, 38400], [540, 36200, 37600, 34800, 39500, 39000, 37700], [560, 35600, 37000, 34100, 39000, 38400, 37100], [580, 34800, 36400, 33400, 38500, 37800, 36400], [600, 34200, 35800, 32700, 37900, 37200, 35700], [620, 33500, 35200, 32000, 37400, 36600, 35100], [640, 32800, 34500, 31300, 36900, 36000, 34400], [660, 32100, 33900, 30600, 36300, 35400, 33700], [680, 31500, 33300, 29900, 35800, 34800, 33100], [700, 30800, 32700, 29200, 35300, 34200, 32400], [720, 30200, 32100, 28500, 34700, 33600, 31700], [740, 29800, 31500, 27800, 34200, 33000, 31100], [760, 29200, 30900, 27100, 33700, 32400, 30400], [780, 28800, 30200, 26400, 33100, 31800, 28000] ],
  "77F": [ [380, 43100, 43100, 40800, 43100, 43100, 43100], [400, 41700, 42500, 39700, 43100, 43100, 43100], [420, 40600, 41600, 38800, 43100, 43100, 43100], [440, 39700, 40800, 37900, 43100, 43100, 43100], [460, 38700, 40000, 37100, 43100, 43100, 43100], [480, 37800, 39200, 36300, 43100, 43100, 42500], [500, 37000, 38500, 35600, 42800, 42300, 41700], [520, 36200, 37800, 34900, 42000, 41500, 40900], [540, 36000, 37200, 34200, 41300, 40800, 40200], [560, 35700, 36500, 33500, 40500, 40100, 39500], [580, 34900, 35900, 32900, 39800, 39400, 38800], [600, 34200, 35400, 32300, 39200, 38700, 38100], [620, 33500, 34800, 31800, 38500, 38000, 37400], [640, 32800, 34300, 31200, 37800, 37400, 36800], [660, 32100, 33700, 30700, 37200, 36700, 36100], [680, 31500, 33200, 30100, 36500, 36100, 35600], [700, 30800, 32700, 29600, 36000, 35600, 35000], [720, 30200, 32300, 29200, 35400, 35000, 34300], [740, 29600, 31800, 28700, 34800, 34300, 33600], [760, 29100, 31300, 28100, 34200, 33700, 32900], [780, 28500, 30700, 27600, 33600, 33100, 32300] ]
};

const REG_MAP = {
  "JA713A": "772", "JA714A": "772", "JA715A": "772", "JA716A": "772", "JA717A": "772", "JA741A": "772", "JA742A": "772", "JA743A": "772", "JA744A": "772", "JA745A": "772",
  "JA751A": "773", "JA752A": "773", "JA753A": "773", "JA754A": "773", "JA755A": "773",
  "JA784A": "77W", "JA785A": "77W", "JA787A": "77W", "JA788A": "77W", "JA790A": "77W", "JA791A": "77W", "JA792A": "77W", "JA793A": "77W", "JA794A": "77W", "JA795A": "77W", "JA796A": "77W", "JA797A": "77W", "JA798A": "77W", "JA799A": "77W",
  "JA771F": "77F", "JA772F": "77F"
};

const DEFAULT_FLIGHT_PLAN_DATA = [
  { wp: "RJTT", ctme: 0, rtme: 741, fob: 242.2, plnAlt: "", plnTmp: "", plnWind: "", isaDev: 0 },
  { wp: "TOC", ctme: 16, rtme: 725, fob: 237.2, plnAlt: "FL310", plnTmp: "", plnWind: "", isaDev: 0 },
  { wp: "GULBO", ctme: 24, rtme: 717, fob: 224.9, plnAlt: "FL310", plnTmp: "-28", plnWind: "310/014", isaDev: 18 },
  { wp: "KJFK", ctme: 741, rtme: 0, fob: 26.0, plnAlt: "FL041", plnTmp: "", plnWind: "", isaDev: 0 }
];

const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr.length < 4) return null;
  const hours = parseInt(timeStr.substring(0, 2), 10);
  const minutes = parseInt(timeStr.substring(2, 4), 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  if (totalMinutes === null || isNaN(totalMinutes)) return "";
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
};

const formatTimePlus = (mins) => {
  if (mins === null || isNaN(mins)) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}+${m.toString().padStart(2, '0')}`;
};

const formatTimeDiff = (diffMins) => {
  if (diffMins === null || isNaN(diffMins)) return "";
  if (diffMins > 0) return `+${diffMins}`;
  if (diffMins < 0) return `${diffMins}`;
  return "±0";
};

const interpolateAlt = (weight, tableData, is15g, isaDev) => {
  if (!tableData || tableData.length === 0) return "---";
  let lower = tableData[0]; let upper = tableData[tableData.length - 1];
  if (weight <= lower[0]) { upper = tableData[1] || tableData[0]; } 
  else if (weight >= upper[0]) { lower = tableData[tableData.length - 2] || upper; } 
  else { for (let i = 0; i < tableData.length - 1; i++) { if (weight >= tableData[i][0] && weight <= tableData[i+1][0]) { lower = tableData[i]; upper = tableData[i+1]; break; } } }
  
  const ratio = (upper[0] - lower[0]) === 0 ? 0 : (weight - lower[0]) / (upper[0] - lower[0]);
  const buffetIndex = is15g ? 3 : 2;
  const buffetAlt = lower[buffetIndex] + ratio * (upper[buffetIndex] - lower[buffetIndex]);
  const thrust10 = lower[4] + ratio * (upper[4] - lower[4]); const thrust15 = lower[5] + ratio * (upper[5] - lower[5]); const thrust20 = lower[6] + ratio * (upper[6] - lower[6]);
  
  let thrustAlt = thrust10;
  const currentIsa = isaDev || 0;
  if (currentIsa <= 10) { thrustAlt = thrust10 + ((currentIsa - 10) / 5) * (thrust15 - thrust10); thrustAlt = Math.min(thrustAlt, 43100); } 
  else if (currentIsa <= 15) { thrustAlt = thrust10 + ((currentIsa - 10) / 5) * (thrust15 - thrust10); } 
  else if (currentIsa <= 20) { thrustAlt = thrust15 + ((currentIsa - 15) / 5) * (thrust20 - thrust15); } 
  else { thrustAlt = thrust20 + ((currentIsa - 20) / 5) * (thrust20 - thrust15); thrustAlt = Math.max(thrustAlt, 10000); }
  
  const maxAlt = Math.min(buffetAlt, thrustAlt);
  return `FL${Math.round(maxAlt / 100)}`;
};

const GraphModal = ({ isOpen, onClose, flightData }) => {
    if (!isOpen) return null;
    const validPoints = flightData.filter(d => d.ato && (d.timeDiffStr !== '' || d.fuelDiff !== null));
    
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 max-w-2xl w-full shadow-2xl flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                    <h3 className="text-white font-bold">Trend Graph (TIME & FUEL)</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl leading-none">&times;</button>
                </div>
                
                <div className="w-full bg-slate-900 rounded-lg p-4 min-h-[300px] flex items-end justify-between relative border border-slate-700 overflow-x-auto hide-scrollbar">
                    {validPoints.length === 0 ? (
                        <div className="w-full text-center text-slate-500 py-10">Data not available</div>
                    ) : (
                        validPoints.map((pt, i) => {
                            const maxTimeDiff = Math.max(...validPoints.map(p => Math.abs(parseInt(p.timeDiffStr)||0)), 10);
                            const tVal = parseInt(pt.timeDiffStr) || 0;
                            const tHeight = Math.abs(tVal) / maxTimeDiff * 50; 
                            
                            const maxFuelDiff = Math.max(...validPoints.map(p => Math.abs(p.fuelDiff||0)), 5);
                            const fVal = pt.fuelDiff || 0;
                            const fHeight = Math.abs(fVal) / maxFuelDiff * 50;

                            return (
                                <div key={i} className="flex flex-col items-center w-12 shrink-0 group relative cursor-pointer mx-1">
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-700 text-xs px-2 py-1 rounded whitespace-nowrap text-white z-10 transition-opacity">
                                        {pt.wp}<br/>T: {tVal > 0 ? '+'+tVal : tVal} / F: {fVal > 0 ? '+'+fVal.toFixed(1) : fVal.toFixed(1)}
                                    </div>
                                    <div className="h-[120px] w-full flex flex-col justify-end items-center border-b border-slate-600 relative">
                                        <div className={`w-3 rounded-t-sm absolute bottom-0 mb-[60px] ${tVal >= 0 ? 'bg-red-400/80' : 'bg-green-400/80'}`} style={{ height: `${tHeight}px`, transform: tVal >= 0 ? 'translateY(-100%)' : '' }}></div>
                                        <div className="absolute bottom-0 mb-[60px] w-full border-t border-dashed border-slate-500"></div>
                                        <div className={`w-3 rounded-b-sm absolute bottom-0 mb-[60px] ${tVal < 0 ? 'bg-green-400/80' : 'bg-red-400/80'}`} style={{ height: `${tVal < 0 ? tHeight : 0}px` }}></div>
                                    </div>
                                    <div className="h-[120px] w-full flex flex-col justify-end items-center mt-2 relative">
                                        <div className={`w-3 rounded-t-sm absolute bottom-0 mb-[60px] ${fVal >= 0 ? 'bg-green-400/80' : 'bg-red-400/80'}`} style={{ height: `${fHeight}px`, transform: fVal >= 0 ? 'translateY(-100%)' : '' }}></div>
                                        <div className="absolute bottom-0 mb-[60px] w-full border-t border-dashed border-slate-500"></div>
                                        <div className={`w-3 rounded-b-sm absolute bottom-0 mb-[60px] ${fVal < 0 ? 'bg-red-400/80' : 'bg-green-400/80'}`} style={{ height: `${fVal < 0 ? fHeight : 0}px` }}></div>
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-2 truncate w-full text-center">{pt.wp}</span>
                                </div>
                            );
                        })
                    )}
                </div>
                
                <div className="w-full flex justify-between mt-4 text-xs text-slate-400 px-4">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded-sm"></div> Late / Burn More</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded-sm"></div> Early / Burn Less</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MemoModal = ({ isOpen, initialMemo, wpName, onClose, onSave }) => {
    const [text, setText] = useState("");
    useEffect(() => { if (isOpen) setText(initialMemo || ""); }, [isOpen, initialMemo]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 max-w-sm w-full shadow-2xl flex flex-col">
                <h3 className="text-white font-bold mb-2">Memo - {wpName}</h3>
                <textarea 
                    value={text} 
                    onChange={e => setText(e.target.value)} 
                    className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 mb-4 resize-none"
                    placeholder="Enter notes here..."
                ></textarea>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded font-bold">Cancel</button>
                    <button onClick={() => { onSave(text); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Save</button>
                </div>
            </div>
        </div>
    );
};

export const NavlogView = ({ flightId, state, updateState, onApplyFlightPlan, navlogData }) => {
  const [takeoffTime, setTakeoffTime] = useState('');
  const [actuals, setActuals] = useState({});
  
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [memoModal, setMemoModal] = useState({ isOpen: false, wp: '', text: '' });

  const rowRefs = useRef([]);
  const hasAutoScrolled = useRef(false);

  const [flightPlan, setFlightPlan] = useState(DEFAULT_FLIGHT_PLAN_DATA);
  const [flightNo, setFlightNo] = useState("ANA0110");
  const [routeInfo, setRouteInfo] = useState("RJTT - KJFK");
  const [parsedReg, setParsedReg] = useState("JA796A");
  const [parsedPzfw, setParsedPzfw] = useState(475.6);
  const [parsedTaxi, setParsedTaxi] = useState(13); 
  const [parsedDate, setParsedDate] = useState("16JUL26");
  const [is15gLimit, setIs15gLimit] = useState(false);

  useEffect(() => {
    if (navlogData && navlogData.newPlan && navlogData.newPlan.length > 0) {
        setFlightPlan(navlogData.newPlan);
        setFlightNo(navlogData.fNo);
        setRouteInfo(navlogData.rInfo);
        setParsedReg(navlogData.pReg);
        setParsedPzfw(navlogData.pPzfw);
        setParsedTaxi(navlogData.pTaxi);
        if(navlogData.pDate) setParsedDate(navlogData.pDate);
        hasAutoScrolled.current = false;
        
        // 既存のメモを維持
        setActuals(prev => {
            const preserved = { ...prev };
            return preserved;
        });
    }
  }, [navlogData]);

  useEffect(() => {
    const saved = localStorage.getItem('navlogFlightDataBackup');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.actuals) setActuals(parsed.actuals);
            if (parsed.takeoffTime) setTakeoffTime(parsed.takeoffTime);
            if (!navlogData) {
                if (parsed.flightPlan) setFlightPlan(parsed.flightPlan);
                if (parsed.flightNo) setFlightNo(parsed.flightNo);
                if (parsed.routeInfo) setRouteInfo(parsed.routeInfo);
                if (parsed.parsedReg) setParsedReg(parsed.parsedReg);
                if (parsed.parsedPzfw) setParsedPzfw(parsed.parsedPzfw);
                if (parsed.parsedTaxi) setParsedTaxi(parsed.parsedTaxi);
                if (parsed.parsedDate) setParsedDate(parsed.parsedDate);
            }
        } catch(e) {}
    }
  }, []);

  useEffect(() => {
    const backup = { flightPlan, actuals, flightNo, routeInfo, parsedReg, parsedPzfw, parsedTaxi, parsedDate, takeoffTime };
    localStorage.setItem('navlogFlightDataBackup', JSON.stringify(backup));
  }, [flightPlan, actuals, flightNo, routeInfo, parsedReg, parsedPzfw, parsedTaxi, parsedDate, takeoffTime]);

  const handleUpdateActual = (wp, field, value) => {
    setActuals(prev => ({ ...prev, [wp]: { ...prev[wp], [field]: value } }));
  };

  const calculatedData = useMemo(() => {
    const data = [];
    const takeoffMinutes = timeToMinutes(takeoffTime);
    const acType = REG_MAP[parsedReg] || "77W";
    const perfTable = MAX_ALT_DATA[acType];

    let totalBurnDiff = 0, lastValidWpIndex = -1;
    let lastAtoIndex = -1, latestAtoMins = null, latestAtoTimeDiff = 0;

    for (let i = 0; i < flightPlan.length; i++) {
        const wpActual = actuals[flightPlan[i].wp] || {};
        if (wpActual.ato && takeoffMinutes !== null) {
            const atoMins = timeToMinutes(wpActual.ato);
            if (atoMins !== null) {
                lastAtoIndex = i; latestAtoMins = atoMins;
                const originalEtoMins = takeoffMinutes + flightPlan[i].ctme;
                let diff = atoMins - originalEtoMins;
                if (diff < -720) diff += 1440; if (diff > 720) diff -= 1440;
                latestAtoTimeDiff = diff;
            }
        }
    }

    let estLandingTimeMins = null;
    if (latestAtoMins !== null && lastAtoIndex !== -1) { estLandingTimeMins = latestAtoMins + flightPlan[lastAtoIndex].rtme; } 
    else if (takeoffMinutes !== null && flightPlan.length > 0) { estLandingTimeMins = takeoffMinutes + flightPlan[flightPlan.length - 1].ctme; }
    const estBlockInMins = estLandingTimeMins !== null ? estLandingTimeMins + parsedTaxi : null;

    for (let i = 0; i < flightPlan.length; i++) {
      const wpPlan = flightPlan[i];
      const wpActual = actuals[wpPlan.wp] || {};
      
      let revisedEtoStr = "";
      if (takeoffMinutes !== null) {
          if (i <= lastAtoIndex) { revisedEtoStr = minutesToTime(takeoffMinutes + wpPlan.ctme); } 
          else { revisedEtoStr = minutesToTime(takeoffMinutes + wpPlan.ctme + latestAtoTimeDiff); }
      }

      let timeDiffStr = "";
      if (wpActual.ato && takeoffMinutes !== null) {
        const atoMins = timeToMinutes(wpActual.ato);
        const originalEtoMins = takeoffMinutes + wpPlan.ctme;
        if (atoMins !== null) {
          let diff = atoMins - originalEtoMins;
          if (diff < -720) diff += 1440; if (diff > 720) diff -= 1440;
          timeDiffStr = formatTimeDiff(diff);
        }
      }

      let fuelDiff = null, currentWeight = parsedPzfw + (wpPlan.fob || 0);
      
      if (wpActual.afob && wpPlan.fob) {
        const afobVal = parseFloat(wpActual.afob);
        if (!isNaN(afobVal)) {
          fuelDiff = afobVal - wpPlan.fob; totalBurnDiff = fuelDiff; lastValidWpIndex = i; currentWeight = parsedPzfw + afobVal; 
        }
      }

      const maxAlt = interpolateAlt(currentWeight, perfTable, is15gLimit, wpPlan.isaDev);

      data.push({
        ...wpPlan, revisedEtoStr, ato: wpActual.ato || "", timeDiffStr, afob: wpActual.afob || "", memo: wpActual.memo || "",
        fuelDiff, maxAlt, currentWeight: currentWeight.toFixed(1), actAlt: wpActual.actAlt || "",
        actTmp: wpActual.actTmp || "", actWind: wpActual.actWind || ""
      });
    }

    return { flightData: data, totalBurnDiff, lastValidWpIndex, estLandingTimeStr: minutesToTime(estLandingTimeMins), estBlockInStr: minutesToTime(estBlockInMins), latestAtoTimeDiffStr: formatTimeDiff(latestAtoTimeDiff) };
  }, [takeoffTime, actuals, flightPlan, parsedPzfw, parsedReg, is15gLimit, parsedTaxi]);

  const scrollToCurrentFix = () => {
    if (!takeoffTime || calculatedData.flightData.length === 0) return;
    const now = new Date();
    const currentUtcMins = now.getUTCHours() * 60 + now.getUTCMinutes();
    let targetIndex = -1;
    let minPositiveDiff = Infinity;
    calculatedData.flightData.forEach((row, idx) => {
      if (row.ato) return;
      const etoStr = row.revisedEtoStr;
      if (!etoStr || etoStr === "----") return;
      const etoMins = timeToMinutes(etoStr);
      if (etoMins === null) return;
      let diff = etoMins - currentUtcMins;
      if (diff < -720) diff += 1440;
      if (diff > 720) diff -= 1440;
      if (diff >= -30 && diff < minPositiveDiff) {
        minPositiveDiff = diff;
        targetIndex = idx;
      }
    });
    if (targetIndex === -1) {
      targetIndex = calculatedData.flightData.findIndex(row => !row.ato);
    }
    if (targetIndex !== -1 && rowRefs.current[targetIndex]) {
      const el = rowRefs.current[targetIndex];
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-blue-600/30', 'transition-colors', 'duration-300');
      setTimeout(() => {
        if (el) { el.classList.remove('bg-blue-600/30'); el.classList.add('duration-1000'); }
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 overflow-hidden">
      
      <MemoModal 
        isOpen={memoModal.isOpen} 
        wpName={memoModal.wp} 
        initialMemo={memoModal.text} 
        onClose={() => setMemoModal({ ...memoModal, isOpen: false })} 
        onSave={(newText) => handleUpdateActual(memoModal.wp, 'memo', newText)}
      />

      <GraphModal 
        isOpen={isGraphOpen} 
        onClose={() => setIsGraphOpen(false)} 
        flightData={calculatedData.flightData}
      />

      <header className="bg-slate-800 border-b border-slate-700 p-2 sm:p-4 shrink-0 shadow-lg z-20 relative">
        <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-blue-400 tracking-wider">{flightNo}</h1>
            <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-1">{routeInfo}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded font-mono">{parsedReg} ({REG_MAP[parsedReg] || "77W"})</span>
                {parsedDate && <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded font-mono font-bold">{parsedDate}</span>}
                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded font-mono">PZFW: {parsedPzfw}</span>
                <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded font-mono">TAXI: {parsedTaxi}M</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            
            <div className="flex gap-2 sm:gap-4 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                <div className="flex flex-col items-center px-1 sm:px-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">EST LND</span>
                    <span className="text-lg sm:text-xl font-mono text-white">{calculatedData.estLandingTimeStr || "----"}</span>
                </div>
                <div className="w-px bg-slate-700"></div>
                <div className="flex flex-col items-center px-1 sm:px-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">BLOCK IN</span>
                    <span className="text-lg sm:text-xl font-mono text-yellow-400">{calculatedData.estBlockInStr || "----"}</span>
                </div>
            </div>

            <div className="flex gap-2">
              <button onClick={scrollToCurrentFix} className="bg-indigo-700 hover:bg-indigo-600 border border-indigo-500 text-white px-2 sm:px-3 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold shadow-md flex items-center transition-colors">
                <span>📍 NOW</span>
              </button>
              <button onClick={() => {}} className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold shadow-md flex items-center transition-colors">
                <span>SEND LOG</span>
              </button>
            </div>

            <div className="flex gap-2 sm:gap-4 items-center bg-slate-900 p-2 sm:p-3 rounded-lg border border-slate-700">
              <div className="flex flex-col">
                <label className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Takeoff (Z)</label>
                <input type="text" placeholder="HHMM" maxLength={4} value={takeoffTime} onChange={(e) => setTakeoffTime(e.target.value.replace(/[^0-9]/g, ''))} className="bg-slate-800 border border-slate-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-base sm:text-xl font-mono text-white text-center w-16 sm:w-24 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="h-8 sm:h-10 w-px bg-slate-700"></div>
              
              <div className="flex flex-col items-center justify-center min-w-[60px]">
                <label className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Time Diff</label>
                <span className={`text-xl sm:text-2xl font-mono font-bold ${parseInt(calculatedData.latestAtoTimeDiffStr) > 0 ? 'text-red-400' : parseInt(calculatedData.latestAtoTimeDiffStr) < 0 ? 'text-green-400' : 'text-slate-200'}`}>
                    {calculatedData.latestAtoTimeDiffStr || "±0"}
                </span>
              </div>
              <div className="h-8 sm:h-10 w-px bg-slate-700"></div>

              <div className="flex flex-col min-w-[80px] sm:min-w-[110px]">
                <label className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Fuel Diff</label>
                <div className="flex items-center gap-2 h-full">
                  {calculatedData.lastValidWpIndex !== -1 ? (
                    <span className={`text-xl sm:text-2xl font-mono font-bold ${calculatedData.totalBurnDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {calculatedData.totalBurnDiff > 0 ? '+' : ''}{calculatedData.totalBurnDiff.toFixed(1)}
                    </span>
                  ) : (<span className="text-slate-500 font-mono text-lg sm:text-xl">--.-</span>)}
                  
                  <button onClick={() => setIsGraphOpen(true)} className="bg-slate-700 hover:bg-slate-600 border border-slate-500 p-1 rounded transition-colors shadow-sm flex items-center justify-center" title="Show Trend Graph">
                    <span className="text-[14px] leading-none">📊</span>
                  </button>
                </div>
              </div>

              <div className="h-8 sm:h-10 w-px bg-slate-700"></div>
              <div className="flex flex-col items-center">
                 <label className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">MAX ALT</label>
                 <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-600 cursor-pointer" onClick={() => setIs15gLimit(!is15gLimit)}>
                    <div className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded ${!is15gLimit ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>1.3G</div>
                    <div className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded ${is15gLimit ? 'bg-red-600 text-white' : 'text-slate-500'}`}>1.5G</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-1 sm:p-2 w-full relative">
        <div className="max-w-[1400px] mx-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700 mb-20 relative">
          
          <div className="grid grid-cols-[110px_80px_1fr_60px_80px_1fr_1.9fr_100px_40px] bg-slate-900 p-2 font-bold text-slate-400 text-[11px] sm:text-xs border-b border-slate-700 sticky top-0 z-10 shadow-md text-center items-end min-w-[950px]">
            <div className="text-left pl-2">WAYPOINT</div>
            <div className="text-slate-500">CTME<br/><span className="text-[9px]">RTME</span></div>
            <div className="text-blue-300">ETO (Rev)<br/>ATO</div>
            <div>TIME<br/>DIFF</div>
            <div className="text-slate-500">PLN FOB</div>
            <div className="text-green-300">RMG FUEL<br/><span className="text-[9px]">DIFF</span></div>
            <div>ACT (ALT / TMP / WIND)</div>
            <div className="text-purple-300">MAX ALT<br/><span className="text-[9px] text-slate-500">WT</span></div>
            <div>MEMO</div>
          </div>
          
          <div className="divide-y divide-slate-700/50 pb-4 min-w-[950px]">
            {calculatedData.flightData.map((row, idx) => (
              <div key={idx} ref={el => rowRefs.current[idx] = el} className="grid grid-cols-[110px_80px_1fr_60px_80px_1fr_1.9fr_100px_40px] py-1.5 px-2 items-center hover:bg-slate-700/40 transition-colors group text-center gap-x-1">
                <div className="font-mono text-lg sm:text-xl font-bold text-left pl-1 text-slate-200 truncate">{row.wp}</div>
                
                <div className="flex flex-col items-center">
                    <span className="font-mono text-sm text-slate-400">{formatTimePlus(row.ctme)}</span>
                    <span className="font-mono text-[10px] text-slate-500">{formatTimePlus(row.rtme)}</span>
                </div>
                
                <div className="flex flex-col px-1 gap-1 items-center">
                  <span className="text-blue-400 font-mono text-sm font-bold h-4 sm:h-5">{row.revisedEtoStr || "----"}</span>
                  <input type="text" placeholder="ATO" maxLength={4} value={row.ato} onChange={(e) => handleUpdateActual(row.wp, 'ato', e.target.value.replace(/[^0-9]/g, ''))} className={`w-full bg-slate-900 border rounded py-1.5 sm:py-2 text-center font-mono text-lg sm:text-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${row.ato ? 'border-blue-500/50 text-white' : 'border-slate-600 text-slate-400'}`} />
                </div>
                
                <div className={`font-mono text-sm font-bold ${parseInt(row.timeDiffStr) > 0 ? 'text-red-400' : parseInt(row.timeDiffStr) < 0 ? 'text-green-400' : 'text-slate-400'}`}>{row.timeDiffStr}</div>

                <div className="font-mono text-sm text-slate-500">{row.fob ? row.fob.toFixed(1) : ''}</div>

                <div className="flex flex-col px-1 gap-1 items-center">
                  <span className={`font-mono text-[10px] h-3 sm:h-4 ${row.fuelDiff > 0 ? 'text-green-400' : row.fuelDiff < 0 ? 'text-red-400' : ''}`}>
                      {row.fuelDiff !== null ? (`${row.fuelDiff > 0 ? '+' : ''}${row.fuelDiff.toFixed(1)}`) : ''}
                  </span>
                  <input type="text" placeholder="RMG" value={row.afob} onChange={(e) => handleUpdateActual(row.wp, 'afob', e.target.value.replace(/[^0-9.]/g, ''))} className={`w-full bg-slate-900 border rounded py-1.5 sm:py-2 text-center font-mono text-lg sm:text-xl focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors ${row.afob ? 'border-green-500/50 text-white' : 'border-slate-600 text-slate-400'}`} />
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-2 px-1">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-500 font-mono mb-0.5 h-3"></span>
                        <input type="text" placeholder="ACT" value={row.actAlt} onChange={(e) => handleUpdateActual(row.wp, 'actAlt', e.target.value.toUpperCase())} className="w-full bg-slate-900 border border-slate-600 rounded text-center text-base font-mono py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-500 transition-colors shadow-inner" />
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 h-3">{row.plnAlt || "-"}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-purple-400 font-mono mb-0.5 h-3 font-bold">{row.isaDev ? `ISA${row.isaDev > 0 ? '+' : ''}${row.isaDev}` : ""}</span>
                        <input type="text" placeholder="ACT" value={row.actTmp} onChange={(e) => handleUpdateActual(row.wp, 'actTmp', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded text-center text-base font-mono py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-500 transition-colors shadow-inner" />
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 h-3">{row.plnTmp || "-"}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-500 font-mono mb-0.5 h-3"></span>
                        <input type="text" placeholder="ACT" value={row.actWind} onChange={(e) => handleUpdateActual(row.wp, 'actWind', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded text-center text-base font-mono py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-500 transition-colors shadow-inner" />
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 h-3">{row.plnWind || "-"}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center pt-2">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-purple-400">{row.maxAlt}</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-1">W: {row.currentWeight}</span>
                </div>

                <div className="flex justify-center items-center">
                    <button 
                        onClick={() => setMemoModal({ isOpen: true, wp: row.wp, text: row.memo })}
                        className={`p-1.5 rounded-lg transition-colors border shadow-sm flex items-center justify-center ${row.memo ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white hover:bg-slate-600'}`}
                        title={row.memo ? "Edit Memo" : "Add Memo"}
                    >
                        <span className="text-[14px] leading-none mt-0.5">📝</span>
                    </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};