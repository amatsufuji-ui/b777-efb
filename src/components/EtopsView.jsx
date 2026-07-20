import React, { useState, useEffect, useMemo } from 'react';
import { SafeIcon } from './SharedComponents';
import { etopsData } from '../data/flightData';

const HF_CACHE_KEY = 'efb_arinc_hf_data';

export const EtopsView = ({ globalRoute = "", globalDest = "" }) => {
  const [routeInput, setRouteInput] = useState(globalRoute);
  const [aircraft, setAircraft] = useState("B777-300ER/B777F");
  const [destination, setDestination] = useState("EDDF");
  const [detectedRouteType, setDetectedRouteType] = useState("");
  const [manualRouteType, setManualRouteType] = useState("");
  
  const [todayInfo, setTodayInfo] = useState({ dateStr: "", isOdd: true });

  // 初期値を localStorage から読み込む
  const [hfData, setHfData] = useState(() => {
    try {
      const cached = localStorage.getItem(HF_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...parsed, status: "CACHED" };
      }
    } catch (e) {
      console.warn("HF Data cache read failed");
    }
    return {
      asia: { pri: "11282", sec: "5547" },
      alaska: { pri: "10048", sec: "6673" },
      polar: { pri: "11342", sec: "8933", ter: "6640" },
      lastUpdated: "Default Info",
      isOnlineData: false,
      status: "Not Updated" 
    };
  });
  
  const [isFetchingHF, setIsFetchingHF] = useState(false);

  useEffect(() => {
    if (globalRoute) setRouteInput(globalRoute);
  }, [globalRoute]);

  useEffect(() => {
    if (globalDest) {
      const upperDest = globalDest.toUpperCase();
      const validDests = ["EDDF", "EGLL", "ESSA", "EBBR", "LFPG", "LIMC", "LOWW", "EDDM"];
      if (validDests.includes(upperDest)) setDestination(upperDest);
      else setDestination("Other");
    }
  }, [globalDest]);

  useEffect(() => {
    const type = detectRouteType(routeInput);
    setDetectedRouteType(type);
  }, [routeInput]);

  useEffect(() => {
    const d = new Date();
    const day = d.getUTCDate();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    setTodayInfo({ dateStr: `${String(day).padStart(2, '0')} ${months[d.getUTCMonth()]}`, isOdd: day % 2 !== 0 });
  }, []);

  const fetchHFData = async () => {
    if (navigator.onLine === false) {
      setHfData(prev => ({ ...prev, status: prev.isOnlineData ? "CACHED" : "Not Updated" }));
      return;
    }
    
    setIsFetchingHF(true);
    setHfData(prev => ({ ...prev, status: "Fetching..." }));

    // ============================================================
    // ★ Cloudflare Worker の専用プロキシURL ★
    // ============================================================
    const PROXY_URL = "https://arinc-proxy.a-matsufuji.workers.dev/"; 
    
    const targetUrl = 'https://radio.arinc.net/pacific/';
    const timeKey = Math.floor(Date.now() / 600000); // 10分キャッシュキー
    let html = null;
    let success = false;
    
    const fetchMethods = [];

    // 1. Cloudflare Worker 経由 (高速かつ安定して取得可能)
    if (PROXY_URL) {
      fetchMethods.push(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        try {
          const res = await fetch(PROXY_URL, { signal: controller.signal, redirect: 'follow' });
          if (!res.ok) throw new Error('Worker Fetch failed');
          return await res.text();
        } finally {
          clearTimeout(timeoutId);
        }
      });
    }

    // 2. 予備：パブリックプロキシ
    fetchMethods.push(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&_t=${timeKey}`, { signal: controller.signal, cache: 'no-store' });
          if (!res.ok) throw new Error('Proxy 1 failed');
          const data = await res.json();
          return data.contents || "";
        } finally { clearTimeout(timeoutId); }
      },
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(targetUrl)}&_t=${timeKey}`, { signal: controller.signal, cache: 'no-store' });
          if (!res.ok) throw new Error('Proxy 2 failed');
          return await res.text();
        } finally { clearTimeout(timeoutId); }
      }
    );

    // ループで順番にトライ
    for (let i = 0; i < fetchMethods.length; i++) {
      try {
        const text = await fetchMethods[i]();
        if (text && (text.includes("Pacific") || text.includes("ARINC")) && text.match(/\d{4,5}/)) {
          html = text;
          success = true;
          break; 
        }
      } catch (e) {
        console.log(`Method ${i + 1} failed:`, e);
      }
    }

    if (!success || !html) {
      setHfData(prev => ({ ...prev, status: prev.isOnlineData ? "CACHED" : "Not Updated" })); 
      setIsFetchingHF(false);
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const text = doc.body.textContent.replace(/\s+/g, ' ');

      const newHfData = { ...hfData };
      let updated = false;

      const asiaMatch = text.match(/North America.*?Asia.*?(\d{4,5})\s*(?:kHz)?.*?(\d{4,5})\s*(?:kHz)?/i);
      if (asiaMatch) { newHfData.asia.pri = asiaMatch[1]; newHfData.asia.sec = asiaMatch[2]; updated = true; }

      const alaskaMatch = text.match(/Alaska.*?Pacific.*?(\d{4,5})\s*(?:kHz)?.*?(\d{4,5})\s*(?:kHz)?/i);
      if (alaskaMatch) { newHfData.alaska.pri = alaskaMatch[1]; newHfData.alaska.sec = alaskaMatch[2]; updated = true; }

      const polarMatch = text.match(/Polar.*?(\d{4,5})\s*(?:kHz)?.*?(\d{4,5})\s*(?:kHz)?(?:.*?(\d{4,5})\s*(?:kHz)?)?/i);
      if (polarMatch) {
        newHfData.polar.pri = polarMatch[1]; newHfData.polar.sec = polarMatch[2];
        if (polarMatch[3]) newHfData.polar.ter = polarMatch[3];
        updated = true;
      }

      if (updated) {
        const validMatch = text.match(/Valid from (.*?Z)/i) || text.match(/Valid from (.*?) Notes/i);
        const validStr = validMatch ? validMatch[1].trim() : "Live Data";
        
        const finalData = { ...newHfData, lastUpdated: validStr, isOnlineData: true, status: "LIVE" };
        setHfData(finalData);
        localStorage.setItem(HF_CACHE_KEY, JSON.stringify(finalData));
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'ARINC HF周波数を最新データに更新・保存しました' }));
      } else {
        setHfData(prev => ({ ...prev, status: prev.isOnlineData ? "CACHED" : "Not Updated" }));
      }
    } catch (error) {
      setHfData(prev => ({ ...prev, status: prev.isOnlineData ? "CACHED" : "Not Updated" }));
    } finally {
      setIsFetchingHF(false);
    }
  };

  useEffect(() => {
    fetchHFData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectRouteType = (route) => {
    if (!route) return "";
    const r = route.toUpperCase();
    if (r.includes("ABGUN")) return "i";
    if (r.includes("DEXUN")) return "h";
    if (r.includes("65N000W") || r.includes("67N000W")) return "g";
    if (r.includes("SINVU") && r.includes("77N060W")) return "f";
    if ((r.includes("80N060W") || r.includes("82N080W")) && (r.includes("69N000E") || r.includes("73N000E"))) return "e";
    if (r.includes("OMEKA")) return "d";
    if (r.includes("AGMIF")) return "c";
    if (r.includes("NADMA") || r.includes("IKNOG")) return "b";
    if (r.includes("ADREW")) return "a";
    return "";
  };

  const isDestinationMatch = (destRule, selectedDest) => {
    if (destRule === "Europe") return true;
    if (destRule === selectedDest) return true;
    if (destRule.includes("other than")) {
      const excluded = destRule.split("other than")[1].replace(/[()]/g, "").trim().split("/");
      return !excluded.includes(selectedDest);
    }
    if (destRule.includes("except")) {
      const excluded = destRule.split("except")[1].replace(/[()]/g, "").trim().split("/");
      return !excluded.includes(selectedDest);
    }
    if (destRule.includes("/")) return destRule.split("/").includes(selectedDest);
    return false;
  };

  const activeRouteType = manualRouteType || detectedRouteType;

  const noAdditionalFuelAltns = useMemo(() => {
    if (!activeRouteType) return [];
    const data = etopsData[aircraft]?.[activeRouteType] || [];
    return data.filter(item => isDestinationMatch(item.dest, destination));
  }, [aircraft, destination, activeRouteType]);

  const routeLabels = {
    a: "a) ADREW ... SINVU/75N130W ...", b: "b) ADREW ... NADMA/IKNOG ...", c: "c) AGMIF ...", d: "d) OMEKA ...",
    e: "e) 80N060W ... 69N000E ...", f: "f) SINVU 77N060W ...", g: "g) アイスランド東迂回", h: "h) アイスランド西迂回", i: "i) BUDUM ... ABGUN"
  };

  return (
    <div className="w-full h-full p-2 overflow-y-auto hide-scrollbar text-slate-800">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* ヘッダーセクション */}
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4">
          <div className="flex items-center space-x-2 mb-3 text-slate-200">
            <SafeIcon name="Plane" className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold flex items-center flex-wrap gap-2">
              ETOPS Additional Fuel ALTN判定
              <span className="text-[10px] sm:text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded tracking-wider shadow-sm leading-none">欧州線のみ</span>
            </h1>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="route" className="block text-xs font-medium text-slate-400">
              フライトプランのルート (PDFから自動読込、または手動ペースト)
            </label>
            <textarea id="route" value={routeInput} onChange={(e) => setRouteInput(e.target.value)} className="w-full h-24 p-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-xs text-slate-300 resize-none" placeholder="例: ... ADREW 75N130W 76N120W ... RATSU ..." />
            <div className="flex items-start space-x-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800">
              <SafeIcon name="AlertCircle" className="w-3.5 h-3.5 mt-0.5 text-blue-400 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <p>ルート内の特徴的なポイント（ADREW, OMEKAなど）から山岳迂回ルート a) 〜 i) を自動判定します。</p>
              </div>
            </div>
          </div>
        </div>

        {/* ETOPS ALTN 計算セクション */}
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4">
          <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center">
            <SafeIcon name="Fuel" className="w-4 h-4 mr-1.5 text-blue-400" />
            Additional Fuel 不要 ALTN (北太平洋航路)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">機種・エンジン</label>
              <select value={aircraft} onChange={(e) => setAircraft(e.target.value)} className="w-full p-1.5 border border-slate-700 rounded bg-slate-900 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500">
                <option value="B777-300ER/B777F">B777-300ER/B777F</option><option value="B787-9 1000K">B787-9 1000K</option><option value="B787-8 1000CE/L">B787-8 1000CE/L</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">目的地</label>
              <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full p-1.5 border border-slate-700 rounded bg-slate-900 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500">
                <option value="EDDF">EDDF (Frankfurt)</option><option value="EGLL">EGLL (London Heathrow)</option><option value="ESSA">ESSA (Stockholm Arlanda)</option><option value="EBBR">EBBR (Brussels)</option><option value="LFPG">LFPG (Paris CDG)</option><option value="LIMC">LIMC (Milan Malpensa)</option><option value="LOWW">LOWW (Vienna)</option><option value="EDDM">EDDM (Munich)</option><option value="Other">Other Europe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center">
                山岳迂回ルート<span className="ml-1.5 text-[10px] text-slate-500">(自動判定結果:</span>
                {detectedRouteType ? (<span className="ml-1 text-amber-400 font-black text-[10px] sm:text-[11px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 leading-none truncate max-w-[120px] sm:max-w-none">{routeLabels[detectedRouteType]}</span>) : (<span className="ml-1 text-[10px] text-slate-500">なし</span>)}
                <span className="text-[10px] text-slate-500 ml-0.5">)</span>
              </label>
              <select value={activeRouteType} onChange={(e) => setManualRouteType(e.target.value)} className="w-full p-1.5 border border-slate-700 rounded bg-slate-900 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500">
                <option value="">-- 手動選択をクリア --</option>
                <option value="a">a) ADREW ... SINVU/75N130W ...</option><option value="b">b) ADREW ... NADMA/IKNOG ...</option><option value="c">c) AGMIF ...</option><option value="d">d) OMEKA ...</option><option value="e">e) 80N060W ... 69N000E ...</option><option value="f">f) SINVU 77N060W ...</option><option value="g">g) アイスランド東迂回</option><option value="h">h) アイスランド西迂回</option><option value="i">i) BUDUM ... ABGUN</option>
              </select>
            </div>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-700">
            <h3 className="font-semibold text-slate-300 text-xs mb-2 flex items-center"><SafeIcon name="CheckCircle" className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />Additional Fuel 不要の ETOPS ALTN 組み合わせ</h3>
            {activeRouteType ? (noAdditionalFuelAltns.length > 0 ? (<div className="flex flex-wrap gap-2">{noAdditionalFuelAltns.map((item, idx) => (<span key={idx} className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded font-mono text-[11px] border border-emerald-700/50 flex items-center gap-1">{item.altn}{item.etops === '207' && <span className="text-[9px] bg-emerald-800/60 text-emerald-200 px-1 py-0.5 rounded leading-none">207</span>}</span>))}</div>) : (<p className="text-xs text-red-400">条件に合致する「追加燃料不要」のALTNはありません。</p>)) : (<p className="text-xs text-slate-500">ルートを入力するか、手動で選択してください。</p>)}
          </div>
        </div>

        {/* ★ ARINC Pacific HF & VHF 周波数表示セクション ★ */}
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 border-b border-slate-700 pb-2 gap-2">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-sm font-bold text-slate-200 flex items-center">
                <SafeIcon name="Radio" className="w-4 h-4 mr-1.5 text-amber-400" />
                ARINC Pacific Frequencies
              </h2>
              
              <button 
                onClick={fetchHFData} 
                disabled={isFetchingHF} 
                className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                  hfData.status === "LIVE" ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' : 
                  hfData.status === "CACHED" ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30' : 
                  hfData.status === "Not Updated" ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' : 
                  'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                } flex items-center gap-1`} 
                title={hfData.isOnlineData ? `Valid: ${hfData.lastUpdated}` : "タップして最新データを取得"}
              >
                <SafeIcon name={hfData.status === "Not Updated" ? "AlertTriangle" : hfData.status === "CACHED" ? "Database" : "RefreshCw"} className={`w-2.5 h-2.5 ${isFetchingHF ? 'animate-spin' : ''}`} />
                {hfData.status === "Not Updated" ? "⚠️ Not Updated" : hfData.status === "CACHED" ? "📦 CACHED" : hfData.status}
              </button>
              
              <a href="https://radio.arinc.net/pacific/" target="_blank" rel="noopener noreferrer" className="ml-1 text-[10px] text-blue-400 hover:text-blue-300 underline flex items-center gap-0.5 transition-colors">
                <SafeIcon name="ExternalLink" className="w-3 h-3" />公式サイトを開く
              </a>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700 text-xs font-mono font-bold">
              <span className="text-slate-400">Today(UTC):</span>
              <span className="text-blue-400">{todayInfo.dateStr}</span>
            </div>
          </div>

          {(hfData.status === "Not Updated" || hfData.status === "CACHED") && (
            <div className={`mb-3 border p-2 rounded flex items-start gap-2 text-[10px] ${hfData.status === "CACHED" ? 'bg-amber-900/20 border-amber-500/40 text-amber-400' : 'bg-red-900/20 border-red-500/40 text-red-400'}`}>
              <SafeIcon name={hfData.status === "CACHED" ? "Database" : "AlertTriangle"} className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-bold">
                {hfData.status === "CACHED" ? 
                  `自動取得に失敗したかオフラインです。現在表示されている周波数は前回取得時 (${hfData.lastUpdated}) に保存された「キャッシュデータ」であり、最新ではない可能性があります。` :
                  `自動取得がブロックされました。現在表示されている周波数は「アプリ内蔵の初期データ」であり、最新ではない可能性があります。Cloudflare Worker のURLが正しく設定されているか確認してください。`
                }
              </p>
            </div>
          )}

          {/* HF Frequencies */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`bg-slate-900/60 p-2.5 rounded-lg border ${hfData.status === "Not Updated" ? "border-red-500/30" : hfData.status === "CACHED" ? "border-amber-500/30" : "border-slate-700/60"} flex flex-col justify-between`}>
              <div className="text-[11px] font-black text-slate-300 border-l-2 border-amber-400 pl-2 mb-1.5 font-normal leading-none">Alaska / North Pacific <span className="text-[9px] text-slate-500 font-normal">(West of 150W)</span></div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                <div>Pri: <span className="text-white font-bold">{hfData.alaska.pri}</span></div>
                <div>Sec: <span className="text-slate-300">{hfData.alaska.sec}</span></div>
              </div>
            </div>
            <div className={`bg-slate-900/60 p-2.5 rounded-lg border ${hfData.status === "Not Updated" ? "border-red-500/30" : hfData.status === "CACHED" ? "border-amber-500/30" : "border-slate-700/60"} flex flex-col justify-between`}>
              <div className="text-[11px] font-black text-slate-300 border-l-2 border-amber-400 pl-2 mb-1.5 leading-none">North America &rarr; Asia</div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                <div>Pri: <span className="text-white font-bold">{hfData.asia.pri}</span></div>
                <div>Sec: <span className="text-slate-300">{hfData.asia.sec}</span></div>
              </div>
            </div>
            <div className={`bg-slate-900/60 p-2.5 rounded-lg border ${hfData.status === "Not Updated" ? "border-red-500/30" : hfData.status === "CACHED" ? "border-amber-500/30" : "border-slate-700/60"} flex flex-col justify-between`}>
              <div className="text-[11px] font-black text-slate-300 border-l-2 border-amber-400 pl-2 mb-1.5 leading-none">Polar Route</div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                <div>Pri: <span className="text-white font-bold">{hfData.polar.pri}</span></div>
                <div>Sec: <span className="text-slate-300">{hfData.polar.sec}</span></div>
                {hfData.polar.ter && <div>Ter: <span className="text-slate-400">{hfData.polar.ter}</span></div>}
              </div>
            </div>
          </div>

          {/* VHF & SatVoice Frequencies */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
              <div className="text-[11px] font-black text-slate-300 border-l-2 border-sky-400 pl-2 mb-1.5 leading-none">VHF Extended Range & SatVoice</div>
              <div className="flex flex-col gap-1 text-xs font-mono text-slate-400 pt-1">
                <div className="flex justify-between">LAX/SFO/ACV/HI/GUM: <span className="text-white font-bold">131.95</span></div>
                <div className="flex justify-between border-t border-slate-700/50 pt-1 mt-0.5">SFO ARINC SatVoice: <span className="text-white font-bold">436625</span></div>
              </div>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
              <div className="text-[11px] font-black text-slate-300 border-l-2 border-sky-400 pl-2 mb-1.5 leading-none">VHF On-Ground</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-slate-400 pt-1">
                <div className="flex justify-between">LAX: <span className="text-white font-bold">131.95</span></div>
                <div className="flex justify-between">SFO: <span className="text-white font-bold">130.40</span></div>
                <div className="flex justify-between border-t border-slate-700/50 pt-1 mt-0.5">SEA/PDX: <span className="text-white font-bold">131.80</span></div>
                <div className="flex justify-between border-t border-slate-700/50 pt-1 mt-0.5">YVR: <span className="text-white font-bold">129.40</span></div>
              </div>
            </div>
          </div>
          
        </div>

        {/* 🚚 ここから引っ越してきたETOPSルール 🚚 */}
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4 mb-4">
          <div className="mb-3 shrink-0">
            <div className="table-container w-full">
              <div className="text-sm font-bold text-slate-200 mb-2 border-b-2 border-slate-600 pb-1">【 参考 】 Adequate Airport の Suitability 判定気象条件 (4-14-3)</div>

              <div style={{ padding: '0.5rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid #475569' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.5rem', textAlign: 'center' }}>
                  ① 飛行実施計画の段階 (立案、検討および承認の段階)
                </div>
                <div className="table-notes text-slate-400 text-xs mb-2">
                  (1) 着陸予定滑走路は、進入方式および滑走路状態に応じた最大横風値以下であることが予想されること。<br />
                  (2) 当該便の運航に適用できる最低気象条件が、下記の値以上であることが予想されること。
                </div>
                <table className="w-full text-xs text-slate-300 border-collapse border border-slate-600 mb-2">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="border border-slate-600 p-1 text-center">滑走路数</th>
                      <th className="border border-slate-600 p-1 text-center">利用可能な進入方式</th>
                      <th className="border border-slate-600 p-1 text-center">雲高</th>
                      <th className="border border-slate-600 p-1 text-center">視程</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-slate-600 p-1 text-center">—</td><td className="border border-slate-600 p-1">CATⅢ運航</td><td className="border border-slate-600 p-1 text-center">200ft</td><td className="border border-slate-600 p-1 text-center">RVR 550m <br />or<br /> VIS 800m</td></tr>
                    <tr><td className="border border-slate-600 p-1 text-center">—</td><td className="border border-slate-600 p-1">CATⅡ運航</td><td className="border border-slate-600 p-1 text-center">300ft</td><td className="border border-slate-600 p-1 text-center">RVR/VIS 1200m</td></tr>
                    <tr><td className="border border-slate-600 p-1 text-center">複数(※)</td><td className="border border-slate-600 p-1">滑走路ごとに直線進入方式が設定されており利用可能な場合</td><td className="border border-slate-600 p-1 text-center">最低のMNMに対して<br /><span className="text-pink-400 font-bold">DH/MDH + 200ft</span></td><td className="border border-slate-600 p-1 text-center">最低のMNMに対して<br /><span className="text-pink-400 font-bold">RVR/VIS + 800m</span></td></tr>
                    <tr><td className="border border-slate-600 p-1 text-center">単一</td><td className="border border-slate-600 p-1">CATⅠ、非精密(直線)、計器進入からの周回</td><td className="border border-slate-600 p-1 text-center">最低のMNMに対して<br /><span className="text-pink-400 font-bold">DH/MDH + 400ft</span></td><td className="border border-slate-600 p-1 text-center">最低のMNMに対して<br /><span className="text-pink-400 font-bold">RVR/VIS + 1600m</span></td></tr>
                  </tbody>
                </table>
                <div className="table-notes text-slate-500 text-[10px]">
                  (※) 複数の滑走路とは、物理的に独立して設置され運用されている2本以上の滑走路を指す。（両進入端での2本はみなさない）
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid #475569' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.4rem', textAlign: 'center' }}>
                  ② Company Clearance 成立後および飛行中の変更時
                </div>
                <ul style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0, paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                  <li>(1) 着陸予定滑走路は、進入方式および滑走路状態に応じた<strong style={{ color: '#f8fafc' }}>最大横風値以下</strong>であることが予想されること。</li>
                  <li>(2) 当該便の運航に適用できる <strong style={{ color: '#f8fafc' }}>Landing Minima 以上</strong> であることが予想されること。</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-2 mt-4">
            <div className="flex-1 flex flex-col">
              <div className="text-sm font-bold text-slate-200 mb-2 border-b-2 border-slate-600 pb-1">4-14-3 ETOPSによる飛行実施計画</div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 shadow-sm mb-2">
                <div className="text-xs font-black text-sky-400 mb-1.5 flex items-center gap-1">
                  <SafeIcon name="CheckSquare" className="w-3.5 h-3.5" /> ① ETOPS ALTN Airport の Suitability
                </div>
                <div className="text-[10px] text-slate-400 mb-1.5 leading-relaxed">
                  最も早い予想緊急着陸時刻〜最も遅い予想緊急着陸時刻までの間、以下を満足すること。
                </div>
                <ul className="text-[10px] text-slate-300 flex flex-col gap-1.5 pl-0 list-none">
                  <li className="flex items-start gap-1"><span className="bg-sky-900/50 text-sky-400 px-1 py-0.5 rounded font-bold shrink-0 leading-none">(1) 気象</span> <span className="leading-relaxed">一般的運航条件 ＋ 最低気象条件(S-4-16)以上 ＋ 横風制限値以下</span></li>
                  <li className="flex items-start gap-1"><span className="bg-sky-900/50 text-sky-400 px-1 py-0.5 rounded font-bold shrink-0 leading-none">(2) 滑走路</span> <span className="leading-relaxed">安全に着陸するために十分な長さ</span></li>
                  <li className="flex items-start gap-1"><span className="bg-sky-900/50 text-sky-400 px-1 py-0.5 rounded font-bold shrink-0 leading-none">(3) 消防</span> <span className="leading-relaxed">ICAO RFFS カテゴリー4以上<br /><span className="text-[9px] text-slate-500 block">(緊急着陸通報から30分以内に同等支援が得られる場合は例外)</span></span></li>
                  <li className="flex items-start gap-1"><span className="bg-sky-900/50 text-sky-400 px-1 py-0.5 rounded font-bold shrink-0 leading-none">(4) GPS</span> <span className="leading-relaxed">GPS進入前提の場合、5分を超えるRAIM Holeが予測されていないこと</span></li>
                </ul>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 shadow-sm">
                <div className="text-xs font-black text-sky-400 mb-1.5 flex items-center gap-1">
                  <SafeIcon name="Map" className="w-3.5 h-3.5" /> ②〜⑤ 予定飛行経路・通信・航法・搭載燃料
                </div>
                <ul className="text-[10px] text-slate-300 list-disc pl-4 flex flex-col gap-1.5 mt-1">
                  <li className="leading-relaxed">ETOPS ALTNから一発不作動巡航速度で<strong className="text-white">最大飛行時間の範囲内</strong>に経路を設定</li>
                  <li className="leading-relaxed">良好な音声通信 (不可ならDatalink等の代替手段) を確保し、所要の精度の航法情報を得られること</li>
                  <li className="leading-relaxed">規定燃料と Critical Fuel を比較し<strong className="text-white">多い方</strong>を搭載</li>
                  <li className="leading-relaxed">飛行実施計画書に情報(出発・目的・代替、最大飛行時間)を明示し、操縦室内で参照可能であること</li>
                </ul>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="text-sm font-bold text-slate-200 mb-2 border-b-2 border-slate-600 pb-1">4-14-4 出発後の飛行継続等に係る判断基準</div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 shadow-sm mb-2">
                <div className="text-xs font-black text-emerald-400 mb-1.5 flex items-center gap-1">
                  <SafeIcon name="Eye" className="w-3.5 h-3.5" /> ①〜④ 飛行中の確認と要件未達時の措置
                </div>
                <ul className="text-[10px] text-slate-300 list-disc pl-4 flex flex-col gap-1.5 mt-1">
                  <li className="leading-relaxed">ETOPS ALTNのSuitabilityを常に把握。最寄りの Adequate Airport も可能な限り把握する。</li>
                  <li className="leading-relaxed"><strong className="text-white">各 ETOPS Entry Point 前</strong>ごとに再検討。(GPS進入前提時はRAIM予測を再確認)</li>
                  <li className="leading-relaxed">
                    <strong className="text-emerald-400 bg-emerald-900/30 px-1 py-0.5 rounded mr-1">未達時の措置</strong>
                    運航管理者はETOPS ALTNを変更(新代替も最大飛行時間内か確認)し機長へ通報。機長は適切な措置をとる。(※安全上より適切な措置があればそちらを優先)
                  </li>
                  <li className="leading-relaxed">悪天候等で経路変更時も、ETOPS ALTN または Adequate Airport から最大飛行時間の範囲内であること。(※緊急時等は例外)</li>
                </ul>
              </div>
              <div className="bg-rose-900/20 border border-rose-500/30 rounded-lg p-3 shadow-sm">
                <div className="text-xs font-black text-rose-400 mb-1.5 flex items-center gap-1">
                  <SafeIcon name="AlertOctagon" className="w-3.5 h-3.5" /> ⑤ 緊急事態発生時の措置
                </div>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="bg-slate-950/50 p-2 rounded border border-slate-700">
                    <div className="text-[10px] font-black text-rose-300 mb-1 border-l-2 border-rose-400 pl-1.5">一発動機停止</div>
                    <div className="text-[9px] text-slate-300 leading-relaxed">
                      最も近い(所要時間が短い) Suitabilityをみたす <strong className="text-white bg-rose-500/20 px-1 py-0.5 rounded">Adequate Airport</strong> へ着陸を原則とする。
                    </div>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded border border-slate-700">
                    <div className="text-[10px] font-black text-orange-300 mb-1 border-l-2 border-orange-400 pl-1.5">主要系統の不具合等</div>
                    <div className="text-[9px] text-slate-300 leading-relaxed">
                      最も近い(所要時間が短い) <strong className="text-white bg-orange-500/20 px-1 py-0.5 rounded">ETOPS Alternate Airport</strong> へ着陸を原則とする。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};