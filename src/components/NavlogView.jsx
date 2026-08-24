// NavlogView.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SafeIcon } from './SharedComponents';

const ICAO_COORDS = {
    "RJTT": { lat: 35.5494, lon: 139.7798 },
    "RJAA": { lat: 35.7647, lon: 140.3863 },
    "RJCC": { lat: 42.7752, lon: 141.6925 },
    "RJBB": { lat: 34.4347, lon: 135.2442 },
    "RJOO": { lat: 34.7855, lon: 135.4382 },
    "ROAH": { lat: 26.1958, lon: 127.6458 },
    "RJFF": { lat: 33.5859, lon: 130.4506 },
    "KJFK": { lat: 40.6413, lon: -73.7781 },
    "KIAD": { lat: 38.9445, lon: -77.4558 },
    "KORD": { lat: 41.9742, lon: -87.9073 },
    "KIAH": { lat: 29.9805, lon: -95.3397 },
    "KLAX": { lat: 33.9416, lon: -118.4085 },
    "KSFO": { lat: 37.6213, lon: -122.3790 },
    "KSEA": { lat: 47.4489, lon: -122.3090 },
    "PHNL": { lat: 21.3187, lon: -157.9225 },
    "CYVR": { lat: 49.1967, lon: -123.1815 },
    "MMMX": { lat: 19.4361, lon: -99.0719 },
    "LFPG": { lat: 49.0097, lon: 2.5479 },
    "EGLL": { lat: 51.4700, lon: -0.4543 },
    "EDDF": { lat: 50.0379, lon: 8.5622 },
    "EDDM": { lat: 48.3538, lon: 11.7861 },
    "LOWW": { lat: 48.1103, lon: 16.5697 },
    "EBBR": { lat: 50.9014, lon: 4.4844 },
    "ESSA": { lat: 59.6519, lon: 17.9186 },
    "LIMC": { lat: 45.6301, lon: 8.7231 },
    "LTFM": { lat: 41.2753, lon: 28.7520 },
    "YSSY": { lat: -33.9461, lon: 151.1772 },
    "YPPH": { lat: -31.9403, lon: 115.9668 },
    "VHHH": { lat: 22.3080, lon: 113.9185 },
    "WSSS": { lat: 1.3644, lon: 103.9915 },
    "VTBS": { lat: 13.6900, lon: 100.7501 },
    "RCTP": { lat: 25.0777, lon: 121.2328 },
    "RCSS": { lat: 25.0697, lon: 121.5520 },
    "RKSI": { lat: 37.4602, lon: 126.4407 },
    "RKSS": { lat: 37.5583, lon: 126.7906 },
    "ZBAA": { lat: 40.0799, lon: 116.6031 },
    "ZSPD": { lat: 31.1443, lon: 121.8083 },
    "ZSSS": { lat: 31.1979, lon: 121.3363 },
    "ZGGG": { lat: 23.3924, lon: 113.2988 },
    "ZSAM": { lat: 24.5440, lon: 118.1277 },
    "ZSHC": { lat: 30.2295, lon: 120.4345 },
    "ZGSZ": { lat: 22.6393, lon: 113.8107 },
    "ZYTL": { lat: 38.9657, lon: 121.5386 },
    "WMKK": { lat: 2.7456, lon: 101.7099 },
    "WIII": { lat: -6.1256, lon: 106.6559 },
    "VVTS": { lat: 10.8188, lon: 106.6520 },
    "VVNB": { lat: 21.2212, lon: 105.8072 },
    "RPLL": { lat: 14.5086, lon: 121.0194 },
    "VYYY": { lat: 16.9022, lon: 96.1332 },
    "VDPP": { lat: 11.5466, lon: 104.8441 },
    "VABB": { lat: 19.0896, lon: 72.8656 },
    "VIDP": { lat: 28.5562, lon: 77.1000 },
    "VOMM": { lat: 12.9941, lon: 80.1709 },
    "PANC": { lat: 61.1744, lon: -149.9963 }
};

const ICAO_TZ = {
    "KJFK": "America/New_York", "KIAD": "America/New_York",
    "KORD": "America/Chicago", "KIAH": "America/Chicago",
    "KLAX": "America/Los_Angeles", "KSFO": "America/Los_Angeles", "KSEA": "America/Los_Angeles",
    "PHNL": "Pacific/Honolulu", 
    "CYVR": "America/Vancouver", 
    "MMMX": "America/Mexico_City",
    "YSSY": "Australia/Sydney", "YPPH": "Australia/Perth",
    "VHHH": "Asia/Hong_Kong", "WSSS": "Asia/Singapore"
};

const getLocalTimeZone = (icao) => {
    if (!icao) return "UTC";
    if (icao.startsWith("RJ") || icao.startsWith("RO")) return "Asia/Tokyo";
    if (icao.startsWith("Z")) return "Asia/Shanghai";
    if (icao.startsWith("RC")) return "Asia/Taipei";
    if (icao.startsWith("RK")) return "Asia/Seoul";
    if (icao.startsWith("RP")) return "Asia/Manila";
    if (icao.startsWith("VV")) return "Asia/Ho_Chi_Minh";
    if (icao.startsWith("VT")) return "Asia/Bangkok";
    if (icao.startsWith("WM")) return "Asia/Kuala_Lumpur";
    if (icao.startsWith("WI")) return "Asia/Jakarta"; 
    if (icao.startsWith("VI") || icao.startsWith("VA") || icao.startsWith("VO")) return "Asia/Kolkata";
    if (icao.startsWith("VY")) return "Asia/Yangon";
    if (icao.startsWith("VD")) return "Asia/Phnom_Penh";
    if (icao.startsWith("EG")) return "Europe/London";
    if (icao.startsWith("LF")) return "Europe/Paris";
    if (icao.startsWith("ED")) return "Europe/Berlin";
    if (icao.startsWith("LI")) return "Europe/Rome";
    if (icao.startsWith("LO")) return "Europe/Vienna";
    if (icao.startsWith("EB")) return "Europe/Brussels";
    if (icao.startsWith("ES")) return "Europe/Stockholm";
    if (icao.startsWith("LT")) return "Europe/Istanbul";
    
    return ICAO_TZ[icao] || "UTC";
};

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
  { wp: "RJTT", ctme: 0, rtme: 741, fob: 242.2, plnAlt: "", plnTmp: "", plnWind: "", tas: "", gs: "", isaDev: 0, dist: 0, isOffRoute: false },
  { wp: "TOC", ctme: 16, rtme: 725, fob: 237.2, plnAlt: "FL310", plnTmp: "-47", plnWind: "280/040", tas: "480", gs: "520", isaDev: 17, dist: 80, isOffRoute: false },
  { wp: "POROT", ctme: 24, rtme: 717, fob: 224.9, plnAlt: "FL310", plnTmp: "-26", plnWind: "314/015", tas: "482", gs: "502", isaDev: 17, dist: 65, isOffRoute: false },
  { wp: "KJFK", ctme: 741, rtme: 0, fob: 26.0, plnAlt: "FL041", plnTmp: "", plnWind: "", tas: "", gs: "", isaDev: 0, dist: 120, isOffRoute: false }
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
  let hours = Math.floor(totalMinutes / 60);
  let minutes = Math.floor(totalMinutes % 60);
  if (hours < 0) hours += 24;
  hours = hours % 24;
  if (minutes < 0) {
      minutes += 60;
      hours = (hours - 1 + 24) % 24;
  }
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

