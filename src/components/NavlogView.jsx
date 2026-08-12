import React, { useState, useRef, useEffect, useMemo } from 'react';

// 機材ごとの MAX ALT (Buffet) パフォーマンスデータ
const MAX_ALT_DATA = {
  "772": [
    [320, 43100, 43100, 43100, 43100, 43100, 43100], [340, 43100, 43100, 43100, 43100, 43100, 43100], [360, 42100, 43100, 43100, 43100, 43000, 42300],
    [380, 41000, 43100, 43100, 42900, 42200, 41400], [400, 40000, 43100, 42300, 42100, 41300, 40500], [420, 39000, 43100, 41400, 41200, 40500, 39600],
    [440, 38000, 42900, 40500, 40400, 39600, 38700], [460, 37100, 42100, 39600, 39600, 38800, 37900], [480, 36300, 41300, 38800, 38700, 37900, 37100],
    [500, 35500, 40500, 37900, 37900, 37100, 36100], [520, 34800, 39600, 37000, 37100, 36200, 35200], [540, 34000, 38800, 36100, 36200, 35400, 34300], [560, 33600, 38000, 35200, 35400, 34500, 33500]
  ],
  "773": [
    [340, 43100, 43100, 43100, 43100, 43100, 43100], [360, 42300, 43100, 43100, 43100, 43100, 43100], [380, 41200, 43100, 43100, 43100, 42900, 42200],
    [400, 40100, 43100, 42200, 42600, 42100, 41400], [420, 39000, 43100, 41400, 41800, 41300, 40600], [440, 38000, 43100, 40600, 41100, 40500, 39700],
    [460, 37200, 42500, 39800, 40300, 39700, 38900], [480, 36400, 41700, 39000, 39500, 39000, 38100], [500, 35700, 40900, 38200, 38800, 37400, 36400],
    [520, 35000, 40200, 37400, 38000, 37400, 36400], [540, 34200, 39400, 36600, 37200, 36600, 35600]
  ],
  "77W": [
    [380, 42800, 42500, 40400, 43100, 43100, 43000], [400, 41800, 41900, 39700, 43100, 43100, 42400], [420, 40700, 41300, 39000, 42700, 42600, 41700],
    [440, 39600, 40700, 38300, 42200, 42000, 41100], [460, 38800, 40100, 37600, 41700, 41400, 40400], [480, 38000, 39400, 36900, 41100, 40800, 39700],
    [500, 37400, 38800, 36200, 40600, 40200, 39100], [520, 36800, 38200, 35500, 40100, 39600, 38400], [540, 36200, 37600, 34800, 39500, 39000, 37700],
    [560, 35600, 37000, 34100, 39000, 38400, 37100], [580, 34800, 36400, 33400, 38500, 37800, 36400], [600, 34200, 35800, 32700, 37900, 37200, 35700],
    [620, 33500, 35200, 32000, 37400, 36600, 35100], [640, 32800, 34500, 31300, 36900, 36000, 34400], [660, 32100, 33900, 30600, 36300, 35400, 33700],
    [680, 31500, 33300, 29900, 35800, 34800, 33100], [700, 30800, 32700, 29200, 35300, 34200, 32400], [720, 30200, 32100, 28500, 34700, 33600, 31700],
    [740, 29800, 31500, 27800, 34200, 33000, 31100], [760, 29200, 30900, 27100, 33700, 32400, 30400], [780, 28800, 30200, 26400, 33100, 31800, 28000]
  ],
  "77F": [
    [380, 43100, 43100, 40800, 43100, 43100, 43100], [400, 41700, 42500, 39700, 43100, 43100, 43100], [420, 40600, 41600, 38800, 43100, 43100, 43100],
    [440, 39700, 40800, 37900, 43100, 43100, 43100], [460, 38700, 40000, 37100, 43100, 43100, 43100], [480, 37800, 39200, 36300, 43100, 43100, 42500],
    [500, 37000, 38500, 35600, 42800, 42300, 41700], [520, 36200, 37800, 34900, 42000, 41500, 40900], [540, 36000, 37200, 34200, 41300, 40800, 40200],
    [560, 35700, 36500, 33500, 40500, 40100, 39500], [580, 34900, 35900, 32900, 39800, 39400, 38800], [600, 34200, 35400, 32300, 39200, 38700, 38100],
    [620, 33500, 34800, 31800, 38500, 38000, 37400], [640, 32800, 34300, 31200, 37800, 37400, 36800], [660, 32100, 33700, 30700, 37200, 36700, 36100],
    [680, 31500, 33200, 30100, 36500, 36100, 35600], [700, 30800, 32700, 29600, 36000, 35600, 35000], [720, 30200, 32300, 29200, 35400, 35000, 34300],
    [740, 29600, 31800, 28700, 34800, 34300, 33600], [760, 29100, 31300, 28100, 34200, 33700, 32900], [780, 28500, 30700, 27600, 33600, 33100, 32300]
  ]
};

