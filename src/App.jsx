import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

import { RAW_CSV_DATA, aircraftRegistrationList, BUDDYCOM_LINKS } from './data/flightData';
import { aircraftPerformanceData, defaultCruiseWeights, defaultLandingWeights, modelKeyMap, AIRCRAFT_DIMENSIONS, SEAT_DATA, CRUISE_PERF_DATA, VREF_DATA, HOLD_SPD_DATA_RAW, MANEUVER_1_3G_MACH_DATA, TARGET_PITCH_N1_DATA_RAW, LANDING_DIST_DATA_RAW, B777_WIND_LIMITS, MAX_MAN_DATA } from './data/perfData';
import { DG_DATA, ISOLATION_COLS_FINAL, ISOLATION_MATRIX_FINAL, ERG_DRILLS_FINAL, ERG_LETTERS_LEFT_FINAL, ERG_LETTERS_RIGHT_FINAL, SPECIAL_PAX_DATA } from './data/docsData';
import { formatNum, formatWeightDisplay, parseWeightInput, interpolateObjArray, interpolateDirectArray, kiasToMach, getHoldSpeed, getManeuverMach, calculateTAS, calculateHeadingAndGS, generateTurnPoints, calculateWindComponentRow } from './utils/flightCalc';
import { SafeIcon, DepTag, copyToClipboard, WifiButton, WifiPwdModal, DrmModal, PasteModal, SmartCatModal, Toast, SliderInput, TrafficPatternGraphic, CirclingPatternGraphic } from './components/SharedComponents';
import { DashboardView } from './components/DashboardView';
import { WxMnmReference } from './components/WxMnmReference';
import { EtopsView } from './components/EtopsView';
import { Docs2View } from './components/Docs2View';
import { RestView } from './components/RestView';
import { BuddyCommView } from './components/BuddyCommView';
import { FltInfoView } from './components/FltInfoView';
import { ApproachCalcView } from './components/ApproachCalcView';
import { XwindView } from './components/XwindView';
// ==========================================
// 📖 目次 (TABLE OF CONTENTS)   
// ==========================================
// [1] SETTINGS & IMPORTS
// [2] COMMON & UI COMPONENTS
//     [2-1] SafeIcon
//     [2-2] DepTag
//     [2-3] copyToClipboard, WifiButton & WifiPwdModal
//     [2-4] DrmModal
//     [2-5] parseFlightPlanText & PasteModal
//     [2-6] SmartCatModal
//     [2-7] Toast
//     [2-8] SliderInput (APP CALC)
//     [2-9] Graphic Components (APP CALC)
//           - TrafficPatternGraphic
//           - CirclingPatternGraphic
// [3] DATA SECTION
//     [3-1] FLIGHT DATA (RAW_CSV_DATA)
//     [3-2] AIRCRAFT & REGISTRATION
//     [3-3] LINKS (BUDDYCOM_LINKS)
//     [3-4] PERFORMANCE & WEIGHT DATA
//     [3-5] CRUISE PERF DATA
//     [3-6] VREF DATA
//     [3-7] HOLD & MANEUVER SPD DATA
//     [3-8] APPROACH & LANDING DATA
//     [3-9] WIND LIMITS
//     [3-10] DOCS: DG (DANGEROUS GOODS) DATA
//     [3-11] DOCS: ERG CODE DATA
//     [3-12] DOCS: SPECIAL PAX DATA
// [4] UTILITY FUNCTIONS
//     [4-1] Formatting & Parsing
//     [4-2] Interpolation
//     [4-3] Flight Calculation
// [5] TAB COMPONENTS
//     [5-1] WxMnmReference (WX/MNM)
//     [5-2] Docs2View (DOCS)
//     [5-3] RestView (REST CALC)
//     [5-4] BuddyCommView (BUDDY COMM)
//     [5-5] FltInfoView (FLT INFO)
//     [5-6] DashboardView (DASHBOARD)
//     [5-7] ApproachCalcView (APP CALC)
//     [5-8] XwindView (XWIND)
// [6] MAIN APP COMPONENT
// ==========================================

