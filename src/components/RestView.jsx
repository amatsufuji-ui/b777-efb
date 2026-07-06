import React, { useMemo } from 'react';
import { SafeIcon } from './SharedComponents';


// --- [5-3] RestView (REST CALC) ---
export const RestView = ({
  flightHours, setFlightHours,
  flightMins, setFlightMins,
  stdHours, setStdHours,
  stdMins, setStdMins,
  isTakeoffAuto, setIsTakeoffAuto,
  takeoffHours, setTakeoffHours,
  takeoffMins, setTakeoffMins,
  offsetMins, setOffsetMins,
  landingOffsetMins, setLandingOffsetMins,
  crewSize, setCrewSize,
  firstRestMins, setFirstRestMins,
  lastRestMins, setLastRestMins,
  firstHalfMins, setFirstHalfMins,
  taxiOutMins
}) => {

  const totalMins = useMemo(() => flightHours * 60 + flightMins, [flightHours, flightMins]);
  const takeoffTotalMins = useMemo(() => takeoffHours * 60 + takeoffMins, [takeoffHours, takeoffMins]);
  const arrivalTotalMins = useMemo(() => takeoffTotalMins + totalMins, [takeoffTotalMins, totalMins]);

  // ★変更: 休憩開始時間を5分単位で切り上げ（繰り上げ）
  const startTimeMins = useMemo(() => Math.ceil((takeoffTotalMins + offsetMins) / 5) * 5, [takeoffTotalMins, offsetMins]);

  // 切り上げた結果、実際のオフセット時間（離陸から休憩開始まで）が何分になったかを算出
  const actualOffsetMins = useMemo(() => startTimeMins - takeoffTotalMins, [startTimeMins, takeoffTotalMins]);

  // 実際に休憩に割り当て可能な時間を再計算（繰り上がった分、休憩枠が減る）
  const restableMins = useMemo(() => Math.max(0, totalMins - actualOffsetMins - landingOffsetMins), [totalMins, actualOffsetMins, landingOffsetMins]);

  const formatTimeWithWrap = (mins) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  const arrivalTimeFormatted = useMemo(() => formatTimeWithWrap(arrivalTotalMins), [arrivalTotalMins]);

  const calcRest = (divisor, pilotCount) => {
    if (restableMins <= 0) return { isCustom: false, mins: 0, text: '0:00', shifts: [], startTime: '00:00', totalActual: '0:00', totalActualMins: 0, lastEnd: '00:00', buffer: 0, pilotBlocks: [] };

    const raw = restableMins / divisor;
    const rounded5 = Math.floor(raw / 5) * 5;
    const h = Math.floor(rounded5 / 60);
    const m = rounded5 % 60;

    const totalActualMins = rounded5 * divisor;
    const th = Math.floor(totalActualMins / 60);
    const tm = totalActualMins % 60;

    const shifts = [];
    let currentMins = startTimeMins;

    const pilotBlocks = Array.from({ length: pilotCount }, () => []);
    let bStart = actualOffsetMins;

    for (let i = 0; i < divisor; i++) {
      pilotBlocks[i % pilotCount].push({ start: bStart, duration: rounded5 });
      bStart += rounded5;

      if (i < divisor - 1) {
        currentMins += rounded5;
        currentMins = Math.ceil(currentMins / 5) * 5;
        shifts.push(formatTimeWithWrap(currentMins));
      }
    }

    currentMins += rounded5;
    let lastEndMins = currentMins;
    let buffer = restableMins - totalActualMins;

    return {
      isCustom: false,
      mins: rounded5,
      text: h + ':' + String(m).padStart(2, '0'),
      shifts,
      startTime: formatTimeWithWrap(startTimeMins),
      totalActual: th + ':' + String(tm).padStart(2, '0'),
      totalActualMins,
      lastEnd: formatTimeWithWrap(lastEndMins),
      buffer,
      pilotBlocks
    };
  };

  const calcCustomRest6Div3Plt = (firstHalf) => {
    if (restableMins <= 0) return { isCustom: true, r_first: 0, r_second: 0, text: '0:00', shifts: [], startTime: '00:00', totalActual: '0:00', totalActualMins: 0, lastEnd: '00:00', buffer: 0, pilotBlocks: [[], [], []] };

    const eqRaw = restableMins / 6;
    const eqRounded5 = Math.floor(eqRaw / 5) * 5;

    let r_first = firstHalf > 0 ? firstHalf : eqRounded5;
    let remainingForSecondHalf = restableMins - (r_first * 3);
    let r_second = Math.floor((remainingForSecondHalf / 3) / 5) * 5;

    if (r_second < 0) {
      r_second = 0;
      r_first = Math.floor((restableMins / 3) / 5) * 5;
    }

    const durations = [r_first, r_first, r_first, r_second, r_second, r_second];

    const shifts = [];
    let currentMins = startTimeMins;

    const pilotBlocks = [[], [], []];
    let bStart = actualOffsetMins;

    for (let i = 0; i < durations.length; i++) {
      pilotBlocks[i % 3].push({ start: bStart, duration: durations[i] });
      bStart += durations[i];

      if (i < durations.length - 1) {
        currentMins += durations[i];
        currentMins = Math.ceil(currentMins / 5) * 5;
        shifts.push(formatTimeWithWrap(currentMins));
      }
    }

    currentMins += durations[durations.length - 1];
    let lastEndMins = currentMins;

    const totalActualMins = durations.reduce((a, b) => a + b, 0);
    let buffer = restableMins - totalActualMins;

    const th = Math.floor(totalActualMins / 60);
    const tm = totalActualMins % 60;

    return {
      isCustom: true,
      r_first,
      r_second,
      text: Math.floor(r_first / 60) + ':' + String(r_first % 60).padStart(2, '0'),
      shifts,
      startTime: formatTimeWithWrap(startTimeMins),
      totalActual: th + ':' + String(tm).padStart(2, '0'),
      totalActualMins,
      lastEnd: formatTimeWithWrap(lastEndMins),
      buffer,
      pilotBlocks
    };
  };

  const calcCustomRest = (divisor, firstMins, lastMins, targetTotalMins = null) => {
    if (restableMins <= 0) return { isCustom: true, p1Text: '0:00', p2Text: '0:00', shifts: [], startTime: '00:00', totalActual: '0:00', totalActualMins: 0, lastEnd: '00:00', buffer: 0, pilotBlocks: [] };

    const halfTotal = targetTotalMins !== null ? targetTotalMins / 2 : restableMins / 2;
    let durations = [];
    let r_first = firstMins;
    let r_last = lastMins;
    let r_p1mid = 0;
    let r_p2 = 0;

    const toHMM = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');

    if (divisor === 5) {
      const p1Mid = Math.max(0, halfTotal - firstMins - lastMins);
      const p2Each = halfTotal / 2;
      r_p1mid = Math.floor(p1Mid / 5) * 5;
      r_p2 = Math.floor(p2Each / 5) * 5;
      durations = [r_first, r_p2, r_p1mid, r_p2, r_last];
    } else if (divisor === 7) {
      const p1MidEach = Math.max(0, halfTotal - firstMins - lastMins) / 2;
      const p2Each = halfTotal / 3;
      r_p1mid = Math.floor(p1MidEach / 5) * 5;
      r_p2 = Math.floor(p2Each / 5) * 5;
      durations = [r_first, r_p2, r_p1mid, r_p2, r_p1mid, r_p2, r_last];
    }

    const shifts = [];
    let currentMins = startTimeMins;

    const pilotBlocks = [[], []];
    let bStart = actualOffsetMins;

    for (let i = 0; i < durations.length; i++) {
      pilotBlocks[i % 2].push({ start: bStart, duration: durations[i] });
      bStart += durations[i];

      if (i < durations.length - 1) {
        currentMins += durations[i];
        currentMins = Math.ceil(currentMins / 5) * 5;
        shifts.push(formatTimeWithWrap(currentMins));
      }
    }

    currentMins += durations[durations.length - 1];
    let lastEndMins = currentMins;

    const totalActualMins = durations.reduce((a, b) => a + b, 0);
    let buffer = restableMins - totalActualMins;

    const th = Math.floor(totalActualMins / 60);
    const tm = totalActualMins % 60;

    let p1Text = '';
    let p2Text = '';
    if (divisor === 5) {
      p1Text = toHMM(r_first) + ' / ' + toHMM(r_p1mid) + ' / ' + toHMM(r_last);
      p2Text = toHMM(r_p2) + ' (x2)';
    } else {
      p1Text = toHMM(r_first) + ' / ' + toHMM(r_p1mid) + '(x2) / ' + toHMM(r_last);
      p2Text = toHMM(r_p2) + ' (x3)';
    }

    return {
      isCustom: true,
      p1Text, p2Text, shifts,
      startTime: formatTimeWithWrap(startTimeMins),
      totalActual: th + ':' + String(tm).padStart(2, '0'),
      totalActualMins,
      lastEnd: formatTimeWithWrap(lastEndMins),
      buffer,
      pilotBlocks
    };
  };

  const rest3 = calcRest(3, 3);
  const rest4 = calcRest(4, 2);
  const rest5 = calcCustomRest(5, firstRestMins, lastRestMins, rest4.totalActualMins);

  const rest6 = crewSize === 3 ? calcCustomRest6Div3Plt(firstHalfMins) : calcRest(6, 2);
  const rest7 = calcCustomRest(7, firstRestMins, lastRestMins, rest6.totalActualMins);

  const TimelineGraphic = ({ title, restA, restB, cSize, chartTotal, arrivalTime }) => {
    if (!chartTotal || chartTotal <= 0) return null;

    const rows = [];
    if (cSize === 4 && restB) {
      rows.push({ label: 'PIC', blocks: restA.pilotBlocks[1] });
      rows.push({ label: 'CAPM', blocks: restA.pilotBlocks[0] });
      rows.push({ label: 'COP1', blocks: restB.pilotBlocks[1] });
      rows.push({ label: 'COP2', blocks: restB.pilotBlocks[0] });
    } else if (cSize === 3) {
      rows.push({ label: 'PIC', blocks: restA.pilotBlocks[1] });
      rows.push({ label: 'CAPM', blocks: restA.pilotBlocks[2] });
      rows.push({ label: 'COP', blocks: restA.pilotBlocks[0] });
    }

    const actualChartTotal = Math.max(chartTotal, 1);
    const markers = new Set([0, actualChartTotal, actualOffsetMins]);
    rows.forEach(r => r.blocks.forEach(b => {
      markers.add(b.start);
      markers.add(b.start + b.duration);
    }));
    const sortedMarkers = Array.from(markers).sort((a, b) => a - b);

    let lastTopM = -9999;
    let lastBottomM = -9999;
    const minDiff = actualChartTotal * 0.08;

    const markerPositions = sortedMarkers.map((m, index) => {
      let isTop = true;
      if (m - lastTopM < minDiff) {
        isTop = false;
      } else if (m - lastBottomM < minDiff) {
        isTop = true;
      } else {
        isTop = index % 2 === 0;
      }

      if (isTop) lastTopM = m;
      else lastBottomM = m;

      return { m, isTop };
    });

    return (
      <div className="w-full bg-slate-900/50 rounded-xl p-2 lg:p-2.5 border border-slate-700/50 shadow-inner flex flex-col h-full justify-center">
        <div className="flex items-center justify-between mb-1 shrink-0">
          {title && (
            <div className="flex items-center gap-1.5">
              <SafeIcon name="CalendarClock" className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{title}</span>
            </div>
          )}
          {arrivalTime && (
            <div className="flex items-center gap-2 bg-sky-900/30 px-2 py-1 rounded-lg border border-sky-500/40 shadow-sm ml-auto">
              <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1"><SafeIcon name="PlaneLanding" className="w-2.5 h-2.5" /> EST ARRIVAL</span>
              <span className="font-mono text-sm font-black text-white leading-none">{arrivalTime}</span>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col pr-2 pb-1 lg:pr-3 lg:pb-1 mt-1">
          <div className="flex w-full relative">
            <div className="w-[40px] lg:w-[46px] shrink-0"></div>

            <div className="flex-1 relative mt-8 lg:mt-9">

              <div className="absolute top-[-32px] lg:top-[-36px] left-0 w-full h-[32px] lg:h-[36px]">
                {markerPositions.map(({ m, isTop }) => {
                  const yClass = isTop ? 'top-[-6px] lg:top-[-8px]' : 'top-[10px] lg:top-[12px]';
                  const timeStr = formatTimeWithWrap(takeoffTotalMins + m);
                  const isTakeoff = m === 0;
                  const isLanding = Math.abs(m - actualChartTotal) < 1;

                  return (
                    <div key={m} className={`absolute ${yClass} flex flex-col items-center -translate-x-1/2 z-20`} style={{ left: `${(m / actualChartTotal) * 100}%` }}>
                      <div className={`bg-slate-800 border ${isTakeoff ? 'border-amber-500/50' : isLanding ? 'border-sky-500/50' : 'border-slate-500'} px-1 py-0.5 rounded shadow-lg flex items-center justify-center min-w-[32px]`}>
                        <span className={`text-[9px] font-mono font-black ${isTakeoff ? 'text-amber-300' : isLanding ? 'text-sky-300' : 'text-slate-200'}`}>{timeStr}</span>
                      </div>
                      <div className={`w-px bg-slate-400 ${isTop ? 'h-[16px] lg:h-[20px]' : 'h-[2px]'} mt-0.5`}></div>
                    </div>
                  );
                })}
              </div>

              <div className="absolute inset-0 pointer-events-none z-0">
                {sortedMarkers.map(m => (
                  <div key={m} className="absolute top-0 h-full border-l border-slate-500/40" style={{ left: `${(m / actualChartTotal) * 100}%` }}></div>
                ))}
              </div>

              <div className="flex flex-col border-t border-l border-slate-500 relative z-10 w-full shadow-xl rounded-br-lg">
                {rows.map((row, idx) => (
                  <div key={idx} className="flex h-8 lg:h-9 bg-slate-700/30 border-b border-r border-slate-500 relative w-full box-border">

                    <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(0,0,0,0.15)_4px,rgba(0,0,0,0.15)_8px)] pointer-events-none z-0"></div>

                    <div className="absolute -left-[40px] lg:-left-[46px] top-0 h-full w-[40px] lg:w-[46px] bg-slate-800 border-b border-slate-600 flex items-center justify-center shadow-md z-20 rounded-l-lg border-l border-slate-600">
                      <span className="text-[9px] lg:text-[10px] font-black tracking-widest text-slate-300">{row.label}</span>
                    </div>

                    <div className="relative w-full h-full z-10">
                      {actualOffsetMins > 0 && (
                        <div className="absolute top-0 h-full flex items-center justify-center border-r border-slate-500/30 overflow-hidden" style={{ left: 0, width: `${(actualOffsetMins / actualChartTotal) * 100}%` }}>
                          <span className="text-[7px] font-black tracking-widest text-slate-400 opacity-60">AWAKE</span>
                        </div>
                      )}

                      {row.blocks.map((b, bIdx) => {
                        const h = Math.floor(b.duration / 60);
                        const m = b.duration % 60;
                        const timeText = h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}m`;

                        return (
                          <div key={bIdx}
                            className="absolute top-0 h-full bg-slate-100 border-l border-r border-slate-400 flex items-center justify-center shadow-md z-10 overflow-hidden"
                            style={{ left: `${(b.start / actualChartTotal) * 100}%`, width: `${(b.duration / actualChartTotal) * 100}%` }}>

                            <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)] pointer-events-none"></div>

                            <span className="text-[10px] lg:text-[12px] font-mono font-black text-slate-800 z-10 px-0.5 lg:px-1 truncate drop-shadow-sm">
                              {timeText}
                            </span>
                          </div>
                        )
                      })}

                      {landingOffsetMins > 0 && (
                        <div className="absolute top-0 h-full flex items-center justify-center border-l border-slate-500/30 overflow-hidden" style={{ right: 0, width: `${(landingOffsetMins / actualChartTotal) * 100}%` }}>
                          <span className="text-[7px] font-black tracking-widest text-slate-400 opacity-60">AWAKE</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ShiftSummaryCard = ({ title, rest, color, border, bgIcon }) => (
    <div className={`bg-slate-800/90 rounded-xl border-l-[3px] ${border} shadow-lg relative group p-2 lg:p-2.5 overflow-hidden flex flex-col h-full justify-center`}>
      <SafeIcon name={bgIcon} className={`absolute right-0 bottom-0 w-24 h-24 opacity-5 ${color} pointer-events-none -translate-x-1/4 translate-y-1/4`} />

      <div className="flex items-center gap-1.5 mb-1 z-10">
        <SafeIcon name="PieChart" className={`w-3.5 h-3.5 ${color}`} />
        <span className={`${color} font-black uppercase tracking-widest text-[10px]`}>{title}</span>
      </div>

      <div className="z-10 flex flex-col gap-1">
        <div className="flex flex-col gap-1 w-full mt-0.5">
          <div className="flex justify-between items-center bg-slate-800 border border-slate-600 shadow-inner px-2 py-1 rounded">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><SafeIcon name="Clock" className="w-2.5 h-2.5" />Total Rest</span>
            <span className="text-[12px] font-mono font-black text-white">{rest.totalActual}</span>
          </div>
          <div className={`flex justify-between items-center px-2 py-1 rounded border shadow-inner ${rest.buffer < 0 ? 'bg-rose-900/30 border-rose-500/50' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
            <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${rest.buffer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}><SafeIcon name="Timer" className="w-2.5 h-2.5" />Margin</span>
            <span className={`text-[12px] font-mono font-black ${rest.buffer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {rest.buffer >= 0 ? '+' : ''}{rest.buffer}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const CombinedShiftSummaryCard = ({ title1, title2, rest, color1, color2, border, bgIcon }) => (
    <div className={`bg-slate-800/90 rounded-xl border-l-[3px] ${border} shadow-lg relative group p-2 lg:p-2.5 overflow-hidden flex flex-col h-full justify-center`}>
      <SafeIcon name={bgIcon} className={`absolute right-0 bottom-0 w-24 h-24 opacity-5 ${color1} pointer-events-none -translate-x-1/4 translate-y-1/4`} />

      <div className="flex flex-col gap-1 mb-1.5 z-10">
        <div className="flex items-center gap-1.5">
          <SafeIcon name="PieChart" className={`w-3.5 h-3.5 ${color1}`} />
          <span className={`${color1} font-black uppercase tracking-widest text-[10px]`}>{title1}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <SafeIcon name="PieChart" className={`w-3.5 h-3.5 ${color2}`} />
          <span className={`${color2} font-black uppercase tracking-widest text-[10px]`}>{title2}</span>
        </div>
      </div>

      <div className="z-10 flex flex-col gap-1">
        <div className="flex flex-col gap-1 w-full mt-0.5">
          <div className="flex justify-between items-center bg-slate-800 border border-slate-600 shadow-inner px-2 py-1 rounded">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><SafeIcon name="Clock" className="w-2.5 h-2.5" />Total Rest</span>
            <span className="text-[12px] font-mono font-black text-white">{rest.totalActual}</span>
          </div>
          <div className={`flex justify-between items-center px-2 py-1 rounded border shadow-inner ${rest.buffer < 0 ? 'bg-rose-900/30 border-rose-500/50' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
            <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${rest.buffer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}><SafeIcon name="Timer" className="w-2.5 h-2.5" />Margin</span>
            <span className={`text-[12px] font-mono font-black ${rest.buffer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {rest.buffer >= 0 ? '+' : ''}{rest.buffer}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center h-full w-full bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-700 mt-0.5 animate-in fade-in duration-300 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>

      <div className="flex items-center justify-between w-full p-2 border-b border-slate-700/50 bg-slate-900/30 shrink-0">
        <div className="flex items-center gap-2 px-2">
          <SafeIcon name="Coffee" className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-black uppercase tracking-widest text-amber-100">Rest Calculator</h2>
        </div>
      </div>

      <div className="flex-1 w-full p-1.5 lg:p-2 flex flex-col gap-2 lg:gap-3 max-w-[1200px] mx-auto overflow-y-auto custom-scrollbar">

        <div className="bg-slate-900/60 p-1.5 lg:p-2 rounded-2xl border border-slate-600 shadow-inner flex flex-col xl:flex-row items-center justify-between gap-2 w-full z-20 relative shrink-0">

          <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 w-full">

            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-600 shadow-inner relative overflow-hidden shrink-0">
              <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg transition-transform duration-300 ease-out shadow-md transform ${crewSize === 4 ? 'translate-x-full' : 'translate-x-0'}`}></div>
              <button onClick={() => setCrewSize(3)} className={`w-[70px] py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors relative z-10 flex items-center justify-center gap-1 ${crewSize === 3 ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                <SafeIcon name="Users" className="w-3 h-3" /> 3 PLT
              </button>
              <button onClick={() => setCrewSize(4)} className={`w-[70px] py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors relative z-10 flex items-center justify-center gap-1 ${crewSize === 4 ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                <SafeIcon name="Users" className="w-3 h-3" /> 4 PLT
              </button>
            </div>

            <div className="hidden lg:block w-px h-8 bg-slate-700 shadow-md shrink-0"></div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-amber-400 font-black uppercase tracking-widest mb-0.5">FLT TIME</span>
                <div className="flex items-center gap-1">
                  <select value={flightHours} onChange={(e) => setFlightHours(Number(e.target.value))} className="bg-slate-800 border border-slate-500 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[46px] py-0.5 appearance-none outline-none focus:border-amber-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 15 - 1 + 1 }, (_, i) => 1 + i).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 font-bold">H</span>
                  <select value={flightMins} onChange={(e) => setFlightMins(Number(e.target.value))} className="bg-slate-800 border border-slate-500 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[46px] py-0.5 appearance-none outline-none focus:border-amber-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 font-bold">M</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-px h-8 bg-slate-700 shadow-md shrink-0"></div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-sky-400 font-black uppercase tracking-widest mb-0.5">STD (LCL/Z)</span>
                <div className="flex items-center gap-1">
                  <select value={stdHours} onChange={(e) => { setStdHours(Number(e.target.value)); setIsTakeoffAuto(true); }} className="bg-slate-800 border border-slate-500 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[46px] py-0.5 appearance-none outline-none focus:border-sky-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>)}
                  </select>
                  <span className="text-lg text-slate-500 font-black leading-none mb-1">:</span>
                  <select value={stdMins} onChange={(e) => { setStdMins(Number(e.target.value)); setIsTakeoffAuto(true); }} className="bg-slate-800 border border-slate-500 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[46px] py-0.5 appearance-none outline-none focus:border-sky-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                  </select>
                </div>
              </div>

              <div className="w-px h-6 bg-sky-500/30"></div>

              <div className="flex flex-col items-center relative">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[8px] text-sky-400 font-black uppercase tracking-widest">T/O TIME</span>
                  <button onClick={() => setIsTakeoffAuto(!isTakeoffAuto)} className={`px-1 rounded-[2px] text-[6px] font-black tracking-widest ${isTakeoffAuto ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'} transition-colors`}>
                    {isTakeoffAuto ? `+${taxiOutMins} AUTO` : 'MANUAL'}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <select value={takeoffHours} onChange={(e) => { setTakeoffHours(Number(e.target.value)); setIsTakeoffAuto(false); }} className={`bg-slate-800 border ${isTakeoffAuto ? 'border-sky-500/50 text-sky-200' : 'border-slate-500 text-white'} rounded-lg text-center text-base lg:text-lg font-mono font-black w-[46px] py-0.5 appearance-none outline-none focus:border-sky-400 cursor-pointer shadow-inner transition-colors`} style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>)}
                  </select>
                  <span className="text-lg text-slate-500 font-black leading-none mb-1">:</span>
                  <select value={takeoffMins} onChange={(e) => { setTakeoffMins(Number(e.target.value)); setIsTakeoffAuto(false); }} className={`bg-slate-800 border ${isTakeoffAuto ? 'border-sky-500/50 text-sky-200' : 'border-slate-500 text-white'} rounded-lg text-center text-base lg:text-lg font-mono font-black w-[46px] py-0.5 appearance-none outline-none focus:border-sky-400 cursor-pointer shadow-inner transition-colors`} style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="hidden xl:block w-px h-8 bg-slate-700 shadow-md shrink-0"></div>

            <div className="flex items-center gap-3 px-3 py-1 bg-pink-950/20 rounded-xl border border-pink-500/30 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-pink-400 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="Clock" className="w-2.5 h-2.5" />DELAY AFTER T/O</span>
                <div className="flex items-center gap-1">
                  <select value={offsetMins} onChange={(e) => setOffsetMins(Number(e.target.value))} className="bg-slate-800 border border-pink-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[54px] py-0.5 appearance-none outline-none focus:border-pink-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 font-bold">M</span>
                </div>
              </div>
              <div className="w-px h-6 bg-pink-500/30"></div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-pink-400 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="Clock" className="w-2.5 h-2.5" />AWAKE PRIOR L/D</span>
                <div className="flex items-center gap-1">
                  <select value={landingOffsetMins} onChange={(e) => setLandingOffsetMins(Number(e.target.value))} className="bg-slate-800 border border-pink-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[54px] py-0.5 appearance-none outline-none focus:border-pink-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 font-bold">M</span>
                </div>
              </div>
            </div>

            <div className={`flex items-center transition-opacity duration-300 ${(crewSize === 4 || crewSize === 3) ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'}`}>
              <div className={`hidden lg:block w-px h-8 border-r shrink-0 mr-3 lg:mr-4 ${crewSize === 4 ? 'bg-indigo-500/50 border-indigo-900/50' : 'bg-emerald-500/50 border-emerald-900/50'}`}></div>

              {crewSize === 4 ? (
                <div className="flex items-center gap-3 px-3 py-1 bg-indigo-950/40 rounded-xl border border-indigo-500/30 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-indigo-300 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="BedDouble" className="w-2.5 h-2.5" />1ST REST</span>
                    <div className="flex items-center gap-1">
                      <select value={firstRestMins} onChange={(e) => setFirstRestMins(Number(e.target.value))} className="bg-slate-800 border border-indigo-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[54px] py-0.5 appearance-none outline-none focus:border-indigo-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                        {[...Array(13).keys()].map(i => (i + 12) * 5).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <span className="text-[10px] text-slate-400 font-bold">M</span>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-indigo-500/30"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-indigo-300 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="BedDouble" className="w-2.5 h-2.5" />LAST REST</span>
                    <div className="flex items-center gap-1">
                      <select value={lastRestMins} onChange={(e) => setLastRestMins(Number(e.target.value))} className="bg-slate-800 border border-indigo-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[54px] py-0.5 appearance-none outline-none focus:border-indigo-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                        {[...Array(13).keys()].map(i => (i + 12) * 5).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <span className="text-[10px] text-slate-400 font-bold">M</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-1 bg-emerald-950/40 rounded-xl border border-emerald-500/30 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-emerald-300 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="BedDouble" className="w-2.5 h-2.5" />1ST HALF</span>
                    <div className="flex items-center gap-1">
                      <select value={firstHalfMins} onChange={(e) => setFirstHalfMins(Number(e.target.value))} className="bg-slate-800 border border-emerald-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[64px] py-0.5 appearance-none outline-none focus:border-emerald-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                        <option value={0}>AUTO</option>
                        {[...Array(37).keys()].map(i => (i + 12) * 5).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <span className="text-[10px] text-slate-400 font-bold">M</span>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-emerald-500/30"></div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8.5px] text-emerald-200/80 font-black tracking-widest leading-tight">
                      前半の休憩時間を<br />手動で指定します
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-2">
          {crewSize === 3 && (
            <>
              <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-600/50 relative mt-1 shadow-inner">
                <div className="absolute -top-3 left-4 bg-slate-900 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded border border-slate-600 shadow-md tracking-widest flex items-center gap-1 z-20">
                  <SafeIcon name="Layers" className="w-2.5 h-2.5 text-emerald-400" /> 6 DIVISIONS
                </div>
                <div className="flex flex-col lg:flex-row gap-2 items-stretch mt-1.5">
                  <div className="w-full lg:w-[200px] xl:w-[240px] shrink-0 flex flex-col gap-2">
                    <ShiftSummaryCard title="6 Divisions" rest={rest6} color="text-emerald-400" border="border-emerald-500" bgIcon="BatteryFull" />

                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-2 shadow-inner">
                      <div className="flex items-center gap-1 mb-1.5">
                        <SafeIcon name="Calculator" className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] font-black text-emerald-100 tracking-widest">6分割の概算式</span>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-emerald-300 leading-tight bg-slate-900/60 px-1.5 py-1 rounded border border-slate-700/80 mb-1.5 text-center">
                        FLT(h) × 10 = REST(m)
                      </div>
                      <div className="text-[8.5px] lg:text-[9px] text-slate-300 leading-relaxed font-medium">
                        ex)<br />
                        8h00m ⇒ 8×10 = 80m <span className="text-slate-400">(1h20m)</span><br />
                        FLT(m)の端数は ÷6 で分割して足す
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <TimelineGraphic title="Timeline Schedule" restA={rest6} cSize={3} chartTotal={Math.max(totalMins, actualOffsetMins + rest6.totalActualMins + landingOffsetMins)} arrivalTime={arrivalTimeFormatted} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-600/50 relative mt-2 shadow-inner">
                <div className="absolute -top-3 left-4 bg-slate-900 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded border border-slate-600 shadow-md tracking-widest flex items-center gap-1 z-20">
                  <SafeIcon name="Layers" className="w-2.5 h-2.5 text-sky-400" /> 3 DIVISIONS
                </div>
                <div className="flex flex-col lg:flex-row gap-2 items-stretch mt-1.5">
                  <div className="w-full lg:w-[200px] xl:w-[240px] shrink-0 flex flex-col gap-2">
                    <ShiftSummaryCard title="3 Divisions" rest={rest3} color="text-sky-400" border="border-sky-500" bgIcon="BatteryMedium" />

                    <div className="bg-sky-900/10 border border-sky-500/20 rounded-xl p-2 shadow-inner">
                      <div className="flex items-center gap-1 mb-1.5">
                        <SafeIcon name="Calculator" className="w-3 h-3 text-sky-400" />
                        <span className="text-[9px] font-black text-sky-100 tracking-widest">3分割の概算式</span>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-sky-300 leading-tight bg-slate-900/60 px-1.5 py-1 rounded border border-slate-700/80 mb-1.5 text-center">
                        FLT(h) × 20 = REST(m)
                      </div>
                      <div className="text-[8.5px] lg:text-[9px] text-slate-300 leading-relaxed font-medium">
                        ex)<br />
                        8h00m → 8×20 = 160m <span className="text-slate-400">(2h40m)</span><br />
                        FLT(m)の端数は ÷3 で分割して足す
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <TimelineGraphic title="Timeline Schedule" restA={rest3} cSize={3} chartTotal={Math.max(totalMins, actualOffsetMins + rest3.totalActualMins + landingOffsetMins)} arrivalTime={arrivalTimeFormatted} />
                  </div>
                </div>
              </div>
            </>
          )}
          {crewSize === 4 && (
            <>
              <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-600/50 relative mt-1 shadow-inner">
                <div className="absolute -top-3 left-4 bg-slate-900 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded border border-slate-600 shadow-md tracking-widest flex items-center gap-1 z-20">
                  <SafeIcon name="Layers" className="w-2.5 h-2.5 text-indigo-400" /> SET 1
                </div>

                <div className="flex flex-col lg:flex-row gap-2 items-stretch mt-1.5">
                  <div className="w-full lg:w-[200px] xl:w-[240px] shrink-0">
                    <CombinedShiftSummaryCard
                      title1="5 Divisions" color1="text-indigo-400"
                      title2="4 Divisions" color2="text-sky-400"
                      rest={rest4}
                      border="border-indigo-500"
                      bgIcon="BatteryMedium"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <TimelineGraphic title="Timeline Schedule" restA={rest5} restB={rest4} cSize={4} chartTotal={Math.max(totalMins, actualOffsetMins + rest5.totalActualMins + landingOffsetMins, actualOffsetMins + rest4.totalActualMins + landingOffsetMins)} arrivalTime={arrivalTimeFormatted} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-600/50 relative mt-2 shadow-inner">
                <div className="absolute -top-3 left-4 bg-slate-900 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded border border-slate-600 shadow-md tracking-widest flex items-center gap-1 z-20">
                  <SafeIcon name="Layers" className="w-2.5 h-2.5 text-purple-400" /> SET 2
                </div>

                <div className="flex flex-col lg:flex-row gap-2 items-stretch mt-1.5">
                  <div className="w-full lg:w-[200px] xl:w-[240px] shrink-0">
                    <CombinedShiftSummaryCard
                      title1="7 Divisions" color1="text-purple-400"
                      title2="6 Divisions" color2="text-emerald-400"
                      rest={rest6}
                      border="border-purple-500"
                      bgIcon="BatteryFull"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <TimelineGraphic title="Timeline Schedule" restA={rest7} restB={rest6} cSize={4} chartTotal={Math.max(totalMins, actualOffsetMins + rest7.totalActualMins + landingOffsetMins, actualOffsetMins + rest6.totalActualMins + landingOffsetMins)} arrivalTime={arrivalTimeFormatted} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};