const REG_MAP = {
  "JA713A": "772", "JA714A": "772", "JA715A": "772", "JA716A": "772", "JA717A": "772",
  "JA741A": "772", "JA742A": "772", "JA743A": "772", "JA744A": "772", "JA745A": "772",
  "JA751A": "773", "JA752A": "773", "JA753A": "773", "JA754A": "773", "JA755A": "773",
  "JA784A": "77W", "JA785A": "77W", "JA787A": "77W", "JA788A": "77W", "JA790A": "77W",
  "JA791A": "77W", "JA792A": "77W", "JA793A": "77W", "JA794A": "77W", "JA795A": "77W",
  "JA796A": "77W", "JA797A": "77W", "JA798A": "77W", "JA799A": "77W",
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
  let lower = tableData[0];
  let upper = tableData[tableData.length - 1];
  
  if (weight <= lower[0]) {
    upper = tableData[1] || tableData[0];
  } else if (weight >= upper[0]) {
    lower = tableData[tableData.length - 2] || upper;
  } else {
    for (let i = 0; i < tableData.length - 1; i++) {
      if (weight >= tableData[i][0] && weight <= tableData[i+1][0]) {
        lower = tableData[i];
        upper = tableData[i+1];
        break;
      }
    }
  }
  
  const weightDiff = upper[0] - lower[0];
  const ratio = weightDiff === 0 ? 0 : (weight - lower[0]) / weightDiff;
  const buffetIndex = is15g ? 3 : 2;
  const buffetAlt = lower[buffetIndex] + ratio * (upper[buffetIndex] - lower[buffetIndex]);
  const thrust10 = lower[4] + ratio * (upper[4] - lower[4]);
  const thrust15 = lower[5] + ratio * (upper[5] - lower[5]);
  const thrust20 = lower[6] + ratio * (upper[6] - lower[6]);
  
  let thrustAlt = thrust10;
  const currentIsa = isaDev || 0;
  if (currentIsa <= 10) {
    const isaRatio = (currentIsa - 10) / 5;
    thrustAlt = thrust10 + isaRatio * (thrust15 - thrust10);
    thrustAlt = Math.min(thrustAlt, 43100); 
  } else if (currentIsa <= 15) {
    const isaRatio = (currentIsa - 10) / 5;
    thrustAlt = thrust10 + isaRatio * (thrust15 - thrust10);
  } else if (currentIsa <= 20) {
    const isaRatio = (currentIsa - 15) / 5;
    thrustAlt = thrust15 + isaRatio * (thrust20 - thrust15);
  } else {
    const isaRatio = (currentIsa - 20) / 5;
    const slope = thrust20 - thrust15; 
    thrustAlt = thrust20 + isaRatio * slope;
    thrustAlt = Math.max(thrustAlt, 10000); 
  }
  
  const maxAlt = Math.min(buffetAlt, thrustAlt);
  return `FL${Math.round(maxAlt / 100)}`;
};

