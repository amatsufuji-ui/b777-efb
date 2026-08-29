// src/components/WeatherRadarView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { SafeIcon } from './SharedComponents';

// 空港座標データ
const AIRPORTS = {
  RJTT: { name: "Tokyo Haneda", lat: 35.5494, lon: 139.7798 },
  RJAA: { name: "Tokyo Narita", lat: 35.7647, lon: 140.3863 },
  RJBB: { name: "Kansai", lat: 34.4347, lon: 135.2442 },
  RJOO: { name: "Osaka Itami", lat: 34.7855, lon: 135.4380 },
  RJCC: { name: "New Chitose", lat: 42.7752, lon: 141.6923 },
  ROAH: { name: "Naha", lat: 26.1958, lon: 127.6458 },
  RJFF: { name: "Fukuoka", lat: 33.5859, lon: 130.4507 },
  RJGG: { name: "Chubu Centrair", lat: 34.8583, lon: 136.8053 },
  RPLL: { name: "Manila", lat: 14.5086, lon: 121.0194 },
  VHHH: { name: "Hong Kong", lat: 22.3080, lon: 113.9185 },
  RCTP: { name: "Taipei Taoyuan", lat: 25.0777, lon: 121.2328 },
  RKSI: { name: "Seoul Incheon", lat: 37.4602, lon: 126.4407 },
  WSSS: { name: "Singapore Changi", lat: 1.3644, lon: 103.9915 },
  VTBS: { name: "Bangkok Suvarnabhumi", lat: 13.6900, lon: 100.7501 },
  KSFO: { name: "San Francisco", lat: 37.6189, lon: -122.3750 },
  KLAX: { name: "Los Angeles", lat: 33.9425, lon: -118.4081 },
  PANC: { name: "Anchorage", lat: 61.1744, lon: -149.9963 },
  KJFK: { name: "New York JFK", lat: 40.6413, lon: -73.7781 },
  EGLL: { name: "London Heathrow", lat: 51.4700, lon: -0.4543 },
  YSSY: { name: "Sydney", lat: -33.9461, lon: 151.1772 }
};

// 共通Waypoint及びダミーWaypoint
const COMMON_WAYPOINTS = {
  "VAMOS": { lat: 21.0, lon: 124.5 },
  "OATIS": { lat: 25.5, lon: 128.0 },
  "KAGIS": { lat: 28.5, lon: 131.0 },
  "SMILE": { lat: 31.0, lon: 134.0 },
  "XMC":   { lat: 15.0, lon: 121.5 },
  "GTC":   { lat: 34.0, lon: 137.5 },
  "XAC":   { lat: 35.0, lon: 139.5 }
};

