import React, { useState, useEffect, useRef } from 'react';

// =========================================================================
// アイコンコンポーネント (外部依存を減らすためSVGをインライン化)
// =========================================================================
const IconCloudRain = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>;
const IconDownloadCloud = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconClipboard = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>;
const IconLoader2 = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconPlane = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5-3.5 3.5-2.5-.5-1.5 1.5 4 1 1 4 1.5-1.5-.5-2.5 3.5-3.5 5 6l1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>;

// =========================================================================
// 緯度経度変換ヘルパー
// メモ: NAVLOGから抽出された正確な緯度経度(latLon)を最優先でプロットします。
// =========================================================================
const parseWaypointToLatLng = (wpObj) => {
  if (!wpObj) return null;
  const wpName = typeof wpObj === 'string' ? wpObj : wpObj.wp;
  const latLonStr = typeof wpObj === 'string' ? null : wpObj.latLon;

  if (latLonStr) {
      const noDotMatch = latLonStr.match(/^([NS])(\d{2})(\d{3})([EW])(\d{3})(\d{3})$/);
      if (noDotMatch) {
          let lat = parseInt(noDotMatch[2], 10) + parseInt(noDotMatch[3], 10) / 600;
          if (noDotMatch[1] === 'S') lat = -lat;
          let lon = parseInt(noDotMatch[5], 10) + parseInt(noDotMatch[6], 10) / 600;
          if (noDotMatch[4] === 'W') lon = -lon;
          return { lat, lon, name: wpName, isAirport: false };
      }

      const dotMatch = latLonStr.match(/^([NS])(\d{2})(\d{2}(?:\.\d+)?)([EW])(\d{2,3})(\d{2}(?:\.\d+)?)$/);
      if (dotMatch) {
          let lat = parseInt(dotMatch[2], 10) + parseFloat(dotMatch[3]) / 60;
          if (dotMatch[1] === 'S') lat = -lat;
          let lon = parseInt(dotMatch[5], 10) + parseFloat(dotMatch[6]) / 60;
          if (dotMatch[4] === 'W') lon = -lon;
          return { lat, lon, name: wpName, isAirport: false };
      }
  }

  const arincMatch1 = wpName.match(/^(\d{2})([NSWE])(\d{2})$/);
  if (arincMatch1) {
      let lat = parseInt(arincMatch1[1], 10);
      let lon = parseInt(arincMatch1[3], 10);
      const dir = arincMatch1[2];
      
      if (dir === 'N') { lon = -(lon + 100); } 
      else if (dir === 'E') { lon = lon + 100; } 
      else if (dir === 'W') { lat = -lat; lon = -(lon + 100); } 
      else if (dir === 'S') { lat = -lat; lon = lon + 100; }
      return { lat, lon, name: wpName, isAirport: false };
  }

  const arincMatch2 = wpName.match(/^(\d{4})([NSWE])$/);
  if (arincMatch2) {
      let lat = parseInt(arincMatch2[1].substring(0,2), 10);
      let lon = parseInt(arincMatch2[1].substring(2,4), 10);
      const dir = arincMatch2[2];
      
      if (dir === 'N') lon = -lon; 
      else if (dir === 'E') lon = lon; 
      else if (dir === 'W') { lat = -lat; lon = -lon; } 
      else if (dir === 'S') { lat = -lat; lon = lon; } 
      return { lat, lon, name: wpName, isAirport: false };
  }

  const coordMatch = wpName.match(/^([NS])(\d{4,5})([EW])(\d{4,5})$/);
  if (coordMatch) {
      let lat = parseInt(coordMatch[2], 10) / 100;
      let lon = parseInt(coordMatch[4], 10) / 100;
      if (coordMatch[1] === 'S') lat = -lat;
      if (coordMatch[3] === 'W') lon = -lon;
      return { lat, lon, name: wpName, isAirport: false };
  }
  return null;
};

// =========================================================================
// オフセット（Deviation）線計算のためのジオメトリヘルパー
// =========================================================================
const toRad = deg => deg * Math.PI / 180;
const toDeg = rad => rad * 180 / Math.PI;