// ==========================================
// [6] MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const tabs = ['DASHBOARD', 'TFC INFO', 'WX/MNM', 'ETOPS', 'DOCS', 'スマカタ', 'REST CALC', 'APP CALC', 'BUDDY COMM', 'XWIND'];
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false); const [flightId, setFlightId] = useState(""); const [isWifiModalOpen, setIsWifiModalOpen] = useState(false); const [isDrmModalOpen, setIsDrmModalOpen] = useState(false); const [isSmartCatModalOpen, setIsSmartCatModalOpen] = useState(false);
  const [restFlightHours3, setRestFlightHours3] = useState(8); const [restFlightMins3, setRestFlightMins3] = useState(0); const [restFlightHours4, setRestFlightHours4] = useState(12); const [restFlightMins4, setRestFlightMins4] = useState(0);
  const [stdHours, setStdHours] = useState(10); const [stdMins, setStdMins] = useState(0);
  const [isTakeoffAuto, setIsTakeoffAuto] = useState(true); const [taxiOutMins, setTaxiOutMins] = useState(20); const [restTakeoffHours, setRestTakeoffHours] = useState(10); const [restTakeoffMins, setRestTakeoffMins] = useState(20);
  const [restOffsetMins, setRestOffsetMins] = useState(0); const [restLandingOffsetMins, setRestLandingOffsetMins] = useState(0); const [restCrewSize, setRestCrewSize] = useState(3); const [restFirstRestMins, setRestFirstRestMins] = useState(60); const [restLastRestMins, setRestLastRestMins] = useState(60); const [restFirstHalfMins, setRestFirstHalfMins] = useState(0);

  useEffect(() => {
    if (isTakeoffAuto) { const totalMins = stdHours * 60 + stdMins + taxiOutMins; setRestTakeoffHours(Math.floor(totalMins / 60) % 24); setRestTakeoffMins(totalMins % 60); }
  }, [stdHours, stdMins, isTakeoffAuto, taxiOutMins]);

  const [selectedDep, setSelectedDep] = useState(""); const [selectedArr, setSelectedArr] = useState(""); const [selectedFlightId, setSelectedFlightId] = useState(""); const [selectedAirlineCode, setSelectedAirlineCode] = useState(""); const [selectedAirline, setSelectedAirline] = useState(""); const [selectedCallsign, setSelectedCallsign] = useState(""); const [trafficTimeRange, setTrafficTimeRange] = useState(30); const [depTrafficMode, setDepTrafficMode] = useState("DEP"); const [arrTrafficMode, setArrTrafficMode] = useState("OFF");
  
  const [state, setState] = useState({ 
    selectedReg: "", selectedType: "777-200", isaDev: 0, cruiseAltitude: 30000, 
    landingCondition: "Normal", selectedRwyCond: "6-DRY", windComponent: 0, 
    appSpeedAdditive: 5, pressureAlt: 0, rwSlope: 0, reverserConfig: "Both", 
    factConfig: "1.00", aiConfig: "OFF", cruiseWeight: 400000, landingWeight: 400000, 
    ptowOrig: null, pldwOrig: null, toElevOrig: null, ldElevOrig: null 
  });
  
  const [cruiseWtInputText, setCruiseWtInputText] = useState(formatWeightDisplay(state.cruiseWeight)); 
  const [ldgWtInputText, setLdgWtInputText] = useState(formatWeightDisplay(state.landingWeight));

  // FPL ROUTEの読み込み