// =========================================================================
// 緯度経度変換ヘルパー
// =========================================================================
const parseWaypointToLatLng = (wpObj) => {
  if (!wpObj) return null;
  const wpName = typeof wpObj === 'string' ? wpObj : wpObj.wp;
  const latLonStr = typeof wpObj === 'string' ? null : wpObj.latLon;

  // 1. NAVLOGから抽出した座標文字列があれば最優先でパース
  if (latLonStr) {
      // 例: N35436E140480 (N 35 43.6 E 140 48.0)
      const noDotMatch = latLonStr.match(/^([NS])(\d{2})(\d{3})([EW])(\d{3})(\d{3})$/);
      if (noDotMatch) {
          let lat = parseInt(noDotMatch[2], 10) + parseInt(noDotMatch[3], 10) / 600;
          if (noDotMatch[1] === 'S') lat = -lat;
          let lon = parseInt(noDotMatch[5], 10) + parseInt(noDotMatch[6], 10) / 600;
          if (noDotMatch[4] === 'W') lon = -lon;
          return { lat, lon, name: wpName, isAirport: false };
      }

      // 例: N3530.0E14015.0 または N4500E14000
      const dotMatch = latLonStr.match(/^([NS])(\d{2})(\d{2}(?:\.\d+)?)([EW])(\d{2,3})(\d{2}(?:\.\d+)?)$/);
      if (dotMatch) {
          let lat = parseInt(dotMatch[2], 10) + parseFloat(dotMatch[3]) / 60;
          if (dotMatch[1] === 'S') lat = -lat;
          let lon = parseInt(dotMatch[5], 10) + parseFloat(dotMatch[6]) / 60;
          if (dotMatch[4] === 'W') lon = -lon;
          return { lat, lon, name: wpName, isAirport: false };
      }
  }

  // 2. 辞書から検索
  if (AIRPORTS[wpName]) return { lat: AIRPORTS[wpName].lat, lon: AIRPORTS[wpName].lon, name: wpName, isAirport: true };
  if (COMMON_WAYPOINTS[wpName]) return { lat: COMMON_WAYPOINTS[wpName].lat, lon: COMMON_WAYPOINTS[wpName].lon, name: wpName, isAirport: false };

  // 3. ARINC 424 フォーマット1: 46E80 (Lat 46N, Lon 180E) >= 100度
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

  // 4. ARINC 424 フォーマット2: 4680N (Lat 46N, Lon 80W) < 100度
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

  // 5. 詳細座標 フォーマット: N4500E14000
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
    const R = 3440.065; // 地球の半径 (海里: NM)
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

export const WeatherRadarView = ({ navlogData }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});

  const [satelliteType, setSatelliteType] = useState("global_ir");
  const [opacity, setOpacity] = useState(0.65);
  const [showNavlogRoute, setShowNavlogRoute] = useState(true);
  const [showRadar, setShowRadar] = useState(true);
  const [deviationNM, setDeviationNM] = useState(0); 
  const [rainViewerTime, setRainViewerTime] = useState(null);
  const [rainViewerSatTime, setRainViewerSatTime] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
            center: [35.0, 150.0],
            zoom: 3,
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

          fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then(res => res.json())
            .then(data => {
              if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
                const latestRadar = data.radar.past[data.radar.past.length - 1];
                if (isMounted) setRainViewerTime(latestRadar.time);
              }
              if (data && data.satellite && data.satellite.infrared && data.satellite.infrared.length > 0) {
                const latestSat = data.satellite.infrared[data.satellite.infrared.length - 1];
                if (isMounted) setRainViewerSatTime(latestSat.time);
              }
            })
            .catch(err => console.error("RainViewer API load error:", err));

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
  }, []);

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;
    setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
        }
    });

    if (mapContainerRef.current) resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [isMapLoaded]);

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    if (layersRef.current.satellite) {
      map.removeLayer(layersRef.current.satellite);
      delete layersRef.current.satellite;
    }
    if (layersRef.current.radar) {
      map.removeLayer(layersRef.current.radar);
      delete layersRef.current.radar;
    }

    const d = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const isoDate = d.toISOString().split('T')[0];

    if (satelliteType === "global_ir" && rainViewerSatTime) {
      const satLayer = L.tileLayer(
        `https://tilecache.rainviewer.com/v2/satellite/${rainViewerSatTime}/256/{z}/{x}/{y}/0/1_1.png`,
        { opacity: opacity, maxZoom: 6 }
      );
      satLayer.addTo(map);
      layersRef.current.satellite = satLayer;
    } else if (satelliteType === "composite_gibs") {
      const layers = [
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band13_Clean_Infrared/default/${isoDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-West_ABI_Band13_Clean_Infrared/default/${isoDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_Band13_Clean_Infrared/default/${isoDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`
      ].map(url => L.tileLayer(url, { opacity: opacity, maxZoom: 6, tileSize: 256 }));
      
      const compGroup = L.layerGroup(layers);
      compGroup.addTo(map);
      layersRef.current.satellite = compGroup;
    } else if (satelliteType === "himawari_ir") {
      const himawariLayer = L.tileLayer(
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band13_Clean_Infrared/default/${isoDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
        { opacity: opacity, maxZoom: 6, tileSize: 256 }
      );
      himawariLayer.addTo(map);
      layersRef.current.satellite = himawariLayer;
    } else if (satelliteType === "goes_west_ir") {
      const goesWLayer = L.tileLayer(
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-West_ABI_Band13_Clean_Infrared/default/${isoDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
        { opacity: opacity, maxZoom: 6, tileSize: 256 }
      );
      goesWLayer.addTo(map);
      layersRef.current.satellite = goesWLayer;
    } else if (satelliteType === "goes_east_ir") {
      const goesELayer = L.tileLayer(
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_Band13_Clean_Infrared/default/${isoDate}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
        { opacity: opacity, maxZoom: 6, tileSize: 256 }
      );
      goesELayer.addTo(map);
      layersRef.current.satellite = goesELayer;
    }

    if (showRadar && rainViewerTime) {
      const radarLayer = L.tileLayer(
        `https://tilecache.rainviewer.com/v2/radar/${rainViewerTime}/256/{z}/{x}/{y}/2/1_1.png`,
        { opacity: opacity, maxZoom: 12 }
      );
      radarLayer.addTo(map);
      layersRef.current.radar = radarLayer;
    }
  }, [isMapLoaded, satelliteType, opacity, showRadar, rainViewerTime, rainViewerSatTime]);

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
      
      const flightPath = L.polyline(latlngs, {
        color: '#38bdf8',
        weight: 3,
        opacity: 0.9
      });
      navlogGroup.addLayer(flightPath);

      if (deviationNM > 0) {
          const rightOffset = calculateOffsetLine(latlngs, deviationNM);
          const leftOffset = calculateOffsetLine(latlngs, -deviationNM);

          const rightPath = L.polyline(rightOffset, {
              color: '#8b5cf6',
              weight: 2,
              opacity: 0.8,
              dashArray: '6, 6'
          });
          const leftPath = L.polyline(leftOffset, {
              color: '#8b5cf6',
              weight: 2,
              opacity: 0.8,
              dashArray: '6, 6'
          });
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

  return (
    <div className="flex flex-col w-full h-full min-h-[400px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
      <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800 text-xs flex-wrap gap-2 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <SafeIcon name="CloudRain" className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white tracking-wide">WXRDR</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700">
            <span className="text-slate-400 font-bold">SAT:</span>
            <select
              value={satelliteType}
              onChange={(e) => setSatelliteType(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none cursor-pointer max-w-[150px]"
            >
              <option value="global_ir" className="bg-slate-900">Global IR (RV)</option>
              <option value="composite_gibs" className="bg-slate-900">Global Comp (GIBS)</option>
              <option value="himawari_ir" className="bg-slate-900">Himawari-8/9 (Asia)</option>
              <option value="goes_west_ir" className="bg-slate-900">GOES-West (Pac)</option>
              <option value="goes_east_ir" className="bg-slate-900">GOES-East (Atl)</option>
              <option value="none" className="bg-slate-900">OFF</option>
            </select>
          </div>

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

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showRadar}
                onChange={(e) => setShowRadar(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>Radar</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showNavlogRoute}
                onChange={(e) => setShowNavlogRoute(e.target.checked)}
                className="accent-sky-500 rounded"
              />
              <span>Route</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative flex flex-col min-h-0 bg-slate-950">
        {!isMapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-50 text-slate-400 gap-3">
                <SafeIcon name="Loader2" className="w-8 h-8 animate-spin text-sky-500" />
                <span className="font-bold text-xs tracking-widest">LOADING MAP ENGINE...</span>
            </div>
        )}
        <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />
        
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 backdrop-blur-sm z-[500] text-[10px] text-slate-300 font-mono pointer-events-none space-y-1 shadow-xl max-w-xs">
          <div className="flex items-center justify-between text-sky-400 font-bold border-b border-slate-700 pb-1 mb-1">
            <span>RADAR & SAT SYNC</span>
            <span className="text-[9px] bg-sky-950 border border-sky-800 text-sky-300 px-1 rounded">LIVE</span>
          </div>
          <div>{satelliteType === 'global_ir' ? 'RainViewer Global IR' : 'NASA GIBS Infrared Layer'}</div>
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