// App-12.jsx — 2026-11-13 (App-11.jsx + SKEW-T ハンドラ v6: 到着空港のページも必ず末尾に追加 — v3 の出発空港保証と対。パーサが到着行の座標を付け損ねても到着地ページと詳細ホドグラフが落ちない)
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

const APP_VERSION = "13.6"; 

import { RAW_CSV_DATA, aircraftRegistrationList, BUDDYCOM_LINKS, ICAO_COORDS } from './data/flightData';
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
import { SidView } from './components/SidView'; 
import { WeatherRadarView } from './components/WeatherRadarView';
 import { fetchProfiles, renderWaypointPagePortrait, hourKey } from './utils/skewt';

import TOLView from './components/TOLView';

// =========================================================================
// 緯度経度・距離計算ヘルパー関数 (App.jsx用)
// =========================================================================
const parseWaypointToLatLng = (wpObj) => {
  if (!wpObj) return null;
  const wpName = typeof wpObj === 'string' ? wpObj : wpObj.wp;
  const latLonStr = typeof wpObj === 'string' ? null : wpObj.latLon;

  if (latLonStr) {
      const noDotMatch = latLonStr.match(/^([NS])(\d{2})(\d{3})([EW])(\d{3})(\d{3})$/i);
      if (noDotMatch) {
          let lat = parseInt(noDotMatch[2], 10) + parseInt(noDotMatch[3], 10) / 600;
          if (noDotMatch[1].toUpperCase() === 'S') lat = -lat;
          let lon = parseInt(noDotMatch[5], 10) + parseInt(noDotMatch[6], 10) / 600;
          if (noDotMatch[4].toUpperCase() === 'W') lon = -lon;
          return { lat, lon, name: wpName, isAirport: false };
      }
      const dotMatch = latLonStr.match(/^([NS])(\d{2})(\d{2}(?:\.\d+)?)([EW])(\d{2,3})(\d{2}(?:\.\d+)?)$/i);
      if (dotMatch) {
          let lat = parseInt(dotMatch[2], 10) + parseFloat(dotMatch[3]) / 60;
          if (dotMatch[1].toUpperCase() === 'S') lat = -lat;
          let lon = parseInt(dotMatch[5], 10) + parseFloat(dotMatch[6]) / 60;
          if (dotMatch[4].toUpperCase() === 'W') lon = -lon;
          return { lat, lon, name: wpName, isAirport: false };
      }
  }

  const arincMatch1 = wpName.match(/^(\d{2})([NSWE])(\d{2})$/i);
  if (arincMatch1) {
      let lat = parseInt(arincMatch1[1], 10);
      let lon = parseInt(arincMatch1[3], 10);
      const dir = arincMatch1[2].toUpperCase();
      if (dir === 'N') { lon = -(lon + 100); } else if (dir === 'E') { lon = lon + 100; } else if (dir === 'W') { lat = -lat; lon = -(lon + 100); } else if (dir === 'S') { lat = -lat; lon = lon + 100; }
      return { lat, lon, name: wpName, isAirport: false };
  }

  const arincMatch2 = wpName.match(/^(\d{4})([NSWE])$/i);
  if (arincMatch2) {
      let lat = parseInt(arincMatch2[1].substring(0,2), 10);
      let lon = parseInt(arincMatch2[1].substring(2,4), 10);
      const dir = arincMatch2[2].toUpperCase();
      if (dir === 'N') lon = -lon; else if (dir === 'E') lon = lon; else if (dir === 'W') { lat = -lat; lon = -lon; } else if (dir === 'S') { lat = -lat; lon = lon; } 
      return { lat, lon, name: wpName, isAirport: false };
  }

  const coordMatch = wpName.match(/^([NS])(\d{4,5})([EW])(\d{4,5})$/i);
  if (coordMatch) {
      let lat = parseInt(coordMatch[2], 10) / 100;
      let lon = parseInt(coordMatch[4], 10) / 100;
      if (coordMatch[1].toUpperCase() === 'S') lat = -lat;
      if (coordMatch[3].toUpperCase() === 'W') lon = -lon;
      return { lat, lon, name: wpName, isAirport: false };
  }
  
  if (wpName.length === 4 && wpName.match(/^[A-Z]{4}$/i)) {
      return { lat: 0, lon: 0, name: wpName, isAirport: true, unknown: true };
  }

  return null;
};

const getDistanceNM = (lat1, lon1, lat2, lon2) => {
  const R = 3440.065; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// SKEW-T 遅延入力 (分) の解釈 (確認ダイアログ用): 空欄・不正値は 0、
// 範囲は -120 (早発2時間) 〜 +720 (遅延12時間) に丸める。
const parseSkewTDelayMin = (value) => {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-120, Math.min(720, n));
};