const SYNC_HEADER = "7PT|";
const packData = (data) => {
    const parts = [];
    for (const [wp, v] of Object.entries(data)) {
        if (v.ato || v.afob || v.actAlt || v.actTmp || v.actWind || v.memo) {
            const alt = v.actAlt ? v.actAlt.replace('FL', '') : '';
            const wind = v.actWind ? v.actWind.replace('/', '') : '';
            parts.push(`${wp},${v.ato||''},${v.afob||''},${alt},${v.actTmp||''},${wind},${encodeURIComponent(v.memo||'')}`);
        }
    }
    return parts.length > 0 ? SYNC_HEADER + parts.join('|') : "";
};

const unpackData = (str) => {
    if (!str || !str.startsWith(SYNC_HEADER)) return null;
    const content = str.substring(SYNC_HEADER.length);
    if (!content) return {};
    const res = {};
    content.split('|').forEach(row => {
        const [wp, ato, afob, actAlt, actTmp, actWind, encodedMemo] = row.split(',');
        if (wp) {
            const restoredAlt = actAlt ? (actAlt.startsWith('FL') ? actAlt : `FL${actAlt}`) : '';
            const restoredWind = actWind ? (actWind.length === 6 ? `${actWind.substring(0,3)}/${actWind.substring(3)}` : actWind) : '';
            res[wp] = { ato: ato||'', afob: afob||'', actAlt: restoredAlt, actTmp: actTmp||'', actWind: restoredWind, memo: decodeURIComponent(encodedMemo||'') };
        }
    });
    return res;
};

const SyncModal = ({ isOpen, onClose, actuals, onSync, showMessage }) => {
    const [activeTab, setActiveTab] = useState('export');
    const [isScanning, setIsScanning] = useState(false);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && activeTab === 'export' && canvasRef.current) {
            const drawQR = () => {
                const dataStr = packData(actuals);
                const valueToEncode = dataStr || "7PT|NODATA";
                new window.QRious({ element: canvasRef.current, value: valueToEncode, size: 400, padding: 20, background: 'white', foreground: 'black', level: 'L' });
            };
            if (!window.QRious) {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js";
                script.onload = drawQR;
                document.head.appendChild(script);
            } else { drawQR(); }
        }
    }, [isOpen, activeTab, actuals]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsScanning(true);
        const scan = () => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d', { willReadFrequently: true });
                    const tryScan = (targetSize) => {
                        let w = img.width, h = img.height;
                        if (w > h) { if (w > targetSize) { h *= targetSize / w; w = targetSize; } } 
                        else { if (h > targetSize) { w *= targetSize / h; h = targetSize; } }
                        canvas.width = w; canvas.height = h;
                        context.fillStyle = "white"; context.fillRect(0, 0, w, h);
                        context.drawImage(img, 0, 0, w, h);
                        const imgData = context.getImageData(0, 0, w, h);
                        return window.jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "attemptBoth" });
                    };
                    try {
                        let code = tryScan(1200) || tryScan(800) || tryScan(500);
                        if (code) {
                            setIsScanning(false);
                            const parsedData = unpackData(code.data);
                            if (parsedData && Object.keys(parsedData).length > 0) {
                                onSync(parsedData); onClose(); showMessage("データを同期しました！");
                            } else { showMessage("QRコードは読み取れましたが、データが空か形式が違います。"); }
                        } else {
                            setIsScanning(false); showMessage("QRコードを検出できませんでした。撮り直してください。");
                        }
                    } catch (err) { console.error(err); setIsScanning(false); showMessage("解析中にエラーが発生しました。"); }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        };
        if (!window.jsQR) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
            script.onload = scan; document.head.appendChild(script);
        } else { scan(); }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl max-w-md w-full shadow-2xl flex flex-col overflow-hidden">
                <div className="flex border-b border-slate-700">
                    <button className={`flex-1 py-4 text-sm font-bold ${activeTab === 'export' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-700'}`} onClick={() => setActiveTab('export')}>QRを表示 (送る)</button>
                    <button className={`flex-1 py-4 text-sm font-bold ${activeTab === 'import' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-700'}`} onClick={() => setActiveTab('import')}>カメラで読む (受ける)</button>
                </div>
                <div className="p-6 flex-1 min-h-[420px] flex flex-col items-center justify-center">
                    {activeTab === 'export' ? (
                        <div className="flex flex-col items-center w-full">
                            <div className="bg-white p-4 rounded-xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.15)]"><canvas ref={canvasRef}></canvas></div>
                            <p className="text-slate-300 text-sm text-center">相手の端末にこのQRコードを見せてください。</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full space-y-8">
                            <div className="text-center space-y-3">
                                <h3 className="text-xl font-bold text-blue-400">相手のQRコードを撮影する</h3>
                            </div>
                            <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
                            <button onClick={() => fileInputRef.current.click()} disabled={isScanning} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-6 rounded-xl shadow-lg flex items-center justify-center space-x-3 transition-transform active:scale-95">
                                {isScanning ? <span>解析中...</span> : <span>写真を撮って読み取る</span>}
                            </button>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-end">
                    <button onClick={onClose} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-slate-200 transition-colors">閉じる (CLOSE)</button>
                </div>
            </div>
        </div>
    );
};