const [globalRoute, setGlobalRoute] = useState("");
const [globalDest, setGlobalDest] = useState("");

  
  useEffect(() => { setCruiseWtInputText(formatWeightDisplay(state.cruiseWeight)); }, [state.cruiseWeight]); 
  useEffect(() => { setLdgWtInputText(formatWeightDisplay(state.landingWeight)); }, [state.landingWeight]);
  
  const updateState = (key, value) => { 
    setState(prev => { 
      const next = { ...prev, [key]: value }; 
      if (key === 'landingCondition') { 
        if (value === '1 ENG INOP') {
          if (prev.ptowOrig) next.landingWeight = prev.ptowOrig;
          if (prev.toElevOrig !== null) next.pressureAlt = prev.toElevOrig;
          next.reverserConfig = 'One'; // ENG INOP時にONE REVへ自動変更
        } else if (value === 'Normal') {
          if (prev.pldwOrig) next.landingWeight = prev.pldwOrig; 
          if (prev.ldElevOrig !== null) next.pressureAlt = prev.ldElevOrig;
        }
      } 
      return next; 
    }); 
  };
  
  const handleRegChange = (reg) => { 
    const ac = typeof aircraftRegistrationList !== 'undefined' ? aircraftRegistrationList.find(a => a.reg === reg) : null; 
    if (ac) setState(prev => ({ ...prev, selectedReg: reg, selectedType: ac.type, cruiseWeight: defaultCruiseWeights[ac.type] || 400000, landingWeight: defaultLandingWeights[ac.type] || 400000, landingCondition: "Normal" })); 
    else setState(prev => ({ ...prev, selectedReg: reg })); 
  };
  
  const setAircraftType = (type) => { 
    setState(prev => ({ ...prev, selectedReg: "", selectedType: type, cruiseWeight: defaultCruiseWeights[type] || 400000, landingWeight: defaultLandingWeights[type] || 400000, landingCondition: "Normal" })); 
  };

  const handleApplyFlightPlan = (data) => {
    setState(prev => {
      const next = { ...prev };
      if (data.reg) { const ac = typeof aircraftRegistrationList !== 'undefined' ? aircraftRegistrationList.find(a => a.reg === data.reg) : null; if (ac) { next.selectedReg = data.reg; next.selectedType = ac.type; } else { next.selectedReg = data.reg; } }
      if (data.isa !== undefined) next.isaDev = data.isa;
      if (data.alt !== undefined) next.cruiseAltitude = data.alt;
      if (data.ptow !== undefined) { next.cruiseWeight = data.ptow * 1000; next.ptowOrig = data.ptow * 1000; }
      if (data.pldw !== undefined) { next.pldwOrig = data.pldw * 1000; }
      if (data.toElev !== undefined) { next.toElevOrig = Math.round(data.toElev / 100) * 100; }
      if (data.ldElev !== undefined) { next.ldElevOrig = Math.round(data.ldElev / 100) * 100; }
     
      
      if (data.ptow !== undefined || data.pldw !== undefined) { 
        if (prev.landingCondition === "1 ENG INOP" && data.ptow !== undefined) {
          next.landingWeight = data.ptow * 1000;
          if (data.toElev !== undefined) next.pressureAlt = Math.round(data.toElev / 100) * 100;
        } else if (data.pldw !== undefined) {
          next.landingWeight = data.pldw * 1000;
          if (data.ldElev !== undefined) next.pressureAlt = Math.round(data.ldElev / 100) * 100;
        }
      } else {
        if (data.ldElev !== undefined) next.pressureAlt = Math.round(data.ldElev / 100) * 100;
      }
      return next;
    });
    if (data.flightId) { setFlightId(data.flightId); setSelectedFlightId(data.flightId); setSelectedAirlineCode("NH"); setSelectedAirline("ANA"); setSelectedCallsign("ALL NIPPON"); }
    if (data.fltTimeH !== undefined) { setRestFlightHours3(data.fltTimeH); setRestFlightHours4(data.fltTimeH); setRestFlightMins3(data.fltTimeM); setRestFlightMins4(data.fltTimeM); }
    if (data.stdH !== undefined) { setStdHours(data.stdH); setStdMins(data.stdM); setIsTakeoffAuto(true); }
    if (data.avgTaxi !== undefined) setTaxiOutMins(data.avgTaxi); else setTaxiOutMins(20);
    if (data.route) { setGlobalRoute(data.route); }
    if (data.dest) { setGlobalDest(data.dest); }
    window.dispatchEvent(new CustomEvent('show-toast', { detail: 'フライトデータをパフォーマンス計算と休憩計算に反映しました！' }));
  };

  const parsedFlightData = useMemo(() => {
    if (typeof RAW_CSV_DATA === 'undefined' || !RAW_CSV_DATA) return [];
    const lines = RAW_CSV_DATA.trim().split('\n').slice(2);
    return lines.map(line => {
      const cols = line.split(','); if (cols.length < 15) return null;
      const depTimeStr = cols[10] || "0000", arrTimeStr = cols[11] || "0000";
      const depMins = parseInt(depTimeStr.substring(0, 2)) * 60 + parseInt(depTimeStr.substring(2, 4)), arrMins = parseInt(arrTimeStr.substring(0, 2)) * 60 + parseInt(arrTimeStr.substring(2, 4));
      return { id: cols[0], origin: cols[1], dest: cols[3], airlineCode: cols[5], airline: cols[6], flightNo: cols[7], equipCode: cols[8], dep: depMins, arr: arrMins, callsign: cols[13], speed: cols[14] };
    }).filter(Boolean);
  }, []);

  const availableFlights = parsedFlightData, airlineCodes = [...new Set(parsedFlightData.map(f => f.airlineCode))].sort(), airlines = [...new Set(parsedFlightData.map(f => f.airline))].sort(), callsigns = [...new Set(parsedFlightData.map(f => f.callsign))].sort(), availableDeps = [...new Set(parsedFlightData.map(f => f.origin))].sort(), availableArrs = [...new Set(parsedFlightData.map(f => f.dest))].sort();
  const currentFlightInfo = useMemo(() => { if (selectedAirlineCode && selectedFlightId) return parsedFlightData.find(f => f.airlineCode === selectedAirlineCode && f.flightNo === selectedFlightId) || null; return null; }, [parsedFlightData, selectedAirlineCode, selectedFlightId]);
  const displayFlightInfo = currentFlightInfo || { origin: selectedDep || '--', dest: selectedArr || '--', dep: null, arr: null, equipCode: state.selectedType || '--', speed: '--' };
  
  const relatedTraffic = useMemo(() => { 
    if (!displayFlightInfo || (!displayFlightInfo.origin && !displayFlightInfo.dest)) return [];
    const depPort = displayFlightInfo.origin, arrPort = displayFlightInfo.dest, depTime = displayFlightInfo.dep, arrTime = displayFlightInfo.arr; let events = [];
    parsedFlightData.forEach(f => {
      if (!f.origin || !f.dest || f.dep == null || f.arr == null) return;
      if (depPort && depPort !== '--' && depTime != null && depTrafficMode !== 'OFF') {
        if ((depTrafficMode === 'DEP' || depTrafficMode === 'ALL') && f.origin === depPort) { let diff = Math.abs(f.dep - depTime); if (diff > 720) diff = 1440 - diff; if (diff <= trafficTimeRange) events.push({ ...f, _tType: 'DEP', _tTime: f.dep, _basePort: depPort, _isCurrent: f.airlineCode === selectedAirlineCode && f.flightNo === selectedFlightId }); }
        if ((depTrafficMode === 'ARR' || depTrafficMode === 'ALL') && f.dest === depPort) { let diff = Math.abs(f.arr - depTime); if (diff > 720) diff = 1440 - diff; if (diff <= trafficTimeRange) events.push({ ...f, _tType: 'ARR', _tTime: f.arr, _basePort: depPort, _isCurrent: f.airlineCode === selectedAirlineCode && f.flightNo === selectedFlightId }); }
      }
      if (arrPort && arrPort !== '--' && arrTime != null && arrTrafficMode !== 'OFF') {
        if ((arrTrafficMode === 'DEP' || arrTrafficMode === 'ALL') && f.origin === arrPort) { let diff = Math.abs(f.dep - arrTime); if (diff > 720) diff = 1440 - diff; if (diff <= trafficTimeRange) events.push({ ...f, _tType: 'DEP', _tTime: f.dep, _basePort: arrPort, _isCurrent: f.airlineCode === selectedAirlineCode && f.flightNo === selectedFlightId }); }
        if ((arrTrafficMode === 'ARR' || arrTrafficMode === 'ALL') && f.dest === arrPort) { let diff = Math.abs(f.arr - arrTime); if (diff > 720) diff = 1440 - diff; if (diff <= trafficTimeRange) events.push({ ...f, _tType: 'ARR', _tTime: f.arr, _basePort: arrPort, _isCurrent: f.airlineCode === selectedAirlineCode && f.flightNo === selectedFlightId }); }
      }
    });
    return events.sort((a, b) => a._tTime - b._tTime); 
  }, [parsedFlightData, displayFlightInfo, depTrafficMode, arrTrafficMode, trafficTimeRange, selectedAirlineCode, selectedFlightId]);
  
  const handleAirlineSelect = (type, val) => { if (type === 'code') { setSelectedAirlineCode(val); const match = parsedFlightData.find(f => f.airlineCode === val); if (match) { setSelectedAirline(match.airline); setSelectedCallsign(match.callsign); } } else if (type === 'name') { setSelectedAirline(val); const match = parsedFlightData.find(f => f.airline === val); if (match) { setSelectedAirlineCode(match.airlineCode); setSelectedCallsign(match.callsign); } } else if (type === 'callsign') { setSelectedCallsign(val); const match = parsedFlightData.find(f => f.callsign === val); if (match) { setSelectedAirlineCode(match.airlineCode); setSelectedAirline(match.airline); } } };
  const forceANASelection = () => { handleAirlineSelect('code', 'NH'); }; const handleTrafficSelect = (t) => { setSelectedAirlineCode(t.airlineCode); setSelectedAirline(t.airline); setSelectedCallsign(t.callsign); setSelectedFlightId(t.flightNo); }; const formatTime = (mins) => { if (mins == null) return "--:--"; const h = Math.floor(mins / 60) % 24, m = mins % 60; return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; };
  const fltInfoProps = { currentFlightInfo: displayFlightInfo, selectedDep, selectedArr, formatTime, trafficTimeRange, setTrafficTimeRange, depTrafficMode, setDepTrafficMode, arrTrafficMode, setArrTrafficMode, relatedTraffic, handleAirlineSelect, setSelectedDep, setSelectedArr, setSelectedFlightId, selectedFlightId, selectedAirlineCode, selectedAirline, selectedCallsign, availableFlights, airlineCodes, airlines, callsigns, availableDeps, availableArrs, forceANASelection, handleTrafficSelect, onApplyFlightPlan: handleApplyFlightPlan };

  // ==========================================
  // [計算] 統合されたパフォーマンス計算ロジック
  // ==========================================
  const computed = useMemo(() => {
    let engineStr = "GE"; if (state.selectedType === "777-200" || state.selectedType === "777-300") { engineStr = "PW"; } const isPW = engineStr === "PW";
    const mKey = typeof modelKeyMap !== 'undefined' && modelKeyMap[state.selectedType] ? modelKeyMap[state.selectedType] : '772'; 
    const perfTable = typeof CRUISE_PERF_DATA !== 'undefined' && CRUISE_PERF_DATA[mKey] ? CRUISE_PERF_DATA[mKey] : [[150, 41000, 43100, 0, 43100, 43100, 43100]];
    const minCruiseWeight = perfTable ? perfTable[0][0] * 1000 : 150000; const maxCruiseWeight = perfTable ? perfTable[perfTable.length - 1][0] * 1000 : 350000; const clampedCruiseWeight = Math.max(minCruiseWeight, Math.min(state.cruiseWeight, maxCruiseWeight));
    
    let maxAvailableLdgWt = 800000; let landingMinWeight = 280000;
    if (mKey === "772") { maxAvailableLdgWt = 540000; landingMinWeight = 360000; } else if (mKey === "773") { maxAvailableLdgWt = 550000; landingMinWeight = 420000; } else if (mKey === "77W") { maxAvailableLdgWt = 800000; landingMinWeight = 460000; } else if (mKey === "77F") { maxAvailableLdgWt = 780000; landingMinWeight = 440000; }
    const clampedLandingWeight = Math.max(landingMinWeight, Math.min(state.landingWeight, maxAvailableLdgWt));
    
    const isEngInop = state.landingCondition === "1 ENG INOP"; const appAdd = state.appSpeedAdditive;
    const wt1000 = clampedCruiseWeight / 1000; const optAltRaw = interpolateObjArray(wt1000, perfTable, 1) || 30000; const buf13Raw = interpolateObjArray(wt1000, perfTable, 2) || 40000; const isa10Raw = interpolateObjArray(wt1000, perfTable, 4) || 41000; const isa15Raw = interpolateObjArray(wt1000, perfTable, 5) || 40000; const isa20Raw = interpolateObjArray(wt1000, perfTable, 6) || 39000;

    const optAlt = Math.round(optAltRaw); let thrustLimit;
    if (state.isaDev <= 10) thrustLimit = isa10Raw; else if (state.isaDev <= 15) thrustLimit = isa10Raw + (isa15Raw - isa10Raw) * ((state.isaDev - 10) / 5); else if (state.isaDev <= 20) thrustLimit = isa15Raw + (isa20Raw - isa15Raw) * ((state.isaDev - 15) / 5); else thrustLimit = isa20Raw + (isa20Raw - isa15Raw) * ((state.isaDev - 20) / 5);
    thrustLimit = Math.round(thrustLimit); const buf13 = Math.round(buf13Raw); const maxAlt = Math.min(buf13, thrustLimit); const limitReason = maxAlt >= 43100 ? "Structural Limit" : (thrustLimit < buf13 ? "Thrust Limit" : "Maneuver Margin");

    let mmo = (mKey === "772") ? 0.87 : 0.89, vmo = mKey === "77W" || mKey === "77F" ? Math.min(350, Math.round(330 + (state.cruiseAltitude / 30000) * 20)) : 330;
    const vref30Arr = typeof VREF_DATA !== 'undefined' ? VREF_DATA[mKey]?.vref30 : null; const vref30 = vref30Arr ? interpolateDirectArray(clampedCruiseWeight / 1000, vref30Arr.map(v => v[0]), vref30Arr.map(v => v[1])) : 140; const flapUpManeuver = vref30 ? Math.round(vref30 + 80) : "N/A";

    let holdSpdJsx = <span className="text-white">---</span>; let minSpdTypeJsx = <span><span className="text-violet-400">Flap UP HOLD</span> &lt; 20k</span>; let spdUnit = "KTS"; let minSpdBorderClass = "border-t-violet-500"; let minSpdIconClass = "text-violet-400";
    if (state.cruiseAltitude >= 20000) {
      const mMach = typeof getManeuverMach === 'function' ? getManeuverMach(mKey, clampedCruiseWeight, state.cruiseAltitude) : null;
      if (mMach) { const formattedMach = "." + Math.round(mMach * 1000).toString().padStart(3, '0'); holdSpdJsx = <span className="text-white">{formattedMach}</span>; minSpdTypeJsx = <span><span className="text-amber-400">1.3G MANEUVER</span> &ge; 20k</span>; spdUnit = "MACH"; minSpdBorderClass = "border-t-amber-500"; minSpdIconClass = "text-amber-400"; }
    } else {
      const holdSpd = typeof getHoldSpeed === 'function' ? getHoldSpeed(mKey, clampedCruiseWeight, state.cruiseAltitude) : null;
      if (holdSpd) { holdSpdJsx = <span className="text-white">{Math.round(holdSpd)}</span>; minSpdTypeJsx = <span><span className="text-violet-400">Flap UP HOLD</span> &lt; 20k</span>; spdUnit = "KTS"; minSpdBorderClass = "border-t-violet-500"; minSpdIconClass = "text-violet-400"; }
    }

    let currentN1Flap25 = null, currentPchFlap25 = null, currentN1Flap30 = null, currentPchFlap30 = null;
    if (!isEngInop && typeof TARGET_PITCH_N1_DATA_RAW !== 'undefined') { 
      const f25Data = TARGET_PITCH_N1_DATA_RAW[mKey]?.f25; const f30Data = TARGET_PITCH_N1_DATA_RAW[mKey]?.f30; const wt1000Ldg = clampedLandingWeight / 1000;
      if (f25Data && wt1000Ldg <= f25Data[f25Data.length - 1][0]) { currentPchFlap25 = interpolateObjArray(wt1000Ldg, f25Data, 1); currentN1Flap25 = interpolateObjArray(wt1000Ldg, f25Data, 2); }
      if (f30Data && wt1000Ldg <= f30Data[f30Data.length - 1][0]) { currentPchFlap30 = interpolateObjArray(wt1000Ldg, f30Data, 1); currentN1Flap30 = interpolateObjArray(wt1000Ldg, f30Data, 2); }
    }
    
    // --- AUTOBRAKE のベース処理 ---
    const scaleFactor = state.factConfig === "1.15" ? 1.0 : (1.0 / 1.15); 
    const activeFlaps = isEngInop ? ["F20", "F30"] : ["F25", "F30"];
    
    const getAomDistance = (flapTagLong, brakeMode) => {
      if (typeof LANDING_DIST_DATA_RAW === 'undefined' || !LANDING_DIST_DATA_RAW[mKey]) return null;
      const tCat = isEngInop ? (flapTagLong === "FLAP 20" ? "inop_f20" : "inop_f30") : (flapTagLong === "FLAP 25" ? "f25" : "f30");
      const dbKey = tCat + "_" + (state.selectedRwyCond === "5-WET" ? "wet" : "dry");
      const aomData = LANDING_DIST_DATA_RAW[mKey]?.[dbKey];
      if (!aomData) return null;
      
      const bIdx = { "man": 1, "max": 2, "a4": 3, "a3": 4, "a2": 5, "a1": 6 }[brakeMode] || 2;
      const wt1000Ldg = clampedLandingWeight / 1000;
      let baseDist = interpolateObjArray(wt1000Ldg, aomData.dist, bIdx);
      if (baseDist == null) return null;

      let adj = aomData.adj;
      if (adj && adj.threshold) { adj = wt1000Ldg <= adj.threshold ? adj.light : adj.heavy; }

      let correctedDist = baseDist;
      if (adj) {
        if (adj.app) correctedDist += ((state.appSpeedAdditive - 5) / 5) * adj.app;
        if (state.pressureAlt > 0 && adj.alt) correctedDist += (state.pressureAlt / 1000) * adj.alt;
        if (state.rwSlope !== 0 && adj.slp) correctedDist += state.rwSlope * adj.slp;
        if (state.windComponent !== 0 && adj.tw) { correctedDist += state.windComponent > 0 ? (state.windComponent / 5) * adj.tw : (state.windComponent / 10) * adj.tw; }
        if (state.reverserConfig === "None" && adj.nr) correctedDist += (adj.nr[bIdx - 1] || 0);
        else if (state.reverserConfig === "One" && adj.or) correctedDist += (adj.or[bIdx - 1] || 0);
      }
      return Math.round(correctedDist * scaleFactor);
    };

    const distMax1 = getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "max");
    const distMax2 = getAomDistance("FLAP 30", "max");
    const distAb41 = getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a4");
    const distAb42 = getAomDistance("FLAP 30", "a4");
    const distAb31 = getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a3");
    const distAb32 = getAomDistance("FLAP 30", "a3");
    const distAb21 = getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a2");
    const distAb22 = getAomDistance("FLAP 30", "a2");
    const distAb11 = getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a1");
    const distAb12 = getAomDistance("FLAP 30", "a1");
    
    // ベースとなるMAN距離
    let distMan1 = getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "man");
    let distMan2 = getAomDistance("FLAP 30", "man");