const getBearing = (lat1, lon1, lat2, lon2) => {
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(rLat2);
    const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const getDestination = (lat, lon, brng, distNM) => {
    const R = 3440.065; 
    const rLat = toRad(lat);
    const rLon = toRad(lon);
    const rBrng = toRad(brng);
    const dR = distNM / R;
    const rLat2 = Math.asin(Math.sin(rLat) * Math.cos(dR) + Math.cos(rLat) * Math.sin(dR) * Math.cos(rBrng));
    const rLon2 = rLon + Math.atan2(Math.sin(rBrng) * Math.sin(dR) * Math.cos(rLat), Math.cos(dR) - Math.sin(rLat) * Math.sin(rLat2));
    return [toDeg(rLat2), toDeg(rLon2)];
};

const calculateOffsetLine = (latlngs, offsetNM) => {
    if (latlngs.length < 2) return [];
    const offsetPoints = [];
    for (let i = 0; i < latlngs.length; i++) {
        let brng;
        if (i === 0) {
            brng = getBearing(latlngs[i][0], latlngs[i][1], latlngs[i+1][0], latlngs[i+1][1]);
        } else if (i === latlngs.length - 1) {
            brng = getBearing(latlngs[i-1][0], latlngs[i-1][1], latlngs[i][0], latlngs[i][1]);
        } else {
            const b1 = getBearing(latlngs[i-1][0], latlngs[i-1][1], latlngs[i][0], latlngs[i][1]);
            const b2 = getBearing(latlngs[i][0], latlngs[i][1], latlngs[i+1][0], latlngs[i+1][1]);
            let diff = b2 - b1;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            brng = (b1 + diff / 2 + 360) % 360;
        }
        const rightBrng = (brng + 90) % 360;
        offsetPoints.push(getDestination(latlngs[i][0], latlngs[i][1], rightBrng, offsetNM));
    }
    return offsetPoints;
};

const normalizeLongitudes = (latlngs) => {
    let offset = 0;
    for (let i = 1; i < latlngs.length; i++) {
        let prevLon = latlngs[i-1][1];
        let currLon = latlngs[i][1] + offset;
        if (prevLon - currLon > 180) {
            offset += 360; currLon += 360;
        } else if (currLon - prevLon > 180) {
            offset -= 360; currLon -= 360;
        }
        latlngs[i][1] = currLon;
    }
    return latlngs;
};

const formatRvTime = (unixTime) => {
  if (!unixTime) return '';
  const d = new Date(unixTime * 1000);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}Z`;
};

const formatJmaTime = (basetime) => {
  if (!basetime || basetime.length < 12) return '';
  return `${basetime.substring(8, 10)}:${basetime.substring(10, 12)}Z`;
};

// =========================================================================
// NAVLOG テキスト解析
// =========================================================================
const parseNavlogText = (text) => {
    let newPlan = [];
    const fNoMatch = text.match(/(?:ANA|JAL|NCA|NH|JL)(\d{2,4}[A-Z]?)/);
    let fNo = fNoMatch ? fNoMatch[0] : "UNKNOWN";
    
    const routeMatch = text.match(/([A-Z]{4})\s*-\s*([A-Z]{4})/);
    const depIcao = routeMatch ? routeMatch[1] : null;
    const destIcao = routeMatch ? routeMatch[2] : null;

    let cleanTextForWp = text;
    const logStartIndex = cleanTextForWp.indexOf('WSCP');
    if (logStartIndex !== -1) {
        cleanTextForWp = cleanTextForWp.substring(logStartIndex);
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
    
    if (fNoMatch) ignoreList.add(fNoMatch[0]);
    if (routeMatch) {
        ignoreList.delete(routeMatch[1]);
        ignoreList.delete(routeMatch[2]);
    }

    let pendingLat = null; 
    let pendingLatLon = null;

    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        let cleanToken = token.replace(/^-+/, '').replace(/-+$/, '');

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

        const isCoord = /^[NS]\d{4,5}[EW]\d{4,6}$/.test(cleanToken);
        const isAlphaWp = /^[A-Z][A-Z0-9]{1,5}$/.test(cleanToken) && !ignoreList.has(cleanToken);
        const isArincWp = /^\d{2}[NSWE]\d{2}$/.test(cleanToken);
        const isSpecialWp = ["TOC", "TOD"].includes(cleanToken);

        if (!isCoord && (isAlphaWp || isArincWp || isSpecialWp)) {
            if (newPlan.length > 0 && newPlan[newPlan.length - 1].wp === cleanToken) {
                continue;
            }
            pendingLat = null;
            newPlan.push({ 
              wp: cleanToken, 
              latLon: pendingLatLon
            });
            
            if (destIcao && cleanToken === destIcao) break; 
            pendingLatLon = null;
        }
    }

    if (newPlan.length >= 2) {
        const last = newPlan[newPlan.length - 1];
        const prev = newPlan[newPlan.length - 2];
        if (last.wp === prev.wp) newPlan.pop();
    }

    return { newPlan, fNo, depIcao, destIcao };
};

// =========================================================================
// APIキャッシュ (タブ切り替えによる不要な再読み込みを防ぐ)
// =========================================================================
let apiCache = {
  rvRadarFrames: null,
  rvSatFrames: null,
  jmaFrames: null,
  timestamp: 0
};

// =========================================================================
// UI コンポーネント (Modal & Toast)
// =========================================================================
const Toast = ({ message, visible, onClose }) => {
  if (!visible) return null;
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded shadow-2xl flex items-center gap-3">
      <span className="text-sm font-bold">{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
    </div>
  );
};

const LoadDataModal = ({ isOpen, onClose, onFileLoad, onTextLoad, isParsing }) => {
    const [text, setText] = useState("");
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onFileLoad(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl flex flex-col">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                        <IconDownloadCloud className="w-5 h-5 text-sky-400" />
                        Load Flight Plan
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-2xl leading-none">&times;</button>
                </div>
                
                <div className="flex flex-col gap-3">
                    <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isParsing} 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
                    >
                        {isParsing ? <IconLoader2 className="animate-spin w-5 h-5" /> : <IconFileText />}
                        {isParsing ? 'Reading PDF...' : 'Upload NAVLOG PDF'}
                    </button>
                </div>

                <div className="flex items-center gap-3 py-5">
                    <div className="h-px bg-slate-700 flex-1"></div>
                    <span className="text-xs text-slate-500 font-bold uppercase">OR</span>
                    <div className="h-px bg-slate-700 flex-1"></div>
                </div>

                <div className="flex flex-col gap-3">
                    <textarea 
                        value={text} 
                        onChange={e => setText(e.target.value)} 
                        className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-sky-500 resize-none font-mono text-xs"
                        placeholder="Paste NAVLOG text here..."
                    ></textarea>
                    <button 
                        onClick={() => { onTextLoad(text); setText(""); }} 
                        disabled={!text.trim()} 
                        className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
                    >
                        <IconClipboard />
                        Load from Text
                    </button>
                </div>
            </div>
        </div>
    );
};

// =========================================================================
// メインマップコンポーネント
// =========================================================================
export const WeatherRadarView = ({ navlogData }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});

  // 衛星とレーダーのトグル状態
  const [showHimawari, setShowHimawari] = useState(true);
  const [showGoes, setShowGoes] = useState(true); 
  const [showMeteosat, setShowMeteosat] = useState(false); 
  const [showArctic, setShowArctic] = useState(true); 
  const [showGlobalIr, setShowGlobalIr] = useState(false); 
  const [showRadar, setShowRadar] = useState(false);
  const [showNavlogRoute, setShowNavlogRoute] = useState(true);
  
  const [opacity, setOpacity] = useState(0.65);
  const [deviationNM, setDeviationNM] = useState(0); 
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // タイムスライダー用ステート
  const [rvRadarFrames, setRvRadarFrames] = useState([]);
  const [rvSatFrames, setRvSatFrames] = useState([]);
  const [jmaFrames, setJmaFrames] = useState([]);
  const [frameIndex, setFrameIndex] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  // レイヤー参照
  const himawariLayerRef = useRef(null);
  const goesLayerRef = useRef(null); // 米国カラー強調用 (IEM)
  const meteosatLayerRef = useRef(null); 
  const arcticLayerRef = useRef(null); // 全球白黒用 (SSEC)
  const globalIrLayerRef = useRef(null);
  const radarLayerRef = useRef(null);

  // 5分おきにAPIを再取得
  useEffect(() => {
    const interval = setInterval(() => {
        setLastFetchTime(Date.now());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // マップの初期化
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      try {
        if (!window.L) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);

          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (isMounted && mapContainerRef.current && !mapInstanceRef.current) {
          const L = window.L;
          const map = L.map(mapContainerRef.current, {
            center: [25.0, 135.0],
            zoom: 4,
            zoomControl: false,
            attributionControl: false
          });

          L.control.zoom({ position: 'bottomright' }).addTo(map);

          const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 16,
            subdomains: 'abcd'
          }).addTo(map);

          mapInstanceRef.current = map;
          layersRef.current.base = darkBase;

          const errImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

          // カラーフィルター(sat-blue)は削除し、自然な合成を行う(sat-blend)のみ適用
          const style = document.createElement('style');
          style.innerHTML = `
            .sat-blend { mix-blend-mode: screen !important; }
            .yellow-boundaries { filter: invert(100%) sepia(100%) saturate(1000%) hue-rotate(15deg) brightness(1.2); opacity: 0.85; pointer-events: none; }
            .nav-tooltip { background-color: rgba(15, 23, 42, 0.85) !important; border: 1px solid rgba(56, 189, 248, 0.4) !important; color: #e0f2fe !important; font-size: 9px !important; font-weight: bold !important; padding: 1px 4px !important; border-radius: 4px !important; box-shadow: 0 2px 4px rgba(0,0,0,0.5) !important; }
          `;
          document.head.appendChild(style);

          // ★ ARCTIC用: SSEC全球IRベース (全球をカバーする白黒画像)
          const ssecGlobalIrUrl = 'https://realearth.ssec.wisc.edu/tiles/globalir/{z}/{x}/{y}.png';
          arcticLayerRef.current = L.tileLayer(ssecGlobalIrUrl, {
            opacity: opacity,
            maxNativeZoom: 4,  
            maxZoom: 16,
            zIndex: 1, // 一番下に敷く
            className: 'sat-blend',
            keepBuffer: 16,
            updateWhenIdle: true
          }).addTo(map);

          // ★ GOES用: IEMベース (米国周辺のカラー強調画像)
          const iemGoesUrl = 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-ir-4km-900913/{z}/{x}/{y}.png';
          goesLayerRef.current = L.tileLayer(iemGoesUrl, {
            opacity: opacity,
            maxNativeZoom: 5,
            maxZoom: 16,
            zIndex: 2, // 白黒の全球画像の上にカラーを重ねる
            className: 'sat-blend', 
            keepBuffer: 16,
            updateWhenIdle: true
          }).addTo(map);

          meteosatLayerRef.current = L.tileLayer.wms('https://view.eumetsat.int/geoserver/wms', {
            layers: 'msg_fes:ir108',
            format: 'image/png',
            transparent: true,
            version: '1.1.1',
            opacity: opacity,
            zIndex: 2,
            className: 'sat-blend',
            keepBuffer: 16
          }).addTo(map);

          globalIrLayerRef.current = L.tileLayer(errImg, { opacity: opacity, maxNativeZoom: 5, maxZoom: 16, noWrap: false, errorTileUrl: errImg, zIndex: 1, className: 'sat-blend', keepBuffer: 16 }).addTo(map);
          himawariLayerRef.current = L.tileLayer(errImg, { opacity: opacity, maxNativeZoom: 5, maxZoom: 16, noWrap: false, errorTileUrl: errImg, zIndex: 2, className: 'sat-blend', keepBuffer: 16 }).addTo(map);
          radarLayerRef.current = L.tileLayer(errImg, { opacity: opacity, maxZoom: 16, noWrap: false, errorTileUrl: errImg, zIndex: 3, keepBuffer: 16 }).addTo(map);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_lines/{z}/{x}/{y}.png', {
            maxZoom: 16,
            subdomains: 'abcd',
            zIndex: 10,
            className: 'yellow-boundaries',
            keepBuffer: 16
          }).addTo(map);

          setIsMapLoaded(true);
        }
      } catch (err) {
        console.error("Map initialization failed", err);
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // APIデータの取得 (キャッシュを利用)
  useEffect(() => {
      const now = Date.now();
      
      if (apiCache.timestamp && (now - apiCache.timestamp < 5 * 60 * 1000) && apiCache.rvSatFrames && apiCache.jmaFrames) {
          setRvRadarFrames(apiCache.rvRadarFrames);
          setRvSatFrames(apiCache.rvSatFrames);
          setJmaFrames(apiCache.jmaFrames);
          return;
      }

      Promise.all([
        fetch('https://api.rainviewer.com/public/weather-maps.json', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch('https://www.jma.go.jp/bosai/himawari/data/satimg/targetTimes_fd.json', { cache: 'no-store' }).then(r => r.json()).catch(() => null)
      ]).then(([rvData, jmaData]) => {
          let newRvRadar = [];
          let newRvSat = [];
          let newJma = [];

          if (rvData) {
              const host = rvData.host || 'https://tilecache.rainviewer.com';
              if (rvData.radar && rvData.radar.past) newRvRadar = rvData.radar.past.map(f => ({ ...f, host }));
              if (rvData.satellite && rvData.satellite.infrared) newRvSat = rvData.satellite.infrared.map(f => ({ ...f, host }));
          }

          if (jmaData && Array.isArray(jmaData) && jmaData.length > 0) {
              const sortedFrames = [...jmaData].sort((a, b) => a.basetime.localeCompare(b.basetime));
              newJma = sortedFrames.slice(-24);
          }

          apiCache = {
              rvRadarFrames: newRvRadar,
              rvSatFrames: newRvSat,
              jmaFrames: newJma,
              timestamp: now
          };

          setRvRadarFrames(newRvRadar);
          setRvSatFrames(newRvSat);
          setJmaFrames(newJma);
      });
  }, [lastFetchTime]);

  // レイヤー数の変化時にスライダーを最新に戻す
  useEffect(() => {
      setIsPlaying(false);
      let activeLengths = [];
      if (showHimawari && jmaFrames.length > 0) activeLengths.push(jmaFrames.length);
      if (showGlobalIr && rvSatFrames.length > 0) activeLengths.push(rvSatFrames.length);
      if (showRadar && rvRadarFrames.length > 0) activeLengths.push(rvRadarFrames.length);
      const mFrames = activeLengths.length > 0 ? Math.max(...activeLengths, 1) : 1;
      setFrameIndex(mFrames - 1);
  }, [showHimawari, showGlobalIr, showRadar, jmaFrames.length, rvSatFrames.length, rvRadarFrames.length]);

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;
    setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 100);
    const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    });
    if (mapContainerRef.current) resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [isMapLoaded]);

  // 同期フレームとURLの決定
  let activeLengths = [];
  if (showHimawari && jmaFrames.length > 0) activeLengths.push(jmaFrames.length);
  if (showGlobalIr && rvSatFrames.length > 0) activeLengths.push(rvSatFrames.length);
  if (showRadar && rvRadarFrames.length > 0) activeLengths.push(rvRadarFrames.length);
  
  const maxFrames = activeLengths.length > 0 ? Math.max(...activeLengths, 1) : 1;
  const safeFrameIndex = Math.max(0, Math.min(frameIndex, maxFrames - 1));

  const getLayerFrameIndex = (layerFramesLength) => {
      if (layerFramesLength <= 1 || maxFrames <= 1) return layerFramesLength - 1;
      const offsetFromNewest = (maxFrames - 1) - safeFrameIndex;
      return (layerFramesLength - 1) - offsetFromNewest; 
  };

  // アニメーションループ
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setFrameIndex(prev => {
          if (maxFrames <= 1) return 0;
          return (prev + 1) % maxFrames;
        });
      }, 1000); 
    }
    return () => clearInterval(timer);
  }, [isPlaying, maxFrames]);

  // レイヤーのURLとOpacityの更新
  useEffect(() => {
    if (!isMapLoaded || !himawariLayerRef.current || !arcticLayerRef.current || !goesLayerRef.current || !meteosatLayerRef.current || !globalIrLayerRef.current || !radarLayerRef.current) return;

    const errImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Himawari Layer
    let himawariUrl = errImg;
    if (showHimawari && jmaFrames.length > 0) {
        const idx = getLayerFrameIndex(jmaFrames.length);
        if (idx >= 0 && idx < jmaFrames.length) {
            const frame = jmaFrames[idx];
            if (frame && frame.basetime && frame.validtime) {
                himawariUrl = `https://www.jma.go.jp/bosai/himawari/data/satimg/${frame.basetime}/fd/${frame.validtime}/SND/ETC/{z}/{x}/{y}.jpg`;
            }
        }
    }
    if (himawariLayerRef.current._url !== himawariUrl) himawariLayerRef.current.setUrl(himawariUrl);
    himawariLayerRef.current.setOpacity(showHimawari ? opacity : 0);

    // ★ ARCTIC (全球白黒画像)
    if (arcticLayerRef.current) {
        arcticLayerRef.current.setOpacity(showArctic ? opacity : 0);
    }
    
    // ★ GOES (米国カラー画像)
    if (goesLayerRef.current) {
        goesLayerRef.current.setOpacity(showGoes ? opacity : 0);
    }

    if (meteosatLayerRef.current) {
        meteosatLayerRef.current.setOpacity(showMeteosat ? opacity : 0);
    }

    // RainViewer Global IR Layer
    let globalIrUrl = errImg;
    if (showGlobalIr && rvSatFrames.length > 0) {
        const idx = getLayerFrameIndex(rvSatFrames.length);
        if (idx >= 0 && idx < rvSatFrames.length) {
            const frame = rvSatFrames[idx];
            if (frame) {
                globalIrUrl = `${frame.host}${frame.path}/256/{z}/{x}/{y}/0/0_0.png`;
            }
        }
    }
    if (globalIrLayerRef.current._url !== globalIrUrl) globalIrLayerRef.current.setUrl(globalIrUrl);
    globalIrLayerRef.current.setOpacity(showGlobalIr ? opacity : 0);

    // Radar Layer
    let radarUrl = errImg;
    if (showRadar && rvRadarFrames.length > 0) {
        const idx = getLayerFrameIndex(rvRadarFrames.length);
        if (idx >= 0 && idx < rvRadarFrames.length) {
            const frame = rvRadarFrames[idx];
            if (frame) {
                radarUrl = `${frame.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
            }
        }
    }
    if (radarLayerRef.current._url !== radarUrl) radarLayerRef.current.setUrl(radarUrl);
    radarLayerRef.current.setOpacity(showRadar ? opacity : 0);

  }, [isMapLoaded, frameIndex, opacity, showHimawari, showGoes, showMeteosat, showArctic, showGlobalIr, showRadar, jmaFrames, rvSatFrames, rvRadarFrames, maxFrames]);

  // ルート描画
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    if (layersRef.current.navlogGroup) {
      map.removeLayer(layersRef.current.navlogGroup);
    }

    if (!showNavlogRoute || !navlogData || (!navlogData.newPlan && !navlogData.depIcao)) return;

    const navlogGroup = L.layerGroup();
    const routePoints = [];

    if (navlogData.depIcao) {
        const depCoord = parseWaypointToLatLng(navlogData.depIcao);
        if (depCoord) routePoints.push(depCoord);
    }

    if (navlogData.newPlan) {
      navlogData.newPlan.forEach(wp => {
        if (!wp || !wp.wp) return;
        const coord = parseWaypointToLatLng(wp);
        if (coord && (!routePoints.length || routePoints[routePoints.length - 1].name !== coord.name)) {
            routePoints.push(coord);
        }
      });
    }

    if (navlogData.destIcao) {
        const destCoord = parseWaypointToLatLng(navlogData.destIcao);
        if (destCoord && (!routePoints.length || routePoints[routePoints.length - 1].name !== destCoord.name)) {
            routePoints.push(destCoord);
        }
    }

    if (routePoints.length > 0) {
      const latlngs = routePoints.map(pt => [pt.lat, pt.lon]);
      normalizeLongitudes(latlngs); 
      
      const flightPath = L.polyline(latlngs, { color: '#38bdf8', weight: 3, opacity: 0.9 });
      navlogGroup.addLayer(flightPath);

      if (deviationNM > 0) {
          const rightOffset = calculateOffsetLine(latlngs, deviationNM);
          const leftOffset = calculateOffsetLine(latlngs, -deviationNM);
          const rightPath = L.polyline(rightOffset, { color: '#8b5cf6', weight: 2, opacity: 0.8, dashArray: '6, 6' });
          const leftPath = L.polyline(leftOffset, { color: '#8b5cf6', weight: 2, opacity: 0.8, dashArray: '6, 6' });
          navlogGroup.addLayer(rightPath);
          navlogGroup.addLayer(leftPath);
      }

      routePoints.forEach((pt, index) => {
        const isAp = pt.isAirport || pt.name === navlogData.depIcao || pt.name === navlogData.destIcao;
        const marker = L.circleMarker(latlngs[index], {
          radius: isAp ? 6 : 4,
          color: isAp ? '#0ea5e9' : '#ffffff',
          fillColor: isAp ? '#e0f2fe' : '#38bdf8',
          fillOpacity: 1.0,
          weight: 2
        }).bindTooltip(pt.name, { permanent: true, direction: 'right', className: 'nav-tooltip' });
        navlogGroup.addLayer(marker);
      });

      if (latlngs.length > 1) {
          map.fitBounds(flightPath.getBounds(), { padding: [50, 50] });
      } else if (latlngs.length === 1) {
          map.setView(latlngs[0], 6);
      }
    }

    navlogGroup.addTo(map);
    layersRef.current.navlogGroup = navlogGroup;
  }, [isMapLoaded, navlogData, showNavlogRoute, deviationNM]);

  // UI表示用のラベル取得
  let currentTimeLabel = "OFF";
  let activeLayerName = "No Layer Selected";

  if (showHimawari && jmaFrames.length > 0) {
      const idx = getLayerFrameIndex(jmaFrames.length);
      if (idx >= 0 && idx < jmaFrames.length && jmaFrames[idx]) {
          currentTimeLabel = formatJmaTime(jmaFrames[idx].validtime || jmaFrames[idx].basetime);
          activeLayerName = "JMA Himawari-8/9 Cloud Top" + (showGoes || showMeteosat || showArctic ? " & Others" : "");
      }
  } else if (showGlobalIr && rvSatFrames.length > 0) {
      const idx = getLayerFrameIndex(rvSatFrames.length);
      if (idx >= 0 && idx < rvSatFrames.length && rvSatFrames[idx]) {
          currentTimeLabel = formatRvTime(rvSatFrames[idx].time);
          activeLayerName = "RainViewer Global IR";
      }
  } else if (showRadar && rvRadarFrames.length > 0) {
      const idx = getLayerFrameIndex(rvRadarFrames.length);
      if (idx >= 0 && idx < rvRadarFrames.length && rvRadarFrames[idx]) {
          currentTimeLabel = formatRvTime(rvRadarFrames[idx].time);
          activeLayerName = "RainViewer Radar Only";
      }
  } else if (showGoes || showMeteosat || showArctic) {
      currentTimeLabel = "LIVE";
      let parts = [];
      
      if (showGoes) parts.push("GOES(Color)");
      if (showArctic) parts.push("ARCTIC(B/W)");
      if (showMeteosat) parts.push("Meteosat");
      
      activeLayerName = parts.join(" + ");
  }

  return (
    <div className="flex flex-col w-full h-[85vh] min-h-[500px] bg-slate-950 rounded-xl border border-slate-800 relative shadow-lg overflow-hidden">
      <div className="w-full flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800 text-xs flex-wrap gap-2 z-[2000] shadow-md relative">
        <div className="flex items-center gap-2 shrink-0">
          <IconCloudRain className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white tracking-wide">WXRDR</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          {maxFrames > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-700">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="text-sky-400 hover:text-white flex items-center justify-center w-4 h-4 mr-1"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <input 
                type="range" 
                min="0" 
                max={maxFrames - 1} 
                value={safeFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setFrameIndex(Number(e.target.value));
                }}
                className="w-24 accent-sky-400 cursor-pointer"
              />
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700">
            <span className="text-slate-400 font-bold">Dev:</span>
            <select
              value={deviationNM}
              onChange={(e) => setDeviationNM(Number(e.target.value))}
              className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-slate-900">OFF</option>
              <option value={10} className="bg-slate-900">10 NM</option>
              <option value={20} className="bg-slate-900">20 NM</option>
              <option value={30} className="bg-slate-900">30 NM</option>
              <option value={40} className="bg-slate-900">40 NM</option>
              <option value={50} className="bg-slate-900">50 NM</option>
              <option value={60} className="bg-slate-900">60 NM</option>
              <option value={70} className="bg-slate-900">70 NM</option>
              <option value={80} className="bg-slate-900">80 NM</option>
              <option value={90} className="bg-slate-900">90 NM</option>
              <option value={100} className="bg-slate-900">100 NM</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-700">
            <span className="text-slate-400 font-bold">Trans:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-16 accent-sky-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded border border-slate-700 flex-wrap">
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white" title="アジア・西太平洋">
              <input
                type="checkbox"
                checked={showHimawari}
                onChange={(e) => setShowHimawari(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>HIMAWARI</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white" title="欧州・中東・アフリカ・インド洋(トルコ〜中国)">
              <input
                type="checkbox"
                checked={showMeteosat}
                onChange={(e) => setShowMeteosat(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>METEOSAT</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white" title="米国周辺をカラー強調表示 (IEM)">
              <input
                type="checkbox"
                checked={showGoes}
                onChange={(e) => setShowGoes(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>GOES</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white" title="北極圏・カナダ等を含む全球カバー (SSEC)">
              <input
                type="checkbox"
                checked={showArctic}
                onChange={(e) => setShowArctic(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span className="font-bold text-sky-200">ARCTIC(Global)</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white border-l border-slate-600 pl-2" title="RainViewerの全球IR">
              <input
                type="checkbox"
                checked={showGlobalIr}
                onChange={(e) => setShowGlobalIr(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>RV-IR</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white" title="降水レーダー(陸上主体)">
              <input
                type="checkbox"
                checked={showRadar}
                onChange={(e) => setShowRadar(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>RADAR</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white border-l border-slate-600 pl-2">
              <input
                type="checkbox"
                checked={showNavlogRoute}
                onChange={(e) => setShowNavlogRoute(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span className="font-bold text-sky-400">Route</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full z-0">
        <div ref={mapContainerRef} className="absolute inset-0" />
        
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 backdrop-blur-sm text-[10px] text-slate-300 font-mono pointer-events-none space-y-1 shadow-xl min-w-[200px]">
          <div className="flex items-center justify-between text-sky-400 font-bold border-b border-slate-700 pb-1 mb-1">
            <span>RADAR & SAT SYNC</span>
            <span className="text-[9px] bg-sky-950 border border-sky-800 text-sky-300 px-1 rounded ml-2">{currentTimeLabel}</span>
          </div>
          <div>
            {activeLayerName}
          </div>
          {navlogData && navlogData.fNo && (
            <div className="text-amber-300 font-bold border-t border-slate-800 pt-1 mt-1 flex justify-between gap-4">
              <span>{navlogData.fNo} : {navlogData.depIcao || 'DEP'} &rarr; {navlogData.destIcao || 'ARR'}</span>
              {deviationNM > 0 && <span className="text-violet-400">DEV ±{deviationNM}NM</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// メインアプリケーション
// =========================================================================
export default function App() {
  const [navlogData, setNavlogData] = useState(() => {
    try {
      const savedItem = localStorage.getItem('pilotNavlogData');
      return savedItem ? JSON.parse(savedItem) : null;
    } catch (error) {
      console.error("localStorageの読み込みエラー:", error);
      return null;
    }
  });
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [toastData, setToastData] = useState({ message: '', visible: false });

  useEffect(() => {
    if (navlogData) {
      localStorage.setItem('pilotNavlogData', JSON.stringify(navlogData));
    }
  }, [navlogData]);

  const showToast = (message) => {
    setToastData({ message, visible: true });
    setTimeout(() => setToastData({ message: '', visible: false }), 4000);
  };

  const handlePdfUpload = (file) => {
    if (!file) return;
    setIsParsingPdf(true);
    showToast('PDFを解析しています...');
    
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

        const parsedData = parseNavlogText(fullText);
        
        if (parsedData.newPlan.length > 0) {
            setNavlogData(parsedData); 
            setIsLoadModalOpen(false);
            showToast(`ルートを読み込みました: ${parsedData.depIcao} -> ${parsedData.destIcao}`);
        } else { 
            showToast('フライトプランの読み取りに失敗しました。PDFの形式を確認してください。'); 
        }
      } catch (err) { 
        console.error(err); 
        showToast('PDFの解析に失敗しました。'); 
      } finally { 
        setIsParsingPdf(false); 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTextLoad = (text) => {
      const parsed = parseNavlogText(text);
      if (parsed && parsed.newPlan.length > 0) {
          setNavlogData(parsed);
          setIsLoadModalOpen(false);
          showToast(`ルートを読み込みました: ${parsed.depIcao} -> ${parsed.destIcao}`);
      } else {
          showToast('テキストの解析に失敗しました。');
      }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden font-sans text-slate-100">
      <Toast message={toastData.message} visible={toastData.visible} onClose={() => setToastData({ ...toastData, visible: false })} />
      
      <LoadDataModal 
        isOpen={isLoadModalOpen} 
        onClose={() => setIsLoadModalOpen(false)} 
        isParsing={isParsingPdf}
        onFileLoad={handlePdfUpload}
        onTextLoad={handleTextLoad}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sky-400 bg-sky-900/30 p-1.5 rounded-lg border border-sky-800">
            <IconPlane className="w-5 h-5 text-sky-400" />
          </span>
          <h1 className="text-white font-black text-lg tracking-wide hidden sm:block">GLOBAL WX RADAR</h1>
          <h1 className="text-white font-black text-lg tracking-wide sm:hidden">WX RADAR</h1>
        </div>

        <button 
            onClick={() => setIsLoadModalOpen(true)} 
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg border border-sky-400/30 text-sm"
        >
            <IconDownloadCloud className="w-4 h-4" />
            <span>Load Plan</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        <WeatherRadarView navlogData={navlogData} />
      </main>
    </div>
  );
}