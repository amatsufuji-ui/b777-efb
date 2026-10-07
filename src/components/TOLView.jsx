import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

const TOLView = ({ navlogData }) => {
  // 追加: CalendarPlus アイコンを読み込み
  const { PlaneTakeoff, Globe, Clock, AlertTriangle, CheckCircle2, ChevronRight, CalendarPlus, AlertOctagon, Info } = LucideIcons;

  const airportData = [
    { region: "Japan", code: "HND/NRT", name: "東京", tz: "Asia/Tokyo" },
    { region: "Japan", code: "KIX/ITM", name: "大阪", tz: "Asia/Tokyo" },
    { region: "Japan", code: "NGO", name: "名古屋", tz: "Asia/Tokyo" },
    { region: "Japan", code: "FUK", name: "福岡", tz: "Asia/Tokyo" },
    { region: "Japan", code: "CTS", name: "札幌", tz: "Asia/Tokyo" },
    { region: "Japan", code: "OKA", name: "沖縄", tz: "Asia/Tokyo" },
    { region: "North America", code: "LAX", name: "ロサンゼルス", tz: "America/Los_Angeles" },
    { region: "North America", code: "SFO", name: "サンフランシスコ", tz: "America/Los_Angeles" },
    { region: "North America", code: "SJC", name: "サンノゼ", tz: "America/Los_Angeles" },
    { region: "North America", code: "SEA", name: "シアトル", tz: "America/Los_Angeles" },
    { region: "North America", code: "ORD", name: "シカゴ", tz: "America/Chicago" },
    { region: "North America", code: "IAH", name: "ヒューストン", tz: "America/Chicago" },
    { region: "North America", code: "JFK/EWR", name: "ニューヨーク", tz: "America/New_York" },
    { region: "North America", code: "IAD", name: "ワシントンD.C.", tz: "America/New_York" },
    { region: "North America", code: "YVR", name: "バンクーバー", tz: "America/Vancouver" },
    { region: "Latin America", code: "MEX", name: "メキシコシティ", tz: "America/Mexico_City" },
    { region: "Hawaii", code: "HNL", name: "ホノルル", tz: "Pacific/Honolulu" },
    { region: "Europe", code: "LHR", name: "ロンドン", tz: "Europe/London" },
    { region: "Europe", code: "CDG", name: "パリ", tz: "Europe/Paris" },
    { region: "Europe", code: "FRA", name: "フランクフルト", tz: "Europe/Berlin" },
    { region: "Europe", code: "MUC", name: "ミュンヘン", tz: "Europe/Berlin" },
    { region: "Europe", code: "VIE", name: "ウィーン", tz: "Europe/Vienna" },
    { region: "Europe", code: "BRU", name: "ブリュッセル", tz: "Europe/Brussels" },
    { region: "Europe", code: "MXP", name: "ミラノ", tz: "Europe/Rome" },
    { region: "Europe", code: "ARN", name: "ストックホルム", tz: "Europe/Stockholm" },
    { region: "Europe", code: "IST", name: "イスタンブール", tz: "Europe/Istanbul" },
    { region: "East Asia", code: "PEK", name: "北京", tz: "Asia/Shanghai" },
    { region: "East Asia", code: "PVG/SHA", name: "上海", tz: "Asia/Shanghai" },
    { region: "East Asia", code: "CAN", name: "広州", tz: "Asia/Shanghai" },
    { region: "East Asia", code: "DLC", name: "大連", tz: "Asia/Shanghai" },
    { region: "East Asia", code: "TAO", name: "青島", tz: "Asia/Shanghai" },
    { region: "East Asia", code: "HGH", name: "杭州", tz: "Asia/Shanghai" },
    { region: "East Asia", code: "SZX", name: "深圳", tz: "Asia/Shanghai" },
    { region: "East Asia", code: "HKG", name: "香港", tz: "Asia/Hong_Kong" },
    { region: "East Asia", code: "TPE/TSA", name: "台北", tz: "Asia/Taipei" },
    { region: "East Asia", code: "ICN/GMP", name: "ソウル", tz: "Asia/Seoul" },
    { region: "Southeast Asia", code: "SIN", name: "シンガポール", tz: "Asia/Singapore" },
    { region: "Southeast Asia", code: "BKK", name: "バンコク", tz: "Asia/Bangkok" },
    { region: "Southeast Asia", code: "KUL", name: "クアラルンプール", tz: "Asia/Kuala_Lumpur" },
    { region: "Southeast Asia", code: "CGK", name: "ジャカルタ", tz: "Asia/Jakarta" },
    { region: "Southeast Asia", code: "MNL", name: "マニラ", tz: "Asia/Manila" },
    { region: "Southeast Asia", code: "SGN", name: "ホーチミン", tz: "Asia/Ho_Chi_Minh" },
    { region: "Southeast Asia", code: "HAN", name: "ハノイ", tz: "Asia/Bangkok" },
    { region: "South Asia", code: "DEL", name: "デリー", tz: "Asia/Kolkata" },
    { region: "South Asia", code: "BOM", name: "ムンバイ", tz: "Asia/Kolkata" },
    { region: "Oceania", code: "SYD", name: "シドニー", tz: "Australia/Sydney" },
    { region: "Oceania", code: "PER", name: "パース", tz: "Australia/Perth" }
  ];

  const tzMap = {
    "RJAA": "HND/NRT", "RJTT": "HND/NRT", "RJBB": "KIX/ITM", "RJGG": "NGO", "RJOO": "KIX/ITM", "RJCC": "CTS", "RJFF": "FUK", "ROAH": "OKA",
    "KLAX": "LAX", "KSFO": "SFO", "KSJC": "SJC", "KSEA": "SEA", "KORD": "ORD", "KIAH": "IAH", "KJFK": "JFK/EWR", "KEWR": "JFK/EWR", "KIAD": "IAD",
    "CYVR": "YVR", "MMMX": "MEX", "PHNL": "HNL",
    "EGLL": "LHR", "LFPG": "CDG", "EDDF": "FRA", "EDDM": "MUC", "LOWW": "VIE", "EBBR": "BRU", "LIMC": "MXP", "ESSA": "ARN", "LTFM": "IST",
    "ZBAA": "PEK", "ZSPD": "PVG/SHA", "ZSSS": "PVG/SHA", "ZGGG": "CAN", "ZYTL": "DLC", "ZSQD": "TAO", "ZSHC": "HGH", "ZGSZ": "SZX",
    "VHHH": "HKG", "RCTP": "TPE/TSA", "RCSS": "TPE/TSA", "RKSI": "ICN/GMP", "RKSS": "ICN/GMP",
    "WSSS": "SIN", "VTBS": "BKK", "WMKK": "KUL", "WIII": "CGK", "RPLL": "MNL", "VVTS": "SGN", "VVNB": "HAN",
    "VIDP": "DEL", "VABB": "BOM", "YSSY": "SYD", "YPPH": "PER"
  };

  const [airportCode, setAirportCode] = useState("HND/NRT");
  const [suTime, setSuTime] = useState("12:20"); 
  const [boTime, setBoTime] = useState("14:00");
  const [crewCount, setCrewCount] = useState(2);
  const [sectors, setSectors] = useState(1);
  const [restClass, setRestClass] = useState(1);
  const [eteTime, setEteTime] = useState("07:57");
  const [taxiIn, setTaxiIn] = useState(15);
  const [unforeseen, setUnforeseen] = useState(false);
  const [calcResults, setCalcResults] = useState(null);
  
  // タイマー関連ステート
  const [timeRemainingMins, setTimeRemainingMins] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  
  // 再通知防止用フラグ（条件が変わればリセットする）
  const notifiedStagesRef = useRef({ three: false, zero: false });

  const currentAirport = airportData.find(a => a.code === airportCode) || airportData[0];
  const airportTz = currentAirport.tz;

  const getTzOffsetMins = useCallback((timeZone) => {
    try {
      const date = new Date();
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
      return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
    } catch (e) { return 0; }
  }, []);

  const formatOffset = (offsetMins) => {
    const sign = offsetMins >= 0 ? '+' : '-';
    const absMins = Math.abs(offsetMins);
    const h = Math.floor(absMins / 60).toString().padStart(2, '0');
    const m = (absMins % 60).toString().padStart(2, '0');
    return `UTC${sign}${h}:${m}`;
  };

  const timeToMins = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minsToTime = (totalMins) => {
    if (isNaN(totalMins)) return "--:--";
    let days = 0;
    if (totalMins >= 1440) { days = Math.floor(totalMins / 1440); } 
    else if (totalMins < 0) { days = Math.floor(totalMins / 1440); }
    let positiveMins = ((totalMins % 1440) + 1440) % 1440;
    const h = Math.floor(positiveMins / 60);
    const m = Math.floor(positiveMins % 60);
    const dayStr = days > 0 ? `(+${days}d) ` : (days < 0 ? `(${days}d) ` : '');
    return `${dayStr}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatDuration = (totalMins) => {
    if (isNaN(totalMins)) return "-";
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    return `${h}H${m > 0 ? `${m}M` : ''}`;
  };

  // 日本は1時間40分(100分)前、それ以外は1時間30分(90分)前に設定
  const calculateDefaultSuTime = useCallback((boTimeStr, currentTz) => {
      const boMins = timeToMins(boTimeStr);
      const isJapan = currentTz === "Asia/Tokyo";
      const offsetMins = isJapan ? 100 : 90; 
      let suMins = boMins - offsetMins;
      if (suMins < 0) suMins += 1440;
      const h = Math.floor(suMins / 60).toString().padStart(2, '0');
      const m = (suMins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
  }, []);

  const handleBoTimeChange = (newBoTime) => {
    setBoTime(newBoTime);
    setSuTime(calculateDefaultSuTime(newBoTime, airportTz));
    notifiedStagesRef.current = { three: false, zero: false };
  };

  const handleAirportChange = (newCode) => {
      setAirportCode(newCode);
      const matched = airportData.find(a => a.code === newCode);
      if(matched) {
         setSuTime(calculateDefaultSuTime(boTime, matched.tz));
      }
      notifiedStagesRef.current = { three: false, zero: false };
  };

  const toggleUnforeseen = () => {
      setUnforeseen(!unforeseen);
      notifiedStagesRef.current = { three: false, zero: false };
  };

  useEffect(() => {
    if (navlogData) {
      let newCode = airportCode;
      
      if (navlogData.depIcao) {
        if (tzMap[navlogData.depIcao]) {
          newCode = tzMap[navlogData.depIcao];
        } else {
          const code3 = navlogData.depIcao.substring(1);
          const matchedAirport = airportData.find(a => a.code.includes(code3));
          if (matchedAirport) {
              newCode = matchedAirport.code;
          }
        }
        setAirportCode(newCode);
      }

      const matchedTz = airportData.find(a => a.code === newCode)?.tz || "Asia/Tokyo";

      if (navlogData.stdH !== undefined && navlogData.stdM !== undefined) {
        const stdStr = `${String(navlogData.stdH).padStart(2, '0')}:${String(navlogData.stdM).padStart(2, '0')}`;
        setBoTime(stdStr);
        setSuTime(calculateDefaultSuTime(stdStr, matchedTz));
      }
      
      if (navlogData.fltTimeH !== undefined && navlogData.fltTimeM !== undefined) {
        setEteTime(`${String(navlogData.fltTimeH).padStart(2, '0')}:${String(navlogData.fltTimeM).padStart(2, '0')}`);
      }
      if (navlogData.pTaxiIn !== undefined) {
        setTaxiIn(navlogData.pTaxiIn);
      }
      if (navlogData.pCrewCount !== undefined) {
        setCrewCount(navlogData.pCrewCount);
      }
      
      notifiedStagesRef.current = { three: false, zero: false };
    }
  }, [navlogData, calculateDefaultSuTime]);

  useEffect(() => {
    const offsetMins = getTzOffsetMins(airportTz);
    let suUtcMins = timeToMins(suTime);
    let boUtcMins = timeToMins(boTime);
    if (boUtcMins < suUtcMins) boUtcMins += 1440;

    let suLocalMins = ((suUtcMins + offsetMins) % 1440 + 1440) % 1440;
    let suLocalHour = Math.floor(suLocalMins / 60);

    let fdpLimit = 0;
    let ftLimit = 0;
    const isOver3 = (sectors >= 3);

    if (crewCount === 2) {
      if (suLocalHour >= 0 && suLocalHour < 5) ftLimit = isOver3 ? 8*60 : 9*60;
      else if (suLocalHour >= 5 && suLocalHour < 17) ftLimit = isOver3 ? 9*60 : 10*60;
      else ftLimit = isOver3 ? 8*60 : 9*60;
      
      if (suLocalHour >= 0 && suLocalHour < 5) fdpLimit = isOver3 ? 10.5*60 : 11*60;
      else if (suLocalHour >= 5 && suLocalHour < 6) fdpLimit = isOver3 ? 11.5*60 : 12*60;
      else if (suLocalHour >= 6 && suLocalHour < 14) fdpLimit = isOver3 ? 12.5*60 : 13*60;
      else if (suLocalHour >= 14 && suLocalHour < 16) fdpLimit = isOver3 ? 11.5*60 : 12*60;
      else fdpLimit = isOver3 ? 10.5*60 : 11*60;
    } else if (crewCount === 3) {
      ftLimit = 15 * 60;
      if (restClass === 1) fdpLimit = isOver3 ? 16*60 : 17*60;
      else if (restClass === 2) fdpLimit = isOver3 ? 15*60 : 16*60;
      else fdpLimit = isOver3 ? 14*60 : 15*60;
    } else if (crewCount >= 4) {
      ftLimit = 17 * 60;
      if (restClass === 1) fdpLimit = isOver3 ? 17*60 : 18*60;
      else if (restClass === 2) fdpLimit = isOver3 ? 16*60 : 17*60;
      else fdpLimit = isOver3 ? 15*60 : 16*60;
    }

    const fdpExt = unforeseen ? (crewCount === 2 ? 120 : 180) : 0;
    const finalFdpLimit = fdpLimit + fdpExt;
    const finalFtLimit = ftLimit;
    const fltReqMins = timeToMins(eteTime) + taxiIn;

    const fdpToLimitMins = suUtcMins + finalFdpLimit - fltReqMins;
    const ftToLimitMins = boUtcMins + finalFtLimit - fltReqMins;

    const finalToLimitMins = Math.min(fdpToLimitMins, ftToLimitMins);
    const limitingFactor = fdpToLimitMins < ftToLimitMins ? 'FDP' : 'F/T';
    const isImpossible = finalToLimitMins < boUtcMins;

    setCalcResults({
      offsetMins, suLocalMins, fdpLimit, ftLimit, finalFdpLimit, finalFtLimit,
      fltReqMins, fdpToLimitMins, ftToLimitMins, finalToLimitMins, limitingFactor, isImpossible
    });
  }, [airportTz, suTime, boTime, crewCount, sectors, restClass, eteTime, taxiIn, unforeseen, getTzOffsetMins]);

  const playAlertSound = useCallback(() => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime); 
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch(e) { console.error("Audio playback failed", e); }
  }, []);

  // カレンダー用のICSファイルを生成してダウンロードさせる
  const handleAddToCalendar = () => {
    if (!calcResults || calcResults.isImpossible) {
         window.dispatchEvent(new CustomEvent('show-toast', { detail: '離陸不可能なためカレンダーに登録できません' }));
         return;
    }

    const now = new Date();
    const nowUtcMins = now.getUTCHours() * 60 + now.getUTCMinutes();
    let diff = calcResults.finalToLimitMins - nowUtcMins;
    
    // 日付またぎの処理
    if (diff < -720) diff += 1440; 
    if (diff > 720) diff -= 1440; 
    
    // 過去の時間の場合はセット不可
    if (diff <= 0) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: '既に制限時刻を過ぎています' }));
        return;
    }

    // カレンダーイベントの時刻（UTC）を計算
    const limitDate = new Date(now.getTime() + diff * 60000);
    
    const formatDate = (d) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const dtstamp = formatDate(now);
    const dtstart = formatDate(limitDate);
    const dtend = formatDate(new Date(limitDate.getTime() + 60000)); // 1分間のイベント

    // ICS ファイルのコンテンツを作成（0分前と3分前に通知を設定）
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ANA//7PT T/O Limit Calculator//JP
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:tolimit-${Date.now()}@7pt.ana
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:✈️ T/O Limit 到達！
DESCRIPTION:計算上の離陸制限時刻を過ぎました。運航の可否を確認してください。
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:T/O Limit 到達！
END:VALARM
BEGIN:VALARM
TRIGGER:-PT3M
ACTION:DISPLAY
DESCRIPTION:T/O Limit まで残り3分です
END:VALARM
END:VEVENT
END:VCALENDAR`;

    // ダウンロードトリガー
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TOLimit_Alarm.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    window.dispatchEvent(new CustomEvent('show-toast', { detail: 'カレンダーファイルを作成しました。予定に追加してください。' }));
  };

  // アプリを画面に開いている間のためのタイマー処理（常時監視）
  useEffect(() => {
    let interval;
    if (calcResults && !calcResults.isImpossible) {
      const checkTime = () => {
         const now = new Date();
         const nowUtcMins = now.getUTCHours() * 60 + now.getUTCMinutes();
         
         let diff = calcResults.finalToLimitMins - nowUtcMins;
         if (diff < -720) diff += 1440; 
         if (diff > 720) diff -= 1440;  

         setTimeRemainingMins(diff);

         // T/O Limit 到達時
         if (diff <= 0 && diff > -60 && !notifiedStagesRef.current.zero) {
           notifiedStagesRef.current.zero = true;
           setShowAlertModal(true);
           playAlertSound();
         // T/O Limit 3分前
         } else if (diff === 3 && !notifiedStagesRef.current.three) {
           notifiedStagesRef.current.three = true;
           window.dispatchEvent(new CustomEvent('show-toast', { detail: `T/O Limit まで残り 3 分です` }));
           playAlertSound();
         }
      };
      
      checkTime(); 
      interval = setInterval(checkTime, 10000); 
    } else {
      setTimeRemainingMins(null);
    }
    return () => clearInterval(interval);
  }, [calcResults, playAlertSound]);

  if (!calcResults) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="w-full h-full overflow-y-auto bg-[#0a111f] p-2 sm:p-4 font-sans rounded-lg custom-scrollbar">
      
      {/* 警告モーダル（アプリをフォアグラウンドで開いている時用） */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-rose-900/90 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-8 max-w-lg w-full shadow-2xl flex flex-col items-center text-center animate-bounce-short">
              <AlertOctagon className="text-rose-500 w-24 h-24 mb-4 animate-pulse" />
              <h2 className="text-3xl font-black text-white mb-2">T/O Limit 到達！</h2>
              <p className="text-rose-200 font-bold mb-8">計算上の離陸制限時刻を過ぎました。</p>
              <button 
                onClick={() => setShowAlertModal(false)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xl py-4 px-12 rounded-xl transition-colors shadow-lg"
              >
                確認 (Dismiss)
              </button>
           </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto pb-20">
        <header className="bg-[#1e293b] border border-slate-700 text-white rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <PlaneTakeoff size={180} />
          </div>
          <div className="relative z-10 flex items-center gap-4 sm:gap-6">
            <div className="bg-blue-900/50 border border-blue-700/50 p-3 sm:p-4 rounded-2xl shadow-inner shrink-0">
              <Globe size={28} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">T/O Limit Calculator</h1>
              <p className="text-blue-300 text-xs sm:text-sm mt-1 font-medium">Global Edition (UTC Base) / OM 8-5 離陸制限時間 計算ツール</p>
            </div>
          </div>
          
          <div className="flex w-full sm:w-auto gap-4 relative z-10">
            {/* バックグラウンド対策用のカレンダー追加ボタン */}
            <button 
              onClick={handleAddToCalendar} 
              className="flex-1 sm:flex-none transition-all px-4 py-2.5 rounded-lg text-sm font-black flex items-center justify-center gap-2 border shadow-md bg-blue-600 hover:bg-blue-500 text-white border-blue-500"
            >
              <CalendarPlus size={16} /> 通知を登録
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#1e293b] rounded-3xl shadow-lg border border-slate-700 p-6">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2 border-b border-slate-600 pb-3">
                <PlaneTakeoff className="text-blue-400 w-5 h-5" /> フライト条件入力 (UTC)
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">出発地の空港 (Time Zone)</label>
                  <select value={airportCode} onChange={(e) => handleAirportChange(e.target.value)} className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-600 text-white rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-inner">
                    {airportData.map(ap => (
                      <option key={ap.code} value={ap.code}>{ap.region} - {ap.name} ({ap.code})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 font-bold text-right mt-1">Offset: {formatOffset(calcResults.offsetMins)}</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 flex justify-between">
                    <span>S/U <span className="text-[10px] text-slate-500 font-normal">(ZULU)</span></span>
                  </label>
                  <input type="time" value={suTime} onChange={(e) => setSuTime(e.target.value)} className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-600 text-white rounded-xl text-2xl font-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-inner"/>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 flex justify-between">
                    <span>B/O <span className="text-[10px] text-slate-500 font-normal">(ZULU)</span></span>
                    <span className="text-[9px] text-blue-300 bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700/50">S/U連動</span>
                  </label>
                  <input type="time" value={boTime} onChange={(e) => handleBoTimeChange(e.target.value)} className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-600 text-white rounded-xl text-2xl font-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-inner"/>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">運航乗務員の編成</label>
                  <select value={crewCount} onChange={(e) => setCrewCount(Number(e.target.value))} className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-600 text-white rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-inner">
                    <option value={2}>2名編成 (シングル)</option>
                    <option value={3}>3名編成 (マルチ)</option>
                    <option value={4}>4名編成 (ダブル)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">予定飛行回数</label>
                  <select value={sectors} onChange={(e) => setSectors(Number(e.target.value))} className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-600 text-white rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-inner">
                    <option value={1}>2回以下</option>
                    <option value={3}>3回以上</option>
                  </select>
                </div>
                
                {crewCount >= 3 && (
                  <div className="sm:col-span-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-slate-400">機内仮眠設備 (クラス)</label>
                    <select value={restClass} onChange={(e) => setRestClass(Number(e.target.value))} className="w-full px-3 py-2.5 bg-indigo-900/40 border border-indigo-500/50 text-indigo-300 rounded-xl text-sm font-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-inner">
                      <option value={1}>クラス1 (フラットな睡眠設備等)</option>
                      <option value={2}>クラス2 (十分なリクライニング等)</option>
                      <option value={3}>クラス3 (40度以上のリクライニング等)</option>
                    </select>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">ETE <span className="text-[10px] text-slate-500 font-normal">(Flight Time)</span></label>
                  <input type="time" value={eteTime} onChange={(e) => setEteTime(e.target.value)} className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-600 text-white rounded-xl text-xl font-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-inner"/>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">Taxi In <span className="text-[10px] text-slate-500 font-normal">(分)</span></label>
                  <input type="number" value={taxiIn} onChange={(e) => setTaxiIn(Number(e.target.value))} min="0" className="w-full px-3 py-2.5 bg-[#0f172a] border border-slate-600 text-white rounded-xl text-xl font-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-inner"/>
                </div>
              </div>
            </div>

            <div className={`rounded-3xl shadow-lg border p-5 transition-all duration-300 flex items-center justify-between cursor-pointer select-none ${unforeseen ? 'bg-[#331b0b] border-amber-500/50' : 'bg-[#1e293b] border-slate-600 hover:border-slate-500'}`} onClick={toggleUnforeseen}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${unforeseen ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                  <AlertTriangle />
                </div>
                <div>
                  <p className={`font-bold text-base ${unforeseen ? 'text-amber-400' : 'text-white'}`}>不測の事態の適用</p>
                  <p className={`text-xs mt-1 ${unforeseen ? 'text-amber-500/80' : 'text-slate-500'}`}>
                    離陸前発生: FDP上限 <span className="font-mono font-black ml-1 bg-black/50 px-1.5 py-0.5 rounded-md text-amber-400">+{crewCount === 2 ? '2' : '3'}時間</span>
                  </p>
                </div>
              </div>
              
              <div className={`relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none border-2 shadow-inner ${unforeseen ? 'bg-amber-500 border-amber-400' : 'bg-slate-600 border-slate-500'}`}>
                <div className={`absolute z-10 w-6 h-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${unforeseen ? 'translate-x-7' : 'translate-x-0.5'}`} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-3xl p-5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3 text-indigo-400">
                <Clock className="w-6 h-6" />
                <span className="text-sm font-bold">順応地LCL S/U時刻</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-indigo-100 tracking-tight">{minsToTime(calcResults.suLocalMins).trim()}</span>
              </div>
            </div>

            <div className={`rounded-3xl shadow-2xl overflow-hidden relative transition-colors duration-500 border ${calcResults.isImpossible ? 'bg-rose-900/80 border-rose-500' : 'bg-[#1e40af] border-blue-500/50'}`}>
              <div className="p-6 relative z-10 text-white">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-xs font-bold tracking-widest text-blue-300 uppercase">Final T/O Limit Time</h3>
                   {timeRemainingMins !== null && !calcResults.isImpossible && (
                     <div className={`px-2 py-1 rounded text-xs font-black border ${timeRemainingMins <= 60 ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse' : 'bg-blue-500/20 text-blue-300 border-blue-500/50'}`}>
                        残り {timeRemainingMins > 0 ? timeRemainingMins : 0} 分
                     </div>
                   )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-6xl font-black tracking-tighter">{minsToTime(calcResults.finalToLimitMins)}</span>
                  <span className="text-2xl font-bold text-blue-300">Z</span>
                </div>
                <div className="mt-6 pt-4 border-t border-white/20 flex items-center gap-3">
                  {calcResults.isImpossible ? (
                    <><AlertTriangle className="text-rose-400 w-5 h-5" /><span className="text-sm font-bold text-rose-100">B/O時刻での離陸は不可能</span></>
                  ) : (
                    <><CheckCircle2 className="text-emerald-400 w-5 h-5" /><span className="text-sm font-bold text-white">制限要因: <span className="font-black text-emerald-400 bg-black/20 px-1 rounded">{calcResults.limitingFactor}</span> 上限</span></>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#1e293b] rounded-3xl shadow-lg border border-slate-700 p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Info size={14} /> 上限とリミット内訳 (ZULU)
              </h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border ${calcResults.limitingFactor === 'FDP' ? 'bg-[#0f172a]/80 border-blue-500/50' : 'bg-[#0f172a]/50 border-slate-700'} flex justify-between items-center transition-colors`}>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">FDP (飛行勤務時間)</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-black text-white">{formatDuration(calcResults.finalFdpLimit)}</span>
                      {unforeseen && <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-in zoom-in">+{formatDuration(calcResults.finalFdpLimit - calcResults.fdpLimit)}</span>}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <ChevronRight className="text-slate-600 w-5 h-5" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">T/O Limit</p>
                      <p className={`text-2xl font-black tracking-tight ${calcResults.limitingFactor === 'FDP' ? 'text-blue-400' : 'text-white'}`}>{minsToTime(calcResults.fdpToLimitMins)}</p>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-2xl border ${calcResults.limitingFactor === 'F/T' ? 'bg-[#0f172a]/80 border-blue-500/50' : 'bg-[#0f172a]/50 border-slate-700'} flex justify-between items-center transition-colors`}>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">F/T (乗務時間)</p>
                    <p className="text-xl font-black text-white">{formatDuration(calcResults.finalFtLimit)}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <ChevronRight className="text-slate-600 w-5 h-5" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">T/O Limit</p>
                      <p className={`text-2xl font-black tracking-tight ${calcResults.limitingFactor === 'F/T' ? 'text-blue-400' : 'text-white'}`}>{minsToTime(calcResults.ftToLimitMins)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center px-4 pt-4 border-t border-slate-700 mt-2">
                  <span className="text-[10px] font-bold text-slate-400">フライト所要 (ETE + Taxi In)</span>
                  <span className="text-sm font-black text-white bg-slate-900 px-2 py-1 rounded border border-slate-700">{formatDuration(calcResults.fltReqMins)}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default TOLView;