const SYNC_HEADER = "7PT|";
const packData = (data) => {
    const parts = [];
    for (const [wp, v] of Object.entries(data)) {
        if (v.ato || v.afob || v.actAlt || v.actTmp || v.actWind) {
            const alt = v.actAlt ? v.actAlt.replace('FL', '') : '';
            const wind = v.actWind ? v.actWind.replace('/', '') : '';
            parts.push(`${wp},${v.ato||''},${v.afob||''},${alt},${v.actTmp||''},${wind}`);
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
        const [wp, ato, afob, actAlt, actTmp, actWind] = row.split(',');
        if (wp) {
            const restoredAlt = actAlt ? (actAlt.startsWith('FL') ? actAlt : `FL${actAlt}`) : '';
            const restoredWind = actWind ? (actWind.length === 6 ? `${actWind.substring(0,3)}/${actWind.substring(3)}` : actWind) : '';
            res[wp] = { ato: ato||'', afob: afob||'', actAlt: restoredAlt, actTmp: actTmp||'', actWind: restoredWind };
        }
    });
    return res;
};

const MessageModal = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-sm w-full shadow-2xl text-center flex flex-col items-center">
                <p className="text-white text-lg mb-6 leading-relaxed whitespace-pre-wrap">{message}</p>
                <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95 w-full">確認 (OK)</button>
            </div>
        </div>
    );
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
                                onSync(parsedData); onClose(); showMessage("データを完全に同期しました！");
                            } else { showMessage("QRコードは読み取れましたが、データが空か形式が違います。"); }
                        } else {
                            setIsScanning(false); showMessage("写真からQRコードを検出できませんでした。\n手ブレや画面の反射を防ぐため、QRが画面の中央に来るように撮り直してください。");
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
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-xl max-w-md w-full shadow-2xl flex flex-col overflow-hidden">
                <div className="flex border-b border-slate-700">
                    <button className={`flex-1 py-4 text-sm font-bold ${activeTab === 'export' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-700'}`} onClick={() => setActiveTab('export')}>QRを表示 (送る)</button>
                    <button className={`flex-1 py-4 text-sm font-bold ${activeTab === 'import' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-700'}`} onClick={() => setActiveTab('import')}>カメラで読む (受ける)</button>
                </div>
                <div className="p-6 flex-1 min-h-[420px] flex flex-col items-center justify-center">
                    {activeTab === 'export' ? (
                        <div className="flex flex-col items-center w-full">
                            <div className="bg-white p-4 rounded-xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.15)]"><canvas ref={canvasRef}></canvas></div>
                            <p className="text-slate-300 text-sm text-center">相手のiPadにこのQRコードを見せてください。</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full space-y-8">
                            <div className="text-center space-y-3">
                                <h3 className="text-xl font-bold text-blue-400">相手のQRコードを撮影する</h3>
                                <p className="text-slate-300 text-sm">下のボタンから「写真を撮る」を選択し、<br/>相手の画面をハッキリと撮影してください。</p>
                            </div>
                            <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
                            <button onClick={() => fileInputRef.current.click()} disabled={isScanning} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-6 rounded-xl shadow-lg flex items-center justify-center space-x-3 transition-transform active:scale-95">
                                {isScanning ? <span>解析中...</span> : <span>写真を撮って読み取る</span>}
                            </button>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-end">
                    <button onClick={onClose} className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-slate-200 transition-colors">閉じる (CLOSE)</button>
                </div>
            </div>
        </div>
    );
};

export const NavlogView = ({ flightId, state, updateState, onApplyFlightPlan }) => {
  const [takeoffTime, setTakeoffTime] = useState('');
  const [actuals, setActuals] = useState({});
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const pdfInputRef = useRef(null);

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

  // ローカルストレージ復元
  useEffect(() => {
    const saved = localStorage.getItem('navlogFlightDataBackup');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.flightPlan) setFlightPlan(parsed.flightPlan);
            if (parsed.actuals) setActuals(parsed.actuals);
            if (parsed.flightNo) setFlightNo(parsed.flightNo);
            if (parsed.routeInfo) setRouteInfo(parsed.routeInfo);
            if (parsed.parsedReg) setParsedReg(parsed.parsedReg);
            if (parsed.parsedPzfw) setParsedPzfw(parsed.parsedPzfw);
            if (parsed.parsedTaxi) setParsedTaxi(parsed.parsedTaxi);
            if (parsed.parsedDate) setParsedDate(parsed.parsedDate);
            if (parsed.takeoffTime) setTakeoffTime(parsed.takeoffTime);
        } catch(e) {}
    }
  }, []);

  // ローカルストレージ保存
  useEffect(() => {
    const backup = { flightPlan, actuals, flightNo, routeInfo, parsedReg, parsedPzfw, parsedTaxi, parsedDate, takeoffTime };
    localStorage.setItem('navlogFlightDataBackup', JSON.stringify(backup));
  }, [flightPlan, actuals, flightNo, routeInfo, parsedReg, parsedPzfw, parsedTaxi, parsedDate, takeoffTime]);

  const parsePDFText = (text) => {
    let newPlan = [];
    const fNoMatch = text.match(/(ANA\d{3,4}|JAL\d{3,4}|NCA\d{3,4})/);
    const fNo = fNoMatch ? fNoMatch[1] : "UNKNOWN";
    const routeMatch = text.match(/([A-Z]{4})\s*-\s*([A-Z]{4})/);
    const rInfo = routeMatch ? `${routeMatch[1]} - ${routeMatch[2]}` : "UNKNOWN";
    const destIcao = routeMatch ? routeMatch[2] : null;
    const regMatch = text.match(/(JA\d{3}[A-Z]?)/);
    const pReg = regMatch ? regMatch[1] : "JA796A";
    const pzfwMatch = text.match(/(?:ZFW|PZFW)\s+(\d{3})(\d{3})/);
    let pPzfw = 400.0;
    if (pzfwMatch) pPzfw = parseFloat(`${pzfwMatch[1]}.${pzfwMatch[2].substring(0,1)}`);
    const taxiMatch = text.match(/AVG:\s*\d+\/(\d+)MIN/);
    const pTaxi = taxiMatch ? parseInt(taxiMatch[1], 10) : 10;
    const dateMatch = text.match(/\b(\d{2}[A-Z]{3}\d{2})\b/);
    const pDate = dateMatch ? dateMatch[1] : "";

    const cleanText = text.replace(/\(\s+/g, '(');
    const tokens = cleanText.split(/\s+/);
    let pendingCtme = null, pendingRtme = null, pendingFob = null, pendingTmp = "", pendingWind = "", pendingAlt = "";

    const ignoreList = ["ELEV", "RDIS", "TMP", "ZWIND", "SAT", "SPOT", "ETO", "ZTME", "ALT", "FUEL", "POS", "ATO", "DIST", "FL", "RMG", "RJTT", "KJFK", "KEWR", "PANC", "CYVR", "RJCC", "DEC", "CLM", "LRC", "PROG", "STEP", "CLIMB", "MINTMP", "COMPUTED", "COMPANY", "CLEARANCE", "MW/TP", "WSCP", "NONE", "OAT", "INTENTION", "SPEED", "ROUTE"];
    let lastAddedWp = null;

    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        const isaMatch = token.match(/^\(([-+]?\d{1,2})\)$/);
        if (isaMatch && lastAddedWp) { lastAddedWp.isaDev = parseInt(isaMatch[1], 10); continue; }
        const combinedFobTmp = token.match(/^(\d{2,3}\.\d)([-+M]\d{2,3})$/);
        if (combinedFobTmp) { pendingFob = parseFloat(combinedFobTmp[1]); pendingTmp = combinedFobTmp[2].replace('M', '-').replace('P', '+'); continue; }
        if (/^\d{2}\.\d{2}$/.test(token)) {
            const parts = token.split('.'); const mins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            if (pendingCtme === null) pendingCtme = mins; else if (pendingRtme === null) pendingRtme = mins;
            continue;
        }
        if (/^\d{2,3}\.\d$/.test(token)) { pendingFob = parseFloat(token); continue; }
        if (/^[-+M]\d{2,3}$/.test(token)) { pendingTmp = token.replace('M', '-').replace('P', '+'); continue; }
        if (/^\d{6}$/.test(token)) { const dir = parseInt(token.substring(0, 3), 10); if (dir <= 360) pendingWind = `${token.substring(0, 3)}/${token.substring(3)}`; continue; }
        if (/^\d{5}$/.test(token)) { const alt = parseInt(token, 10); if (alt >= 10000 && alt <= 60000) pendingAlt = `FL${Math.floor(alt / 100)}`; continue; }

        let cleanToken = token.replace(/^-+/, '');
        const isAlphaWp = /^[A-Z][A-Z0-9]{2,4}$/.test(cleanToken) && !ignoreList.includes(cleanToken);
        const isArincWp = /^\d{2}[NSWE]\d{2}$/.test(cleanToken);
        const isSpecialWp = ["TOC", "TOD"].includes(cleanToken);
        
        if (isAlphaWp || isArincWp || isSpecialWp) {
            if (pendingFob !== null || pendingCtme !== null || isSpecialWp) {
                const wpObj = { wp: cleanToken, ctme: pendingCtme || 0, rtme: pendingRtme || 0, fob: pendingFob !== null ? pendingFob : 0, plnAlt: pendingAlt, plnTmp: pendingTmp, plnWind: pendingWind, isaDev: 0 };
                newPlan.push(wpObj); lastAddedWp = wpObj;
                pendingCtme = null; pendingRtme = null; pendingFob = null; pendingTmp = ""; pendingWind = ""; pendingAlt = "";
                if (destIcao && cleanToken === destIcao) break;
            }
        }
    }

    const uniquePlan = [];
    const seen = new Set();
    for (const wp of newPlan) {
        if (!seen.has(wp.wp) && (wp.fob > 0 || wp.wp === "TOC" || wp.wp === "TOD" || wp.wp === destIcao)) {
            uniquePlan.push(wp); seen.add(wp.wp);
        }
    }

    return { newPlan: uniquePlan, fNo, rInfo, pReg, pPzfw, pTaxi, pDate };
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsParsingPdf(true);
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

        const { newPlan, fNo, rInfo, pReg, pPzfw, pTaxi, pDate } = parsePDFText(fullText);
        
        if (newPlan.length > 0) {
            setFlightPlan(newPlan); setFlightNo(fNo); setRouteInfo(rInfo); setParsedReg(pReg); setParsedPzfw(pPzfw); setParsedTaxi(pTaxi);
            if(pDate) setParsedDate(pDate);
            setActuals({}); setTakeoffTime(''); setToastMessage("フライトプランの読み込みが完了しました。");
            
            if (onApplyFlightPlan) {
              onApplyFlightPlan({ flightId: fNo.replace(/^[A-Z]+/, ''), reg: pReg });
            }
            
            hasAutoScrolled.current = false;
        } else { setToastMessage("フライトプランの読み取りに失敗しました。PDFの形式を確認してください。"); }
      } catch (err) { console.error(err); setToastMessage("PDFの解析に失敗しました。ファイルが破損しているか、非対応の形式です。"); } 
      finally { setIsParsingPdf(false); e.target.value = ''; }
    };
    reader.readAsArrayBuffer(file);
  };

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
        }
        return merged;
    });
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
        ...wpPlan, revisedEtoStr, ato: wpActual.ato || "", timeDiffStr, afob: wpActual.afob || "",
        fuelDiff, maxAlt, currentWeight: currentWeight.toFixed(1), actAlt: wpActual.actAlt || "",
        actTmp: wpActual.actTmp || "", actWind: wpActual.actWind || ""
      });
    }

    return { flightData: data, totalBurnDiff, lastValidWpIndex, estLandingTimeStr: minutesToTime(estLandingTimeMins), estBlockInStr: minutesToTime(estBlockInMins) };
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
        if (el) {
          el.classList.remove('bg-blue-600/30');
          el.classList.add('duration-1000');
        }
      }, 2000);
    }
  };

  useEffect(() => {
    if (!hasAutoScrolled.current && takeoffTime && calculatedData.flightData.length > 0) {
      const timer = setTimeout(() => {
        scrollToCurrentFix();
        hasAutoScrolled.current = true;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [takeoffTime, calculatedData.flightData]);

  const handleSendLog = async () => {
    try {
        setToastMessage("PDFを生成しています...");
        if (!window.jspdf) {
            const script1 = document.createElement('script'); script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; await new Promise(res => { script1.onload = res; document.head.appendChild(script1); });
            const script2 = document.createElement('script'); script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"; await new Promise(res => { script2.onload = res; document.head.appendChild(script2); });
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16); doc.text(`NAVLOG: ${flightNo}  ${routeInfo}`, 14, 20);
        doc.setFontSize(10); doc.text(`REG: ${parsedReg}   PZFW: ${parsedPzfw}   DATE: ${parsedDate}`, 14, 28);
        doc.text(`TAKEOFF(Z): ${takeoffTime || "----"}   EST BLOCK IN: ${calculatedData.estBlockInStr || "----"}`, 14, 34);

        const tableColumn = ["WP", "ATO", "PLN FOB", "RMG FOB", "ACT ALT", "ACT TMP", "ACT WIND"];
        const tableRows = [];
        calculatedData.flightData.forEach(row => {
            if (row.ato || row.afob || row.actAlt || row.actTmp || row.actWind) {
                tableRows.push([ row.wp, row.ato, row.fob ? row.fob.toFixed(1) : "---.-", row.afob || "---.-", row.actAlt || "---", row.actTmp || "---", row.actWind || "---" ]);
            }
        });

        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 40, theme: 'grid', styles: { fontSize: 9, cellPadding: 2 }, headStyles: { fillColor: [40, 50, 70] } });
        doc.text(`TOTAL BURN DIFF: ${calculatedData.totalBurnDiff > 0 ? '+' : ''}${calculatedData.totalBurnDiff.toFixed(1)}`, 14, doc.lastAutoTable.finalY + 10);

        const pdfBlob = doc.output('blob'); const file = new File([pdfBlob], `${flightNo}_NAVLOG.pdf`, { type: 'application/pdf' });
        await navigator.clipboard.writeText("ml_notice_drm@ana.co.jp");

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `${flightNo} NAVLOG`, text: "LOGデータを送信します。（宛先はクリップボードにコピーされています）" });
            setToastMessage(""); 
        } else { setToastMessage("この端末ではファイルの共有機能がサポートされていません。"); }
    } catch (e) { console.error(e); setToastMessage("PDFの生成または共有に失敗しました。"); }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      <MessageModal message={toastMessage} onClose={() => setToastMessage("")} />

      <header className="bg-slate-800 border-b border-slate-700 p-2 sm:p-4 shrink-0 shadow-lg z-10 relative">
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
              <input type="file" accept="application/pdf" className="hidden" ref={pdfInputRef} onChange={handlePdfUpload} />
              
              <button 
                onClick={scrollToCurrentFix}
                className="bg-indigo-700 hover:bg-indigo-600 border border-indigo-500 text-white px-2 sm:px-3 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold shadow-md flex items-center transition-colors"
                title="現在の時刻に基づき、通過中のFIXへスクロールします"
              >
                <span>📍 NOW</span>
              </button>

              <button 
                onClick={() => pdfInputRef.current.click()}
                disabled={isParsingPdf}
                className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold shadow-md flex items-center transition-colors disabled:opacity-50"
              >
                <span>{isParsingPdf ? "READING..." : "READ PDF"}</span>
              </button>
              
              <button 
                onClick={handleSendLog}
                className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold shadow-md flex items-center transition-colors"
              >
                <span>SEND LOG</span>
              </button>
            </div>

            <div className="flex gap-2 sm:gap-4 items-center bg-slate-900 p-2 sm:p-3 rounded-lg border border-slate-700">
              <div className="flex flex-col">
                <label className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Takeoff (Z)</label>
                <input 
                  type="text" placeholder="HHMM" maxLength={4} value={takeoffTime}
                  onChange={(e) => setTakeoffTime(e.target.value.replace(/[^0-9]/g, ''))}
                  className="bg-slate-800 border border-slate-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-base sm:text-xl font-mono text-white text-center w-16 sm:w-24 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="h-8 sm:h-10 w-px bg-slate-700"></div>
              <div className="flex flex-col min-w-[70px] sm:min-w-[100px]">
                <label className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Fuel Diff</label>
                <div className="flex items-center gap-2 h-full">
                  {calculatedData.lastValidWpIndex !== -1 ? (
                    <span className={`text-xl sm:text-2xl font-mono font-bold ${calculatedData.totalBurnDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {calculatedData.totalBurnDiff > 0 ? '+' : ''}{calculatedData.totalBurnDiff.toFixed(1)}
                    </span>
                  ) : (<span className="text-slate-500 font-mono text-lg sm:text-xl">--.-</span>)}
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

      <div className="flex-1 overflow-auto p-1 sm:p-2 max-w-[1400px] mx-auto w-full relative">
        <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden mb-24">
          <div className="grid grid-cols-[110px_80px_1fr_60px_80px_1fr_1.9fr_100px] bg-slate-900 p-2 font-bold text-slate-400 text-[11px] sm:text-xs border-b border-slate-700 sticky top-0 z-10 shadow-md text-center items-end min-w-[900px]">
            <div className="text-left pl-2">WAYPOINT</div>
            <div className="text-slate-500">CTME<br/><span className="text-[9px]">RTME</span></div>
            <div className="text-blue-300">ETO (Rev)<br/>ATO</div>
            <div>TIME<br/>DIFF</div>
            <div className="text-slate-500">PLN FOB</div>
            <div className="text-green-300">RMG FUEL<br/><span className="text-[9px]">DIFF</span></div>
            <div>ACT (ALT / TMP / WIND)</div>
            <div className="text-purple-300">MAX ALT<br/><span className="text-[9px] text-slate-500">WT</span></div>
          </div>
          
          <div className="divide-y divide-slate-700/50 pb-4 min-w-[900px]">
            {calculatedData.flightData.map((row, idx) => (
              <div key={idx} ref={el => rowRefs.current[idx] = el} className="grid grid-cols-[110px_80px_1fr_60px_80px_1fr_1.9fr_100px] py-1.5 px-2 items-center hover:bg-slate-700/40 transition-colors group text-center gap-x-1">
                <div className="font-mono text-lg sm:text-xl font-bold text-left pl-1 text-slate-200">{row.wp}</div>
                
                <div className="flex flex-col items-center">
                    <span className="font-mono text-sm text-slate-400">{formatTimePlus(row.ctme)}</span>
                    <span className="font-mono text-[10px] text-slate-500">{formatTimePlus(row.rtme)}</span>
                </div>
                
                <div className="flex flex-col px-1 gap-1 items-center">
                  <span className="text-blue-400 font-mono text-sm font-bold h-4 sm:h-5">{row.revisedEtoStr || "----"}</span>
                  <input 
                    type="text" placeholder="ATO" maxLength={4} value={row.ato}
                    onChange={(e) => handleUpdateActual(row.wp, 'ato', e.target.value.replace(/[^0-9]/g, ''))}
                    className={`w-full bg-slate-900 border rounded py-1.5 sm:py-2 text-center font-mono text-lg sm:text-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                      row.ato ? 'border-blue-500/50 text-white' : 'border-slate-600 text-slate-400'
                    }`}
                  />
                </div>
                
                <div className={`font-mono text-sm font-bold ${
                  parseInt(row.timeDiffStr) > 0 ? 'text-red-400' : parseInt(row.timeDiffStr) < 0 ? 'text-green-400' : 'text-slate-400'
                }`}>{row.timeDiffStr}</div>

                <div className="font-mono text-sm text-slate-500">{row.fob ? row.fob.toFixed(1) : ''}</div>

                <div className="flex flex-col px-1 gap-1 items-center">
                  <span className={`font-mono text-[10px] h-3 sm:h-4 ${row.fuelDiff > 0 ? 'text-green-400' : row.fuelDiff < 0 ? 'text-red-400' : ''}`}>
                      {row.fuelDiff !== null ? (`${row.fuelDiff > 0 ? '+' : ''}${row.fuelDiff.toFixed(1)}`) : ''}
                  </span>
                  <input 
                    type="text" placeholder="RMG" value={row.afob}
                    onChange={(e) => handleUpdateActual(row.wp, 'afob', e.target.value.replace(/[^0-9.]/g, ''))}
                    className={`w-full bg-slate-900 border rounded py-1.5 sm:py-2 text-center font-mono text-lg sm:text-xl focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors ${
                      row.afob ? 'border-green-500/50 text-white' : 'border-slate-600 text-slate-400'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-2 px-1">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-500 font-mono mb-0.5 h-3"></span>
                        <input type="text" placeholder="ACT" value={row.actAlt} onChange={(e) => handleUpdateActual(row.wp, 'actAlt', e.target.value.toUpperCase())}
                         className="w-full bg-slate-900 border border-slate-600 rounded text-center text-base font-mono py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-500 transition-colors shadow-inner" />
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 h-3">{row.plnAlt || "-"}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-purple-400 font-mono mb-0.5 h-3 font-bold">
                            {row.isaDev ? `ISA${row.isaDev > 0 ? '+' : ''}${row.isaDev}` : ""}
                        </span>
                        <input type="text" placeholder="ACT" value={row.actTmp} onChange={(e) => handleUpdateActual(row.wp, 'actTmp', e.target.value)}
                         className="w-full bg-slate-900 border border-slate-600 rounded text-center text-base font-mono py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-500 transition-colors shadow-inner" />
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 h-3">{row.plnTmp || "-"}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-500 font-mono mb-0.5 h-3"></span>
                        <input type="text" placeholder="ACT" value={row.actWind} onChange={(e) => handleUpdateActual(row.wp, 'actWind', e.target.value)}
                         className="w-full bg-slate-900 border border-slate-600 rounded text-center text-base font-mono py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-500 transition-colors shadow-inner" />
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 h-3">{row.plnWind || "-"}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center pt-2">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-purple-400">{row.maxAlt}</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-1">W: {row.currentWeight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-t border-slate-700 p-2 sm:p-4 flex justify-center z-20">
        <button 
            onClick={() => setIsSyncModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 sm:py-4 px-8 sm:px-12 rounded-full shadow-lg flex items-center space-x-3 transition-transform active:scale-95"
        >
            <span className="text-sm sm:text-lg">データ同期 (QR SYNC)</span>
        </button>
      </div>

      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        actuals={actuals}
        onSync={handleSyncData}
        showMessage={setToastMessage}
      />
    </div>
  );
};