// SKEW-T 作成確認ダイアログ (2026-11-13 UX変更): ヘッダーに常設していた
// 遅延入力欄を廃止し、SKEW-T ボタンを押したときだけ、このダイアログで
// 出発遅延 (分) を確認してから生成を始める。見た目は LoadDataModal に
// 揃えた (閉じるのは × ボタンと「キャンセル」のみで、背景クリックや
// Esc では閉じないのも LoadDataModal と同じ)。遅延の文字列 state は
// ダイアログ内に閉じ、開くたびに空 (= 0分) へ戻すので、前回入れた遅延が
// 次回に残ることはない。「作成」で解釈済みの分数を onConfirm(分) に渡す。
const SkewTDelayDialog = ({ isOpen, onClose, onConfirm, stdHours, stdMins, taxiOutMins }) => {
    const [text, setText] = useState('');
    useEffect(() => { if (isOpen) setText(''); }, [isOpen]);
    if (!isOpen) return null;

    const delayMin = parseSkewTDelayMin(text);
    const fmtHM = (totalMin) => {
        const m = ((totalMin % 1440) + 1440) % 1440;
        return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}Z`;
    };
    const baseDepMin = (Number(stdHours) || 0) * 60 + (Number(stdMins) || 0) + (Number(taxiOutMins) || 0);
    const summaryText = delayMin === 0
        ? '遅延なし（NAVLOGのETO通り）で計算します'
        : `全地点のETOを ${delayMin > 0 ? '+' : ''}${delayMin}分 ずらして計算します`;
    const depText = `離陸基準（STD + TAXI OUT）: ${fmtHM(baseDepMin)}${delayMin !== 0 ? ` → ${fmtHM(baseDepMin + delayMin)}` : ''}`;
    const chips = [0, 30, 60, 90, 120];

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 max-w-sm w-full shadow-2xl flex flex-col">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <SafeIcon name="CloudRain" className="w-5 h-5 text-teal-400" />
                        SKEW-T PDF作成
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl leading-none">&times;</button>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">出発遅延（分）</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={text}
                        onChange={(e) => setText(e.target.value.replace(/[^0-9-]/g, ''))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-center font-mono font-bold text-lg focus:outline-none focus:border-teal-400 transition-colors"
                    />
                    <span className="text-[10px] text-slate-400">マイナス値で早発（例: -30）。空欄は 0 分。範囲は -120〜+720 分に丸められます</span>
                    <div className="flex gap-1.5">
                        {chips.map((v) => (
                            <button
                                key={v}
                                onClick={() => setText(v === 0 ? '' : String(v))}
                                className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-colors ${delayMin === v ? 'bg-teal-600 border-teal-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                            >
                                {v === 0 ? '0' : `+${v}`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 mt-4 flex flex-col gap-0.5">
                    <span className="text-xs text-teal-300 font-bold">{summaryText}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{depText}</span>
                </div>

                <div className="flex gap-2 mt-4">
                    <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-lg transition-colors">
                        キャンセル
                    </button>
                    <button onClick={() => onConfirm(delayMin)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg">
                        <SafeIcon name="CloudRain" className="w-4 h-4" />
                        作成
                    </button>
                </div>
            </div>
        </div>
    );
};


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
  const tabs = ['DASHBOARD', 'TFC INFO', 'WX/MNM', 'RDR',  'ETOPS', 'NAVLOG', 'DOCS', 'スマカタ', 'REST CALC', 'APP CALC', 'TARMAC', 'XWIND', 'SID', 'TO LIMIT'];

  const [flightId, setFlightId] = useState(""); 
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false); 
  const [isDrmModalOpen, setIsDrmModalOpen] = useState(false); 
  const [isSmartCatModalOpen, setIsSmartCatModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isSkewTDialogOpen, setIsSkewTDialogOpen] = useState(false); 
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const pdfInputRef = useRef(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [navlogData, setNavlogData] = useState(null);
  const [skewTProgress, setSkewTProgress] = useState(null);
  // SKEW-T の遅延入力はボタン押下時の確認ダイアログ (SkewTDelayDialog) に
  // 移した (2026-11-13 UX変更)。遅延 state はダイアログ内に閉じて開くたび
  // 0 から始めるため、App 側での保持や新規読込時リセットは不要になった。

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
    // --- PWA update checks: launch check + once-a-day periodic check ---
    // The launch check (runUpdateCheck on mount) is the original behaviour
    // and always runs. On top of that, a daily gate keeps re-checks to at
    // most once every 24 h while the app stays open: the gate stores the
    // last check time in localStorage and is re-evaluated when the app
    // becomes visible again and on an hourly interval tick. Deciding from
    // the stored timestamp (not from counting timer firings) keeps the
    // 24 h spacing correct even when iOS throttles/suspends timers.
    if (!('serviceWorker' in navigator)) return;

    const LAST_CHECK_KEY = 'pwaLastUpdateCheck';
    const DAY_MS = 24 * 60 * 60 * 1000;

    const runUpdateCheck = () => {
        // Only attempt update if the browser is online. When offline the
        // timestamp is NOT stamped, so the next trigger retries the check.
        if (!navigator.onLine) return;
        // Stamp the time whenever a check actually runs (even if no
        // update is found): the gate limits check frequency, not updates.
        try { localStorage.setItem(LAST_CHECK_KEY, String(Date.now())); } catch (e) {}
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.update().then(() => {
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                }).catch(err => console.log('SW update check failed:', err));

                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (installingWorker) {
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                                }
                            }
                        };
                    }
                };
            }
        });
    };

    const isDailyCheckDue = () => {
        let last = 0;
        try { last = parseInt(localStorage.getItem(LAST_CHECK_KEY) || '0', 10) || 0; } catch (e) {}
        return Date.now() - last >= DAY_MS;
    };

    const runDailyCheckIfDue = () => {
        if (isDailyCheckDue()) runUpdateCheck();
    };

    // 1) Launch check: unchanged, always runs on mount (and stamps).
    runUpdateCheck();

    // Reload once when a new service worker takes control (as before).
    let refreshing = false;
    const onControllerChange = () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // 2) Daily-check triggers while the app stays open.
    const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') runDailyCheckIfDue();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = setInterval(runDailyCheckIfDue, 60 * 60 * 1000);

    return () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        clearInterval(intervalId);
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
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
      let backupNavlogData = null;
      if (navlogData) {
          // メモリを圧迫する巨大データ(PDF実体と座標)は LocalStorage に保存しない
          const { originalPdfBytes, textPositions, ...restNavlog } = navlogData;
          backupNavlogData = restNavlog;
      }
      
      const backup = { 
        state, flightId, navlogData: backupNavlogData,
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
    
    if (data.isTaxiFallback) {
        setTaxiOutMins(20);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'TAXI OUT時間が未記載のため、デフォルト(20分)を適用しました' }));
    } else {
        if (data.pTaxiOut !== undefined) setTaxiOutMins(data.pTaxiOut); else setTaxiOutMins(20);
    }
    if (data.pTaxiIn !== undefined) setTaxiInMins(data.pTaxiIn); else setTaxiInMins(5);
    
    if (data.route) setGlobalRoute(data.route);
    if (data.dest) setGlobalDest(data.dest); 
    if (data.etopsAltns) setGlobalEtopsAltns(data.etopsAltns); else setGlobalEtopsAltns([]);
    if (data.etopsTime) setGlobalEtopsTime(data.etopsTime); else setGlobalEtopsTime("");
    setGlobalEtops207(!!data.isEtops207);
    
    window.dispatchEvent(new CustomEvent('show-toast', { detail: 'フライトデータを全画面に反映しました！' }));
  };

  const parseNavlogPDFText = (text) => {
    text = text.replace(/[\u0391-\u03A9]/g, char => {
        const greekToLatin = {
            '\u0391': 'A', '\u0392': 'B', '\u0393': 'G', '\u0394': 'D', '\u0395': 'E', '\u0396': 'Z', '\u0397': 'H', '\u0398': 'Q',
            '\u0399': 'I', '\u039A': 'K', '\u039B': 'L', '\u039C': 'M', '\u039D': 'N', '\u039E': 'X', '\u039F': 'O', '\u03A0': 'P',
            '\u03A1': 'P',
            '\u03A3': 'S', '\u03A4': 'T', '\u03A5': 'Y', '\u03A6': 'F', '\u03A7': 'X', '\u03A8': 'Y', '\u03A9': 'W'
        };
        return greekToLatin[char] || char;
    });
    
    let newPlan = [];
    
    const fNoMatch = text.match(/(?:ANA|JAL|NCA|NH|JL)(\d{2,4}[A-Z]?)/i);
    let fNo = fNoMatch ? fNoMatch[0] : "UNKNOWN";
    let flightIdRaw = fNoMatch ? fNoMatch[1] : "";
    flightIdRaw = flightIdRaw.replace(/^0+/, '');
    if (flightIdRaw === '') flightIdRaw = '0';
    if (fNoMatch) {
      fNo = fNo.replace(/\d{2,4}/, flightIdRaw);
    }
    
    const routeMatch = text.match(/([A-Z]{4})\s*-\s*([A-Z]{4})/i);
    const rInfo = routeMatch ? `${routeMatch[1]} - ${routeMatch[2]}` : "UNKNOWN";
    let depIcao = routeMatch ? routeMatch[1] : null; 
    const destIcao = routeMatch ? routeMatch[2] : null;
    const regMatch = text.match(/(JA\d{3}[A-Z]?)/i);
    const pReg = regMatch ? regMatch[1] : "JA796A";

    const isEtops207 = /ETOPS\s*\/\s*207|207MIN\s+ETOPS/i.test(text);

    let ptow, pldw, pPzfw = 400.0, alt, isa = 0, toElev, ldElev, fltTimeH, fltTimeM, stdH, stdM, staH, staM;
    let pTaxiOut = 20, pTaxiIn = 5;
    let isTaxiFallback = false;

    const zfwMatch = text.match(/(?:ZFW|PZFW)\s+([0-9,.]+)/i);
    if (zfwMatch) {
      let v = parseFloat(zfwMatch[1].replace(/,/g, ''));
      if (v > 2000) v = v / 1000;
      pPzfw = v;
    }
    const ptowMatch = text.match(/(?:PTOW|TOW)\s+([0-9,.]+)/i);
    if (ptowMatch) {
      let v = parseFloat(ptowMatch[1].replace(/,/g, ''));
      if (v > 2000) v = Math.round(v / 1000);
      ptow = v;
    }
    const pldwMatch = text.match(/(?:PLDW|LDW|LAW)\s+([0-9,.]+)/i);
    if (pldwMatch) {
      let v = parseFloat(pldwMatch[1].replace(/,/g, ''));
      if (v > 2000) v = Math.round(v / 1000);
      pldw = v;
    }

    const crzMatch = text.match(/(?:CRZ|LVL)\s+(?:SYS\s+)?(?:FL)?(\d{3})/i);
    if (crzMatch) alt = parseInt(crzMatch[1], 10) * 100;
    
    const isaMatch = text.match(/ISA\s*([PM+-])\s*(\d{1,2})/i);
    if (isaMatch) {
      let val = parseInt(isaMatch[2], 10);
      if (isaMatch[1] === '-' || isaMatch[1].toUpperCase() === 'M') val = -val;
      isa = val;
    }
    
    const elevRegex = /ELEV\s+(\d{1,4})/gi;
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

    const stdMatch = text.match(/STD\s+(\d{2})\.?(\d{2})/i);
    if (stdMatch) {
      stdH = parseInt(stdMatch[1], 10);
      stdM = parseInt(stdMatch[2], 10);
    }

    const staMatch = text.match(/STA\s+(\d{2})(\d{2})Z/i) || text.match(/STA\s+(\d{2})\.?(\d{2})/i);
    if (staMatch) {
      staH = parseInt(staMatch[1], 10);
      staM = parseInt(staMatch[2], 10);
    }

    const taxiRegex = /(?:AVG|TAXI|OUT|CONX)[\s\S]*?(\d+)\/(\d+)MIN\s*AVG:\s*(\d+)\/(\d+)MIN/i;
    const matchFull = text.match(taxiRegex);
    if (matchFull) {
        pTaxiOut = parseInt(matchFull[3], 10) || 20;
        pTaxiIn = parseInt(matchFull[4], 10) || 5;
    } else {
        const taxiMatch = text.match(/AVG:\s*(\d+)\/(\d+)MIN/i) || text.match(/(?:AVG|TAXI|OUT)[^\d]*(\d+)\/(\d+)MIN/i);
        if (taxiMatch) {
            pTaxiOut = parseInt(taxiMatch[1], 10) || 20;
            pTaxiIn = parseInt(taxiMatch[2], 10) || 5;
        } else {
            isTaxiFallback = true;
            pTaxiOut = 20;
            pTaxiIn = 5;
        }
    }

    const dateMatch = text.match(/\b(\d{2}[A-Z]{3}\d{2})\b/i);
    const pDate = dateMatch ? dateMatch[1] : "";

    let pCrewCount = 2;
    const crewMatch = text.match(/CREW\s+(\d{2})\//i);
    if (crewMatch) {
      pCrewCount = parseInt(crewMatch[1], 10);
    }

    const etopsSectionIndex = text.indexOf('-ETP/EEP/EXP/ET.LT');
    let etopsData = null;
    let eepCtme = null;
    let expCtme = null;
    let extractedEtopsAltns = [];
    
    if (etopsSectionIndex !== -1) {
      const nextSectionMatch = text.substring(etopsSectionIndex + 1).match(/(?:\s|\n)-[A-Z]/);
      const nextSectionIndex = nextSectionMatch ? nextSectionMatch.index : -1;
      const etopsText = nextSectionIndex !== -1 
          ? text.substring(etopsSectionIndex, etopsSectionIndex + 1 + nextSectionIndex)
          : text.substring(etopsSectionIndex);

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

      if (etopsData.length === 0) {
          etopsData = null;
      } else {
          const firstEt = etopsData[0].et;
          const lastLt = etopsData[etopsData.length - 1].lt;
          if (firstEt && firstEt.length === 4) {
              eepCtme = parseInt(firstEt.substring(0, 2), 10) * 60 + parseInt(firstEt.substring(2, 4), 10);
          }
          if (lastLt && lastLt.length === 4) {
              expCtme = parseInt(lastLt.substring(0, 2), 10) * 60 + parseInt(lastLt.substring(2, 4), 10);
          }
      }

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

    let pendingLat = null; 
    let pendingLatLon = null;

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
        
        const latMatch = cleanToken.match(/^[NS]\d{4,6}(?:\.\d+)?$/i);
        if (latMatch) {
            pendingLat = cleanToken;
        }
        const lonMatch = cleanToken.match(/^[EW]\d{4,7}(?:\.\d+)?$/i);
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
        const latLonMatch = cleanToken.match(/^[NS]\d{4,6}(?:\.\d+)?[EW]\d{4,7}(?:\.\d+)?$/i);
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

        const isCoord = /^[NS]\d{4,5}[EW]\d{4,6}$/i.test(cleanToken);
        const isAlphaWp = /^[A-Z][A-Z0-9]{1,5}$/i.test(cleanToken) && !ignoreList.has(cleanToken);
        const isArincWp = /^\d{2}[NSWE]\d{2}$/i.test(cleanToken);
        const isShorthandCoord = /^\d{2}[A-Z]\d{2}$|^\d{4}[A-Z]$|^\d{2}[NS]\d{2}[EW]$/i.test(cleanToken);
        const isSpecialWp = ["TOC", "TOD"].includes(cleanToken);

        if (!isCoord && (isAlphaWp || isArincWp || isShorthandCoord || isSpecialWp)) {
            if (recentTimes.length === 0 && !isSpecialWp) {
                continue; 
            }

            let ctme = recentTimes.length > 0 ? recentTimes[0] : 0;
            let rtme = recentTimes.length > 1 ? recentTimes[1] : 0;
            if (recentTimes.length === 1) rtme = 0; 

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
                if (currentWpIsa > 40 || currentWpIsa < -40) {
                    currentWpIsa = isa;
                }
              }
            }

            let uniqueTasGs = [...new Set(pendingTasGs)];
            let parsedGs = uniqueTasGs.length > 0 ? uniqueTasGs[0] : "";
            let parsedTas = uniqueTasGs.length > 1 ? uniqueTasGs[1] : "";

            newPlan.push({ 
              wp: cleanToken, 
              latLon: pendingLatLon,
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
              isOffRoute: isOffRoute
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

    if (depIcao && newPlan.length > 0 && newPlan[0].latLon) {
        const depCoord = parseWaypointToLatLng(newPlan[0]);
        const nextWpCoord = newPlan.length > 1 ? parseWaypointToLatLng(newPlan[1]) : null;
        if (depCoord && nextWpCoord && depCoord.name === depIcao) {
            const dist = getDistanceNM(depCoord.lat, depCoord.lon, nextWpCoord.lat, nextWpCoord.lon);
            if (dist > 3000) {
                 console.warn("出発空港の誤抽出を検知しました:", depIcao);
                 newPlan.shift();
                 depIcao = newPlan.length > 0 ? newPlan[0].wp : null;
            }
        }
    }

    let eetList = [];
    const eetSectionMatch = text.match(/EET\/([\s\S]*?)(?=\s-[A-Z]{3}|\r?\n\r?\n|RMK\/|SEL\/|CODE\/|REG\/|OPR\/|$)/i);
    if (eetSectionMatch) {
        const eetText = eetSectionMatch[1];
        const regex = /([A-Z]{4})(\d{4})/g;
        let match;
        while ((match = regex.exec(eetText)) !== null) {
            const fir = match[1];
            const timeStr = match[2];
            const mins = parseInt(timeStr.substring(0, 2), 10) * 60 + parseInt(timeStr.substring(2, 4), 10);
            eetList.push({ fir, timeStr, mins });
        }
        eetList.sort((a, b) => a.mins - b.mins);
    }

    return { 
        newPlan, fNo, flightIdRaw, flightId: flightIdRaw, rInfo, depIcao, destIcao, dest: destIcao, pReg, pPzfw, pTaxiOut, pTaxiIn, pDate, 
        ptow, pldw, alt, isa, toElev, ldElev, fltTimeH, fltTimeM, stdH, stdM, staH, staM, pCrewCount,
        fullRouteStr, route: fullRouteStr, etopsAltns: extractedEtopsAltns, isEtops207, loadId: Date.now(), parsedEtopsInfo,
        isTaxiFallback, eetList
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
        
        // ★データ所有権(Detached ArrayBuffer)が奪われないように完全に分離(slice)する
        const buffer = event.target.result;
        const pdfJsArray = new Uint8Array(buffer.slice(0));
        const exportArray = new Uint8Array(buffer.slice(0));
        
        const pdf = await window.pdfjsLib.getDocument(pdfJsArray).promise;
        
        let fullText = "";
        let textPositions = []; 
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          content.items.forEach(item => {
              if (item && typeof item.str === 'string') {
                  fullText += item.str + " ";
                  if (item.str.trim().length >= 3 && item.transform) {
                      textPositions.push({
                          str: item.str.trim(),
                          page: i - 1,
                          x: item.transform[4],
                          y: item.transform[5]
                      });
                  }
              }
          });
          fullText += "\n";
        }

        const parsedData = parseNavlogPDFText(fullText);
        
        if (parsedData.newPlan.length > 0) {
            parsedData.isNew = true; 
            
            // クラッシュ回避: 分離したバイナリをメモリに保持
            parsedData.originalPdfBytes = exportArray; 
            parsedData.textPositions = textPositions; 
            
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
  
  const handleGenerateSkewTPdf = async (delayMinArg = 0) => {
    if (!navlogData || !navlogData.newPlan || navlogData.newPlan.length === 0) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: '先にNAVLOGを読み込んでください' }));
        return;
    }

    if (skewTProgress !== null) return; // 処理中はブロック

    // 出発遅延 (分): 確認ダイアログで確定した値を引数で受け取る。
    // ダイアログ側で解釈済みだが、範囲外・不正値はここでも丸める。
    const delayMin = Number.isFinite(delayMinArg) ? Math.max(-120, Math.min(720, Math.trunc(delayMinArg))) : 0;

    const plan = navlogData.newPlan;

    // 累積距離 (NM): プラン各行の dist (レグ距離) を積算
    const cumDistByIndex = [];
    {
        let acc = 0;
        for (let i = 0; i < plan.length; i++) {
            const d = Number(plan[i].dist);
            if (Number.isFinite(d) && d > 0) acc += d;
            cumDistByIndex[i] = acc;
        }
    }

    let selectedWps = [];
    let lastLat = null;
    let lastLon = null;

    // ウェイポイントの選定 (100NM間隔) — 従来と同一ロジック
    for (let i = 0; i < plan.length; i++) {
        const wp = plan[i];
        const coord = parseWaypointToLatLng(wp);
        if (coord && coord.lat !== null && coord.lon !== null && (coord.lat !== 0 || coord.lon !== 0)) {
            if (selectedWps.length === 0) {
                selectedWps.push({ ...wp, ...coord, cumDist: cumDistByIndex[i] });
                lastLat = coord.lat;
                lastLon = coord.lon;
            } else {
                const dist = getDistanceNM(lastLat, lastLon, coord.lat, coord.lon);
                // 100NM以上離れているか、最後のウェイポイントなら追加
                if (dist >= 100 || i === plan.length - 1) {
                    selectedWps.push({ ...wp, ...coord, cumDist: cumDistByIndex[i] });
                    lastLat = coord.lat;
                    lastLon = coord.lon;
                }
            }
        }
    }

    // ---- 出発空港ページの保証 (2026-11-13 ハンドラ v3) -------------------
    // CFP の NAVLOG 表では出発空港の行に座標が付かない (ANA0204 の実データで
    // 確認: パーサの newPlan 先頭は空港ではなく SID フィックス DF158 になる)。
    // そのため最初の選択地点が空港から遠く離れることがある。ここで出発空港を
    // 先頭に必ず1ページ置く。座標の出どころは優先順に:
    //   (1) プラン行に出発空港と同名で座標のある行があれば、その座標
    //   (2) アプリの空港座標テーブル ICAO_COORDS (./data/flightData)
    // どちらも無い場合は追加しない (無関係なウェイポイントの座標を空港の
    // ページとして流用することはしない)。ETO は ctme = 0 として計算される
    // ため、離陸時刻 (STD + taxiOut) がそのまま使われる。先頭に来るので
    // 詳細ホドグラフも自動的に付く (detailed は先頭/末尾ページで判定)。
    const depIcaoCode = navlogData.depIcao || null;
    let depPos = null;
    if (depIcaoCode) {
        for (const row of plan) {
            if (row.wp === depIcaoCode) {
                const c = parseWaypointToLatLng(row);
                if (c && (c.lat !== 0 || c.lon !== 0)) depPos = { lat: c.lat, lon: c.lon };
                break;
            }
        }
        if (!depPos && typeof ICAO_COORDS !== 'undefined' && ICAO_COORDS && ICAO_COORDS[depIcaoCode]) {
            const e = ICAO_COORDS[depIcaoCode];
            if (Number.isFinite(e.lat) && Number.isFinite(e.lon)) depPos = { lat: e.lat, lon: e.lon };
        }
    }
    if (depPos) {
        const firstSel = selectedWps.length > 0 ? selectedWps[0] : null;
        const firstIsDep = !!firstSel && (firstSel.wp === depIcaoCode ||
            getDistanceNM(firstSel.lat, firstSel.lon, depPos.lat, depPos.lon) <= 1);
        if (!firstIsDep) {
            selectedWps.unshift({
                wp: depIcaoCode, latLon: null, ctme: 0, dist: 0,
                lat: depPos.lat, lon: depPos.lon, cumDist: 0,
                isDepartureAirport: true,
            });
        }
    }

    // ---- 到着空港ページの保証 (2026-11-13 ハンドラ v6) -------------------
    // v3 の出発空港保証と対になる保証。到着側には構造的な弱点がある:
    // パーサは到着空港の名前トークンを push した直後に走査を打ち切る
    // (break) ため、到着行の座標は「名前より前に現れた pendingLatLon」
    // として付いている場合にしか残らない。CFP の発行条件によって座標
    // トークンが名前の後に来る並びになると latLon が付かず、parseWaypoint
    // ToLatLng が {lat: 0, lon: 0} を返し、選択段の 0,0 フィルタで到着
    // ページが静かに落ちて、最後のページがエンルートフィックスになって
    // しまう (実例: ANA0012 RJAA→KORD で到着ページが出なかった)。
    // ここで到着空港を末尾に必ず1ページ置く。座標の出どころは出発側と
    // 同じ優先順:
    //   (1) プラン行に到着空港と同名で座標のある行があれば、その座標
    //   (2) アプリの空港座標テーブル ICAO_COORDS (./data/flightData)
    // どちらも無い場合は追加しない (出発側と同じ方針)。
    // ctme は到着行の ctme (取れなければプランの最大 ctme) を使い、ETO
    // が到着時刻に合うようにする。cumDist は航路総距離 (cumDist の最終
    // 値) とし、ページ見出しの距離表示が総距離になるようにする。末尾に
    // 来るので詳細ホドグラフも自動的に付く (detailed は先頭/末尾で判定)。
    const destIcaoCode = navlogData.destIcao || null;
    let arrPos = null;
    let destRowCtme = null;
    if (destIcaoCode) {
        for (const row of plan) {
            if (row.wp === destIcaoCode) {
                const c = parseWaypointToLatLng(row);
                if (c && (c.lat !== 0 || c.lon !== 0)) arrPos = { lat: c.lat, lon: c.lon };
                const rc = Number(row.ctme);
                if (Number.isFinite(rc)) destRowCtme = rc;
                break;
            }
        }
        if (!arrPos && typeof ICAO_COORDS !== 'undefined' && ICAO_COORDS && ICAO_COORDS[destIcaoCode]) {
            const e = ICAO_COORDS[destIcaoCode];
            if (Number.isFinite(e.lat) && Number.isFinite(e.lon)) arrPos = { lat: e.lat, lon: e.lon };
        }
    }
    if (arrPos) {
        const lastSel = selectedWps.length > 0 ? selectedWps[selectedWps.length - 1] : null;
        const lastIsArr = !!lastSel && (lastSel.wp === destIcaoCode ||
            getDistanceNM(lastSel.lat, lastSel.lon, arrPos.lat, arrPos.lon) <= 1);
        if (!lastIsArr) {
            let arrCtme = (destRowCtme !== null && destRowCtme > 0) ? destRowCtme : null;
            if (arrCtme === null) {
                arrCtme = 0;
                for (const row of plan) {
                    const c = Number(row.ctme);
                    if (Number.isFinite(c) && c > arrCtme) arrCtme = c;
                }
            }
            const totalDist = cumDistByIndex.length > 0 ? cumDistByIndex[cumDistByIndex.length - 1] : 0;
            selectedWps.push({
                wp: destIcaoCode, latLon: null, ctme: arrCtme, dist: 0,
                lat: arrPos.lat, lon: arrPos.lon, cumDist: totalDist,
                isArrivalAirport: true,
            });
        }
    }

    if (selectedWps.length === 0) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: '有効なウェイポイントが見つかりません' }));
        return;
    }

    setSkewTProgress(0); // 進捗開始
    window.dispatchEvent(new CustomEvent('show-toast', { detail: '画像をダウンロードしてPDFに埋め込んでいます。しばらくお待ちください...' }));

    // ---- ETO の基準時刻を決める -------------------------------------------
    // フライト日は NAVLOG 解析結果の pDate ("02NOV26" = DDMMMYY) から取る。
    // 取れない場合は今日 (UTC) で代替する (STD は Z 表示として扱う)。
    const MONTHS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let baseMs = null;
    const dm = /^(\d{2})([A-Z]{3})(\d{2})$/i.exec((navlogData.pDate || '').trim());
    if (dm && MONTHS[dm[2].toUpperCase()] !== undefined) {
        baseMs = Date.UTC(2000 + Number(dm[3]), MONTHS[dm[2].toUpperCase()], Number(dm[1]), stdHours, stdMins);
    } else {
        const today = new Date();
        baseMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), stdHours, stdMins);
    }
    baseMs += (Number(taxiOutMins) || 0) * 60000; // STD + taxi-out = 離陸時刻
    baseMs += delayMin * 60000; // 出発遅延を反映 (全地点の ETO が同じだけずれる。出発空港ページは ctme = 0 なので離陸時刻そのものがずれる)

    const fmtLat = (lat) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
    const fmtLon = (lon) => `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
    const fmtValid = (date) =>
        `valid ${String(date.getUTCHours()).padStart(2, '0')}z ${String(date.getUTCDate()).padStart(2, '0')} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    const fmtEto = (date) =>
        `${String(date.getUTCDate()).padStart(2, '0')} ${MONTH_NAMES[date.getUTCMonth()]} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}Z`;

    // 描画済みキャンバスが (ほぼ) 白紙かどうかを粗いサンプリングで判定する。
    // 通常のページは非白ピクセルが約4%あるため、0.3%未満を白紙とみなす。
    const isBlankPageCanvas = (cv) => {
        try {
            const data = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
            let n = 0, ink = 0;
            for (let y = 0; y < cv.height; y += 8) {
                const rowStart = y * cv.width * 4;
                for (let x = 0; x < cv.width; x += 8) {
                    const i = rowStart + x * 4;
                    n++;
                    if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) ink++;
                }
            }
            return n === 0 || (ink / n) < 0.003;
        } catch (e) {
            return false; // 判定できない場合はページを出す側に倒す
        }
    };

    // ---- ウェイポイントごとにプロファイル取得 + ページ描画 ----------------
    const pageImages = []; // { wp, dataUrl }
    const skippedWps = []; // プロファイル欠落・白紙・描画エラーで省略した地点
    let doneCount = 0;

    for (let wi = 0; wi < selectedWps.length; wi++) {
        const wp = selectedWps[wi];
        try {
            // ETO = 離陸時刻 + ctme (分)。最寄りの正時へ丸めた ETO のみ使う。
            const etoMs = baseMs + (Number(wp.ctme) || 0) * 60000;
            const roundedMs = Math.round(etoMs / 3600000) * 3600000;
            const etoDate = new Date(roundedMs);

            // このウェイポイントのプロファイルを1回だけ取得 (ETO±1h)
            const profiles = await fetchProfiles(
                wp.lat, wp.lon,
                new Date(roundedMs - 3600000), new Date(roundedMs + 3600000));
            const profile = profiles[hourKey(etoDate)] || null;

            if (profile) {
                const detailed = (wi === 0 || wi === selectedWps.length - 1);
                // A4縦 (1754x2480 px) のページに ETO パネル1枚を描く
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = 1754;
                pageCanvas.height = 2480;
                renderWaypointPagePortrait(pageCanvas, {
                    wp: {
                        name: wp.wp,
                        lat: wp.lat,
                        lon: wp.lon,
                        header: `${flightId ? 'ANA' + flightId : 'Flight'} ${navlogData.depIcao || ''}-${navlogData.destIcao || ''}  —  ${wp.wp}  ${fmtLat(wp.lat)}, ${fmtLon(wp.lon)}  dist ${Math.round(wp.cumDist || 0)} NM`,
                        subline: `ETO ${fmtEto(new Date(etoMs))}  —  ${fmtValid(etoDate)}`,
                        panelTitle: `GFS Sounding ${fmtLat(wp.lat)}, ${fmtLon(wp.lon)}`,
                        validLabel: fmtValid(etoDate),
                        footer: 'Data: Open-Meteo GFS (gfs_seamless). Panel: ETO only (rounded to the nearest hour). Hodograph (≤5,000 ft) on departure/arrival pages only.',
                    },
                    profile,
                    detailed,
                });
                if (isBlankPageCanvas(pageCanvas)) {
                    // 白紙ページは出さず、省略として数える
                    skippedWps.push(wp.wp);
                } else {
                    pageImages.push({ wp, dataUrl: pageCanvas.toDataURL('image/png') });
                }
            } else {
                // プロファイルが取れなかった地点は無言で落とさず記録する
                skippedWps.push(wp.wp);
            }
        } catch (err) {
            console.error('SKEW-T render failed for waypoint', wp.wp, err);
            skippedWps.push(wp.wp);
        }
        doneCount++;
        setSkewTProgress(Math.round((doneCount / selectedWps.length) * 100));
    }

    if (pageImages.length === 0) {
        setSkewTProgress(null); // 進捗終了
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'SKEW-Tデータの取得に失敗しました。通信環境を確認してください。' }));
        return;
    }

    // ---- PDF を pdf-lib で直接組み立てる (2026-11-13 ハンドラ v2) ----------
    // 旧方式は印刷用 HTML をポップアップ (window.open) に流し込み、その自動
    // 印刷で PDF 化していたが、iPad では2つの問題が出た:
    //  (1) ページ数が倍になる: iOS Safari の印刷は @page { margin: 6mm } を
    //      前提にした寸法では改ページせず、自前の印刷可能領域を使うため、
    //      幅100%にした画像の高さが僅かにはみ出し、画像下端の細片だけの
    //      ページが1地点ごとに挟まった (実測: 28地点→56ページ)。
    //  (2) 印刷ウィンドウが消せない: スタンドアロン PWA では window.open が
    //      アプリの上に被さるシートになり、閉じる手段がなく、アプリを
    //      終了しないと元の画面に戻れなかった。
    // そこで pdf-lib で A4縦・1地点1ページの PDF をその場で組み立て、
    // 共有シート (navigator.share) またはダウンロードで渡す方式に変更した。
    // ページ数は地点数と必ず一致し、ポップアップも印刷も使わない。
    // pdf-lib の読み込みは NavlogView の EXPORT と同じ CDN 遅延ロード方式。
    setSkewTProgress(null); // 進捗終了

    // 省略した地点があれば、無言にせず完了時に知らせる
    if (skippedWps.length > 0) {
        window.dispatchEvent(new CustomEvent('show-toast', {
            detail: `${skippedWps.length}地点（${skippedWps.join('、')}）はデータが取れず省略しました`,
        }));
    }

    const pdfFileName = `SKEW-T_Report_-_${flightId ? 'ANA' + flightId : 'Flight'}.pdf`;

    const loadPdfLib = () => new Promise((resolve, reject) => {
        if (window.PDFLib) { resolve(window.PDFLib); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
        script.onload = () => resolve(window.PDFLib);
        script.onerror = () => reject(new Error('pdf-lib の読み込みに失敗しました'));
        document.head.appendChild(script);
    });

    const dataUrlToBytes = (dataUrl) => {
        const bin = atob(dataUrl.split(',')[1]);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
    };

    try {
        const { PDFDocument } = await loadPdfLib();
        const pdfDoc = await PDFDocument.create();
        pdfDoc.setTitle(`SKEW-T Report - ${flightId ? 'ANA' + flightId : 'Flight'}`);
        // A4縦 (595.28 x 841.89 pt)、余白 6mm = 17.01 pt
        const PAGE_W = 595.28;
        const PAGE_H = 841.89;
        const MARGIN = 17.01;
        const contentW = PAGE_W - MARGIN * 2;
        const contentH = PAGE_H - MARGIN * 2;
        for (const page of pageImages) {
            const png = await pdfDoc.embedPng(dataUrlToBytes(page.dataUrl));
            // 画像 (1754x2480) を余白内に収まるよう等比縮小する。幅基準では
            // 561.26 x 793.66 pt となり、高さ上限 807.87 pt にも余裕で収まる。
            const scale = Math.min(contentW / png.width, contentH / png.height);
            const drawW = png.width * scale;
            const drawH = png.height * scale;
            const pdfPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
            pdfPage.drawImage(png, {
                x: (PAGE_W - drawW) / 2,
                y: PAGE_H - MARGIN - drawH,
                width: drawW,
                height: drawH,
            });
        }
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

        // 渡し方: まず共有シート (iPad では「ファイルに保存」等が選べる)。
        // ユーザー操作の有効期限切れなどで共有が使えない場合は
        // ダウンロードに自動で切り替える。キャンセル時は切り替えない。
        let delivered = false;
        try {
            const file = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file] });
                delivered = true;
            }
        } catch (shareErr) {
            if (shareErr && shareErr.name === 'AbortError') delivered = true;
        }
        if (!delivered) {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = pdfFileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        window.dispatchEvent(new CustomEvent('show-toast', { detail: delayMin !== 0
            ? `SKEW-T PDFを作成しました（${pageImages.length}ページ、遅延${delayMin > 0 ? '+' : ''}${delayMin}分で計算）`
            : `SKEW-T PDFを作成しました（${pageImages.length}ページ）` }));
    } catch (pdfErr) {
        console.error('SKEW-T PDF build failed', pdfErr);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDFの作成に失敗しました。通信環境を確認してください。' }));
    }
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

      <SkewTDelayDialog
        isOpen={isSkewTDialogOpen}
        onClose={() => setIsSkewTDialogOpen(false)}
        onConfirm={(d) => { setIsSkewTDialogOpen(false); handleGenerateSkewTPdf(d); }}
        stdHours={stdHours}
        stdMins={stdMins}
        taxiOutMins={taxiOutMins}
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
            
          

<div className="flex items-center gap-2 ml-auto relative">
                {/* SHAREボタン */}
                <button onClick={() => setShowQR(!showQR)} className="bg-blue-900/60 hover:bg-blue-600 text-blue-200 hover:text-white px-2 py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border border-blue-500/50 hover:border-blue-400 shadow-sm shrink-0" title="アプリを共有">
                    <SafeIcon name="QrCode" className="w-2.5 h-2.5 pointer-events-none" />
                    <span className="text-[8px] sm:text-[9px] font-black tracking-widest leading-none mt-[1px] pointer-events-none">SHARE</span>
                </button>
                
                {/* RESETボタン */}
                <button onClick={handleResetAll} className="bg-rose-900/60 hover:bg-rose-600 text-rose-200 hover:text-white px-2 py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border border-rose-500/50 hover:border-rose-400 shadow-sm shrink-0" title="すべての入力データをリセット">
                    <SafeIcon name="Trash2" className="w-2.5 h-2.5 pointer-events-none" />
                    <span className="text-[8px] sm:text-[9px] font-black tracking-widest leading-none mt-[1px] pointer-events-none">RESET</span>
                </button>

                {/* QRコードのポップアップ表示 */}
                {showQR && (
                    <>
                        {/* 画面外クリック検知用のバックドロップ */}
                        <div 
                            className="fixed inset-0 z-[998]" 
                            onClick={() => setShowQR(false)}
                        ></div>
                        <div className="absolute top-full right-0 mt-2 p-2 bg-white rounded-xl shadow-2xl z-[999] border border-slate-300 animate-in fade-in zoom-in-95">
                            <img 
                                 src="/QR.png" 
                                alt="Share QR Code" 
                                className="w-32 h-32 md:w-40 md:h-40 rounded-lg object-contain" 
                            />
                            <div className="text-center mt-1 text-slate-800 text-[10px] font-bold">スキャンして共有</div>
                        </div>
                    </>
                )}
            </div>

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

              {/* SKEW-T 追加ボタン */}
              <button 
                onClick={() => {
                  if (!navlogData || !navlogData.newPlan || navlogData.newPlan.length === 0) {
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: '先にNAVLOGを読み込んでください' }));
                    return;
                  }
                  setIsSkewTDialogOpen(true);
                }} 
                disabled={skewTProgress !== null}
                className="bg-slate-700 hover:bg-teal-600 disabled:bg-teal-900 disabled:opacity-80 text-teal-400 hover:text-white px-2 py-1 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 hover:border-teal-400 shadow-sm shrink-0 relative overflow-hidden" 
                title="Skew-T PDF作成"
              >
                {skewTProgress !== null && (
                    <div className="absolute left-0 top-0 bottom-0 bg-teal-500/40" style={{ width: `${skewTProgress}%`, transition: 'width 0.3s ease-out' }}></div>
                )}
                <SafeIcon name={skewTProgress !== null ? "Loader2" : "CloudRain"} className={`w-3 h-3 pointer-events-none relative z-10 ${skewTProgress !== null ? "animate-spin" : ""}`} />
                <span className="text-[9px] sm:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none relative z-10">
                    {skewTProgress !== null ? `DL ${skewTProgress}%` : 'SKEW-T'}
                </span>
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
                  <span className="leading-none">スマカタ</span>
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
        {activeTab === 'DOCS' && (<div className="flex flex-col gap-1 w-full h-full"><Docs2View /></div>)}
        {activeTab === 'TARMAC' && (<div className="flex flex-col gap-1 w-full h-full"><TarmacView /></div>)}
        {activeTab === 'REST CALC' && (<div className="flex flex-col gap-1 w-full h-full"><RestView flightHours={restCrewSize === 3 ? restFlightHours3 : restFlightHours4} setFlightHours={restCrewSize === 3 ? setRestFlightHours3 : setRestFlightHours4} flightMins={restCrewSize === 3 ? restFlightMins3 : restFlightMins4} setFlightMins={restCrewSize === 3 ? setRestFlightMins3 : setRestFlightMins4} stdHours={stdHours} setStdHours={setStdHours} stdMins={stdMins} setStdMins={setStdMins} isTakeoffAuto={isTakeoffAuto} setIsTakeoffAuto={setIsTakeoffAuto} takeoffHours={restTakeoffHours} setTakeoffHours={setRestTakeoffHours} takeoffMins={restTakeoffMins} setTakeoffMins={setRestTakeoffMins} offsetMins={restOffsetMins} setOffsetMins={setRestOffsetMins} landingOffsetMins={restLandingOffsetMins} setLandingOffsetMins={setRestLandingOffsetMins} crewSize={restCrewSize} setCrewSize={setRestCrewSize} firstRestMins={restFirstRestMins} setFirstRestMins={setRestFirstRestMins} lastRestMins={restLastRestMins} setLastRestMins={setLastRestMins} firstHalfMins={restFirstHalfMins} setFirstHalfMins={setFirstHalfMins} taxiOutMins={taxiOutMins} /></div>)}
        {activeTab === 'APP CALC' && (<div className="flex flex-col gap-1 w-full h-full"><ApproachCalcView /></div>)}
        {activeTab === 'XWIND' && (<div className="flex flex-col gap-1 w-full h-full mt-0.5"><XwindView /></div>)}
        {activeTab === 'SID' && (<div className="flex flex-col gap-1 w-full h-full"><SidView state={state} /></div>)}
        {activeTab === 'RDR' && (<div className="flex flex-col gap-1 w-full h-full"><WeatherRadarView navlogData={navlogData} /></div>)}
        {activeTab === 'TO LIMIT' && (<div className="flex flex-col gap-1 w-full h-full"><TOLView navlogData={navlogData} /></div>)}
       </div>
    </div>
  );
}