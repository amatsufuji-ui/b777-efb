// NavlogView.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SafeIcon } from './SharedComponents';

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
  { wp: "TOC", ctme: 16, rtme: 725, fob: 237.2, plnAlt: "FL310", plnTmp: "-47", plnWind: "280/040", isaDev: 17 },
  { wp: "POROT", ctme: 24, rtme: 717, fob: 224.9, plnAlt: "FL310", plnTmp: "-26", plnWind: "314/015", isaDev: 17 },
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

// --- SVG 折れ線グラフ Modal ---
const GraphModal = ({ isOpen, onClose, flightData }) => {
    if (!isOpen) return null;
    const validPoints = flightData.filter(d => d.ato && (d.timeDiffStr !== '' || d.fuelDiff !== null));
    
    const width = 800;
    const height = 300;
    const paddingX = 60;
    const paddingY = 40;

    const maxT = Math.max(...validPoints.map(p => Math.abs(parseInt(p.timeDiffStr)||0)), 5);
    const maxF = Math.max(...validPoints.map(p => Math.abs(p.fuelDiff||0)), 2);

    const getX = (index) => paddingX + (index * ((width - paddingX * 2) / Math.max(validPoints.length - 1, 1)));
    const getY_T = (val) => (height / 2) - (val / maxT) * ((height - paddingY * 2) / 2);
    const getY_F = (val) => (height / 2) - (val / maxF) * ((height - paddingY * 2) / 2);

    const pointsT = validPoints.map((pt, i) => `${getX(i)},${getY_T(parseInt(pt.timeDiffStr)||0)}`).join(' ');
    const pointsF = validPoints.map((pt, i) => `${getX(i)},${getY_F(pt.fuelDiff||0)}`).join(' ');

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
                            {/* Center Zero Line */}
                            <line x1={paddingX} y1={height/2} x2={width - paddingX} y2={height/2} stroke="#475569" strokeWidth="2" strokeDasharray="5,5" />
                            
                            {/* Time Polyline (Blue/Cyan) */}
                            {validPoints.length > 1 && <polyline fill="none" stroke="#38bdf8" strokeWidth="3" points={pointsT} />}
                            
                            {/* Fuel Polyline (Green/Emerald) */}
                            {validPoints.length > 1 && <polyline fill="none" stroke="#34d399" strokeWidth="3" points={pointsF} />}

                            {/* Data Points & Labels */}
                            {validPoints.map((pt, i) => {
                                const cx = getX(i);
                                const tVal = parseInt(pt.timeDiffStr)||0;
                                const fVal = pt.fuelDiff||0;
                                const cyT = getY_T(tVal);
                                const cyF = getY_F(fVal);
                                return (
                                    <g key={i}>
                                        <line x1={cx} y1={paddingY} x2={cx} y2={height - paddingY} stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                                        
                                        <circle cx={cx} cy={cyT} r="5" fill="#38bdf8" />
                                        <text x={cx} y={cyT - 10} fill="#38bdf8" fontSize="12" textAnchor="middle" fontWeight="bold">{tVal > 0 ? '+'+tVal : tVal}</text>

                                        <circle cx={cx} cy={cyF} r="5" fill="#34d399" />
                                        <text x={cx} y={cyF + 20} fill="#34d399" fontSize="12" textAnchor="middle" fontWeight="bold">{fVal > 0 ? '+'+fVal.toFixed(1) : fVal.toFixed(1)}</text>
                                        
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
  const [toastMessage, setToastMessage] = useState("");
  
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
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
  const [parsedSta, setParsedSta] = useState("");
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
        if(navlogData.staH !== undefined && navlogData.staM !== undefined) {
            setParsedSta(`${String(navlogData.staH).padStart(2, '0')}${String(navlogData.staM).padStart(2, '0')}`);
        }
        hasAutoScrolled.current = false;
        
        // 新たなPDFが読み込まれた場合は実績値・メモ・TAKEOFFタイムをクリアする
        setActuals({});
        setTakeoffTime('');
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
                if (parsed.parsedSta) setParsedSta(parsed.parsedSta);
            }
        } catch(e) {}
    }
  }, []);

  useEffect(() => {
    const backup = { flightPlan, actuals, flightNo, routeInfo, parsedReg, parsedPzfw, parsedTaxi, parsedDate, parsedSta, takeoffTime };
    localStorage.setItem('navlogFlightDataBackup', JSON.stringify(backup));
  }, [flightPlan, actuals, flightNo, routeInfo, parsedReg, parsedPzfw, parsedTaxi, parsedDate, parsedSta, takeoffTime]);

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

      {/* 絶対にスクロールしない固定ヘッダー部分 */}
      <header className="shrink-0 bg-gradient-to-r from-slate-900 via-[#131c2f] to-slate-900 border-b border-slate-700/80 px-2 sm:px-3 py-1.5 shadow-lg z-20">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-2">
          
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/20 p-1 rounded border border-blue-500/30 shadow-inner">
              <SafeIcon name="Map" className="w-3.5 h-3.5 text-blue-400"/>
            </div>
            <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-widest leading-none drop-shadow-sm">
              {flightNo}
            </h1>
            <span className="text-[10px] sm:text-[11px] font-black font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 tracking-wider">
                {routeInfo}
            </span>
            <div className="flex gap-1 items-center font-mono">
                <span className="text-[9px] font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5">{parsedReg}</span>
                {parsedDate && <span className="text-[9px] font-bold text-blue-300 bg-blue-900/40 border border-blue-500/40 rounded px-1.5 py-0.5">{parsedDate}</span>}
                <span className="text-[9px] font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5">ZFW:{parsedPzfw}</span>
                <span className="text-[9px] font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5">TAXI:{parsedTaxi}M</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* 時間ブロック: TAKEOFF, EST LND, BLOCK IN, STA */}
            <div className="flex items-center gap-2 bg-[#0f172a] px-2 py-0.5 rounded-lg border border-slate-700 shadow-inner">
              <div className="flex flex-col items-center">
                <label className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">Takeoff(Z)</label>
                <input type="text" placeholder="HHMM" maxLength={4} value={takeoffTime} onChange={(e) => setTakeoffTime(e.target.value.replace(/[^0-9]/g, ''))} className="bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-xs font-mono font-black text-white text-center w-12 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              
              <div className="w-px h-5 bg-slate-700"></div>
              
              <div className="flex flex-col items-center justify-center pt-0.5 min-w-[45px]">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">EST LND</span>
                <span className="text-xs font-mono font-extrabold text-white leading-none h-4 flex items-center">{calculatedData.estLandingTimeStr || "----"}</span>
              </div>
              
              <div className="w-px h-5 bg-slate-700"></div>

              <div className="flex flex-col items-center justify-center pt-0.5 min-w-[45px]">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">BLOCK IN</span>
                <span className="text-xs font-mono font-extrabold text-amber-400 leading-none h-4 flex items-center">{calculatedData.estBlockInStr || "----"}</span>
              </div>

              <div className="w-px h-5 bg-slate-700"></div>

              <div className="flex flex-col items-center justify-center pt-0.5 min-w-[36px]">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">STA(Z)</span>
                <span className="text-xs font-mono font-extrabold text-slate-300 leading-none h-4 flex items-center">{parsedSta || "----"}</span>
              </div>
            </div>

            {/* DIFF と MAX ALT ブロック */}
            <div className="flex items-center gap-2 bg-[#0f172a] px-2 py-0.5 rounded-lg border border-slate-700 shadow-inner">
              <div className="flex flex-col items-center min-w-[45px] pt-0.5">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">Time Diff</span>
                <span className={`text-xs font-mono font-extrabold leading-none h-4 flex items-center ${parseInt(calculatedData.latestAtoTimeDiffStr) > 0 ? 'text-red-400' : parseInt(calculatedData.latestAtoTimeDiffStr) < 0 ? 'text-green-400' : 'text-slate-200'}`}>
                    {calculatedData.latestAtoTimeDiffStr || "±0"}
                </span>
              </div>

              <div className="w-px h-5 bg-slate-700"></div>

              <div className="flex flex-col items-center min-w-[60px] pt-0.5">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">Fuel Diff</span>
                <div className="flex items-center gap-1 h-4">
                  {calculatedData.lastValidWpIndex !== -1 ? (
                    <span className={`text-xs font-mono font-extrabold leading-none ${calculatedData.totalBurnDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {calculatedData.totalBurnDiff > 0 ? '+' : ''}{calculatedData.totalBurnDiff.toFixed(1)}
                    </span>
                  ) : (<span className="text-slate-500 font-mono text-xs font-bold leading-none">--.-</span>)}
                  
                  <button onClick={() => setIsGraphOpen(true)} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-1 flex items-center justify-center transition-colors h-[18px]" title="Trend Graph">
                    <span className="text-[10px] leading-none mb-[2px]">📊</span>
                  </button>
                </div>
              </div>

              <div className="w-px h-5 bg-slate-700"></div>
              
              <div className="flex flex-col items-center pt-0.5">
                 <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">MAX ALT</span>
                 <div className="flex items-center bg-slate-900 rounded border border-slate-700 cursor-pointer overflow-hidden shadow-inner h-4" onClick={() => setIs15gLimit(!is15gLimit)}>
                    <div className={`px-1 h-full flex items-center text-[8px] font-black ${!is15gLimit ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>1.3G</div>
                    <div className={`px-1 h-full flex items-center text-[8px] font-black ${is15gLimit ? 'bg-red-600 text-white' : 'text-slate-500'}`}>1.5G</div>
                 </div>
              </div>
            </div>

            {/* ボタン ブロック */}
            <div className="flex items-center gap-1 ml-auto sm:ml-0">
                <button onClick={scrollToCurrentFix} className="bg-slate-700 hover:bg-indigo-600 border border-indigo-500/50 text-indigo-300 hover:text-white px-2 py-1.5 rounded text-[9px] font-black tracking-wider shadow-sm transition-colors flex items-center gap-0.5">
                    <SafeIcon name="MapPin" className="w-3 h-3" /> NOW
                </button>
                <button onClick={() => setIsSyncModalOpen(true)} className="bg-slate-700 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-300 hover:text-white px-2 py-1.5 rounded text-[9px] font-black tracking-wider shadow-sm transition-colors flex items-center gap-0.5">
                    <SafeIcon name="RefreshCw" className="w-3 h-3" /> SYNC
                </button>
            </div>

          </div>
        </div>
      </header>

      {/* スクロール領域 (親の flex-1 overflow-hidden と自身の absolute/overflow-auto で確実に中身だけスクロールさせる) */}
      <div className="flex-1 w-full relative overflow-hidden bg-slate-900/40">
        <div className="absolute inset-0 overflow-auto custom-scrollbar p-1 sm:p-2">
            <div className="min-w-[700px] max-w-[1400px] mx-auto pb-16">
              
              {/* テーブルヘッダー (sticky で追従) */}
              <div className="sticky top-0 z-30 bg-[#0f172a] border-b border-slate-700 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] rounded-t-lg">
                <div className="grid grid-cols-[85px_65px_1fr_50px_65px_1fr_1.8fr_85px_35px] p-1.5 font-black text-slate-400 text-[10px] sm:text-[11px] text-center items-end">
                  <div className="text-left pl-1">WAYPOINT</div>
                  <div className="text-slate-500">CTME<br/><span className="text-[8px]">RTME</span></div>
                  <div className="text-blue-300">ETO (Rev)<br/>ATO</div>
                  <div>TIME<br/>DIFF</div>
                  <div className="text-slate-500">PLN FOB</div>
                  <div className="text-green-300">RMG FUEL<br/><span className="text-[8px]">DIFF</span></div>
                  <div>ACT (ALT / TMP / WIND)</div>
                  <div className="text-purple-300">MAX ALT<br/><span className="text-[8px] text-slate-500">WT</span></div>
                  <div>MEMO</div>
                </div>
              </div>
              
              {/* スクロールするデータ行 */}
              <div className="divide-y divide-slate-800/80 bg-slate-900/60 rounded-b-lg border-x border-b border-slate-700/80">
                {calculatedData.flightData.map((row, idx) => (
                  <div key={idx} ref={el => rowRefs.current[idx] = el} className="grid grid-cols-[85px_65px_1fr_50px_65px_1fr_1.8fr_85px_35px] py-1 px-1.5 items-center hover:bg-slate-800/60 transition-colors group text-center gap-x-1">
                    <div className="font-mono text-sm sm:text-base font-black text-left pl-1 text-slate-200 truncate">{row.wp}</div>
                    
                    <div className="flex flex-col items-center leading-tight">
                        <span className="font-mono text-xs text-slate-400 font-bold">{formatTimePlus(row.ctme)}</span>
                        <span className="font-mono text-[9px] text-slate-500">{formatTimePlus(row.rtme)}</span>
                    </div>
                    
                    <div className="flex flex-col px-0.5 gap-0.5 items-center">
                      <span className="text-blue-400 font-mono text-xs font-extrabold h-3.5 sm:h-4">{row.revisedEtoStr || "----"}</span>
                      <input type="text" placeholder="ATO" maxLength={4} value={row.ato} onChange={(e) => handleUpdateActual(row.wp, 'ato', e.target.value.replace(/[^0-9]/g, ''))} className={`w-full bg-[#05070a] border rounded py-1 text-center font-mono text-sm sm:text-base font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${row.ato ? 'border-blue-500/50 text-white' : 'border-slate-700 text-slate-400'}`} />
                    </div>
                    
                    <div className={`font-mono text-xs font-bold ${parseInt(row.timeDiffStr) > 0 ? 'text-red-400' : parseInt(row.timeDiffStr) < 0 ? 'text-green-400' : 'text-slate-400'}`}>{row.timeDiffStr}</div>

                    <div className="font-mono text-xs text-slate-400 font-bold">{row.fob ? row.fob.toFixed(1) : ''}</div>

                    <div className="flex flex-col px-0.5 gap-0.5 items-center">
                      <span className={`font-mono text-[9px] h-3 ${row.fuelDiff > 0 ? 'text-green-400 font-bold' : row.fuelDiff < 0 ? 'text-red-400 font-bold' : ''}`}>
                          {row.fuelDiff !== null ? (`${row.fuelDiff > 0 ? '+' : ''}${row.fuelDiff.toFixed(1)}`) : ''}
                      </span>
                      <input type="text" placeholder="RMG" value={row.afob} onChange={(e) => handleUpdateActual(row.wp, 'afob', e.target.value.replace(/[^0-9.]/g, ''))} className={`w-full bg-[#05070a] border rounded py-1 text-center font-mono text-sm sm:text-base font-bold focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors ${row.afob ? 'border-green-500/50 text-white' : 'border-slate-700 text-slate-400'}`} />
                    </div>

                    {/* ★ 上にISA DEV、下にTMP（PLN/ACT入力）、下にWIND（PLN/ACT入力） ★ */}
                    <div className="grid grid-cols-3 gap-0.5 px-0.5">
                        <div className="flex flex-col items-center justify-center">
                            <input type="text" placeholder="ACT" value={row.actAlt} onChange={(e) => handleUpdateActual(row.wp, 'actAlt', e.target.value.toUpperCase())} className="w-full bg-[#05070a] border border-slate-700 rounded text-center text-xs font-mono font-bold py-1 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-inner" />
                            <span className="text-[8px] text-slate-500 font-mono mt-0.5 h-2.5">{row.plnAlt || "-"}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-[8px] text-purple-400 font-mono font-bold mb-0.5 h-2.5 leading-none">{row.isaDev !== undefined && !isNaN(row.isaDev) ? `ISA${row.isaDev >= 0 ? '+' : ''}${row.isaDev}` : "-"}</span>
                            <input type="text" placeholder="ACT" value={row.actTmp} onChange={(e) => handleUpdateActual(row.wp, 'actTmp', e.target.value)} className="w-full bg-[#05070a] border border-slate-700 rounded text-center text-xs font-mono font-bold py-1 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-inner" />
                            <span className="text-[8px] text-slate-500 font-mono mt-0.5 h-2.5 leading-none">{row.plnTmp || "-"}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-[8px] text-slate-500 font-mono mb-0.5 h-2.5 leading-none"></span>
                            <input type="text" placeholder="ACT" value={row.actWind} onChange={(e) => handleUpdateActual(row.wp, 'actWind', e.target.value)} className="w-full bg-[#05070a] border border-slate-700 rounded text-center text-xs font-mono font-bold py-1 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-inner" />
                            <span className="text-[8px] text-slate-500 font-mono mt-0.5 h-2.5 leading-none">{row.plnWind || "-"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center pt-0.5 leading-none">
                        <span className="font-mono text-base sm:text-lg font-black text-purple-400">{row.maxAlt}</span>
                        <span className="text-[8px] text-slate-500 font-mono mt-0.5">W:{row.currentWeight}</span>
                    </div>

                    {/* MEMO ボタン */}
                    <div className="flex justify-center items-center">
                        <button 
                            onClick={() => setMemoModal({ isOpen: true, wp: row.wp, text: row.memo })}
                            className={`p-1 rounded transition-colors border shadow-sm flex items-center justify-center ${row.memo ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            title={row.memo ? "Edit Memo" : "Add Memo"}
                        >
                            <span className="text-[11px] leading-none">📝</span>
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