const acData = MAX_MAN_DATA[state.selectedType];
    if (acData) {
      const rwyCond = state.selectedRwyCond === "5-WET" ? "wet" : "dry";
      const wt1000Ldg = clampedLandingWeight / 1000;

      const calculateOverride = (flapKey, originalDist) => {
        const dbKey = flapKey + "_" + rwyCond;
        const data = acData[dbKey];
        if (!data) return originalDist; 

        let d = data.refDist;
        const baseWt = data.baseWt || 440;
        const wDiff = wt1000Ldg - baseWt;
        if (wDiff > 0) d += (wDiff / 10) * data.wt_abv;
        else if (wDiff < 0) d -= (Math.abs(wDiff) / 10) * data.wt_blw;

        const am = data.adj;
        if (state.appSpeedAdditive > 0 && am.app) d += (state.appSpeedAdditive / 5) * am.app;
        if (state.pressureAlt > 0 && am.alt) d += (state.pressureAlt / 1000) * am.alt;
        
        if (state.rwSlope > 0 && am.slp_down) d += state.rwSlope * am.slp_down;
        else if (state.rwSlope < 0 && am.slp_up) d -= Math.abs(state.rwSlope) * am.slp_up;

        if (state.windComponent > 0 && am.wind_tw) d += (state.windComponent / 10) * am.wind_tw;
        else if (state.windComponent < 0 && am.wind_hw) d -= (Math.abs(state.windComponent) / 10) * am.wind_hw;

        if (state.isaDev > 0 && am.tmp_abv) d += (state.isaDev / 10) * am.tmp_abv;
        else if (state.isaDev < 0 && am.tmp_blw) d -= (Math.abs(state.isaDev) / 10) * am.tmp_blw;

        if (state.reverserConfig === "None" && am.rev_no) d += am.rev_no;
        else if (state.reverserConfig === "One" && am.rev_one) d += am.rev_one;

        const multiplier = state.factConfig === "1.15" ? 1.15 : 1.0;
        return Math.round(d * multiplier);
      };

      const flap1Key = isEngInop ? "inop_f20" : "f25";
      const flap2Key = isEngInop ? "inop_f30" : "f30";

      // 算出されたMAX MANの距離で distMan1 と distMan2 を上書き
      distMan1 = calculateOverride(flap1Key, distMan1);
      distMan2 = calculateOverride(flap2Key, distMan2);
    }

    const washoutText = (mKey === "77W" || mKey === "77F") ? "10,000-30,000FT" : "10,000-12,000FT";
    const etops = mKey === "77F" ? "424NM" : "423NM";
    const toSetting = isPW ? "1.05EPR" : "55%N1";
    const oxy = mKey === "77F" ? "1210" : "DMS 860 / INT LONG 1050 / INT SHORT 860";
    const engOil = "ABV 18";
    const brakeTemp = isPW ? "3.0" : "2.0";
    const dgExp = "250kg(550lbs)";
    const dgIso = mKey === "77F" ? "200単位 50単位/ULD" : "32単位 8単位/ULD";
    let dgDry = "800kg"; if (mKey === "772") dgDry = "600kg"; if (mKey === "77F") dgDry = "2,300kg(LOWER 500kg)";

    return { 
      engine: engineStr, minCruiseWeight, maxCruiseWeight, clampedCruiseWeight, landingMinWeight, maxAvailableLdgWt, clampedLandingWeight, 
      optAlt, maxAlt, limitReason, vmo, mmo, flapUpManeuver, holdSpdJsx, minSpdTypeJsx, spdUnit, minSpdBorderClass, minSpdIconClass, 
      holdSpdLabelWt: Math.round(clampedCruiseWeight / 1000) + "K", holdSpdLabelAlt: formatNum(state.cruiseAltitude) + "FT", 
      windText: state.windComponent === 0 ? "0" : state.windComponent > 0 ? `T+${state.windComponent}` : `H${Math.abs(state.windComponent)}`, 
      slopeText: state.rwSlope === 0 ? "0" : state.rwSlope > 0 ? `D+${state.rwSlope}` : `U${Math.abs(state.rwSlope)}`, 
      activeFlaps, 
      n1F1: isEngInop ? "N/A" : (currentN1Flap25 !== null ? currentN1Flap25.toFixed(1) : "N/A"), 
      n1F2: isEngInop ? "N/A" : (currentN1Flap30 !== null ? currentN1Flap30.toFixed(1) : "N/A"), 
      pchF1: isEngInop ? "N/A" : (currentPchFlap25 !== null ? `P:${currentPchFlap25.toFixed(1)}` : "N/A"), 
      pchF2: isEngInop ? "N/A" : (currentPchFlap30 !== null ? `P:${currentPchFlap30.toFixed(1)}` : "N/A"), 
      distMax1, distMax2, distAb41, distAb42, distAb31, distAb32, distAb21, distAb22, distAb11, distAb12, 
      distMan1, distMan2, 
      penaltyF25: "TW+1000", penaltyF30: "TW+1000", taxiFuelRate: (mKey === "77W" || mKey === "77F") ? 72 : 57, 
      dim: typeof AIRCRAFT_DIMENSIONS !== 'undefined' ? AIRCRAFT_DIMENSIONS[mKey] : {}, 
      configText: mKey === "77F" ? "Freighter" : (typeof SEAT_DATA !== 'undefined' && SEAT_DATA[mKey] ? `${SEAT_DATA[mKey][0].classes} (Total: ${SEAT_DATA[mKey][0].total})` : "N/A"), 
      washout: washoutText, etops, toSetting, oxy, engOil, brakeTemp, dgExp, dgIso, dgDry 
    };
  }, [state]);

  return (
    <div className="min-h-screen bg-[#05070a] text-[#cbd5e1] pb-2 p-1 sm:p-2 space-y-1 font-sans flex flex-col relative overflow-hidden">
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 4px 1px rgba(52, 211, 153, 0.4); }
          50% { box-shadow: 0 0 16px 4px rgba(52, 211, 153, 0.9); }
        }
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}</style>
      <Toast />
      <PasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} onApply={handleApplyFlightPlan} />
      <WifiPwdModal isOpen={isWifiModalOpen} onClose={() => setIsWifiModalOpen(false)} />
      <DrmModal isOpen={isDrmModalOpen} onClose={() => setIsDrmModalOpen(false)} initialFlightNo={flightId} />
      <SmartCatModal isOpen={isSmartCatModalOpen} onClose={() => setIsSmartCatModalOpen(false)} />

   <div className="flex flex-col gap-1.5 w-full flex-none mb-1 px-1">
        {/* ヘッダー全体：iPhone（縦画面）の時は上下2段、iPad（横画面）の時は左右に並べる */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end pt-1 pb-1 border-b-2 border-slate-700/80 gap-1.5">
          
          {/* タイトル & 便名バッジ & バージョン */}
          <div className="flex items-center flex-wrap gap-1 text-blue-400 font-black tracking-tighter text-[11px] sm:text-sm">
            <div className="flex items-center gap-1">
              <SafeIcon name="Plane" className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span>7PT B777 PERFORMANCE TOOL</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-400 font-mono text-[9px] border border-amber-500/30 px-1 rounded bg-amber-500/10 tracking-normal font-bold">
                ver 1.7
              </span>
              {flightId && (
                <span className="text-slate-300 font-mono text-[9px] border border-slate-600 px-1 rounded bg-slate-800 tracking-normal font-bold">
                  ANA{flightId}
                </span>
              )}
            </div>
          </div>

          {/* 右側のボタン群：iPhoneの時は横幅いっぱいに広げて均等配置、iPadでは右寄せ */}
          <div className="flex items-center justify-between sm:justify-end gap-1 w-full sm:w-auto overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-1 w-full sm:w-auto">
              <WifiButton type="INT" url="http://info.ana.co.jp/" label="INT" hoverClass="hover:bg-sky-600" colorClass="text-sky-400 border-sky-500/50 text-[9px] sm:text-[10px]" onLongPress={() => setIsWifiModalOpen(true)} />
              <WifiButton type="DOM" url="http://www.ana.co.jp/wifi" label="DOM" hoverClass="hover:bg-emerald-600" colorClass="text-emerald-400 border-emerald-500/50 text-[9px] sm:text-[10px]" onLongPress={() => { }} />

              <button onClick={() => setIsPasteModalOpen(true)} className="animate-glow-pulse bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-emerald-400 flex-1 sm:flex-none" title="PDF/TXT 読込">
                <SafeIcon name="ClipboardPaste" className="w-3 h-3 pointer-events-none" />
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">LOAD</span>
              </button>

              <button onClick={() => { if (!state.selectedReg || state.selectedReg === "N/A" || state.selectedReg === "") { window.dispatchEvent(new CustomEvent('show-toast', { detail: '機番を選択してください' })); return; } const buddycomUrl = typeof BUDDYCOM_LINKS !== 'undefined' ? BUDDYCOM_LINKS[state.selectedReg] : null; if (buddycomUrl) { const pastedFlightName = flightId ? `ANA${flightId}` : ""; if (pastedFlightName) { copyToClipboard(pastedFlightName); window.dispatchEvent(new CustomEvent('show-toast', { detail: `便名(${pastedFlightName})をコピーして起動しました` })); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Buddycomを起動しました' })); } setTimeout(() => { window.open(buddycomUrl, '_blank'); }, 1000); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'この機番のBuddycomリンクは未登録です' })); } }} className={`px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border shadow-sm flex-1 sm:flex-none ${state.selectedReg && state.selectedReg !== "N/A" && state.selectedReg !== "" ? 'bg-slate-700 hover:bg-orange-600 text-orange-400 hover:text-white border-slate-500 hover:border-orange-400' : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}`} title="Buddycomを開く"><SafeIcon name="Radio" className="w-3 h-3 pointer-events-none" /><span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">BDYC</span></button>
              
              <button onClick={() => { let flightQuery = ""; if (flightId) { flightQuery = `NH${flightId}`; } else if (selectedFlightId && selectedFlightId !== "N/A" && selectedFlightId !== "") { if (selectedAirlineCode && selectedAirlineCode !== "N/A" && selectedAirlineCode !== "") { flightQuery = `${selectedAirlineCode}${selectedFlightId}`; } else { flightQuery = `NH${selectedFlightId}`; } } if (flightQuery) { copyToClipboard(flightQuery); window.dispatchEvent(new CustomEvent('show-toast', { detail: `便名(${flightQuery})をコピーしました。検索窓にペーストしてください` })); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'FR24アプリを起動します' })); } setTimeout(() => { window.open('https://www.flightradar24.com', '_blank'); }, 1000); }} className="bg-slate-700 hover:bg-yellow-600 text-yellow-400 hover:text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 hover:border-yellow-400 shadow-sm flex-1 sm:flex-none" title="Flight Radar 24を開く"><SafeIcon name="Radar" className="w-3 h-3 pointer-events-none" /><span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">FR24</span></button>
              {/* ★ PWA 強制アップデートボタン ★ */}
              <button 
                onClick={() => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                      for (let registration of registrations) {
                        registration.unregister();
                      }
                    });
                  }
                  window.dispatchEvent(new CustomEvent('show-toast', { detail: '最新バージョンを取得して再起動します...' }));
                  setTimeout(() => { window.location.reload(true); }, 1500);
                }}
                className="bg-slate-700 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-emerald-500 hover:border-emerald-400 shadow-sm flex-1 sm:flex-none"
                title="アプリを消さずに最新版へアップデート"
              >
                <SafeIcon name="DownloadCloud" className="w-3 h-3 pointer-events-none" />
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">UPDT</span>
              </button>
            </div>
          </div>
        </div>

       {/* タブボタン部分：iPhone（縦画面）では自動で折り返し、iPad等（横画面）では横一列に並べる */}
        <div className="flex flex-wrap sm:flex-nowrap gap-1 py-1 w-full sm:overflow-x-auto sm:hide-scrollbar">
          {tabs.map(tab => {
            if (tab === 'スマカタ') {
              return (
                <button key={tab} onClick={() => setIsSmartCatModalOpen(true)} className="px-2 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all shadow-sm bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center gap-1 flex-grow sm:flex-grow-0 min-w-[22%] sm:min-w-0">
                  <SafeIcon name="BookOpen" className="w-3 h-3" /> 
                  <span className="leading-none">スマカタ</span>
                </button>
              );
            }
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-2 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all shadow-sm flex items-center justify-center gap-1 flex-grow sm:flex-grow-0 min-w-[22%] sm:min-w-0 ${activeTab === tab ? "bg-amber-600 text-white shadow-amber-900/50 scale-[1.01]" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50"}`}>
                {tab === 'XWIND' && <SafeIcon name="Wind" className="w-3 h-3" />}
                <span className="leading-none">{tab}</span>
              </button>
            );
          })}
        </div>
      </div>

   {activeTab === 'DASHBOARD' && (
        <div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">
          {typeof DashboardView !== 'undefined' && (
            <DashboardView state={state} updateState={updateState} computed={computed} aircraftRegistrationList={typeof aircraftRegistrationList !== 'undefined' ? aircraftRegistrationList : []} handleRegChange={handleRegChange} setAircraftType={setAircraftType} cruiseWtInputText={cruiseWtInputText} setCruiseWtInputText={setCruiseWtInputText} ldgWtInputText={ldgWtInputText} setLdgWtInputText={setLdgWtInputText} />
          )}
        </div>
      )}
      {activeTab === 'TFC INFO' && (<div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">{typeof FltInfoView !== 'undefined' && <FltInfoView p={fltInfoProps} />}</div>)}
      {activeTab === 'WX/MNM' && (<div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">{typeof WxMnmReference !== 'undefined' && <WxMnmReference />}</div>)}
      {activeTab === 'ETOPS' && (<div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">{typeof EtopsView !== 'undefined' && <EtopsView globalRoute={globalRoute} globalDest={globalDest} />}</div>)} 
      {activeTab === 'DOCS' && (<div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">{typeof Docs2View !== 'undefined' && <Docs2View />}</div>)}
      {activeTab === 'REST CALC' && (<div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">
        {typeof RestView !== 'undefined' && <RestView
        flightHours={restCrewSize === 3 ? restFlightHours3 : restFlightHours4} setFlightHours={restCrewSize === 3 ? setRestFlightHours3 : setRestFlightHours4}
        flightMins={restCrewSize === 3 ? restFlightMins3 : restFlightMins4} setFlightMins={restCrewSize === 3 ? setRestFlightMins3 : setRestFlightMins4}
        stdHours={stdHours} setStdHours={setStdHours}
        stdMins={stdMins} setStdMins={setStdMins}
        isTakeoffAuto={isTakeoffAuto} setIsTakeoffAuto={setIsTakeoffAuto}
        takeoffHours={restTakeoffHours} setTakeoffHours={setRestTakeoffHours}
        takeoffMins={restTakeoffMins} setTakeoffMins={setRestTakeoffMins}
        offsetMins={restOffsetMins} setOffsetMins={setRestOffsetMins}
        landingOffsetMins={restLandingOffsetMins} setLandingOffsetMins={setRestLandingOffsetMins}
        crewSize={restCrewSize} setCrewSize={setRestCrewSize}
        firstRestMins={restFirstRestMins} setFirstRestMins={setRestFirstRestMins}
        lastRestMins={restLastRestMins} setLastRestMins={setRestLastRestMins}
        firstHalfMins={restFirstHalfMins} setFirstHalfMins={setRestFirstHalfMins}
        taxiOutMins={taxiOutMins} />}
      </div>)}
      {activeTab === 'BUDDY COMM' && (<div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">{typeof BuddyCommView !== 'undefined' && <BuddyCommView p={{ aircraftRegistrationList: typeof aircraftRegistrationList !== 'undefined' ? aircraftRegistrationList : [], selectedReg: state.selectedReg, handleRegChange }} />}</div>)}
      {activeTab === 'APP CALC' && (<div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">{typeof ApproachCalcView !== 'undefined' && <ApproachCalcView />}</div>)}
      {activeTab === 'XWIND' && (<div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden mt-0.5">{typeof XwindView !== 'undefined' && <XwindView />}</div>)}
    </div>
  );
}