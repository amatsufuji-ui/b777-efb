// App.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

// =========================================================================
// ★ アプリバージョン設定
// =========================================================================
const APP_VERSION = "8.8";
// =========================================================================

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
import { FltInfoView } from './components/FltInfoView';
import { ApproachCalcView } from './components/ApproachCalcView';
import { XwindView } from './components/XwindView';
import { QuickGuideModal } from './components/QuickGuideModal';
import { NavlogView } from './components/NavlogView';
import { TarmacView } from './components/TarmacView'; 
import { WeatherRadarView } from './components/WeatherRadarView';

const LoadDataModal = ({ isOpen, onClose, onFileClick, onPaste, isParsing }) => {
    const [text, setText] = useState("");
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 max-w-lg w-full shadow-2xl flex flex-col">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <SafeIcon name="DownloadCloud" className="w-5 h-5 text-sky-400" />
                        Load Flight Plan
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl leading-none">&times;</button>
                </div>
                
                <div className="flex flex-col gap-2">
                    <button onClick={() => { onFileClick(); onClose(); }} disabled={isParsing} className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg">
                        <SafeIcon name={isParsing ? "Loader2" : "FileText"} className={`w-5 h-5 ${isParsing ? "animate-spin" : ""}`} />
                        {isParsing ? 'Reading PDF...' : 'Upload PDF File'}
                    </button>
                </div>

                <div className="flex items-center gap-2 py-4">
                    <div className="h-px bg-slate-700 flex-1"></div>
                    <span className="text-xs text-slate-500 font-bold uppercase">OR</span>
                    <div className="h-px bg-slate-700 flex-1"></div>
                </div>

                <div className="flex flex-col gap-2">
                    <textarea 
                        value={text} 
                        onChange={e => setText(e.target.value)} 
                        className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 resize-none font-mono text-[10px] custom-scrollbar"
                        placeholder="Paste NAVLOG text here..."
                    ></textarea>
                    <button onClick={() => { onPaste(text); onClose(); setText(""); }} disabled={!text.trim()} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg">
                        <SafeIcon name="Clipboard" className="w-5 h-5" />
                        Load from Text
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const tabs = ['DASHBOARD', 'TFC INFO', 'WX/MNM', 'ETOPS', 'NAVLOG', 'WXRDR', 'DOCS', 'スマカタ', 'REST CALC', 'APP CALC', 'TARMAC', 'XWIND'];

  const [flightId, setFlightId] = useState(""); 
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false); 
  const [isDrmModalOpen, setIsDrmModalOpen] = useState(false); 
  const [isSmartCatModalOpen, setIsSmartCatModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false); 
  const [showSetupBanner, setShowSetupBanner] = useState(false);

  const pdfInputRef = useRef(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [navlogData, setNavlogData] = useState(null);

  const getSavedState = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem('appStateBackup_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[key] !== undefined) return parsed[key];
      }
    } catch(e) {}
    return defaultValue;
  };

  const [restFlightHours3, setRestFlightHours3] = useState(() => getSavedState('restFlightHours3', 8)); 
  const [restFlightMins3, setRestFlightMins3] = useState(() => getSavedState('restFlightMins3', 0)); 
  const [restFlightHours4, setRestFlightHours4] = useState(() => getSavedState('restFlightHours4', 12)); 
  const [restFlightMins4, setRestFlightMins4] = useState(() => getSavedState('restFlightMins4', 0));
  const [stdHours, setStdHours] = useState(() => getSavedState('stdHours', 10)); 
  const [stdMins, setStdMins] = useState(() => getSavedState('stdMins', 0));
  const [isTakeoffAuto, setIsTakeoffAuto] = useState(() => getSavedState('isTakeoffAuto', true)); 
  const [taxiOutMins, setTaxiOutMins] = useState(() => getSavedState('taxiOutMins', 20)); 
  const [taxiInMins, setTaxiInMins] = useState(() => getSavedState('taxiInMins', 5)); 
  const [restTakeoffHours, setRestTakeoffHours] = useState(() => getSavedState('restTakeoffHours', 10)); 
  const [restTakeoffMins, setRestTakeoffMins] = useState(() => getSavedState('restTakeoffMins', 20));
  const [restOffsetMins, setRestOffsetMins] = useState(() => getSavedState('restOffsetMins', 0)); 
  const [restLandingOffsetMins, setRestLandingOffsetMins] = useState(() => getSavedState('restLandingOffsetMins', 0)); 
  const [restCrewSize, setRestCrewSize] = useState(() => getSavedState('restCrewSize', 3)); 
  const [restFirstRestMins, setRestFirstRestMins] = useState(() => getSavedState('restFirstRestMins', 60)); 
  const [restLastRestMins, setLastRestMins] = useState(() => getSavedState('restLastRestMins', 60)); 
  const [restFirstHalfMins, setFirstHalfMins] = useState(() => getSavedState('restFirstHalfMins', 0));

  const [selectedDep, setSelectedDep] = useState(""); const [selectedArr, setSelectedArr] = useState(""); const [selectedFlightId, setSelectedFlightId] = useState(""); const [selectedAirlineCode, setSelectedAirlineCode] = useState(""); const [selectedAirline, setSelectedAirline] = useState(""); const [selectedCallsign, setSelectedCallsign] = useState(""); const [trafficTimeRange, setTrafficTimeRange] = useState(30); const [depTrafficMode, setDepTrafficMode] = useState("DEP"); const [arrTrafficMode, setArrTrafficMode] = useState("OFF");
  
  const [state, setState] = useState(() => getSavedState('state', { 
    selectedReg: "", selectedType: "777-200", isaDev: 0, cruiseAltitude: 30000, 
    landingCondition: "Normal", selectedRwyCond: "6-DRY", windComponent: 0, 
    appSpeedAdditive: 5, pressureAlt: 0, rwSlope: 0, reverserConfig: "Both", 
    factConfig: "1.00", aiConfig: "OFF", cruiseWeight: 400000, landingWeight: 400000, 
    ptowOrig: null, pldwOrig: null, toElevOrig: null, ldElevOrig: null,
    buffetMargin: "1.3G"
  }));
  
  const [cruiseWtInputText, setCruiseWtInputText] = useState(formatWeightDisplay(state.cruiseWeight)); 
  const [ldgWtInputText, setLdgWtInputText] = useState(formatWeightDisplay(state.landingWeight));

  const [globalRoute, setGlobalRoute] = useState(() => getSavedState('globalRoute', ""));
  const [globalDest, setGlobalDest] = useState(() => getSavedState('globalDest', ""));
  const [globalEtopsAltns, setGlobalEtopsAltns] = useState(() => getSavedState('globalEtopsAltns', []));
  const [globalEtopsTime, setGlobalEtopsTime] = useState(() => getSavedState('globalEtopsTime', ""));
  const [globalEtops207, setGlobalEtops207] = useState(() => getSavedState('globalEtops207', false));

  useEffect(() => {
    if (navigator.onLine && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.update().catch(err => console.log('SW update check failed:', err));
        }
      });
    }
  }, []);

  useEffect(() => {
    const isHidden = localStorage.getItem('hideSetupGuide');
    if (isHidden !== 'true') setShowSetupBanner(true);
    
    const savedApp = localStorage.getItem('appStateBackup_v4');
    if (savedApp) {
      try {
        const parsed = JSON.parse(savedApp);
        if (parsed.flightId) {
          setFlightId(parsed.flightId);
          setSelectedFlightId(parsed.flightId);
        }
        if (parsed.navlogData) {
          setNavlogData({ ...parsed.navlogData, isNew: false });
        }
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    try {
      const backup = { 
        state, flightId, navlogData,
        restFlightHours3, restFlightMins3, restFlightHours4, restFlightMins4,
        stdHours, stdMins, isTakeoffAuto, taxiOutMins, taxiInMins,
        restTakeoffHours, restTakeoffMins, restOffsetMins, restLandingOffsetMins,
        restCrewSize, restFirstRestMins, restLastRestMins, restFirstHalfMins,
        globalRoute, globalDest, globalEtopsAltns, globalEtopsTime, globalEtops207
      };
      localStorage.setItem('appStateBackup_v4', JSON.stringify(backup));
    } catch(e) {}
  });

  useEffect(() => {
    if (isTakeoffAuto) { 
        const totalMins = stdHours * 60 + stdMins + taxiOutMins; 
        setRestTakeoffHours(Math.floor(totalMins / 60) % 24); 
        setRestTakeoffMins(totalMins % 60); 
    }
  }, [stdHours, stdMins, isTakeoffAuto, taxiOutMins]);

  useEffect(() => { setCruiseWtInputText(formatWeightDisplay(state.cruiseWeight)); }, [state.cruiseWeight]); 
  useEffect(() => { setLdgWtInputText(formatWeightDisplay(state.landingWeight)); }, [state.landingWeight]);
  
  const updateState = (key, value) => { 
    setState(prev => { 
      const next = { ...prev, [key]: value }; 
      if (key === 'landingCondition') { 
        if (value === '1 ENG INOP') {
          if (prev.ptowOrig) next.landingWeight = prev.ptowOrig;
          if (prev.toElevOrig !== null) next.pressureAlt = prev.toElevOrig;
          next.reverserConfig = 'One';
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

  const handleResetAll = () => {
    if (window.confirm("全ての入力データや状態をリセットし、初期状態に戻しますか？")) {
        localStorage.removeItem('appStateBackup_v4');
        localStorage.removeItem('navlogFlightDataBackup');
        window.location.reload(true);
    }
  };

  const handleApplyFlightPlan = (data) => {
    setState(prev => {
      const next = { ...prev };
      const regToApply = data.reg || data.pReg;
      
      if (regToApply) { 
          const ac = typeof aircraftRegistrationList !== 'undefined' ? aircraftRegistrationList.find(a => a.reg === regToApply) : null; 
          if (ac) { 
              next.selectedReg = regToApply; 
              next.selectedType = ac.type; 
          } else { 
              next.selectedReg = regToApply; 
          } 
      }
      
      if (data.isa !== undefined && !isNaN(data.isa)) next.isaDev = data.isa;
      if (data.alt !== undefined) next.cruiseAltitude = data.alt;
      
      if (data.ptow !== undefined) { 
        next.cruiseWeight = data.ptow * 1000; 
        next.ptowOrig = data.ptow * 1000; 
        if (prev.landingCondition === "1 ENG INOP") {
            next.landingWeight = data.ptow * 1000;
        }
      }
      if (data.pldw !== undefined) { 
        next.pldwOrig = data.pldw * 1000; 
        if (prev.landingCondition !== "1 ENG INOP") {
            next.landingWeight = data.pldw * 1000;
        }
      }
      
      if (data.toElev !== undefined) { 
        next.toElevOrig = Math.round(data.toElev / 100) * 100; 
        if (prev.landingCondition === "1 ENG INOP") {
            next.pressureAlt = next.toElevOrig;
        }
      }
      if (data.ldElev !== undefined) { 
        next.ldElevOrig = Math.round(data.ldElev / 100) * 100; 
        if (prev.landingCondition !== "1 ENG INOP") {
            next.pressureAlt = next.ldElevOrig;
        }
      }
      return next;
    });
    
    if (data.flightId) { 
        setFlightId(data.flightId); 
        setSelectedFlightId(data.flightId); 
        setSelectedAirlineCode("NH"); 
        setSelectedAirline("ANA"); 
        setSelectedCallsign("ALL NIPPON"); 
    }
    
    if (data.depIcao) setSelectedDep(data.depIcao);
    if (data.destIcao) setSelectedArr(data.destIcao);
    
    if (data.fltTimeH !== undefined && data.fltTimeH !== null && !isNaN(data.fltTimeH)) { 
        setRestFlightHours3(data.fltTimeH); 
        setRestFlightHours4(data.fltTimeH);
    }
    if (data.fltTimeM !== undefined && data.fltTimeM !== null && !isNaN(data.fltTimeM)) { 
        setRestFlightMins3(data.fltTimeM); 
        setRestFlightMins4(data.fltTimeM); 
    }
    
    if (data.stdH !== undefined) { setStdHours(data.stdH); setStdMins(data.stdM); setIsTakeoffAuto(true); }
    if (data.avgTaxiOut !== undefined) setTaxiOutMins(data.avgTaxiOut); else setTaxiOutMins(20);
    if (data.avgTaxiIn !== undefined) setTaxiInMins(data.avgTaxiIn); else setTaxiInMins(5);
    
    if (data.route) setGlobalRoute(data.route);
    if (data.dest) setGlobalDest(data.dest); 
    if (data.etopsAltns) setGlobalEtopsAltns(data.etopsAltns); else setGlobalEtopsAltns([]);
    if (data.etopsTime) setGlobalEtopsTime(data.etopsTime); else setGlobalEtopsTime("");
    setGlobalEtops207(!!data.isEtops207);
    
    window.dispatchEvent(new CustomEvent('show-toast', { detail: 'フライトデータを全画面に反映しました！' }));
  };

  const parseNavlogPDFText = (text) => {
    let newPlan = [];
    
    const fNoMatch = text.match(/(?:ANA|JAL|NCA|NH|JL)(\d{2,4}[A-Z]?)/);
    let fNo = fNoMatch ? fNoMatch[0] : "UNKNOWN";
    let flightIdRaw = fNoMatch ? fNoMatch[1] : "";
    flightIdRaw = flightIdRaw.replace(/^0+/, '');
    if (flightIdRaw === '') flightIdRaw = '0';
    if (fNoMatch) {
      fNo = fNo.replace(/\d{2,4}/, flightIdRaw);
    }
    
    const routeMatch = text.match(/([A-Z]{4})\s*-\s*([A-Z]{4})/);
    const rInfo = routeMatch ? `${routeMatch[1]} - ${routeMatch[2]}` : "UNKNOWN";
    const depIcao = routeMatch ? routeMatch[1] : null;
    const destIcao = routeMatch ? routeMatch[2] : null;
    const regMatch = text.match(/(JA\d{3}[A-Z]?)/);
    const pReg = regMatch ? regMatch[1] : "JA796A";

    const isEtops207 = /ETOPS\s*\/\s*207|207MIN\s+ETOPS/i.test(text);

    let ptow, pldw, pPzfw = 400.0, alt, isa = 0, toElev, ldElev, fltTimeH, fltTimeM, stdH, stdM, staH, staM;
    let pTaxiOut = 20, pTaxiIn = 5;

    const zfwMatch = text.match(/(?:ZFW|PZFW)\s+([0-9,.]+)/);
    if (zfwMatch) {
      let v = parseFloat(zfwMatch[1].replace(/,/g, ''));
      if (v > 2000) v = v / 1000;
      pPzfw = v;
    }
    const ptowMatch = text.match(/(?:PTOW|TOW)\s+([0-9,.]+)/);
    if (ptowMatch) {
      let v = parseFloat(ptowMatch[1].replace(/,/g, ''));
      if (v > 2000) v = Math.round(v / 1000);
      ptow = v;
    }
    const pldwMatch = text.match(/(?:PLDW|LDW|LAW)\s+([0-9,.]+)/);
    if (pldwMatch) {
      let v = parseFloat(pldwMatch[1].replace(/,/g, ''));
      if (v > 2000) v = Math.round(v / 1000);
      pldw = v;
    }

    const crzMatch = text.match(/(?:CRZ|LVL)\s+(?:SYS\s+)?(?:FL)?(\d{3})/);
    if (crzMatch) alt = parseInt(crzMatch[1], 10) * 100;
    
    const isaMatch = text.match(/ISA\s*([PM+-])\s*(\d{1,2})/i);
    if (isaMatch) {
      let val = parseInt(isaMatch[2], 10);
      if (isaMatch[1] === '-' || isaMatch[1].toUpperCase() === 'M') val = -val;
      isa = val;
    }
    
    const elevRegex = /ELEV\s+(\d{1,4})/g;
    let elevMatch;
    let elevs = [];
    while ((elevMatch = elevRegex.exec(text)) !== null) {
        elevs.push(parseInt(elevMatch[1], 10));
    }
    if (elevs.length >= 2) {
      toElev = elevs[0];
      ldElev = elevs[elevs.length - 1];
    } else if (elevs.length === 1) {
      ldElev = elevs[0];
    }
    
    const ftMatch = text.match(/F\/T\s*(\d{1,2})\s*HR\s*(\d{1,2})\s*MIN/i) || 
                    text.match(/(?:FLT|FLTIME|FLT TIME)\s+(\d{2})\.?(\d{2})/i) ||
                    text.match(/BOF\s+[A-Z]{4}\s+(\d{2})\/(\d{2})/i);
    if (ftMatch) {
      fltTimeH = parseInt(ftMatch[1], 10);
      fltTimeM = parseInt(ftMatch[2], 10);
    }

    const stdMatch = text.match(/STD\s+(\d{2})\.?(\d{2})/);
    if (stdMatch) {
      stdH = parseInt(stdMatch[1], 10);
      stdM = parseInt(stdMatch[2], 10);
    }

    const staMatch = text.match(/STA\s+(\d{2})(\d{2})Z/i) || text.match(/STA\s+(\d{2})\.?(\d{2})/i);
    if (staMatch) {
      staH = parseInt(staMatch[1], 10);
      staM = parseInt(staMatch[2], 10);
    }

    const taxiMatch = text.match(/AVG:\s*(\d+)\/(\d+)MIN/i) || text.match(/(?:AVG|TAXI|OUT)[^\d]*(\d+)\/(\d+)MIN/i);
    if (taxiMatch) {
        pTaxiOut = parseInt(taxiMatch[1], 10);
        pTaxiIn = parseInt(taxiMatch[2], 10);
    }

    const dateMatch = text.match(/\b(\d{2}[A-Z]{3}\d{2})\b/);
    const pDate = dateMatch ? dateMatch[1] : "";

    const etopsSectionIndex = text.indexOf('-ETP/EEP/EXP/ET.LT');
    let etopsData = null;
    let eepWpName = null;
    let expWpName = null;
    let extractedEtopsAltns = [];
    
    if (etopsSectionIndex !== -1) {
      const nextSectionMatch = text.substring(etopsSectionIndex + 1).match(/(?:\s|\n)-[A-Z]/);
      const nextSectionIndex = nextSectionMatch ? nextSectionMatch.index : -1;
      const etopsText = nextSectionIndex !== -1 
          ? text.substring(etopsSectionIndex, etopsSectionIndex + 1 + nextSectionIndex)
          : text.substring(etopsSectionIndex);

      const eepMatch1 = etopsText.match(/EEP\/([A-Z0-9]+)/);
      const eepMatch2 = etopsText.match(/([A-Z0-9]+)\s+EEP\//);
      eepWpName = eepMatch1 ? eepMatch1[1].replace(/\+\d+$/, '') : (eepMatch2 ? eepMatch2[1] : null);

      const expMatch1 = etopsText.match(/EXP\/[\s\/]*([A-Z0-9]+)/i);
      const expMatch2 = etopsText.match(/([A-Z0-9]+)\s+EXP\//i);
      expWpName = expMatch1 ? expMatch1[1].replace(/\+\d+$/, '') : (expMatch2 ? expMatch2[1] : null);

      etopsData = [];
      const etpMatches = [...etopsText.matchAll(/([A-Z]{4})\/([A-Z]{4})\s+(\d{2})\/(\d{2})/g)];
      const timeMatches = [...etopsText.matchAll(/([A-Z]{4})\/(\d{4})\/(\d{4})/g)];

      timeMatches.forEach((match, idx) => {
          let endCtme = Infinity;
          if (idx < etpMatches.length) {
              endCtme = parseInt(etpMatches[idx][3], 10) * 60 + parseInt(etpMatches[idx][4], 10);
          }
          etopsData.push({
              airport: match[1],
              et: match[2],
              lt: match[3],
              endCtme: endCtme
          });
      });
      if (etopsData.length === 0) etopsData = null;

      const altnMatches = [...etopsText.matchAll(/\b([A-Z]{4})\b/g)];
      const ignoreAirports = new Set([depIcao, destIcao, "NONE", "AUTO", "DISP", "WSCP", "ETP1", "ETP2", "ETP3"]);
      extractedEtopsAltns = [...new Set(
        altnMatches.map(m => m[1]).filter(code => !ignoreAirports.has(code))
      )];
    }

    const commentEtopsMatch = text.match(/SELECT\s+([A-Z]{4})\/([A-Z]{4})\s+AS\s+ETOPS\s+ALTN/i);
    if (commentEtopsMatch) {
      extractedEtopsAltns = [commentEtopsMatch[1], commentEtopsMatch[2]];
    }

    let cleanTextForWp = text;
    const logStartIndex = cleanTextForWp.indexOf('WSCP');
    if (logStartIndex !== -1) {
        cleanTextForWp = cleanTextForWp.substring(logStartIndex);
    } else {
        if (etopsSectionIndex !== -1) {
            const nextSectionMatch = text.substring(etopsSectionIndex + 1).match(/(?:\s|\n)-[A-Z]/);
            const nextSectionIndex = nextSectionMatch ? nextSectionMatch.index : -1;
            cleanTextForWp = nextSectionIndex !== -1 
                ? text.substring(0, etopsSectionIndex) + text.substring(etopsSectionIndex + 1 + nextSectionIndex)
                : text.substring(0, etopsSectionIndex);
        }
    }

    cleanTextForWp = cleanTextForWp.replace(/\(\s+/g, '(');
    const tokens = cleanTextForWp.split(/\s+/);
    
    let ignoreList = new Set([
        "ELEV", "RDIS", "TMP", "ZWIND", "SAT", "SPOT", "ETO", "ZTME", "ALT", "FUEL", "POS", "ATO", "DIST", "FL", "RMG", 
        "RJTT", "KJFK", "KEWR", "PANC", "CYVR", "RJCC", "DEC", "CLM", "LRC", "PROG", "STEP", "CLIMB", "MINTMP", 
        "COMPUTED", "COMPANY", "CLEARANCE", "MW/TP", "WSCP", "NONE", "OAT", "INTENTION", "SPEED", "ROUTE", "DATA", 
        "AWY", "OFP", "LOG", "RMK", "NAV", "FOB", "PLN", "ACT", "DIFF", "MEMO", "TIME", "MAX", "WT", "PAGE", "DIS", 
        "WND", "SHR", "TRK", "INFO", "IFR", "VFR", 
        "TC", "GS", "CTME", "MC", "TAS", "RTME", "WP", "LAT", "LONG", "LAT/LONG"
    ]);
    
    if (fNoMatch) {
        ignoreList.add(fNoMatch[0]);
        ignoreList.add(fNo);
    }
    if (flightIdRaw) ignoreList.add(flightIdRaw);
    if (routeMatch) {
        ignoreList.delete(routeMatch[1]);
        ignoreList.delete(routeMatch[2]);
    }

    let recentTimes = [];
    let pendingFob = null;
    let pendingAlt = "";
    let pendingTmp = "";
    let pendingWind = "";
    let pendingTasGs = []; 
    let pendingIsa = null;
    let pendingLat = null; // NAVLOG内の緯度経度抽出用
    let pendingLatLon = null;

    let eepCtme = null;
    let expCtme = null;

    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        
        if (/^\d{2}\.\d{2}$/.test(token)) {
            const parts = token.split('.');
            const mins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            if (recentTimes[recentTimes.length - 1] !== mins) {
                recentTimes.push(mins);
            }
            if (recentTimes.length > 2) recentTimes.shift(); 

            if (i > 0 && /^\d{3}$/.test(tokens[i-1])) {
                let v = parseInt(tokens[i-1], 10);
                if (v >= 200 && v <= 750) pendingTasGs.push(tokens[i-1]);
            }
            if (i + 1 < tokens.length && /^\d{3}$/.test(tokens[i+1])) {
                let v = parseInt(tokens[i+1], 10);
                if (v >= 200 && v <= 750) pendingTasGs.push(tokens[i+1]);
            }
            continue;
        }
        if (/^\d{2,3}\.\d$/.test(token) && parseFloat(token) < 300) { 
             pendingFob = parseFloat(token); continue;
        }
        if (/^[1-6]\d{4}$/.test(token)) {
             const h = parseInt(token, 10);
             if (h >= 10000 && h <= 60000) pendingAlt = `FL${Math.floor(h / 100)}`;
             continue;
        }

        if (/^(?:-[0-9]{2}|M[0-9]{2})$/i.test(token)) {
            let cleanTmp = token.replace(/M/i, '-');
            pendingTmp = cleanTmp;
            continue;
        }

        if (/^\d{3}\/?\d{2,3}$/.test(token)) {
            let cleanWind = token;
            if (!cleanWind.includes('/')) {
              cleanWind = cleanWind.substring(0, 3) + '/' + cleanWind.substring(3);
            }
            pendingWind = cleanWind;
            continue;
        }

        let isaBrackMatch = token.match(/^\(\s*([PM+-]?\d{1,2})\s*\)$/i);
        if (isaBrackMatch) {
            let valStr = isaBrackMatch[1].toUpperCase();
            let num = parseInt(valStr.replace(/[PM+]/g, ''), 10);
            if (valStr.includes('-') || valStr.includes('M')) num = -num;
            if (!isNaN(num) && num >= -40 && num <= 40) {
              pendingIsa = num;
            }
            continue;
        }

        let cleanToken = token.replace(/^-+/, '').replace(/-+$/, '');

        // 緯度・経度の抽出処理 (WeatherRadarViewでの正確なプロット用)
        const latMatch = cleanToken.match(/^[NS]\d{4,6}(?:\.\d+)?$/);
        if (latMatch) {
            pendingLat = cleanToken;
            continue;
        }
        const lonMatch = cleanToken.match(/^[EW]\d{4,7}(?:\.\d+)?$/);
        if (lonMatch) {
            if (pendingLat) {
                pendingLatLon = pendingLat + cleanToken;
                if (newPlan.length > 0 && !newPlan[newPlan.length - 1].latLon) {
                    newPlan[newPlan.length - 1].latLon = pendingLatLon;
                }
            }
            pendingLat = null;
            continue;
        }
        const latLonMatch = cleanToken.match(/^[NS]\d{4,6}(?:\.\d+)?[EW]\d{4,7}(?:\.\d+)?$/);
        if (latLonMatch) {
            pendingLatLon = cleanToken;
            if (newPlan.length > 0 && !newPlan[newPlan.length - 1].latLon) {
                newPlan[newPlan.length - 1].latLon = pendingLatLon;
            }
            continue;
        }
        
        if (token === 'FL' && i > 0 && /^\d+$/.test(tokens[i-1])) {
            if (newPlan.length > 0) {
                newPlan[newPlan.length - 1].dist = parseInt(tokens[i-1], 10);
            }
            continue;
        }

        let isOffRoute = token.startsWith('-');
        if (i > 0 && tokens[i-1] === '-') {
            isOffRoute = true;
        }

        const isCoord = /^[NS]\d{4,5}[EW]\d{4,6}$/.test(cleanToken);
        const isAlphaWp = /^[A-Z][A-Z0-9]{1,5}$/.test(cleanToken) && !ignoreList.has(cleanToken);
        const isArincWp = /^\d{2}[NSWE]\d{2}$/.test(cleanToken);
        const isSpecialWp = ["TOC", "TOD"].includes(cleanToken);

        if (!isCoord && (isAlphaWp || isArincWp || isSpecialWp)) {
            if (recentTimes.length === 0 && !isSpecialWp) {
                continue; 
            }

            let ctme = recentTimes.length > 0 ? recentTimes[0] : 0;
            let rtme = recentTimes.length > 1 ? recentTimes[1] : 0;
            if (recentTimes.length === 1) rtme = 0; 
            
            if (cleanToken === eepWpName) eepCtme = ctme;
            if (cleanToken === expWpName) expCtme = ctme;

            if (newPlan.length > 0 && newPlan[newPlan.length - 1].wp === cleanToken) {
                continue;
            }

            let currentWpIsa = pendingIsa !== null ? pendingIsa : isa;

            if (pendingAlt && pendingTmp && pendingIsa === null) {
              const flNum = parseInt(pendingAlt.replace('FL', ''), 10);
              const actualTmp = parseInt(pendingTmp, 10);
              if (!isNaN(flNum) && !isNaN(actualTmp)) {
                const stdTmpAtAlt = 15 - (2 * flNum);
                currentWpIsa = actualTmp - stdTmpAtAlt;
              }
            }

            let uniqueTasGs = [...new Set(pendingTasGs)];
            let parsedGs = uniqueTasGs.length > 0 ? uniqueTasGs[0] : "";
            let parsedTas = uniqueTasGs.length > 1 ? uniqueTasGs[1] : "";

            pendingLat = null; // 新しいWPが来たのでpending状態をリセット

            newPlan.push({ 
              wp: cleanToken, 
              ctme: ctme, 
              rtme: rtme, 
              fob: pendingFob !== null ? pendingFob : 0, 
              plnAlt: pendingAlt, 
              plnTmp: pendingTmp, 
              plnWind: pendingWind, 
              gs: parsedGs,
              tas: parsedTas,
              isaDev: currentWpIsa,
              hasExplicitIsa: pendingIsa !== null,
              dist: 0,
              isOffRoute: isOffRoute,
              latLon: pendingLatLon
            });
            
            if (destIcao && cleanToken === destIcao) {
                break; 
            }
            
            pendingFob = null; 
            pendingAlt = ""; 
            pendingTmp = "";
            pendingWind = "";
            pendingTasGs = []; 
            pendingIsa = null;
            pendingLatLon = null;
            recentTimes = []; 
        }
    }

    if (!alt) {
        const toc = newPlan.find(wp => wp.plnAlt);
        if (toc && toc.plnAlt) alt = parseInt(toc.plnAlt.replace('FL', ''), 10) * 100;
    }

    const tocIndex = newPlan.findIndex(wp => wp.wp === "TOC");
    if (tocIndex !== -1) {
        const wpWithIsa = newPlan.find((wp, idx) => idx >= tocIndex && wp.hasExplicitIsa);
        if (wpWithIsa && wpWithIsa.isaDev !== undefined && !isNaN(wpWithIsa.isaDev)) {
            isa = wpWithIsa.isaDev;
        }
    }

    if ((fltTimeH === undefined || isNaN(fltTimeH)) && newPlan.length > 0) {
        const destWp = newPlan[newPlan.length - 1];
        if (destWp.ctme > 0) {
            fltTimeH = Math.floor(destWp.ctme / 60);
            fltTimeM = destWp.ctme % 60;
        }
    }

    if (newPlan.length >= 2) {
        const last = newPlan[newPlan.length - 1];
        const prev = newPlan[newPlan.length - 2];
        if (last.wp === prev.wp) {
            newPlan.pop();
        }
    }

    let parsedEtopsInfo = null;
    if (etopsData) {
        parsedEtopsInfo = {
            data: etopsData,
            eepCtme: eepCtme !== null ? eepCtme : 0,
            expCtme: expCtme !== null ? expCtme : 9999
        };
    }

    const fullRouteStr = newPlan.map(p => p.wp).join(' ');

    return { 
        newPlan, fNo, flightIdRaw, flightId: flightIdRaw, rInfo, depIcao, destIcao, dest: destIcao, pReg, pPzfw, pTaxiOut, pTaxiIn, pDate, 
        ptow, pldw, alt, isa, toElev, ldElev, fltTimeH, fltTimeM, stdH, stdM, staH, staM,
        fullRouteStr, route: fullRouteStr, etopsAltns: extractedEtopsAltns, isEtops207, loadId: Date.now(), parsedEtopsInfo 
    };
  };

  const handleAppPdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsParsingPdf(true);
    window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDFを解析しています...' }));
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          await new Promise(res => { script.onload = res; document.head.appendChild(script); });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        
        const typedarray = new Uint8Array(event.target.result);
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        let fullText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(" ") + "\n";
        }

        const parsedData = parseNavlogPDFText(fullText);
        
        if (parsedData.newPlan.length > 0) {
            parsedData.isNew = true; 
            setNavlogData(parsedData); 
            handleApplyFlightPlan(parsedData);
            setIsLoadModalOpen(false);
        } else { 
            window.dispatchEvent(new CustomEvent('show-toast', { detail: 'フライトプランの読み取りに失敗しました。PDFの形式を確認してください。' })); 
        }
      } catch (err) { 
        console.error(err); 
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDFの解析に失敗しました。ファイルが破損しているか、非対応の形式です。' })); 
      } 
      finally { 
        setIsParsingPdf(false); 
        if (pdfInputRef.current) pdfInputRef.current.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
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

  const handleCloseBanner_safe = () => {
    localStorage.setItem('hideSetupGuide', 'true');
    setShowSetupBanner(false);
  };

  const computed = useMemo(() => {
    let engineStr = "GE"; if (state.selectedType === "777-200" || state.selectedType === "777-300") { engineStr = "PW"; } const isPW = engineStr === "PW";
    const mKey = typeof modelKeyMap !== 'undefined' && modelKeyMap[state.selectedType] ? modelKeyMap[state.selectedType] : '772'; 
    const perfTable = typeof CRUISE_PERF_DATA !== 'undefined' && CRUISE_PERF_DATA[mKey] ? CRUISE_PERF_DATA[mKey] : [[150, 41000, 43100, 0, 43100, 43100, 43100]];
    const minCruiseWeight = perfTable ? perfTable[0][0] * 1000 : 150000; const maxCruiseWeight = perfTable ? perfTable[perfTable.length - 1][0] * 1000 : 350000; const clampedCruiseWeight = Math.max(minCruiseWeight, Math.min(state.cruiseWeight, maxCruiseWeight));
    
    let maxAvailableLdgWt = 800000; let landingMinWeight = 280000;
    if (mKey === "772") { maxAvailableLdgWt = 540000; landingMinWeight = 360000; } else if (mKey === "773") { maxAvailableLdgWt = 550000; landingMinWeight = 420000; } else if (mKey === "77W") { maxAvailableLdgWt = 800000; landingMinWeight = 460000; } else if (mKey === "77F") { maxAvailableLdgWt = 780000; landingMinWeight = 440000; }
    const clampedLandingWeight = Math.max(landingMinWeight, Math.min(state.landingWeight, maxAvailableLdgWt));
    
    const isEngInop = state.landingCondition === "1 ENG INOP"; const appAdd = state.appSpeedAdditive;
    
    const wt1000 = clampedCruiseWeight / 1000; 
    const optAltRaw = interpolateObjArray(wt1000, perfTable, 1) || 30000; 
    const buffIndex = state.buffetMargin === '1.5G' ? 3 : 2;
    const bufLimitRaw = interpolateObjArray(wt1000, perfTable, buffIndex) || 40000; 
    
    const isa10Raw = interpolateObjArray(wt1000, perfTable, 4) || 41000; 
    const isa15Raw = interpolateObjArray(wt1000, perfTable, 5) || 40000; 
    const isa20Raw = interpolateObjArray(wt1000, perfTable, 6) || 39000;

    const optAlt = Math.round(optAltRaw); 
    let thrustLimit;
    if (state.isaDev <= 10) thrustLimit = isa10Raw; 
    else if (state.isaDev <= 15) thrustLimit = isa10Raw + (isa15Raw - isa10Raw) * ((state.isaDev - 10) / 5); 
    else if (state.isaDev <= 20) thrustLimit = isa15Raw + (isa20Raw - isa15Raw) * ((state.isaDev - 15) / 5); 
    else thrustLimit = isa20Raw + (isa20Raw - isa15Raw) * ((state.isaDev - 20) / 5);
    
    thrustLimit = Math.round(thrustLimit); 
    const bufLimit = Math.round(bufLimitRaw); 
    const structuralAlt = 43100;
    const maxAlt = Math.min(structuralAlt, bufLimit, thrustLimit); 
    
    let limitReason = "N/A";
    if (maxAlt === structuralAlt) { limitReason = "Structural Limit"; } 
    else if (maxAlt === bufLimit) { limitReason = `Buffet Limit (${state.buffetMargin})`; } 
    else { limitReason = "Thrust Limit"; }

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
      
      const getInterpolatedTarget = (wt, dataArray, addSpd) => {
        if (!dataArray || dataArray.length === 0) return { pch: null, n1: null };
        let effWt = wt;
        const maxWt = dataArray[dataArray.length - 1][0];
        if (effWt > maxWt) effWt = maxWt;

        const isDataExtended = dataArray[0].length > 3;
        
        if (!isDataExtended) {
          const basePch = interpolateObjArray(effWt, dataArray, 1);
          const baseN1 = interpolateObjArray(effWt, dataArray, 2);
          if (basePch === null || baseN1 === null) return { pch: null, n1: null };
          return { pch: basePch - (addSpd * 0.12), n1: baseN1 + (addSpd * 0.15) };
        }
        
        const speeds = [
          { add: 0, pIdx: 1, nIdx: 2 },
          { add: 5, pIdx: 3, nIdx: 4 },
          { add: 10, pIdx: 5, nIdx: 6 },
          { add: 20, pIdx: 7, nIdx: 8 },
          { add: 30, pIdx: 9, nIdx: 10 }
        ];
        
        let lower = speeds[0], upper = speeds[speeds.length - 1];
        if (addSpd <= speeds[0].add) lower = upper = speeds[0];
        else if (addSpd >= speeds[speeds.length - 1].add) lower = upper = speeds[speeds.length - 1];
        else {
          for (let i = 0; i < speeds.length - 1; i++) {
            if (addSpd >= speeds[i].add && addSpd <= speeds[i+1].add) { 
              lower = speeds[i]; upper = speeds[i+1]; break; 
            }
          }
        }
        
        const p_lower = interpolateObjArray(effWt, dataArray, lower.pIdx);
        const n_lower = interpolateObjArray(effWt, dataArray, lower.nIdx);
        const p_upper = interpolateObjArray(effWt, dataArray, upper.pIdx);
        const n_upper = interpolateObjArray(effWt, dataArray, upper.nIdx);
        
        if (p_lower === null || n_lower === null || p_upper === null || n_upper === null) return { pch: null, n1: null };
        if (lower.add === upper.add) return { pch: p_lower, n1: n_lower };
        
        const ratio = (addSpd - lower.add) / (upper.add - lower.add);
        return { 
          pch: p_lower + (p_upper - p_lower) * ratio, 
          n1: n_lower + (n_upper - n_lower) * ratio 
        };
      };

      if (f25Data) {
        const res = getInterpolatedTarget(wt1000Ldg, f25Data, state.appSpeedAdditive);
        currentPchFlap25 = res.pch; currentN1Flap25 = res.n1;
      }
      if (f30Data) {
        const res = getInterpolatedTarget(wt1000Ldg, f30Data, state.appSpeedAdditive);
        currentPchFlap30 = res.pch; currentN1Flap30 = res.n1;
      }
    }
    
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
    
    let distMan1 = getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "man");
    let distMan2 = getAomDistance("FLAP 30", "man");

    const acData = typeof MAX_MAN_DATA !== 'undefined' ? MAX_MAN_DATA[state.selectedType] : null;
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
      <WifiPwdModal isOpen={isWifiModalOpen} onClose={() => setIsWifiModalOpen(false)} />
      <DrmModal isOpen={isDrmModalOpen} onClose={() => setIsDrmModalOpen(false)} initialFlightNo={flightId} />
      <SmartCatModal isOpen={isSmartCatModalOpen} onClose={() => setIsSmartCatModalOpen(false)} />
      <QuickGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      
      <LoadDataModal 
        isOpen={isLoadModalOpen} 
        onClose={() => setIsLoadModalOpen(false)} 
        isParsing={isParsingPdf}
        pdfRef={pdfInputRef}
        onFileClick={() => pdfInputRef.current?.click()}
        onPaste={(text) => {
            const parsed = parseNavlogPDFText(text);
            if (parsed && parsed.newPlan.length > 0) {
                parsed.isNew = true;
                setNavlogData(parsed);
                handleApplyFlightPlan(parsed);
                setIsLoadModalOpen(false);
            } else {
                window.dispatchEvent(new CustomEvent('show-toast', { detail: 'テキストの解析に失敗しました。' }));
            }
        }} 
      />

      <input type="file" accept="application/pdf" className="hidden" ref={pdfInputRef} onChange={handleAppPdfUpload} />

      {showSetupBanner && (
        <div className="bg-[#0b2447] border border-blue-500/50 rounded-xl p-3 mx-1 mt-1 shadow-md relative overflow-hidden animate-in slide-in-from-top-4 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-1.5 text-blue-400 font-black text-xs md:text-sm mb-1">
                <SafeIcon name="Smartphone" className="w-4 h-4 shrink-0" />
                <span className="truncate">アプリを「ホーム画面に追加」して快適に！</span>
             </div>
             <p className="text-[10px] sm:text-xs text-blue-100 leading-tight">
               全画面表示のため、ブラウザの共有メニューから<span className="text-amber-400 font-bold mx-0.5">「ホーム画面に追加」</span>をお願いします。
             </p>
          </div>
          <button onClick={handleCloseBanner_safe} className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors shadow-sm whitespace-nowrap border border-blue-400/30">
            閉じる
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1.5 w-full flex-none mb-1 px-1 mt-1 shrink-0">
        <div className="flex flex-col pt-1 pb-1 border-b-2 border-slate-700/80 gap-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1 text-blue-400 font-black tracking-tighter text-[11px] sm:text-sm">
            <div className="flex items-center gap-1">
              <SafeIcon name="Plane" className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span>7PT B777 PERFORMANCE TOOL</span>
              <span className="text-amber-400 font-mono text-[9px] border border-amber-500/30 px-1 rounded bg-amber-500/10 tracking-normal font-bold ml-1">ver {APP_VERSION}</span>
              {flightId && (<span className="text-slate-300 font-mono text-[9px] border border-slate-600 px-1 rounded bg-slate-800 tracking-normal font-bold">ANA{flightId}</span>)}
            </div>
            
            <button onClick={handleResetAll} className="bg-rose-900/60 hover:bg-rose-600 text-rose-200 hover:text-white px-2 py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border border-rose-500/50 hover:border-rose-400 shadow-sm shrink-0 ml-auto" title="すべての入力データをリセット">
                <SafeIcon name="Trash2" className="w-2.5 h-2.5 pointer-events-none" />
                <span className="text-[8px] sm:text-[9px] font-black tracking-widest leading-none mt-[1px] pointer-events-none">RESET</span>
            </button>
          </div>

          <div className="flex items-center gap-1 w-full overflow-x-auto hide-scrollbar pb-0.5 mt-0.5">
              <WifiButton type="PANA" url="http://portal.inflight.ana-panasonic.aero/" label="PANA" hoverClass="hover:bg-sky-600" colorClass="text-sky-400 border-sky-500/50 text-[9px] sm:text-[10px] shrink-0" onLongPress={() => setIsWifiModalOpen(true)} />
              
              <button onClick={() => window.open('https://wifi.inflight.viasat.com/', '_blank')} className="bg-slate-700 hover:bg-indigo-600 text-indigo-400 border border-indigo-500/50 hover:text-white px-1 py-0.5 md:px-1.5 md:py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors shadow-sm select-none shrink-0" title="Inmarsat Wi-Fi">
                <SafeIcon name="Wifi" className="w-2.5 h-2.5 md:w-3 md:h-3 pointer-events-none" />
                <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">INMA</span>
              </button>

              <WifiButton type="DOM" url="https://www.ana-inflight-wifi.com/" label="DOM" hoverClass="hover:bg-emerald-600" colorClass="text-emerald-400 border-emerald-500/50 text-[9px] sm:text-[10px] shrink-0" onLongPress={() => { }} />

              <button onClick={() => setIsLoadModalOpen(true)} className="animate-glow-pulse bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-emerald-100 px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-emerald-500 shadow-sm shrink-0" title="PDFまたはテキストから読み込む">
                <SafeIcon name="Download" className="w-3 h-3 pointer-events-none" />
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">LOAD</span>
              </button>

              <button onClick={() => { if (!state.selectedReg || state.selectedReg === "N/A" || state.selectedReg === "") { window.dispatchEvent(new CustomEvent('show-toast', { detail: '機番を選択してください' })); return; } const buddycomUrl = typeof BUDDYCOM_LINKS !== 'undefined' ? BUDDYCOM_LINKS[state.selectedReg] : null; if (buddycomUrl) { const pastedFlightName = flightId ? `ANA${flightId}` : ""; if (pastedFlightName) { copyToClipboard(pastedFlightName); window.dispatchEvent(new CustomEvent('show-toast', { detail: `便名(${pastedFlightName})をコピーして起動しました` })); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Buddycomを起動しました' })); } setTimeout(() => { window.open(buddycomUrl, '_blank'); }, 1000); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'この機番のBuddycomリンクは未登録です' })); } }} className={`px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border shadow-sm shrink-0 ${state.selectedReg && state.selectedReg !== "N/A" && state.selectedReg !== "" ? 'bg-slate-700 hover:bg-orange-600 text-orange-400 hover:text-white border-slate-500 hover:border-orange-400' : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}`} title="Buddycomを開く"><SafeIcon name="Radio" className="w-3 h-3 pointer-events-none" /><span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">BDYC</span></button>
              
              <button onClick={() => { let flightQuery = ""; if (flightId) { flightQuery = `NH${flightId}`; } else if (selectedFlightId && selectedFlightId !== "N/A" && selectedFlightId !== "") { if (selectedAirlineCode && selectedAirlineCode !== "N/A" && selectedAirlineCode !== "") { flightQuery = `${selectedAirlineCode}${selectedFlightId}`; } else { flightQuery = `NH${selectedFlightId}`; } } if (flightQuery) { copyToClipboard(flightQuery); window.dispatchEvent(new CustomEvent('show-toast', { detail: `便名(${flightQuery})をコピーしました。検索窓にペーストしてください` })); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'FR24アプリを起動します' })); } setTimeout(() => { window.open('https://www.flightradar24.com', '_blank'); }, 1000); }} className="bg-slate-700 hover:bg-yellow-600 text-yellow-400 hover:text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 hover:border-yellow-400 shadow-sm shrink-0" title="Flight Radar 24を開く"><SafeIcon name="Radar" className="w-3 h-3 pointer-events-none" /><span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">FR24</span></button>
              
              <button onClick={() => window.open('https://meet.google.com/sjj-oshp-ivz', '_blank')} className="bg-slate-700 hover:bg-pink-600 text-pink-400 hover:text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 hover:border-pink-400 shadow-sm shrink-0" title="ALC (Google Meet) を開く">
                <SafeIcon name="Video" className="w-3 h-3 pointer-events-none" />
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">ALC</span>
              </button>

              <button onClick={() => window.open('https://aswbe.ana.co.jp/webapps/checkin/checkin-search?CONNECTION_KIND=JPN&LANG=ja&SITE_ID=ASW_TOP', '_blank')} className="bg-slate-700 hover:bg-sky-600 text-sky-400 hover:text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 hover:border-sky-400 shadow-sm shrink-0" title="ANAオンラインチェックイン">
                <SafeIcon name="UserCheck" className="w-3 h-3 pointer-events-none" />
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">CKIN</span>
              </button>

              <button onClick={() => { setIsDrmModalOpen(true); }} className="bg-slate-700 hover:bg-purple-600 text-purple-400 hover:text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 shadow-sm shrink-0"><span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">DRM</span></button>
              <button onClick={() => { setIsGuideOpen(true); }} className="bg-slate-700 hover:bg-rose-600 text-rose-400 hover:text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 shadow-sm shrink-0"><span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">HELP</span></button>
              
              <button onClick={() => { if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then((registrations) => { for (let registration of registrations) { registration.unregister(); } }); } window.dispatchEvent(new CustomEvent('show-toast', { detail: '最新バージョンを取得して再起動します...' })); setTimeout(() => { window.location.reload(true); }, 1500); }} className="bg-slate-700 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-emerald-500 hover:border-emerald-400 shadow-sm shrink-0" title="アプリを消さずに最新版へアップデート">
                <SafeIcon name="DownloadCloud" className="w-3 h-3 pointer-events-none" />
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">UPDT</span>
              </button>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-1 py-1 w-full sm:overflow-x-auto sm:hide-scrollbar">
          {tabs.map(tab => {
            if (tab === 'スマカタ') {
              return (
                <button key={tab} onClick={() => setIsSmartCatModalOpen(true)} className="px-2 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all shadow-sm bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50 flex items-center justify-center gap-1 flex-grow sm:flex-grow-0 min-w-[22%] sm:min-w-0">
                  <SafeIcon name="BookOpen" className="w-3 h-3" /> <span className="leading-none">スマカタ</span>
                </button>
              );
            }
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-2 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all shadow-sm flex items-center justify-center gap-1 flex-grow sm:flex-grow-0 min-w-[22%] sm:min-w-0 ${activeTab === tab ? "bg-amber-600 text-white shadow-amber-900/50 scale-[1.01]" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50"}`}>
                <span className="leading-none">{tab}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col w-full flex-1 min-h-0 relative overflow-hidden">
        {activeTab === 'DASHBOARD' && (<div className="flex flex-col gap-1 w-full h-full"><DashboardView state={state} updateState={updateState} computed={computed} aircraftRegistrationList={typeof aircraftRegistrationList !== 'undefined' ? aircraftRegistrationList : []} handleRegChange={handleRegChange} setAircraftType={setAircraftType} cruiseWtInputText={cruiseWtInputText} setCruiseWtInputText={setCruiseWtInputText} ldgWtInputText={ldgWtInputText} setLdgWtInputText={setLdgWtInputText} /></div>)}
        {activeTab === 'TFC INFO' && (<div className="flex flex-col gap-1 w-full h-full"><FltInfoView p={fltInfoProps} /></div>)}
        {activeTab === 'WX/MNM' && (<div className="flex flex-col gap-1 w-full h-full"><WxMnmReference /></div>)}
        {activeTab === 'ETOPS' && (<div className="flex flex-col gap-1 w-full h-full"><EtopsView globalRoute={globalRoute} globalDest={globalDest} globalEtopsAltns={globalEtopsAltns} globalEtopsTime={globalEtopsTime} globalEtops207={globalEtops207} /></div>)} 
        {activeTab === 'NAVLOG' && (
          <div className="flex flex-col w-full h-full">
            <NavlogView 
              flightId={flightId} 
              state={state} 
              updateState={updateState} 
              onApplyFlightPlan={handleApplyFlightPlan} 
              navlogData={navlogData} 
            />
          </div>
        )}
        {activeTab === 'WXRDR' && (<div className="flex flex-col gap-1 w-full h-full"><WeatherRadarView navlogData={navlogData} /></div>)}
        {activeTab === 'DOCS' && (<div className="flex flex-col gap-1 w-full h-full"><Docs2View /></div>)}
        {activeTab === 'TARMAC' && (<div className="flex flex-col gap-1 w-full h-full"><TarmacView /></div>)}
        {activeTab === 'REST CALC' && (<div className="flex flex-col gap-1 w-full h-full"><RestView flightHours={restCrewSize === 3 ? restFlightHours3 : restFlightHours4} setFlightHours={restCrewSize === 3 ? setRestFlightHours3 : setRestFlightHours4} flightMins={restCrewSize === 3 ? restFlightMins3 : restFlightMins4} setFlightMins={restCrewSize === 3 ? setRestFlightMins3 : setRestFlightMins4} stdHours={stdHours} setStdHours={setStdHours} stdMins={stdMins} setStdMins={setStdMins} isTakeoffAuto={isTakeoffAuto} setIsTakeoffAuto={setIsTakeoffAuto} takeoffHours={restTakeoffHours} setTakeoffHours={setRestTakeoffHours} takeoffMins={restTakeoffMins} setTakeoffMins={setRestTakeoffMins} offsetMins={restOffsetMins} setOffsetMins={setRestOffsetMins} landingOffsetMins={restLandingOffsetMins} setLandingOffsetMins={setRestLandingOffsetMins} crewSize={restCrewSize} setCrewSize={setRestCrewSize} firstRestMins={restFirstRestMins} setFirstRestMins={setRestFirstRestMins} lastRestMins={restLastRestMins} setLastRestMins={setLastRestMins} firstHalfMins={restFirstHalfMins} setFirstHalfMins={setFirstHalfMins} taxiOutMins={taxiOutMins} /></div>)}
        {activeTab === 'APP CALC' && (<div className="flex flex-col gap-1 w-full h-full"><ApproachCalcView /></div>)}
        {activeTab === 'XWIND' && (<div className="flex flex-col gap-1 w-full h-full mt-0.5"><XwindView /></div>)}
      </div>
    </div>
  );
}