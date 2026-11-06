// NavlogView.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SafeIcon } from './SharedComponents';
import { 
    WMO_CODES, 
    ICAO_COORDS, 
    ADEQUATE_AIRPORTS, 
    REG_MAP, 
    MAX_ALT_DATA, 
    ICAO_TZ, 
    DEFAULT_FLIGHT_PLAN_DATA 
} from '../data/flightData';

// 主要FIRの名称マッピング
const FIR_NAMES = {
    "RJJJ": "Fukuoka", "RJTG": "Tokyo", "ROIG": "Naha", "RKRR": "Incheon", "ZBAA": "Beijing", 
    "ZSHA": "Shanghai", "ZGZU": "Guangzhou", "ZJSA": "Sanya", "ZCZC": "Wuhan", "ZHWZ": "Zhanjiang",
    "ZWUQ": "Urumqi", "ZYSH": "Shenyang", "ZPKM": "Kunming", "VHHH": "Hong Kong", "RCAA": "Taipei",
    "RPHI": "Manila", "VVHM": "Ho Chi Minh", "VVNB": "Hanoi", "VTBB": "Bangkok", "WMFC": "Kuala Lumpur",
    "WSJC": "Singapore", "WIIF": "Jakarta", "WAAF": "Ujung Pandang", "VDEF": "Phnom Penh",
    "VLVT": "Vientiane", "VYYF": "Yangon", "VGFR": "Dhaka", "VECF": "Kolkata", "VIDF": "Delhi",
    "VABF": "Mumbai", "VOMF": "Chennai", "OPKR": "Karachi", "OPLR": "Lahore", "OAKX": "Kabul",
    "UHHH": "Khabarovsk", "UHMM": "Magadan", "UHPP": "Petropavlovsk-Kamchatsky", "UHWW": "Vladivostok",
    "PAZA": "Anchorage", "KZOA": "Oakland", "KZSEA": "Seattle", "KZLA": "Los Angeles",
    "KZNY": "New York", "KZAU": "Chicago", "KZMA": "Miami", "KZHU": "Houston", "KZBW": "Boston",
    "CZEG": "Edmonton", "CZVR": "Vancouver", "CZYZ": "Toronto", "CZUL": "Montreal", "CZQX": "Gander",
    "EGGX": "Shanwick", "EGTT": "London", "LFFF": "Paris", "EDVV": "Hannover", "EHAA": "Amsterdam",
    "LIRR": "Rome", "LECM": "Madrid", "YBBB": "Brisbane", "YMMM": "Melbourne", "NZZO": "Auckland Oceanic",
    "NFFF": "Nadi", "PHZH": "Honolulu", "NTTT": "Tahiti", "KZDC": "Washington", "KZFW": "Fort Worth",
    "LOVV": "Vienna", "LHCC": "Budapest", "LRBB": "Bucharest", "LBSR": "Sofia",
    "LTBB": "Istanbul", "LTAA": "Ankara", "UGGG": "Tbilisi", "UBBA": "Baku",
    "UATT": "Aktobe", "UZTR": "Tashkent", "UAII": "Shymkent", "UAAA": "Almaty",
    "ZLHW": "Lanzhou", "ZBPE": "Beijing",
    "EBUR": "Brussels", "EDUU": "Rhein", "EDYY": "Maastricht", "LKAA": "Praha", "LZBB": "Bratislava"
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

const parseCoordString = (coordStr) => {
    if (!coordStr) return null;
    
    const explicitMatch = coordStr.match(/^([NS])(\d{2})(\d{3})([EW])(\d{3})(\d{3})$/i);
    if (explicitMatch) {
        let lat = parseInt(explicitMatch[2], 10) + parseInt(explicitMatch[3], 10) / 600;
        if (explicitMatch[1].toUpperCase() === 'S') lat = -lat;
        let lon = parseInt(explicitMatch[5], 10) + parseInt(explicitMatch[6], 10) / 600;
        if (explicitMatch[4].toUpperCase() === 'W') lon = -lon;
        return { lat, lon };
    }
    
    const arincMatch = coordStr.match(/^(\d{2})([NSWE])(\d{2})$/i);
    if (arincMatch) {
        let latVal = parseInt(arincMatch[1], 10);
        let lonVal = parseInt(arincMatch[3], 10);
        let lat, lon;
        const hemi = arincMatch[2].toUpperCase();
        
        switch (hemi) {
            case 'N': lat = latVal; lon = -lonVal; break;
            case 'E': lat = latVal; lon = lonVal; break;  
            case 'S': lat = -latVal; lon = lonVal; break; 
            case 'W': lat = -latVal; lon = -lonVal; break; 
            default: return null;
        }
        
        if (hemi === 'N' || hemi === 'W') {
            if (lonVal < 100 && lon < 0 && hemi === 'N') {
               lon -= 100;
            }
        }
        return { lat, lon };
    }

    const rawMatch = coordStr.match(/^(\d{2})(\d{3})([NSWE])(\d{3})(\d{3})$/i);
    if (rawMatch) {
        let lat = parseInt(rawMatch[1], 10) + parseInt(rawMatch[2], 10) / 600;
        let lon = parseInt(rawMatch[4], 10) + parseInt(rawMatch[5], 10) / 600;
        const lonDir = rawMatch[3].toUpperCase();
        if (lonDir === 'W') lon = -lon;
        return { lat, lon };
    }

    const fullLatLonMatch = coordStr.match(/^([NS])(\d{2})(\d{3})([EW])(\d{3})(\d{3})$/i);
    if (fullLatLonMatch) {
        let lat = parseInt(fullLatLonMatch[2], 10) + parseInt(fullLatLonMatch[3], 10) / 600;
        if (fullLatLonMatch[1].toUpperCase() === 'S') lat = -lat;
        
        let lon = parseInt(fullLatLonMatch[5], 10) + parseInt(fullLatLonMatch[6], 10) / 600;
        if (fullLatLonMatch[4].toUpperCase() === 'W') lon = -lon;
        
        return { lat, lon };
    }
    
    return null;
};

const findNearestAirports = (wpName, wpLatLon, acType) => {
    let coords = parseCoordString(wpLatLon || wpName);
    if (!coords && ICAO_COORDS[wpName]) {
        coords = ICAO_COORDS[wpName];
    }
    
    if (!coords) return [];

    const targetAirportsList = ADEQUATE_AIRPORTS[acType];
    if (!targetAirportsList || targetAirportsList.length === 0) return [];

    const distances = targetAirportsList.map(icao => {
        const aptData = ICAO_COORDS[icao];
        if (!aptData) return null;
        const dist = getDistanceNM(coords.lat, coords.lon, aptData.lat, aptData.lon);
        return { icao, dist, name: aptData.name };
    }).filter(item => item !== null);

    distances.sort((a, b) => a.dist - b.dist);
    return distances.slice(0, 2);
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
            const isLatLon = /^\d{2}[A-Z]\d{2}$|^\d{4}[A-Z]$|^\d{2}[NS]\d{2}[EW]$|^(\d{2})(\d{3})([NSWE])(\d{3})(\d{3})$/i.test(wp.wp) || wp.latLon;

            if (isExclude) {
                continue;
            }

            if (lastBoundaryWp) {
                const wasLatLon = /^\d{2}[A-Z]\d{2}$|^\d{4}[A-Z]$|^\d{2}[NS]\d{2}[EW]$|^(\d{2})(\d{3})([NSWE])(\d{3})(\d{3})$/i.test(lastBoundaryWp.wp) || lastBoundaryWp.latLon;
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
                    spellCheck={false}
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

const WpAlertModal = ({ wpName, onClose }) => {
    if (!wpName) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-rose-950 border-2 border-rose-500 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(244,63,94,0.4)] flex flex-col items-center text-center animate-in zoom-in duration-300">
                <div className="bg-rose-500 p-4 rounded-full mb-4 animate-pulse shadow-lg">
                    <SafeIcon name="BellRing" className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-widest">{wpName}</h2>
                <div className="w-16 h-1 bg-rose-500 rounded-full mb-4"></div>
                <p className="text-rose-200 font-bold mb-8 text-sm sm:text-base leading-relaxed">
                    通過予定時刻になりました。<br/>位置通報(POS REP)等を確認してください。
                </p>
                <button onClick={onClose} className="w-full py-4 bg-white hover:bg-slate-200 text-rose-950 rounded-xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                    <SafeIcon name="CheckCircle2" className="w-6 h-6" /> 確認 (ACK)
                </button>
            </div>
        </div>
    );
};

const TimerSuggestModal = ({ data, onClose }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!data || !data.targetEtoMs) return;
        const tick = () => {
            let diff = data.targetEtoMs - Date.now();
            if (diff <= 0) {
                setTimeLeft({ h: 0, m: 0, s: 0, text: "00:00:00" });
                return;
            }
            const totalSec = Math.floor(diff / 1000);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = totalSec % 60;
            const hh = h.toString().padStart(2, '0');
            const mm = m.toString().padStart(2, '0');
            const ss = s.toString().padStart(2, '0');
            setTimeLeft({ h, m, s, text: h > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}` });
        };
        tick();
        const timerId = setInterval(tick, 1000);
        return () => clearInterval(timerId);
    }, [data]);

    if (!data) return null;
    
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border-2 border-slate-600 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">
                <div className="bg-sky-500/20 p-4 rounded-full mb-4 border border-sky-500/50">
                    <SafeIcon name="Timer" className="w-10 h-10 text-sky-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-widest">{data.wpName} ETO</h2>
                <div className="text-slate-300 font-bold mb-6 text-sm w-full">
                    通過予定まで残り
                    <div className="text-amber-400 text-4xl sm:text-5xl font-mono font-black my-3 tracking-widest drop-shadow-md">
                        {timeLeft ? timeLeft.text : "--:--"}
                    </div>
                    {timeLeft && (
                        <div className="text-amber-300 text-xs font-bold mb-3 opacity-80">
                            ({timeLeft.h}時間 {timeLeft.m}分 {timeLeft.s}秒)
                        </div>
                    )}
                    <span className="text-xs opacity-80 block mt-2">iPadの時計アプリでタイマーをセットしてください。</span>
                    
                    <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700 rounded-lg text-left">
                        <span className="text-xs text-sky-300 block mb-1">■ 画面を開いたままにする場合</span>
                        <span className="text-[10px] text-slate-300 block mb-3">時間到達時にこのアプリが自動でお知らせします。</span>
                        
                        <span className="text-xs text-amber-300 block mb-1">■ 他のアプリを開く・スリープする場合</span>
                        <span className="text-[10px] text-slate-300 block">通知が鳴らないため、iPadの時計アプリ等でタイマーを併用してください。</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                    <button onClick={onClose} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-colors shadow-lg">
                        確認して閉じる
                    </button>
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

  const [activeAlerts, setActiveAlerts] = useState({});
  const [triggeredAlerts, setTriggeredAlerts] = useState({});
  const [popupWp, setPopupWp] = useState(null);
  
  const [timerPopupData, setTimerPopupData] = useState(null);
  
  const holdTimeout = useRef(null);
  const rowRefs = useRef([]);
  const hasAutoScrolled = useRef(false);
  const lastLoadId = useRef(null);
  const pdfExportInputRef = useRef(null); 

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
  const [parsedEetList, setParsedEetList] = useState([]);

  const [localStd, setLocalStd] = useState("");
  const [localSta, setLocalSta] = useState("");
  const [localBlockIn, setLocalBlockIn] = useState("");
  const [localLdg, setLocalLdg] = useState("");

  const [destWeather, setDestWeather] = useState(null);
  const [lastFetchedBlockInMins, setLastFetchedBlockInMins] = useState(null);
  const [lastFetchedDestIcao, setLastFetchedDestIcao] = useState(null);
  const [parsedEtopsInfo, setParsedEtopsInfo] = useState(null);
  
  const [flightTimeStr, setFlightTimeStr] = useState("");

  const [currentUtcMins, setCurrentUtcMins] = useState(() => {
      const now = new Date();
      return now.getUTCHours() * 60 + now.getUTCMinutes();
  });

  useEffect(() => {
      const timer = setInterval(() => {
          const now = new Date();
          const newMins = now.getUTCHours() * 60 + now.getUTCMinutes();
          setCurrentUtcMins(prev => prev !== newMins ? newMins : prev);
      }, 10000);
      return () => clearInterval(timer);
  }, []);

  const calculatedData = useMemo(() => {
    const data = [];
    const takeoffMinutes = timeToMinutes(takeoffTime);
    
    // 確実な機番マッピングからの取得
    const acType = REG_MAP[parsedReg] || "77W";
    const perfTable = MAX_ALT_DATA[acType] || MAX_ALT_DATA["77W"];
    
    const isNearestAirportEligible = !!ADEQUATE_AIRPORTS[acType];

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
      let revisedEtoMins = null; 
      let timeDiffStr = "";
      let originalEtoMins = (takeoffMinutes !== null ? takeoffMinutes : 0) + wpPlan.ctme;
      let appliedDiff = currentDiff;

      if (takeoffMinutes !== null) {
          const calculatedEtoMins = originalEtoMins + currentDiff;
          revisedEtoMins = calculatedEtoMins;
          revisedEtoStr = minutesToTime(calculatedEtoMins);

          if (wpActual.ato) {
              const atoMins = timeToMinutes(wpActual.ato);
              if (atoMins !== null) {
                  let diff = atoMins - originalEtoMins; 
                  if (diff < -720) diff += 1440; if (diff > 720) diff -= 1440;
                  
                  timeDiffStr = formatTimeDiff(diff);
                  currentDiff = diff; 
                  revisedEtoMins = atoMins; // ATOがある場合はATOを通過時間としてEET計算のベースにする
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

      let nearestAirports = [];
      if (isNearestAirportEligible && (wpPlan.latLon || wpPlan.wp)) {
         nearestAirports = findNearestAirports(wpPlan.wp, wpPlan.latLon, acType);
      }

      data.push({
        ...wpPlan, revisedEtoStr, revisedEtoMins, ato: wpActual.ato || "", timeDiffStr, afob: wpActual.afob || "", memo: wpActual.memo || "",
        fuelDiff, maxAlt, currentWeight: currentWeight.toFixed(1), actAlt: wpActual.actAlt || "",
        actTmp: wpActual.actTmp || "", actWind: wpActual.actWind || "",
        nearestAirports, originalEtoMins, appliedDiff
      });
    }

    return { flightData: data, totalBurnDiff, lastValidWpIndex, estLandingTimeStr: minutesToTime(estLandingTimeMins), estBlockInStr: minutesToTime(estBlockInMins), estBlockInMins, estLandingTimeMins, latestAtoTimeDiffStr: formatTimeDiff(latestAtoTimeDiff), latestAtoTimeDiff, isNearestAirportEligible, takeoffMinutes };
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
        
        if (navlogData.fltTimeH !== undefined && navlogData.fltTimeM !== undefined) {
             setFlightTimeStr(`${String(navlogData.fltTimeH).padStart(2, '0')}:${String(navlogData.fltTimeM).padStart(2, '0')}`);
        } else {
             setFlightTimeStr("");
        }

        if (navlogData.parsedEtopsInfo !== undefined) {
            setParsedEtopsInfo(navlogData.parsedEtopsInfo);
        } else {
            setParsedEtopsInfo(null);
        }
        
        if (navlogData.eetList !== undefined) {
            setParsedEetList(navlogData.eetList);
        } else {
            setParsedEetList([]);
        }

        hasAutoScrolled.current = false;
        
        if (navlogData.isNew && navlogData.loadId !== lastLoadId.current) {
            lastLoadId.current = navlogData.loadId;

            setActuals({});
            setMemoModal({ isOpen: false, wp: '', text: '' });
            setIsDistCheckOpen(false);
            setIsGraphOpen(false);
            setActiveAlerts({});
            setTriggeredAlerts({});
            setPopupWp(null);
            setTimerPopupData(null);
            
            if (navlogData.stdH !== undefined && navlogData.stdM !== undefined && !isNaN(navlogData.stdH) && !isNaN(navlogData.stdM)) {
                const taxiOut = navlogData.pTaxiOut !== undefined && !isNaN(navlogData.pTaxiOut) ? navlogData.pTaxiOut : 20;
                const defaultToMins = (navlogData.stdH * 60 + navlogData.stdM + taxiOut) % 1440;
                setTakeoffTime(minutesToTime(defaultToMins));
            } else {
                setTakeoffTime('');
            }
        } else if (!navlogData.isNew) {
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
            if (parsed.activeAlerts) setActiveAlerts(parsed.activeAlerts);
            if (parsed.triggeredAlerts) setTriggeredAlerts(parsed.triggeredAlerts);
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
                if (parsed.parsedEetList) setParsedEetList(parsed.parsedEetList);
                
                if (parsed.flightPlan && parsed.flightPlan.length > 0) {
                    const destWp = parsed.flightPlan[parsed.flightPlan.length - 1];
                    if (destWp.ctme > 0) {
                        const h = Math.floor(destWp.ctme / 60);
                        const m = destWp.ctme % 60;
                        setFlightTimeStr(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                    }
                }
            }
        } catch(e) {}
    }
  }, []);

  useEffect(() => {
    try {
        const backup = { flightPlan, actuals, flightNo, routeInfo, parsedDepIcao, parsedReg, parsedPzfw, parsedTaxiOut, parsedTaxiIn, parsedDate, parsedSta, parsedDestIcao, takeoffTime, parsedEtopsInfo, activeAlerts, triggeredAlerts, parsedEetList };
        localStorage.setItem('navlogFlightDataBackup', JSON.stringify(backup));
    } catch (e) {}
  }, [flightPlan, actuals, flightNo, routeInfo, parsedDepIcao, parsedReg, parsedPzfw, parsedTaxiOut, parsedTaxiIn, parsedDate, parsedSta, parsedDestIcao, takeoffTime, parsedEtopsInfo, activeAlerts, triggeredAlerts, parsedEetList]);

  const toggleAlert = (wp) => {
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
      
      let targetEtoMs = null;
      const rowData = calculatedData.flightData.find(r => r.wp === wp);
      if (rowData && rowData.revisedEtoStr && rowData.revisedEtoStr !== "----") {
          const etoMins = timeToMinutes(rowData.revisedEtoStr);
          if (etoMins !== null) {
              const now = new Date();
              const currentMins = now.getUTCHours() * 60 + now.getUTCMinutes();
              let diff = etoMins - currentMins;
              if (diff < -720) diff += 1440;
              if (diff > 720) diff -= 1440;
              
              if (diff > 0) {
                  const targetDate = new Date(Date.UTC(
                      now.getUTCFullYear(),
                      now.getUTCMonth(),
                      now.getUTCDate(),
                      Math.floor(etoMins / 60),
                      etoMins % 60,
                      0, 0
                  ));
                  
                  const rawDiff = etoMins - currentMins;
                  if (rawDiff < -720) {
                      targetDate.setUTCDate(targetDate.getUTCDate() + 1);
                  } else if (rawDiff > 720) {
                      targetDate.setUTCDate(targetDate.getUTCDate() - 1);
                  }
                  
                  targetEtoMs = targetDate.getTime();
              }
          }
      }

      setActiveAlerts(prev => {
          const next = { ...prev };
          if (next[wp]) {
              delete next[wp];
              window.dispatchEvent(new CustomEvent('show-toast', { detail: `${wp} の通過通知を解除しました` }));
          } else {
              next[wp] = true;
              window.dispatchEvent(new CustomEvent('show-toast', { detail: `${wp} の通過通知をセットしました` }));
              
              if (targetEtoMs !== null) {
                  setTimeout(() => setTimerPopupData({ wpName: wp, targetEtoMs }), 50);
              }
          }
          return next;
      });
  };

  const handlePointerDown = (e, wp) => {
      holdTimeout.current = setTimeout(() => {
          toggleAlert(wp);
          holdTimeout.current = null;
      }, 600);
  };

  const handlePointerUpOrLeave = () => {
      if (holdTimeout.current) {
          clearTimeout(holdTimeout.current);
          holdTimeout.current = null;
      }
  };

  useEffect(() => {
      if (!calculatedData || !calculatedData.flightData || calculatedData.flightData.length === 0) return;
      
      const now = new Date();
      const currentMins = now.getUTCHours() * 60 + now.getUTCMinutes();
      
      let shouldVibrate = false;
      let newPopupWp = popupWp;

      calculatedData.flightData.forEach(row => {
          if (activeAlerts[row.wp] && !row.ato && row.revisedEtoStr && row.revisedEtoStr !== "----") {
              const etoMins = timeToMinutes(row.revisedEtoStr);
              if (etoMins !== null) {
                  let diff = currentMins - etoMins;
                  if (diff < -720) diff += 1440;
                  if (diff > 720) diff -= 1440;
                  
                  if (diff >= 0 && diff <= 5 && !triggeredAlerts[row.wp]) {
                      setTriggeredAlerts(prev => ({...prev, [row.wp]: true}));
                      newPopupWp = row.wp;
                      shouldVibrate = true;
                  }
              }
          }
      });
      
      if (newPopupWp !== popupWp) {
          setPopupWp(newPopupWp);
      }
      if (shouldVibrate && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([200, 100, 200, 100, 200]);
      }
  }, [currentUtcMins, calculatedData, activeAlerts, triggeredAlerts, popupWp]);

  const handleUpdateActual = (wp, field, value) => {
    setActuals(prev => ({ ...prev, [wp]: { ...prev[wp], [field]: value } }));
    if (field === 'ato' && value !== "") {
        setActiveAlerts(prev => { 
            if(!prev[wp]) return prev;
            const n = {...prev}; delete n[wp]; return n; 
        });
        setTriggeredAlerts(prev => { 
            if(!prev[wp]) return prev;
            const n = {...prev}; delete n[wp]; return n; 
        });
    }
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

            if (importedData[wp].ato) {
                setActiveAlerts(a => { const n = {...a}; delete n[wp]; return n; });
                setTriggeredAlerts(t => { const n = {...t}; delete n[wp]; return n; });
            }
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
                    
                    const wmoInfo = WMO_CODES[wcode] || { title: "不明", icon: "☁️", color: "text-slate-300" };

                    const wxDataToSave = {
                        tempC: tempC > 0 ? `+${tempC}` : `${tempC}`,
                        tempF: tempF > 0 ? `+${tempF}` : `${tempF}`,
                        icon: wmoInfo.icon,
                        text: wmoInfo.title,
                        color: wmoInfo.color
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
    if (calculatedData.flightData.length > 0) {
      const timer = setTimeout(() => {
        scrollToCurrentFix();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [navlogData?.loadId]);

  // ▼ PDF出力処理の実体
  const processAndDownloadPdf = async (originalBytes, textPositions) => {
      try {
          window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDFを作成しています...' }));

          if (!window.PDFLib) {
              const script = document.createElement('script');
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
              await new Promise((res, rej) => { script.onload = res; script.onerror = rej; document.head.appendChild(script); });
          }

          const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
          
          // 万が一 Uint8Array でないものが渡ってきた場合の安全処理
          const safeBytes = originalBytes instanceof Uint8Array 
              ? originalBytes 
              : new Uint8Array(originalBytes);

          const pdfDoc = await PDFDocument.load(safeBytes);
          
          // クラッシュ防止のため標準フォントを指定して書き込む
          const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const pages = pdfDoc.getPages();

          for (const [wp, actualData] of Object.entries(actuals)) {
              if (!actualData.ato && !actualData.afob && !actualData.actAlt && !actualData.actTmp && !actualData.actWind) continue;

              // 分割認識されたWaypoint名にも対応するため前方一致で探す
              const wpPos = textPositions.find(p => p.str.startsWith(wp));
              if (wpPos && pages[wpPos.page]) {
                  const page = pages[wpPos.page];
                  
                  if (actualData.ato) {
                      page.drawText(actualData.ato, {
                          x: wpPos.x + 100, // ★ATO: 少し左へ調整
                          y: wpPos.y - 2,
                          size: 9,
                          font: helveticaFont,
                          color: rgb(0, 0.4, 0.8) // 青色
                      });
                  }
                  if (actualData.actAlt) {
                      page.drawText(actualData.actAlt, {
                          x: wpPos.x + 160, // ★ACT ALT
                          y: wpPos.y - 2,
                          size: 9,
                          font: helveticaFont,
                          color: rgb(0.6, 0.2, 0.8) // 紫色
                      });
                  }
                  if (actualData.afob) {
                      page.drawText(actualData.afob, {
                          x: wpPos.x + 190, // ★RMG(AFOB)
                          y: wpPos.y - 2,
                          size: 9,
                          font: helveticaFont,
                          color: rgb(0, 0.6, 0) // 緑色
                      });
                  }
                  if (actualData.actTmp) {
                      page.drawText(actualData.actTmp, {
                          x: wpPos.x + 230, // ★ACT TMP
                          y: wpPos.y - 2,
                          size: 9,
                          font: helveticaFont,
                          color: rgb(0.6, 0.2, 0.8) // 紫色
                      });
                  }
                  if (actualData.actWind) {
                      page.drawText(actualData.actWind, {
                          x: wpPos.x + 250, // ★ACT WND
                          y: wpPos.y - 2,
                          size: 9,
                          font: helveticaFont,
                          color: rgb(0.6, 0.2, 0.8) // 紫色
                      });
                  }
              }
          }

          const pdfOutputBytes = await pdfDoc.save();
          const blob = new Blob([pdfOutputBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${flightNo}_Navlog_Actual.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDFの出力が完了しました' }));
      } catch (error) {
          console.error(error);
          window.dispatchEvent(new CustomEvent('show-toast', { detail: `PDFの出力に失敗: ${error.message}` }));
      }
  };

  // ▼ 手動ファイル選択（フェールセーフ）
  const handleManualPdfSelect = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
          const buffer = event.target.result;
          
          // pdf.jsで中身が奪われる(Detach)のを防ぐためバッファを複製して分離する
          const pdfjsArray = new Uint8Array(buffer.slice(0)); 
          const originalArray = new Uint8Array(buffer.slice(0)); 
          
          if (!window.pdfjsLib) {
              const script = document.createElement('script');
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
              await new Promise((res, rej) => { script.onload = res; script.onerror = rej; document.head.appendChild(script); });
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
          
          const loadingTask = window.pdfjsLib.getDocument({
              data: pdfjsArray,
              cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
              cMapPacked: true
          });
          const pdf = await loadingTask.promise;
          
          let textPositions = []; 
          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              content.items.forEach(item => {
                  if (item && typeof item.str === 'string' && item.str.trim().length >= 3 && item.transform) {
                      textPositions.push({
                          str: item.str.trim(),
                          page: i - 1,
                          x: item.transform[4],
                          y: item.transform[5]
                      });
                  }
              });
          }
          
          await processAndDownloadPdf(originalArray, textPositions);
          if (pdfExportInputRef.current) pdfExportInputRef.current.value = '';
      };
      reader.readAsArrayBuffer(file);
  };

  // ▼ EXPORTボタンクリック
  const handleExportPDF = async () => {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDF作成準備中...' }));
      
      const targetPdfBytes = navlogData?.originalPdfBytes;
      
      if (!targetPdfBytes || targetPdfBytes.length === 0) {
          // メモリから消えていた場合はファイルダイアログを開かせる
          if (pdfExportInputRef.current) {
              window.dispatchEvent(new CustomEvent('show-toast', { detail: '元データが見つかりません。ベースとなるPDFファイルを再度選択してください。' }));
              pdfExportInputRef.current.click(); 
          }
          return;
      }
      
      await processAndDownloadPdf(targetPdfBytes, navlogData.textPositions);
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

      <DistCheckModal 
        isOpen={isDistCheckOpen}
        onClose={() => setIsDistCheckOpen(false)}
        flightData={calculatedData.flightData}
      />

      <WpAlertModal 
        wpName={popupWp} 
        onClose={() => setPopupWp(null)} 
      />

      <TimerSuggestModal
        data={timerPopupData}
        onClose={() => setTimerPopupData(null)}
      />

      {/* 隠しインプット: メモリからPDFデータが消えていた場合の手動選択用 */}
      <input type="file" accept="application/pdf" className="hidden" ref={pdfExportInputRef} onChange={handleManualPdfSelect} />

      <header className="shrink-0 bg-gradient-to-r from-slate-900 via-[#131c2f] to-slate-900 border-b border-slate-700/80 px-2 py-2 shadow-lg z-20">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-2">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 mr-2">
                <div className="bg-blue-500/20 p-1 rounded border border-blue-500/30 shadow-inner">
                  <SafeIcon name="Map" className="w-3.5 h-3.5 text-blue-400"/>
                </div>
                <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-wider leading-none drop-shadow-sm">
                  {flightNo}
                </h1>
            </div>
            
            <div className="flex gap-1.5 items-center font-mono flex-wrap">
                <span className="text-[11px] sm:text-xs font-black text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30 tracking-wider">
                    {routeInfo}
                </span>
                {flightTimeStr && <span className="text-[11px] sm:text-xs font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5">F/T: {flightTimeStr}</span>}
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5">{parsedReg}</span>
                {parsedDate && <span className="text-[11px] sm:text-xs font-bold text-blue-300 bg-blue-900/40 border border-blue-500/40 rounded px-1.5 py-0.5">{parsedDate}</span>}
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5">ZFW:{parsedPzfw}</span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5">TAXI OUT/IN: {parsedTaxiOut}/{parsedTaxiIn}M</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            <div className="flex items-center gap-2 bg-[#0f172a] px-2 py-1.5 rounded-lg border border-slate-700 shadow-inner">
              
              <div className="flex flex-col items-center px-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">STD(Z/L)</span>
                <div className="flex items-center gap-1.5 h-4">
                  <span className="text-[13px] font-mono font-extrabold text-slate-300 leading-none">
                    {navlogData && navlogData.stdH !== undefined && navlogData.stdM !== undefined ? `${String(navlogData.stdH).padStart(2, '0')}${String(navlogData.stdM).padStart(2, '0')}` : "----"}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300/80 leading-none">({localStd || "----"})</span>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-700"></div>

              <div className="flex flex-col items-center px-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Takeoff(Z)</label>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  pattern="\d*" 
                  lang="en"
                  autoCapitalize="none" 
                  autoCorrect="off" 
                  spellCheck={false}
                  placeholder="HHMM" 
                  maxLength={4} 
                  value={takeoffTime} 
                  onChange={(e) => setTakeoffTime(e.target.value.replace(/[^0-9]/g, ''))} 
                  className="bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-[13px] font-mono font-black text-white text-center w-16 h-5 focus:outline-none focus:border-blue-500 transition-colors" 
                />
              </div>

              <div className="w-px h-6 bg-slate-700"></div>

              <div className="flex flex-col items-center justify-center px-1 min-w-[90px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">ETA (Z/L)</span>
                <div className="flex flex-col w-full gap-0.5">
                    <div className="flex items-center justify-between gap-1 w-full">
                        <span className="text-[10px] text-slate-500 font-bold">LDG</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[13px] font-mono font-extrabold text-white leading-none">{calculatedData.estLandingTimeStr || "----"}</span>
                            <span className="text-[11px] font-mono font-bold text-slate-300/80 leading-none">({localLdg || "----"})</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-1 w-full">
                        <span className="text-[10px] text-slate-500 font-bold">BLK</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[13px] font-mono font-extrabold text-amber-400 leading-none">{calculatedData.estBlockInStr || "----"}</span>
                            <span className="text-[11px] font-mono font-bold text-amber-200/80 leading-none">({localBlockIn || "----"})</span>
                        </div>
                    </div>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-700"></div>

              <div className="flex flex-col items-center justify-center px-1 min-w-[80px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">STA (Z/L)</span>
                <div className="flex items-center gap-1 h-4">
                  <span className="text-[13px] font-mono font-extrabold text-slate-300 leading-none">{parsedSta || "----"}</span>
                  <span className="text-xs font-mono font-bold text-cyan-300/80 leading-none">({localSta || "----"})</span>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-700"></div>

              <div className="flex flex-col items-center justify-center px-2 min-w-[130px] shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">{parsedDestIcao} WX</span>
                <div className="flex items-center justify-center w-full">
                  {destWeather ? (
                    <div className="flex items-center gap-1.5 whitespace-nowrap" title={destWeather.text}>
                      <span className="text-xl leading-none">{destWeather.icon}</span>
                      <span className={`text-[13px] font-mono font-bold ${destWeather.color}`}>
                        {destWeather.tempC}℃ <span className="text-[11px] opacity-80">({destWeather.tempF}℉)</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-[13px] font-mono font-bold text-slate-500">----</span>
                  )}
                </div>
              </div>

            </div>

            <div className="flex items-center gap-1.5 bg-[#0f172a] px-2 py-1.5 rounded-lg border border-slate-700 shadow-inner">
              <div className="flex flex-col items-center min-w-[45px] px-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">TIME DIFF</span>
                <span className={`text-[13px] font-mono font-extrabold leading-none flex items-center ${parseInt(calculatedData.latestAtoTimeDiffStr) > 0 ? 'text-red-400' : parseInt(calculatedData.latestAtoTimeDiffStr) < 0 ? 'text-green-400' : 'text-slate-200'}`}>
                    {calculatedData.latestAtoTimeDiffStr || "±0"}
                </span>
              </div>

              <div className="w-px h-6 bg-slate-700"></div>

              <div className="flex flex-col items-center min-w-[60px] px-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">FUEL DIFF</span>
                <div className="flex items-center gap-1 h-4">
                  {calculatedData.lastValidWpIndex !== -1 ? (
                    <span className={`text-[13px] font-mono font-extrabold leading-none ${calculatedData.totalBurnDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {calculatedData.totalBurnDiff > 0 ? '+' : ''}{calculatedData.totalBurnDiff.toFixed(1)}
                    </span>
                  ) : (<span className="text-slate-500 font-mono text-[13px] font-bold leading-none">--.-</span>)}
                  
                  <button onClick={() => setIsGraphOpen(true)} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-1 flex items-center justify-center transition-colors h-4" title="Trend Graph">
                    <span className="text-[11px] leading-none">📊</span>
                  </button>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-700"></div>
              
              <div className="flex flex-col items-center px-1">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">MAX ALT</span>
                 <div className="flex items-center bg-slate-900 rounded border border-slate-700 cursor-pointer overflow-hidden shadow-inner h-4" onClick={() => setIs15gLimit(!is15gLimit)}>
                    <div className={`px-1.5 h-full flex items-center text-[10px] font-black ${!is15gLimit ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>1.3G</div>
                    <div className={`px-1.5 h-full flex items-center text-[10px] font-black ${is15gLimit ? 'bg-red-600 text-white' : 'text-slate-500'}`}>1.5G</div>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                <button onClick={scrollToCurrentFix} className="bg-slate-700 hover:bg-indigo-600 border border-indigo-500/50 text-indigo-300 hover:text-white px-2 py-1.5 rounded text-[11px] font-black tracking-wider shadow-sm transition-colors flex items-center gap-1">
                    <SafeIcon name="MapPin" className="w-3 h-3" /> NOW
                </button>
                <button onClick={() => setIsDistCheckOpen(true)} className="bg-slate-700 hover:bg-sky-600 border border-sky-500/50 text-sky-300 hover:text-white px-2 py-1.5 rounded text-[11px] font-black tracking-wider shadow-sm transition-colors flex items-center gap-1">
                    <SafeIcon name="Ruler" className="w-3 h-3" /> DIST CK
                </button>
                <button onClick={() => setIsSyncModalOpen(true)} className="bg-slate-700 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-300 hover:text-white px-2 py-1.5 rounded text-[11px] font-black tracking-wider shadow-sm transition-colors flex items-center gap-1">
                    <SafeIcon name="RefreshCw" className="w-3 h-3" /> SYNC
                </button>
                <button onClick={handleExportPDF} className="bg-slate-700 hover:bg-blue-600 border border-blue-500/50 text-blue-300 hover:text-white px-2 py-1.5 rounded text-[11px] font-black tracking-wider shadow-sm transition-colors flex items-center gap-1">
                    <SafeIcon name="DownloadCloud" className="w-3 h-3" /> EXPORT
                </button>
            </div>

          </div>
        </div>

        {/* ETOPS Info Row */}
        <div className="max-w-[1400px] mx-auto mt-2 flex flex-wrap items-center gap-1.5 text-[12px] font-mono font-bold bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
            <span className="text-slate-400">ETOPS:</span>
            {parsedEtopsInfo && parsedEtopsInfo.data ? (
                <div className="flex flex-wrap gap-1.5 items-center">
                    {parsedEtopsInfo.data.map((data, idx) => {
                        const etMins = timeToMinutes(data.et);
                        const revisedEt = etMins !== null ? minutesToTime((etMins + etopsTimeDiff + 1440 * 10) % 1440) : data.et;
                        const ltMins = timeToMinutes(data.lt);
                        const revisedLt = ltMins !== null ? minutesToTime((ltMins + etopsTimeDiff + 1440 * 10) % 1440) : data.lt;
                        
                        const isActive = activeEtopsAirport === data.airport;

                        let etpStr = "----";
                        if (data.endCtme !== Infinity && takeoffTime) {
                            const toMins = timeToMinutes(takeoffTime);
                            if (toMins !== null) {
                                const etpMins = toMins + data.endCtme + (calculatedData.latestAtoTimeDiff || 0);
                                etpStr = minutesToTime((etpMins + 1440 * 10) % 1440);
                            }
                        }

                        return (
                            <React.Fragment key={idx}>
                                <div className={`flex items-center gap-1.5 border px-2 py-0.5 rounded shadow-inner transition-colors duration-300 ${isActive ? 'bg-sky-800 border-sky-500 text-white' : 'bg-slate-900/90 border-slate-700 text-slate-300'}`}>
                                    <span className={`${isActive ? 'text-white' : 'text-sky-300'} font-extrabold text-[13px]`}>{data.airport}</span>
                                    <div className="flex items-center gap-0.5">
                                        <span className={`${isActive ? 'text-sky-200' : 'text-slate-500'} text-[10px] font-semibold`}>ET</span>
                                        <span className={`${isActive ? 'text-white' : 'text-slate-200'} font-bold text-[12px]`}>{revisedEt}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <span className={`${isActive ? 'text-sky-200' : 'text-slate-500'} text-[10px] font-semibold`}>LT</span>
                                        <span className={`${isActive ? 'text-white' : 'text-slate-200'} font-bold text-[12px]`}>{revisedLt}</span>
                                    </div>
                                </div>
                                {idx < parsedEtopsInfo.data.length - 1 && (
                                    <div className="flex items-center gap-1 px-0.5">
                                        <SafeIcon name="ChevronRight" className="w-3 h-3 text-slate-600" />
                                        <div className="flex bg-slate-900/80 border border-slate-700 rounded px-1.5 py-0.5 items-center gap-1">
                                            <span className="text-[9px] text-amber-500/80 font-bold">ETP</span>
                                            <span className="text-[11px] text-amber-400 font-mono font-bold leading-none">{etpStr}</span>
                                        </div>
                                        <SafeIcon name="ChevronRight" className="w-3 h-3 text-slate-600" />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            ) : (
                <span className="text-slate-500">NON ETOPS</span>
            )}
        </div>
      </header>

      <div className="flex-1 w-full relative overflow-hidden bg-slate-900/40 touch-pinch-zoom">
        <div className="absolute inset-0 overflow-auto custom-scrollbar p-1 flex justify-center touch-auto" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
            <div className="w-full max-w-[1400px] min-w-[760px] pb-16 px-1">
              
              <div className="sticky top-0 z-30 bg-[#0f172a] border-b border-slate-700 shadow-md rounded-t-lg">
                <div className="flex p-1.5 font-black text-slate-400 text-[11px] text-center items-center leading-tight justify-between">
                  <div className="w-[175px] shrink-0 text-center">WAYPOINT</div>
                  <div className="w-[42px] text-cyan-400 shrink-0">GS<br/><span className="text-[9px] text-cyan-500">TAS</span></div>
                  <div className="w-[48px] text-slate-400 flex flex-col items-center justify-center shrink-0">
                    <span>CTME</span>
                    <span className="text-[9px] text-slate-500">RTME</span>
                  </div>
                  <div className="w-[62px] text-blue-300 shrink-0">ETO(Rev)<br/>ATO</div>
                  <div className="w-[24px] shrink-0 text-center">DIFF</div>
                  <div className="w-[48px] text-slate-500 shrink-0">PLN FOB</div>
                  <div className="w-[56px] text-green-300 shrink-0">RMG<br/><span className="text-[8.5px]">DIFF</span></div>
                  <div className="flex-1 flex justify-center min-w-[155px] max-w-[200px]">ACT(ALT/TMP/WND)</div>
                  <div className="w-[60px] text-purple-300 shrink-0">MAX ALT<br/><span className="text-[8.5px] text-slate-500">WT</span></div>
                  <div className="w-[32px] shrink-0">MEMO</div>
                </div>
              </div>
              
              <div className="divide-y divide-slate-800/80 bg-slate-900/60 rounded-b-lg border-x border-b border-slate-700/80">
                {calculatedData.flightData.map((row, idx) => {
                  const isTriggered = triggeredAlerts[row.wp] && !row.ato;
                  const isAlertActive = activeAlerts[row.wp];
                  const baseRowClass = "flex py-1.5 px-1 items-center hover:bg-slate-800/60 transition-colors group text-center gap-x-1 box-border justify-between";
                  const finalRowClass = isTriggered ? `${baseRowClass} bg-rose-900/30 shadow-[inset_4px_0_0_rgba(244,63,94,1)]` : baseRowClass;
                  
                  const toMins = calculatedData.takeoffMinutes !== null ? calculatedData.takeoffMinutes : 0;
                  const prevOriginalEto = idx > 0 ? calculatedData.flightData[idx - 1].originalEtoMins : -1;
                  const currentOriginalEto = row.originalEtoMins;
                  
                  const crossedFirs = parsedEetList.filter(fir => {
                      const firOriginalEto = toMins + fir.mins;
                      return firOriginalEto > prevOriginalEto && firOriginalEto <= currentOriginalEto;
                  });

                  return (
                  <React.Fragment key={idx}>
                    {crossedFirs.map((fir, fIdx) => {
                        const revisedFirMins = (toMins + fir.mins + (row.appliedDiff || 0) + 1440 * 10) % 1440;
                        const revisedFirStr = minutesToTime(revisedFirMins);
                        const firName = FIR_NAMES[fir.fir];
                        const displayName = firName ? `${fir.fir}(${firName})` : fir.fir;
                        return (
                        <div key={`fir-${idx}-${fIdx}`} className="flex py-1.5 px-2 items-center bg-sky-900/20 border-y border-sky-800/40 justify-center w-full shadow-inner">
                            <span className="text-[11px] font-bold text-sky-300 tracking-[0.2em] uppercase">
                                Entering {displayName} FIR (EET {fir.timeStr.substring(0,2)}:{fir.timeStr.substring(2,4)} / ETO {revisedFirStr})
                            </span>
                        </div>
                        );
                    })}
                    <div ref={el => rowRefs.current[idx] = el} className={finalRowClass}>
                    
                    <div className="w-[175px] shrink-0 flex flex-col items-center justify-center">
                        <div 
                            className="w-full font-mono text-[15px] sm:text-[16px] font-black text-center text-slate-200 truncate flex items-center justify-center gap-1 select-none cursor-pointer px-1"
                            onPointerDown={(e) => handlePointerDown(e, row.wp)}
                            onPointerUp={handlePointerUpOrLeave}
                            onPointerLeave={handlePointerUpOrLeave}
                            onPointerCancel={handlePointerUpOrLeave}
                            onContextMenu={(e) => e.preventDefault()}
                            title="長押しで通過通知をセット/解除"
                        >
                            {row.wp}
                            {isAlertActive && (
                                <SafeIcon name="BellRing" className={`w-4 h-4 shrink-0 ${isTriggered ? 'text-rose-400 animate-bounce' : 'text-sky-400'}`} />
                            )}
                        </div>
                        {calculatedData.isNearestAirportEligible && row.nearestAirports && row.nearestAirports.length > 0 && (
                            <div className="w-full flex flex-wrap justify-center gap-0.5 mt-0.5 relative px-1">
                                {row.nearestAirports.map(apt => (
                                    <div key={apt.icao} className="relative group/apt flex items-center">
                                        <span className="text-[9px] sm:text-[10px] bg-slate-800 text-sky-300 font-bold px-1 py-0.5 rounded border border-slate-700 flex items-center gap-0.5 tracking-tighter cursor-default whitespace-nowrap">
                                            {apt.icao} <span className="text-slate-300 font-bold">{Math.round(apt.dist)}</span>
                                        </span>
                                        {apt.name && (
                                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover/apt:block group-active/apt:block bg-slate-700/95 border border-slate-50 text-white text-[12px] font-normal px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                                                {apt.name}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="w-[42px] shrink-0 flex flex-col items-center justify-center leading-none py-0.5 font-mono">
                        <span className="text-[14px] text-cyan-300 font-bold">{row.gs || '-'}</span>
                        <span className="text-xs text-cyan-500/80 font-medium mt-0.5">{row.tas || '-'}</span>
                    </div>

                    <div className="w-[48px] shrink-0 flex flex-col items-center justify-center leading-none py-0.5 font-mono">
                        <span className="text-[13px] text-slate-300 font-bold">{formatTimePlus(row.ctme)}</span>
                        <span className="text-[11px] text-slate-500 font-medium mt-0.5">{formatTimePlus(row.rtme)}</span>
                    </div>
                    
                    <div className="w-[62px] shrink-0 flex flex-col px-0.5 gap-1 items-center">
                      <span className="text-blue-400 font-mono text-[15px] font-extrabold leading-none">{row.revisedEtoStr || "----"}</span>
                      <input 
                          type="text" 
                          inputMode="numeric" 
                          pattern="\d*" 
                          lang="en"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="ATO" 
                          maxLength={4} 
                          value={row.ato} 
                          onChange={(e) => handleUpdateActual(row.wp, 'ato', e.target.value.replace(/[^0-9]/g, ''))} 
                          onBlur={() => {
                              if (row.ato) {
                                  setTimeout(() => scrollToCurrentFix(), 300);
                              }
                          }}
                          className={`w-full max-w-[65px] mx-auto bg-[#05070a] border rounded py-1 text-center font-mono text-[13px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${row.ato ? 'border-blue-500/50 text-white' : 'border-slate-700 text-slate-400'}`} 
                      />
                    </div>
                    
                    <div className={`w-[24px] shrink-0 font-mono text-[11px] text-center font-bold ${parseInt(row.timeDiffStr) > 0 ? 'text-red-400' : parseInt(row.timeDiffStr) < 0 ? 'text-green-400' : 'text-slate-400'}`}>{row.timeDiffStr}</div>

                    <div className="w-[48px] shrink-0 font-mono text-[14px] text-slate-400 font-bold">{row.fob ? row.fob.toFixed(1) : ''}</div>

                    <div className="w-[56px] shrink-0 flex flex-col px-0.5 gap-1 items-center">
                      <input 
                          type="text" 
                          inputMode="decimal" 
                          lang="en"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="RMG" 
                          value={row.afob} 
                          onChange={(e) => handleUpdateActual(row.wp, 'afob', e.target.value.replace(/[^0-9.]/g, ''))} 
                          className={`w-full bg-[#05070a] border rounded py-1 text-center font-mono text-[13px] font-bold focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors ${row.afob ? 'border-green-500/50 text-white' : 'border-slate-700 text-slate-400'}`} 
                      />
                      <span className={`font-mono text-[10px] leading-none ${row.fuelDiff > 0 ? 'text-green-400 font-bold' : row.fuelDiff < 0 ? 'text-red-400 font-bold' : 'text-transparent'}`}>
                          {row.fuelDiff !== null ? (`${row.fuelDiff > 0 ? '+' : ''}${row.fuelDiff.toFixed(1)}`) : '-'}
                      </span>
                    </div>

                    <div className="flex-1 flex justify-center gap-1 px-1 mt-2.5 min-w-[155px] max-w-[200px]">
                        <div className="flex flex-col items-center justify-center w-[45px] relative shrink-0">
                            <span className="absolute -top-3.5 text-[10px] text-slate-500 font-mono leading-none">{row.plnAlt || ""}</span>
                            <input 
                              type="text" 
                              lang="en"
                              autoCapitalize="characters" 
                              autoCorrect="off"
                              spellCheck={false}
                              placeholder="ALT" 
                              value={row.actAlt} 
                              onChange={(e) => handleUpdateActual(row.wp, 'actAlt', e.target.value.toUpperCase())} 
                              className="w-full bg-[#05070a] border border-slate-700 rounded text-center text-[13px] font-mono font-bold py-1 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-inner px-0.5" 
                            />
                        </div>
                        <div className="flex flex-col items-center justify-center w-[40px] relative shrink-0">
                            <span className="absolute -top-3.5 text-[10px] text-slate-500 font-mono leading-none">{row.plnTmp || ""}</span>
                            <input 
                              type="text" 
                              lang="en"
                              autoCapitalize="characters" 
                              autoCorrect="off"
                              spellCheck={false}
                              placeholder="TMP" 
                              value={row.actTmp} 
                              onChange={(e) => handleUpdateActual(row.wp, 'actTmp', e.target.value)} 
                              className="w-full bg-[#05070a] border border-slate-700 rounded text-center text-[13px] font-mono font-bold py-1 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-inner px-0.5" 
                            />
                        </div>
                        <div className="flex flex-col items-center justify-center flex-1 max-w-[65px] relative shrink-0">
                            <span className="absolute -top-3.5 text-[10px] text-slate-500 font-mono leading-none">{row.plnWind || ""}</span>
                            <input 
                              type="text" 
                              lang="en"
                              autoCapitalize="characters" 
                              autoCorrect="off"
                              spellCheck={false}
                              placeholder="WND" 
                              value={row.actWind} 
                              onChange={(e) => handleUpdateActual(row.wp, 'actWind', e.target.value)} 
                              className="w-full bg-[#05070a] border border-slate-700 rounded text-center text-[13px] font-mono font-bold py-1 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors shadow-inner px-0.5" 
                            />
                        </div>
                    </div>

                    <div className="w-[60px] shrink-0 flex flex-col items-center justify-center leading-none">
                        <span className="text-[8px] text-purple-400 font-mono font-bold leading-none mb-0.5 whitespace-nowrap">
                              {row.isaDev !== undefined && !isNaN(row.isaDev) ? `ISA${row.isaDev >= 0 ? '+' : ''}${row.isaDev}` : ""}
                        </span>
                        <span className="font-mono text-[15px] font-black text-purple-400">{row.maxAlt}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1">W:{row.currentWeight}</span>
                    </div>

                    <div className="w-[32px] shrink-0 flex justify-center items-center">
                        <button 
                            onClick={() => setMemoModal({ isOpen: true, wp: row.wp, text: row.memo })}
                            className={`p-1.5 rounded transition-colors border shadow-sm flex items-center justify-center ${row.memo ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            title={row.memo ? "Edit Memo" : "Add Memo"}
                        >
                            <span className="text-[13px] leading-none">📝</span>
                        </button>
                    </div>

                  </div>
                  </React.Fragment>
                )})}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};