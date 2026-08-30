import React, { useState, useEffect, useRef } from 'react';
import { SafeIcon } from './SharedComponents';

// =========================================================================
// 緯度経度変換ヘルパー
// メモ: NAVLOGから抽出された正確な緯度経度(latLon)を最優先でプロットします。
// =========================================================================
const parseWaypointToLatLng = (wpObj) => {
  if (!wpObj) return null;
  const wpName = typeof wpObj === 'string' ? wpObj : wpObj.wp;
  const latLonStr = typeof wpObj === 'string' ? null : wpObj.latLon;

  // 1. NAVLOGから抽出した座標文字列があれば最優先でパース
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

  // 2. ARINC 424 フォーマット1: 46E80
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

  // 3. ARINC 424 フォーマット2: 4680N
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

  // 4. 詳細座標 フォーマット: N4500E14000
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
            offset += 360;
            currLon += 360;
        } else if (currLon - prevLon > 180) {
            offset -= 360;
            currLon -= 360;
        }
        latlngs[i][1] = currLon;
    }
    return latlngs;
};

// フォーマットユーティリティ (正確なUTC時刻表示)
const formatRvTime = (unixTime) => {
  if (!unixTime) return '';
  const d = new Date(unixTime * 1000);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}Z`;
};

const formatJmaTime = (basetime) => {
  if (!basetime || basetime.length < 12) return '';
  return `${basetime.substring(8, 10)}:${basetime.substring(10, 12)}Z`;
};

export const WeatherRadarView = ({ navlogData }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});

  // 衛星とレーダーのトグル状態（独立してON/OFF可能）
  const [showHimawari, setShowHimawari] = useState(true);
  const [showGlobalIr, setShowGlobalIr] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
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
  const globalIrLayerRef = useRef(null);
  const radarLayerRef = useRef(null);

  // 5分おきにAPIを再取得してキャッシュ切れを防ぐ
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

          // 透過エラータイル（404画像を透明にする）
          const errImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

          // 各レイヤーを作成して追加 (クラッシュ防止のため bounds 指定を解除)
          himawariLayerRef.current = L.tileLayer(errImg, { opacity: opacity, maxNativeZoom: 5, maxZoom: 16, noWrap: false, errorTileUrl: errImg, zIndex: 2 }).addTo(map);
          globalIrLayerRef.current = L.tileLayer(errImg, { opacity: 0, maxNativeZoom: 5, maxZoom: 16, noWrap: false, errorTileUrl: errImg, zIndex: 1 }).addTo(map);
          radarLayerRef.current = L.tileLayer(errImg, { opacity: opacity, maxZoom: 16, noWrap: false, errorTileUrl: errImg, zIndex: 3 }).addTo(map);

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

  // APIデータの取得
  useEffect(() => {
      fetch('https://api.rainviewer.com/public/weather-maps.json', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          const host = data.host || 'https://tilecache.rainviewer.com';
          if (data.radar && data.radar.past) {
            setRvRadarFrames(data.radar.past.map(f => ({ ...f, host })));
          }
          if (data.satellite && data.satellite.infrared) {
            const satData = data.satellite.infrared.map(f => ({ ...f, host }));
            setRvSatFrames(satData);
          }
        })
        .catch(err => console.error("RainViewer API load error:", err));

      // JMA Himawari-8/9 ターゲットタイムスタンプの取得
      fetch('https://www.jma.go.jp/bosai/himawari/data/satimg/targetTimes_fd.json', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // [0] が一番新しく、後ろに行くほど過去。
            // スライダー用に左（0）が古く、右が新しくなるようにリバースする
            const sortedFrames = [...data].reverse();
            // 過去24枚を保持（約2時間分）
            const recentFrames = sortedFrames.slice(-24);
            setJmaFrames(recentFrames);
          }
        })
        .catch(err => console.error("JMA API load error:", err));
  }, [lastFetchTime]);

  // レイヤー数の変化時にスライダーを最新に戻す
  useEffect(() => {
      setIsPlaying(false);
      let activeLengths = [];
      if (showHimawari) activeLengths.push(jmaFrames.length);
      if (showGlobalIr) activeLengths.push(rvSatFrames.length);
      if (showRadar) activeLengths.push(rvRadarFrames.length);
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
  if (showHimawari) activeLengths.push(jmaFrames.length);
  if (showGlobalIr) activeLengths.push(rvSatFrames.length);
  if (showRadar) activeLengths.push(rvRadarFrames.length);
  
  const maxFrames = activeLengths.length > 0 ? Math.max(...activeLengths, 1) : 1;
  const safeFrameIndex = Math.max(0, Math.min(frameIndex, maxFrames - 1));

  const getLayerFrameIndex = (layerFramesLength) => {
      if (layerFramesLength <= 1 || maxFrames <= 1) return layerFramesLength - 1;
      return Math.floor((safeFrameIndex / (maxFrames - 1)) * (layerFramesLength - 1));
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
    if (!isMapLoaded || !himawariLayerRef.current || !globalIrLayerRef.current || !radarLayerRef.current) return;

    const errImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // Himawari Layer
    let himawariUrl = errImg;
    if (showHimawari && jmaFrames.length > 0) {
        const idx = Math.max(0, Math.min(getLayerFrameIndex(jmaFrames.length), jmaFrames.length - 1));
        const frame = jmaFrames[idx];
        if (frame && frame.basetime && frame.validtime) {
            // 気象庁の雲頂強調画像 (SND/ETC) .jpg 形式
            himawariUrl = `https://www.jma.go.jp/bosai/himawari/data/satimg/${frame.basetime}/fd/${frame.validtime}/SND/ETC/{z}/{x}/{y}.jpg`;
        }
    }
    if (himawariLayerRef.current._url !== himawariUrl) himawariLayerRef.current.setUrl(himawariUrl);
    himawariLayerRef.current.setOpacity(showHimawari ? opacity : 0);

    // Global IR Layer
    let globalIrUrl = errImg;
    if (showGlobalIr && rvSatFrames.length > 0) {
        const idx = Math.max(0, Math.min(getLayerFrameIndex(rvSatFrames.length), rvSatFrames.length - 1));
        const frame = rvSatFrames[idx];
        if (frame) {
            globalIrUrl = `${frame.host}${frame.path}/256/{z}/{x}/{y}/0/1_1.png`;
        }
    }
    if (globalIrLayerRef.current._url !== globalIrUrl) globalIrLayerRef.current.setUrl(globalIrUrl);
    globalIrLayerRef.current.setOpacity(showGlobalIr ? opacity : 0);

    // Radar Layer
    let radarUrl = errImg;
    if (showRadar && rvRadarFrames.length > 0) {
        const idx = Math.max(0, Math.min(getLayerFrameIndex(rvRadarFrames.length), rvRadarFrames.length - 1));
        const frame = rvRadarFrames[idx];
        if (frame) {
            radarUrl = `${frame.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
        }
    }
    if (radarLayerRef.current._url !== radarUrl) radarLayerRef.current.setUrl(radarUrl);
    radarLayerRef.current.setOpacity(showRadar ? opacity : 0);

  }, [isMapLoaded, frameIndex, opacity, showHimawari, showGlobalIr, showRadar, jmaFrames, rvSatFrames, rvRadarFrames, maxFrames]);

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
      const idx = Math.max(0, Math.min(getLayerFrameIndex(jmaFrames.length), jmaFrames.length - 1));
      if (jmaFrames[idx]) {
          currentTimeLabel = formatJmaTime(jmaFrames[idx].validtime || jmaFrames[idx].basetime);
          activeLayerName = "JMA Himawari-8/9 Cloud Top (SND)";
      }
  } else if (showGlobalIr && rvSatFrames.length > 0) {
      const idx = Math.max(0, Math.min(getLayerFrameIndex(rvSatFrames.length), rvSatFrames.length - 1));
      if (rvSatFrames[idx]) {
          currentTimeLabel = formatRvTime(rvSatFrames[idx].time);
          activeLayerName = "RainViewer Global IR";
      }
  } else if (showRadar && rvRadarFrames.length > 0) {
      const idx = Math.max(0, Math.min(getLayerFrameIndex(rvRadarFrames.length), rvRadarFrames.length - 1));
      if (rvRadarFrames[idx]) {
          currentTimeLabel = formatRvTime(rvRadarFrames[idx].time);
          activeLayerName = "RainViewer Radar Only";
      }
  }

  // 画面のスクロールを防ぐため、高さを 85vh に制限し内部のみスクロール可能にする
  return (
    <div className="flex flex-col w-full h-[85vh] min-h-[500px] bg-slate-950 rounded-xl border border-slate-800 relative shadow-lg overflow-hidden">
      <div className="w-full flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800 text-xs flex-wrap gap-2 z-[2000] shadow-md relative">
        <div className="flex items-center gap-2 shrink-0">
          <SafeIcon name="CloudRain" className="w-4 h-4 text-sky-400" />
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

          <div className="flex items-center gap-3 bg-slate-800 px-2 py-1 rounded border border-slate-700">
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showHimawari}
                onChange={(e) => setShowHimawari(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>Himawari</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showGlobalIr}
                onChange={(e) => setShowGlobalIr(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>Global IR</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showRadar}
                onChange={(e) => setShowRadar(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>Radar</span>
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

      <style>{`
        .nav-tooltip {
          background-color: rgba(15, 23, 42, 0.85) !important;
          border: 1px solid rgba(56, 189, 248, 0.4) !important;
          color: #e0f2fe !important;
          font-size: 9px !important;
          font-weight: bold !important;
          padding: 1px 4px !important;
          border-radius: 4px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5) !important;
        }
      `}</style>
    </div>
  );
};