const DistCheckModal = ({ isOpen, onClose, flightData }) => {
    const segments = useMemo(() => {
        const segs = [];
        let accumulatedDist = 0;
        let lastBoundaryWp = null;

        for (let i = 0; i < flightData.length; i++) {
            const wp = flightData[i];
            
            if (i > 0 && wp.dist !== undefined && !isNaN(wp.dist)) {
                accumulatedDist += wp.dist;
            }

            const isExclude = wp.isOffRoute || /^(TOC|TOD|CLM|DEC|WPT|EEP\d*|ETP\d*|EXP\d*)$/i.test(wp.wp);
            const isLatLon = /^\d{2}[A-Z]\d{2}$/.test(wp.wp);

            if (isExclude) {
                continue;
            }

            if (lastBoundaryWp) {
                const wasLatLon = /^\d{2}[A-Z]\d{2}$/.test(lastBoundaryWp.wp);
                if (wasLatLon || isLatLon) {
                    segs.push({
                        from: lastBoundaryWp.wp,
                        to: wp.wp,
                        dist: accumulatedDist
                    });
                }
            }

            lastBoundaryWp = wp;
            accumulatedDist = 0;
        }
        return segs;
    }, [flightData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 max-w-md w-full shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                    <h3 className="text-white font-bold flex items-center gap-2"><SafeIcon name="Ruler" className="w-5 h-5 text-sky-400" /> DIST CHECK</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-2xl leading-none">&times;</button>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 bg-slate-900/50 rounded-lg border border-slate-700">
                    {segments.length === 0 ? (
                        <div className="text-slate-500 py-10 text-center font-bold text-sm">緯度経度のWaypointが見つかりません</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-800 border-b border-slate-600 z-10 shadow-sm">
                                <tr className="text-slate-400 text-xs tracking-wider">
                                    <th className="py-2.5 px-3">FROM</th>
                                    <th className="py-2.5 px-3 text-center"></th>
                                    <th className="py-2.5 px-3">TO</th>
                                    <th className="py-2.5 px-3 text-right">DISTANCE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {segments.map((seg, idx) => (
                                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/50 text-slate-200 font-mono text-sm transition-colors">
                                        <td className="py-3 px-3 font-bold text-sky-200">{seg.from}</td>
                                        <td className="py-3 px-3 text-center text-slate-500">→</td>
                                        <td className="py-3 px-3 font-bold text-sky-200">{seg.to}</td>
                                        <td className="py-3 px-3 text-right font-black text-sky-400 text-base">{seg.dist} <span className="text-[10px] text-slate-500 font-bold ml-0.5 tracking-tighter">NM</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="mt-4 flex justify-end pt-2">
                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors shadow-sm w-full">CLOSE</button>
                </div>
            </div>
        </div>
    );
};

const GraphModal = ({ isOpen, onClose, flightData }) => {
    if (!isOpen) return null;
    
    const validPoints = flightData.filter(d => 
        (d.ato && d.timeDiffStr !== '') || 
        (d.afob && d.fuelDiff !== null && d.fuelDiff !== undefined)
    );
    
    const width = 800;
    const height = 300;
    const paddingX = 60;
    const paddingY = 40;

    const timeDiffs = validPoints.map(p => Math.abs(parseInt(p.timeDiffStr) || 0)).filter(v => v > 0);
    const fuelDiffs = validPoints.map(p => Math.abs(p.fuelDiff || 0)).filter(v => v > 0);
    
    const maxT = Math.max(...timeDiffs, 5);
    const maxF = Math.max(...fuelDiffs, 2);

    const getX = (index) => paddingX + (index * ((width - paddingX * 2) / Math.max(validPoints.length - 1, 1)));
    const getY_T = (val) => (height / 2) - (val / maxT) * ((height - paddingY * 2) / 2);
    const getY_F = (val) => (height / 2) - (val / maxF) * ((height - paddingY * 2) / 2);

    const pointsT = validPoints
        .map((pt, i) => (pt.ato && pt.timeDiffStr !== '') ? `${getX(i)},${getY_T(parseInt(pt.timeDiffStr)||0)}` : null)
        .filter(Boolean)
        .join(' ');
        
    const pointsF = validPoints
        .map((pt, i) => (pt.afob && pt.fuelDiff !== null && pt.fuelDiff !== undefined) ? `${getX(i)},${getY_F(pt.fuelDiff||0)}` : null)
        .filter(Boolean)
        .join(' ');

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 max-w-4xl w-full shadow-2xl flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                    <h3 className="text-white font-bold">Trend Graph (TIME & FUEL)</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl leading-none">&times;</button>
                </div>
                
                <div className="w-full bg-slate-900 rounded-lg p-4 min-h-[300px] flex items-center justify-center relative border border-slate-700 overflow-x-auto hide-scrollbar">
                    {validPoints.length === 0 ? (
                        <div className="text-slate-500 py-10">Data not available</div>
                    ) : (
                        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] select-none">
                            <line x1={paddingX} y1={height/2} x2={width - paddingX} y2={height/2} stroke="#475569" strokeWidth="2" strokeDasharray="5,5" />
                            
                            {pointsT && <polyline fill="none" stroke="#38bdf8" strokeWidth="3" points={pointsT} />}
                            {pointsF && <polyline fill="none" stroke="#34d399" strokeWidth="3" points={pointsF} />}

                            {validPoints.map((pt, i) => {
                                const cx = getX(i);
                                const hasTime = pt.ato && pt.timeDiffStr !== '';
                                const hasFuel = pt.afob && pt.fuelDiff !== null && pt.fuelDiff !== undefined;
                                
                                const tVal = parseInt(pt.timeDiffStr)||0;
                                const fVal = pt.fuelDiff||0;
                                const cyT = getY_T(tVal);
                                const cyF = getY_F(fVal);
                                
                                return (
                                    <g key={i}>
                                        <line x1={cx} y1={paddingY} x2={cx} y2={height - paddingY} stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                                        
                                        {hasTime && (
                                            <>
                                                <circle cx={cx} cy={cyT} r="5" fill="#38bdf8" />
                                                <text x={cx} y={cyT - 10} fill="#38bdf8" fontSize="12" textAnchor="middle" fontWeight="bold">{tVal > 0 ? '+'+tVal : tVal}</text>
                                            </>
                                        )}

                                        {hasFuel && (
                                            <>
                                                <circle cx={cx} cy={cyF} r="5" fill="#34d399" />
                                                <text x={cx} y={cyF + 20} fill="#34d399" fontSize="12" textAnchor="middle" fontWeight="bold">{fVal > 0 ? '+'+fVal.toFixed(1) : fVal.toFixed(1)}</text>
                                            </>
                                        )}
                                        
                                        <text x={cx} y={height - 10} fill="#94a3b8" fontSize="11" textAnchor="middle" transform={`rotate(-30 ${cx},${height - 10})`} fontWeight="bold">{pt.wp}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    )}
                </div>
                
                <div className="w-full flex justify-center mt-4 text-sm text-slate-400 px-4">
                    <div className="flex gap-6 font-bold">
                        <span className="flex items-center gap-2"><div className="w-4 h-1 bg-sky-400 rounded-full"></div> Time Diff (Mins)</span>
                        <span className="flex items-center gap-2"><div className="w-4 h-1 bg-emerald-400 rounded-full"></div> Fuel Diff (kLbs)</span>
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
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    lang="en"
                    className="w-full h-32 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 mb-4 resize-none font-mono"
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
  const [toastMessage, setToastMessage] = useState("");
  
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isDistCheckOpen, setIsDistCheckOpen] = useState(false);
  const [memoModal, setMemoModal] = useState({ isOpen: false, wp: '', text: '' });

  const rowRefs = useRef([]);
  const hasAutoScrolled = useRef(false);
  const lastLoadId = useRef(null);

  const [flightPlan, setFlightPlan] = useState(DEFAULT_FLIGHT_PLAN_DATA);
  const [flightNo, setFlightNo] = useState("ANA0110");
  const [routeInfo, setRouteInfo] = useState("RJTT - KJFK");
  const [parsedDepIcao, setParsedDepIcao] = useState("");
  const [parsedReg, setParsedReg] = useState("JA796A");
  const [parsedPzfw, setParsedPzfw] = useState(475.6);
  const [parsedTaxiOut, setParsedTaxiOut] = useState(20); 
  const [parsedTaxiIn, setParsedTaxiIn] = useState(5); 
  const [parsedDate, setParsedDate] = useState("16JUL26");
  const [parsedSta, setParsedSta] = useState("");
  const [parsedDestIcao, setParsedDestIcao] = useState("KJFK");
  const [is15gLimit, setIs15gLimit] = useState(false);

  const [localStd, setLocalStd] = useState("");
  const [localSta, setLocalSta] = useState("");
  const [localBlockIn, setLocalBlockIn] = useState("");
  const [localLdg, setLocalLdg] = useState("");

  const [destWeather, setDestWeather] = useState(null);
  const [lastFetchedBlockInMins, setLastFetchedBlockInMins] = useState(null);
  const [lastFetchedDestIcao, setLastFetchedDestIcao] = useState(null);
  const [parsedEtopsInfo, setParsedEtopsInfo] = useState(null);

  const [currentUtcMins, setCurrentUtcMins] = useState(() => {
      const now = new Date();
      return now.getUTCHours() * 60 + now.getUTCMinutes();
  });

  useEffect(() => {
      const timer = setInterval(() => {
          const now = new Date();
          setCurrentUtcMins(now.getUTCHours() * 60 + now.getUTCMinutes());
      }, 60000);
      return () => clearInterval(timer);
  }, []);

  const calculatedData = useMemo(() => {
    const data = [];
    const takeoffMinutes = timeToMinutes(takeoffTime);
    const acType = REG_MAP[parsedReg] || "77W";
    const perfTable = MAX_ALT_DATA[acType];

    let currentDiff = 0;
    let totalBurnDiff = 0, lastValidWpIndex = -1;
    let latestAtoTimeDiff = 0;

    let activeDiffForETA = 0;
    let lastAtoIndexForETA = -1;
    for (let i = 0; i < flightPlan.length; i++) {
        const wpActual = actuals[flightPlan[i].wp] || {};
        if (wpActual.ato && takeoffMinutes !== null) {
            const atoMins = timeToMinutes(wpActual.ato);
            if (atoMins !== null) {
                lastAtoIndexForETA = i;
                const originalEtoMins = takeoffMinutes + flightPlan[i].ctme;
                let diff = atoMins - originalEtoMins;
                if (diff < -720) diff += 1440; if (diff > 720) diff -= 1440;
                activeDiffForETA = diff;
                
                currentDiff = diff;
                latestAtoTimeDiff = diff;
            }
        }
    }

    let estLandingTimeMins = null;
    if (takeoffMinutes !== null && flightPlan.length > 0) {
        if (lastAtoIndexForETA !== -1) {
            estLandingTimeMins = takeoffMinutes + flightPlan[flightPlan.length - 1].ctme + activeDiffForETA;
        } else {
            estLandingTimeMins = takeoffMinutes + flightPlan[flightPlan.length - 1].ctme;
        }
    }
    const estBlockInMins = estLandingTimeMins !== null ? estLandingTimeMins + parsedTaxiIn : null;

    currentDiff = 0;
    for (let i = 0; i < flightPlan.length; i++) {
      const wpPlan = flightPlan[i];
      const wpActual = actuals[wpPlan.wp] || {};
      
      let revisedEtoStr = "";
      let timeDiffStr = "";

      if (takeoffMinutes !== null) {
          const originalEtoMins = takeoffMinutes + wpPlan.ctme;
          
          const calculatedEtoMins = originalEtoMins + currentDiff;
          revisedEtoStr = minutesToTime(calculatedEtoMins);

          if (wpActual.ato) {
              const atoMins = timeToMinutes(wpActual.ato);
              if (atoMins !== null) {
                  let diff = atoMins - originalEtoMins; 
                  if (diff < -720) diff += 1440; if (diff > 720) diff -= 1440;
                  
                  timeDiffStr = formatTimeDiff(diff);
                  currentDiff = diff; 
              }
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

    return { flightData: data, totalBurnDiff, lastValidWpIndex, estLandingTimeStr: minutesToTime(estLandingTimeMins), estBlockInStr: minutesToTime(estBlockInMins), estBlockInMins, estLandingTimeMins, latestAtoTimeDiffStr: formatTimeDiff(latestAtoTimeDiff), latestAtoTimeDiff };
  }, [takeoffTime, actuals, flightPlan, parsedPzfw, parsedReg, is15gLimit, parsedTaxiIn]);

  const etopsTimeDiff = useMemo(() => {
    const hasAto = Object.values(actuals).some(v => v && v.ato);
    if (!hasAto) return 0;

    if (!takeoffTime || !navlogData || navlogData.stdH === undefined) return 0;
    const toMins = timeToMinutes(takeoffTime);
    if (toMins === null) return 0;

    const stdMins = navlogData.stdH * 60 + navlogData.stdM;
    
    let depDiff = toMins - stdMins;
    if (depDiff < -720) depDiff += 1440;
    if (depDiff > 720) depDiff -= 1440;

    return depDiff + (calculatedData.latestAtoTimeDiff || 0);
  }, [takeoffTime, navlogData, calculatedData.latestAtoTimeDiff, actuals]);

  const activeEtopsAirport = useMemo(() => {
      if (!takeoffTime || !parsedEtopsInfo || !parsedEtopsInfo.data || !calculatedData.flightData) return null;
      
      const toMins = timeToMinutes(takeoffTime);
      if (toMins === null) return null;

      let elapsedMins = currentUtcMins - toMins;
      if (elapsedMins < -720) elapsedMins += 1440;
      if (elapsedMins > 720) elapsedMins -= 1440;

      elapsedMins -= (calculatedData.latestAtoTimeDiff || 0);

      let eepCtme = null;
      let expCtme = null;
      
      calculatedData.flightData.forEach(row => {
          if (/^EEP\d*$/i.test(row.wp)) {
              if (eepCtme === null) eepCtme = row.ctme; 
          }
          if (/^EXP\d*$/i.test(row.wp)) {
              expCtme = row.ctme; 
          }
      });

      if (eepCtme === null) eepCtme = parsedEtopsInfo.eepCtme || 0;
      if (expCtme === null) expCtme = parsedEtopsInfo.expCtme || 9999;

      if (elapsedMins < eepCtme || elapsedMins > expCtme) {
          return null;
      }

      for (let i = 0; i < parsedEtopsInfo.data.length; i++) {
          const item = parsedEtopsInfo.data[i];
          if (elapsedMins <= item.endCtme) {
              return item.airport;
          }
      }
      
      return parsedEtopsInfo.data[parsedEtopsInfo.data.length - 1].airport;
  }, [takeoffTime, currentUtcMins, parsedEtopsInfo, calculatedData.latestAtoTimeDiff, calculatedData.flightData]);

  useEffect(() => {
    if (navlogData && navlogData.newPlan && navlogData.newPlan.length > 0) {
        setFlightPlan(navlogData.newPlan);
        setFlightNo(navlogData.fNo);
        setRouteInfo(navlogData.rInfo);
        setParsedDepIcao(navlogData.depIcao);
        setParsedReg(navlogData.pReg);
        setParsedPzfw(navlogData.pPzfw);
        
        if (navlogData.pTaxiOut !== undefined) setParsedTaxiOut(navlogData.pTaxiOut);
        if (navlogData.pTaxiIn !== undefined) setParsedTaxiIn(navlogData.pTaxiIn);
        
        if (navlogData.pDate) setParsedDate(navlogData.pDate);
        if (navlogData.destIcao) setParsedDestIcao(navlogData.destIcao);

        if (navlogData.staH !== undefined && navlogData.staM !== undefined) {
            setParsedSta(`${String(navlogData.staH).padStart(2, '0')}${String(navlogData.staM).padStart(2, '0')}`);
        }

        if (navlogData.parsedEtopsInfo !== undefined) {
            setParsedEtopsInfo(navlogData.parsedEtopsInfo);
        } else {
            setParsedEtopsInfo(null);
        }

        hasAutoScrolled.current = false;
        
        if (navlogData.isNew) {
            setActuals({});
            
            if (navlogData.stdH !== undefined && navlogData.stdM !== undefined) {
                const taxiOut = navlogData.pTaxiOut !== undefined ? navlogData.pTaxiOut : 20;
                const defaultToMins = (navlogData.stdH * 60 + navlogData.stdM + taxiOut) % 1440;
                setTakeoffTime(minutesToTime(defaultToMins));
            } else {
                setTakeoffTime('');
            }
            
            lastLoadId.current = Date.now();
        } else {
            setActuals(prev => ({ ...prev }));
        }
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
                if (parsed.parsedDepIcao) setParsedDepIcao(parsed.parsedDepIcao);
                if (parsed.parsedReg) setParsedReg(parsed.parsedReg);
                if (parsed.parsedPzfw) setParsedPzfw(parsed.parsedPzfw);
                
                if (parsed.parsedTaxiOut !== undefined) setParsedTaxiOut(parsed.parsedTaxiOut);
                if (parsed.parsedTaxiIn !== undefined) setParsedTaxiIn(parsed.parsedTaxiIn);

                if (parsed.parsedDate) setParsedDate(parsed.parsedDate);
                if (parsed.parsedSta) setParsedSta(parsed.parsedSta);
                if (parsed.parsedDestIcao) setParsedDestIcao(parsed.parsedDestIcao);
                if (parsed.parsedEtopsInfo !== undefined) setParsedEtopsInfo(parsed.parsedEtopsInfo);
            }
        } catch(e) {}
    }
  }, []);

  useEffect(() => {
    try {
        const backup = { flightPlan, actuals, flightNo, routeInfo, parsedDepIcao, parsedReg, parsedPzfw, parsedTaxiOut, parsedTaxiIn, parsedDate, parsedSta, parsedDestIcao, takeoffTime, parsedEtopsInfo };
        localStorage.setItem('navlogFlightDataBackup', JSON.stringify(backup));
    } catch (e) {}
  }, [flightPlan, actuals, flightNo, routeInfo, parsedDepIcao, parsedReg, parsedPzfw, parsedTaxiOut, parsedTaxiIn, parsedDate, parsedSta, parsedDestIcao, takeoffTime, parsedEtopsInfo]);

  const handleUpdateActual = (wp, field, value) => {
    setActuals(prev => ({ ...prev, [wp]: { ...prev[wp], [field]: value } }));
  };

  const handleSyncData = (importedData) => {
    setActuals(prev => {
        const merged = { ...prev };
        for (const wp in importedData) {
            if (!merged[wp]) merged[wp] = {};
            if (importedData[wp].ato) merged[wp].ato = importedData[wp].ato;
            if (importedData[wp].afob) merged[wp].afob = importedData[wp].afob;
            if (importedData[wp].actAlt) merged[wp].actAlt = importedData[wp].actAlt;
            if (importedData[wp].actTmp) merged[wp].actTmp = importedData[wp].actTmp;
            if (importedData[wp].actWind) merged[wp].actWind = importedData[wp].actWind;
            if (importedData[wp].memo) merged[wp].memo = importedData[wp].memo;
        }
        return merged;
    });
  };

  useEffect(() => {
    if (parsedDepIcao && navlogData && navlogData.stdH !== undefined && navlogData.stdM !== undefined && parsedDate) {
        try {
            const day = parseInt(parsedDate.substring(0, 2), 10);
            const monthMap = {JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11};
            const monthStr = parsedDate.substring(2, 5).toUpperCase();
            const mon = monthMap[monthStr] !== undefined ? monthMap[monthStr] : 0;
            const yy = 2000 + parseInt(parsedDate.substring(5, 7), 10);

            const utcDate = new Date(Date.UTC(yy, mon, day, navlogData.stdH, navlogData.stdM));
            
            if (!isNaN(utcDate.getTime())) {
                const tz = getLocalTimeZone(parsedDepIcao);
                const localTimeStr = new Intl.DateTimeFormat('en-GB', {
                    timeZone: tz,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).format(utcDate);
                setLocalStd(localTimeStr.replace(':', ''));
            } else {
                setLocalStd("");
            }
        } catch(e) {
            setLocalStd("");
        }
    }
  }, [navlogData, parsedDate, parsedDepIcao]);

  useEffect(() => {
    if (parsedDestIcao && parsedSta && parsedSta.length === 4 && parsedDate) {
      try {
        const hours = parsedSta.substring(0, 2);
        const mins = parsedSta.substring(2, 4);
        const day = parsedDate.substring(0, 2);
        const monthMap = {JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11};
        const monthStr = parsedDate.substring(2, 5).toUpperCase();
        const mon = monthMap[monthStr] !== undefined ? monthMap[monthStr] : 0;
        const yy = 2000 + parseInt(parsedDate.substring(5, 7), 10);

        const utcDate = new Date(Date.UTC(yy, mon, day, parseInt(hours, 10), parseInt(mins, 10)));
        
        if (!isNaN(utcDate.getTime())) {
          const tz = getLocalTimeZone(parsedDestIcao);
          const localTimeStr = new Intl.DateTimeFormat('en-GB', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(utcDate);
          setLocalSta(localTimeStr.replace(':', ''));
        } else {
          setLocalSta("");
        }
      } catch(e) {
        setLocalSta("");
      }
    } else {
        setLocalSta("");
    }
  }, [parsedSta, parsedDate, parsedDestIcao]);

  useEffect(() => {
    let isMounted = true;
    if (!parsedDestIcao || !parsedDate || calculatedData.estBlockInMins === null) {
        setDestWeather(null);
        setLastFetchedBlockInMins(null);
        setLastFetchedDestIcao(null);
        return;
    }

    const currentBlockInMins = calculatedData.estBlockInMins;

    if (lastFetchedDestIcao === parsedDestIcao && lastFetchedBlockInMins !== null && destWeather !== null) {
        let diff = Math.abs(currentBlockInMins - lastFetchedBlockInMins);
        if (diff > 720) diff = 1440 - diff;
        
        if (diff < 60) {
            return;
        }
    }

    const WX_CACHE_KEY = 'efb_wx_cache_v2';

    const fetchWeather = async () => {
        try {
            const day = parseInt(parsedDate.substring(0, 2), 10);
            const monthMap = {JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11};
            const mon = monthMap[parsedDate.substring(2, 5).toUpperCase()] || 0;
            const yy = 2000 + parseInt(parsedDate.substring(5, 7), 10);
            
            const h = Math.floor(currentBlockInMins / 60) % 24;
            const m = currentBlockInMins % 60;
            const utcDateBlk = new Date(Date.UTC(yy, mon, day, h, m));
            if (currentBlockInMins >= 24 * 60) {
                utcDateBlk.setUTCDate(utcDateBlk.getUTCDate() + Math.floor(currentBlockInMins / (24 * 60)));
            }

            const targetY = utcDateBlk.getUTCFullYear();
            const targetM = String(utcDateBlk.getUTCMonth() + 1).padStart(2, '0');
            const targetD = String(utcDateBlk.getUTCDate()).padStart(2, '0');
            const targetH = String(utcDateBlk.getUTCHours()).padStart(2, '0');
            
            const cacheKeyStr = `${parsedDestIcao}_${targetY}-${targetM}-${targetD}T${targetH}:00`;
            const cacheRaw = localStorage.getItem(WX_CACHE_KEY);
            let wxCache = cacheRaw ? JSON.parse(cacheRaw) : {};
            const now = Date.now();

            if (wxCache[cacheKeyStr] && (now - wxCache[cacheKeyStr].timestamp < 3 * 3600 * 1000)) {
                if (isMounted) {
                    setDestWeather(wxCache[cacheKeyStr].data);
                    setLastFetchedBlockInMins(currentBlockInMins);
                    setLastFetchedDestIcao(parsedDestIcao);
                }
                return;
            }

            let lat, lon;
            if (ICAO_COORDS[parsedDestIcao]) {
                lat = ICAO_COORDS[parsedDestIcao].lat;
                lon = ICAO_COORDS[parsedDestIcao].lon;
            } else {
                const awRes = await fetch(`https://aviationweather.gov/api/data/airport?ids=${parsedDestIcao}&format=json`);
                if (!awRes.ok) throw new Error("AviationWeather error");
                const awData = await awRes.json();
                if (!awData || awData.length === 0) throw new Error("Airport not found");
                lat = awData[0].lat;
                lon = awData[0].lon;
            }

            const omRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code&timezone=UTC&past_days=7&forecast_days=14`);
            if (!omRes.ok) throw new Error("Open-Meteo error");
            const omData = await omRes.json();

            if (!isMounted) return;

            const targetMs = utcDateBlk.getTime();
            let bestIdx = -1;
            let minDiffMs = Infinity;

            if (omData.hourly && omData.hourly.time && omData.hourly.time.length > 0) {
                omData.hourly.time.forEach((tStr, idx) => {
                    const tMs = new Date(tStr + "Z").getTime();
                    const diffMs = Math.abs(tMs - targetMs);
                    if (diffMs < minDiffMs) {
                        minDiffMs = diffMs;
                        bestIdx = idx;
                    }
                });
            }

            if (bestIdx !== -1 && minDiffMs <= 3 * 3600 * 1000) {
                const rawTemp = omData.hourly.temperature_2m[bestIdx];
                if (rawTemp !== undefined && rawTemp !== null) {
                    const tempC = Math.round(rawTemp);
                    const tempF = Math.round((tempC * 9 / 5) + 32);
                    const wcode = omData.hourly.weather_code[bestIdx];
                    
                    let icon = "☁️";
                    let text = "Cloudy";
                    if (wcode === 0) { icon = "☀️"; text = "Clear"; }
                    else if ([1,2].includes(wcode)) { icon = "⛅"; text = "Partly Cloudy"; }
                    else if ([3].includes(wcode)) { icon = "☁️"; text = "Overcast"; }
                    else if ([45,48].includes(wcode)) { icon = "🌫️"; text = "Fog"; }
                    else if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(wcode)) { icon = "🌧️"; text = "Rain"; }
                    else if ([71,73,75,77,85,86].includes(wcode)) { icon = "❄️"; text = "Snow"; }
                    else if ([95,96,99].includes(wcode)) { icon = "⛈️"; text = "Thunderstorm"; }

                    const wxDataToSave = {
                        tempC: tempC > 0 ? `+${tempC}` : `${tempC}`,
                        tempF: tempF > 0 ? `+${tempF}` : `${tempF}`,
                        icon: icon,
                        text: text
                    };

                    wxCache[cacheKeyStr] = { data: wxDataToSave, timestamp: now };
                    localStorage.setItem(WX_CACHE_KEY, JSON.stringify(wxCache));

                    setDestWeather(wxDataToSave);
                    setLastFetchedBlockInMins(currentBlockInMins);
                    setLastFetchedDestIcao(parsedDestIcao);
                } else {
                    setDestWeather(null);
                }
            } else {
                setDestWeather(null);
            }
        } catch (err) {
            if (isMounted) setDestWeather(null);
        }
    };

    fetchWeather();
    return () => { isMounted = false; };
  }, [parsedDestIcao, parsedDate, calculatedData.estBlockInMins, lastFetchedBlockInMins, lastFetchedDestIcao, destWeather]);

  useEffect(() => {
    let newLocalBlockIn = "";
    let newLocalLdg = "";

    if (parsedDestIcao && parsedDate && (calculatedData.estBlockInMins !== null || calculatedData.estLandingTimeMins !== null)) {
      try {
        const day = parseInt(parsedDate.substring(0, 2), 10);
        const monthMap = {JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11};
        const monthStr = parsedDate.substring(2, 5).toUpperCase();
        const mon = monthMap[monthStr] !== undefined ? monthMap[monthStr] : 0;
        const yy = 2000 + parseInt(parsedDate.substring(5, 7), 10);

        const tz = getLocalTimeZone(parsedDestIcao);
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        if (calculatedData.estBlockInMins !== null && calculatedData.estBlockInMins !== undefined) {
          const h = Math.floor(calculatedData.estBlockInMins / 60) % 24;
          const m = calculatedData.estBlockInMins % 60;
          
          const utcDateBlk = new Date(Date.UTC(yy, mon, day, h, m));
          
          if (calculatedData.estBlockInMins >= 24 * 60) {
              utcDateBlk.setUTCDate(utcDateBlk.getUTCDate() + Math.floor(calculatedData.estBlockInMins / (24 * 60)));
          }

          if (!isNaN(utcDateBlk.getTime())) {
            newLocalBlockIn = formatter.format(utcDateBlk).replace(':', '');
          }
        }

        if (calculatedData.estLandingTimeMins !== null && calculatedData.estLandingTimeMins !== undefined) {
          const hLdg = Math.floor(calculatedData.estLandingTimeMins / 60) % 24;
          const mLdg = calculatedData.estLandingTimeMins % 60;
          
          const utcDateLdg = new Date(Date.UTC(yy, mon, day, hLdg, mLdg));
          
          if (calculatedData.estLandingTimeMins >= 24 * 60) {
              utcDateLdg.setUTCDate(utcDateLdg.getUTCDate() + Math.floor(calculatedData.estLandingTimeMins / (24 * 60)));
          }

          if (!isNaN(utcDateLdg.getTime())) {
            newLocalLdg = formatter.format(utcDateLdg).replace(':', '');
          }
        }

      } catch(e) {
        // Ignore
      }
    }
    setLocalBlockIn(newLocalBlockIn);
    setLocalLdg(newLocalLdg);
  }, [parsedSta, parsedDate, parsedDestIcao, calculatedData.estBlockInMins, calculatedData.estLandingTimeMins]);

  const scrollToCurrentFix = () => {
    if (!takeoffTime || calculatedData.flightData.length === 0) return;
    const now = new Date();
    const currentUtcMins = now.getUTCHours() * 60 + now.getUTCMinutes();
    let targetIndex = -1;
    let minDiffMs = Infinity;

    calculatedData.flightData.forEach((row, idx) => {
      if (row.ato) return;
      const etoStr = row.revisedEtoStr;
      if (!etoStr || etoStr === "----") return;
      const etoMins = timeToMinutes(etoStr);
      if (etoMins === null) return;
      let diff = Math.abs(etoMins - currentUtcMins);
      if (diff > 720) diff = 1440 - diff;

      if (diff < minDiffMs) {
        minDiffMs = diff;
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

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToCurrentFix();
    }, 150);
    return () => clearTimeout(timer);
  }, [calculatedData.flightData]);

  // 新デザイン: 各列の最小・最大幅を制限して間延びを防止
  const gridColumnsStyle = { gridTemplateColumns: 'minmax(75px, 1.5fr) 40px 55px 60px 40px 55px 65px minmax(180px, 2.5fr) 60px 32px' };

  return (
    <div className="flex flex-col h-full w-full absolute inset-0 bg-[#05070a] text-[#cbd5e1] font-sans overflow-hidden rounded-xl border border-slate-700/50">
      
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

      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        actuals={actuals}
        onSync={handleSyncData}
        showMessage={(msg) => window.dispatchEvent(new CustomEvent('show-toast', { detail: msg }))}
      />

      <DistCheckModal 
        isOpen={isDistCheckOpen}
        onClose={() => setIsDistCheckOpen(false)}
        flightData={calculatedData.flightData}
      />

      <header className="shrink-0 bg-gradient-to-r from-slate-900 via-[#131c2f] to-slate-900 border-b border-slate-700/80 px-1.5 sm:px-2 py-1 shadow-lg z-20">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-1.5">
          
          <div className="flex items-center gap-1.5">
            <div className="bg-blue-500/20 p-1 rounded border border-blue-500/30 shadow-inner">
              <SafeIcon name="Map" className="w-3.5 h-3.5 text-blue-400"/>
            </div>
            <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider leading-none drop-shadow-sm">
              {flightNo}
            </h1>
            <span className="text-[9px] sm:text-[10px] font-black font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30 tracking-wider">
                {routeInfo}
            </span>
            <div className="flex gap-1 items-center font-mono">
                <span className="text-[8px] font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1 py-0.5">{parsedReg}</span>
                {parsedDate && <span className="text-[8px] font-bold text-blue-300 bg-blue-900/40 border border-blue-500/40 rounded px-1 py-0.5">{parsedDate}</span>}
                <span className="text-[8px] font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1 py-0.5">ZFW:{parsedPzfw}</span>
                <span className="text-[8px] font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1 py-0.5">TAXI:{parsedTaxiOut}/{parsedTaxiIn}M</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            
            <div className="flex items-center gap-1.5 bg-[#0f172a] px-1.5 py-0.5 rounded-lg border border-slate-700 shadow-inner">
              
              <div className="flex flex-col items-center px-0.5">
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">STD(Z/L)</span>
                <div className="flex items-center gap-1 h-3.5">
                  <span className="text-[10px] font-mono font-extrabold text-slate-300 leading-none">
                    {navlogData && navlogData.stdH !== undefined && navlogData.stdM !== undefined ? `${String(navlogData.stdH).padStart(2, '0')}${String(navlogData.stdM).padStart(2, '0')}` : "----"}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-cyan-300/80 leading-none">({localStd || "----"})</span>
                </div>
              </div>

              <div className="w-px h-4 bg-slate-700"></div>

              <div className="flex flex-col items-center px-0.5">
                <label className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Takeoff(Z)</label>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="HHMM" maxLength={4} value={takeoffTime} onChange={(e) => setTakeoffTime(e.target.value.replace(/[^0-9]/g, ''))} className="bg-slate-800 border border-slate-600 rounded px-1 py-0 text-[10px] font-mono font-black text-white text-center w-11 h-4 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>

              <div className="w-px h-4 bg-slate-700"></div>

              <div className="flex flex-col items-center justify-center pt-0.5 px-1 min-w-[75px]">
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">ETA (Z/L)</span>
                <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between gap-0.5 w-full">
                        <span className="text-[7px] text-slate-500 font-bold">LDG</span>
                        <div className="flex items-center gap-0.5">
                            <span className="text-[9px] font-mono font-extrabold text-white leading-none">{calculatedData.estLandingTimeStr || "----"}</span>
                            <span className="text-[8px] font-mono font-bold text-slate-300/80 leading-none">({localLdg || "----"})</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-0.5 w-full">
                        <span className="text-[7px] text-slate-500 font-bold">BLK</span>
                        <div className="flex items-center gap-0.5">
                            <span className="text-[9px] font-mono font-extrabold text-amber-400 leading-none">{calculatedData.estBlockInStr || "----"}</span>
                            <span className="text-[8px] font-mono font-bold text-amber-200/80 leading-none">({localBlockIn || "----"})</span>
                        </div>
                    </div>
                </div>
              </div>

              <div className="w-px h-4 bg-slate-700"></div>

              <div className="flex flex-col items-center justify-center pt-0.5 px-1 min-w-[65px]">
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">STA (Z/L)</span>
                <div className="flex items-center gap-1 h-3.5">
                  <span className="text-[10px] font-mono font-extrabold text-slate-300 leading-none">{parsedSta || "----"}</span>
                  <span className="text-[10px] font-mono font-bold text-cyan-300/80 leading-none">({localSta || "----"})</span>
                </div>
              </div>

              <div className="w-px h-4 bg-slate-700"></div>

              <div className="flex flex-col items-center justify-center pt-0.5 px-1.5 min-w-[110px] max-w-[150px] shrink-0">
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">{parsedDestIcao} WX</span>
                <div className="flex items-center justify-center min-h-[14px] w-full">
                  {destWeather ? (
                    <div className="flex items-center gap-1 cursor-help whitespace-nowrap" title={destWeather.text}>
                      <span className="text-[12px] leading-none">{destWeather.icon}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        {destWeather.tempC}℃ <span className="text-amber-300/80 text-[9px]">({destWeather.tempF}℉)</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-slate-500">----</span>
                  )}
                </div>
              </div>

            </div>

            <div className="flex items-center gap-1 bg-[#0f172a] px-1.5 py-0.5 rounded-lg border border-slate-700 shadow-inner">
              <div className="flex flex-col items-center min-w-[38px] pt-0.5 px-0.5">
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">TIME DIFF</span>
                <span className={`text-[10px] font-mono font-extrabold leading-none h-3.5 flex items-center ${parseInt(calculatedData.latestAtoTimeDiffStr) > 0 ? 'text-red-400' : parseInt(calculatedData.latestAtoTimeDiffStr) < 0 ? 'text-green-400' : 'text-slate-200'}`}>
                    {calculatedData.latestAtoTimeDiffStr || "±0"}
                </span>
              </div>

              <div className="w-px h-4 bg-slate-700"></div>

              <div className="flex flex-col items-center min-w-[50px] pt-0.5 px-0.5">
                <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">FUEL DIFF</span>
                <div className="flex items-center gap-0.5 h-3.5">
                  {calculatedData.lastValidWpIndex !== -1 ? (
                    <span className={`text-[10px] font-mono font-extrabold leading-none ${calculatedData.totalBurnDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {calculatedData.totalBurnDiff > 0 ? '+' : ''}{calculatedData.totalBurnDiff.toFixed(1)}
                    </span>
                  ) : (<span className="text-slate-500 font-mono text-[10px] font-bold leading-none">--.-</span>)}
                  
                  <button onClick={() => setIsGraphOpen(true)} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-0.5 flex items-center justify-center transition-colors h-[16px]" title="Trend Graph">
                    <span className="text-[9px] leading-none">📊</span>
                  </button>
                </div>
              </div>

              <div className="w-px h-4 bg-slate-700"></div>
              
              <div className="flex flex-col items-center pt-0.5 px-0.5">
                 <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">MAX ALT</span>
                 <div className="flex items-center bg-slate-900 rounded border border-slate-700 cursor-pointer overflow-hidden shadow-inner h-3.5" onClick={() => setIs15gLimit(!is15gLimit)}>
                    <div className={`px-1 h-full flex items-center text-[7px] font-black ${!is15gLimit ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>1.3G</div>
                    <div className={`px-1 h-full flex items-center text-[7px] font-black ${is15gLimit ? 'bg-red-600 text-white' : 'text-slate-500'}`}>1.5G</div>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-auto sm:ml-0">
                <button onClick={scrollToCurrentFix} className="bg-slate-700 hover:bg-indigo-600 border border-indigo-500/50 text-indigo-300 hover:text-white px-1.5 py-1 rounded text-[8px] font-black tracking-wider shadow-sm transition-colors flex items-center gap-0.5">
                    <SafeIcon name="MapPin" className="w-2.5 h-2.5" /> NOW
                </button>
                <button onClick={() => setIsDistCheckOpen(true)} className="bg-slate-700 hover:bg-sky-600 border border-sky-500/50 text-sky-300 hover:text-white px-1.5 py-1 rounded text-[8px] font-black tracking-wider shadow-sm transition-colors flex items-center gap-0.5">
                    <SafeIcon name="Ruler" className="w-2.5 h-2.5" /> DIST CK
                </button>
                <button onClick={() => setIsSyncModalOpen(true)} className="bg-slate-700 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-300 hover:text-white px-1.5 py-1 rounded text-[8px] font-black tracking-wider shadow-sm transition-colors flex items-center gap-0.5">
                    <SafeIcon name="RefreshCw" className="w-2.5 h-2.5" /> SYNC
                </button>
            </div>

          </div>
        </div>

        <div className="max-w-[1400px] mx-auto mt-1 flex flex-wrap items-center gap-1 text-[9px] font-mono font-bold bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">
            <span className="text-slate-400">ETOPS:</span>
            {parsedEtopsInfo && parsedEtopsInfo.data ? (
                <div className="flex flex-wrap gap-1 items-center">
                    {parsedEtopsInfo.data.map((data, idx) => {
                        const etMins = timeToMinutes(data.et);
                        const revisedEt = etMins !== null ? minutesToTime((etMins + etopsTimeDiff + 1440 * 10) % 1440) : data.et;
                        const ltMins = timeToMinutes(data.lt);
                        const revisedLt = ltMins !== null ? minutesToTime((ltMins + etopsTimeDiff + 1440 * 10) % 1440) : data.lt;
                        
                        const isActive = activeEtopsAirport === data.airport;

                        return (
                            <div key={idx} className={`flex items-center gap-1 border px-1.5 py-0.5 rounded shadow-inner transition-colors duration-300 ${isActive ? 'bg-sky-800 border-sky-500 text-white' : 'bg-slate-900/90 border-slate-700 text-slate-300'}`}>
                                <span className={`${isActive ? 'text-white' : 'text-sky-300'} font-extrabold`}>{data.airport}</span>
                                <div className="flex items-center gap-0.5">
                                    <span className={`${isActive ? 'text-sky-200' : 'text-slate-500'} text-[8px] font-semibold`}>ET</span>
                                    <span className={`${isActive ? 'text-white' : 'text-slate-200'} font-bold`}>{revisedEt}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    <span className={`${isActive ? 'text-sky-200' : 'text-slate-500'} text-[8px] font-semibold`}>LT</span>
                                    <span className={`${isActive ? 'text-white' : 'text-slate-200'} font-bold`}>{revisedLt}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <span className="text-slate-500">NON ETOPS</span>
            )}
        </div>
      </header>

      {/* スクロールテーブル構造：最大幅を絞って要素の間延びを防止 (10列構成) */}
      <div className="flex-1 w-full relative overflow-hidden bg-slate-900/40">
        <div className="absolute inset-0 overflow-auto custom-scrollbar p-1">
            <div className="min-w-[700px] max-w-[1000px] mx-auto pb-16">
              
              <div className="sticky top-0 z-30 bg-[#0f172a] border-b border-slate-700 shadow-md rounded-t-lg">
                <div className="grid p-1 font-black text-slate-400 text-[9px] sm:text-[10px] text-center items-center leading-tight" style={gridColumnsStyle}>
                  <div className="text-left pl-1">WAYPOINT</div>
                  <div className="text-cyan-400">GS<br/><span className="text-[8px] text-cyan-500">TAS</span></div>
                  <div className="text-slate-400 flex flex-col items-center justify-center">
                    <span>CTME</span>
                    <span className="text-[8px] text-slate-500">RTME</span>
                  </div>
                  <div className="text-blue-300">ETO(Rev)<br/>ATO</div>
                  <div>DIFF</div>
                  <div className="text-slate-500">PLN FOB</div>
                  <div className="text-green-300">RMG<br/><span className="text-[7.5px]">DIFF</span></div>
                  <div>ACT (ALT / TMP / WIND)</div>
                  <div className="text-purple-300">MAX ALT<br/><span className="text-[7.5px] text-slate-500">WT</span></div>
                  <div>MEMO</div>
                </div>
              </div>
              
              <div className="divide-y divide-slate-800/80 bg-slate-900/60 rounded-b-lg border-x border-b border-slate-700/80">
                {calculatedData.flightData.map((row, idx) => (
                  <div key={idx} ref={el => rowRefs.current[idx] = el} className="grid py-0.5 px-1 items-center hover:bg-slate-800/60 transition-colors group text-center gap-x-1 box-border" style={gridColumnsStyle}>
                    <div className="font-mono text-xs sm:text-sm font-black text-left pl-1 text-slate-200 truncate">{row.wp}</div>
                    
                    <div className="flex flex-col items-center justify-center leading-none py-0.5 font-mono">
                        <span className="text-[10px] text-cyan-300 font-bold">{row.gs || '-'}</span>
                        <span className="text-[9px] text-cyan-500/80 font-medium mt-0.5">{row.tas || '-'}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center leading-none py-0.5 font-mono">
                        <span className="text-[10px] text-slate-300 font-bold">{formatTimePlus(row.ctme)}</span>
                        <span className="text-[8px] text-slate-500 font-medium mt-0.5">{formatTimePlus(row.rtme)}</span>
                    </div>
                    
                    <div className="flex flex-col px-0.5 gap-0.5 items-center w-full">
                      <span className="text-blue-400 font-mono text-[11px] font-extrabold leading-none">{row.revisedEtoStr || "----"}</span>
                      <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="ATO" maxLength={4} value={row.ato} onChange={(e) => handleUpdateActual(row.wp, 'ato', e.target.value.replace(/[^0-9]/g, ''))} className={`w-full max-w-[50px] mx-auto bg-[#05070a] border rounded py-0.5 text-center font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${row.ato ? 'border-blue-500/50 text-white' : 'border-slate-700 text-slate-400'}`} />
                    </div>
                    
                    <div className={`font-mono text-[10px] font-bold ${parseInt(row.timeDiffStr) > 0 ? 'text-red-400' : parseInt(row.timeDiffStr) < 0 ? 'text-green-400' : 'text-slate-400'}`}>{row.timeDiffStr}</div>

                    <div className="font-mono text-[10px] text-slate-400 font-bold">{row.fob ? row.fob.toFixed(1) : ''}</div>

                    <div className="flex flex-col px-0.5 gap-0.5 items-center w-full">
                      <span className={`font-mono text-[8px] leading-none ${row.fuelDiff > 0 ? 'text-green-400 font-bold' : row.fuelDiff < 0 ? 'text-red-400 font-bold' : 'text-transparent'}`}>
                          {row.fuelDiff !== null ? (`${row.fuelDiff > 0 ? '+' : ''}${row.fuelDiff.toFixed(1)}`) : '-'}
                      </span>
                      <input type="tel" inputMode="decimal" placeholder="RMG" value={row.afob} onChange={(e) => handleUpdateActual(row.wp, 'afob', e.target.value.replace(/[^0-9.]/g, ''))} className={`w-full max-w-[55px] mx-auto bg-[#05070a] border rounded py-0.5 text-center font-mono text-xs font-bold focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors ${row.afob ? 'border-green-500/50 text-white' : 'border-slate-700 text-slate-400'}`} />
                    </div>

                    <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-1 px-1 w-full max-w-[210px] mx-auto">
                        <div className="flex flex-col items-center justify-center w-full">
                            <input type="text" autoCapitalize="characters" placeholder="ACT" value={row.actAlt} onChange={(e) => handleUpdateActual(row.wp, 'actAlt', e.target.value.toUpperCase())} className="w-full max-w-[55px] bg-[#05070a] border border-slate-700 rounded text-center text-[10px] font-mono font-bold py-0.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-inner" />
                            <span className="text-[7.5px] text-slate-500 font-mono mt-0.5 leading-none">{row.plnAlt || "-"}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center w-full">
                            <span className="text-[7.5px] text-purple-400 font-mono font-bold leading-none mb-0.5 whitespace-nowrap">
                              {row.isaDev !== undefined && !isNaN(row.isaDev) ? `ISA${row.isaDev >= 0 ? '+' : ''}${row.isaDev}` : "-"}
                            </span>
                            <input type="text" autoCapitalize="characters" placeholder="ACT" value={row.actTmp} onChange={(e) => handleUpdateActual(row.wp, 'actTmp', e.target.value)} className="w-full max-w-[55px] bg-[#05070a] border border-slate-700 rounded text-center text-[10px] font-mono font-bold py-0.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-inner" />
                            <span className="text-[7.5px] text-slate-500 font-mono mt-0.5 leading-none">{row.plnTmp || "-"}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center w-full">
                            <span className="text-[7.5px] text-slate-500 font-mono leading-none mb-0.5 text-transparent">-</span>
                            <input type="text" autoCapitalize="characters" placeholder="ACT" value={row.actWind} onChange={(e) => handleUpdateActual(row.wp, 'actWind', e.target.value)} className="w-full max-w-[65px] bg-[#05070a] border border-slate-700 rounded text-center text-[10px] font-mono font-bold py-0.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-inner" />
                            <span className="text-[7.5px] text-slate-500 font-mono mt-0.5 leading-none">{row.plnWind || "-"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center leading-none">
                        <span className="font-mono text-xs sm:text-sm font-black text-purple-400">{row.maxAlt}</span>
                        <span className="text-[7.5px] text-slate-500 font-mono mt-0.5">W:{row.currentWeight}</span>
                    </div>

                    <div className="flex justify-center items-center">
                        <button 
                            onClick={() => setMemoModal({ isOpen: true, wp: row.wp, text: row.memo })}
                            className={`p-0.5 rounded transition-colors border shadow-sm flex items-center justify-center ${row.memo ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            title={row.memo ? "Edit Memo" : "Add Memo"}
                        >
                            <span className="text-[10px] leading-none">📝</span>
                        </button>
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