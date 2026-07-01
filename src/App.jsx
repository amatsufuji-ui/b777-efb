import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { RAW_CSV_DATA, aircraftRegistrationList } from './data/flightData';

//アプリ化する場合は以下を有効化する
//import * as importedPdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
//import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.js?worker&inline';
//importedPdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();
//localPdfjsLib = importedPdfjsLib;


// ==========================================
// 📖 目次 (TABLE OF CONTENTS) - 再構成版
// ==========================================
// [1] SETTINGS & IMPORTS
// [2] COMMON & UI COMPONENTS
//     [2-1] SafeIcon
//     [2-2] DepTag
//     [2-3] copyToClipboard, WifiButton & WifiPwdModal
//     [2-4] DrmModal
//     [2-5] parseFlightPlanText & PasteModal
//     [2-6] SmartCatModal
//     [2-7] Toast
//     [2-8] SliderInput (APP CALC)
//     [2-9] Graphic Components (APP CALC)
//           - TrafficPatternGraphic
//           - CirclingPatternGraphic
// [3] DATA SECTION
//     [3-1] FLIGHT DATA (RAW_CSV_DATA)
//     [3-2] AIRCRAFT & REGISTRATION
//     [3-3] LINKS (BUDDYCOM_LINKS)
//     [3-4] PERFORMANCE & WEIGHT DATA
//     [3-5] CRUISE PERF DATA
//     [3-6] VREF DATA
//     [3-7] HOLD & MANEUVER SPD DATA
//     [3-8] APPROACH & LANDING DATA
//     [3-9] WIND LIMITS
//     [3-10] DOCS: DG (DANGEROUS GOODS) DATA
//     [3-11] DOCS: ERG CODE DATA
//     [3-12] DOCS: SPECIAL PAX DATA
// [4] UTILITY FUNCTIONS
//     [4-1] Formatting & Parsing
//     [4-2] Interpolation
//     [4-3] Flight Calculation
// [5] TAB COMPONENTS
//     [5-1] WxMnmReference (WX/MNM)
//     [5-2] Docs2View (DOCS)
//     [5-3] RestView (REST CALC)
//     [5-4] BuddyCommView (BUDDY COMM)
//     [5-5] FltInfoView (FLT INFO)
//     [5-6] DashboardView (DASHBOARD)
//     [5-7] ApproachCalcView (APP CALC)
//     [5-8] XwindView (XWIND)
// [6] MAIN APP COMPONENT
// ==========================================

// ==========================================
// [1] SETTINGS & IMPORTS
// ==========================================
let localPdfjsLib = null;

// ==========================================
// [2] COMMON & UI COMPONENTS
// ==========================================
// --- [2-1] SafeIcon ---
const SafeIcon = ({ name, ...props }) => {
  const Icon = LucideIcons[name];
  if (Icon) return <Icon {...props} />;
  return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);
};

// --- [2-2] DepTag ---
const DepTag = ({ type }) => {
  const config = { wt: { iconName: 'Scale', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', label: 'WT' }, alt: { iconName: 'Gauge', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10', label: 'ALT' }, isa: { iconName: 'Thermometer', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', label: 'ISA' }, oat: { iconName: 'Thermometer', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', label: 'OAT' }, gs: { iconName: 'FastForward', color: 'text-slate-300 border-slate-500/30 bg-slate-500/10', label: 'GS' } }[type];
  if (!config) return null;
  return (<div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${config.color} text-[9px] font-black uppercase tracking-tighter shadow-sm shrink-0`}><SafeIcon name={config.iconName} className="w-3 h-3" />{config.label}</div>);
};

// --- [2-3] copyToClipboard, WifiButton & WifiPwdModal ---
const copyToClipboard = (text) => {
  const el = document.createElement('textarea'); el.value = text; el.setAttribute('readonly', ''); el.style.position = 'absolute'; el.style.left = '-9999px';
  document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
};

const WifiButton = ({ type, url, label, hoverClass, colorClass, onLongPress }) => {
  const timerRef = useRef(null); const [isLongPress, setIsLongPress] = useState(false);
  const handleStart = () => { setIsLongPress(false); timerRef.current = setTimeout(() => { setIsLongPress(true); onLongPress(); }, 600); };
  const handleEnd = (e) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLongPress) {
      e.preventDefault(); const pwd = localStorage.getItem('wifi_password');
      if (pwd) { copyToClipboard(pwd); window.dispatchEvent(new CustomEvent('show-toast', { detail: 'パスワードをコピーしました！' })); }
      window.open(url, '_blank');
    }
  };
  return (
    <button onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={() => { if (timerRef.current) clearTimeout(timerRef.current); }} onTouchStart={handleStart} onTouchEnd={handleEnd} className={`bg-slate-700 ${hoverClass} ${colorClass} hover:text-white px-1 py-0.5 md:px-1.5 md:py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 shadow-sm select-none ${type === 'DOM' ? 'ml-0.5' : ''}`} title="長押しでパスワード設定 / タップでコピー＆開く">
      <SafeIcon name="Wifi" className="w-2.5 h-2.5 md:w-3 md:h-3 pointer-events-none" /><span className="text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">{label}</span>
    </button>
  );
};

const WifiPwdModal = ({ isOpen, onClose }) => {
  const [pwd, setPwd] = useState('');
  useEffect(() => { if (isOpen) setPwd(localStorage.getItem('wifi_password') || ''); }, [isOpen]);
  const handleSave = () => { localStorage.setItem('wifi_password', pwd); window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Wi-Fiパスワードを保存しました！' })); onClose(); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 border border-slate-600 rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-sm w-full">
        <SafeIcon name="Wifi" className="w-12 h-12 text-sky-400" /><h2 className="text-lg font-black text-white">Wi-Fi パスワード設定</h2>
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">登録したパスワードは<span className="text-amber-400 font-bold">端末内にのみ保存</span>されます。<br />INTボタンをタップすると<span className="text-sky-400 font-bold">自動でコピー</span>され、<br />すぐに貼り付け可能になります。</p>
        <input type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="パスワードを入力" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-sky-400" />
        <div className="flex gap-2 w-full mt-2"><button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-colors">キャンセル</button><button onClick={handleSave} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl transition-colors shadow-lg shadow-sky-500/30">保存</button></div>
      </div>
    </div>
  );
};

// --- [2-4] DrmModal ---
const DrmModal = ({ isOpen, onClose, initialFlightNo }) => {
  const [flightNo, setFlightNo] = useState(''); const [flightDate, setFlightDate] = useState('');
  useEffect(() => { if (isOpen) { setFlightNo(initialFlightNo || ''); const d = new Date(); const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]; setFlightDate(`${String(d.getDate()).padStart(2, '0')}${months[d.getMonth()]}`); } }, [isOpen, initialFlightNo]);
  const handleSubmit = () => {
    const email = "ml_notice_drm@ana.co.jp", fNo = flightNo ? `ANA${flightNo}` : "ANA", fDate = flightDate || "", subject = encodeURIComponent(fDate ? `${fNo}/${fDate}` : fNo);
    const gmailUrl = `googlegmail:///co?to=${email}&subject=${subject}`, defaultMailUrl = `mailto:${email}?subject=${subject}`;
    let fallbackTimer;
    const cancelFallback = () => { clearTimeout(fallbackTimer); document.removeEventListener('visibilitychange', handleVisibility); window.removeEventListener('blur', cancelFallback); };
    const handleVisibility = () => { if (document.hidden || document.visibilityState === 'hidden') cancelFallback(); };
    document.addEventListener('visibilitychange', handleVisibility); window.addEventListener('blur', cancelFallback);
    window.location.href = gmailUrl;
    fallbackTimer = setTimeout(() => { cancelFallback(); window.location.href = defaultMailUrl; }, 2000);
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 border border-slate-600 rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-sm w-full">
        <SafeIcon name="Send" className="w-12 h-12 text-rose-400" /><h2 className="text-lg font-black text-white">DRM 報告</h2>
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">件名に記載する<span className="text-rose-400 font-bold">便名</span>と<span className="text-sky-400 font-bold">日付</span>を入力してください。<br />(件名例: ANA123/18JUN)</p>
        <div className="w-full flex flex-col gap-3 mt-2">
          <div className="flex items-center bg-slate-900 border border-slate-600 rounded-lg overflow-hidden focus-within:border-rose-400 transition-colors"><span className="text-xs font-black text-slate-400 pl-3 pr-2 select-none tracking-widest">ANA</span><input type="number" value={flightNo} onChange={(e) => setFlightNo(e.target.value.slice(0, 4))} placeholder="便名 (1〜4桁)" className="w-full bg-transparent py-2.5 text-white font-mono focus:outline-none placeholder:text-slate-600 text-sm" /></div>
          <div className="flex items-center bg-slate-900 border border-slate-600 rounded-lg overflow-hidden focus-within:border-sky-400 transition-colors"><input type="text" value={flightDate} onChange={(e) => setFlightDate(e.target.value.toUpperCase())} placeholder="日付 (例: 18JUN)" className="w-full bg-transparent px-3 py-2.5 text-white font-mono text-center focus:outline-none placeholder:text-slate-600 text-sm uppercase tracking-widest" /></div>
        </div>
        <div className="flex gap-2 w-full mt-2"><button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-colors">キャンセル</button><button onClick={handleSubmit} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-rose-500/30 flex items-center justify-center gap-1.5"><SafeIcon name="Mail" className="w-4 h-4" />メール起動</button></div>
      </div>
    </div>
  );
};

// --- [2-5] parseFlightPlanText & PasteModal ---
const parseFlightPlanText = (text) => {
  if (!text) return null; let data = {};
  const regMatch = text.match(/REG\/(JA[A-Z0-9]+)/) || text.match(/(JA\d{2,4}[A-Z]?)/); if (regMatch) data.reg = regMatch[1];
  const fltMatch = text.match(/ANA(\d{1,4})/); if (fltMatch) data.flightId = parseInt(fltMatch[1], 10).toString();
  const ptowMatch = text.match(/PTOW\s*([\d,]+)/); if (ptowMatch) data.ptow = Math.round(parseInt(ptowMatch[1].replace(/,/g, ''), 10) / 1000);
  const pldwMatch = text.match(/PLDW\s*([\d,]+)/); if (pldwMatch) data.pldw = Math.round(parseInt(pldwMatch[1].replace(/,/g, ''), 10) / 1000);
  const altMatch = text.match(/N\d{4}F(\d{3})/); if (altMatch) data.alt = parseInt(altMatch[1], 10) * 100;

  const fltTimeMatch = text.match(/F\/T\s*(\d{1,2})\s*HR\s*(\d{1,2})\s*MIN/i) ||
    text.match(/F\/T\s*[:]?\s*(\d{2})[:\.]?(\d{2})/i) ||
    text.match(/(?:EFT|EET|FLT TIME|TIME)\s*[:]?\s*(\d{2})[:\.]?(\d{2})/i);
  if (fltTimeMatch) {
    data.fltTimeH = parseInt(fltTimeMatch[1], 10);
    data.fltTimeM = parseInt(fltTimeMatch[2], 10);
  }
  const stdMatch = text.match(/(?:STD|ETD|DEP)\s*[:]?\s*(\d{2})[:\.]?(\d{2})Z?/i);
  if (stdMatch) {
    data.stdH = parseInt(stdMatch[1], 10);
    data.stdM = parseInt(stdMatch[2], 10);
  }

  let extractedTaxi = null;
  const avgTaxiComplexMatch = text.match(/TAXI\s*OUT[\s\S]*?AVG\s*:\s*(\d+)/i) || text.match(/TAXI\s*OUT\/IN.*?AVG:(\d+)/i);
  const explicitTaxiMatch = text.match(/(?:AVG\s*TAXI|TAXI\s*OUT)[^\d]*(\d{1,2})\b/i);
  const fuelTaxiMatch = text.match(/\bTAXI\s+(?:FUEL\s+)?(\d{4})\b/i);
  const simpleTaxiMatch = text.match(/\bTAXI\s+(\d{1,2})\b/i);

  if (avgTaxiComplexMatch) {
    extractedTaxi = parseInt(avgTaxiComplexMatch[1], 10);
  } else if (explicitTaxiMatch) {
    extractedTaxi = parseInt(explicitTaxiMatch[1], 10);
  } else if (fuelTaxiMatch) {
    const hh = parseInt(fuelTaxiMatch[1].substring(0, 2), 10);
    const mm = parseInt(fuelTaxiMatch[1].substring(2, 4), 10);
    extractedTaxi = hh * 60 + mm;
  } else if (simpleTaxiMatch) {
    extractedTaxi = parseInt(simpleTaxiMatch[1], 10);
  }

  if (extractedTaxi !== null && !isNaN(extractedTaxi)) {
    data.avgTaxi = extractedTaxi;
  }

  let extractedIsa = null;
  const explicitIsaMatch = text.match(/(?:AVG)?\s*ISA\s*(?:DEV)?\s*[:]?\s*([PM+-]?\d{1,2})/i);
  if (explicitIsaMatch) {
    let isaStr = explicitIsaMatch[1].toUpperCase();
    extractedIsa = parseInt(isaStr.replace('M', '-').replace('P', '+'), 10);
  }

  const routeMatch = text.match(/(?:DEP\/DEST|ROUTE|FLT)[^\w]*([A-Z]{4})[^\w]*([A-Z]{4})/i) || text.match(/([A-Z]{4})\s*-\s*([A-Z]{4})/); 
  let depPort = '', arrPort = '';
  if (routeMatch) { depPort = routeMatch[1]; arrPort = routeMatch[2]; }
  
  // ★ T/O OAT の抽出 (出発地のMETARから探す)
  // ディスパッチャコメントは使わず、純粋にMETARから抽出します
  if (depPort) {
      // [\s\S]を使用して改行を跨いでも検索できるようにします。ZがOCRで2になるケースに対応
      const depMetarRegex = new RegExp(`${depPort}\\s+\\d{6}[Zz2][\\s\\S]{0,150}?(?:\\s|\\/+)(M?\\d{2})\\/(?:M?\\d{2})[\\s=Q\\n]`);
      const depMetarMatch = text.match(depMetarRegex);
      if (depMetarMatch) {
          data.toOat = parseInt(depMetarMatch[1].replace('M', '-'), 10);
      }
  }

  // ★ L/D OAT の抽出 (到着地のMETARから探す)
  if (arrPort) {
      const arrMetarRegex = new RegExp(`${arrPort}\\s+\\d{6}[Zz2][\\s\\S]{0,150}?(?:\\s|\\/+)(M?\\d{2})\\/(?:M?\\d{2})[\\s=Q\\n]`);
      const arrMetarMatch = text.match(arrMetarRegex);
      if (arrMetarMatch) {
          data.ldOat = parseInt(arrMetarMatch[1].replace('M', '-'), 10);
      }
  }

  // フォールバック
  if (data.toOat === undefined) {
      const toOatMatch = text.match(/(?:T\/O|DEP)\s*OAT[^\dPM+-]*([PM+-]?\d{1,2})/i);
      if (toOatMatch) data.toOat = parseInt(toOatMatch[1].toUpperCase().replace('M', '-').replace('P', '+'), 10);
  }
  if (data.ldOat === undefined) {
      const ldOatMatch = text.match(/(?:L\/D|ARR|DEST)\s*OAT[^\dPM+-]*([PM+-]?\d{1,2})/i);
      if (ldOatMatch) data.ldOat = parseInt(ldOatMatch[1].toUpperCase().replace('M', '-').replace('P', '+'), 10);
  }

  // ★ ISA の抽出 (TOCの文字に依存せず、巡航高度の温度を直接探す)
  if (extractedIsa !== null && !isNaN(extractedIsa)) {
      data.isa = extractedIsa;
  } else if (data.alt) {
    const navLogIndex = text.indexOf('NAVIGATION LOG');
    const searchArea = navLogIndex !== -1 ? text.substring(navLogIndex) : text;
    const altStr = data.alt.toString();
    // 例: "35000 121.4 -47 " や "41000 023.1-56" (距離と温度がくっついている場合) に対応
    const regex = new RegExp(altStr + "\\s+[\\d\\.]+\\s*([M+-]?\\d{2})[\\s\\n]");
    const match = searchArea.match(regex);
    
    if (match) {
        let tempStr = match[1].replace('M', '-').replace('+', '');
        const oatAtAlt = parseInt(tempStr, 10);
        const stdTemp = data.alt >= 36089 ? -56.5 : 15 - 1.98 * (data.alt / 1000);
        data.isa = Math.round(oatAtAlt - stdTemp);
    }
  }

  const elevMatches = [...text.matchAll(/ELEV[\s\S]{0,100}?(\d{1,4})\s*FT/g)];
  if (elevMatches.length > 0) data.toElev = parseInt(elevMatches[0][1], 10);
  if (elevMatches.length > 1) data.ldElev = parseInt(elevMatches[1][1], 10);
  return Object.keys(data).length > 0 ? data : null;
};

const PasteModal = ({ isOpen, onClose, onApply }) => {
  const [text, setText] = useState(''); const [parsedData, setParsedData] = useState(null); const [isExtracting, setIsExtracting] = useState(false);
  useEffect(() => { if (isOpen) { setText(''); setParsedData(null); setIsExtracting(false); } }, [isOpen]);
  useEffect(() => {
    if (!localPdfjsLib && !window.pdfjsLib) {
      const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => { if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; };
      document.head.appendChild(script);
    }
  }, []);
  useEffect(() => { setParsedData(parseFlightPlanText(text)); }, [text]);
  const handleApply = () => { if (parsedData) onApply(parsedData); onClose(); };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.type !== 'application/pdf') { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDFファイルを選択してください' })); return; }
    const pdfLibToUse = localPdfjsLib || window.pdfjsLib;
    if (!pdfLibToUse) { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDFライブラリを準備中です。数秒待ってからお試しください。' })); return; }
    setIsExtracting(true); setText(''); setParsedData(null);
    try {
      const reader = new FileReader();
      reader.onload = async function (event) {
        try {
          const pdf = await pdfLibToUse.getDocument({ data: new Uint8Array(event.target.result) }).promise; let extractedText = '';
          for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const textContent = await page.getTextContent(); extractedText += textContent.items.map(item => item.str).join(' ') + '\n'; }
          setText(extractedText); window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDFの読み込みが完了しました！' }));
        } catch (error) { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'PDFの解析に失敗しました' })); } finally { setIsExtracting(false); }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) { setIsExtracting(false); window.dispatchEvent(new CustomEvent('show-toast', { detail: 'ファイルの読み込みに失敗しました' })); }
  };
  if (!isOpen) return null;
  const renderBadge = (label, value, colorClass = "text-slate-200 bg-slate-700 border-slate-500") => (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${colorClass} shadow-sm shrink-0 whitespace-nowrap`}><span className="text-[10px] opacity-70 uppercase tracking-widest">{label}</span><span className="text-xs font-black">{value}</span></div>
  );
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-800 border border-slate-600 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-w-lg w-full">
        <div className="flex items-center gap-2 text-emerald-400"><SafeIcon name="ClipboardPaste" className="w-8 h-8" /><h2 className="text-lg font-black text-white">フライトプラン解析</h2></div>
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">PDFを選択するか、テキストをコピーして貼り付けてください。</p>
        <div className="w-full bg-slate-900/80 border border-slate-600 rounded-lg p-3 flex flex-col items-center justify-center gap-2 relative shadow-inner">
          <span className="text-xs text-slate-300 font-bold">PDFファイルから自動抽出</span>
          <input type="file" accept="application/pdf" onChange={handleFileUpload} className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 transition-colors cursor-pointer" />
          {isExtracting && <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center rounded-lg z-10 backdrop-blur-sm"><SafeIcon name="Loader2" className="w-6 h-6 text-emerald-400 animate-spin mb-1" /><span className="text-[10px] text-emerald-400 font-bold animate-pulse">PDFを解析中...</span></div>}
        </div>
        <div className="flex items-center gap-2 w-full"><div className="h-[1px] bg-slate-600 flex-1"></div><span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">OR</span><div className="h-[1px] bg-slate-600 flex-1"></div></div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="ここにフライトプランのテキストをペースト..." className="w-full h-20 md:h-24 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-400 custom-scrollbar resize-none" />
        <div className="min-h-[4rem] bg-slate-900/80 border border-slate-700 rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden shadow-inner">
          <div className="flex items-center gap-1 mb-0.5"><SafeIcon name="CheckCircle" className="w-3.5 h-3.5 text-slate-400" /><span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">抽出プレビュー</span></div>
          {text.length === 0 ? <span className="text-xs text-slate-500 italic px-1">PDFを選択するか、テキストを貼り付けるとここにデータが表示されます</span> : parsedData ? (
            <div className="flex flex-wrap gap-1.5 mt-0.5 animate-in fade-in">
              {parsedData.reg && renderBadge("REG", parsedData.reg, "text-white bg-slate-700 border-slate-500")}
              {parsedData.flightId && renderBadge("FLT", `ANA ${parsedData.flightId}`, "text-white bg-slate-700 border-slate-500")}
              {parsedData.fltTimeH !== undefined && renderBadge("FLT TIME", `${parsedData.fltTimeH}H${String(parsedData.fltTimeM).padStart(2, '0')}M`, "text-pink-300 bg-pink-500/20 border-pink-500/40")}
              {parsedData.stdH !== undefined && renderBadge("STD", `${String(parsedData.stdH).padStart(2, '0')}${String(parsedData.stdM).padStart(2, '0')}Z`, "text-pink-300 bg-pink-500/20 border-pink-500/40")}
              {parsedData.avgTaxi !== undefined && renderBadge("TAXI", `${parsedData.avgTaxi} MIN`, "text-amber-300 bg-amber-500/20 border-amber-500/40")}
              {parsedData.ptow && renderBadge("PTOW", `${parsedData.ptow} KLBS`, "text-blue-300 bg-blue-500/20 border-blue-500/40")}
              {parsedData.pldw && renderBadge("PLDW", `${parsedData.pldw} KLBS`, "text-emerald-300 bg-emerald-500/20 border-emerald-500/40")}
              {parsedData.alt && renderBadge("ALT", `${parsedData.alt} FT`, "text-sky-300 bg-sky-500/20 border-sky-500/40")}
              {parsedData.toElev !== undefined && renderBadge("T/O ELV", `${parsedData.toElev} FT`, "text-indigo-300 bg-indigo-500/20 border-indigo-500/40")}
              {parsedData.ldElev !== undefined && renderBadge("L/D ELV", `${parsedData.ldElev} FT`, "text-indigo-300 bg-indigo-500/20 border-indigo-500/40")}
              {parsedData.isa !== undefined && renderBadge("ISA", parsedData.isa > 0 ? `+${parsedData.isa}` : parsedData.isa, "text-orange-300 bg-orange-500/20 border-orange-500/40")}
              {parsedData.toOat !== undefined && renderBadge("T/O", `${parsedData.toOat}°C`, "text-amber-300 bg-amber-500/20 border-amber-500/40")}
              {parsedData.ldOat !== undefined && renderBadge("L/D", `${parsedData.ldOat}°C`, "text-amber-300 bg-amber-500/20 border-amber-500/40")}
            </div>
          ) : <span className="text-xs text-rose-400 italic px-1 font-bold">有効なデータが抽出できませんでした</span>}
        </div>
        <div className="flex gap-2 w-full mt-2">
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-colors">キャンセル</button>
          <button onClick={handleApply} disabled={!parsedData} className={`flex-1 font-bold py-2 rounded-xl transition-all flex justify-center items-center gap-1.5 ${parsedData ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'}`}>データを反映 {parsedData && <SafeIcon name="ArrowRight" className="w-4 h-4" />}</button>
        </div>
      </div>
    </div>
  );
};

// --- [2-6] SmartCatModal ---
const SmartCatModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const handleLink = (url) => { if (url) { window.dispatchEvent(new CustomEvent('show-toast', { detail: '⚠️ 「アプリを検証できません」と表示された場合は、Wi-Fiを完全にオフにして再度お試しください' })); window.location.href = url; } onClose(); };
  const menuItems = [{ label: 'Smart Catalog', url: 'com.visuamall.smartcatalog.prv://' }, { label: 'OM', url: 'com.visuamall.smartcatalog.prv://?cid=1033613' }, { label: 'AOM', url: 'com.visuamall.smartcatalog.prv://?cid=1056544' }, { label: 'AOR', url: 'com.visuamall.smartcatalog.prv://?cid=1038796' }, { label: 'INFO', url: 'com.visuamall.smartcatalog.prv://?cid=1039329' }, { label: 'MEL/CDL', url: 'com.visuamall.smartcatalog.prv://?cid=1027768' }, { label: 'COLD WX HANDBOOK', url: 'com.visuamall.smartcatalog.prv://?cid=2486409' }, { label: 'Intermation', url: 'com.visuamall.smartcatalog.prv://?cid=1924925' }, { label: '顔写真組織表', url: 'com.visuamall.smartcatalog.prv://?cid=2613824' }, { label: 'APO/ENRT INFO LINK', url: 'com.visuamall.smartcatalog.prv://?cid=1686934' }, { label: 'TEN KEY INFO', url: 'com.visuamall.smartcatalog.prv://?cid=1440700' }];
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in" onMouseDown={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-w-sm w-full" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-pink-400 mb-2"><SafeIcon name="BookOpen" className="w-8 h-8" /><h2 className="text-lg font-black text-white uppercase tracking-widest">S.CAT Menu</h2></div>
        <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {menuItems.map((item, idx) => (
            <button key={idx} onClick={() => handleLink(item.url)} className="px-4 py-3 text-left bg-slate-700/50 hover:bg-pink-600/80 border border-slate-600 hover:border-pink-400 rounded-xl transition-colors flex items-center justify-between group">
              <span className="text-sm font-bold text-slate-200 group-hover:text-white tracking-wider">{item.label}</span>{item.url && <SafeIcon name="ExternalLink" className="w-4 h-4 text-slate-500 group-hover:text-white" />}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">閉じる</button>
      </div>
    </div>
  );
};

// --- [2-7] WindComponentModal --- Xwindviewを作ったため削除


// --- [2-8] Toast ---
const Toast = () => {
  const [toastMsg, setToastMsg] = useState('');
  useEffect(() => { const handleToast = (e) => { setToastMsg(e.detail); setTimeout(() => setToastMsg(''), 3000); }; window.addEventListener('show-toast', handleToast); return () => window.removeEventListener('show-toast', handleToast); }, []);
  if (!toastMsg) return null;
  return (<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-800 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-full font-bold text-xs shadow-lg animate-in fade-in slide-in-from-top-4">{toastMsg}</div>);
};


//APP CALC描画用COMPONENT
// ==========================================
// --- [2-9] SliderInput (APP CALC) ---
// ==========================================
const SliderInput = ({ label, subLabel, value, setter, min, max, step, colorClass, accentClass, rightAddon }) => {
  const handleNumberChange = (e) => {
    const val = e.target.value;
    setter(val === '' ? '' : Number(val));
  };
  const handleBlur = () => {
    let val = Number(value);
    if (isNaN(val) || val < min) val = min;
    if (val > max) val = max;
    setter(val);
  };
  const handleSliderChange = (e) => {
    setter(Number(e.target.value));
  };

  return (
    <div className={`bg-slate-900/50 p-1 lg:p-1.5 rounded-xl border border-slate-700 flex flex-col gap-0.5 transition-all justify-center`}>
      <div className="flex justify-between items-center w-full">
        <div className="flex flex-col flex-1 min-w-0 pr-1 lg:pr-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`${colorClass} font-black text-[10px] lg:text-xs leading-none whitespace-nowrap`}>{label}</span>
          </div>
          {subLabel && <span className={`${colorClass} font-black text-[9px] lg:text-[11px] opacity-80 leading-none mt-1`}>{subLabel}</span>}
        </div>
        
        <div className="flex items-center gap-1 lg:gap-1.5 shrink-0">
          <input
            type="number" min={min} max={max} step={step} value={value}
            onChange={handleNumberChange} onBlur={handleBlur}
            className={`border font-mono font-black text-base lg:text-lg px-1.5 py-0 rounded w-14 lg:w-16 text-right focus:outline-none transition-colors bg-slate-800 border-slate-600 text-white focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
          {rightAddon}
        </div>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value === '' ? min : value} 
        onChange={handleSliderChange} 
        className={`w-full h-1 lg:h-1.5 bg-slate-600 rounded-full appearance-none cursor-pointer transition-all mt-1 ${accentClass}`} 
      />
    </div>
  );
};

// ==========================================
// --- [2-10] Graphic Components (APP CALC) ---
// ==========================================
const TrafficPatternGraphic = ({ drawDataLT, drawDataRT, drawDataDB }) => {
  if (!drawDataLT || !drawDataRT) return null;

  const rwyLengthNM = 1.5;
  const rwyHalf = rwyLengthNM / 2;

  const getMinX = (data) => {
    let min = Math.min(
      data.ptFinalStart?.x || 0, data.ptFinalTransOutStart?.x || 0, data.ptFinalTurnStart?.x || 0, 
      data.ptBaseEnd?.x || 0, data.ptBaseStart?.x || 0, data.ptBaseTransOutStart?.x || 0, 
      data.ptBaseTurnStart?.x || 0, data.ptDwTransInStart?.x || 0, data.ptDwStart?.x || 0
    );
    if (data.finalTurnPoints) data.finalTurnPoints.forEach(p => { if (p.x < min) min = p.x; });
    if (data.baseTurnPoints) data.baseTurnPoints.forEach(p => { if (p.x < min) min = p.x; });
    return min;
  };
  const minX_LT = getMinX(drawDataLT);
  const minX_RT = getMinX(drawDataRT);
  const minX_DB = drawDataDB ? Math.min(drawDataDB.ptAbeamDB.x, drawDataDB.intersection.x) : 0;
  
  const maxLeft = Math.max(Math.abs(minX_LT), Math.abs(minX_DB)) + rwyHalf + 0.1;
  const maxRight = Math.abs(minX_RT) + rwyHalf + 0.1; 

  const neededWidthNM = maxLeft + maxRight; 
  const maxPatternWidth = Math.max(drawDataLT.patternWidth, drawDataRT.patternWidth);
  const maxDBDepth = drawDataDB ? Math.abs(drawDataDB.ptAbeamDB.y) : 0;
  const heightNM = maxPatternWidth + maxDBDepth + 2.0; 
  
  const scaleX = (800 - 40) / neededWidthNM;
  const scaleY = (720 - 40) / heightNM; 
  const scale = Math.min(scaleX, scaleY);

  const drawWidthPixel = neededWidthNM * scale;
  const drawHeightPixel = heightNM * scale;
  const paddingX = (800 - drawWidthPixel) / 2;
  const paddingY = (720 - drawHeightPixel) / 2;

  const ox = paddingX + (maxLeft * scale); 
  const rwyY = paddingY + ((maxPatternWidth + 0.7) * scale);

  const renderPattern = (data, isRightTraffic) => {
    const { L_b, baseTurnDX, ptDesc, ptFinalStart, ptFinalTurnStart, ptBaseEnd, ptBaseStart, ptBaseTransOutStart, ptBaseTurnStart, ptDwTransInStart, ptDwStart, baseTurnPoints, finalTurnPoints, distDW, distTransDwBaseIn, thrToBaseDist, patternWidth, isContinuousTurn, continuousType, availTransTime, overshootNM, dwTime, altBaseTurnStart, altBaseTurnEnd, altFinalTurnStart, altFinalTurnEnd, altAbeam, ptFinalTransOutStart } = data;
    
    const dirX = isRightTraffic ? -1 : 1;
    const offsetX = isRightTraffic ? rwyHalf * scale : -rwyHalf * scale;
    const wLineDist = isRightTraffic ? (Math.abs(minX_RT) * scale + 45) : (Math.abs(minX_LT) * scale + 45);
    const textOffsetX = isRightTraffic ? wLineDist : -wLineDist;

    const renderAltBadge = (pt, alt, offsetY, offsetX = 0) => {
      if (!pt || !alt) return null;
      const x = dirX * pt.x * scale;
      const y = -pt.y * scale;
      const bx = x + offsetX;
      const by = y + offsetY;
      const isUp = offsetY < 0;
      
      return (
        <g>
          <line x1={x} y1={y} x2={bx} y2={by + (isUp ? 11 : -11)} stroke="#64748b" strokeWidth={0.8} strokeDasharray="2 2" />
          <circle cx={x} cy={y} r={2} fill={isRightTraffic ? "#10b981" : "#6366f1"} />
          <g transform={`translate(${bx}, ${by})`}>
            <rect x={-28} y={-11} width={56} height={22} fill="#0f172a" rx={4} stroke={isRightTraffic ? "#059669" : "#4f46e5"} strokeWidth={1.5} opacity={0.9}/>
            <text x={0} y={4} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{alt}'</text>
          </g>
        </g>
      );
    };

    return (
      <g transform={`translate(${offsetX}, 0)`}>
        <g>
            <g transform={`translate(0, ${-(patternWidth + 0.6) * scale})`}>
              <line x1={0} y1={0} x2={dirX * -thrToBaseDist * scale} y2={0} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6}/>
              <line x1={0} y1={-5} x2={0} y2={5} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6}/>
              <line x1={dirX * -thrToBaseDist * scale} y1={-5} x2={dirX * -thrToBaseDist * scale} y2={5} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6}/>
              <rect x={dirX * (-thrToBaseDist/2 * scale) - 60} y={-10} width={120} height={20} fill="#0f172a" rx={4} />
              <text x={dirX * (-thrToBaseDist/2 * scale)} y={3} fill={isRightTraffic ? "#6ee7b7" : "#cbd5e1"} fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                THR to BASE: {thrToBaseDist.toFixed(2)} NM
              </text>
            </g>

            <g transform={`translate(${textOffsetX}, ${-(patternWidth / 2) * scale})`}>
              <line x1={0} y1={-(patternWidth / 2) * scale} x2={0} y2={(patternWidth / 2) * scale} stroke="#64748b" strokeWidth={1} />
              <line x1={-3} y1={-(patternWidth / 2) * scale} x2={3} y2={-(patternWidth / 2) * scale} stroke="#64748b" strokeWidth={1} />
              <line x1={-3} y1={(patternWidth / 2) * scale} x2={3} y2={(patternWidth / 2) * scale} stroke="#64748b" strokeWidth={1} />
              <rect x={-25} y={-12} width={50} height={24} fill="#0f172a" rx={4} />
              
              <text x={0} y={1} fill={overshootNM > 0.01 ? "#fb923c" : "#94a3b8"} fontSize="10" fontWeight="bold" textAnchor="middle">
                W {patternWidth.toFixed(2)}
              </text>
              {isContinuousTurn && (
                <text x={0} y={10} fill={continuousType === 'tight' ? "#fb923c" : "#38bdf8"} fontSize="7" fontWeight="bold" textAnchor="middle">
                  {continuousType === 'tight' ? `+${overshootNM.toFixed(2)} NM` : `Margin: ${availTransTime.toFixed(1)}s`}
                </text>
              )}
            </g>

            <g transform={`translate(0, ${-(patternWidth + 0.2) * scale})`}>
              <text x={dirX * -(distDW / 2) * scale} y={-8} fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">{dwTime.toFixed(1)} sec</text>
              <line x1={0} y1={0} x2={dirX * -distDW * scale} y2={0} stroke="#475569" strokeWidth={1} />
              
              <text x={dirX * -(distDW + distTransDwBaseIn / 2) * scale} y={-20} fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">Trans</text>
              <line x1={dirX * -distDW * scale} y1={0} x2={dirX * -(distDW + distTransDwBaseIn) * scale} y2={0} stroke="#475569" strokeWidth={1} />
              <circle cx={dirX * -distDW * scale} cy={0} r={2.5} fill="#475569" />

              <text x={dirX * -(distDW + distTransDwBaseIn + baseTurnDX / 2) * scale} y={-8} fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">Turn {baseTurnDX.toFixed(2)}</text>
              <line x1={dirX * -(distDW + distTransDwBaseIn) * scale} y1={0} x2={dirX * -(distDW + distTransDwBaseIn + baseTurnDX) * scale} y2={0} stroke="#475569" strokeWidth={1} />
              <circle cx={dirX * -(distDW + distTransDwBaseIn) * scale} cy={0} r={2.5} fill="#475569" />
              <circle cx={dirX * -(distDW + distTransDwBaseIn + baseTurnDX) * scale} cy={0} r={2.5} fill="#475569" />
            </g>

            {L_b > 0 && !isContinuousTurn && (
              <g transform={`translate(${dirX * ptBaseStart.x * scale + dirX * 5}, ${-(ptBaseStart.y + ptBaseEnd.y) / 2 * scale})`}>
                <rect x={isRightTraffic ? -38 : 0} y={-8} width={38} height={16} fill="#0f172a" rx={4} />
                <text x={isRightTraffic ? -19 : 19} y={3} fill={isRightTraffic ? "#34d399" : "#38bdf8"} fontSize="9" fontWeight="bold" textAnchor="middle">
                  {L_b.toFixed(2)} NM
                </text>
              </g>
            )}

            <text x={dirX * ptDesc.x * scale} y={-ptDesc.y * scale - 15} fill="#fb923c" fontSize="13" fontWeight="black" textAnchor="middle" className="drop-shadow-md">START</text>
            <text x={0} y={15} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">THR</text>
        </g>

        <g transform={`scale(${dirX * scale}, -${scale})`}>
            <line x1={ptDwStart.x} y1={ptDwStart.y} x2={ptDwTransInStart.x} y2={ptDwTransInStart.y} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} strokeLinecap="round" />
            <line x1={ptDwTransInStart.x} y1={ptDwTransInStart.y} x2={ptBaseTurnStart.x} y2={ptBaseTurnStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />
            
            {baseTurnPoints && <polyline points={baseTurnPoints.map(p => `${p.x},${p.y}`).join(' ')} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} fill="none" strokeLinejoin="round" />}
            
            <line x1={baseTurnPoints[baseTurnPoints.length-1].x} y1={baseTurnPoints[baseTurnPoints.length-1].y} x2={ptBaseStart.x} y2={ptBaseStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />
            <line x1={ptBaseStart.x} y1={ptBaseStart.y} x2={ptBaseEnd.x} y2={ptBaseEnd.y} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} />
            <line x1={ptBaseEnd.x} y1={ptBaseEnd.y} x2={ptFinalTurnStart.x} y2={ptFinalTurnStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />
            
            {finalTurnPoints && <polyline points={finalTurnPoints.map(p => `${p.x},${p.y}`).join(' ')} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} fill="none" strokeLinejoin="round" />}
            
            <line x1={finalTurnPoints[finalTurnPoints.length-1].x} y1={finalTurnPoints[finalTurnPoints.length-1].y} x2={ptFinalStart.x} y2={ptFinalStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />
            <line x1={ptFinalStart.x} y1={ptFinalStart.y} x2={0} y2={0} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} />

            <circle cx={ptDesc.x} cy={ptDesc.y} r={0.08} fill="#fb923c" className="animate-pulse" />
            <circle cx={ptDesc.x} cy={ptDesc.y} r={0.2} fill="none" stroke="#fb923c" strokeWidth={0.02} />
            <line x1={ptDesc.x} y1={ptDesc.y} x2={ptDesc.x + 0.3} y2={ptDesc.y + 0.3} stroke="#fb923c" strokeWidth={0.01} strokeDasharray="0.05 0.05" />
        </g>

        {renderAltBadge(ptDwStart, altAbeam, -25, dirX * 40)}
        {renderAltBadge(ptBaseTurnStart, altBaseTurnStart, 25, dirX * 40)}
        {renderAltBadge(ptBaseTransOutStart, altBaseTurnEnd, isContinuousTurn ? -16 : -8, dirX * 60)}
        {renderAltBadge(ptFinalTurnStart, altFinalTurnStart, isContinuousTurn ? 16 : 8, dirX * 60)}
        {renderAltBadge(ptFinalTransOutStart, altFinalTurnEnd, -25, dirX * 40)}
      </g>
    );
  };

  const renderDBPattern = (data) => {
    if (!data) return null;
    const { ptAbeamDB, ptTransStart, ptFinalTurnStart, ptFinalTurnEnd, ptDescDB, turnPoints, intersection, altAbeam, altDesc, altFinalTurnStart, altFinalTurnEnd } = data;
    
    const offsetX = -rwyHalf * scale;

    const renderAltBadgeDB = (pt, alt, offsetY, offsetX = 0, label = "") => {
      if (!pt || alt === undefined) return null;
      const x = pt.x * scale;
      const y = -pt.y * scale; 
      const bx = x + offsetX;
      const by = y + offsetY;
      const isUp = offsetY < 0;
      
      const lineYEnd = offsetY === 0 ? by : by + (isUp ? 16 : -16);
      
      return (
          <g>
              <line x1={x} y1={y} x2={bx - (offsetX > 0 ? 36 : -36)} y2={lineYEnd} stroke="#c084fc" strokeWidth={0.8} strokeDasharray="2 2" />
              <g transform={`translate(${bx}, ${by})`}>
                  <rect x={-36} y={-16} width={72} height={32} fill="#0f172a" rx={4} stroke="#c084fc" strokeWidth={1.5} opacity={0.9}/>
                  <text x={0} y={-3} fill="#e9d5ff" fontSize="9" fontWeight="bold" textAnchor="middle">{label}</text>
                  <text x={0} y={10} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{alt}'</text>
              </g>
          </g>
      );
    };

    const renderDistBadge = (pt, distNM, offsetX = -55) => {
      if (!pt || distNM === undefined) return null;
      const x = pt.x * scale;
      const y = -pt.y * scale; 
      const bx = x + offsetX;
      const by = y; 
      return (
          <g>
              <line x1={x} y1={y} x2={bx + 24} y2={by} stroke="#64748b" strokeWidth={0.8} strokeDasharray="2 2" />
              <g transform={`translate(${bx}, ${by})`}>
                  <rect x={-24} y={-9} width={48} height={18} fill="#0f172a" rx={3} stroke="#64748b" strokeWidth={1} opacity={0.9}/>
                  <text x={0} y={4} fill="#cbd5e1" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{distNM.toFixed(2)} NM</text>
              </g>
          </g>
      );
    };

    return (
      <g transform={`translate(${offsetX}, 0)`}>
        <g transform={`scale(${scale}, -${scale})`}>
          <line x1={ptAbeamDB.x} y1={ptAbeamDB.y} x2={ptTransStart.x} y2={ptTransStart.y} stroke="#c084fc" strokeWidth={0.04} strokeDasharray="0.05 0.05" />
          <line x1={ptTransStart.x} y1={ptTransStart.y} x2={ptFinalTurnStart.x} y2={ptFinalTurnStart.y} stroke="#d8b4fe" strokeWidth={0.04} />
          <polyline points={turnPoints.map(p => `${p.x},${p.y}`).join(' ')} stroke="#c084fc" strokeWidth={0.04} fill="none" />
          <line x1={ptFinalTurnEnd.x} y1={ptFinalTurnEnd.y} x2={0} y2={0} stroke="#c084fc" strokeWidth={0.04} />
          
          <circle cx={ptAbeamDB.x} cy={ptAbeamDB.y} r={0.08} fill="#c084fc" />
          <circle cx={ptDescDB.x} cy={ptDescDB.y} r={0.08} fill="#fb923c" className="animate-pulse" />
          <circle cx={intersection.x} cy={intersection.y} r={0.05} fill="#f8fafc" />
          
          <line x1={intersection.x} y1={intersection.y} x2={intersection.x} y2={ptAbeamDB.y} stroke="#475569" strokeWidth={0.02} strokeDasharray="0.05 0.05" />
        </g>
        
        <g transform={`translate(${(intersection.x / 2) * scale}, 0)`}>
          <line x1={(intersection.x / 2) * scale} y1={12} x2={Math.abs(intersection.x / 2) * scale} y2={12} stroke="#64748b" strokeWidth={1} />
          <line x1={(intersection.x / 2) * scale} y1={9} x2={(intersection.x / 2) * scale} y2={15} stroke="#64748b" strokeWidth={1} />
          <line x1={Math.abs(intersection.x / 2) * scale} y1={9} x2={Math.abs(intersection.x / 2) * scale} y2={15} stroke="#64748b" strokeWidth={1} />
          <rect x={-20} y={4} width={40} height={16} fill="#0f172a" rx={2} />
          <text x={0} y={15} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">2.5 NM</text>
        </g>
        
        <text x={intersection.x * scale} y={-8} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">INTC</text>
        
        <g transform={`translate(${(intersection.x - 1) * scale}, ${(-ptAbeamDB.y / 2) * scale})`}>
           <text x={0} y={0} fill="#c084fc" fontSize="12" fontWeight="black" className="tracking-widest" opacity={0.3} transform="rotate(-90)">DIRECT BASE</text>
        </g>

        {renderDistBadge(ptTransStart, Math.abs(ptTransStart.y), -65)}
        {renderDistBadge(ptDescDB, Math.abs(ptDescDB.y), -65)}
        {renderDistBadge(ptAbeamDB, Math.abs(ptAbeamDB.y), -65)}

        {renderAltBadgeDB(ptAbeamDB, altAbeam, 0, 65, "ABEAM THR")}
        {renderAltBadgeDB(ptDescDB, altDesc, 0, 65, "DESC")}
        {renderAltBadgeDB(ptTransStart, altFinalTurnStart, 0, 65, "TURN")}
        {renderAltBadgeDB(ptFinalTurnEnd, altFinalTurnEnd, 35, 65, "ROLLOUT")}
      </g>
    );
  };

  return (
    <div className="w-full bg-slate-900/60 rounded-xl border border-slate-700/50 shadow-inner h-[720px] lg:h-[800px] relative overflow-hidden mt-1">
       <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
       <span className="absolute top-2 left-3 text-[10px] font-black tracking-widest text-sky-400 opacity-80 z-20">LEFT TRAFFIC</span>
       <span className="absolute top-2 right-3 text-[10px] font-black tracking-widest text-emerald-400 opacity-80 z-20">RIGHT TRAFFIC</span>
       
       <svg viewBox="0 0 800 720" className="w-full h-full relative z-10" preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${ox}, ${rwyY})`}>
            <g transform={`scale(${scale}, ${scale})`}>
              <line x1={-maxLeft} y1={0} x2={maxRight} y2={0} stroke="#64748b" strokeWidth={0.15} strokeLinecap="square" />
              <line x1={-rwyHalf} y1={0} x2={rwyHalf} y2={0} stroke="#475569" strokeWidth={6 / scale} strokeLinecap="round" />
              <line x1={-rwyHalf} y1={0} x2={rwyHalf} y2={0} stroke="#f8fafc" strokeWidth={0.04} strokeDasharray="0.1 0.1" />
              
              <line x1={-rwyHalf} y1={0} x2={-rwyHalf} y2={-drawDataLT.patternWidth} stroke="#334155" strokeWidth={0.02} strokeDasharray="0.1 0.1" />
              <line x1={rwyHalf} y1={0} x2={rwyHalf} y2={-drawDataRT.patternWidth} stroke="#334155" strokeWidth={0.02} strokeDasharray="0.1 0.1" />
            </g>
            <text x={0} y={15} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">RWY</text>
            
            {renderPattern(drawDataLT, false)}
            {renderPattern(drawDataRT, true)}
            {renderDBPattern(drawDataDB)}
          </g>
       </svg>
    </div>
  );
};

const CirclingPatternGraphic = ({ drawDataLT, drawDataRT, dwTime }) => {
  if (!drawDataLT || !drawDataRT) return null;

  const rwyLengthNM = 1.5;
  const rwyHalf = rwyLengthNM / 2;

  const getMinX = (data) => {
    let min = Math.min(
      data.ptFinalStart?.x || 0, 
      data.ptTransOutStart?.x || 0, 
      data.ptTurnStart?.x || 0, 
      data.ptTransInStart?.x || 0,
      data.ptDwStart?.x || 0
    );
    if (data.turnPoints) data.turnPoints.forEach(p => { if (p.x < min) min = p.x; });
    return min;
  };
  const minX_LT = getMinX(drawDataLT);
  const minX_RT = getMinX(drawDataRT);
  
  const maxLeft = Math.abs(minX_LT) + rwyHalf + 0.1;
  const maxRight = Math.abs(minX_RT) + rwyHalf + 0.1;
  
  const neededWidthNM = maxLeft + maxRight; 
  const maxPatternWidth = Math.max(drawDataLT.patternWidth, drawDataRT.patternWidth);
  const heightNM = maxPatternWidth + 1.1; 
  
  const scaleX = (800 - 40) / neededWidthNM;
  const scaleY = (360 - 40) / heightNM;
  const scale = Math.min(scaleX, scaleY);

  const drawWidthPixel = neededWidthNM * scale;
  const drawHeightPixel = heightNM * scale;
  const paddingX = (800 - drawWidthPixel) / 2;
  const paddingY = (360 - drawHeightPixel) / 2;

  const ox = paddingX + (maxLeft * scale); 
  const rwyY = paddingY + ((maxPatternWidth + 0.7) * scale); 

  const renderPattern = (data, isRightTraffic) => {
    const { turnDX, ptDesc, ptFinalStart, ptTurnStart, ptTransInStart, ptDwStart, turnPoints, distDW, distTransIn, patternWidth, targetWidth, isOvershoot, dwTime, altTurnStart, altTurnMid, altTurnEnd, altAbeam, ptTurnMid, ptTransOutStart } = data;
    
    const dirX = isRightTraffic ? -1 : 1;
    const offsetX = isRightTraffic ? rwyHalf * scale : -rwyHalf * scale;
    const wLineDist = isRightTraffic ? (Math.abs(minX_RT) * scale + 45) : (Math.abs(minX_LT) * scale + 45);
    const textOffsetX = isRightTraffic ? wLineDist : -wLineDist;

    const renderAltBadge = (pt, alt, offsetY, offsetX = 0) => {
      if (!pt || !alt) return null;
      const x = dirX * pt.x * scale;
      const y = -pt.y * scale;
      const bx = x + offsetX;
      const by = y + offsetY;
      const isUp = offsetY < 0;
      
      const lineX2 = offsetY === 0 ? bx - dirX * 28 : bx;
      const lineY2 = offsetY === 0 ? by : by + (isUp ? 11 : -11);

      return (
        <g>
          <line x1={x} y1={y} x2={lineX2} y2={lineY2} stroke="#64748b" strokeWidth={0.8} strokeDasharray="2 2" />
          <circle cx={x} cy={y} r={2} fill={isRightTraffic ? "#10b981" : "#6366f1"} />
          <g transform={`translate(${bx}, ${by})`}>
            <rect x={-28} y={-11} width={56} height={22} fill="#0f172a" rx={4} stroke={isRightTraffic ? "#059669" : "#4f46e5"} strokeWidth={1.5} opacity={0.9}/>
            <text x={0} y={4} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{alt}'</text>
          </g>
        </g>
      );
    };

    return (
      <g transform={`translate(${offsetX}, 0)`}>
        <g>
            <g transform={`translate(0, ${-(patternWidth + 0.6) * scale})`}>
              <line x1={0} y1={0} x2={dirX * -(distDW + distTransIn + turnDX) * scale} y2={0} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6}/>
              <line x1={0} y1={-5} x2={0} y2={5} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6}/>
              <line x1={dirX * -(distDW + distTransIn + turnDX) * scale} y1={-5} x2={dirX * -(distDW + distTransIn + turnDX) * scale} y2={5} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6}/>
              
              <rect x={dirX * (-(distDW + distTransIn + turnDX)/2) * scale - 60} y={-10} width={120} height={20} fill="#0f172a" rx={4} />
              <text x={dirX * (-(distDW + distTransIn + turnDX)/2) * scale} y={3} fill={isRightTraffic ? "#6ee7b7" : "#cbd5e1"} fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                ADVANCE: {(distDW + distTransIn + turnDX).toFixed(2)} NM
              </text>
            </g>

            <g transform={`translate(${textOffsetX}, ${-(patternWidth / 2) * scale})`}>
              <line x1={0} y1={-(patternWidth / 2) * scale} x2={0} y2={(patternWidth / 2) * scale} stroke="#64748b" strokeWidth={1} />
              <line x1={-3} y1={-(patternWidth / 2) * scale} x2={3} y2={-(patternWidth / 2) * scale} stroke="#64748b" strokeWidth={1} />
              <line x1={-3} y1={(patternWidth / 2) * scale} x2={3} y2={(patternWidth / 2) * scale} stroke="#64748b" strokeWidth={1} />
              <rect x={-25} y={-12} width={50} height={24} fill="#0f172a" rx={4} />
              
              <text x={0} y={1} fill={isOvershoot ? "#fb923c" : "#94a3b8"} fontSize="10" fontWeight="bold" textAnchor="middle">
                W {patternWidth.toFixed(2)}
              </text>
              {isOvershoot && (
                <text x={0} y={10} fill="#fb923c" fontSize="7" fontWeight="bold" textAnchor="middle">
                  +{(patternWidth - targetWidth).toFixed(2)} NM
                </text>
              )}
            </g>

            <g transform={`translate(0, ${-(patternWidth + 0.2) * scale})`}>
              <text x={dirX * -(distDW / 2) * scale} y={-8} fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">{dwTime.toFixed(1)} sec</text>
              <line x1={0} y1={0} x2={dirX * -distDW * scale} y2={0} stroke="#475569" strokeWidth={1} />
              
              <text x={dirX * -(distDW + distTransIn / 2) * scale} y={-20} fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">Trans</text>
              <line x1={dirX * -distDW * scale} y1={0} x2={dirX * -(distDW + distTransIn) * scale} y2={0} stroke="#475569" strokeWidth={1} />
              <circle cx={dirX * -distDW * scale} cy={0} r={2.5} fill="#475569" />

              <text x={dirX * -(distDW + distTransIn + turnDX / 2) * scale} y={-8} fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">Turn {turnDX.toFixed(2)}</text>
              <line x1={dirX * -(distDW + distTransIn) * scale} y1={0} x2={dirX * -(distDW + distTransIn + turnDX) * scale} y2={0} stroke="#475569" strokeWidth={1} />
              <circle cx={dirX * -(distDW + distTransIn) * scale} cy={0} r={2.5} fill="#475569" />
              <circle cx={dirX * -(distDW + distTransIn + turnDX) * scale} cy={0} r={2.5} fill="#475569" />
            </g>

            <text x={dirX * ptDesc.x * scale} y={-ptDesc.y * scale - 15} fill="#fb923c" fontSize="13" fontWeight="black" textAnchor="middle" className="drop-shadow-md">START</text>
            <text x={0} y={15} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">THR</text>
        </g>

        <g transform={`scale(${dirX * scale}, -${scale})`}>
            <line x1={ptDwStart.x} y1={ptDwStart.y} x2={ptTransInStart.x} y2={ptTransInStart.y} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} strokeLinecap="round" />
            <line x1={ptTransInStart.x} y1={ptTransInStart.y} x2={ptTurnStart.x} y2={ptTurnStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />
            
            {turnPoints && <polyline points={turnPoints.map(p => `${p.x},${p.y}`).join(' ')} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} fill="none" strokeLinejoin="round" /> }
            
            <line x1={turnPoints[turnPoints.length-1].x} y1={turnPoints[turnPoints.length-1].y} x2={ptFinalStart.x} y2={ptFinalStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />
            <line x1={ptFinalStart.x} y1={ptFinalStart.y} x2={0} y2={0} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} />

            <circle cx={ptDesc.x} cy={ptDesc.y} r={0.08} fill="#fb923c" className="animate-pulse" />
            <circle cx={ptDesc.x} cy={ptDesc.y} r={0.2} fill="none" stroke="#fb923c" strokeWidth={0.02} />
            <line x1={ptDesc.x} y1={ptDesc.y} x2={ptDesc.x + 0.3} y2={ptDesc.y + 0.3} stroke="#fb923c" strokeWidth={0.01} strokeDasharray="0.05 0.05" />
        </g>

        {renderAltBadge(ptDwStart, altAbeam, -25, dirX * 40)}
        {renderAltBadge(ptTurnStart, altTurnStart, 25, dirX * 40)}
        {renderAltBadge(ptTurnMid, altTurnMid, 0, dirX * 60)}
        {renderAltBadge(ptTransOutStart, altTurnEnd, -25, dirX * 40)}
      </g>
    );
  };

  return (
    <div className="w-full bg-slate-900/60 rounded-xl border border-slate-700/50 shadow-inner h-[360px] lg:h-[400px] relative overflow-hidden mt-1">
       <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
       <span className="absolute top-2 left-3 text-[10px] font-black tracking-widest text-sky-400 opacity-80 z-20">LEFT TRAFFIC</span>
       <span className="absolute top-2 right-3 text-[10px] font-black tracking-widest text-emerald-400 opacity-80 z-20">RIGHT TRAFFIC</span>
       
       <svg viewBox="0 0 800 360" className="w-full h-full relative z-10" preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${ox}, ${rwyY})`}>
            <g transform={`scale(${scale}, ${scale})`}>
              <line x1={-maxLeft} y1={0} x2={maxRight} y2={0} stroke="#64748b" strokeWidth={0.15} strokeLinecap="square" />
              <line x1={-rwyHalf} y1={0} x2={rwyHalf} y2={0} stroke="#475569" strokeWidth={6 / scale} strokeLinecap="round" />
              <line x1={-rwyHalf} y1={0} x2={rwyHalf} y2={0} stroke="#f8fafc" strokeWidth={0.04} strokeDasharray="0.1 0.1" />
              
              <line x1={-rwyHalf} y1={0} x2={-rwyHalf} y2={-drawDataLT.patternWidth} stroke="#334155" strokeWidth={0.02} strokeDasharray="0.1 0.1" />
              <line x1={rwyHalf} y1={0} x2={rwyHalf} y2={-drawDataRT.patternWidth} stroke="#334155" strokeWidth={0.02} strokeDasharray="0.1 0.1" />
            </g>
            <text x={0} y={15} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">RWY</text>
            
            {renderPattern(drawDataLT, false)}
            {renderPattern(drawDataRT, true)}
          </g>
       </svg>
    </div>
  );
};



// ==========================================
// [3] DATA SECTION 
// ==========================================
// --- [3-1] FLIGHT DATA (RAW_CSV_DATA) ---  flightData.jsへ


// --- [3-2] AIRCRAFT & REGISTRATION ---　flightData.jsへ
// ★ 変更: AOM R72 (2026.03.23) に基づき最新の機番リスト・型式・エンジンを反映 (777-200ERを777-200に統合)


// --- [3-3] LINKS (BUDDYCOM_LINKS) ---
const BUDDYCOM_LINKS = {
  "JA713A": "https://buddycom.net/b/14148/xPcqyZJY7DzWfLXND2r_tUc4PXRiUInw9LXvABc4w3zOWYx1bize1.JqTvux_RMxboc4b4z6pywLUsu_ZVQfHg",
  "JA714A": "https://buddycom.net/b/14148/bRIUL.EzsqPvxVUm_eFkJbylGLbdbcl9deMfOJgCp94nF2VFDI.XOiLDt4bYZgJoclAq2pJjwIEPZhfp7gdB2A",
  "JA715A": "https://buddycom.net/b/14148/m1CnXa9HVkoxLl63eCqx4fk0xIuBeeadko4xFbE1ksqG_ZiCJyM0ljYLq4oJqNc1wrWJNSvZUlQEYZvH8c.7bg",
  "JA716A": "https://buddycom.net/b/14148/MF_dNXdZwql_nHxCgh04AmiGxjogzuXbEpFznMDT0XDP2Ka0_R4T2v_mrnr3yguQM127gvyXWvcdUo2WVP4m7g",
  "JA717A": "https://buddycom.net/b/14148/sPfwtBayPsu2N6myuNrEqv8Qwkmwyzqp1_GpUhx2u77.MaFNZ4lIs2SM5F07c2sIFUHsL6GuAnAeAFiJShApcg",
  "JA741A": "https://buddycom.net/b/14148/3MlBZVpa69K5Cv8kKAcrjYOOI7hP_AoPbG2K.zmCbbqzJbXtr7GsGs.otswl_Eu35W26.kHUHiI9Yrfz72_mzg",
  "JA742A": "https://buddycom.net/b/14148/uaEQ1io_YwZBFQ1Pov_EDWiAqdrrJkLf3SrVMo_AEXK77vcXm3rPlk8G9kr1hWy7Bp2w6uI1E3j9X.ragym7pQ",
  "JA743A": "https://buddycom.net/b/14148/9bKEkCvdG9CABSQ5305fbHfiRcjIebznmMlND2axRZmJvGl2DsiQRkr7NRSPu5yj1Sh2btuhlzznSLZ_H1Uq1w",
  "JA744A": "https://buddycom.net/b/14148/J0YBQNnTWIR41wSztofft.D2g5wk1Szx_Tw.f97jjn3zfnjPtouFWzb8V6E7zq1PP4LIPU7sjFkSJehUKYqZbg",
  "JA745A": "https://buddycom.net/b/14148/7eNAP12SMPmTR7D6KKxA8t3cQXwGJZcpAjG6kVia3kxkSUvM1m9h1g0flSo0NtHVtxl.kx4M4p9f9FpjpuRVfw",
  "JA751A": "https://buddycom.net/b/14148/EfQ3QPi3z9cR7A5ZcC8xbVgU_NTAEPbYdywOOnG6y84Gs4k1QAuDRAbT6.P.UGqQU7CDcyw6qdylecq9X9eycA",
  "JA752A": "https://buddycom.net/b/14148/K7rbPtOFMOmph.WIvg6LhImqT4pKEYfItERmE_sWpPy4_HldyIBJmjsz33s2F9dM4LdskXXyqwHuSd5RovGVDg",
  "JA755A": "https://buddycom.net/b/14148/MG6YO4fAol5bwh6xUQ4.FUbcuiyph4bRJ31B5LLrSosZAgHCms4O6Ee.Jyc4TYHYmYKiKUbqvr.MOtVXKxMJiw",
  "JA784A": "https://buddycom.net/b/14148/Fmv3dtEYg3JmHWteQ8HlYBlOIMFWl1X.1QLJyBrrpfNalzbqo7Ogt9H_aySGjJHqDznPd_2QsN7u9I5VIqGrMA",
  "JA785A": "https://buddycom.net/b/14148/npQkwpp.xOQGecu8YMqMu1daU2IzuFw7I0OkyMStw9BXNlNWtCDKtYLgzzZ3kTExAnbf8x_tU8KekUa81m1rXg",
  "JA787A": "https://buddycom.net/b/14148/r2.VNUBe4x1QAdDI0wW9mdfBEGWnS35_VKHiGyak2aC23yLFPN_ZZw_jrfarBrJGfNiuk0tkpsCgGxNeL0iqFQ",
  "JA788A": "https://buddycom.net/b/14148/OVMY.m8cnZD4dkpKJNyFSP4ExexmdFL70OpEi8kMG5C6lJn7N6llmhXOzBIFt4Lj1Bo149_Qweu5WEl4x8ikdw",
  "JA790A": "https://buddycom.net/b/14148/lvzSLQpHNUANw7QBpLbc75p1Rbpza44x1MIyWczBeD_QRXcj01QjYXmwmJvHDecCqMMy4qeXmuy9WEhCGXQJHw",
  "JA791A": "https://buddycom.net/b/14148/7HynS54RI.ELjFvMXuqomae.KExHQKMBPwvwCml9nK8ZHCfiW8RBwCTCLuAwcKtEDq5wlgZ5yhN6nnIZK.7Ltg",
  "JA792A": "https://buddycom.net/b/14148/9IjesUkvDp4s016RRJI5mwF8eAiQs9fv4.ilNamghiHeze28BFEWkNRco3t6zHdo7fJQV53igdIaEU_IXKAQ8A",
  "JA793A": "https://buddycom.net/b/14148/ZtmibBeDv1xPteYeoCi35aMnteeW5qh0W9dtwdmKmwSxx7mu2TuKkua2Ieou9GIzNC2sUgLChnjkPahNQFwqlA",
  "JA794A": "https://buddycom.net/b/14148/ewtDh7SkOLL9G7xdD20Y3SWjNLXNejsSuMPy0Kych_J7B.vGdFakCXPDHbcxlD4kT42hTTgl7Otqd41bqeGUpA",
  "JA795A": "https://buddycom.net/b/14148/0yKlIT89sPpDm0QYwlUjYBBe_0fmKngpDcL6cJeL4MeUHK4q2TKpoEG7i05TFV0WOwIR8RPMiz.VFnNpIx13Hw",
  "JA796A": "https://buddycom.net/b/14148/zv_S.efPWL7WnGoTJYcTOewGAP8Do1YeCG1DxKFPy9.0Z.hjICpHqlPagfjD.XrEQTU2ebZ.uYrv1lI25OMpeA",
  "JA797A": "https://buddycom.net/b/14148/dvuAyImD5yMrEKOAdGemd36odtrbefysgLkqzcT0RXQipNYH2.fLGS0gOGfruhVQX9IYQ8Ygw3.4MdmbrOkeiQ",
  "JA798A": "https://buddycom.net/b/14148/ed0aNtfqyvW0uqILaiqPC7IAjPtD7_U3CqDAR8KBJ3XA_6hUDCKtzK_IO.Imyqsug0SYr.L9vm63kFkHxgMAWA"
};

// --- [3-4] PERFORMANCE & WEIGHT DATA ---
const aircraftPerformanceData = { "777-200": { mtow: 656000, mlw: 470000 }, "777-300": { mtow: 660000, mlw: 524000 }, "777-300ER": { mtow: 775000, mlw: 554000 }, "777F": { mtow: 766800, mlw: 575000 } };
const defaultCruiseWeights = { "777-200": 400000, "777-300": 500000, "777-300ER": 760000, "777F": 760000 };
const defaultLandingWeights = { "777-200": 400000, "777-300": 500000, "777-300ER": 500000, "777F": 550000 };
const modelKeyMap = { "777-200": "772", "777-300": "773", "777-300ER": "77W", "777F": "77F" };
const AIRCRAFT_DIMENSIONS = { "772": { span: "60.9m (199' 11\")", length: "63.7m (209' 1\")", height: "18.6m (60' 9\")" }, "773": { span: "60.9m (199' 11\")", length: "73.9m (242' 4\")", height: "18.7m (61' 5\")" }, "77W": { span: "64.8m (212' 7\")", length: "73.9m (242' 4\")", height: "18.7m (61' 5\")" }, "77F": { span: "64.8m (212' 7\")", length: "63.7m (209' 1\")", height: "18.6m (61' 1\")" } };
const SEAT_DATA = { "772": [{ total: 405, classes: "C:21 Y:384" }], "773": [{ total: 514, classes: "C:21 Y:493" }], "77W": [{ total: 212, classes: "F:8 C:68 PY:24 Y:112" }], "77F": [{ total: 0, classes: "Freighter" }] };

// --- [3-5] CRUISE PERF DATA ---
const CRUISE_PERF_DATA = {
  "772": [
    [320, 43100, 43100, 43100, 43100, 43100, 43100],
    [340, 43100, 43100, 43100, 43100, 43100, 43100],
    [360, 42300, 43100, 43100, 43100, 43000, 42100],
    [380, 41400, 43100, 43100, 42900, 42200, 41000],
    [400, 40500, 43100, 42300, 42100, 41300, 40000],
    [420, 39600, 43100, 41400, 41200, 40500, 39000],
    [440, 38700, 42900, 40500, 40400, 39600, 38000],
    [460, 37900, 42100, 39600, 39600, 38800, 37100],
    [480, 37100, 41300, 38800, 38700, 37900, 36300],
    [500, 36100, 40500, 37900, 37900, 37100, 35500],
    [520, 35200, 39600, 37100, 37000, 36200, 34800],
    [540, 34300, 38800, 36100, 36200, 35400, 34000],
    [560, 33600, 38000, 35200, 35400, 34500, 33500]
  ],
  "773": [
    [340, 43100, 43100, 43100, 43100, 43100, 43100],
    [360, 42300, 43100, 43100, 43100, 43100, 43100],
    [380, 41200, 43100, 43100, 43100, 42900, 42200],
    [400, 40100, 43100, 42200, 42600, 42100, 41400],
    [420, 39000, 43100, 41400, 41800, 41300, 40600],
    [440, 38000, 43100, 40600, 41100, 40500, 39700],
    [460, 37200, 42500, 39800, 40300, 39700, 38900],
    [480, 36400, 41700, 39000, 39500, 39000, 38100],
    [500, 35700, 40900, 38200, 38800, 38200, 37400],
    [520, 35000, 40200, 37400, 38000, 37400, 36400],
    [540, 34200, 39400, 36600, 37200, 36600, 35600]
  ],
  "77W": [
    [380, 42500, 43100, 42800, 43100, 43000, 40400],
    [400, 41800, 43100, 41900, 43100, 42400, 39700],
    [420, 40700, 42700, 41700, 42600, 41300, 39000],
    [440, 39600, 42200, 41100, 42000, 40700, 38300],
    [460, 38800, 41700, 40400, 41400, 40100, 37600],
    [480, 38000, 41100, 39700, 40800, 39400, 36900],
    [500, 37400, 40600, 39100, 40200, 38800, 36200],
    [520, 36800, 40100, 38400, 39600, 38200, 35500],
    [540, 36200, 39500, 37700, 39000, 37600, 34800],
    [560, 35600, 39000, 37100, 38400, 37000, 34100],
    [580, 34800, 38500, 36400, 37800, 36400, 33400],
    [600, 34200, 37900, 35700, 37200, 35800, 32700],
    [620, 33500, 37400, 35100, 36600, 35200, 32000],
    [640, 32800, 36900, 34400, 36000, 34500, 31300],
    [660, 32100, 36300, 33700, 35400, 33900, 30600],
    [680, 31500, 35800, 33100, 34800, 33300, 29900],
    [700, 30800, 35300, 32400, 34200, 32700, 29200],
    [720, 30200, 34700, 31700, 33600, 32100, 28500],
    [740, 29800, 34200, 31100, 33000, 31500, 27800],
    [760, 29200, 33700, 30400, 32400, 30900, 27100],
    [780, 28000, 33100, 28800, 31800, 30200, 26400]
  ],
  "77F": [
    [380, 43100, 43100, 43100, 43100, 43100, 40800],
    [400, 41700, 43100, 42500, 43100, 43100, 39700],
    [420, 40600, 43100, 41600, 43100, 43100, 38800],
    [440, 39700, 43100, 40800, 43100, 43100, 37900],
    [460, 38700, 43100, 40000, 43100, 43100, 37100],
    [480, 37800, 43100, 39200, 43100, 42500, 36300],
    [500, 37000, 42800, 38500, 42300, 41700, 35600],
    [520, 36200, 42000, 37800, 41500, 40900, 34900],
    [540, 36000, 41300, 37200, 40800, 40200, 34200],
    [560, 35700, 40500, 36500, 40100, 39500, 33500],
    [580, 34900, 39800, 35900, 39400, 38800, 32900],
    [600, 34200, 39200, 35400, 38700, 38100, 32300],
    [620, 33500, 38500, 34800, 38000, 37400, 31800],
    [640, 32800, 37800, 34300, 37400, 36800, 31200],
    [660, 32100, 37200, 33700, 36700, 36100, 30700],
    [680, 31500, 36500, 33200, 36100, 35600, 30100],
    [700, 30800, 36000, 32700, 35600, 35000, 29600],
    [720, 30200, 35400, 32300, 35000, 34300, 29200],
    [740, 29600, 34800, 31800, 34300, 33600, 28700],
    [760, 29100, 34200, 31300, 33700, 32900, 28100],
    [780, 28500, 33600, 30700, 33100, 32300, 27600]
  ]
};

// --- [3-6] VREF DATA ---
const VREF_DATA = {
  "772": { vref30: [[280, 110], [300, 114], [320, 118], [340, 122], [360, 125], [380, 129], [400, 132], [420, 135], [440, 139], [460, 142], [480, 145], [500, 148], [520, 151], [540, 154]] },
  "773": { vref30: [[300, 114], [320, 118], [340, 122], [360, 125], [380, 129], [400, 132], [420, 135], [440, 139], [460, 142], [480, 145], [500, 148], [520, 151], [540, 154], [560, 157], [580, 160], [600, 163], [620, 165], [640, 168], [660, 171]] },
  "77W": { vref30: [[300, 113], [320, 117], [340, 120], [360, 124], [380, 127], [400, 131], [420, 134], [440, 137], [460, 140], [480, 143], [500, 146], [520, 149], [540, 152], [560, 155], [580, 157], [600, 160], [620, 163], [640, 165], [660, 168], [680, 170], [700, 173], [720, 175], [740, 178], [760, 180], [780, 182], [800, 184]] },
  "77F": { vref30: [[340, 137], [380, 137], [420, 137], [460, 137], [500, 140], [540, 145], [580, 151], [620, 158], [660, 164], [700, 172], [740, 178], [780, 184]] }
};

// --- [3-7] HOLD & MANEUVER SPD DATA ---
const HOLD_SPD_DATA_RAW = {
  "772": { weights: [320, 360, 400, 440, 480, 520, 560], alts: [1500, 5000, 10000, 15000, 20000], kias: [[195, 195, 195, 195, 195], [202, 202, 202, 202, 202], [209, 209, 209, 209, 211], [215, 215, 215, 215, 229], [221, 222, 222, 228, 248], [230, 231, 231, 244, 269], [239, 239, 240, 260, 280]] },
  "773": { weights: [340, 380, 420, 460, 500, 540, 580, 620, 660], alts: [1500, 5000, 10000, 15000, 20000], kias: [[199, 199, 199, 199, 199], [206, 206, 206, 206, 206], [213, 213, 213, 213, 220], [220, 220, 220, 220, 238], [226, 226, 227, 228, 259], [234, 235, 236, 237, 275], [243, 244, 245, 248, 285], [251, 252, 253, 262, 296], [259, 260, 261, 277, 306]] },
  "77W": { weights: [360, 400, 440, 480, 520, 560, 600, 640, 680, 720, 760, 800], alts: [1500, 5000, 10000, 15000, 20000], kias: [[200, 200, 200, 200, 200], [207, 207, 207, 207, 207], [213, 213, 213, 213, 213], [220, 220, 220, 220, 224], [225, 225, 225, 225, 243], [231, 231, 231, 234, 263], [236, 237, 238, 239, 273], [245, 245, 246, 248, 282], [252, 253, 254, 256, 291], [259, 260, 261, 271, 300], [266, 268, 269, 285, 309], [273, 275, 276, 301, 318]] },
  "77F": { weights: [340, 380, 420, 460, 500, 540, 580, 620, 660, 700, 740, 780], alts: [1500, 5000, 10000, 15000, 20000], kias: [[217, 217, 217, 217, 217], [217, 217, 217, 217, 217], [217, 217, 217, 217, 217], [217, 217, 217, 217, 217], [220, 220, 220, 220, 220], [225, 225, 225, 225, 240], [231, 231, 231, 231, 264], [238, 238, 238, 238, 273], [244, 244, 244, 244, 282], [252, 252, 252, 252, 291], [258, 258, 258, 258, 300], [263, 263, 263, 264, 309]] }
};

const MANEUVER_1_3G_MACH_DATA = {
  "772": {
    weights: [300, 350, 400, 450, 500, 550, 600, 650],
    alts: [20000, 25000, 30000, 33000, 35000, 37000, 39000, 41000, 43000],
    mach: [
      [0.450, 0.480, 0.520, 0.550, 0.580, 0.610, 0.640, 0.680, 0.730],
      [0.460, 0.490, 0.530, 0.560, 0.600, 0.640, 0.680, 0.730, 0.780],
      [0.470, 0.500, 0.550, 0.590, 0.630, 0.670, 0.720, 0.770, 0.820],
      [0.480, 0.520, 0.570, 0.620, 0.660, 0.710, 0.760, 0.810, 0.860],
      [0.500, 0.540, 0.600, 0.650, 0.690, 0.740, 0.800, 0.850, 0.880],
      [0.520, 0.560, 0.630, 0.680, 0.730, 0.780, 0.830, 0.870, 0.890],
      [0.540, 0.590, 0.660, 0.720, 0.770, 0.820, 0.860, 0.890, 0.890],
      [0.560, 0.620, 0.690, 0.750, 0.800, 0.850, 0.880, 0.890, 0.890]
    ]
  },
  "773": {
    weights: [400, 500, 600],
    alts: [20000, 25000, 30000, 33000, 35000, 37000, 39000, 41000, 43000],
    mach: [
      [0.450, 0.480, 0.520, 0.550, 0.580, 0.610, 0.650, 0.700, 0.760],
      [0.480, 0.520, 0.570, 0.600, 0.630, 0.670, 0.720, 0.780, 0.850],
      [0.530, 0.580, 0.640, 0.690, 0.730, 0.790, 0.840, 0.890, 0.890]
    ]
  },
  "77W": {
    weights: [400, 500, 600, 700, 800],
    alts: [20000, 25000, 30000, 33000, 35000, 37000, 39000, 41000, 43000],
    mach: [
      [0.450, 0.480, 0.510, 0.540, 0.570, 0.600, 0.630, 0.680, 0.740],
      [0.470, 0.500, 0.540, 0.570, 0.600, 0.640, 0.680, 0.740, 0.810],
      [0.490, 0.530, 0.580, 0.610, 0.640, 0.680, 0.740, 0.810, 0.870],
      [0.530, 0.570, 0.620, 0.660, 0.700, 0.750, 0.810, 0.870, 0.890],
      [0.570, 0.620, 0.680, 0.730, 0.780, 0.840, 0.890, 0.890, 0.890]
    ]
  },
  "77F": {
    weights: [400, 500, 600, 700, 800],
    alts: [20000, 25000, 30000, 33000, 35000, 37000, 39000, 41000, 43000],
    mach: [
      [0.450, 0.480, 0.510, 0.540, 0.570, 0.600, 0.630, 0.680, 0.740],
      [0.470, 0.500, 0.540, 0.570, 0.600, 0.640, 0.680, 0.740, 0.810],
      [0.490, 0.530, 0.580, 0.610, 0.640, 0.680, 0.740, 0.810, 0.870],
      [0.530, 0.570, 0.620, 0.660, 0.700, 0.750, 0.810, 0.870, 0.890],
      [0.570, 0.620, 0.680, 0.730, 0.780, 0.840, 0.890, 0.890, 0.890]
    ]
  }
};

// --- [3-8] APPROACH & LANDING DATA ---
const TARGET_PITCH_N1_DATA_RAW = {
  "772": { f25: [[320, 2.3, 44.5], [360, 2.4, 46.7], [400, 2.5, 48.8], [440, 2.5, 50.8], [480, 2.6, 52.8], [520, 2.6, 54.7]], f30: [[320, 2.2, 48.1], [360, 2.2, 50.8], [400, 2.1, 53.4], [440, 2.1, 55.9], [480, 2.0, 58.3], [520, 2.0, 60.6]] },
  "773": { f25: [[360, 2.2, 47.0], [400, 2.2, 49.3], [440, 2.1, 51.6], [480, 2.1, 53.8], [520, 2.1, 55.9], [560, 2.0, 58.0]], f30: [[360, 1.8, 50.9], [400, 1.7, 53.5], [440, 1.6, 56.2], [480, 1.5, 58.8], [520, 1.5, 61.2], [560, 1.4, 63.5]] },
  "77W": { f25: [[400, 2.9, 46.4], [440, 2.8, 48.4], [480, 2.8, 50.4], [520, 2.8, 52.2], [560, 2.8, 53.9]], f30: [[400, 2.5, 50.1], [440, 2.5, 52.1], [480, 2.5, 54.2], [520, 2.4, 56.3], [560, 2.5, 58.1]] },
  "77F": { f25: [[300, 0.5, 50.1], [340, 1.1, 45.8], [380, 1.8, 46.1], [420, 3.0, 47.8], [460, 3.3, 49.8], [500, 3.3, 51.7], [540, 3.5, 53.3], [580, 3.4, 55.0]], f30: [[300, -0.4, 55.0], [340, 0.7, 52.5], [380, 0.9, 52.4], [420, 1.6, 52.7], [460, 2.9, 54.1], [500, 3.3, 56.0], [540, 3.4, 58.0], [580, 3.3, 59.9]] }
};

const LANDING_DIST_DATA_RAW = {
  "772": {
    f25_dry: { dist: [[360,5100,5100,6200,7200,7600,7900],[380,5300,5300,6400,7500,7900,8300],[400,5500,5500,6600,7700,8300,8700],[420,5600,5600,6900,8000,8600,9100],[440,5800,5800,7100,8300,9000,9400],[460,5900,5900,7300,8600,9300,9800],[480,6100,6100,7500,8900,9600,10200],[500,6300,6300,7800,9200,10000,10600],[520,6400,6400,8000,9500,10300,10900],[540,6600,6600,8200,9800,10600,11300]], adj: { threshold: 460, light: { tw: 820, nr: [0, 0, 0, 100, 470, 1060], or: [0, 0, 0, 100, 470, 810], app: 360, alt: 400, slp: 230 }, heavy: { tw: 980, nr: [0, 0, 0, 50, 420, 1080], or: [0, 0, 0, 50, 420, 820], app: 470, alt: 550, slp: 290 } } },
    f25_wet: { dist: [[360,5400,5400,6200,7200,7600,7900],[380,5600,5600,6400,7500,7900,8300],[400,5800,5800,6700,7700,8300,8700],[420,6000,6000,6900,8000,8600,9100],[440,6200,6200,7100,8300,9000,9400],[460,6300,6300,7300,8600,9300,9800],[480,6500,6500,7600,8900,9600,10200],[500,6700,6700,7800,9200,10000,10600],[520,6900,6900,8000,9500,10300,10900],[540,7100,7100,8200,9800,10600,11300]], adj: { threshold: 460, light: { tw: 820, nr: [770, 770, 110, 100, 470, 1060], or: [310, 310, 30, 100, 470, 810], app: 360, alt: 400, slp: 230 }, heavy: { tw: 980, nr: [930, 930, 120, 50, 420, 1080], or: [410, 410, 30, 50, 420, 820], app: 470, alt: 550, slp: 290 } } },
    f30_dry: { dist: [[360,4900,4900,5900,6800,7300,7700],[380,5000,5000,6000,7000,7500,7900],[400,5200,5200,6200,7300,7900,8300],[420,5300,5300,6400,7500,8200,8600],[440,5500,5500,6600,7800,8500,9000],[460,5600,5600,6800,8100,8800,9300],[480,5800,5800,7000,8300,9100,9600],[500,5900,5900,7200,8600,9400,10000],[520,6100,6100,7400,8800,9700,10300],[540,6200,6200,7600,9100,10000,10700]], adj: { threshold: 460, light: { tw: 790, nr: [0, 0, 0, 40, 330, 640], or: [0, 0, 0, 40, 330, 810], app: 360, alt: 360, slp: 200 }, heavy: { tw: 940, nr: [0, 0, 0, 10, 250, 770], or: [0, 0, 0, 10, 250, 620], app: 470, alt: 520, slp: 250 } } },
    f30_wet: { dist: [[360,5200,5200,5900,6800,7300,7700],[380,5300,5300,6000,7000,7500,7900],[400,5500,5500,6200,7300,7900,8300],[420,5700,5700,6400,7500,8200,8600],[440,5900,5900,6600,7800,8500,9000],[460,6000,6000,6900,8100,8800,9300],[480,6200,6200,7100,8300,9100,9600],[500,6400,6400,7300,8600,9400,10000],[520,6500,6500,7500,8800,9700,10300],[540,6700,6700,7700,9100,10000,10700]], adj: { threshold: 460, light: { tw: 790, nr: [690,690,100,40,330,810], or: [300,300,30,40,330,640], app: 360, alt: 360, slp: 200 }, heavy: { tw: 940, nr: [800, 800, 120, 10, 250, 770], or: [360,360,30,10,250,620], app: 470, alt: 520, slp: 250 } } },
    inop_f20_dry: { dist: [[360,5400,5400,6500,7700,8600,9400],[380,5500,5500,6700,8000,8900,9700],[400,5700,5700,7000,8300,9200,10100],[420,5900,5900,7200,8500,9600,10500],[440,6000,6000,7400,8800,9900,10800],[460,6200,6200,7600,9100,10200,11200],[480,6300,6300,7800,9300,10500,11600],[500,6500,6500,8000,9600,10800,11900],[520,6700,6700,8300,9800,11100,12300],[540,6800,6800,8500,10100,11400,12700]], adj: { threshold: 460, light: { tw: 830, nr: [0, 0, 0, 0, 0, 100], or: [0, 0, 0, 0, 0, 0], app: 460, alt: 350, slp: 70 }, heavy: { tw: 830, nr: [0, 0, 0, 0, 0, 100], or: [0, 0, 0, 0, 0, 0], app: 460, alt: 350, slp: 70 } } },
    inop_f20_wet: { dist: [[360,5900,5900,6500,7700,8600,9400],[380,6100,6100,6800,8000,8900,9700],[400,6300,6300,7000,8300,9200,10100],[420,6500,6500,7200,8500,9600,10500],[440,6700,6700,7500,8800,9900,10800],[460,6900,6900,7700,9100,10200,11200],[480,7000,7000,7900,9300,10500,11600],[500,7200,7200,8100,9600,10800,11900],[520,7400,7400,8300,9800,11100,12300],[540,7600,7600,8500,10100,11400,12700]], adj: { threshold: 460, light: { tw: 830, nr: [430, 430, 70, 0, 0, 100], or: [0, 0, 0, 0, 0, 0], app: 460, alt: 350, slp: 130 }, heavy: { tw: 830, nr: [430, 430, 70, 0, 0, 100], or: [0, 0, 0, 0, 0, 0], app: 460, alt: 350, slp: 130 } } },
    inop_f30_dry: { dist: [[360,5100,5100,6300,7300,8100,8800],[380,5200,5200,6200,7100,7900,8600],[400,5300,5300,6400,7500,8300,9000],[420,5400,5400,6500,7600,8500,9200],[440,5400,5400,6600,7800,8700,9500],[460,5600,5600,6800,8000,8900,9800],[480,5700,5700,7000,8200,9200,10100],[500,5900,5900,7200,8500,9400,10400],[520,6000,6000,7300,8700,9700,10700],[540,6100,6100,7500,8900,9900,11000]], adj: { threshold: 460, light: { tw: 770, nr: [0, 0, 0, 0, 0, 90], or: [0, 0, 0, 0, 0, 0], app: 420, alt: 290, slp: 60 }, heavy: { tw: 770, nr: [0, 0, 0, 0, 0, 90], or: [0, 0, 0, 0, 0, 0], app: 420, alt: 290, slp: 60 } } },
    inop_f30_wet: { dist: [[360,5700,5700,6300,7300,8100,8800],[380,5600,5600,6200,7100,7900,8600],[400,5900,5900,6400,7500,8300,9000],[420,6000,6000,6500,7600,8500,9200],[440,6100,6100,6600,7800,8700,9500],[460,6200,6200,6800,8000,8900,9800],[480,6400,6400,7000,8200,9200,10100],[500,6600,6600,7200,8500,9400,10400],[520,6700,6700,7400,8700,9700,10700],[540,6900,6900,7600,8900,9900,11000]], adj: { threshold: 460, light: { tw: 770, nr: [320, 320, 60, 0, 0, 90], or: [0, 0, 0, 0, 0, 0], app: 420, alt: 290, slp: 120 }, heavy: { tw: 770, nr: [320, 320, 60, 0, 0, 90], or: [0, 0, 0, 0, 0, 0], app: 420, alt: 290, slp: 120 } } }
  },
  "773": {
    f25_dry: { dist: [[420,5600,5600,6900,8100,8600,9100],[440,5800,5800,7100,8300,9000,9500],[460,6000,6000,7300,8600,9300,9800],[480,6100,6100,7600,8900,9700,10200],[500,6300,6300,7800,9200,10000,10600],[520,6500,6500,8000,9500,10300,11000],[550,6700,6700,8300,9900,10800,11500]], adj: { threshold: 999, light: { tw: 890, nr: [0, 0, 0, 80, 450, 1100], or: [0, 0, 0, 80, 450, 830], app: 400, alt: 470, slp: 260 }, heavy: { tw: 890, nr: [0, 0, 0, 80, 450, 1100], or: [0, 0, 0, 80, 450, 830], app: 400, alt: 470, slp: 260 } } },
    f25_wet: { dist: [[420,6000,6000,6900,8100,8600,9100],[440,6200,6200,7100,8300,9000,9500],[460,6400,6400,7400,8600,9300,9800],[480,6600,6600,7600,8900,9700,10200],[500,6700,6700,7800,9200,10000,10600],[520,6900,6900,8000,9500,10300,11000],[550,7200,7200,8400,9900,10800,11500]], adj: { threshold: 999, light: { tw: 890, nr: [850, 850, 110, 80, 450, 1100], or: [360, 360, 30, 80, 450, 830], app: 400, alt: 470, slp: 260 }, heavy: { tw: 890, nr: [850, 850, 110, 80, 450, 1100], or: [360, 360, 30, 80, 450, 830], app: 400, alt: 470, slp: 260 } } },
    f30_dry: { dist: [[420,5400,5400,6500,7600,8200,8700],[440,5500,5500,6700,7900,8600,9100],[460,5700,5700,6900,8200,8900,9400],[480,5800,5800,7100,8400,9200,9800],[500,6000,6000,7300,8700,9500,10100],[520,6100,6100,7600,9000,9800,10400],[550,6300,6300,7800,9300,10300,11000]], adj: { threshold: 999, light: { tw: 870, nr: [0, 0, 0, 20, 300, 640], or: [0, 0, 0, 20, 300, 830], app: 410, alt: 430, slp: 230 }, heavy: { tw: 870, nr: [0, 0, 0, 20, 300, 640], or: [0, 0, 0, 20, 300, 830], app: 410, alt: 430, slp: 230 } } },
    f30_wet: { dist: [[420,5700,5700,6500,7600,8200,8700],[440,5900,5900,6700,7900,8600,9100],[460,6100,6100,6900,8200,8900,9400],[480,6300,6300,7200,8400,9200,9800],[500,6500,6500,7400,8700,9500,10100],[520,6600,6600,7600,9000,9800,10400],[550,6900,6900,7900,9300,10300,11000]], adj: { threshold: 999, light: { tw: 870, nr: [340, 340, 30, 20, 300, 640], or: [760, 760, 110, 20, 300, 830], app: 410, alt: 430, slp: 230 }, heavy: { tw: 870, nr: [340, 340, 30, 20, 300, 640], or: [760, 760, 110, 20, 300, 830], app: 410, alt: 430, slp: 230 } } },
    inop_f20_dry: { dist: [[420,6100,6100,7500,8900,9900,10800],[440,6200,6200,7700,9100,10300,11200],[460,6400,6400,7900,9400,10600,11600],[480,6500,6500,8200,9700,10900,12000],[500,6700,6700,8400,10000,11300,12400],[520,6900,6900,8600,10300,11600,12800],[550,7100,7100,8900,10700,12100,13300]], adj: { threshold: 999, light: { tw: 910, nr: [0, 0, 0, 0, 0, 140], or: [0, 0, 0, 0, 0, 0], app: 510, alt: 420, slp: 100 }, heavy: { tw: 910, nr: [0, 0, 0, 0, 0, 140], or: [0, 0, 0, 0, 0, 0], app: 510, alt: 420, slp: 100 } } },
    inop_f20_wet: { dist: [[420,6700,6700,7500,8900,9900,10800],[440,6900,6900,7700,9100,10300,11200],[460,7100,7100,8000,9400,10600,11600],[480,7300,7300,8200,9700,10900,12000],[500,7500,7500,8400,10000,11300,12400],[520,7700,7700,8600,10300,11600,12800],[550,8000,8000,9000,10700,12100,13300]], adj: { threshold: 999, light: { tw: 910, nr: [490, 490, 80, 0, 0, 140], or: [0, 0, 0, 0, 0, 0], app: 510, alt: 420, slp: 160 }, heavy: { tw: 910, nr: [490, 490, 80, 0, 0, 140], or: [0, 0, 0, 0, 0, 0], app: 510, alt: 420, slp: 160 } } },
    inop_f30_dry: { dist: [[420,5400,5400,6600,7700,8600,9400],[440,5600,5600,6800,8000,8900,9700],[460,5700,5700,6900,8200,9200,10000],[480,5800,5800,7100,8400,9500,10300],[500,6000,6000,7300,8700,9700,10700],[520,6100,6100,7500,8900,10000,11000],[550,6400,6400,7800,9300,10400,11500]], adj: { threshold: 999, light: { tw: 840, nr: [0, 0, 0, 0, 0, 120], or: [0, 0, 0, 0, 0, 0], app: 460, alt: 350, slp: 80 }, heavy: { tw: 840, nr: [0, 0, 0, 0, 0, 120], or: [0, 0, 0, 0, 0, 0], app: 460, alt: 350, slp: 80 } } },
    inop_f30_wet: { dist: [[420,6000,6000,6600,7700,8600,9400],[440,6200,6200,6800,8000,8900,9700],[460,6400,6400,7000,8200,9200,10000],[480,6500,6500,7200,8400,9500,10300],[500,6700,6700,7400,8700,9700,10700],[520,6900,6900,7600,8900,10000,11000],[550,7100,7100,7900,9300,10400,11500]], adj: { threshold: 999, light: { tw: 840, nr: [350, 350, 70, 0, 0, 120], or: [0, 0, 0, 0, 0, 0], app: 460, alt: 350, slp: 140 }, heavy: { tw: 840, nr: [350, 350, 70, 0, 0, 120], or: [0, 0, 0, 0, 0, 0], app: 460, alt: 350, slp: 140 } } }
  },
  "77W": {
    f25_dry: {
      dist: [[460,5800,5800,7400,8600,9200,9800],[480,6000,6000,7600,8900,9500,10100],[500,6100,6100,7800,9100,9800,10500],[520,6300,6300,8100,9400,10200,10900],[540,6400,6400,8300,9700,10500,11300],[560,6600,6600,8500,10000,10800,11600],[600,6600,6600,8900,10000,11400,11600],[640,7200,7200,9400,11100,12100,13100],[680,7500,7500,9800,11600,12700,13900],[720,7800,7800,10200,12100,13300,14600],[760,8000,8000,10600,12600,14000,null],[800,8200,8200,10900,13000,14400,null]],
      adj: { threshold: 560, light: { tw: 930, nr: [0, 0, 0, 100, 620, 1870], or: [0, 0, 0, 100, 620, 1310], app: 410, alt: 490, slp: 350 }, heavy: { tw: 1110, nr: [0, 0, 0, 60, 560, 1950], or: [0, 0, 0, 60, 560, 1340], app: 510, alt: 620, slp: 460 } }
    },
    f25_wet: {
      dist: [[460,6100,6100,7400,8600,9200,9800],[480,6300,6300,7700,8900,9500,10100],[500,6400,6400,7900,9100,9800,10500],[520,6600,6600,8100,9400,10200,10900],[540,6800,6800,8300,9700,10500,11300],[560,7000,7000,8500,10000,10800,11600],[600,7300,7300,8500,10500,10800,12400],[640,7600,7600,9400,11100,12100,13100],[680,8000,8000,9800,11600,12700,13900],[720,8300,8300,10300,12100,13300,14600],[760,8700,8700,10700,12600,14000,null],[800,8900,8900,10900,13000,14400,null]],
      adj: { threshold: 560, light: { tw: 930, nr: [1060, 1060, 160, 100, 620, 1870], or: [440, 440, 30, 100, 620, 1310], app: 420, alt: 490, slp: 350 }, heavy: { tw: 1110, nr: [1220, 1220, 170, 60, 560, 1950], or: [540, 540, 40, 60, 560, 1340], app: 510, alt: 620, slp: 460 } }
    },
    f30_dry: {
      dist: [[460,5500,5500,6800,8000,9300,10200],[480,5700,5700,7100,8300,9600,10500],[500,5800,5800,7300,8500,9900,10900],[520,6000,6000,7500,8700,10200,11200],[540,6200,6200,7700,9000,10500,11600],[560,6200,6200,7900,9300,10100,10900],[600,6400,6400,8300,9800,10700,11600],[640,6700,6700,8700,10300,11300,12300],[680,7100,7100,9300,11000,12000,13100],[720,7500,7500,9900,11700,12700,14100],[760,7900,7900,10400,12400,13600,14900],[800,8100,8100,10700,12800,14100,null]],
      adj: { threshold: 560, light: { tw: 900, nr: [0, 0, 0, 50, 470, 1550], or: [0, 0, 0, 50, 470, 1120], app: 390, alt: 450, slp: 320 }, heavy: { tw: 1090, nr: [0, 0, 0, 20, 520, 1980], or: [0, 0, 0, 20, 520, 1260], app: 490, alt: 610, slp: 440 } }
    },
    f30_wet: {
      dist: [[460,6500,6500,7400,8300,9800,10600],[480,6700,6700,7600,8600,10100,10900],[500,6900,6900,7900,8800,10400,11300],[520,7100,7100,8100,9100,10700,11700],[540,7300,7300,8400,9400,11100,12100],[560,6600,6600,7900,9300,10100,10900],[600,6900,6900,8300,9800,10700,11600],[640,7200,7200,8700,10300,11300,12300],[680,7700,7700,9300,11000,12000,13100],[720,8200,8200,10000,11700,12800,14100],[760,8600,8600,10500,12400,13600,14900],[800,8800,8800,10800,12700,14100,null]],
      adj: { threshold: 560, light: { tw: 900, nr: [970, 970, 150, 50, 470, 1550], or: [420, 420, 30, 50, 470, 1120], app: 400, alt: 450, slp: 320 }, heavy: { tw: 1090, nr: [1180, 1180, 170, 20, 520, 1980], or: [530, 530, 40, 20, 520, 1260], app: 490, alt: 610, slp: 440 } }
    },
    inop_f20_dry: {
      dist: [[460,6400,6400,8200,9700,10900,12200],[480,6500,6500,8500,9900,11200,12600],[500,6700,6700,8700,10200,11500,13000],[520,6900,6900,8900,10500,11900,13400],[540,7000,7000,9100,10800,12200,13800],[560,7200,7200,9400,11100,12500,14200],[600,7500,7500,9800,11600,13200,15000],[640,7800,7800,10200,12100,13800,null],[680,8100,8100,10700,12700,14400,null],[720,8400,8400,11100,13200,15000,null],[760,8700,8700,11500,13700,null,null],[800,9000,9000,11900,14300,null,null]],
      adj: { threshold: 560, light: { tw: 1000, nr: [0, 0, 0, 0, 0, 580], or: [0, 0, 0, 0, 0, 0], app: 480, alt: 480, slp: 300 }, heavy: { tw: 1000, nr: [0, 0, 0, 0, 0, 580], or: [0, 0, 0, 0, 0, 0], app: 480, alt: 480, slp: 300 } }
    },
    inop_f20_wet: {
      dist: [[460,7000,7000,8200,9700,10900,12200],[480,7200,7200,8500,9900,11200,12600],[500,7400,7400,8700,10200,11500,13000],[520,7600,7600,8900,10500,11900,13400],[540,7800,7800,9200,10800,12200,13800],[560,7900,7900,9400,11100,12500,14200],[600,8300,8300,9800,11600,13200,15000],[640,8700,8700,10300,12100,13800,null],[680,9000,9000,10700,12700,14400,null],[720,9400,9400,11100,13200,15000,null],[760,9800,9800,11500,13700,null,null],[800,10100,10100,12000,14300,null,null]],
      adj: { threshold: 560, light: { tw: 1000, nr: [630, 630, 100, 0, 0, 580], or: [0, 0, 0, 0, 0, 0], app: 500, alt: 480, slp: 300 }, heavy: { tw: 1000, nr: [630, 630, 100, 0, 0, 580], or: [0, 0, 0, 0, 0, 0], app: 480, alt: 480, slp: 300 } }
    },
    inop_f30_dry: {
      dist: [[460,5500,5500,7000,8100,9100,10100],[480,5600,5600,7100,8300,9300,10500],[500,5800,5800,7300,8500,9600,10800],[520,5900,5900,7500,8800,9900,11100],[540,6000,6000,7700,9000,10100,11400],[560,6200,6200,7900,9200,10400,11800],[600,6500,6500,8400,9800,11100,12500],[640,6800,6800,8800,10400,11700,13300],[680,7100,7100,9300,10900,12300,14000],[720,7400,7400,9700,11500,13000,14800],[760,7800,7800,10200,12000,13600,null],[800,8100,8100,10600,12600,14300,null]],
      adj: { threshold: 560, light: { tw: 910, nr: [0, 0, 0, 0, 0, 280], or: [0, 0, 0, 0, 0, 0], app: 470, alt: 390, slp: 200 }, heavy: { tw: 910, nr: [0, 0, 0, 0, 0, 280], or: [0, 0, 0, 0, 0, 0], app: 470, alt: 390, slp: 200 } }
    },
    inop_f30_wet: {
      dist: [[460,6100,6100,7000,8100,9100,10100],[480,6200,6200,7200,8300,9300,10500],[500,6400,6400,7400,8500,9600,10800],[520,6600,6600,7600,8800,9900,11100],[540,6700,6700,7700,9000,10100,11400],[560,6900,6900,7900,9200,10400,11800],[600,7300,7300,8400,9800,11100,12500],[640,7600,7600,8900,10400,11700,13300],[680,8000,8000,9300,10900,12300,14000],[720,8400,8400,9800,11500,13000,14800],[760,8800,8800,10200,12000,13600,null],[800,9200,9200,10700,12600,14300,null]],
      adj: { threshold: 560, light: { tw: 910, nr: [450, 450, 90, 0, 0, 280], or: [0, 0, 0, 0, 0, 0], app: 470, alt: 390, slp: 200 }, heavy: { tw: 910, nr: [450, 450, 90, 0, 0, 280], or: [0, 0, 0, 0, 0, 0], app: 470, alt: 390, slp: 200 } }
    }
  },
  "77F": {
    f25_dry: {
      dist: [[440,5600,5600,7000,8200,8700,9300],[460,5700,5700,7300,8400,9100,9700],[480,5900,5900,7500,8700,9400,10000],[500,6000,6000,7700,9000,9700,10400],[520,6200,6200,7900,9300,10000,10800],[540,6300,6300,8100,9500,10400,11100],[580,6600,6600,8600,10100,11000,11900],[620,6900,6900,9000,10600,11600,12600],[660,7200,7200,9400,11200,12300,13400],[700,7500,7500,9800,11700,12900,14100],[740,7800,7800,10300,12200,13500,14800],[780,8000,8000,10600,12700,14100,null]],
      adj: { threshold: 540, light: { tw: 900, nr: [0,0,0,90,570,1750], or: [0,0,0,90,570,1270], app: 400, alt: 460, slp: 340 }, heavy: { tw: 1090, nr: [0,0,0,50,500,1820], or: [0,0,0,50,500,1300], app: 510, alt: 630, slp: 450 } }
    },
    f25_wet: {
      dist: [[440,5900,5900,7100,8200,8700,9300],[460,6000,6000,7300,8400,9100,9700],[480,6200,6200,7500,8700,9400,10000],[500,6400,6400,7700,9000,9700,10400],[520,6600,6600,8000,9300,10000,10800],[540,6700,6700,8200,9500,10400,11100],[580,7100,7100,8600,10100,11000,11900],[620,7400,7400,9000,10600,11600,12600],[660,7700,7700,9500,11200,12300,13400],[700,8100,8100,9900,11700,12900,14100],[740,8400,8400,10300,12200,13500,14800],[780,8700,8700,10700,12700,14100,null]],
      adj: { threshold: 540, light: { tw: 900, nr: [410,410,40,90,570,1270], or: [410,410,40,90,570,1270], app: 400, alt: 460, slp: 340 }, heavy: { tw: 1090, nr: [1180,1180,170,50,500,1820], or: [510,510,40,50,500,1300], app: 510, alt: 630, slp: 450 } }
    },
    f30_dry: {
      dist: [[440,5500,5500,6900,8000,8500,9000],[460,5500,5500,6900,8000,8600,9200],[480,5500,5500,6900,8100,8800,9400],[500,5600,5600,7100,8300,9100,9700],[520,5700,5700,7300,8600,9300,10000],[540,5900,5900,7500,8800,9600,10400],[580,6200,6200,7900,9300,10200,11100],[620,6600,6600,8500,10000,11000,11900],[660,6900,6900,9000,10600,11600,12700],[700,7400,7400,9600,11400,12500,13700],[740,7700,7700,10200,12000,13200,14500],[780,8100,8100,10700,12700,14000,null]],
      adj: { threshold: 540, light: { tw: 870, nr: [0,0,0,90,570,1650], or: [0,0,0,90,570,1140], app: 410, alt: 420, slp: 310 }, heavy: { tw: 1080, nr: [0,0,0,20,530,2020], or: [0,0,0,20,530,1280], app: 470, alt: 610, slp: 440 } }
    },
    f30_wet: {
      dist: [[440,5800,5800,7000,8000,8500,9000],[460,5800,5800,7000,8000,8600,9200],[480,5900,5900,7000,8100,8800,9400],[500,6000,6000,7200,8300,9100,9700],[520,6200,6200,7400,8600,9300,10000],[540,6300,6300,7500,8800,9600,10400],[580,6700,6700,8000,9300,10200,11100],[620,7100,7100,8500,10000,11000,11900],[660,7500,7500,9000,10600,11600,12700],[700,8000,8000,9700,11400,12500,13700],[740,8400,8400,10200,12000,13200,14500],[780,8800,8800,10800,12700,14000,null]],
      adj: { threshold: 540, light: { tw: 870, nr: [900,900,150,90,570,1650], or: [380,380,30,90,570,1140], app: 410, alt: 420, slp: 310 }, heavy: { tw: 1080, nr: [1170,1170,160,20,530,2020], or: [510,510,40,20,530,1280], app: 480, alt: 610, slp: 440 } }
    },
    inop_f20_dry: {
      dist: [[440,6100,6100,8000,9300,10500,11800],[460,6300,6300,8100,9600,10800,12200],[480,6400,6400,8300,9800,11000,12500],[500,6500,6500,8500,10000,11300,12800],[520,6700,6700,8700,10300,11600,13200],[540,6800,6800,8900,10500,11900,13500],[580,7100,7100,9300,11000,12400,14200],[620,7400,7400,9700,11500,13000,15000],[660,7700,7700,10100,12000,13600,null],[700,8100,8100,10500,12500,14200,null],[740,8400,8400,10900,13000,14800,null],[780,8700,8700,11300,13500,null,null]],
      adj: { threshold: 540, light: { tw: 1000, nr: [0,0,0,0,0,420], or: [0,0,0,0,0,0], app: 520, alt: 470, slp: 260 }, heavy: { tw: 1000, nr: [0,0,0,0,0,420], or: [0,0,0,0,0,0], app: 520, alt: 470, slp: 260 } }
    },
    inop_f20_wet: {
      dist: [[440,6800,6800,8000,9300,10500,11800],[460,6900,6900,8200,9600,10800,12200],[480,7100,7100,8400,9800,11000,12500],[500,7300,7300,8500,10000,11300,12800],[520,7400,7400,8700,10300,11600,13200],[540,7600,7600,8900,10500,11900,13500],[580,7900,7900,9300,11000,12400,14200],[620,8300,8300,9700,11500,13000,15000],[660,8700,8700,10100,12000,13600,null],[700,9000,9000,10500,12500,14200,null],[740,9400,9400,10900,13000,14800,null],[780,9800,9800,11400,13500,null,null]],
      adj: { threshold: 540, light: { tw: 1000, nr: [600,600,110,0,0,420], or: [0,0,0,0,0,0], app: 520, alt: 470, slp: 260 }, heavy: { tw: 1000, nr: [600,600,110,0,0,420], or: [0,0,0,0,0,0], app: 520, alt: 470, slp: 260 } }
    },
    inop_f30_dry: {
      dist: [[440,5900,5900,7500,8700,9500,10500],[460,5900,5900,7500,8700,9600,10700],[480,6000,6000,7600,8800,9800,10900],[500,6000,6000,7600,8900,9900,11100],[520,6000,6000,7700,8900,10000,11300],[540,6000,6000,7700,9000,10100,11400],[580,6200,6200,7900,9300,10500,11900],[620,6500,6500,8400,9900,11200,12700],[660,6900,6900,8900,10600,11900,13600],[700,7300,7300,9400,11200,12700,14400],[740,7600,7600,10000,11900,13400,null],[780,8000,8000,10500,12500,14100,null]],
      adj: { threshold: 540, light: { tw: 910, nr: [0,0,0,0,0,280], or: [0,0,0,0,0,0], app: 470, alt: 390, slp: 200 }, heavy: { tw: 910, nr: [0,0,0,0,0,280], or: [0,0,0,0,0,0], app: 470, alt: 390, slp: 200 } }
    },
    inop_f30_wet: {
      dist: [[440,6400,6400,7500,8700,9500,10500],[460,6500,6500,7600,8700,9600,10700],[480,6500,6500,7600,8800,9800,10900],[500,6600,6600,7700,8900,9900,11100],[520,6700,6700,7700,8900,10000,11300],[540,6700,6700,7800,9000,10100,11400],[580,6900,6900,8000,9300,10500,11900],[620,7400,7400,8500,9900,11200,12700],[660,7800,7800,9000,10600,11900,13600],[700,8200,8200,9500,11200,12700,14400],[740,8600,8600,10000,11900,13400,null],[780,9000,9000,10500,12500,14100,null]],
      adj: { threshold: 540, light: { tw: 910, nr: [450,450,90,0,0,280], or: [0,0,0,0,0,0], app: 470, alt: 390, slp: 200 }, heavy: { tw: 910, nr: [450,450,90,0,0,280], or: [0,0,0,0,0,0], app: 470, alt: 390, slp: 200 } }
    }
  }
};

// --- [3-9] WIND LIMITS ---
const B777_WIND_LIMITS = {
  capCols: [
    { val: '38', isCopHalf: false, labels: ['DRY', 'DRY', 'DRY', 'DRY'] },
    { val: '25', isCopHalf: false, labels: ['WET', 'WET', 'WET', 'WET'] },
    { val: '20', isCopHalf: false, labels: ['CC3', 'CC3', 'CC3', '-'] },
    { val: '15', isCopHalf: false, labels: ['CC2', 'CC2', 'CC2', 'CC3'] },
    { val: '10', isCopHalf: false, labels: ['CC1', 'CC1', 'CC1', 'CC2/1'] }
  ],
  copCols: [
    { val: '15', isCopHalf: true, labels: ['DRY', 'WET', '-', '-'] },
    { val: '10', isCopHalf: false, labels: ['-', '-', 'CC3', 'CC3'] }
  ]
};

// --- [3-10] DOCS: DG (DANGEROUS GOODS) DATA ---
const DG_DATA = [
  {
    class: "1", name: "火薬類\nExplosives",
    items: [
      { div: "1.3C\n1.3G", code: "RCX\nRGX", desc: "(※旅客機には搭載禁止)\n信号炎管、発煙筒", emergency: "漏出:危険でなければ漏出または他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
      { div: "1.4B\n1.4C\n1.4D\n1.4E\n1.4G", code: "RXB\nRXC\nRXD\nRXE\nRXG", desc: "(※旅客機には搭載禁止)\n爆竹、信管", emergency: "漏出:危険でなければ漏出または他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
      { div: "1.4S", code: "RXS", desc: "導火線、爆発リベット、弾丸、クラッカー等", emergency: "漏出:危険でなければ漏出または他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
    ]
  },
  {
    class: "2", name: "高圧ガス類\nGases",
    items: [
      { div: "2.1 引火性ガス", code: "RFG", desc: "ブタンガス、アセチレンガス\n喫煙用ライター、引火性エアゾール類", emergency: "漏出:危険でなければ漏出または他の貨物との接触を最小限に押えるよう容器の位置をかえる。バルブが完全に閉められているか、チェックする。" },
      { div: "2.2 非引火性・非毒性ガス", code: "RNG\nRCL", desc: "圧縮ガス、消火器、酸素(気体)など", emergency: "漏出:危険でなければ漏出または他の貨物との接触を最小限に押えるよう容器の位置をかえる。バルブが完全に閉められているか、チェックする。" },
      { div: "2.3 毒性ガス", code: "RPG", desc: "(※旅客機には搭載禁止)\n六フッ化アセトンなど", emergency: "内容物の漏出、または容器に重大な破損があった場合、破損した梱包には触れず、近づかないようにする。\n漏出:危険でなければ漏出また他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
    ]
  },
  {
    class: "3", name: "引火性液体\nFlammable Liquids",
    items: [
      { div: "3 引火性液体", code: "RFL", desc: "アルコール、ガソリン、ペイント、ラッカー、接着剤、ライター用オイル、医薬品など", emergency: "漏出:危険でなければ漏出また他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
    ]
  },
  {
    class: "4", name: "可燃性物質類\nFlammable solids",
    items: [
      { div: "4.1 可燃性固体", code: "RFS", desc: "樹脂酸マンガン、安全マッチ、ナフタリンなど", emergency: "漏出:危険でなければ漏出また他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
      { div: "4.2 自然発火性物質", code: "RSC", desc: "金属チタニウム粉末(乾性)\n硫化ナトリウム(乾性)\n活性炭など", emergency: "漏出:危険でなければ漏出また他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
      { div: "4.3 水と接触で引火性ガス", code: "RFW", desc: "金属バリウム、ホウ水素化カリウム\nナトリウムメチレート(乾性)\nカルシウムカーバイト", emergency: "漏出:危険でなければ漏出また他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
    ]
  },
  {
    class: "5", name: "酸化性物質\nOxidizing Substances",
    items: [
      { div: "5.1 酸化性物質", code: "ROX", desc: "次亜塩素酸カルシウム、過マンガン酸ナトリウムなど", emergency: "漏出:危険でなければ漏出または他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
      { div: "5.2 有機過酸化物", code: "ROP", desc: "メチルエチルケトンパーオキサイド\n(樹脂またはシール剤の触媒用)", emergency: "漏出:危険でなければ漏出または他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
    ]
  },
  {
    class: "6", name: "毒物類\nToxic Substances",
    items: [
      { div: "6.1 毒物", code: "RPB", desc: "金属砒素、石炭酸、シアン化物、ジニトロアニリン、塩化第2水銀、ニコチン、フッ化ナトリウムなど", emergency: "漏出:危険でなければ漏出または他の貨物との接触を最小限に押えるよう容器の位置をかえる。" },
      { div: "6.2 病毒を移しやすい物質", code: "RIS", desc: "肝炎や小児マヒウイルスなど", emergency: "内容物の漏出または容器に重大な破損があった場合、\n①破損した梱包には触れず、専門家による処理が可能となるまで近づかないようにする。\n②着陸空港の空港当局、会社の運航および貨物部門を通して保健所等に異常を通知する。" },
    ]
  },
  {
    class: "7", name: "放射性物質\nRadioactive Materials",
    items: [
      { div: "適用除外輸送物\n(L型輸送物)", code: "RRE", desc: "", emergency: "" },
      { div: "第1類 白標識", code: "RRW", desc: "輸送物表面の放射線レベルは殆ど無く、搭乗者等との隔離の必要なし。(輸送指数=0単位)", emergency: "内容物の漏出、または容器に重大な破損があった場合、\n①破損した梱包には触れず、専門家による処理が可能となるまで近づかないようにする。\n②破損等の発生した放射性輸送物の近くにいた者を確認し、速やかに汚染検査等を受けるよう指示する。\n③破損した梱包に手を触れた場合には必ず手を中性洗剤または水で洗浄する。" },
      { div: "第2類 黄標識", code: "RRY", desc: "輸送物表面の放射線レベルはわずかであるが、搭乗者等との間に要隔離。(輸送指数≦1.0単位)", emergency: "内容物の漏出、または容器に重大な破損があった場合、\n①破損した梱包には触れず、専門家による処理が可能となるまで近づかないようにする。\n②破損等の発生した放射性輸送物の近くにいた者を確認し、速やかに汚染検査等を受けるよう指示する。\n③破損した梱包に手を触れた場合には必ず手を中性洗剤または水で洗浄する。" },
      { div: "第3類 黄標識", code: "RRY", desc: "輸送物表面の放射線レベルは中程度で、搭乗者等との間に要隔離。(輸送指数≦10単位)", emergency: "内容物の漏出、または容器に重大な破損があった場合、\n①破損した梱包には触れず、専門家による処理が可能となるまで近づかないようにする。\n②破損等の発生した放射性輸送物の近くにいた者を確認し、速やかに汚染検査等を受けるよう指示する。\n③破損した梱包に手を触れた場合には必ず手を中性洗剤または水で洗浄する。" },
    ]
  },
  {
    class: "8", name: "腐食性物質\nCorrosives",
    items: [
      { div: "8 腐食性物質", code: "RCM", desc: "塩酸、水酸化ナトリウムなど", emergency: "漏出:腐食性液体の漏出は、急激な変化を生じるものではなく、地上でのクリーニングや中和を完全に行うことで対処する。皮膚との接触は避ける。" },
    ]
  },
  {
    class: "9", name: "環境有害物質等\nMiscellaneous",
    items: [
      { div: "-", code: "RMD", desc: "", emergency: "漏出:漏出または他の貨物との接触を最低限に押えるよう容器の位置をかえる。" },
      { div: "ドライアイス", code: "ICE", desc: "", emergency: "漏出:漏出または他の貨物との接触を最低限に押えるよう容器の位置をかえる。" },
      { div: "発泡ポリメリックビーズ等", code: "RSB", desc: "発泡ポリメリックビーズおよびプラスチック形成用コンパウンド", emergency: "漏出:漏出または他の貨物との接触を最低限に押えるよう容器の位置をかえる。" },
      { div: "リチウムイオンバッテリー", code: "ELI\nRLI\nRBI", desc: "", emergency: "漏出:漏出または他の貨物との接触を最低限に押えるよう容器の位置をかえる。" },
      { div: "リチウム金属バッテリー", code: "ELM\nRLM\nRBM", desc: "", emergency: "漏出:漏出または他の貨物との接触を最低限に押えるよう容器の位置をかえる。" },
      { div: "磁性物質", code: "MAG", desc: "磁電管、磁石など距離をとらなければ航空機のコンパスシステムに影響を及ぼすおそれがあるもの", emergency: "" },
    ]
  },
  {
    class: "10", name: "凶器\nSecurity items",
    items: [
      { div: "凶器", code: "GUN\nSWD", desc: "IATAの規定上保安制限品であり、国際線では危険物の分類に該当しない。", emergency: "" },
    ]
  }
];

const ISOLATION_COLS_FINAL = [
  "[RCX/RGX/RXB~G]",
  "[RXS]",
  "[RFG]",
  "[RNG/RCL/RPG]",
  "[RFL]",
  "[RFS]",
  "[RSC]",
  "[RFW]",
  "[ROX]",
  "[ROP]",
  "[RCM]",
  "[ELI/RLI等]"
];

const ISOLATION_MATRIX_FINAL = [
  { label: "火薬類(隔離区分がSのものを除く)", code: "[RCX/RGX/RXB~G]", data: ["注", "注", "×", "×", "×", "×", "×", "×", "×", "×", "×", "×"] },
  { label: "火薬類(隔離区分がSのものに限る)", code: "[RXS]", data: ["注", "", "", "", "", "", "", "", "", "", "", ""] },
  { label: "引火性ガス", code: "[RFG]", data: ["×", "", "", "", "", "", "", "", "", "", "", "×"] },
  { label: "その他のガス・毒性ガス", code: "[RNG/RCL/RPG]", data: ["×", "", "", "", "", "", "", "", "", "", "", ""] },
  { label: "引火性液体", code: "[RFL]", data: ["×", "", "", "", "", "", "", "", "×", "", "", "×"] },
  { label: "可燃性物質", code: "[RFS]", data: ["×", "", "", "", "", "", "", "", "", "", "", "×"] },
  { label: "自然発火性物質", code: "[RSC]", data: ["×", "", "", "", "", "", "", "", "×", "", "", ""] },
  { label: "水反応可燃性物質", code: "[RFW]", data: ["×", "", "", "", "", "", "", "", "", "", "×", ""] },
  { label: "酸化性物質", code: "[ROX]", data: ["×", "", "", "", "×", "", "×", "", "", "", "", "×"] },
  { label: "有機過酸化物", code: "[ROP]", data: ["×", "", "", "", "", "", "", "", "", "", "", ""] },
  { label: "腐食性物質", code: "[RCM]", data: ["×", "", "", "", "", "", "", "×", "", "", "", ""] },
  { label: "その他の有害物件(リチウム電池またはナトリウムイオン電池)", code: "[ELI/RLI等]", data: ["×", "", "×", "", "×", "×", "", "", "×", "", "", ""] },
];

// --- [3-11] DOCS: ERG CODE DATA ---
const ERG_DRILLS_FINAL = [
  { no: "1", inherent: "爆発により構造的破壊を引き起こす恐れがある", acRisk: "火災および/または爆発", occRisk: "ドリルレターの指示通り", spill: "100%酸素を使用。禁煙。", fire: "利用可能なすべての消火剤。標準的な消火手順を使用。", add: "急減圧の可能性" },
  { no: "2", inherent: "非引火性ガス。火災時に圧力が危険を引き起こす恐れがある。", acRisk: "最小限", occRisk: "ドリルレターの指示通り", spill: "100%酸素を使用。\"A\"、\"I\"、または\"P\"のドリルレターの場合は最大の換気を確立し維持する。", fire: "利用可能なすべての消火剤。標準的な消火手順を使用。", add: "急減圧の可能性" },
  { no: "3", inherent: "引火性液体または固体", acRisk: "火災および/または爆発", occRisk: "煙、ガス、熱、およびドリルレターの指示通り", spill: "100%酸素を使用。最大の換気を確立し維持する。禁煙。電気系統を最小限に。", fire: "利用可能なすべての消火剤。\"W\"の場合は水を使用しない。", add: "急減圧の可能性" },
  { no: "4", inherent: "空気に触れると自然発火する恐れがある", acRisk: "火災および/または爆発", occRisk: "煙、ガス、熱、およびドリルレターの指示通り", spill: "100%酸素を使用。最大の換気を確立し維持する。", fire: "利用可能なすべての消火剤。\"W\"の場合は水を使用しない。", add: "急減圧の可能性。\"F\"または\"H\"の場合は電気系統を最小限に。" },
  { no: "5", inherent: "酸化性物質。他の物質を発火させる恐れがあり、火災の熱で爆発する恐れがある。", acRisk: "火災および/または爆発、腐食による損傷の可能性", occRisk: "目、鼻、喉への刺激。接触すると皮膚に損傷。", spill: "100%酸素を使用。最大の換気を確立し維持する。", fire: "利用可能なすべての消火剤。\"W\"の場合は水を使用しない。", add: "急減圧の可能性" },
  { no: "6", inherent: "毒性。吸入、摂取、または皮膚から吸収されると致命的になる恐れがある。", acRisk: "有毒な液体または固体による汚染", occRisk: "急性毒性。影響が遅れて現れる可能性あり。", spill: "100%酸素を使用。最大の換気を確立し維持する。手袋なしで触らない。", fire: "利用可能なすべての消火剤。\"W\"の場合は水を使用しない。", add: "急減圧の可能性。\"F\"または\"H\"の場合は電気系統を最小限に。" },
  { no: "7", inherent: "破損した、または遮蔽されていないパッケージからの放射線", acRisk: "漏出した放射性物質による汚染", occRisk: "放射線被ばく、および人員の汚染", spill: "パッケージを動かさない。接触を避ける。", fire: "利用可能なすべての消火剤。", add: "到着地に有資格者の手配を要請する。" },
  { no: "8", inherent: "腐食性。吸入したり皮膚に触れたりするとガスにより行動不能になる恐れがある。", acRisk: "腐食による損傷の可能性", occRisk: "目、鼻、喉への刺激。接触すると皮膚に損傷。", spill: "100%酸素を使用。最大の換気を確立し維持する。手袋なしで触らない。", fire: "利用可能なすべての消火剤。\"W\"の場合は水を使用しない。", add: "急減圧の可能性。\"F\"または\"H\"の場合は電気系統を最小限に。" },
  { no: "9", inherent: "固有の危険性なし", acRisk: "ドリルレターの指示通り", occRisk: "ドリルレターの指示通り", spill: "100%酸素を使用。\"A\"の場合は最大の換気を確立し維持する。", fire: "利用可能なすべての消火剤。", add: "なし" },
  { no: "10", inherent: "引火性ガス。発火源がある場合、高い火災リスク。", acRisk: "火災および/または爆発", occRisk: "煙、ガス、熱、およびドリルレターの指示通り", spill: "100%酸素を使用。最大の換気を確立し維持する。禁煙。電気系統を最小限に。", fire: "利用可能なすべての消火剤。", add: "急減圧の可能性" },
  { no: "11", inherent: "感染性物質。吸入、摂取、粘膜や開いた傷口から吸収されると、人や動物に影響を与える恐れがある。", acRisk: "感染性物質による汚染", occRisk: "人や動物への遅発性感染", spill: "触らない。当該エリアの空気循環および換気を最小限にする。", fire: "利用可能なすべての消火剤。\"Y\"の場合は水を使用しない。", add: "到着地に有資格者の手配を要請する。" },
  { no: "12", inherent: "火災および/または爆発", acRisk: "火災、熱、煙、有毒および引火性蒸気", occRisk: "煙、ガス、熱", spill: "100%酸素を使用。最大の換気を確立し維持する。", fire: "利用可能なすべての消火剤。水があれば使用する。", add: "急減圧の可能性。即時の着陸を検討する。" }
];

const ERG_LETTERS_LEFT_FINAL = [
  { letter: "A", hazard: "麻酔性" },
  { letter: "C", hazard: "腐食性" },
  { letter: "E", hazard: "爆発性" },
  { letter: "F", hazard: "引火性" },
  { letter: "H", hazard: "発火性が非常に高い" },
  { letter: "I", hazard: "刺激性/催涙性" },
  { letter: "L", hazard: "その他の危険性が低い、またはない" },
  { letter: "M", hazard: "磁性" },
  { letter: "N", hazard: "有害" },
  { letter: "P", hazard: "毒性" },
];

const ERG_LETTERS_RIGHT_FINAL = [
  { letter: "S", hazard: "自然発火性" },
  { letter: "W", hazard: "濡れると有毒または引火性ガスを放出する" },
  { letter: "X", hazard: "酸化性" },
  { letter: "Y", hazard: "感染性物質の種類によっては、関係当局により人、動物、貨物および航空機の検疫が要求される場合がある" },
  { letter: "Z", hazard: "航空機貨物室の消火システムでは消火や封じ込めができない可能性あり。即時の着陸を検討する。" }
];

// --- [3-12] DOCS: SPECIAL PAX DATA ---
const SPECIAL_PAX_DATA = [
  { code: "WCHC", label: "歩行障がい旅客", desc: "歩行不可。座席移動・緊急脱出に他人の援助が必要。", escort: "条件により脱出援助者(EE)必要\n※規定人数超過時", seat: "非常口不可\n※付添者は隣席", limit: "787-X: 4名\n787-9: 4名\n787-8: 3名\n(※付添者なしの場合)" },
  { code: "WCHS", label: "歩行困難旅客", desc: "階段昇降が不可能な旅客。", escort: "-", seat: "非常口不可", limit: "制限なし" },
  { code: "WCHR", label: "軽度の歩行困難旅客", desc: "歩行・階段昇降可。空港内移動に車椅子を使用。", escort: "-", seat: "非常口不可", limit: "制限なし" },
  { code: "MEDA", label: "傷病旅客", desc: "機内で酸素ボンベ、医療機器等の非日常的な医療支援が必要。", escort: "原則必要\n(医師/看護師等)", seat: "非常口不可", limit: "制限なし" },
  { code: "STCR", label: "ストレッチャー旅客", desc: "着席した状態で航空機旅行を行うことができない。", escort: "必要\n(医師/看護師等)", seat: "指定座席\n※付添者は隣席", limit: "1機あたり1名\n※幼児同伴不可" },
  { code: "[国内] PMDI\n[国際] DPNA", label: "知的障がい旅客", desc: "緊急脱出が自身ではできず、他人の援助が必要。", escort: "必要\n(付添者1名に対し2名迄)", seat: "非常口不可\n※付添者は隣席", limit: "制限なし\n※幼児・小児同伴不可" },
  { code: "BLND", label: "視覚障がい旅客", desc: "目の不自由な旅客。\n盲導犬は付添者とみなし、1名に対し1頭まで同伴可。", escort: "条件により必要\n(付添者1名に対し2名迄)", seat: "非常口不可\n※付添者は隣席", limit: "制限なし\n※単独搭乗時は制限あり" },
  { code: "DEAF", label: "聴覚障がい旅客", desc: "耳の不自由な旅客。\n聴導犬は1名に対し1頭まで同伴可。", escort: "-", seat: "非常口不可", limit: "制限なし" },
  { code: "[国内] PGNT\n[国際] EXMO", label: "妊婦", desc: "出産予定日より28日以内の旅客。", escort: "[国内] 予定日7日以内\n[国際] 予定日14日以内\nは医師の同伴が必要", seat: "非常口不可", limit: "制限なし" },
  { code: "[国内] INF\n[国際] INFT\nINST", label: "幼児", desc: "[国内] 生後8日以上3歳未満\n[国際] 生後8日以上2歳未満\n※INSTは国内/国際共通で座席を使用する幼児(SOC INFT)", escort: "必要(12歳以上)\n同伴者1名につき2名迄", seat: "非常口不可\n※酸素マスク数の制限あり", limit: "[国内] 各装備座席数の20%以下\n[国際] 各装備座席数の10%以下" },
  { code: "[国内] CH / JRP\n[国際] CHLD / UMNR", label: "小児 / 単独搭乗", desc: "[国内] 3歳以上12歳未満 (JRPは6〜8歳)\n[国際] 2歳以上12歳未満 (UMNRは5〜12歳)", escort: "[国内] 6歳未満\n[国際] 5歳未満\nは12歳以上の同伴必要", seat: "非常口不可", limit: "制限なし" },
  { code: "PRIS", label: "被疑者", desc: "逮捕・拘束され、厳重な護送が行われるべき者。", escort: "[国内] 1名に対し2名以上等\n[国際] 1名につき3名", seat: "非常口不可\n※窓側等に指定", limit: "1機あたり3件以内\n合計3人以内" },
  { code: "[国内] DEPO\n[国際] DEPA / DEPU", label: "出入国管理局拘留者", desc: "退去を命じられた外国人、あるいはその容疑者。\n(DEPA=警備官同行, DEPU=同行なし)", escort: "[国内] 1名以上(入国警備官等)\n[国際] DEPAは同行あり", seat: "非常口不可", limit: "[国内] 1便あたり10名以内\n[国際] 制限なし" },
  { code: "ARMD", label: "職務上の武器携帯者", desc: "公的職務の遂行上、武器を携帯する必要がある者。", escort: "-", seat: "被護送者の指定に準ずる", limit: "-" },
  { code: "INAD", label: "上陸禁止者", desc: "当該国の当局から入国を拒否された者。", escort: "-", seat: "非常口不可", limit: "-" }
];

// ==========================================
// [4] UTILITY FUNCTIONS
// ==========================================
// --- [4-1] Formatting & Parsing ---
function formatNum(num) { return (num == null || isNaN(num)) ? "---" : Math.round(num).toLocaleString('en-US'); }
function formatWeightDisplay(val) { return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K'; }
function parseWeightInput(str) {
  if (!str) return null; str = str.toString().trim().toUpperCase().replace(/,/g, '');
  let mult = 1; if (str.endsWith('K')) { mult = 1000; str = str.slice(0, -1); }
  const val = parseFloat(str); if (isNaN(val)) return null;
  if (mult === 1 && val <= 1500) mult = 1000;
  return Math.round((val * mult) / 1000) * 1000;
}

// --- [4-2] Interpolation ---
function interpolateObjArray(x, arr, subIndex) {
  if (!arr || arr.length === 0) return null; let s = [...arr].sort((a, b) => a[0] - b[0]);
  if (x <= s[0][0]) return s[0][subIndex]; if (x >= s[s.length - 1][0]) return s[s.length - 1][subIndex];
  for (let i = 0; i < s.length - 1; i++) {
    if (x >= s[i][0] && x <= s[i + 1][0]) {
      const y1 = s[i][subIndex], y2 = s[i + 1][subIndex];
      if (y1 == null || y2 == null) return null;
      return y1 + ((x - s[i][0]) / (s[i + 1][0] - s[i][0])) * (y2 - y1);
    }
  } return null;
}
function interpolateDirectArray(x, xValues, yValues) {
  if (!xValues || !yValues || xValues.length !== yValues.length) return null;
  if (x <= xValues[0]) return yValues[0]; if (x >= xValues[xValues.length - 1]) return yValues[yValues.length - 1];
  for (let i = 0; i < xValues.length - 1; i++) {
    if (x >= xValues[i] && x <= xValues[i + 1]) {
      const y1 = yValues[i], y2 = yValues[i + 1]; if (y1 == null || y2 == null) return null;
      return y1 + ((x - xValues[i]) / (xValues[i + 1] - xValues[i])) * (y2 - y1);
    }
  } return null;
}

// --- [4-3] Flight Calculation ---
function kiasToMach(kias, alt) {
  const a0 = 661.4786; let delta = alt <= 36089 ? Math.pow(1 - 0.0000068755856 * alt, 5.2558797) : 0.22336 * Math.exp(-0.00004806346 * (alt - 36089));
  const qc_p0 = Math.pow(1 + 0.2 * Math.pow(kias / a0, 2), 3.5) - 1; return Math.sqrt(5 * (Math.pow(qc_p0 / delta + 1, 2 / 7) - 1));
}
function getHoldSpeed(type, weight, alt) {
  const d = HOLD_SPD_DATA_RAW[type]; if (!d) return null;
  let wK = Math.max(d.weights[0], Math.min(weight / 1000, d.weights[d.weights.length - 1]));
  let a = Math.max(d.alts[0], Math.min(alt, d.alts[d.alts.length - 1]));
  let wIdx = 0; while (wIdx < d.weights.length - 1 && d.weights[wIdx + 1] <= wK) wIdx++;
  let aIdx = 0; while (aIdx < d.alts.length - 1 && d.alts[aIdx + 1] <= a) aIdx++;
  const w1 = d.weights[wIdx], w2 = d.weights[wIdx + 1] || w1, a1 = d.alts[aIdx], a2 = d.alts[aIdx + 1] || a1;
  const wRatio = w1 === w2 ? 0 : (wK - w1) / (w2 - w1), aRatio = a1 === a2 ? 0 : (a - a1) / (a2 - a1);
  const v11 = d.kias[wIdx][aIdx], v12 = d.kias[wIdx][aIdx + 1] || v11, v21 = d.kias[wIdx + 1]?.[aIdx] || v11, v22 = d.kias[wIdx + 1]?.[aIdx + 1] || v12;
  return Math.round((v11 + (v21 - v11) * wRatio) + ((v12 + (v22 - v12) * wRatio) - (v11 + (v21 - v11) * wRatio)) * aRatio);
}

function getManeuverMach(type, weight, alt) {
  try {
    const d = MANEUVER_1_3G_MACH_DATA[type]; if (!d) return null;
    let wK = Math.max(d.weights[0], Math.min(weight / 1000, d.weights[d.weights.length - 1]));
    let a = Math.max(d.alts[0], Math.min(alt, d.alts[d.alts.length - 1]));
    let wIdx = 0; while (wIdx < d.weights.length - 1 && d.weights[wIdx + 1] <= wK) wIdx++;
    let aIdx = 0; while (aIdx < d.alts.length - 1 && d.alts[aIdx + 1] <= a) aIdx++;
    const w1 = d.weights[wIdx], w2 = d.weights[wIdx + 1] || w1, a1 = d.alts[aIdx], a2 = d.alts[aIdx + 1] || a1;
    const wRatio = w1 === w2 ? 0 : (wK - w1) / (w2 - w1), aRatio = a1 === a2 ? 0 : (a - a1) / (a2 - a1);

    const row1 = d.mach[wIdx];
    const row2 = d.mach[wIdx + 1] || row1;
    const v11 = row1[aIdx];
    const v12 = row1[aIdx + 1] !== undefined ? row1[aIdx + 1] : v11;
    const v21 = row2[aIdx] !== undefined ? row2[aIdx] : v11;
    const v22 = row2[aIdx + 1] !== undefined ? row2[aIdx + 1] : v12;

    if (v11 === undefined || v12 === undefined || v21 === undefined || v22 === undefined) return null;
    return (v11 + (v21 - v11) * wRatio) + ((v12 + (v22 - v12) * wRatio) - (v11 + (v21 - v11) * wRatio)) * aRatio;
  } catch (e) {
    return null;
  }
}

const calculateTAS = (ias, elevationFt, oatC) => {
  const iasNum = Number(ias), elevNum = Number(elevationFt), oatNum = Number(oatC);
  if (isNaN(iasNum) || isNaN(elevNum) || isNaN(oatNum) || iasNum === 0) return 0;
  const T0 = 288.15, L = 0.0019812, h = Math.max(0, elevNum), T_act = oatNum + 273.15;
  const P_ratio = Math.pow((1 - (L * h) / T0), 5.25588), sigma = P_ratio * (T0 / T_act);
  return Math.round(iasNum / Math.sqrt(sigma));
};
const calculateHeadingAndGS = (trackAngleRad, tas, windVx, windVy) => {
  const crossWindComp = windVx * Math.sin(trackAngleRad) - windVy * Math.cos(trackAngleRad);
  const ratio = Math.max(-0.99, Math.min(0.99, crossWindComp / tas)), wca = Math.asin(ratio);
  const headingRad = trackAngleRad + wca;
  const tailWindComp = windVx * Math.cos(trackAngleRad) + windVy * Math.sin(trackAngleRad);
  return { headingRad, gs: Math.max(1, tas * Math.cos(wca) + tailWindComp) };
};
const generateTurnPoints = (startAngle, endAngle, radiusTAS, tas, windVx, windVy, numPoints = 30) => {
  const points = [], angleDiff = endAngle - startAngle, turnTimeHours = Math.abs(angleDiff) * radiusTAS / tas, isLeftTurn = angleDiff > 0;
  const centerAngle = startAngle + (isLeftTurn ? Math.PI / 2 : -Math.PI / 2), centerX = radiusTAS * Math.cos(centerAngle), centerY = radiusTAS * Math.sin(centerAngle);
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints, currentAngle = startAngle + angleDiff * t, posAngle = currentAngle + (isLeftTurn ? -Math.PI / 2 : Math.PI / 2);
    points.push({ x: centerX + radiusTAS * Math.cos(posAngle) + windVx * (turnTimeHours * t), y: centerY + radiusTAS * Math.sin(posAngle) + windVy * (turnTimeHours * t) });
  } return points;
};

const calculateWindComponentRow = (rwy, windDir, limitConfig, isCopMode) => {
  const rwyHdg = parseInt(rwy, 10) * 10;
  let angleDiff = Math.abs(windDir - rwyHdg);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;
  const rad = angleDiff * (Math.PI / 180);
  const isTailwind = angleDiff > 90;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const cols = isCopMode ? limitConfig.copCols : limitConfig.capCols;
  const vals = {};
  cols.forEach(col => {
    const crossLimit = parseFloat(col.val);
    const tailLimit = 15;
    let maxWind = Math.floor(crossLimit / sin);
    if (isTailwind) { const tailMaxWind = Math.floor(tailLimit / cos); maxWind = Math.min(maxWind, tailMaxWind); }
    if (maxWind > 99) maxWind = 99;
    if (sin === 0 && !isTailwind) maxWind = 99;
    if (sin === 0 && isTailwind) maxWind = tailLimit;
    const isTailwindLimited = isTailwind && maxWind === Math.floor(tailLimit / cos);
    vals[col.val] = isTailwindLimited ? "_" + maxWind + "_" : String(maxWind);
  });
  return { vals };
};

// ==========================================
// [5] TAB COMPONENTS
// ==========================================
// --- [5-1] WxMnmReference (WX/MNM) ---   [5-3]の上まで省略
const WxMnmReference = () => {
  const [activeTab, setActiveTab] = useState('wx_mnm');

  const customStyles = `
    .wx-mnm-wrapper *, .wx-mnm-wrapper *::before, .wx-mnm-wrapper *::after { box-sizing: border-box; }
    .wx-mnm-wrapper { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .wx-mnm-container { background-color: transparent; padding: 0.25rem; border-radius: 1rem; width: 100%; display: flex; flex-direction: column; overflow-x: hidden; }
    .wx-mnm-container h1 { font-size: 1.1rem; color: #f1f5f9; margin: 0 0 0.2rem 0; text-align: center; font-weight: 800; letter-spacing: 0.05em; }
    .wx-mnm-container p.desc { color: #94a3b8; font-size: 0.75rem; margin: 0 0 0.75rem 0; text-align: center; }
    
    .charts-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.4rem; min-height: auto; }
    .flow-card { border-radius: 0.5rem; border: 2px dashed; display: flex; flex-direction: column; padding: 0.4rem 0.25rem; height: 100%; background-color: rgba(30, 41, 59, 0.5); }
    .card-dep { border-color: #9333ea; }
    .card-dest-plan { border-color: #10b981; } 
    .card-dest { border-color: #e11d48; }
    .card-alt { border-color: #0ea5e9; }
    .card-both { border-color: #64748b; }
    .card-title { text-align: center; font-size: 0.75rem; font-weight: 800; margin-bottom: 0.5rem; padding-bottom: 0.3rem; border-bottom: 2px solid; letter-spacing: -0.5px; line-height: 1.2; word-break: keep-all; }
    .card-dep .card-title { color: #d8b4fe; border-bottom-color: #7e22ce; }
    .card-dest-plan .card-title { color: #86efac; border-bottom-color: #166534; }
    .card-dest .card-title { color: #fda4af; border-bottom-color: #be123c; }
    .card-alt .card-title { color: #7dd3fc; border-bottom-color: #0369a1; }
    .card-both .card-title { color: #cbd5e1; border-bottom-color: #475569; }
    
    .custom-flow { display: grid; grid-template-columns: 1fr 12px 1fr; align-items: center; justify-items: center; width: 100%; gap: 0; }
    .node { width: 100%; padding: 4px 2px; border-radius: 4px; border: 2px solid; text-align: center; font-size: 8.5px; font-weight: 800; line-height: 1.2; box-shadow: 0 2px 4px rgba(0,0,0,0.2); background-color: #1e293b; z-index: 2; letter-spacing: -0.2px; word-break: normal; }
    .decision-node { background: rgba(59, 130, 246, 0.15); border-color: #3b82f6; color: #93c5fd; }
    .action-node { background: rgba(234, 179, 8, 0.15); border-color: #eab308; color: #fde047; }
    .finish-node { background: rgba(34, 197, 94, 0.15); border-color: #22c55e; color: #86efac; }
    .node.has-list { text-align: left; padding: 4px 4px; }
    .node.has-list strong { display: block; text-align: center; margin-bottom: 3px; font-size: 8.5px; color: #93c5fd; border-bottom: 1px dashed #3b82f6; padding-bottom: 2px; }
    .node.has-list ul { margin: 0; padding-left: 10px; font-size: 7.5px; color: #cbd5e1; font-weight: 600; }
    .node.has-list li { margin-bottom: 1px; }
    
    .arrow-v { width: 2px; height: 12px; background-color: #64748b; position: relative; margin: 1px 0; grid-column: 1; }
    .arrow-v::after { content: ''; position: absolute; bottom: -3px; left: -4px; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #64748b; }
    .arrow-h { width: 100%; height: 2px; background-color: #64748b; position: relative; grid-column: 2; }
    .arrow-h::after { content: ''; position: absolute; right: -2px; top: -4px; border-top: 5px solid transparent; border-bottom: 5px solid transparent; border-left: 6px solid #64748b; }
    .label-no { position: absolute; top: 50%; left: 2px; transform: translateY(-50%); font-size: 7px; font-weight: 800; color: #f87171; }
    .label-yes { position: absolute; bottom: 1px; left: 50%; transform: translateX(-50%); font-size: 7px; font-weight: 800; color: #60a5fa; }
    
    .notes-container { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; margin-top: 1rem; flex-shrink: 0; align-items: start; }
    .note-col { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
    .note { padding: 0.5rem; border-left: 4px solid; border-radius: 0.5rem; font-size: 0.65rem; color: #cbd5e1; line-height: 1.4; background-color: rgba(30, 41, 59, 0.6); box-shadow: 0 2px 4px rgba(0,0,0,0.1); word-break: break-word; }
    .note-dep { border-left-color: #a855f7; }
    .note-dest-plan { border-left-color: #22c55e; }
    .note-dest { border-left-color: #f43f5e; }
    .note-alt { border-left-color: #0ea5e9; }
    .note-common { border-left-color: #94a3b8; }
    .note strong { color: #f8fafc; display: block; margin-bottom: 0.2rem; font-size: 0.7rem; }
    
    .info-grid { display: grid; grid-template-columns: 55fr 45fr; gap: 0.5rem; margin-top: 1rem; flex-shrink: 0; }
    .table-container { background-color: rgba(30, 41, 59, 0.6); border-radius: 0.5rem; border: 1px solid #475569; padding: 0.4rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; flex-direction: column; height: 100%; min-width: 0; overflow: hidden; }
    .table-title { text-align: center; font-size: 0.75rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.4rem; padding-bottom: 0.4rem; border-bottom: 2px solid #475569; line-height: 1.2; word-break: keep-all; }
    .table-container table { width: 100%; border-collapse: collapse; font-size: 0.65rem; color: #cbd5e1; margin-bottom: 0.4rem; table-layout: fixed; }
    .table-container th, .table-container td { border: 1px solid #475569; padding: 0.3rem 0.2rem; text-align: left; vertical-align: middle; word-wrap: break-word; overflow-wrap: break-word; }
    .table-container th { background-color: rgba(15, 23, 42, 0.5); font-weight: 800; text-align: center; color: #f8fafc; }
    .text-center { text-align: center; }
    .highlight { color: #fb7185; font-weight: 800; }
    .table-notes { font-size: 0.65rem; color: #94a3b8; line-height: 1.3; word-break: break-word; }
    .table-notes ul { margin: 0; padding-left: 1rem; }
    .table-notes li { margin-bottom: 0.2rem; }
    
    .fpl-section { display: flex; flex-direction: column; }
    .fpl-title { text-align: center; font-size: 0.9rem; font-weight: 800; color: #f8fafc; margin-bottom: 0.5rem; }
    .fpl-legend { text-align: center; font-size: 0.7rem; color: #cbd5e1; margin-bottom: 0.5rem; display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 0.4rem; font-weight: 600; }
    .legend-note { text-align: center; font-size: 0.65rem; color: #94a3b8; margin-bottom: 0.75rem; line-height: 1.4; word-break: break-word; }
    .fpl-badge { padding: 0.1rem 0.3rem; border-radius: 0.2rem; font-weight: 800; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.2); font-size: 0.6rem; margin-right: 0.2rem; min-width: 1.5rem; text-align: center; line-height: 1.2; }
    .badge-common { background-color: rgba(14, 165, 233, 0.2); color: #7dd3fc; border: 1px solid #0ea5e9; }
    .badge-dom { background-color: rgba(34, 197, 94, 0.2); color: #86efac; border: 1px solid #22c55e; }
    .badge-int { background-color: rgba(249, 115, 22, 0.2); color: #fdba74; border: 1px solid #f97316; }
    
    .fpl-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; align-items: start; }
    .fpl-grid .table-container { height: max-content; }
    .table-fpl { table-layout: auto !important; width: 100%; }
    .table-fpl th, .table-fpl td { padding: 0.3rem 0.2rem; font-size: 0.6rem; line-height: 1.3; border: 1px solid #475569; word-break: break-word; }
    .table-fpl td:first-child { font-weight: 800; color: #cbd5e1; text-align: center; width: 15%; min-width: 2rem; white-space: normal; }
    .flex-col { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; justify-content: flex-start; }
    
    .area-row { display: flex; flex-wrap: wrap; align-items: flex-start; margin-bottom: 0.2rem; line-height: 1.4; gap: 0.2rem; }
    .area-row:last-child { margin-bottom: 0; }
    .area-tag { color: #94a3b8; font-size: 0.6rem; flex-shrink: 0; font-weight: bold; }
    .type-tag { color: #94a3b8; font-size: 0.6rem; flex-shrink: 0; font-weight: bold; }
    .type-tag-sm { color: #94a3b8; font-size: 0.6rem; flex-shrink: 0; font-weight: bold; }
    .icao-code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; font-size: 0.6rem; letter-spacing: 0; line-height: 1.5; word-break: break-word; white-space: normal; }
    .b777-green { background-color: rgba(34, 197, 94, 0.2); color: #86efac; padding: 0 0.15rem; border-radius: 0.15rem; }
    .b777-yellow { background-color: rgba(234, 179, 8, 0.2); color: #fde047; padding: 0 0.15rem; border-radius: 0.15rem; }
    .b777-red { background-color: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 0 0.15rem; border-radius: 0.15rem; }
    .table-cat1 th { background-color: rgba(34, 197, 94, 0.15) !important; color: #86efac !important; text-align: center; font-size: 0.6rem; line-height: 1.1; padding: 0.2rem 0.1rem; }
    .table-cat1 td { text-align: center; font-size: 0.7rem !important; padding: 0.2rem 0.1rem; }
    .table-cat1 td:first-child { font-weight: 800; color: #cbd5e1; text-align: center; white-space: nowrap; font-size: 0.6rem !important; background-color: rgba(30, 41, 59, 0.4); }
  `;

  return (
    <div className="wx-mnm-wrapper w-full bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] p-1.5 lg:p-2 flex flex-col shadow-2xl border border-slate-700 relative overflow-hidden h-full">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* タブナビゲーション */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-600 shadow-inner mb-2 shrink-0 overflow-x-auto custom-scrollbar gap-1">
        <button
          onClick={() => setActiveTab('wx_mnm')}
          className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-[10px] lg:text-xs font-black transition-all whitespace-nowrap flex-1 flex items-center justify-center gap-1.5 ${activeTab === 'wx_mnm' ? 'bg-slate-600 text-white shadow-md border border-slate-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'}`}
        >
          <SafeIcon name="GitBranch" className="w-3.5 h-3.5" />WX MNM フロー
        </button>
        <button
          onClick={() => setActiveTab('cat1_adeq')}
          className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-[10px] lg:text-xs font-black transition-all whitespace-nowrap flex-1 flex items-center justify-center gap-1.5 ${activeTab === 'cat1_adeq' ? 'bg-slate-600 text-white shadow-md border border-slate-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'}`}
        >
          <SafeIcon name="Eye" className="w-3.5 h-3.5" />CATⅠ / ADEQUATE
        </button>
        <button
          onClick={() => setActiveTab('etops')}
          className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-[10px] lg:text-xs font-black transition-all whitespace-nowrap flex-1 flex items-center justify-center gap-1.5 ${activeTab === 'etops' ? 'bg-slate-600 text-white shadow-md border border-slate-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'}`}
        >
          <SafeIcon name="Shield" className="w-3.5 h-3.5" />ETOPS
        </button>
        <button
          onClick={() => setActiveTab('familiar')}
          className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-[10px] lg:text-xs font-black transition-all whitespace-nowrap flex-1 flex items-center justify-center gap-1.5 ${activeTab === 'familiar' ? 'bg-slate-600 text-white shadow-md border border-slate-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'}`}
        >
          <SafeIcon name="MapPin" className="w-3.5 h-3.5" />FAMILIAR / 空港資格
        </button>
        <button
          onClick={() => setActiveTab('fpl')}
          className={`px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-[10px] lg:text-xs font-black transition-all whitespace-nowrap flex-1 flex items-center justify-center gap-1.5 ${activeTab === 'fpl' ? 'bg-slate-600 text-white shadow-md border border-slate-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'}`}
        >
          <SafeIcon name="FileText" className="w-3.5 h-3.5" />FPL 記号一覧
        </button>
      </div>

      <div className="wx-mnm-container h-full overflow-y-auto custom-scrollbar pr-2 pt-1">

        {/* === TAB 1: WX MNM フロー === */}
        {activeTab === 'wx_mnm' && (
          <div className="animate-in fade-in duration-300">
            <h1>出発地・目的地・代替 WX MNM Below 判定フロー</h1>
            <p className="desc">ANA OPERATIONS MANUAL (3-3-3 変更 ② / 3-4-2 ④ / S-3-6)</p>

            <div className="charts-grid">
              {/* ケース0: 出発地 */}
              <div className="flow-card card-dep">
                <div className="card-title">【 出発地がL/D MNM未満 】<br /><span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>(計画時)</span></div>
                <div className="custom-flow">
                  <div className="node decision-node" style={{ gridColumn: 1, gridRow: 1 }}>目的地/代替が<br />規定範囲内(※3)？</div>
                  <div className="arrow-h" style={{ gridRow: 1 }}><span className="label-yes">Yes</span></div>
                  <div className="node finish-node" style={{ gridColumn: 3, gridRow: 1 }}>出発地代替<br />選定不要</div>

                  <div className="arrow-v" style={{ gridRow: 2 }}><span className="label-no">No</span></div>

                  <div className="node decision-node has-list" style={{ gridColumn: 1, gridRow: 3 }}>
                    <strong>出発地代替を選定可能？</strong>
                    <ul>
                      <li>規定範囲内(※3)にある</li>
                      <li>GPS以外の計器進入が可能</li>
                    </ul>
                  </div>
                  <div className="arrow-h" style={{ gridRow: 3 }}><span className="label-yes">Yes</span></div>
                  <div className="node finish-node" style={{ gridColumn: 3, gridRow: 3 }}>代替を選定し<br />出発可能</div>

                  <div className="arrow-v" style={{ gridRow: 4 }}><span className="label-no">No</span></div>

                  <div className="node action-node" style={{ gridColumn: 1, gridRow: 5 }}>T/O MNMをL/D MNM<br />以上に設定 (※4)</div>
                </div>
              </div>

              {/* ケース1: 目的地 (計画) */}
              <div className="flow-card card-dest-plan">
                <div className="card-title" style={{ fontSize: '0.65rem', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>【目的地が断続してL/D MNM未満】<br /><span style={{ fontSize: '0.6rem', fontWeight: 'normal', letterSpacing: '0' }}>(計画時)</span></div>
                <div className="custom-flow">
                  <div className="node decision-node has-list" style={{ gridColumn: 1, gridRow: 1 }}>
                    <strong>代替1ヶ所で出発可能？</strong>
                    <ul>
                      <li>1500/5000以上の代替選定</li>
                      <li>目的地or代替でGPS以外可</li>
                    </ul>
                  </div>
                  <div className="arrow-h" style={{ gridRow: 1 }}><span className="label-yes">Yes</span></div>
                  <div className="node finish-node" style={{ gridColumn: 3, gridRow: 1 }}>代替1ヶ所で<br />出発可能</div>

                  <div className="arrow-v" style={{ gridRow: 2 }}><span className="label-no">No</span></div>

                  <div className="node decision-node has-list" style={{ gridColumn: 1, gridRow: 3 }}>
                    <strong>代替2ヶ所で出発可能？</strong>
                    <ul>
                      <li>代替を2ヶ所選定できる</li>
                      <li>目的地or代替でGPS以外可</li>
                    </ul>
                  </div>
                  <div className="arrow-h" style={{ gridRow: 3 }}><span className="label-yes">Yes</span></div>
                  <div className="node finish-node" style={{ gridColumn: 3, gridRow: 3 }}>代替2ヶ所で<br />出発可能</div>

                  <div className="arrow-v" style={{ gridRow: 4 }}><span className="label-no">No</span></div>

                  <div className="node action-node" style={{ gridColumn: 1, gridRow: 5 }}>Delay / Cancel<br />または計画変更</div>
                </div>
              </div>

              {/* ケース2: 目的地 (飛行中) */}
              <div className="flow-card card-dest">
                <div className="card-title">【 目的地がL/D MNM未満 】<br /><span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>(飛行中)</span></div>
                <div className="custom-flow">
                  <div className="node decision-node" style={{ gridColumn: 1, gridRow: 1 }}>代替へ<br />DIVする？</div>
                  <div className="arrow-h" style={{ gridRow: 1 }}><span className="label-yes">Yes</span></div>
                  <div className="node finish-node" style={{ gridColumn: 3, gridRow: 1 }}>代替へ<br />DIV</div>

                  <div className="arrow-v" style={{ gridRow: 2 }}><span className="label-no">No</span></div>

                  <div className="node decision-node has-list" style={{ gridColumn: 1, gridRow: 3 }}>
                    <strong>以下いずれかを満たす？</strong>
                    <ul>
                      <li>回復まで待機可能な燃料</li>
                      <li>1500ft/5000m以上の代替</li>
                    </ul>
                  </div>
                  <div className="arrow-h" style={{ gridRow: 3 }}><span className="label-yes">Yes</span></div>
                  <div className="node finish-node" style={{ gridColumn: 3, gridRow: 3 }}>飛行継続可</div>

                  <div className="arrow-v" style={{ gridRow: 4 }}><span className="label-no">No</span></div>

                  <div className="node decision-node" style={{ gridColumn: 1, gridRow: 5 }}>代替をさらに<br />1ヶ所追加可能？</div>
                  <div className="arrow-h" style={{ gridRow: 5 }}><span className="label-yes">Yes</span></div>
                  <div className="node finish-node" style={{ gridColumn: 3, gridRow: 5 }}>飛行継続可</div>

                  <div className="arrow-v" style={{ gridRow: 6 }}><span className="label-no">No</span></div>

                  <div className="node action-node" style={{ gridColumn: 1, gridRow: 7 }}>目的地を変更</div>
                </div>
              </div>

              {/* ケース3: 代替 (飛行中) */}
              <div className="flow-card card-alt">
                <div className="card-title">【 代替がALTN MNM未満 】<br /><span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>(飛行中)</span></div>
                <div className="custom-flow">
                  <div className="node decision-node" style={{ gridColumn: 1, gridRow: 1 }}>代替を<br />変更可能か？</div>
                  <div className="arrow-h" style={{ gridRow: 1 }}><span className="label-yes">Yes</span></div>
                  <div className="node finish-node" style={{ gridColumn: 3, gridRow: 1 }}>代替を変更し<br />飛行継続可</div>

                  <div className="arrow-v" style={{ gridRow: 2 }}><span className="label-no">No</span></div>

                  <div className="node decision-node has-list" style={{ gridColumn: 1, gridRow: 3 }}>
                    <strong>以下すべてを満たす？</strong>
                    <ul>
                      <li>飛行時間が6時間以内</li>
                      <li>到着前後1Hが規定値(※2)以上</li>
                      <li>目的地でGPS以外の進入可</li>
                    </ul>
                  </div>
                  <div className="arrow-h" style={{ gridRow: 3 }}><span className="label-yes">Yes</span></div>
                  <div className="node finish-node" style={{ gridColumn: 3, gridRow: 3 }}>飛行継続可</div>

                  <div className="arrow-v" style={{ gridRow: 4 }}><span className="label-no">No</span></div>

                  <div className="node decision-node" style={{ gridColumn: 1, gridRow: 5 }}>残燃料等から判断し<br />代替選定不可？</div>
                  <div className="arrow-v" style={{ gridRow: 6 }}><span className="label-yes">Yes</span></div>

                  <div className="node action-node" style={{ gridColumn: 1, gridRow: 7 }}>目的地を変更</div>
                </div>
              </div>

              {/* ケース4: 両方 (飛行中) */}
              <div className="flow-card card-both">
                <div className="card-title">【 両方がMNM未満 】<br /><span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>(飛行中)</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div className="node action-node" style={{ width: '85%' }}>目的地を変更</div>
                  <div className="arrow-v" style={{ margin: '6px 0' }}></div>
                  <div className="node action-node" style={{ width: '85%' }}>新目的地に対し<br />新代替を選定(推奨)</div>
                </div>
              </div>
            </div>

            <div className="notes-container">
              {/* 左カラム：出発地 (紫) */}
              <div className="note-col">
                <div className="note note-dep">
                  <strong>(※3) 出発地代替飛行場の規定範囲 (OM 3-4-2 ④(2))</strong>
                  出発地から1発不作動巡航速度で1時間以内の距離にあること。
                </div>
                <div className="note note-dep">
                  <strong>(※4) 代替選定不可時の措置と気象情報の取扱い (OM S-3-6)</strong>
                  ・出発時 T/O MNM を当該飛行場の L/D MNM 以上の値に設定しなければならない。(実質的に天候回復待ちでのDelayとなる)<br />
                  ・ただし、雲底高度がMNM未満であっても、視程/RVR≧MNMであり、先行到着機が余裕をもって着陸している等の状況から機長と運航管理者が協議・合意した場合は「L/D MNM Above」として取扱うことができる。
                </div>
              </div>

              {/* 右カラム：代替・共通 (青・灰) */}
              <div className="note-col">
                <div className="note note-alt">
                  <strong>(※2) 代替不要の天候規定値 (3-4-2 ④(3) 4))</strong>
                  到着予定時刻の前後それぞれ1時間の間、以下のいずれか大きい値以上であること。<br />
                  a. 雲高 2,000ft または DH/MDH + 1,500ft<br />
                  b. 視程 5,000m または RVR/VIS + 3,200m
                </div>
                <div className="note note-common">
                  <strong>Company MNM 適用の注意点 (S-5-1)</strong>
                  ・適用されるMNMは、当該便の機長(PIC)に付与された値に限る。<br />
                  ・資格の異なる機長2名着座でも機長(PIC)のMNMを適用。PIC離席中は代行者のMNMを適用。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TAB 2: CATⅠ / ADEQUATE === */}
        {activeTab === 'cat1_adeq' && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-2">
            <div className="info-grid mt-0">
              {/* 左カラム: CAT Ⅰ 運航 テーブル */}
              <div className="table-container">
                <div className="table-title">【参考】CAT Ⅰ運航（5-2-4 ②(3)）</div>
                <table className="table-fpl table-cat1">
                  <thead>
                    <tr>
                      <th rowSpan="3" style={{ width: '10%' }}>DH</th>
                      <th colSpan="6">RVR/CMV</th>
                    </tr>
                    <tr>
                      <th colSpan="2">Full Facilities</th>
                      <th colSpan="2">Intermediate<br />Facilities</th>
                      <th rowSpan="2" style={{ width: '13%' }}>Basic<br />Facilities</th>
                      <th rowSpan="2" style={{ width: '13%' }}>NIL<br />Facilities</th>
                    </tr>
                    <tr>
                      <th style={{ width: '16%' }}>TDZ & CL<br />AVBL</th>
                      <th style={{ width: '16%' }}>TDZ &/or<br />CL OUT</th>
                      <th style={{ width: '16%' }}>TDZ & CL<br />AVBL</th>
                      <th style={{ width: '16%' }}>TDZ &/or<br />CL OUT</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-white">
                    <tr>
                      <td className="font-sans">200</td>
                      <td>550</td><td>750</td><td>700</td><td>750</td><td>800</td><td>1000</td>
                    </tr>
                    <tr>
                      <td className="font-sans">201-250</td>
                      <td>600</td><td>750</td><td>700</td><td>750</td><td>800</td><td>1000</td>
                    </tr>
                    <tr>
                      <td className="font-sans">251-300</td>
                      <td>650</td><td>750</td><td>800</td><td>800</td><td>900</td><td>1200</td>
                    </tr>
                    <tr>
                      <td className="font-sans">301 以上</td>
                      <td>800</td><td>800</td><td>900</td><td>900</td><td>1000</td><td>1200</td>
                    </tr>
                  </tbody>
                </table>
                <div className="table-notes" style={{ marginTop: '0.75rem', fontSize: '0.65rem' }}>
                  <div style={{ marginBottom: '0.2rem' }}>(注<sup>1</sup>) CMVの下限値は800mとする。</div>
                  <div style={{ display: 'flex', marginBottom: '0.2rem' }}>
                    <div style={{ whiteSpace: 'nowrap' }}>(注<sup>2</sup>) </div>
                    <div>
                      RL、RTHL、RENL の不作動により滑走路の矩形が示されない場合、下記のとおりとする。ただし、RTHLの取扱いについては、S-5-4 に定める。<br />
                      ・灯火の構成は「NIL Facilities」とする。<br />
                      ・本規程 3-7-5 に定める運航制限に従う。
                    </div>
                  </div>
                  <div>(注<sup>3</sup>) Simple TDZ は TDZ として取扱わない。</div>
                </div>
              </div>

              {/* 右カラム: Alternate Minima 下限値テーブル */}
              <div className="table-container">
                <div className="table-title">【 参考 】 Alternate MNM の下限値 (5-2-4 ③)</div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '55%' }}>進入方式</th>
                      <th style={{ width: '45%' }}>全機種 (VIS or CIG-VIS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center">CATⅢ運航</td>
                      <td className="text-center">1200</td>
                    </tr>
                    <tr>
                      <td className="text-center">CATⅡ運航</td>
                      <td className="text-center">300-1200</td>
                    </tr>
                    <tr>
                      <td className="text-center">CATⅠ運航</td>
                      <td className="text-center">600-2000</td>
                    </tr>
                    <tr>
                      <td className="text-center">非精密進入または APV</td>
                      <td className="text-center">800-3000</td>
                    </tr>
                    <tr>
                      <td className="text-center">周回進入</td>
                      <td className="text-center">800-3600</td>
                    </tr>
                  </tbody>
                </table>
                <div className="table-notes" style={{ marginTop: '1rem' }}>
                  <ul>
                    <li>各飛行場の Alternate MNM は Company MNM Table に記載された値とする。</li>
                    <li>上記値以上の MNM を Landing MNM とする進入方式では、<strong style={{ color: '#f8fafc' }}>DH/MDH に 100ft</strong>、<strong style={{ color: '#f8fafc' }}>RVR/CMV または VIS に 400m</strong> を加算した値を下限値とする。</li>
                    <li>CATⅡ・Ⅲの Alternate MNM を下限値とする場合は、一発動機不作動時でもCATⅡ・Ⅲの着陸が可能な機体に限る。</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 下部: 航空灯火等の構成 */}
            <div className="flex justify-center mt-0 shrink-0">
              <div className="table-container w-full">
                <div className="table-title">【参考】航空灯火等の構成（5-2-4②(1)）</div>
                <div className="table-notes" style={{ fontSize: '0.7rem', color: '#cbd5e1', padding: '0.2rem 0.4rem' }}>
                  航空灯火等の構成は以下のとおりとする。なお、ALS に併設される RAI はその長さも ALS の有効長に含める。また、RTHL が利用できない場合、REIL(RWYTIL)により代替できる。
                  <ul className="mt-1.5 flex flex-col gap-1 list-none pl-0 pb-0.5">
                    <li className="bg-slate-800/40 p-1 lg:p-1.5 rounded-md border border-slate-600 flex items-center">
                      <strong className="text-emerald-300 text-[0.7rem] xl:text-[0.75rem] w-[135px] xl:w-[150px] shrink-0">1) Full Facilities</strong>
                      <div className="flex items-center text-[0.65rem] xl:text-[0.7rem] min-w-0">
                        <span className="text-slate-300 shrink-0 w-[40px] text-right">RCLM、</span>
                        <span className="bg-amber-500/20 text-amber-300 px-1 py-0.5 mx-1 rounded text-[0.65rem] font-bold border border-amber-500/30 shadow-sm text-center w-[160px] xl:w-[180px] shrink-0 whitespace-nowrap">
                          720m 以上の ALS
                        </span>
                        <span className="text-slate-300 shrink-0 truncate">、RL、RTHL および RENL</span>
                      </div>
                    </li>
                    <li className="bg-slate-800/40 p-1 lg:p-1.5 rounded-md border border-slate-600 flex items-center">
                      <strong className="text-emerald-300 text-[0.7rem] xl:text-[0.75rem] w-[135px] xl:w-[150px] shrink-0">2) Intermediate Facilities</strong>
                      <div className="flex items-center text-[0.65rem] xl:text-[0.7rem] min-w-0">
                        <span className="text-slate-300 shrink-0 w-[40px] text-right">RCLM、</span>
                        <span className="bg-amber-500/20 text-amber-300 px-1 py-0.5 mx-1 rounded text-[0.65rem] font-bold border border-amber-500/30 shadow-sm text-center w-[160px] xl:w-[180px] shrink-0 whitespace-nowrap">
                          420m 以上 719m 以下の ALS
                        </span>
                        <span className="text-slate-300 shrink-0 truncate">、RL、RTHL および RENL</span>
                      </div>
                    </li>
                    <li className="bg-slate-800/40 p-1 lg:p-1.5 rounded-md border border-slate-600 flex items-center">
                      <strong className="text-emerald-300 text-[0.7rem] xl:text-[0.75rem] w-[135px] xl:w-[150px] shrink-0">3) Basic Facilities</strong>
                      <div className="flex items-center text-[0.65rem] xl:text-[0.7rem] min-w-0">
                        <span className="text-slate-300 shrink-0 w-[40px] text-right">RCLM、</span>
                        <span className="bg-amber-500/20 text-amber-300 px-1 py-0.5 mx-1 rounded text-[0.65rem] font-bold border border-amber-500/30 shadow-sm text-center w-[160px] xl:w-[180px] shrink-0 whitespace-nowrap">
                          クロスバー運用 420m 未満 ALS
                        </span>
                        <span className="text-slate-300 shrink-0 truncate">、RL、RTHL および RENL</span>
                      </div>
                    </li>
                    <li className="bg-slate-800/40 p-1 lg:p-1.5 rounded-md border border-slate-600 flex items-center">
                      <strong className="text-emerald-300 text-[0.7rem] xl:text-[0.75rem] w-[135px] xl:w-[150px] shrink-0">4) NIL Facilities</strong>
                      <div className="text-[0.65rem] xl:text-[0.7rem] text-slate-300 ml-[40px] pl-1">
                        Basic Facilities の要件を満たさないもの。
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TAB 3: ETOPS === */}
        {activeTab === 'etops' && (
          <div className="animate-in fade-in duration-300 h-full flex flex-col pb-1">

            {/* ★ Adequate Airport の Suitability を上部に配置 ★ */}
            <div className="mb-2 shrink-0">
              {/* 1. ETOPS / Adequate Airport テーブル */}
              <div className="table-container w-full">
                <div className="table-title">【 参考 】 Adequate Airport の Suitability 判定気象条件 (4-14-3)</div>

                {/* ①のブロック */}
                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px solid #475569' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.5rem', textAlign: 'center' }}>
                    ① 飛行実施計画の段階 (立案、検討および承認の段階)
                  </div>
                  <div className="table-notes" style={{ marginBottom: '0.5rem' }}>
                    (1) 着陸予定滑走路は、進入方式および滑走路状態に応じた最大横風値以下であることが予想されること。<br />
                    (2) 当該便の運航に適用できる最低気象条件が、下記の値以上であることが予想されること。
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '12%' }}>滑走路数</th>
                        <th style={{ width: '38%' }}>利用可能な進入方式</th>
                        <th style={{ width: '25%' }}>雲高</th>
                        <th style={{ width: '25%' }}>視程</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center">—</td>
                        <td>CATⅢ運航</td>
                        <td className="text-center">200ft</td>
                        <td className="text-center">RVR 550m <br />or<br /> VIS 800m</td>
                      </tr>
                      <tr>
                        <td className="text-center">—</td>
                        <td>CATⅡ運航</td>
                        <td className="text-center">300ft</td>
                        <td className="text-center">RVR/VIS 1200m</td>
                      </tr>
                      <tr>
                        <td className="text-center">複数(※)</td>
                        <td>滑走路ごとに直線進入方式が設定されており利用可能な場合</td>
                        <td className="text-center">最低のMNMに対して<br /><span className="highlight">DH/MDH + 200ft</span></td>
                        <td className="text-center">最低のMNMに対して<br /><span className="highlight">RVR/VIS + 800m</span></td>
                      </tr>
                      <tr>
                        <td className="text-center">単一</td>
                        <td>CATⅠ、非精密(直線)、計器進入からの周回</td>
                        <td className="text-center">最低のMNMに対して<br /><span className="highlight">DH/MDH + 400ft</span></td>
                        <td className="text-center">最低のMNMに対して<br /><span className="highlight">RVR/VIS + 1600m</span></td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="table-notes" style={{ marginTop: '0.3rem' }}>
                    (※) 複数の滑走路とは、物理的に独立して設置され運用されている2本以上の滑走路を指す。（両進入端での2本はみなさない）
                  </div>
                </div>

                {/* ②のブロック */}
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

            <div className="flex flex-col lg:flex-row gap-2 h-full">

              {/* 4-14-3 */}
              <div className="flex-1 flex flex-col min-h-0 h-full">
                <div className="table-container h-full flex flex-col">
                  <div className="table-title shrink-0 text-sm lg:text-base">4-14-3 ETOPSによる飛行実施計画</div>
                  <div className="flex flex-col gap-2 p-1 overflow-y-auto custom-scrollbar flex-1">

                    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 shadow-sm">
                      <div className="text-xs lg:text-sm font-black text-sky-300 mb-2 border-b border-slate-600 pb-1.5 flex items-center gap-1">
                        <SafeIcon name="CheckSquare" className="w-4 h-4" /> ① ETOPS ALTN Airport の Suitability
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-400 mb-2 leading-relaxed">
                        最も早い予想緊急着陸時刻〜最も遅い予想緊急着陸時刻までの間、以下を満足すること。
                      </div>
                      <ul className="text-[10px] lg:text-xs text-slate-300 flex flex-col gap-2 pl-0 list-none">
                        <li className="flex items-start gap-1.5"><span className="bg-sky-900/50 text-sky-400 px-1.5 py-0.5 rounded font-bold shrink-0 leading-none mt-0.5">(1) 気象</span> <span className="leading-relaxed">一般的運航条件 ＋ 最低気象条件(S-4-16)以上 ＋ 横風制限値以下</span></li>
                        <li className="flex items-start gap-1.5"><span className="bg-sky-900/50 text-sky-400 px-1.5 py-0.5 rounded font-bold shrink-0 leading-none mt-0.5">(2) 滑走路</span> <span className="leading-relaxed">安全に着陸するために十分な長さ</span></li>
                        <li className="flex items-start gap-1.5"><span className="bg-sky-900/50 text-sky-400 px-1.5 py-0.5 rounded font-bold shrink-0 leading-none mt-0.5">(3) 消防</span> <span className="leading-relaxed">ICAO RFFS カテゴリー4以上<br /><span className="text-[9px] lg:text-[10px] text-slate-400 mt-0.5 block">(緊急着陸通報から30分以内に同等支援が得られる場合は例外)</span></span></li>
                        <li className="flex items-start gap-1.5"><span className="bg-sky-900/50 text-sky-400 px-1.5 py-0.5 rounded font-bold shrink-0 leading-none mt-0.5">(4) GPS</span> <span className="leading-relaxed">GPS進入前提の場合、5分を超えるRAIM Holeが予測されていないこと</span></li>
                      </ul>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 shadow-sm">
                      <div className="text-xs lg:text-sm font-black text-sky-300 mb-2 border-b border-slate-600 pb-1.5 flex items-center gap-1">
                        <SafeIcon name="Map" className="w-4 h-4" /> ②〜⑤ 予定飛行経路・通信・航法・搭載燃料
                      </div>
                      <ul className="text-[10px] lg:text-xs text-slate-300 list-disc pl-4 flex flex-col gap-2 mt-1">
                        <li className="leading-relaxed">ETOPS ALTNから一発不作動巡航速度で<strong className="text-white">最大飛行時間の範囲内</strong>に経路を設定</li>
                        <li className="leading-relaxed">良好な音声通信 (不可ならDatalink等の代替手段) を確保し、所要の精度の航法情報を得られること</li>
                        <li className="leading-relaxed">規定燃料と Critical Fuel を比較し<strong className="text-white">多い方</strong>を搭載</li>
                        <li className="leading-relaxed">飛行実施計画書に情報(出発・目的・代替、最大飛行時間)を明示し、操縦室内で参照可能であること</li>
                      </ul>
                    </div>

                  </div>
                </div>
              </div>

              {/* 4-14-4 */}
              <div className="flex-1 flex flex-col min-h-0 h-full">
                <div className="table-container h-full flex flex-col">
                  <div className="table-title shrink-0 text-sm lg:text-base">4-14-4 出発後の飛行継続等に係る判断基準</div>
                  <div className="flex flex-col gap-2 p-1 overflow-y-auto custom-scrollbar flex-1">

                    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 shadow-sm">
                      <div className="text-xs lg:text-sm font-black text-emerald-300 mb-2 border-b border-slate-600 pb-1.5 flex items-center gap-1">
                        <SafeIcon name="Eye" className="w-4 h-4" /> ①〜④ 飛行中の確認と要件未達時の措置
                      </div>
                      <ul className="text-[10px] lg:text-xs text-slate-300 list-disc pl-4 flex flex-col gap-2 mt-1">
                        <li className="leading-relaxed">ETOPS ALTNのSuitabilityを常に把握。最寄りの Adequate Airport も可能な限り把握する。</li>
                        <li className="leading-relaxed"><strong className="text-white">各 ETOPS Entry Point 前</strong>ごとに再検討。(GPS進入前提時はRAIM予測を再確認)</li>
                        <li className="leading-relaxed">
                          <strong className="text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded mr-1">未達時の措置</strong>
                          運航管理者はETOPS ALTNを変更(新代替も最大飛行時間内か確認)し機長へ通報。<br />
                          機長は適切な措置をとる。(※安全上より適切な措置があればそちらを優先)
                        </li>
                        <li className="leading-relaxed">悪天候等で経路変更時も、ETOPS ALTN または Adequate Airport から最大飛行時間の範囲内であること。(※緊急時等は例外)</li>
                      </ul>
                    </div>

                    <div className="bg-rose-900/20 border border-rose-500/30 rounded-lg p-3 shadow-sm">
                      <div className="text-xs lg:text-sm font-black text-rose-400 mb-2 border-b border-rose-500/30 pb-1.5 flex items-center gap-1">
                        <SafeIcon name="AlertOctagon" className="w-4 h-4" /> ⑤ 緊急事態発生時の措置
                      </div>
                      <div className="flex flex-col gap-2 mt-1.5">
                        <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                          <div className="text-[11px] lg:text-sm font-black text-rose-300 mb-1.5 border-l-2 border-rose-400 pl-2 leading-none">一発動機停止</div>
                          <div className="text-[10px] lg:text-xs text-slate-300 leading-relaxed">
                            最も近い(所要時間が短い) Suitabilityをみたす <strong className="text-white bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">Adequate Airport</strong> へ着陸を原則とする。<br />
                            <div className="bg-rose-950/40 p-2 rounded mt-2 border border-rose-900">
                              <span className="text-rose-300 font-bold text-[9px] lg:text-[10px] block mb-1">※以下を主たる理由に他飛行場を選択してはならない</span>
                              <span className="text-slate-400 text-[9px] lg:text-[10px] flex flex-col gap-1 pl-1">
                                <span>1) 十分な燃料を搭載していること</span>
                                <span>2) 安全確保以外の観点で旅客の収容施設の都合が良いこと</span>
                                <span>3) 航空機の整備作業に必要な設備等を確保しやすいこと</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                          <div className="text-[11px] lg:text-sm font-black text-orange-300 mb-1.5 border-l-2 border-orange-400 pl-2 leading-none">主要系統の不具合、その他重大な事態</div>
                          <div className="text-[10px] lg:text-xs text-slate-300 leading-relaxed">
                            最も近い(所要時間が短い) <strong className="text-white bg-orange-500/20 px-1.5 py-0.5 rounded border border-orange-500/30">ETOPS Alternate Airport</strong> へ着陸を原則とする。
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* === TAB 4: FAMILIAR / 空港資格 === */}
        {activeTab === 'familiar' && (
          <div className="animate-in fade-in duration-300">
            <div className="fpl-section">
              <div className="fpl-title text-lg mb-2">【 参考 】 Familiar / Unfamiliar Minima および 空港資格関連</div>
              <div className="legend-note" style={{ marginBottom: '0.75rem' }}>
                ※CATⅠ、Ⅱ、Ⅲ機長の Familiar Minima は、Company Minima 下限値以上かつ、当局設定最低気象条件およびOCA/H以上の値とする。(5-2-5)
              </div>
              <div className="fpl-grid">

                {/* 左カラム */}
                <div className="flex-col">
                  <div className="table-container">
                    <div className="table-title">BASIC1 機長の Familiar Minima (5-2-5 ②)</div>
                    <table className="table-fpl">
                      <tbody>
                        <tr>
                          <td colSpan="2" className="text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#86efac', fontWeight: 'bold', width: '40%' }}>Take-off Minima</td>
                          <td className="text-center">CATⅠ機長の値 または<br /><strong style={{ color: '#f8fafc' }}>0-800/800</strong> のいずれか大きい値</td>
                        </tr>
                        <tr>
                          <td rowSpan="2" className="text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#86efac', fontWeight: 'bold', width: '20%' }}>Landing<br />Minima</td>
                          <td className="text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#86efac', fontWeight: 'bold', width: '20%' }}>精密進入</td>
                          <td className="text-center">CATⅠ機長の値 または<br /><strong style={{ color: '#f8fafc' }}>DH 300-1600</strong> のいずれか大きい値</td>
                        </tr>
                        <tr>
                          <td className="text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#86efac', fontWeight: 'bold' }}>非精密進入、APV<br />または周回進入</td>
                          <td className="text-center">CATⅠ機長の値に<br /><strong style={{ color: '#f8fafc' }}>100-800 を加算</strong> <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 'bold' }}>(注)</span></td>
                        </tr>
                        <tr>
                          <td colSpan="2" className="text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#86efac', fontWeight: 'bold' }}>Alternate Minima</td>
                          <td className="text-center">CATⅠ機長の値</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="table-notes" style={{ marginTop: '0.5rem' }}>
                      <span style={{ color: '#f87171', fontWeight: 'bold' }}>(注)</span> 加算後の値については <strong style={{ color: '#f8fafc' }}>DH/MDH は 600ft、RVR/CMV または VIS は 3200m を上限</strong>とする。CATⅠ機長に適用される値が既に当該値以上である場合は加算を行わず、その値を適用する。
                    </div>
                  </div>

                  <div className="table-container">
                    <div className="table-title">Unfamiliar Minima の設定 (S-5-7)</div>
                    <div className="table-notes" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                      機長が空港資格の飛行場要件を充足していない場合に適用する。(5-2-5)
                    </div>
                    <table className="table-fpl">
                      <thead>
                        <tr>
                          <th colSpan="2" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)' }}></th>
                          <th style={{ width: '65%' }}>CATⅠ、Ⅱ、Ⅲ機長<br />BASIC1 機長</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan="2" className="text-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', color: '#cbd5e1', fontWeight: 'bold' }}>Take-off Minima<br />および<br />Alternate Minima</td>
                          <td className="text-center">当該機長の Familiar Minima</td>
                        </tr>
                        <tr>
                          <td rowSpan="3" className="text-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', color: '#cbd5e1', fontWeight: 'bold', width: '15%' }}>Landing<br />Minima</td>
                          <td className="text-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', color: '#cbd5e1', fontWeight: 'bold', width: '20%' }}>飛行場区分<br />A, B</td>
                          <td className="text-center">当該機長の Familiar Minima</td>
                        </tr>
                        <tr>
                          <td className="text-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', color: '#cbd5e1', fontWeight: 'bold' }}>飛行場区分<br />C</td>
                          <td className="text-center">当該機長の Familiar Minima <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 'bold' }}>(注)</span></td>
                        </tr>
                        <tr>
                          <td className="text-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', color: '#cbd5e1', fontWeight: 'bold' }}>飛行場区分<br />D</td>
                          <td className="text-center">CIG および RVR/CMV または VIS については<br /><strong style={{ color: '#f8fafc' }}>当該空港の Alternate Minima</strong><br /><br />MDH および DH については<br /><strong style={{ color: '#f8fafc' }}>当該機長の Familiar Minima</strong></td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="table-notes" style={{ marginTop: '0.5rem' }}>
                      <span style={{ color: '#f87171', fontWeight: 'bold' }}>(注)</span> 区分Cの非精密進入、APV または周回進入にあっては、Familiar Minima の <strong style={{ color: '#f8fafc' }}>RVR/CMV または VIS の値に 400m を加算</strong>する。ただし、当該 Alternate Minima の値を上限とする。
                    </div>
                  </div>

                  <div className="table-container">
                    <div className="table-title">空港資格を保有しない空港での運用 (S-8-1 抜粋)</div>
                    <div className="table-notes" style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                      以下の場合には空港資格を保有しない空港へ(から)の運航を計画、実施することができる。なお、適用される Company Minima に留意すること。
                      <ul style={{ marginTop: '0.4rem' }}>
                        <li>① <strong style={{ color: '#f8fafc' }}>ダイバート</strong>を実施する場合、およびダイバート空港から正規飛行場を結ぶ路線を運航する場合</li>
                        <li>② <strong style={{ color: '#f8fafc' }}>Provisional / Refueling Airport</strong> を出発地または目的地飛行場として選定する場合 (※事前の知識付与が必要)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 右カラム */}
                <div className="flex-col">
                  <div className="table-container">
                    <div className="table-title">飛行場要件における区分 (飛行場区分) (S-8-1 抜粋)</div>
                    <table className="table-fpl">
                      <thead>
                        <tr>
                          <th style={{ width: '15%' }}>区分</th>
                          <th>空港</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-center font-bold">A1</td>
                          <td className="icao-code" style={{ lineHeight: '1.8' }}>
                            <span className="b777-green">RJCC</span>, RJCW, RJCN, <span className="b777-red">RJCK</span>, <span className="b777-green">RJCH</span>, <span className="b777-green">RJEC</span>, RJSR, <span className="b777-yellow">RJSK</span>, RJSY, <span className="b777-yellow">RJSS</span>, RJSN, RJNT, <span className="b777-yellow">RJNK</span>, RJNW, <span className="b777-green">RJTT</span>, <span className="b777-yellow">RJAA</span>, <span className="b777-yellow">RJGG</span>, <span className="b777-yellow">RJOO</span>, <span className="b777-yellow">RJBB</span>, <span className="b777-yellow">RJBE</span>, <span className="b777-yellow">RJOB</span>, <span className="b777-yellow">RJOA</span>, RJOW, <span className="b777-yellow">RJDC</span>, RJOI, RJOR, <span className="b777-red">RJOH</span>, <span className="b777-yellow">RJOT</span>, RJOS, <span className="b777-yellow">RJOM</span>, <span className="b777-yellow">RJOK</span>, <span className="b777-green">RJFF</span>, RJFR, <span className="b777-red">RJFS</span>, RJFO, <span className="b777-yellow">RJFT</span>, <span className="b777-green">RJFU</span>, <span className="b777-yellow">RJFM</span>, <span className="b777-yellow">RJFK</span>, <span className="b777-yellow">ROAH</span>, <span className="b777-red">ROMY</span>, <span className="b777-red">ROIG</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold">A2</td>
                          <td>
                            <div className="area-row"><span className="area-tag">[北米]</span><span className="icao-code">KIAD, KSEA, KIAH, CYVR</span></div>
                            <div className="area-row"><span className="area-tag">[欧州]</span><span className="icao-code">EDDF, EDDM, EBBR, LOWW, ESSA, LTFM</span></div>
                            <div className="area-row"><span className="area-tag">[東ア]</span><span className="icao-code">ZSPD, ZSSS</span></div>
                            <div className="area-row"><span className="area-tag">[東南]</span><span className="icao-code">VHHH, RPLL, VVTS, VTBS, WSSS, WMKK</span></div>
                            <div className="area-row"><span className="area-tag">[南太]</span><span className="icao-code">PHNL, YPPH</span></div>
                            <div className="area-row"><span className="area-tag">[基本]</span><span className="icao-code">RCTP</span></div>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold">B</td>
                          <td>
                            <div className="area-row"><span className="area-tag">[北米]</span><span className="icao-code">KJFK, KLAX, KORD</span></div>
                            <div className="area-row"><span className="area-tag">[欧州]</span><span className="icao-code">EGLL, LFPG, LIMC, UUDD</span></div>
                            <div className="area-row"><span className="area-tag">[東ア]</span><span className="icao-code">UHWW, ZBAA, ZYTL, ZSHC, ZGGG, ZSQD, ZSAM, ZGSZ, VVNB</span></div>
                            <div className="area-row"><span className="area-tag">[東南]</span><span className="icao-code">WIII</span></div>
                            <div className="area-row"><span className="area-tag">[西南]</span><span className="icao-code">VABB, VIDP</span></div>
                            <div className="area-row"><span className="area-tag">[南太]</span><span className="icao-code">PGUM, YSSY</span></div>
                            <div className="area-row"><span className="area-tag">[基本]</span><span className="icao-code">RKSI, RKSS, RCSS</span></div>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold">C</td>
                          <td className="icao-code">KSFO, MMMX</td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold">D</td>
                          <td><span className="icao-code">RJTH</span> (八丈島)</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="table-notes" style={{ marginTop: '0.5rem' }}>
                      ・標準的な空港 (A,B)、特殊な空港 (C)、非常に特殊な空港 (D) に区分される。<br />
                      ・<span style={{ fontWeight: 'bold', color: '#fb7185' }}>RJNT（富山）および表に定めのない空港については、飛行場区分「C」として取扱う。</span><br />
                      ・A1の背景色はB777の制約 (<span className="b777-green">緑:全型式</span>、<span className="b777-yellow">黄:資格相違</span>、<span className="b777-red">赤:制限有</span>、無色:不可) を示します。
                    </div>
                  </div>

                  <div className="table-container">
                    <div className="table-title">B777 使用可能飛行場と型式制限 (国内)</div>
                    <table className="table-fpl">
                      <tbody>
                        <tr>
                          <td className="text-center font-bold" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', width: '22%' }}>全型式<br />共通</td>
                          <td>
                            <div className="area-row"><span className="type-tag-sm">[◎正規]</span><span className="icao-code">RJCC, RJCH, RJTT, RJFF, RJFU</span></div>
                            <div className="area-row"><span className="type-tag-sm">[○指定]</span><span className="icao-code">RJEC, RJSM, RJTY, RODN</span></div>
                            <div className="area-row"><span className="type-tag-sm">[●Adeq]</span><span className="icao-code">RORS</span></div>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#fde047' }}>型式で<br />資格相違</td>
                          <td>
                            <div className="area-row"><span className="type-tag">[-300ER:○ -300/-200/F:◎]</span><span className="icao-code">RJAA, RJOO, RJNK, RJOT, RJFK, ROAH</span></div>
                            <div className="area-row"><span className="type-tag">[-300ER/-300/-200:○ F:◎]</span><span className="icao-code">RJSK, RJSS, RJOB, RJDC</span></div>
                            <div className="area-row"><span className="type-tag">[-300ER/F:○ -300/-200:◎]</span><span className="icao-code">RJBB, RJFT</span></div>
                            <div className="area-row"><span className="type-tag">[-300ER/F:○ -300/-200:●]</span><span className="icao-code">RJGG</span></div>
                            <div className="area-row"><span className="type-tag">[-300ER:○ F:● -300/-200:◎]</span><span className="icao-code">RJFM</span></div>
                            <div className="area-row"><span className="type-tag">[-300ER:● -300/-200/F:◎]</span><span className="icao-code">RJOA, RJOM</span></div>
                            <div className="area-row"><span className="type-tag">[-300ER/-300/-200:● F:◎]</span><span className="icao-code">RJOK</span></div>
                            <div className="area-row"><span className="type-tag">[-200/-300:○ 300ER/F:不可]</span><span className="icao-code">RJBE</span></div>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>不可・<br />制限あり</td>
                          <td>
                            <div className="area-row"><span className="type-tag">[-200 のみ ◎]</span><span className="icao-code">RJOH, RJFS, ROMY</span></div>
                            <div className="area-row"><span className="type-tag">[PW不可 (●)]</span><span className="icao-code">RJCM, RJCK, RJAW</span></div>
                            <div className="area-row"><span className="type-tag">[-300ER PW不可 / -200/-300:(注6)]</span><span className="icao-code">ROIG</span></div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="table-notes" style={{ marginTop: '0.5rem' }}>
                      ・◎:正規 / ○:その他の指定 / ●:Adequate Airport<br />
                      ・表に記載のない国内空港は、B777全型式で使用不可。<br />
                      ・(注1) RJCN, RJFS はターニングパッドが寒冷地用でないため、Dry/Wet 以外(雪氷等)の場合は使用不可。<br />
                      ・(注4) RJTH は滑走路が雪氷状態の場合は使用不可。<br />
                      ・(注5) RJOI 等は気象条件による飛行中の目的地変更などの特定条件下でのみ代替として使用可。<br />
                      ・(注6) ROIG は出発地飛行場、目的地飛行場または Adequate Airport としての使用に限定する。
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* === TAB 5: FPL 記号一覧 === */}
        {activeTab === 'fpl' && (
          <div className="animate-in fade-in duration-300">
            <div className="fpl-section">
              <div className="fpl-title text-lg mb-2">【 参考 】 飛行計画 (FPL) 記入記号 一覧 (完全版)</div>
              <div className="fpl-legend">
                <span className="fpl-badge badge-common">共通</span> <span className="fpl-badge badge-dom">国内</span> <span className="fpl-badge badge-int">国際</span>
              </div>
              <div className="legend-note">
                ※「国内線のみ」の L(ILS), O(VOR), V(VHF) は、外国FIRを航行する際「S」を記入すれば省略できるため、国際線の画像には表示されていません。<br />
                ※「国際線のみ」の J1(ATN VDL2), EET/(所要時間), RMK/(備考) は、要件に応じて国内線でも使用される場合がありますが、今回の画像群に基づき分類しています。
              </div>
              <div className="fpl-grid">

                {/* ★ 左カラム: 第8, 9, 18, 19項を配置 (計50行) ★ */}
                <div className="flex-col">
                  <div className="table-container">
                    <div className="table-title">第8項 飛行方式及び飛行の種類</div>
                    <table className="table-fpl">
                      <tbody>
                        <tr><td colSpan="2" style={{ background: 'rgba(15, 23, 42, 0.4)', textAlign: 'center' }}>--- 飛行方式 ---</td></tr>
                        <tr><td><span className="fpl-badge badge-common">I</span></td><td>IFRで飛行する場合</td></tr>
                        <tr><td>V</td><td>VFRで飛行する場合</td></tr>
                        <tr><td>Y</td><td>IFRで出発し飛行中に飛行方式を1回以上変更する場合</td></tr>
                        <tr><td>Z</td><td>VFRで出発し飛行中に飛行方式を1回以上変更する場合</td></tr>
                        <tr><td colSpan="2" style={{ background: 'rgba(15, 23, 42, 0.4)', textAlign: 'center' }}>--- 飛行の種類 ---</td></tr>
                        <tr><td><span className="fpl-badge badge-common">S</span></td><td>航空運送事業 (定期) に係る飛行 (外国人国際航空運送事業者の行うもの及び臨時便を含む。)</td></tr>
                        <tr><td>N</td><td>航空運送事業 (定期以外) に係る飛行 (外国人国際航空運送事業者の行うものを含む。)</td></tr>
                        <tr><td>G</td><td>航空機使用事業に係る飛行、訓練飛行、試験飛行、空輸及び自家用機の行う飛行</td></tr>
                        <tr><td>M</td><td>軍用機の行う飛行</td></tr>
                        <tr><td>X</td><td>その他の飛行</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="table-container">
                    <div className="table-title">第9項 後方乱気流区分</div>
                    <table className="table-fpl">
                      <tbody>
                        <tr><td><span className="fpl-badge badge-common">H</span></td><td>最大離陸重量が136,000kg (300,000ポンド)以上の航空機<br />※エアバス式A380-800型の航空機にあっては「J」を記入</td></tr>
                        <tr><td>M</td><td>最大離陸重量が7,000kg (15,500ポンド)を超え 136,000kg (300,000ポンド) 未満の航空機</td></tr>
                        <tr><td>L</td><td>最大離陸重量が7,000kg (15,500ポンド) 以下の航空機</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="table-container">
                    <div className="table-title">第18項 その他の情報</div>
                    <table className="table-fpl">
                      <tbody>
                        <tr><td>STS/</td><td>航空交通業務上特別の処理を必要とする理由<br />(ALTRV, ATFMX, FFR, FLTCK, HAZMAT, HEAD, HOSP, HUM, MARSA, MEDEVAC, NONRVSM, SAR, STATE)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">PBN/</span></td><td>RNAV、RNPの種別 (※下表参照)</td></tr>
                        <tr><td>NAV/</td><td>GNSS補強の種類 または 第10a項に記載されていない航行機器</td></tr>
                        <tr><td>COM/</td><td>第10a項に記載されていない無線通信機器</td></tr>
                        <tr>
                          <td><span className="fpl-badge badge-common">DAT/</span></td>
                          <td>第10a項に記載されていないデータリンク機器<br />
                            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>※CPDLCX</span> : ATN B1 装備義務免除対象 (B787等)<br />
                            <span style={{ color: '#fb923c', fontWeight: 'bold' }}>※1FANSER</span> : 米国 CPDLC DCL ＆ 陸域CPDLC 実施可能<br />
                            <span style={{ color: '#fb923c', fontWeight: 'bold' }}>※1FANSP</span> : 米国 CPDLC DCL のみ実施可能
                          </td>
                        </tr>
                        <tr><td><span className="fpl-badge badge-common">SUR/</span></td><td>第10b項に記載されていない監視機器 または RSPの種別</td></tr>
                        <tr><td>DEP/</td><td>出発飛行場名 (第13項に「ZZZZ」を記入した場合)</td></tr>
                        <tr><td>DEST/</td><td>目的飛行場名 (第16項に「ZZZZ」を記入した場合)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">DOF/</span></td><td>出発日 (YYMMDD) ※移動開始時刻が24時間以降の飛行計画を提出する場合</td></tr>
                        <tr><td><span className="fpl-badge badge-common">REG/</span></td><td>航空機の国籍記号及び登録記号</td></tr>
                        <tr><td><span className="fpl-badge badge-int">EET/</span></td><td>要求された地点又はFIRの境界を示すICAO4文字地点略号、及び離陸してから当該地点に至るまでの所要時間</td></tr>
                        <tr><td><span className="fpl-badge badge-common">SEL/</span></td><td>セルコールコード</td></tr>
                        <tr><td>TYP/</td><td>航空機の型式</td></tr>
                        <tr><td>OPR/</td><td>運航者を示すICAO3文字略号 または 運航者名</td></tr>
                        <tr><td>ORGN/</td><td>飛行計画に関する問い合わせ先のAFTNアドレス又は連絡先</td></tr>
                        <tr><td>ALTN/</td><td>代替目的飛行場名 (第16項に「ZZZZ」を記入した場合)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">RALT/</span></td><td>途中経路における代替飛行場名</td></tr>
                        <tr><td>TALT/</td><td>離陸代替飛行場名</td></tr>
                        <tr><td><span className="fpl-badge badge-int">RMK/</span></td><td>飛行目的若しくは当局又は機長が航空交通業務に関し必要と認める事項</td></tr>
                        <tr><td><span className="fpl-badge badge-common">CODE/</span></td><td>航空機アドレス (Mode S Address) ※画像記載(一覧外)</td></tr>
                        <tr><td colSpan="2" style={{ background: 'rgba(15, 23, 42, 0.4)', textAlign: 'center' }}>--- PBN/ (RNAV・RNPの種別) ---</td></tr>
                        <tr><td><span className="fpl-badge badge-common">A1</span></td><td>RNAV10 (RNP10)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">B1</span> / B2〜B6</td><td><strong>RNAV5</strong> (1:許可されたセンサー全て / 2:GNSS / 3:DME/DME / 4:VOR/DME / 5:INS又はIRS / 6:LORAN C)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">C1</span> / C2〜C4</td><td><strong>RNAV2</strong> (1:許可されたセンサー全て / 2:GNSS / 3:DME/DME / 4:DME/DME/IRU)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">D1</span> / D2〜D4</td><td><strong>RNAV1</strong> (1:許可されたセンサー全て / 2:GNSS / 3:DME/DME / 4:DME/DME/IRU)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">L1</span></td><td>RNP4</td></tr>
                        <tr><td><span className="fpl-badge badge-common">O1</span> / O2〜O4</td><td><strong>Basic RNP1</strong> (1:許可されたセンサー全て / 2:GNSS / 3:DME/DME / 4:DME/DME/IRU)</td></tr>
                        <tr><td>S1 / <span className="fpl-badge badge-common">S2</span></td><td><strong>RNP APCH</strong> (1:RNP APCH / 2:BARO-VNAV有りのRNP APCH)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">T1</span> / T2</td><td><strong>RNP AR APCH</strong> ※特別承認が必要 (1:RF有りのRNP AR APCH / 2:RF無しのRNP AR APCH)</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="table-container">
                    <div className="table-title">第19項 補足情報</div>
                    <table className="table-fpl">
                      <tbody>
                        <tr><td><span className="fpl-badge badge-common">E/</span></td><td>燃料搭載量を持久時間で表示 (4桁の数字で分の単位まで)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">P/</span></td><td>搭乗する総人数 (不明な場合は「TBN」)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">R/</span></td><td>航空機用救命無線機 (使えないものを抹消。 U: UHF 243.0MHz / V: VHF 121.5MHz / E: ELT)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">S/</span></td><td>救急用具 (搭載していないものを抹消。 P: 極地用 / D: 砂漠用 / M: 海上用 / J: 密林用)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">J/</span></td><td>救命胴衣 (搭載していないものを抹消。 L: 灯火付き / F: 蛍光発光染料付き / U: UHF無線機付き / V: VHF無線機付き)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">D/</span></td><td>搭載している救命ボートの数、矢印「→」の次に全収容人員数、「C→」の次に救命ボートの色を記入。</td></tr>
                        <tr><td><span className="fpl-badge badge-common">A/</span></td><td>航空機の色及び主要なマーキングの説明書き</td></tr>
                        <tr><td>N/</td><td>その他の搭載救急用具及び救急用具に関する特記事項 (備考がなければNを抹消)</td></tr>
                        <tr><td><span className="fpl-badge badge-common">C/</span></td><td>機長の氏名</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ★ 右カラム: 第10項 (a+b) を配置 (計53行) ★ */}
                <div className="flex-col">
                  <div className="table-container">
                    <div className="table-title">第10項 無線設備等装備の種類及び性能、並びに航空機の能力 (a:通信/航行)</div>
                    <table className="table-fpl">
                      <tbody>
                        <tr><td colSpan="2" style={{ background: 'rgba(15, 23, 42, 0.4)', textAlign: 'center' }}>--- 装備区分 ---</td></tr>
                        <tr><td>N</td><td>航空法の規定により装備が義務づけられている使用可能な無線設備の一部又は全部を装備していない場合</td></tr>
                        <tr><td><span className="fpl-badge badge-common">S</span></td><td>航空法の規定により装備が義務づけられている使用可能な無線設備を装備している場合</td></tr>
                        <tr><td colSpan="2" style={{ background: 'rgba(15, 23, 42, 0.4)', textAlign: 'center' }}>--- 使用可能な搭載機器種類及び性能、並びに航空機の能力 ---</td></tr>
                        <tr><td>A</td><td>GBAS着陸システム</td></tr>
                        <tr><td>B</td><td>LPV (APV with SBAS)</td></tr>
                        <tr><td>C</td><td>LORAN C</td></tr>
                        <tr><td><span className="fpl-badge badge-common">D</span></td><td>DME</td></tr>
                        <tr><td>E1</td><td>FMC WPR ACARS</td></tr>
                        <tr><td><span className="fpl-badge badge-common">E2</span></td><td>D-FIS ACARS</td></tr>
                        <tr><td>E3</td><td>PDC ACARS</td></tr>
                        <tr><td><span className="fpl-badge badge-common">F</span></td><td>ADF</td></tr>
                        <tr><td><span className="fpl-badge badge-common">G</span></td><td>GNSS</td></tr>
                        <tr><td><span className="fpl-badge badge-common">H</span></td><td>HF 無線電話</td></tr>
                        <tr><td><span className="fpl-badge badge-common">I</span></td><td>慣性航法装置</td></tr>
                        <tr><td><span className="fpl-badge badge-int">J1</span></td><td>CPDLC ATN VDL モード2<br /><span style={{ color: '#94a3b8' }}>(ATN B1 VDL (VHF Digital Link) Mode 2)</span></td></tr>
                        <tr><td>J2</td><td>CPDLC FANS 1/A HFDL</td></tr>
                        <tr><td><span className="fpl-badge badge-common">J3</span></td><td>CPDLC FANS 1/A VDL モードA</td></tr>
                        <tr><td><span className="fpl-badge badge-int">J4</span></td><td>CPDLC FANS 1/A VDL モード2</td></tr>
                        <tr><td><span className="fpl-badge badge-common">J5</span></td><td>CPDLC FANS 1/A SATCOM (INMARSAT)</td></tr>
                        <tr><td>J6</td><td>CPDLC FANS 1/A SATCOM (MTSAT)</td></tr>
                        <tr><td>J7</td><td>CPDLC FANS 1/A SATCOM (Iridium)</td></tr>
                        <tr><td>K</td><td>MLS</td></tr>
                        <tr><td><span className="fpl-badge badge-dom">L</span></td><td>ILS</td></tr>
                        <tr><td><span className="fpl-badge badge-common">M1</span></td><td>ATC SATVOICE (INMARSAT)</td></tr>
                        <tr><td>M2</td><td>ATC SATVOICE (MTSAT)</td></tr>
                        <tr><td>M3</td><td>ATC SATVOICE (Iridium)</td></tr>
                        <tr><td><span className="fpl-badge badge-dom">O</span></td><td>VOR</td></tr>
                        <tr><td>P1</td><td>CPDLC RCP 400</td></tr>
                        <tr><td><span className="fpl-badge badge-common">P2</span></td><td>CPDLC RCP 240</td></tr>
                        <tr><td>P3</td><td>SATVOICE RCP 400</td></tr>
                        <tr><td><span className="fpl-badge badge-common">R</span></td><td>PBN航行の許可</td></tr>
                        <tr><td>T</td><td>TACAN</td></tr>
                        <tr><td>U</td><td>UHF無線電話</td></tr>
                        <tr><td><span className="fpl-badge badge-dom">V</span></td><td>VHF無線電話</td></tr>
                        <tr><td><span className="fpl-badge badge-common">W</span></td><td>RVSM航行の許可</td></tr>
                        <tr><td><span className="fpl-badge badge-common">X</span></td><td>MNPS航行の許可</td></tr>
                        <tr><td><span className="fpl-badge badge-common">Y</span></td><td>8.33kHzチャンネル間隔能力を有するVHF</td></tr>
                        <tr><td><span className="fpl-badge badge-int">Z</span></td><td>その他搭載機器又は能力</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="table-container">
                    <div className="table-title">第10項 無線設備等装備の種類及び性能、並びに航空機の能力 (b:監視)</div>
                    <table className="table-fpl">
                      <tbody>
                        <tr><td>N</td><td>監視機器を搭載していない場合又は使用不能の場合</td></tr>
                        <tr><td>A</td><td>SSRモード トランスポンダーモードA/3 (4096コードのもの)を搭載している場合</td></tr>
                        <tr><td>C</td><td>SSRモード トランスポンダーモードA/3 (4096コードのもの)及びモードCを搭載している場合</td></tr>
                        <tr><td>E</td><td>トランスポンダーモードS (航空機識別、気圧高度及び拡張スキッタ (ADS-B)の性能を有するもの)を搭載している場合</td></tr>
                        <tr><td>H</td><td>トランスポンダーモードS (航空機識別、気圧高度及び発展型監視の性能を有するもの)を搭載している場合</td></tr>
                        <tr><td>I</td><td>トランスポンダーモードS (航空機識別の能力を有し、気圧高度の性能を有しないもの)を搭載している場合</td></tr>
                        <tr><td><span className="fpl-badge badge-common">L</span></td><td>トランスポンダーモードS (航空機識別、気圧高度、拡張スキッタ (ADS-B) 及び発展型監視の性能を有するもの)を搭載している場合</td></tr>
                        <tr><td>P</td><td>トランスポンダーモードS (気圧高度の能力を有し、航空機識別の性能を有しないもの)を搭載している場合</td></tr>
                        <tr><td>S</td><td>トランスポンダーモードS (航空機識別及び気圧高度の性能を有するもの)を搭載している場合</td></tr>
                        <tr><td>X</td><td>トランスポンダーモードS (航空機識別及び気圧高度の性能を有しないもの)を搭載している場合</td></tr>
                        <tr><td><span className="fpl-badge badge-common">B1</span></td><td>ADS-B(専用周波数1090MHzのADS-B「OUT」の性能を有するもの)を搭載し、航空当局からその使用が認められている場合</td></tr>
                        <tr><td>B2</td><td>ADS-B(専用周波数1090MHzのADS-B「OUT」及び「IN」の性能を有するもの)を搭載し、航空当局からその使用が認められている場合</td></tr>
                        <tr><td>U1</td><td>ADS-B (ユニバーサル・アクセス・トランシーバ (UAT) を使用した 「OUT」の性能を有するもの)を搭載し、航空当局からその使用が認められている場合</td></tr>
                        <tr><td>U2</td><td>ADS-B (ユニバーサル・アクセス・トランシーバ (UAT) を使用した「OUT」及び「IN」の性能を有するもの)を搭載し、航空当局からその使用を認められている場合</td></tr>
                        <tr><td>V1</td><td>ADS-B (VDLモード4を使用した「OUT」の性能を有するもの)を搭載し、航空当局からその使用を認められている場合</td></tr>
                        <tr><td>V2</td><td>ADS-B (VDLモード4を使用した「OUT」及び「IN」の性能を有するもの)を搭載し航空当局からその使用を認められている場合</td></tr>
                        <tr><td><span className="fpl-badge badge-common">D1</span></td><td>ADS-C (FANS 1/Aの性能を有するもの)を搭載している場合</td></tr>
                        <tr><td>G1</td><td>ADS-C (ATNの性能を有するもの)を搭載している場合</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- [5-2] Docs2View (DOCS) ---
// --- [5-2] Docs2View (DOCS) ---
const Docs2View = () => {
  const [activeTab, setActiveTab] = useState('classification');

  // --- 改行や特定のキーワード（[国内]/[国際]など）を安全にパースして表示する統合レンダラー ---
  const renderCellText = (text) => {
    if (!text) return null;

    let processedText = text;
    let hasWarning = false;

    // (※旅客機には搭載禁止) の特別なバッジ処理
    if (processedText.includes("(※旅客機には搭載禁止)")) {
      hasWarning = true;
      processedText = processedText.replace("(※旅客機には搭載禁止)", "").trim();
    }

    const lines = processedText.split('\n').map((line, idx) => {
      // [国内] と [国際] をタグに変換
      const parts = line.split(/(\[国内\]|\[国際\])/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part === '[国内]') {
          return <span key={pIdx} className="inline-block px-1.5 py-0.5 mr-1 bg-blue-500/20 text-blue-300 border border-blue-400/40 rounded text-[9px] font-black leading-none align-text-bottom tracking-widest shadow-sm">国内</span>;
        }
        if (part === '[国際]') {
          return <span key={pIdx} className="inline-block px-1.5 py-0.5 mr-1 bg-orange-500/20 text-orange-300 border border-orange-400/40 rounded text-[9px] font-black leading-none align-text-bottom tracking-widest shadow-sm">国際</span>;
        }
        return <span key={pIdx}>{part}</span>;
      });

      return (
        <span key={idx} className="block">
          {formattedLine}
        </span>
      );
    });

    return (
      <div className="flex flex-col gap-0.5">
        {hasWarning && <span className="text-[9px] sm:text-[10px] text-rose-400 font-black block mb-0.5 leading-tight border border-rose-500/30 bg-rose-950/40 w-fit max-w-full break-words px-1 py-0.5 rounded shadow-sm">(※旅客機には搭載禁止)</span>}
        {lines}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-700 mt-0.5 animate-in fade-in duration-300 overflow-hidden">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-2 lg:p-3 border-b border-slate-700/50 bg-slate-900/30 shrink-0 gap-2">
        <div className="flex items-center gap-2 px-2">
          <SafeIcon name="PackageWarning" className="w-4 h-4 lg:w-5 lg:h-5 text-pink-400" />
          <h2 className="text-sm lg:text-base font-black uppercase tracking-widest text-pink-100">DOCS</h2>
        </div>

        <div className="flex bg-slate-700/80 p-1 rounded-lg border border-slate-500 shadow-inner items-center shrink-0">
          <button
            onClick={() => setActiveTab('classification')}
            className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ${activeTab === 'classification' ? 'bg-pink-600 text-white border border-pink-400 shadow-[0_0_10px_rgba(219,39,119,0.5)]' : 'text-slate-300 border border-transparent hover:bg-slate-600'
              }`}
          >
            <SafeIcon name="List" className="w-3 h-3" />
            <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">分類表(DG)</span>
          </button>
          <button
            onClick={() => setActiveTab('erg')}
            className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ml-1 ${activeTab === 'erg' ? 'bg-rose-600 text-white border border-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.5)]' : 'text-slate-300 border border-transparent hover:bg-slate-600'
              }`}
          >
            <SafeIcon name="AlertTriangle" className="w-3 h-3" />
            <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">ERG CODE</span>
          </button>
          <button
            onClick={() => setActiveTab('special_pax')}
            className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ml-1 ${activeTab === 'special_pax' ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-slate-300 border border-transparent hover:bg-slate-600'
              }`}
          >
            <SafeIcon name="Users" className="w-3 h-3" />
            <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">配慮を要する旅客</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full p-2 lg:p-4 overflow-y-auto custom-scrollbar bg-slate-900/30">
        <div className="flex flex-col gap-6 lg:gap-8 max-w-[1400px] mx-auto pb-4">

          {/* ================================== */}
          {/* --- CLASSIFICATION SECTION --- */}
          {/* ================================== */}
          {activeTab === 'classification' && (
            <div className="flex flex-col gap-6 lg:gap-8 animate-in fade-in">

              {/* 要約規定セクション */}
              <div className="flex flex-col gap-3">
                <h3 className="text-pink-400 font-black tracking-widest text-sm flex items-center gap-2 border-b border-slate-700/80 pb-1.5 px-1">
                  <SafeIcon name="Info" className="w-4 h-4" /> 危険物の航空輸送に関する規定要約 (抜粋)
                </h3>

                <div className="flex flex-col gap-4">
                  {/* 最大許容搭載量 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg">
                    <h4 className="text-sky-400 font-black text-xs mb-2">1. 最大許容搭載量 (B777/B777F)</h4>
                    <div className="overflow-x-auto custom-scrollbar pb-1">
                      <table className="w-full text-left border-collapse min-w-[450px]">
                        <thead>
                          <tr className="bg-slate-700/50 text-slate-300 text-[9px] lg:text-[10px] border-b border-slate-600">
                            <th className="p-1.5 border-r border-slate-600 whitespace-nowrap w-[15%]">分類</th>
                            <th className="p-1.5 border-r border-slate-600 whitespace-nowrap w-[35%]">対象</th>
                            <th className="p-1.5 border-r border-slate-600 whitespace-nowrap w-[25%]">最大搭載量</th>
                            <th className="p-1.5 whitespace-nowrap w-[25%]">備考</th>
                          </tr>
                        </thead>
                        <tbody className="text-[10px] lg:text-[11px] text-slate-300">
                          {/* 火薬類 */}
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-sky-300">火薬類</td>
                            <td className="p-1.5 border-r border-slate-600/50">1貨物室あたり</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">250kg <span className="text-[9px] font-normal text-slate-400">(550lbs)</span></td>
                            <td className="p-1.5 text-[9px] text-slate-400">全機種共通</td>
                          </tr>
                          {/* 放射性物質 */}
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-sky-300" rowSpan="4">放射性物質</td>
                            <td className="p-1.5 border-r border-slate-600/50">1機あたり (B777)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">32 単位</td>
                            <td className="p-1.5 text-[9px] text-rose-300 bg-rose-500/10" rowSpan="4">核分裂物質の<br />搭載不可</td>
                          </tr>
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50">ULD/Bulk (B777)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">8 単位</td>
                          </tr>
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50">1機あたり (B777F)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">200 単位</td>
                          </tr>
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50">ULD/Bulk (B777F)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">50 単位</td>
                          </tr>
                          {/* ドライアイス */}
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-sky-300" rowSpan="3">ドライアイス</td>
                            <td className="p-1.5 border-r border-slate-600/50">1機 (-300/300ER)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">800kg</td>
                            <td className="p-1.5 text-[9px] text-slate-400" rowSpan="3"></td>
                          </tr>
                          <tr className="border-b border-slate-600/50">
                            <td className="p-1.5 border-r border-slate-600/50">1機 (-200)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">600kg</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 border-r border-slate-600/50">1機 (B777F)</td>
                            <td className="p-1.5 border-r border-slate-600/50 font-bold text-emerald-400">2,300kg <span className="text-[9px] font-normal text-slate-400">(L/D 500kg)</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 危険物の隔離 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-3">
                      <h4 className="text-sky-400 font-black text-xs">2. 危険物の隔離</h4>
                      <ul className="text-slate-300 text-[10px] space-y-0.5 list-disc list-inside">
                        <li>隔離を要する物件同士は<strong className="text-rose-300">最低3m(10ft)の間隔</strong>を置く。</li>
                        <li>ドライアイスと動物間も<strong className="text-rose-300">最低3m(10ft)隔離</strong>。</li>
                        <li>放射性物質と火薬類(区分S以外)等は、<strong className="text-rose-300">同一貨物室に搭載不可</strong>。</li>
                      </ul>
                    </div>

                    <h5 className="text-slate-300 font-bold text-[10px] lg:text-xs mb-1.5 flex items-center gap-2 mt-4">
                      <SafeIcon name="Grid" className="w-3.5 h-3.5" /> 【告示別表第14】輸送許容物件相互の隔離表
                    </h5>
                    <div className="overflow-x-auto rounded-lg border border-slate-600/50 custom-scrollbar pb-1">
                      <table className="w-full text-center border-collapse min-w-[850px] text-[9px] lg:text-[10px]">
                        <thead>
                          <tr className="bg-slate-700/50 text-slate-300 border-b border-slate-600">
                            <th className="py-0.5 px-1 border-r border-slate-600 font-bold w-48 text-left whitespace-nowrap">分類または区分</th>
                            {ISOLATION_COLS_FINAL.map((col, idx) => {
                              return (
                                <th key={idx} className="py-0.5 px-1 border-r border-slate-600 font-mono font-black text-sky-400 text-center whitespace-nowrap align-middle bg-slate-900/40 tracking-tighter text-[13px] lg:text-[15px]">
                                  {col}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="text-slate-300">
                          {ISOLATION_MATRIX_FINAL.map((row, rIdx) => (
                            <tr key={rIdx} className={`border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors ${rIdx < 2 ? 'bg-slate-800/10' : ''}`}>
                              <td className="py-0.5 px-1 border-r border-slate-600/50 bg-slate-800/40">
                                <div className="flex items-center justify-between gap-1 w-full pl-0.5 pr-0">
                                  <span className="font-bold text-slate-200 text-[10px] lg:text-[11px] leading-tight text-left">
                                    {row.label}
                                  </span>
                                  {row.code && (
                                    <span className="text-[13px] lg:text-[15px] font-mono font-bold text-sky-400 tracking-tighter whitespace-nowrap shrink-0 text-right">
                                      {row.code}
                                    </span>
                                  )}
                                </div>
                              </td>
                              {row.data.map((val, cIdx) => (
                                <td key={cIdx} className="py-0.5 px-1 border-r border-slate-600/50 align-middle">
                                  {val === '×' && <span className="text-rose-400 font-black text-[15px] lg:text-[17px]">×</span>}
                                  {val === '注' && <span className="text-amber-400 font-black text-[11px] lg:text-[13px]">注</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* ★ 危険物分類表（横スクロールなしの固定レイアウト） ★ */}
              <div className="flex flex-col gap-2 lg:gap-3">
                <h3 className="text-pink-400 font-black tracking-widest text-sm flex items-center gap-2 border-b border-slate-700/80 pb-1.5 px-1">
                  <SafeIcon name="List" className="w-4 h-4" /> 危険物分類表 (CLASSIFICATION)
                </h3>
                <div className="w-full overflow-x-auto rounded-xl border border-slate-600 shadow-xl bg-slate-800/50 custom-scrollbar">
                  <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-700 text-slate-200 border-b border-slate-500">
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black border-r border-slate-600 w-[12%] leading-tight">分類<br /> Class</th>
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black border-r border-slate-600 w-[16%] leading-tight">区分<br /> DIV</th>
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black border-r border-slate-600 w-[12%] text-center leading-tight">Code</th>
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black border-r border-slate-600 w-[25%] leading-tight">主な品名、他</th>
                        <th className="p-2 lg:p-3 text-[11px] lg:text-sm font-black w-[35%] leading-tight">事故時の応急処理</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DG_DATA.flatMap((group, gIdx) =>
                        group.items.map((item, iIdx) => (
                          <tr key={`${gIdx}-${iIdx}`} className={`border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors ${iIdx === group.items.length - 1 ? 'border-b-2 border-b-slate-500' : ''}`}>
                            {iIdx === 0 && (
                              <td rowSpan={group.items.length} className="p-2 lg:p-3 border-r border-slate-600 align-top bg-slate-800/40 break-words">
                                <div className="flex flex-col gap-1 items-center text-center mt-1 lg:mt-2">
                                  <span className="text-xl lg:text-2xl font-black text-sky-400">{group.class}</span>
                                  <span className="text-[10px] lg:text-xs font-bold text-slate-300 whitespace-pre-wrap leading-tight">{renderCellText(group.name)}</span>
                                </div>
                              </td>
                            )}
                            <td className="p-2 lg:p-3 border-r border-slate-600/50 align-middle break-words">
                              <span className="text-[11px] lg:text-xs font-bold text-slate-200 whitespace-pre-wrap leading-relaxed block">
                                {renderCellText(item.div)}
                              </span>
                            </td>
                            <td className="p-2 lg:p-3 border-r border-slate-600/50 align-middle text-center break-words">
                              <div className="flex flex-col gap-2 items-center justify-center w-full">
                                {item.code.split('\n').map((c, cIdx) => (
                                  <span key={cIdx} className="text-[12px] lg:text-[14px] font-mono font-black text-sky-100 bg-sky-600/60 px-2 py-1 lg:py-1.5 rounded border border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)] leading-none block w-full max-w-full tracking-widest break-all">
                                    {c.trim()}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-2 lg:p-3 border-r border-slate-600/50 align-middle break-words">
                              <span className="text-[10px] lg:text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap block">
                                {renderCellText(item.desc)}
                              </span>
                            </td>
                            <td className="p-2 lg:p-3 align-middle break-words">
                              <span className="text-[10px] lg:text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap block">
                                {renderCellText(item.emergency)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================================== */}
          {/* --- ERG CODE SECTION --- */}
          {/* ================================== */}
          {activeTab === 'erg' && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              {/* Main Table */}
              <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 lg:p-4 shadow-lg">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-600/50 shadow-inner">
                    (S-6-2-8-②)
                  </span>
                  <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-600/50 shadow-inner">
                    (ICAO Doc 9481)
                  </span>
                </div>
                <h3 className="text-rose-400 font-black tracking-widest text-sm lg:text-base mb-2 flex items-center gap-2">
                  <SafeIcon name="AlertTriangle" className="w-5 h-5" /> Table 4-1. Aircraft Emergency Response Drills
                </h3>
                <ol className="list-decimal list-inside text-slate-200 text-[11px] md:text-xs font-bold space-y-1 mb-4 ml-1">
                  <li>適切な航空機の緊急手順を完了する。</li>
                  <li>可能な限り速やかな着陸を検討する。</li>
                  <li>以下のチャートからドリルを使用する。</li>
                </ol>

                <div className="w-full overflow-x-auto rounded-xl border border-slate-600 shadow-xl bg-slate-800/50">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-700 text-slate-200 border-b border-slate-500 text-[10px] lg:text-[11px]">
                        <th className="p-2 border-r border-slate-600 text-center whitespace-nowrap">ドリル番号</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">固有の危険性</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">航空機への危険性</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">搭乗者への危険性</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">漏出時の手順</th>
                        <th className="p-2 border-r border-slate-600 w-1/6">消火手順</th>
                        <th className="p-2 w-1/6">追加の考慮事項</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ERG_DRILLS_FINAL.map((drill, idx) => (
                        <tr key={idx} className="border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors text-[10px] lg:text-[11px] leading-relaxed text-slate-300">
                          <td className="p-2 border-r border-slate-600/50 text-center align-top font-black text-white text-base bg-slate-800/40">{drill.no}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.inherent}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.acRisk}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.occRisk}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.spill}</td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">{drill.fire}</td>
                          <td className="p-2 align-top whitespace-pre-wrap">{drill.add}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drill Letters Table */}
              <div className="w-full overflow-x-auto rounded-xl border border-slate-600 shadow-xl bg-slate-800/50">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-700 text-slate-200 border-b border-slate-500 text-[10px] lg:text-[11px]">
                      <th className="p-2 border-r border-slate-600 text-center whitespace-nowrap">ドリルレター</th>
                      <th className="p-2 border-r border-slate-600 w-1/2">追加の危険性</th>
                      <th className="p-2 border-r border-slate-600 text-center whitespace-nowrap">ドリルレター</th>
                      <th className="p-2 w-1/2">追加の危険性</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const left = ERG_LETTERS_LEFT_FINAL[idx];
                      const right = ERG_LETTERS_RIGHT_FINAL[idx];
                      return (
                        <tr key={idx} className="border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors text-[10px] lg:text-[11px] leading-relaxed text-slate-300">
                          {left ? <td className="p-2 border-r border-slate-600/50 text-center align-middle font-black text-sky-400 text-base bg-slate-800/40">{left.letter}</td> : <td className="p-2 border-r border-slate-600/50 align-top bg-slate-800/40"></td>}
                          {left ? <td className="p-2 border-r border-slate-600/50 align-middle whitespace-pre-wrap font-bold text-slate-200">{left.hazard}</td> : <td className="p-2 border-r border-slate-600/50 align-top"></td>}
                          {right ? <td className="p-2 border-r border-slate-600/50 text-center align-middle font-black text-sky-400 text-base bg-slate-800/40">{right.letter}</td> : <td className="p-2 border-r border-slate-600/50 align-top bg-slate-800/40"></td>}
                          {right ? <td className="p-2 align-middle whitespace-pre-wrap font-bold text-slate-200">{right.hazard}</td> : <td className="p-2 align-top"></td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================== */}
          {/* --- SPECIAL PAX SECTION --- */}
          {/* ================================== */}
          {activeTab === 'special_pax' && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 lg:p-4 shadow-lg">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[9px] lg:text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-600/50 shadow-inner">
                    (S-7-5)
                  </span>
                </div>
                <h3 className="text-indigo-400 font-black tracking-widest text-sm lg:text-base mb-2 flex items-center gap-2">
                  <SafeIcon name="Users" className="w-5 h-5" /> 配慮を要する旅客の搭乗要件
                </h3>
                <p className="text-slate-300 text-[10px] md:text-xs font-bold mb-4 ml-1">
                  安全確保および社会的要請に基づく、配慮を要する旅客（SPECIAL PAX）の搭乗要件・制限の要約です。
                </p>

                <div className="w-full overflow-x-auto rounded-xl border border-slate-600 shadow-xl bg-slate-800/50">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="bg-slate-700 text-slate-200 border-b border-slate-500 text-[10px] lg:text-[11px]">
                        <th className="p-2 border-r border-slate-600 text-center whitespace-nowrap w-36 lg:w-48">コード</th>
                        <th className="p-2 border-r border-slate-600 whitespace-nowrap w-32 lg:w-40">旅客種別</th>
                        <th className="p-2 border-r border-slate-600 w-1/3">定義 / 主な条件</th>
                        <th className="p-2 border-r border-slate-600 w-1/4">同伴者 / 付添者の要否</th>
                        <th className="p-2 border-r border-slate-600 whitespace-nowrap w-28 lg:w-32 text-center">非常口座席</th>
                        <th className="p-2 w-1/4">搭乗人数制限</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SPECIAL_PAX_DATA.map((pax, idx) => (
                        <tr key={idx} className="border-b border-slate-600/50 hover:bg-slate-700/30 transition-colors text-[10px] lg:text-[11px] leading-relaxed text-slate-300">
                          <td className="p-2 border-r border-slate-600/50 text-center align-middle font-black text-indigo-300 text-sm lg:text-base bg-slate-800/40">
                            {renderCellText(pax.code)}
                          </td>
                          <td className="p-2 border-r border-slate-600/50 align-middle font-bold text-slate-200">
                            {pax.label}
                          </td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">
                            {renderCellText(pax.desc)}
                          </td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap">
                            {renderCellText(pax.escort)}
                          </td>
                          <td className="p-2 border-r border-slate-600/50 align-top whitespace-pre-wrap font-bold">
                            {pax.seat.includes("不可") ? <span className="text-rose-400">{renderCellText(pax.seat)}</span> : renderCellText(pax.seat)}
                          </td>
                          <td className="p-2 align-top whitespace-pre-wrap">
                            {renderCellText(pax.limit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 共通規定セクション */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 mt-4">
                  {/* 付添者 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg">
                    <h4 className="text-indigo-300 font-black text-xs mb-2 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                      付添者 <span className="text-[9px] text-slate-400 font-normal">(AT/Qualified Escort)</span>
                    </h4>
                    <ul className="text-slate-300 text-[10px] lg:text-[11px] space-y-1 list-disc list-inside leading-relaxed">
                      <li><strong>12歳以上</strong>であること</li>
                      <li>緊急時に付添い対象者の<strong>脱出援助</strong>ができること</li>
                      <li>対象者<strong>以外</strong>の者の脱出援助の必要がないこと</li>
                      <li>対象者の状態を把握し、身の回りの世話ができること</li>
                      <li>対象者の<strong>隣席</strong>に着席すること</li>
                      <li><span className="text-sky-300 font-bold">視覚障がい旅客(BLND)の盲導犬</span>は付添者とみなす</li>
                    </ul>
                  </div>

                  {/* 脱出援助者 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg">
                    <h4 className="text-indigo-300 font-black text-xs mb-1 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                      脱出援助者 <span className="text-[9px] text-slate-400 font-normal">(EE)</span>
                    </h4>
                    <p className="text-[9px] text-amber-300/80 mb-2 leading-tight">
                      付添者を伴わない歩行障がい旅客(WCHC)が規定人数を超過した場合に確保する。
                    </p>
                    <ul className="text-slate-300 text-[10px] lg:text-[11px] space-y-1 list-disc list-inside leading-relaxed">
                      <li><strong>15歳以上</strong>で、援助することに同意していること</li>
                      <li>緊急時に援助対象者の<strong>脱出援助</strong>ができること</li>
                      <li>対象者<strong>以外</strong>の者の脱出援助の必要がないこと</li>
                      <li>対象者の<strong>前後左右4座席以内</strong>に着席すること<br />
                        <span className="text-[9px] text-slate-400 ml-3 inline-block mt-0.5 leading-tight">
                          ※対象者との間にGalley/Lav/Partition/非常口を挟まないこと。(通路は1席とみなす)
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* アシストシート等 */}
                  <div className="bg-slate-800/80 border border-slate-600 rounded-xl p-3 shadow-lg flex flex-col gap-3">
                    <div>
                      <h4 className="text-indigo-300 font-black text-xs mb-2 border-b border-slate-700 pb-1">アシストシート</h4>
                      <ul className="text-slate-300 text-[10px] lg:text-[11px] space-y-1 list-disc list-inside leading-relaxed">
                        <li>座位の保持が困難な旅客の着席のために貸出す場合がある。</li>
                        <li>使用する旅客は<strong className="text-rose-400">非常口座席に指定不可</strong>。</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- [5-3] RestView (REST CALC) ---
const RestView = ({
  flightHours, setFlightHours,
  flightMins, setFlightMins,
  stdHours, setStdHours,
  stdMins, setStdMins,
  isTakeoffAuto, setIsTakeoffAuto,
  takeoffHours, setTakeoffHours,
  takeoffMins, setTakeoffMins,
  offsetMins, setOffsetMins,
  landingOffsetMins, setLandingOffsetMins,
  crewSize, setCrewSize,
  firstRestMins, setFirstRestMins,
  lastRestMins, setLastRestMins,
  firstHalfMins, setFirstHalfMins,
  taxiOutMins
}) => {

  const totalMins = useMemo(() => flightHours * 60 + flightMins, [flightHours, flightMins]);
  const takeoffTotalMins = useMemo(() => takeoffHours * 60 + takeoffMins, [takeoffHours, takeoffMins]);
  const arrivalTotalMins = useMemo(() => takeoffTotalMins + totalMins, [takeoffTotalMins, totalMins]);

  // ★変更: 休憩開始時間を5分単位で切り上げ（繰り上げ）
  const startTimeMins = useMemo(() => Math.ceil((takeoffTotalMins + offsetMins) / 5) * 5, [takeoffTotalMins, offsetMins]);
  
  // 切り上げた結果、実際のオフセット時間（離陸から休憩開始まで）が何分になったかを算出
  const actualOffsetMins = useMemo(() => startTimeMins - takeoffTotalMins, [startTimeMins, takeoffTotalMins]);

  // 実際に休憩に割り当て可能な時間を再計算（繰り上がった分、休憩枠が減る）
  const restableMins = useMemo(() => Math.max(0, totalMins - actualOffsetMins - landingOffsetMins), [totalMins, actualOffsetMins, landingOffsetMins]);

  const formatTimeWithWrap = (mins) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  const arrivalTimeFormatted = useMemo(() => formatTimeWithWrap(arrivalTotalMins), [arrivalTotalMins]);

  const calcRest = (divisor, pilotCount) => {
    if (restableMins <= 0) return { isCustom: false, mins: 0, text: '0:00', shifts: [], startTime: '00:00', totalActual: '0:00', totalActualMins: 0, lastEnd: '00:00', buffer: 0, pilotBlocks: [] };

    const raw = restableMins / divisor;
    const rounded5 = Math.floor(raw / 5) * 5;
    const h = Math.floor(rounded5 / 60);
    const m = rounded5 % 60;

    const totalActualMins = rounded5 * divisor;
    const th = Math.floor(totalActualMins / 60);
    const tm = totalActualMins % 60;

    const shifts = [];
    let currentMins = startTimeMins;

    const pilotBlocks = Array.from({ length: pilotCount }, () => []);
    let bStart = actualOffsetMins;

    for (let i = 0; i < divisor; i++) {
      pilotBlocks[i % pilotCount].push({ start: bStart, duration: rounded5 });
      bStart += rounded5;

      if (i < divisor - 1) {
        currentMins += rounded5;
        currentMins = Math.ceil(currentMins / 5) * 5;
        shifts.push(formatTimeWithWrap(currentMins));
      }
    }

    currentMins += rounded5;
    let lastEndMins = currentMins;
    let buffer = restableMins - totalActualMins;

    return {
      isCustom: false,
      mins: rounded5,
      text: h + ':' + String(m).padStart(2, '0'),
      shifts,
      startTime: formatTimeWithWrap(startTimeMins),
      totalActual: th + ':' + String(tm).padStart(2, '0'),
      totalActualMins,
      lastEnd: formatTimeWithWrap(lastEndMins),
      buffer,
      pilotBlocks
    };
  };

  const calcCustomRest6Div3Plt = (firstHalf) => {
    if (restableMins <= 0) return { isCustom: true, r_first: 0, r_second: 0, text: '0:00', shifts: [], startTime: '00:00', totalActual: '0:00', totalActualMins: 0, lastEnd: '00:00', buffer: 0, pilotBlocks: [[], [], []] };

    const eqRaw = restableMins / 6;
    const eqRounded5 = Math.floor(eqRaw / 5) * 5;

    let r_first = firstHalf > 0 ? firstHalf : eqRounded5;
    let remainingForSecondHalf = restableMins - (r_first * 3);
    let r_second = Math.floor((remainingForSecondHalf / 3) / 5) * 5;

    if (r_second < 0) {
      r_second = 0;
      r_first = Math.floor((restableMins / 3) / 5) * 5;
    }

    const durations = [r_first, r_first, r_first, r_second, r_second, r_second];

    const shifts = [];
    let currentMins = startTimeMins;

    const pilotBlocks = [[], [], []];
    let bStart = actualOffsetMins;

    for (let i = 0; i < durations.length; i++) {
      pilotBlocks[i % 3].push({ start: bStart, duration: durations[i] });
      bStart += durations[i];

      if (i < durations.length - 1) {
        currentMins += durations[i];
        currentMins = Math.ceil(currentMins / 5) * 5;
        shifts.push(formatTimeWithWrap(currentMins));
      }
    }

    currentMins += durations[durations.length - 1];
    let lastEndMins = currentMins;

    const totalActualMins = durations.reduce((a, b) => a + b, 0);
    let buffer = restableMins - totalActualMins;

    const th = Math.floor(totalActualMins / 60);
    const tm = totalActualMins % 60;

    return {
      isCustom: true,
      r_first,
      r_second,
      text: Math.floor(r_first / 60) + ':' + String(r_first % 60).padStart(2, '0'),
      shifts,
      startTime: formatTimeWithWrap(startTimeMins),
      totalActual: th + ':' + String(tm).padStart(2, '0'),
      totalActualMins,
      lastEnd: formatTimeWithWrap(lastEndMins),
      buffer,
      pilotBlocks
    };
  };

  const calcCustomRest = (divisor, firstMins, lastMins, targetTotalMins = null) => {
    if (restableMins <= 0) return { isCustom: true, p1Text: '0:00', p2Text: '0:00', shifts: [], startTime: '00:00', totalActual: '0:00', totalActualMins: 0, lastEnd: '00:00', buffer: 0, pilotBlocks: [] };

    const halfTotal = targetTotalMins !== null ? targetTotalMins / 2 : restableMins / 2;
    let durations = [];
    let r_first = firstMins;
    let r_last = lastMins;
    let r_p1mid = 0;
    let r_p2 = 0;

    const toHMM = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');

    if (divisor === 5) {
      const p1Mid = Math.max(0, halfTotal - firstMins - lastMins);
      const p2Each = halfTotal / 2;
      r_p1mid = Math.floor(p1Mid / 5) * 5;
      r_p2 = Math.floor(p2Each / 5) * 5;
      durations = [r_first, r_p2, r_p1mid, r_p2, r_last];
    } else if (divisor === 7) {
      const p1MidEach = Math.max(0, halfTotal - firstMins - lastMins) / 2;
      const p2Each = halfTotal / 3;
      r_p1mid = Math.floor(p1MidEach / 5) * 5;
      r_p2 = Math.floor(p2Each / 5) * 5;
      durations = [r_first, r_p2, r_p1mid, r_p2, r_p1mid, r_p2, r_last];
    }

    const shifts = [];
    let currentMins = startTimeMins;

    const pilotBlocks = [[], []];
    let bStart = actualOffsetMins;

    for (let i = 0; i < durations.length; i++) {
      pilotBlocks[i % 2].push({ start: bStart, duration: durations[i] });
      bStart += durations[i];

      if (i < durations.length - 1) {
        currentMins += durations[i];
        currentMins = Math.ceil(currentMins / 5) * 5;
        shifts.push(formatTimeWithWrap(currentMins));
      }
    }

    currentMins += durations[durations.length - 1];
    let lastEndMins = currentMins;

    const totalActualMins = durations.reduce((a, b) => a + b, 0);
    let buffer = restableMins - totalActualMins;

    const th = Math.floor(totalActualMins / 60);
    const tm = totalActualMins % 60;

    let p1Text = '';
    let p2Text = '';
    if (divisor === 5) {
      p1Text = toHMM(r_first) + ' / ' + toHMM(r_p1mid) + ' / ' + toHMM(r_last);
      p2Text = toHMM(r_p2) + ' (x2)';
    } else {
      p1Text = toHMM(r_first) + ' / ' + toHMM(r_p1mid) + '(x2) / ' + toHMM(r_last);
      p2Text = toHMM(r_p2) + ' (x3)';
    }

    return {
      isCustom: true,
      p1Text, p2Text, shifts,
      startTime: formatTimeWithWrap(startTimeMins),
      totalActual: th + ':' + String(tm).padStart(2, '0'),
      totalActualMins,
      lastEnd: formatTimeWithWrap(lastEndMins),
      buffer,
      pilotBlocks
    };
  };

  const rest3 = calcRest(3, 3);
  const rest4 = calcRest(4, 2);
  const rest5 = calcCustomRest(5, firstRestMins, lastRestMins, rest4.totalActualMins);

  const rest6 = crewSize === 3 ? calcCustomRest6Div3Plt(firstHalfMins) : calcRest(6, 2);
  const rest7 = calcCustomRest(7, firstRestMins, lastRestMins, rest6.totalActualMins);

  const TimelineGraphic = ({ title, restA, restB, cSize, chartTotal, arrivalTime }) => {
    if (!chartTotal || chartTotal <= 0) return null;

    const rows = [];
    if (cSize === 4 && restB) {
      rows.push({ label: 'PIC', blocks: restA.pilotBlocks[1] });
      rows.push({ label: 'CAPM', blocks: restA.pilotBlocks[0] });
      rows.push({ label: 'COP1', blocks: restB.pilotBlocks[1] });
      rows.push({ label: 'COP2', blocks: restB.pilotBlocks[0] });
    } else if (cSize === 3) {
      rows.push({ label: 'PIC', blocks: restA.pilotBlocks[1] });
      rows.push({ label: 'CAPM', blocks: restA.pilotBlocks[2] });
      rows.push({ label: 'COP', blocks: restA.pilotBlocks[0] });
    }

    const actualChartTotal = Math.max(chartTotal, 1);
    const markers = new Set([0, actualChartTotal, actualOffsetMins]);
    rows.forEach(r => r.blocks.forEach(b => {
      markers.add(b.start);
      markers.add(b.start + b.duration);
    }));
    const sortedMarkers = Array.from(markers).sort((a, b) => a - b);

    let lastTopM = -9999;
    let lastBottomM = -9999;
    const minDiff = actualChartTotal * 0.08;

    const markerPositions = sortedMarkers.map((m, index) => {
      let isTop = true;
      if (m - lastTopM < minDiff) {
        isTop = false;
      } else if (m - lastBottomM < minDiff) {
        isTop = true;
      } else {
        isTop = index % 2 === 0;
      }

      if (isTop) lastTopM = m;
      else lastBottomM = m;

      return { m, isTop };
    });

    return (
      <div className="w-full bg-slate-900/50 rounded-xl p-2 lg:p-2.5 border border-slate-700/50 shadow-inner flex flex-col h-full justify-center">
        <div className="flex items-center justify-between mb-1 shrink-0">
          {title && (
            <div className="flex items-center gap-1.5">
              <SafeIcon name="CalendarClock" className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{title}</span>
            </div>
          )}
          {arrivalTime && (
            <div className="flex items-center gap-2 bg-sky-900/30 px-2 py-1 rounded-lg border border-sky-500/40 shadow-sm ml-auto">
              <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1"><SafeIcon name="PlaneLanding" className="w-2.5 h-2.5" /> EST ARRIVAL</span>
              <span className="font-mono text-sm font-black text-white leading-none">{arrivalTime}</span>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col pr-2 pb-1 lg:pr-3 lg:pb-1 mt-1">
          <div className="flex w-full relative">
            <div className="w-[40px] lg:w-[46px] shrink-0"></div>

            <div className="flex-1 relative mt-8 lg:mt-9">

              <div className="absolute top-[-32px] lg:top-[-36px] left-0 w-full h-[32px] lg:h-[36px]">
                {markerPositions.map(({ m, isTop }) => {
                  const yClass = isTop ? 'top-[-6px] lg:top-[-8px]' : 'top-[10px] lg:top-[12px]';
                  const timeStr = formatTimeWithWrap(takeoffTotalMins + m);
                  const isTakeoff = m === 0;
                  const isLanding = Math.abs(m - actualChartTotal) < 1;

                  return (
                    <div key={m} className={`absolute ${yClass} flex flex-col items-center -translate-x-1/2 z-20`} style={{ left: `${(m / actualChartTotal) * 100}%` }}>
                      <div className={`bg-slate-800 border ${isTakeoff ? 'border-amber-500/50' : isLanding ? 'border-sky-500/50' : 'border-slate-500'} px-1 py-0.5 rounded shadow-lg flex items-center justify-center min-w-[32px]`}>
                        <span className={`text-[9px] font-mono font-black ${isTakeoff ? 'text-amber-300' : isLanding ? 'text-sky-300' : 'text-slate-200'}`}>{timeStr}</span>
                      </div>
                      <div className={`w-px bg-slate-400 ${isTop ? 'h-[16px] lg:h-[20px]' : 'h-[2px]'} mt-0.5`}></div>
                    </div>
                  );
                })}
              </div>

              <div className="absolute inset-0 pointer-events-none z-0">
                {sortedMarkers.map(m => (
                  <div key={m} className="absolute top-0 h-full border-l border-slate-500/40" style={{ left: `${(m / actualChartTotal) * 100}%` }}></div>
                ))}
              </div>

              <div className="flex flex-col border-t border-l border-slate-500 relative z-10 w-full shadow-xl rounded-br-lg">
                {rows.map((row, idx) => (
                  <div key={idx} className="flex h-8 lg:h-9 bg-slate-700/30 border-b border-r border-slate-500 relative w-full box-border">

                    <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(0,0,0,0.15)_4px,rgba(0,0,0,0.15)_8px)] pointer-events-none z-0"></div>

                    <div className="absolute -left-[40px] lg:-left-[46px] top-0 h-full w-[40px] lg:w-[46px] bg-slate-800 border-b border-slate-600 flex items-center justify-center shadow-md z-20 rounded-l-lg border-l border-slate-600">
                      <span className="text-[9px] lg:text-[10px] font-black tracking-widest text-slate-300">{row.label}</span>
                    </div>

                    <div className="relative w-full h-full z-10">
                      {actualOffsetMins > 0 && (
                        <div className="absolute top-0 h-full flex items-center justify-center border-r border-slate-500/30 overflow-hidden" style={{ left: 0, width: `${(actualOffsetMins / actualChartTotal) * 100}%` }}>
                          <span className="text-[7px] font-black tracking-widest text-slate-400 opacity-60">AWAKE</span>
                        </div>
                      )}

                      {row.blocks.map((b, bIdx) => {
                        const h = Math.floor(b.duration / 60);
                        const m = b.duration % 60;
                        const timeText = h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}m`;

                        return (
                          <div key={bIdx}
                            className="absolute top-0 h-full bg-slate-100 border-l border-r border-slate-400 flex items-center justify-center shadow-md z-10 overflow-hidden"
                            style={{ left: `${(b.start / actualChartTotal) * 100}%`, width: `${(b.duration / actualChartTotal) * 100}%` }}>

                            <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)] pointer-events-none"></div>

                            <span className="text-[10px] lg:text-[12px] font-mono font-black text-slate-800 z-10 px-0.5 lg:px-1 truncate drop-shadow-sm">
                              {timeText}
                            </span>
                          </div>
                        )
                      })}

                      {landingOffsetMins > 0 && (
                        <div className="absolute top-0 h-full flex items-center justify-center border-l border-slate-500/30 overflow-hidden" style={{ right: 0, width: `${(landingOffsetMins / actualChartTotal) * 100}%` }}>
                          <span className="text-[7px] font-black tracking-widest text-slate-400 opacity-60">AWAKE</span>
                        </div>
                      )}
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

  const ShiftSummaryCard = ({ title, rest, color, border, bgIcon }) => (
    <div className={`bg-slate-800/90 rounded-xl border-l-[3px] ${border} shadow-lg relative group p-2 lg:p-2.5 overflow-hidden flex flex-col h-full justify-center`}>
      <SafeIcon name={bgIcon} className={`absolute right-0 bottom-0 w-24 h-24 opacity-5 ${color} pointer-events-none -translate-x-1/4 translate-y-1/4`} />

      <div className="flex items-center gap-1.5 mb-1 z-10">
        <SafeIcon name="PieChart" className={`w-3.5 h-3.5 ${color}`} />
        <span className={`${color} font-black uppercase tracking-widest text-[10px]`}>{title}</span>
      </div>

      <div className="z-10 flex flex-col gap-1">
        <div className="flex flex-col gap-1 w-full mt-0.5">
          <div className="flex justify-between items-center bg-slate-800 border border-slate-600 shadow-inner px-2 py-1 rounded">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><SafeIcon name="Clock" className="w-2.5 h-2.5" />Total Rest</span>
            <span className="text-[12px] font-mono font-black text-white">{rest.totalActual}</span>
          </div>
          <div className={`flex justify-between items-center px-2 py-1 rounded border shadow-inner ${rest.buffer < 0 ? 'bg-rose-900/30 border-rose-500/50' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
            <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${rest.buffer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}><SafeIcon name="Timer" className="w-2.5 h-2.5" />Margin</span>
            <span className={`text-[12px] font-mono font-black ${rest.buffer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {rest.buffer >= 0 ? '+' : ''}{rest.buffer}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const CombinedShiftSummaryCard = ({ title1, title2, rest, color1, color2, border, bgIcon }) => (
    <div className={`bg-slate-800/90 rounded-xl border-l-[3px] ${border} shadow-lg relative group p-2 lg:p-2.5 overflow-hidden flex flex-col h-full justify-center`}>
      <SafeIcon name={bgIcon} className={`absolute right-0 bottom-0 w-24 h-24 opacity-5 ${color1} pointer-events-none -translate-x-1/4 translate-y-1/4`} />

      <div className="flex flex-col gap-1 mb-1.5 z-10">
        <div className="flex items-center gap-1.5">
          <SafeIcon name="PieChart" className={`w-3.5 h-3.5 ${color1}`} />
          <span className={`${color1} font-black uppercase tracking-widest text-[10px]`}>{title1}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <SafeIcon name="PieChart" className={`w-3.5 h-3.5 ${color2}`} />
          <span className={`${color2} font-black uppercase tracking-widest text-[10px]`}>{title2}</span>
        </div>
      </div>

      <div className="z-10 flex flex-col gap-1">
        <div className="flex flex-col gap-1 w-full mt-0.5">
          <div className="flex justify-between items-center bg-slate-800 border border-slate-600 shadow-inner px-2 py-1 rounded">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><SafeIcon name="Clock" className="w-2.5 h-2.5" />Total Rest</span>
            <span className="text-[12px] font-mono font-black text-white">{rest.totalActual}</span>
          </div>
          <div className={`flex justify-between items-center px-2 py-1 rounded border shadow-inner ${rest.buffer < 0 ? 'bg-rose-900/30 border-rose-500/50' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
            <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${rest.buffer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}><SafeIcon name="Timer" className="w-2.5 h-2.5" />Margin</span>
            <span className={`text-[12px] font-mono font-black ${rest.buffer < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {rest.buffer >= 0 ? '+' : ''}{rest.buffer}m
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center h-full w-full bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-700 mt-0.5 animate-in fade-in duration-300 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>

      <div className="flex items-center justify-between w-full p-2 border-b border-slate-700/50 bg-slate-900/30 shrink-0">
        <div className="flex items-center gap-2 px-2">
          <SafeIcon name="Coffee" className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-black uppercase tracking-widest text-amber-100">Rest Calculator</h2>
        </div>
      </div>

      <div className="flex-1 w-full p-1.5 lg:p-2 flex flex-col gap-2 lg:gap-3 max-w-[1200px] mx-auto overflow-y-auto custom-scrollbar">

        <div className="bg-slate-900/60 p-1.5 lg:p-2 rounded-2xl border border-slate-600 shadow-inner flex flex-col xl:flex-row items-center justify-between gap-2 w-full z-20 relative shrink-0">

          <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 w-full">

            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-600 shadow-inner relative overflow-hidden shrink-0">
              <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg transition-transform duration-300 ease-out shadow-md transform ${crewSize === 4 ? 'translate-x-full' : 'translate-x-0'}`}></div>
              <button onClick={() => setCrewSize(3)} className={`w-[70px] py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors relative z-10 flex items-center justify-center gap-1 ${crewSize === 3 ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                <SafeIcon name="Users" className="w-3 h-3" /> 3 PLT
              </button>
              <button onClick={() => setCrewSize(4)} className={`w-[70px] py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors relative z-10 flex items-center justify-center gap-1 ${crewSize === 4 ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                <SafeIcon name="Users" className="w-3 h-3" /> 4 PLT
              </button>
            </div>

            <div className="hidden lg:block w-px h-8 bg-slate-700 shadow-md shrink-0"></div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-amber-400 font-black uppercase tracking-widest mb-0.5">FLT TIME</span>
                <div className="flex items-center gap-1">
                  <select value={flightHours} onChange={(e) => setFlightHours(Number(e.target.value))} className="bg-slate-800 border border-slate-500 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[46px] py-0.5 appearance-none outline-none focus:border-amber-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 15 - 1 + 1 }, (_, i) => 1 + i).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 font-bold">H</span>
                  <select value={flightMins} onChange={(e) => setFlightMins(Number(e.target.value))} className="bg-slate-800 border border-slate-500 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[46px] py-0.5 appearance-none outline-none focus:border-amber-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 font-bold">M</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-px h-8 bg-slate-700 shadow-md shrink-0"></div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-sky-400 font-black uppercase tracking-widest mb-0.5">STD (LCL/Z)</span>
                <div className="flex items-center gap-1">
                  <select value={stdHours} onChange={(e) => { setStdHours(Number(e.target.value)); setIsTakeoffAuto(true); }} className="bg-slate-800 border border-slate-500 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[46px] py-0.5 appearance-none outline-none focus:border-sky-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>)}
                  </select>
                  <span className="text-lg text-slate-500 font-black leading-none mb-1">:</span>
                  <select value={stdMins} onChange={(e) => { setStdMins(Number(e.target.value)); setIsTakeoffAuto(true); }} className="bg-slate-800 border border-slate-500 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[46px] py-0.5 appearance-none outline-none focus:border-sky-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                  </select>
                </div>
              </div>

              <div className="w-px h-6 bg-sky-500/30"></div>

              <div className="flex flex-col items-center relative">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[8px] text-sky-400 font-black uppercase tracking-widest">T/O TIME</span>
                  <button onClick={() => setIsTakeoffAuto(!isTakeoffAuto)} className={`px-1 rounded-[2px] text-[6px] font-black tracking-widest ${isTakeoffAuto ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'} transition-colors`}>
                    {isTakeoffAuto ? `+${taxiOutMins} AUTO` : 'MANUAL'}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <select value={takeoffHours} onChange={(e) => { setTakeoffHours(Number(e.target.value)); setIsTakeoffAuto(false); }} className={`bg-slate-800 border ${isTakeoffAuto ? 'border-sky-500/50 text-sky-200' : 'border-slate-500 text-white'} rounded-lg text-center text-base lg:text-lg font-mono font-black w-[46px] py-0.5 appearance-none outline-none focus:border-sky-400 cursor-pointer shadow-inner transition-colors`} style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 24 }, (_, i) => i).map(h => <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>)}
                  </select>
                  <span className="text-lg text-slate-500 font-black leading-none mb-1">:</span>
                  <select value={takeoffMins} onChange={(e) => { setTakeoffMins(Number(e.target.value)); setIsTakeoffAuto(false); }} className={`bg-slate-800 border ${isTakeoffAuto ? 'border-sky-500/50 text-sky-200' : 'border-slate-500 text-white'} rounded-lg text-center text-base lg:text-lg font-mono font-black w-[46px] py-0.5 appearance-none outline-none focus:border-sky-400 cursor-pointer shadow-inner transition-colors`} style={{ textAlignLast: 'center' }}>
                    {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="hidden xl:block w-px h-8 bg-slate-700 shadow-md shrink-0"></div>

            <div className="flex items-center gap-3 px-3 py-1 bg-pink-950/20 rounded-xl border border-pink-500/30 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-pink-400 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="Clock" className="w-2.5 h-2.5" />DELAY AFTER T/O</span>
                <div className="flex items-center gap-1">
                  <select value={offsetMins} onChange={(e) => setOffsetMins(Number(e.target.value))} className="bg-slate-800 border border-pink-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[54px] py-0.5 appearance-none outline-none focus:border-pink-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 font-bold">M</span>
                </div>
              </div>
              <div className="w-px h-6 bg-pink-500/30"></div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-pink-400 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="Clock" className="w-2.5 h-2.5" />AWAKE PRIOR L/D</span>
                <div className="flex items-center gap-1">
                  <select value={landingOffsetMins} onChange={(e) => setLandingOffsetMins(Number(e.target.value))} className="bg-slate-800 border border-pink-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[54px] py-0.5 appearance-none outline-none focus:border-pink-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 font-bold">M</span>
                </div>
              </div>
            </div>

            <div className={`flex items-center transition-opacity duration-300 ${(crewSize === 4 || crewSize === 3) ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'}`}>
              <div className={`hidden lg:block w-px h-8 border-r shrink-0 mr-3 lg:mr-4 ${crewSize === 4 ? 'bg-indigo-500/50 border-indigo-900/50' : 'bg-emerald-500/50 border-emerald-900/50'}`}></div>

              {crewSize === 4 ? (
                <div className="flex items-center gap-3 px-3 py-1 bg-indigo-950/40 rounded-xl border border-indigo-500/30 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-indigo-300 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="BedDouble" className="w-2.5 h-2.5" />1ST REST</span>
                    <div className="flex items-center gap-1">
                      <select value={firstRestMins} onChange={(e) => setFirstRestMins(Number(e.target.value))} className="bg-slate-800 border border-indigo-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[54px] py-0.5 appearance-none outline-none focus:border-indigo-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                        {[...Array(13).keys()].map(i => (i + 12) * 5).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <span className="text-[10px] text-slate-400 font-bold">M</span>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-indigo-500/30"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-indigo-300 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="BedDouble" className="w-2.5 h-2.5" />LAST REST</span>
                    <div className="flex items-center gap-1">
                      <select value={lastRestMins} onChange={(e) => setLastRestMins(Number(e.target.value))} className="bg-slate-800 border border-indigo-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[54px] py-0.5 appearance-none outline-none focus:border-indigo-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                        {[...Array(13).keys()].map(i => (i + 12) * 5).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <span className="text-[10px] text-slate-400 font-bold">M</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-1 bg-emerald-950/40 rounded-xl border border-emerald-500/30 shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-emerald-300 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1"><SafeIcon name="BedDouble" className="w-2.5 h-2.5" />1ST HALF</span>
                    <div className="flex items-center gap-1">
                      <select value={firstHalfMins} onChange={(e) => setFirstHalfMins(Number(e.target.value))} className="bg-slate-800 border border-emerald-500/50 rounded-lg text-center text-base lg:text-lg font-mono font-black text-white w-[64px] py-0.5 appearance-none outline-none focus:border-emerald-400 cursor-pointer shadow-inner" style={{ textAlignLast: 'center' }}>
                        <option value={0}>AUTO</option>
                        {[...Array(37).keys()].map(i => (i + 12) * 5).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <span className="text-[10px] text-slate-400 font-bold">M</span>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-emerald-500/30"></div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8.5px] text-emerald-200/80 font-black tracking-widest leading-tight">
                      前半の休憩時間を<br />手動で指定します
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-2">
          {crewSize === 3 && (
            <>
              <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-600/50 relative mt-1 shadow-inner">
                <div className="absolute -top-3 left-4 bg-slate-900 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded border border-slate-600 shadow-md tracking-widest flex items-center gap-1 z-20">
                  <SafeIcon name="Layers" className="w-2.5 h-2.5 text-emerald-400" /> 6 DIVISIONS
                </div>
                <div className="flex flex-col lg:flex-row gap-2 items-stretch mt-1.5">
                  <div className="w-full lg:w-[200px] xl:w-[240px] shrink-0 flex flex-col gap-2">
                    <ShiftSummaryCard title="6 Divisions" rest={rest6} color="text-emerald-400" border="border-emerald-500" bgIcon="BatteryFull" />

                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-2 shadow-inner">
                      <div className="flex items-center gap-1 mb-1.5">
                        <SafeIcon name="Calculator" className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] font-black text-emerald-100 tracking-widest">6分割の概算式</span>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-emerald-300 leading-tight bg-slate-900/60 px-1.5 py-1 rounded border border-slate-700/80 mb-1.5 text-center">
                        FLT(h) × 10 = REST(m)
                      </div>
                      <div className="text-[8.5px] lg:text-[9px] text-slate-300 leading-relaxed font-medium">
                        ex)<br />
                        8h00m ⇒ 8×10 = 80m <span className="text-slate-400">(1h20m)</span><br />
                        FLT(m)の端数は ÷6 で分割して足す
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <TimelineGraphic title="Timeline Schedule" restA={rest6} cSize={3} chartTotal={Math.max(totalMins, actualOffsetMins + rest6.totalActualMins + landingOffsetMins)} arrivalTime={arrivalTimeFormatted} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-600/50 relative mt-2 shadow-inner">
                <div className="absolute -top-3 left-4 bg-slate-900 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded border border-slate-600 shadow-md tracking-widest flex items-center gap-1 z-20">
                  <SafeIcon name="Layers" className="w-2.5 h-2.5 text-sky-400" /> 3 DIVISIONS
                </div>
                <div className="flex flex-col lg:flex-row gap-2 items-stretch mt-1.5">
                  <div className="w-full lg:w-[200px] xl:w-[240px] shrink-0 flex flex-col gap-2">
                    <ShiftSummaryCard title="3 Divisions" rest={rest3} color="text-sky-400" border="border-sky-500" bgIcon="BatteryMedium" />

                    <div className="bg-sky-900/10 border border-sky-500/20 rounded-xl p-2 shadow-inner">
                      <div className="flex items-center gap-1 mb-1.5">
                        <SafeIcon name="Calculator" className="w-3 h-3 text-sky-400" />
                        <span className="text-[9px] font-black text-sky-100 tracking-widest">3分割の概算式</span>
                      </div>
                      <div className="text-[10px] font-mono font-bold text-sky-300 leading-tight bg-slate-900/60 px-1.5 py-1 rounded border border-slate-700/80 mb-1.5 text-center">
                        FLT(h) × 20 = REST(m)
                      </div>
                      <div className="text-[8.5px] lg:text-[9px] text-slate-300 leading-relaxed font-medium">
                        ex)<br />
                        8h00m → 8×20 = 160m <span className="text-slate-400">(2h40m)</span><br />
                        FLT(m)の端数は ÷3 で分割して足す
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <TimelineGraphic title="Timeline Schedule" restA={rest3} cSize={3} chartTotal={Math.max(totalMins, actualOffsetMins + rest3.totalActualMins + landingOffsetMins)} arrivalTime={arrivalTimeFormatted} />
                  </div>
                </div>
              </div>
            </>
          )}
          {crewSize === 4 && (
            <>
              <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-600/50 relative mt-1 shadow-inner">
                <div className="absolute -top-3 left-4 bg-slate-900 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded border border-slate-600 shadow-md tracking-widest flex items-center gap-1 z-20">
                  <SafeIcon name="Layers" className="w-2.5 h-2.5 text-indigo-400" /> SET 1
                </div>

                <div className="flex flex-col lg:flex-row gap-2 items-stretch mt-1.5">
                  <div className="w-full lg:w-[200px] xl:w-[240px] shrink-0">
                    <CombinedShiftSummaryCard
                      title1="5 Divisions" color1="text-indigo-400"
                      title2="4 Divisions" color2="text-sky-400"
                      rest={rest4}
                      border="border-indigo-500"
                      bgIcon="BatteryMedium"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <TimelineGraphic title="Timeline Schedule" restA={rest5} restB={rest4} cSize={4} chartTotal={Math.max(totalMins, actualOffsetMins + rest5.totalActualMins + landingOffsetMins, actualOffsetMins + rest4.totalActualMins + landingOffsetMins)} arrivalTime={arrivalTimeFormatted} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-600/50 relative mt-2 shadow-inner">
                <div className="absolute -top-3 left-4 bg-slate-900 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded border border-slate-600 shadow-md tracking-widest flex items-center gap-1 z-20">
                  <SafeIcon name="Layers" className="w-2.5 h-2.5 text-purple-400" /> SET 2
                </div>

                <div className="flex flex-col lg:flex-row gap-2 items-stretch mt-1.5">
                  <div className="w-full lg:w-[200px] xl:w-[240px] shrink-0">
                    <CombinedShiftSummaryCard
                      title1="7 Divisions" color1="text-purple-400"
                      title2="6 Divisions" color2="text-emerald-400"
                      rest={rest6}
                      border="border-purple-500"
                      bgIcon="BatteryFull"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <TimelineGraphic title="Timeline Schedule" restA={rest7} restB={rest6} cSize={4} chartTotal={Math.max(totalMins, actualOffsetMins + rest7.totalActualMins + landingOffsetMins, actualOffsetMins + rest6.totalActualMins + landingOffsetMins)} arrivalTime={arrivalTimeFormatted} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
// --- [5-4] BuddyCommView (BUDDY COMM) ---
const BuddyCommView = ({ p }) => {
  const { aircraftRegistrationList, selectedReg, handleRegChange } = p;
  const handleOpen = (reg) => {
    handleRegChange(reg);
    const url = BUDDYCOM_LINKS[reg] || `http://info.ana.co.jp/buddycomm/${reg}.html`;
    if (url) { window.open(url, '_blank'); window.dispatchEvent(new CustomEvent('show-toast', { detail: `${reg} のBUDDY COMMを開きました` })); }
  };
  return (
    <div className="flex flex-col items-center h-full w-full bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-700 mt-0.5 animate-in fade-in overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
      <div className="flex items-center justify-between w-full p-2 border-b border-slate-700/50 bg-slate-900/30 shrink-0"><div className="flex items-center gap-2 px-2"><SafeIcon name="Link" className="w-4 h-4 text-rose-400" /><h2 className="text-sm font-black uppercase tracking-widest text-rose-100">BUDDY COMM</h2></div></div>
      <div className="flex-1 w-full p-3 overflow-y-auto"><div className="max-w-[800px] mx-auto flex flex-col gap-4"><div className="bg-slate-900/60 p-4 rounded-xl border border-slate-600 shadow-inner flex flex-col items-start gap-4"><div className="flex items-center gap-2 border-b border-slate-700 w-full pb-2"><SafeIcon name="MousePointerClick" className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-300 font-bold uppercase">機番を選択してBUDDY COMMを開く</span></div><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 w-full">
        {aircraftRegistrationList.map((ac) => {
          const isSelected = selectedReg === ac.reg;
          return (
            <button key={ac.reg} onClick={() => handleOpen(ac.reg)} className={`py-3 px-2 rounded-lg border font-mono font-black text-xs transition-all flex flex-col items-center justify-center gap-1 shadow-md ${isSelected ? 'bg-rose-600 text-white border-rose-400 scale-105' : 'bg-slate-800 text-rose-300 border-slate-600 hover:border-rose-400 hover:bg-slate-700'}`}>
              <span>{ac.reg}</span><span className={`text-[8px] font-sans px-1.5 py-0.5 rounded ${isSelected ? 'bg-rose-800/50 text-rose-100' : 'bg-slate-900 text-slate-400'}`}>{ac.type}</span>
            </button>
          );
        })}
      </div></div></div></div>
    </div>
  );
};

// --- [5-5] FltInfoView (FLT INFO) ---
const FltInfoView = ({ p }) => {
  const {
    currentFlightInfo, selectedDep, selectedArr, formatTime, trafficTimeRange,
    setTrafficTimeRange, depTrafficMode, setDepTrafficMode, arrTrafficMode, setArrTrafficMode, relatedTraffic, handleAirlineSelect,
    setSelectedDep, setSelectedArr, setSelectedFlightId, selectedFlightId, selectedAirlineCode,
    selectedAirline, selectedCallsign, availableFlights, airlineCodes, airlines,
    callsigns, availableDeps, availableArrs, forceANASelection, handleTrafficSelect
  } = p;

  // ★ コンボボックス用の状態管理
  const [isFltOpen, setIsFltOpen] = useState(false);
  const fltRef = useRef(null);

  // コンボボックスの外側をクリックした時に閉じる処理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fltRef.current && !fltRef.current.contains(event.target)) {
        setIsFltOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ユーザーが入力した文字と、選択されたエアラインで候補リストを絞り込む
  const filteredFlights = useMemo(() => {
    let flights = availableFlights;
    // 左で選択されているエアラインがあれば、それで絞り込む
    if (selectedAirlineCode) {
      flights = flights.filter(f => f.airlineCode === selectedAirlineCode);
    }
    
    if (!selectedFlightId) return flights;
    return flights.filter(f => 
      f.flightNo.toLowerCase().includes(selectedFlightId.toLowerCase())
    );
  }, [availableFlights, selectedFlightId, selectedAirlineCode]);

  // ★ プルダウン選択時のハンドラーを追加 (一方をOFFにする)
  const handleDepModeChange = (e) => {
      const val = e.target.value;
      setDepTrafficMode(val);
      if (val !== 'OFF') setArrTrafficMode('OFF');
  };

  const handleArrModeChange = (e) => {
      const val = e.target.value;
      setArrTrafficMode(val);
      if (val !== 'OFF') setDepTrafficMode('OFF');
  };

  return (
    <div className="flex flex-col gap-1 w-full flex-1 animate-in fade-in duration-300 mt-0.5">
        {/* --- FLIGHT INFORMATION & TRAFFIC SECTION --- */}
        <div className="bg-slate-800/80 rounded-[1.5rem] p-1.5 lg:p-2 shadow-2xl border border-slate-700 flex flex-col gap-1.5 relative mt-0 w-full">
            {/* ★紫色の左線を綺麗に角丸に収めるための専用背景レイヤー */}
            <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
            </div>
            
            {/* 上段: 基本フライト情報 */}
            <div className="flex flex-col gap-2 w-full relative z-10">
                
                {/* ★ 1行目: タイトル */}
                <div className="flex items-center gap-1.5 pl-2 pt-0.5 shrink-0">
                    <SafeIcon name="Map" className="w-4 h-4 text-purple-400" />
                    <h2 className="text-[12px] lg:text-[14px] xl:text-[15px] font-black uppercase tracking-widest text-purple-100 whitespace-nowrap leading-none">FLT INFO</h2>
                </div>

                {/* ★ 2行目: 入力コントロール群 (サイズ拡大・文字拡大) */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full pl-2 pr-1">
                    {/* Code Select */}
                    <div className="relative group w-[60px] lg:w-[75px] xl:w-[90px] shrink-0">
                        <select 
                            value={selectedAirlineCode}
                            onChange={(e) => handleAirlineSelect('code', e.target.value)}
                            className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-purple-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-purple-400 transition-colors w-full truncate"
                        >
                            <option value="">Code</option>
                            {airlineCodes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-purple-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-purple-400">
                            <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
                        </div>
                    </div>
                    
                    {/* Name Select */}
                    <div className="relative group min-w-[120px] flex-[2]">
                        <select 
                            value={selectedAirline}
                            onChange={(e) => handleAirlineSelect('name', e.target.value)}
                            className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-purple-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-purple-400 transition-colors w-full truncate"
                        >
                            <option value="">Airline Name</option>
                            {airlines.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-purple-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-purple-400">
                            <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
                        </div>
                    </div>
                    
                    {/* Call Sign Select */}
                    <div className="relative group min-w-[90px] flex-[1.5]">
                        <select 
                            value={selectedCallsign}
                            onChange={(e) => handleAirlineSelect('callsign', e.target.value)}
                            className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-purple-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-purple-400 transition-colors w-full truncate"
                        >
                            <option value="">Call Sign</option>
                            {callsigns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-purple-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-purple-400">
                            <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
                        </div>
                    </div>

                    {/* ★ FLT NO Select (Combo Box) */}
                    <div className="relative group w-[70px] lg:w-[85px] xl:w-[100px] shrink-0" ref={fltRef}>
                        <input 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={selectedFlightId}
                            onChange={(e) => {
                                setSelectedFlightId(e.target.value);
                                setIsFltOpen(true);
                            }}
                            onFocus={() => setIsFltOpen(true)}
                            placeholder="FLT NO."
                            className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-purple-400 shadow-md appearance-none hover:bg-slate-500 hover:border-purple-400 transition-colors w-full truncate uppercase placeholder:text-slate-400 placeholder:normal-case placeholder:font-bold"
                        />
                        <div 
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-purple-500/40 p-0.5 lg:p-1 rounded-md cursor-pointer transition-colors border border-slate-500 group-hover:border-purple-400"
                            onClick={() => setIsFltOpen(!isFltOpen)}
                        >
                            <SafeIcon name="ChevronDown" className={`w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white transition-transform ${isFltOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {/* ドロップダウンリスト (下に開く) */}
                        {isFltOpen && (
                            <div className="absolute top-[110%] left-0 w-[130px] bg-slate-700 border border-slate-400 rounded-lg shadow-2xl z-50 max-h-[200px] overflow-y-auto custom-scrollbar flex flex-col py-1 mt-1">
                                {filteredFlights.length > 0 ? (
                                    filteredFlights.map((f, idx) => (
                                        <button
                                            key={`${f.airlineCode}-${f.flightNo}-${idx}`}
                                            onClick={() => {
                                                setSelectedFlightId(f.flightNo);
                                                handleAirlineSelect('code', f.airlineCode);
                                                setIsFltOpen(false);
                                            }}
                                            className="text-left px-3 py-2 text-[11px] lg:text-[13px] font-black text-white hover:bg-purple-500 transition-colors flex items-center gap-2"
                                        >
                                            <span className="text-purple-300 w-[24px] shrink-0 text-center">{f.airlineCode}</span>
                                            <span className="truncate">{f.flightNo}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-2 py-2 text-[11px] text-slate-400 font-bold whitespace-nowrap text-center">No match</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* DEP Select */}
                    <div className="relative group w-[60px] lg:w-[75px] xl:w-[90px] shrink-0">
                        <select 
                            value={selectedDep}
                            onChange={(e) => { 
                                const val = e.target.value;
                                setSelectedDep(val); 
                                setSelectedFlightId(""); 
                                if (val) forceANASelection();
                            }}
                            disabled={availableDeps.length === 0}
                            className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-sky-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-sky-400 transition-colors w-full truncate disabled:opacity-50 disabled:bg-slate-700 disabled:cursor-not-allowed"
                        >
                            <option value="">DEP</option>
                            {selectedDep && !availableDeps.includes(selectedDep) && <option value={selectedDep}>{selectedDep}</option>}
                            {availableDeps.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-sky-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-sky-400">
                            <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
                        </div>
                    </div>

                    {/* ARR Select */}
                    <div className="relative group w-[60px] lg:w-[75px] xl:w-[90px] shrink-0">
                        <select 
                            value={selectedArr}
                            onChange={(e) => { 
                                const val = e.target.value;
                                setSelectedArr(val); 
                                setSelectedFlightId(""); 
                                if (val) forceANASelection();
                            }}
                            disabled={availableArrs.length === 0}
                            className="bg-slate-600 border border-slate-400 rounded-lg pl-2 pr-6 py-1 lg:py-1.5 text-[11px] lg:text-[13px] xl:text-[15px] font-black text-white outline-none focus:border-emerald-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-emerald-400 transition-colors w-full truncate disabled:opacity-50 disabled:bg-slate-700 disabled:cursor-not-allowed"
                        >
                            <option value="">ARR</option>
                            {selectedArr && !availableArrs.includes(selectedArr) && <option value={selectedArr}>{selectedArr}</option>}
                            {availableArrs.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 group-hover:bg-emerald-500/40 p-0.5 lg:p-1 rounded-md pointer-events-none transition-colors border border-slate-500 group-hover:border-emerald-400">
                            <SafeIcon name="ChevronDown" className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-200 group-hover:text-white" />
                        </div>
                    </div>
                </div>

                {/* ★ 3行目: Information Badges (表示窓) 再び2行構成（縦並び flex-col, justify-center）に戻す */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 w-full pl-2 pr-1">
                    {[
                        { label: 'DEP', val: currentFlightInfo?.origin || selectedDep || '--', color: 'text-white' },
                        { label: 'ARR', val: currentFlightInfo?.dest || selectedArr || '--', color: 'text-white' },
                        { label: 'DEP(LCL)', val: formatTime(currentFlightInfo?.dep), color: 'text-sky-400' },
                        { label: 'ARR(LCL)', val: formatTime(currentFlightInfo?.arr), color: 'text-emerald-400' },
                        { label: 'EQUIP', val: currentFlightInfo?.equipCode || '--', color: 'text-slate-200' },
                        { label: 'SPEED', val: currentFlightInfo?.speed || '--', color: 'text-cyan-400' }
                    ].map((info, idx) => (
                        <div key={info.label + idx} className="flex-1 bg-slate-900/60 rounded-md px-2.5 py-1.5 border border-slate-700 shadow-inner flex flex-col justify-center overflow-hidden min-w-[75px]">
                            <span className="text-[9px] lg:text-[10px] xl:text-[11px] font-bold text-slate-400 uppercase leading-none mb-1 whitespace-nowrap tracking-tighter text-center">{info.label}</span>
                            <span className={`text-[15px] lg:text-[17px] xl:text-[19px] font-mono font-black leading-none truncate tracking-tighter text-center ${info.color}`}>{info.val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 下段: トラフィック情報 */}
            {currentFlightInfo && (
                <div className="mt-1 pt-1.5 border-t border-slate-700/50 flex flex-col gap-1 w-full relative z-10 pl-2 pr-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                            <SafeIcon name="Radar" className="w-4 h-4 text-purple-400" />
                            <span className="text-[12px] lg:text-[14px] xl:text-[15px] font-black text-purple-100 uppercase tracking-widest leading-none mt-0.5">Traffic Watch</span>
                            
                            <div className="relative group flex items-center h-full ml-2">
                                <select 
                                    value={trafficTimeRange}
                                    onChange={(e) => setTrafficTimeRange(Number(e.target.value))}
                                    className="bg-slate-600 border border-slate-400 rounded-md text-[10px] lg:text-[11px] xl:text-[12px] font-black text-white pl-2 pr-5 py-0.5 outline-none focus:border-purple-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-purple-400 transition-colors tracking-widest leading-none"
                                >
                                    {[10, 20, 30, 40, 50, 60].map(min => (
                                        <option key={min} value={min}>±{min} MINS</option>
                                    ))}
                                </select>
                                <SafeIcon name="ChevronDown" className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-200 group-hover:text-white pointer-events-none transition-colors" />
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5">
                            <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-600 shadow-sm">
                                <span className="text-[9px] xl:text-[10px] font-black text-sky-400 pl-1.5 uppercase whitespace-nowrap">DEP AIRPORT {currentFlightInfo?.origin && currentFlightInfo.origin !== '--' ? `(${currentFlightInfo.origin})` : ''}</span>
                                <div className="relative group flex items-center h-full">
                                    <select 
                                        value={depTrafficMode}
                                        onChange={handleDepModeChange}
                                        className="bg-slate-600 border border-slate-500 rounded-md text-[9px] xl:text-[10px] font-black text-white pl-2 pr-5 py-0.5 outline-none focus:border-sky-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-sky-400 transition-colors"
                                    >
                                        <option value="DEP">DEP</option>
                                        <option value="ARR">ARR</option>
                                        <option value="ALL">ALL</option>
                                        <option value="OFF">OFF</option>
                                    </select>
                                    <SafeIcon name="ChevronDown" className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-200 pointer-events-none" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-600 shadow-sm">
                                <span className="text-[9px] xl:text-[10px] font-black text-emerald-400 pl-1.5 uppercase whitespace-nowrap">ARR AIRPORT {currentFlightInfo?.dest && currentFlightInfo.dest !== '--' ? `(${currentFlightInfo.dest})` : ''}</span>
                                <div className="relative group flex items-center h-full">
                                    <select 
                                        value={arrTrafficMode}
                                        onChange={handleArrModeChange}
                                        className="bg-slate-600 border border-slate-500 rounded-md text-[9px] xl:text-[10px] font-black text-white pl-2 pr-5 py-0.5 outline-none focus:border-emerald-400 shadow-md appearance-none cursor-pointer hover:bg-slate-500 hover:border-emerald-400 transition-colors"
                                    >
                                        <option value="OFF">OFF</option>
                                        <option value="DEP">DEP</option>
                                        <option value="ARR">ARR</option>
                                        <option value="ALL">ALL</option>
                                    </select>
                                    <SafeIcon name="ChevronDown" className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-200 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* ★ 案1＆2融合: リスト型（電光掲示板風）レイアウト + アライメントとレスポンシブの調整 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 w-full pb-0.5 mt-0.5">
                        {relatedTraffic.length > 0 ? relatedTraffic.map((t, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => handleTrafficSelect(t)}
                                className={`relative rounded-lg px-2.5 py-2.5 border shadow-sm flex items-center w-full overflow-hidden cursor-pointer transition-all group ${
                                    t._isCurrent 
                                    ? 'bg-purple-900/80 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.6)] z-10 scale-[1.01]' 
                                    : 'bg-slate-900/60 border-slate-600 hover:bg-slate-800 hover:border-purple-400 hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center w-full gap-1.5 relative z-10">
                                    
                                    {/* 1. 時間 */}
                                    <div className="w-[38px] xl:w-[42px] shrink-0 text-left">
                                        <span className={`text-[14px] xl:text-[15px] font-mono font-black leading-none ${t._tType === 'DEP' ? 'text-sky-400' : 'text-emerald-400'}`}>
                                            {formatTime(t._tTime)}
                                        </span>
                                    </div>
                                    
                                    {/* 2. 縦線 */}
                                    <div className="w-[1px] h-8 bg-slate-600/50 shrink-0 hidden sm:block"></div>
                                    
                                    {/* 3. 便名 & コールサイン */}
                                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className={`text-[13px] xl:text-[14px] font-black truncate leading-none transition-colors ${t._isCurrent ? 'text-purple-300' : 'text-white group-hover:text-purple-300'}`}>
                                                {t.airlineCode} {t.flightNo}
                                            </span>
                                            <span className="text-[9px] xl:text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate leading-none">
                                                {t.callsign || t.callSign || t.airline || "---"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* 4. 機材 */}
                                    <div className="w-[36px] xl:w-[42px] shrink-0 text-right">
                                        <span className="text-[11px] xl:text-[12px] font-bold text-slate-300 truncate leading-none">
                                            {t.equipCode}
                                        </span>
                                    </div>
                                    
                                    {/* 5. TO/FM 目的地 + 基準空港 */}
                                    <div className="w-[74px] xl:w-[82px] shrink-0 flex flex-col items-start justify-center">
                                        <div className="flex items-center justify-start gap-1">
                                            {t._tType === 'DEP' ? (
                                                <>
                                                    <span className="inline-block w-[22px] text-center bg-sky-500/20 text-sky-400 px-1 py-0.5 rounded-[4px] font-black tracking-widest text-[9px] xl:text-[10px] border border-sky-500/30">TO</span> 
                                                    <span className="text-white text-[13px] xl:text-[14px] font-black truncate">{t.dest}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="inline-block w-[22px] text-center bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded-[4px] font-black tracking-widest text-[9px] xl:text-[10px] border border-emerald-500/30">FM</span> 
                                                    <span className="text-white text-[13px] xl:text-[14px] font-black truncate">{t.origin}</span>
                                                </>
                                            )}
                                        </div>
                                        <span className={`text-[8.5px] font-bold mt-0.5 leading-none ${t._basePort === (currentFlightInfo?.origin || selectedDep) ? 'text-sky-400/80' : 'text-emerald-400/80'}`}>
                                            @ {t._basePort}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-3 text-center text-[12px] xl:text-[13px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/40 rounded-lg border border-slate-600/50 border-dashed">
                                No other traffic within ±{trafficTimeRange} mins
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

// --- [5-6] DashboardView (DASHBOARD) ---
const DashboardView = ({ state, updateState, computed, aircraftRegistrationList, handleRegChange, setAircraftType, cruiseWtInputText, setCruiseWtInputText, ldgWtInputText, setLdgWtInputText }) => {
  const highlightToggleClass = (isActive, variant = "blue") => isActive ? `px-2 py-0.5 text-[9px] font-bold border-2 rounded transition-all tracking-wider ${variant === 'green' ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10' : variant === 'red' ? 'border-red-400 text-red-400 bg-red-400/10' : 'border-blue-400 text-blue-400 bg-blue-400/10'}` : "px-2 py-0.5 text-[9px] font-bold border border-slate-700 rounded transition-all tracking-wider text-slate-500 hover:text-slate-400";
  return (
    <div className="flex flex-col gap-1 overflow-y-auto flex-1 h-full pr-1 animate-in fade-in">
      <div className="flex flex-col bg-gradient-to-r from-slate-900 via-[#131c2f] to-slate-900 p-2 rounded-xl border border-slate-700/80 shadow-lg gap-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/3 h-full bg-blue-500/5 blur-xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 z-10 w-full">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-500/30 shadow-inner"><SafeIcon name="PlaneTakeoff" className="w-4 h-4 text-blue-400" /></div>
            <span className="text-white font-black tracking-tighter text-[11px] sm:text-xs uppercase drop-shadow-sm">AIRCRAFT PROFILE</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
              <select value={state.selectedReg} onChange={(e) => handleRegChange(e.target.value)} className="w-full md:w-auto bg-slate-800/80 text-white text-[11px] font-black px-3 pr-8 py-1.5 rounded-lg border border-slate-600 outline-none hover:border-blue-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-inner transition-all appearance-none cursor-pointer tracking-widest">
                <option value="">-- REG --</option>{aircraftRegistrationList.map(ac => (<option key={ac.reg} value={ac.reg}>{ac.reg}</option>))}
              </select>
              <SafeIcon name="ChevronDown" className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="flex bg-slate-800/80 rounded-lg p-1 border border-slate-600 shadow-inner w-full md:w-auto">
              {[{ type: "777-200", label: "772" }, { type: "777-300", label: "773" }, { type: "777-300ER", label: "77W" }, { type: "777F", label: "77F" }].map(d => (
                <button key={d.type} onClick={() => setAircraftType(d.type)} className={`flex-1 md:flex-none px-3 py-1 text-[10px] font-black rounded-md transition-all whitespace-nowrap ${d.type === state.selectedType ? "bg-blue-600 text-white shadow-md shadow-blue-900/50 scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-slate-700/50"}`}>{d.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 w-full mt-0.5 border-t border-slate-700/50 pt-1.5 z-10">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] md:text-[10px] text-slate-400 w-full leading-none">
            <span className="flex items-center gap-1 font-bold text-slate-300"><SafeIcon name="Maximize" className="w-3 h-3 text-blue-400" /> {computed.dim.span} x {computed.dim.length} x {computed.dim.height}</span>
            <span className="text-slate-600 hidden sm:inline">|</span><span>RFFS: <strong className="text-slate-300">ICAO 9 / FAA E</strong></span>
            <span className="text-slate-600 hidden sm:inline">|</span><span>OUTER GEAR: <strong className="text-slate-300">12.9M (CODE F)</strong></span>
            <span className="text-slate-600 hidden sm:inline">|</span><span>WASHOUT: <strong className="text-slate-300">{computed.washout}</strong></span>
            <span className="text-slate-600 hidden sm:inline">|</span><span className="flex items-center gap-1"><SafeIcon name="Users" className="w-3 h-3 text-amber-400" /> <strong className="text-slate-300">{computed.configText}</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] md:text-[10px] text-slate-400 w-full leading-none mt-1">
            <span>ETOPS: <strong className="text-slate-300">{computed.etops}</strong></span><span className="text-slate-600 hidden sm:inline">|</span><span>T/O: <strong className="text-slate-300">{computed.toSetting}</strong></span><span className="text-slate-600 hidden sm:inline">|</span><span>OXY: <strong className="text-slate-300 truncate max-w-[200px] sm:max-w-none">{computed.oxy}</strong></span><span className="text-slate-600 hidden sm:inline">|</span><span>ENG OIL: <strong className="text-slate-300">{computed.engOil}</strong></span><span className="text-slate-600 hidden sm:inline">|</span><span>BRK TEMP: <strong className="text-slate-300">{computed.brakeTemp}</strong></span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] md:text-[10px] text-slate-400 w-full leading-none mt-1">
             <span className="font-bold text-rose-400 tracking-wider flex items-center gap-0.5 uppercase whitespace-nowrap"><SafeIcon name="Wind" className="w-3 h-3" /> X-WIND</span>
             <span className="font-mono text-white text-[8px] sm:text-[9px] truncate">DRY:38 | WET:25 | CC3:20(15) | CC2:15(10) | CC1:10 <span className="text-slate-500">*() &lt;2700m</span></span>
             <span className="text-slate-600 hidden sm:inline ml-1">|</span>
             <span className="font-bold text-amber-500 tracking-wider flex items-center gap-0.5 uppercase whitespace-nowrap sm:ml-1"><SafeIcon name="AlertTriangle" className="w-3 h-3" /> DG MAX</span>
             <span>火薬類: <strong className="text-slate-300">{computed.dgExp}</strong></span><span className="text-slate-600 hidden sm:inline">|</span><span>ISO: <strong className="text-slate-300">{computed.dgIso}</strong></span><span className="text-slate-600 hidden sm:inline">|</span><span>DRY: <strong className="text-slate-300">{computed.dgDry}</strong></span>
             <div className="flex items-center gap-1 ml-auto shrink-0">
               <span className="bg-slate-800 text-[8px] md:text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700 shadow-sm text-slate-300">Taxi: {computed.taxiFuelRate} lbs/m</span>
               <span className="bg-slate-800 text-[8px] md:text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700 shadow-sm text-slate-300">APU: 9 lbs/m</span>
             </div>
          </div>
        </div>
      </div>
      <div className="bg-[#131c2f] border border-slate-700 rounded-lg p-1.5 shadow-xl">
        <div className="flex items-center gap-1 mb-1 text-cyan-400 font-bold tracking-widest text-[9px] border border-cyan-500/50 px-1.5 py-0.5 rounded-full bg-cyan-500/10 w-fit whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>CRUISE PERFORMANCE</div>
        <div className="flex flex-col gap-1.5">
          <div className="flex w-full gap-1 overflow-x-auto hide-scrollbar">
            <div className="flex-1 min-w-[65px] border border-blue-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
              <div className="text-center text-[7px] sm:text-[8px] font-bold text-blue-400 pb-0.5 tracking-wider">OPT ALT</div>
              <div className="flex-1 flex justify-center items-center"><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter leading-none">{formatNum(computed.optAlt)}</span><span className="text-[8px] text-slate-500 ml-0.5">FT</span></div>
            </div>
            <div className="flex-1 min-w-[65px] border border-orange-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
              <div className="text-center text-[7px] sm:text-[8px] font-bold text-orange-400 pb-0.5 tracking-wider">MAX ALT</div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="flex items-baseline"><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter leading-none">{formatNum(computed.maxAlt)}</span><span className="text-[8px] text-slate-500 ml-0.5">FT</span></div>
                <span className="text-[6px] text-orange-500/70 bg-orange-500/10 px-1 rounded mt-0.5 whitespace-nowrap leading-none scale-90">{computed.limitReason}</span>
              </div>
            </div>
            <div className="flex-1 min-w-[65px] border border-purple-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
              <div className="text-center text-[7px] sm:text-[8px] font-bold text-purple-400 pb-0.5 tracking-wider">VMO / MMO</div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="flex items-baseline"><span className="text-base sm:text-xl font-extrabold text-white font-mono tracking-tighter leading-none">{`${computed.vmo}/.${computed.mmo.toString().replace("0.", "")}`}</span></div>
                <span className="text-[6px] text-purple-400/70 bg-purple-500/10 px-1 rounded mt-0.5 whitespace-nowrap scale-90">KIAS / MACH</span>
              </div>
            </div>
            <div className="flex-1 min-w-[70px] border border-indigo-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
              <div className="text-center text-[7px] sm:text-[8px] font-bold text-indigo-400 pb-0.5 tracking-wider">FLAP UP MAN</div>
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="flex items-baseline"><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter leading-none">{computed.flapUpManeuver}</span><span className="text-[8px] text-slate-500 ml-0.5">KTS</span></div>
                <span className="text-[6px] text-indigo-400/70 bg-indigo-500/10 px-1 rounded mt-0.5 scale-90">Vref30 + 80</span>
              </div>
            </div>
            <div className={`flex-[1.2] min-w-[120px] bg-slate-800/80 border border-slate-700 border-t-[3px] ${computed.minSpdBorderClass} rounded flex flex-col justify-between items-center relative overflow-hidden p-1 group`}>
              <div className="absolute top-0.5 right-0.5 flex flex-col items-end gap-[1px]">
                <span className="text-[6px] font-mono text-slate-400 bg-slate-900/80 px-0.5 rounded border border-slate-600 leading-none">{computed.holdSpdLabelWt}</span><span className="text-[6px] font-mono text-slate-400 bg-slate-900/80 px-0.5 rounded border border-slate-600 leading-none">{computed.holdSpdLabelAlt}</span>
              </div>
              <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 mt-0"><SafeIcon name="MapPin" className={`w-2.5 h-2.5 ${computed.minSpdIconClass}`} /> MINIMUM SPD</span>
              <div className="flex items-center gap-1 my-0.5">
                <div className="text-lg sm:text-2xl font-black tracking-tighter leading-none flex items-baseline gap-0.5">{computed.holdSpdJsx}<span className="text-[8px] text-slate-500 font-normal tracking-normal ml-0.5">{computed.spdUnit}</span></div>
              </div>
              <div className="mt-auto flex flex-row items-center justify-center bg-slate-900/50 py-0.5 px-1 rounded-md border border-slate-700/50 w-full"><span className="text-[5px] sm:text-[6.5px] font-mono font-bold text-slate-300 whitespace-nowrap text-center">{computed.minSpdTypeJsx}</span></div>
            </div>
          </div>
          <div className="w-full border border-slate-700 rounded p-1.5 flex gap-2 bg-[#1e293b]">
            <div className="flex-[2] flex flex-col justify-center">
              <div className="flex justify-between items-end mb-0.5">
                <span className="text-[8px] text-slate-400 font-bold tracking-wider">GROSS WT</span>
                <div className="flex items-center"><input type="text" value={cruiseWtInputText} onChange={(e) => setCruiseWtInputText(e.target.value)} onBlur={() => { const w = parseWeightInput(cruiseWtInputText); if (w !== null) updateState('cruiseWeight', w); else setCruiseWtInputText(formatWeightDisplay(state.cruiseWeight)); }} className="bg-transparent text-right text-[10px] text-white font-bold font-mono w-12 border-b border-transparent hover:border-slate-500 focus:border-emerald-500 focus:outline-none transition-colors" /><span className="text-[7px] text-slate-500 ml-0.5">KLBS</span></div>
              </div>
              <input type="range" step="1000" min={computed.minCruiseWeight} max={computed.maxCruiseWeight} value={computed.clampedCruiseWeight} onChange={(e) => updateState('cruiseWeight', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 my-1.5" />
              <div className="flex justify-between text-[7px] text-slate-500 mt-0.5 font-mono"><span>{Math.round(computed.minCruiseWeight / 1000)}k</span><span>{Math.round(computed.maxCruiseWeight / 1000)}k</span></div>
            </div>
            <div className="w-px bg-slate-700 my-1 self-stretch"></div>
            <div className="flex-[1.5] flex flex-col justify-center min-w-[75px]">
              <div className="flex justify-between items-end mb-0.5"><span className="text-[8px] text-slate-400 font-bold tracking-wider">CRZ ALT</span><span className="text-[10px] text-white font-bold font-mono"><span>{formatNum(state.cruiseAltitude)}</span><span className="text-[7px] text-slate-500 ml-0.5">FT</span></span></div>
              <input type="range" min="0" max="43000" step="1000" value={state.cruiseAltitude} onChange={(e) => updateState('cruiseAltitude', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
              <div className="flex justify-between text-[7px] text-slate-500 mt-0.5 font-mono"><span>0</span><span>43k</span></div>
            </div>
            <div className="w-px bg-slate-700 my-1 self-stretch"></div>
            <div className="flex-[1] flex flex-col justify-center min-w-[60px]">
              <div className="flex justify-between items-end mb-0.5"><span className="text-[8px] text-slate-400 font-bold tracking-wider">ISA DEV</span><span className="text-[10px] text-white font-bold font-mono">{(state.isaDev >= 0 ? '+' : '') + state.isaDev + '°C'}</span></div>
              <input type="range" min="-20" max="30" step="1" value={state.isaDev} onChange={(e) => updateState('isaDev', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
              <div className="flex justify-between text-[7px] text-slate-500 mt-0.5 font-mono"><span>-20</span><span>+30</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#0b101d] border border-slate-700/80 rounded-lg p-1 sm:p-1.5 shadow-2xl space-y-1.5">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-1">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 text-emerald-400 font-bold tracking-widest text-[9px] border border-emerald-500/50 px-1.5 py-0.5 rounded-full bg-emerald-500/10 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>LANDING</div>
            <div className="text-[8px] text-slate-500 font-mono pl-1">ADJUSTED DISTANCE</div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <div className="flex gap-0.5"><button className={highlightToggleClass(state.landingCondition === 'Normal', 'green')} onClick={() => updateState('landingCondition', 'Normal')}>NORMAL</button><button className={highlightToggleClass(state.landingCondition === '1 ENG INOP', 'red')} onClick={() => updateState('landingCondition', '1 ENG INOP')}>ENG INOP</button></div>
            <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
            <div className="flex gap-0.5"><button className={highlightToggleClass(state.selectedRwyCond === '6-DRY', 'green')} onClick={() => updateState('selectedRwyCond', '6-DRY')}>DRY</button><button className={highlightToggleClass(state.selectedRwyCond === '5-WET', 'blue')} onClick={() => updateState('selectedRwyCond', '5-WET')}>WET</button></div>
            <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
            <div className="flex items-center gap-0.5"><button className={highlightToggleClass(state.reverserConfig === 'Both')} onClick={() => updateState('reverserConfig', 'Both')}>BOTH</button><button className={highlightToggleClass(state.reverserConfig === 'One')} onClick={() => updateState('reverserConfig', 'One')}>ONE</button><button className={highlightToggleClass(state.reverserConfig === 'None', 'red')} onClick={() => updateState('reverserConfig', 'None')}>NO REV</button></div>
            <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5"><button className={highlightToggleClass(state.factConfig === '1.15', 'green')} onClick={() => updateState('factConfig', '1.15')}>FACT 1.15</button><button className={highlightToggleClass(state.factConfig === '1.00')} onClick={() => updateState('factConfig', '1.00')}>BASE 1.00</button></div>
              <span className="text-[8px] text-slate-500 font-mono hidden sm:inline ml-1 whitespace-nowrap">OAT 30℃ for DRY/WET</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 w-full">
          <div className="border border-pink-500/60 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
            <div className="text-center text-[7.5px] sm:text-[8.5px] font-black text-pink-400 pb-0.5 tracking-widest bg-[#131c2f]">TARGET N1</div>
            <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
              <div className="flex justify-between items-baseline leading-none"><div className="flex items-baseline gap-1"><span className="text-[9px] sm:text-[11px] text-pink-300 font-bold">{computed.activeFlaps[0]}</span><span className="text-[7px] sm:text-[8px] text-pink-400 font-mono font-bold tracking-tighter">{computed.pchF1}</span></div><div className="flex items-baseline"><span className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono tracking-tighter">{computed.n1F1}</span><span className="text-[7px] text-emerald-400/80 font-bold ml-[1px]">%</span></div></div>
              <div className="flex justify-between items-baseline leading-none"><div className="flex items-baseline gap-1"><span className="text-[9px] sm:text-[11px] text-pink-300 font-bold">{computed.activeFlaps[1]}</span><span className="text-[7px] sm:text-[8px] text-pink-400 font-mono font-bold tracking-tighter">{computed.pchF2}</span></div><div className="flex items-baseline"><span className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono tracking-tighter">{computed.n1F2}</span><span className="text-[7px] text-emerald-400/80 font-bold ml-[1px]">%</span></div></div>
            </div>
            <div className="px-1 py-0.5 text-[6.5px] sm:text-[7px] text-pink-400/80 font-mono font-bold text-center flex justify-between mt-auto border-t border-pink-500/30 pt-0.5"><span>{computed.engine}</span><span className="text-pink-300">Vref+{state.appSpeedAdditive}</span></div>
          </div>
          <div className="border border-slate-700 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
            <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-400 pb-0.5 tracking-wider bg-[#131c2f]">MAX MAN</div>
            <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span><div className="flex items-baseline gap-1"><span className="text-[6px] text-slate-500 font-mono tracking-tighter">{computed.penaltyF25}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distMan1)}</span></div></div>
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span><div className="flex items-baseline gap-1"><span className="text-[6px] text-slate-500 font-mono tracking-tighter">{computed.penaltyF30}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distMan2)}</span></div></div>
            </div>
            <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
          </div>
          <div className="border border-slate-700 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
            <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-400 pb-0.5 tracking-widest bg-[#131c2f]">MAX AUTO</div>
            <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distMax1)}</span></div>
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distMax2)}</span></div>
            </div>
            <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
          </div>
          <div className="border border-slate-700 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
            <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-400 pb-0.5 tracking-wider bg-[#131c2f]">M TO FT</div>
            <div className="flex-1 flex flex-col justify-around py-0.5 px-1 font-mono text-[9px] sm:text-xs"><div className="flex justify-between items-baseline leading-none"><span className="text-slate-500">3000m:</span><span className="font-bold text-slate-300">9,843'</span></div><div className="flex justify-between items-baseline leading-none"><span className="text-slate-500">2800m:</span><span className="font-bold text-slate-300">9,186'</span></div><div className="flex justify-between items-baseline leading-none"><span className="text-slate-500">2500m:</span><span className="font-bold text-slate-300">8,202'</span></div><div className="flex justify-between items-baseline leading-none"><span className="text-slate-500">2000m:</span><span className="font-bold text-slate-300">6,562'</span></div></div>
            <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
          </div>
          <div className="border border-slate-700 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
            <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 4</div>
            <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb41)}</span></div>
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb42)}</span></div>
            </div>
            <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
          </div>
          <div className="border border-slate-700 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
            <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 3</div>
            <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb31)}</span></div>
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb32)}</span></div>
            </div>
            <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
          </div>
          <div className="border border-slate-700 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
            <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 2</div>
            <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb21)}</span></div>
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb22)}</span></div>
            </div>
            <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
          </div>
          <div className="border border-slate-700 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
            <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 1</div>
            <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb11)}</span></div>
              <div className="flex justify-between items-baseline leading-none"><span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span><span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb12)}</span></div>
            </div>
            <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5"><span>-</span><span>-</span></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 pt-1">
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827]">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[8px] text-slate-400 font-bold tracking-wider">LANDING WT</span>
              <div className="flex items-center"><input type="text" value={ldgWtInputText} onChange={(e) => setLdgWtInputText(e.target.value)} onBlur={() => { const w = parseWeightInput(ldgWtInputText); if (w !== null) updateState('landingWeight', w); else setLdgWtInputText(formatWeightDisplay(state.landingWeight)); }} className="bg-transparent text-right text-[10px] text-white font-bold font-mono w-12 border-b border-transparent hover:border-slate-500 focus:border-emerald-500 focus:outline-none transition-colors" /><span className="text-[7px] text-slate-500 ml-0.5">KLBS</span></div>
            </div>
            <input type="range" step="1000" min={computed.landingMinWeight} max={computed.maxAvailableLdgWt} value={computed.clampedLandingWeight} onChange={(e) => updateState('landingWeight', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 my-1.5" />
            <div className="flex justify-between text-[7px] text-slate-500 mt-0.5 font-mono"><span>{Math.round(computed.landingMinWeight / 1000)}k</span><span>MAX: {Math.round(computed.maxAvailableLdgWt / 1000)}k</span></div>
          </div>
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[8px] text-slate-400 font-bold tracking-wider">WIND COMP</span><span className="text-[10px] text-white font-bold font-mono"><span>{computed.windText}</span><span className="text-[7px] text-slate-500 ml-0.5">KT</span></span>
            </div>
            <input type="range" min="-20" max="15" step="5" value={state.windComponent} onChange={(e) => updateState('windComponent', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
          </div>
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[8px] text-slate-400 font-bold tracking-wider">APP SPD ADD</span><span className="text-[10px] text-white font-bold font-mono"><span>+{state.appSpeedAdditive}</span><span className="text-[7px] text-slate-500 ml-0.5">KT</span></span>
            </div>
            <input type="range" min="0" max="30" step="5" value={state.appSpeedAdditive} onChange={(e) => updateState('appSpeedAdditive', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
          </div>
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[8px] text-slate-400 font-bold tracking-wider">PRESS ALT</span><span className="text-[10px] text-white font-bold font-mono"><span>{formatNum(state.pressureAlt)}</span><span className="text-[7px] text-slate-500 ml-0.5">FT</span></span>
            </div>
            <input type="range" min="0" max="8000" step="1000" value={state.pressureAlt} onChange={(e) => updateState('pressureAlt', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
          </div>
          <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
            <div className="flex justify-between items-end mb-0.5">
              <span className="text-[8px] text-slate-400 font-bold tracking-wider">RWY SLOPE</span><span className="text-[10px] text-white font-bold font-mono"><span>{computed.slopeText}</span><span className="text-[7px] text-slate-500 ml-0.5">%</span></span>
            </div>
            <input type="range" min="-2" max="2" step="1" value={state.rwSlope} onChange={(e) => updateState('rwSlope', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- [5-7] ApproachCalcView (APP CALC) ---
const ApproachCalcView = () => {
  const [activeTab, setActiveTab] = useState('path'); 

  // --- MANUAL STATES ---
  const [fafAlt, setFafAlt] = useState(1500);
  const [distMapFaf, setDistMapFaf] = useState(3.0);
  const [distThrMap, setDistThrMap] = useState(1.5);
  const [elev, setElev] = useState(0);
  const [oat, setOat] = useState(15);
  const [gs, setGs] = useState(145); 
  
  const [wind, setWind] = useState(0);
  const [crossWind, setCrossWind] = useState(0);
  const [rwyTrk, setRwyTrk] = useState(360);
  
  const [tfpAlt, setTfpAlt] = useState(1500);
  const [tfpPatternWidth, setTfpPatternWidth] = useState(2.5);
  const [tfpGsDw, setTfpGsDw] = useState(170); 
  const [bankBase, setBankBase] = useState(25);
  const [bankFinal, setBankFinal] = useState(20);

  const [mda, setMda] = useState(600);
  const [circlingPatternWidth, setCirclingPatternWidth] = useState(1.5);
  const [circlingAppSpd, setCirclingAppSpd] = useState(145);

  // --- Number Conversions ---
  const numElev = Number(elev) || 0;
  const numOat = Number(oat) || 0;
  const currentIsaDev = numOat - (15 - 1.98 * (numElev / 1000));

  const numFafAlt = Number(fafAlt) || 0;
  const numDistMapFaf = Number(distMapFaf) || 0;
  const numDistThrMap = Number(distThrMap) || 0;
  const numGs = Number(gs) || 0; 
  
  const numWind = Number(wind) || 0;
  const numCrossWind = Number(crossWind) || 0;
  const numRwyTrk = Number(rwyTrk) || 0;
  const numBankBase = Number(bankBase) || 25;
  const numBankFinal = Number(bankFinal) || 20;

  const numTfpAlt = Number(tfpAlt) || 1500;
  const numTfpPatternWidth = Number(tfpPatternWidth) || 2.5;
  const numTfpGsDw = Number(tfpGsDw) || 170;

  const numMda = Number(mda) || 600;
  const numCirclingPatternWidth = Number(circlingPatternWidth) || 1.5;
  const numCirclingAppSpd = Number(circlingAppSpd) || 145;
  const numCirclingDwTime = 20;

  const getIndicatedAlt = (trueAlt, elev, isaD) => {
    return (trueAlt + 4 * isaD * elev / 1000) / (1 + 4 * isaD / 1000);
  };

  const tasPath = calculateTAS(numGs, numElev, numOat);

  // ----------------------------------------------------
  // --- 1. 3.00° PATH CALCULATION ---
  // ----------------------------------------------------
  const fafTempCorrection = 4 * currentIsaDev * ((numFafAlt - numElev) / 1000);
  const trueFafAlt = numFafAlt + fafTempCorrection;

  const fafDistFromThr = numDistMapFaf + numDistThrMap;
  const true3DegFafAlt = numElev + 50 + fafDistFromThr * Math.tan(3 * Math.PI / 180) * 6076.1154;
  const targetFafIndicated = getIndicatedAlt(true3DegFafAlt, numElev, currentIsaDev);

  const true3DegMapAlt = numElev + 50 + numDistThrMap * Math.tan(3 * Math.PI / 180) * 6076.1154;
  const targetMapIndicated = getIndicatedAlt(true3DegMapAlt, numElev, currentIsaDev);

  const heightDiffMap = trueFafAlt - true3DegMapAlt; 
  const distFtMap = numDistMapFaf * 6076.1154; 
  const angleMap = numDistMapFaf > 0 ? Math.atan(heightDiffMap / distFtMap) * (180 / Math.PI) : 0;
  const vsiMap = tasPath * 101.268 * Math.tan(angleMap * Math.PI / 180);
  const reqDistMap = heightDiffMap > 0 ? (heightDiffMap / Math.tan(3 * Math.PI / 180)) / 6076.1154 : 0;
  const diffDistMap = reqDistMap - numDistMapFaf;

  const tch = 50; 
  const heightDiffRwy = true3DegMapAlt - (numElev + tch);
  const distFtRwy = numDistThrMap * 6076.1154;
  const angleRwy = numDistThrMap > 0 ? Math.atan(heightDiffRwy / distFtRwy) * (180 / Math.PI) : 0;
  const vsiRwy = tasPath * 101.268 * Math.tan(angleRwy * Math.PI / 180);
  const reqDistRwy = heightDiffRwy > 0 ? (heightDiffRwy / Math.tan(3 * Math.PI / 180)) / 6076.1154 : 0;
  const diffDistRwy = reqDistRwy - numDistThrMap;

  const numDistCda = numDistMapFaf + numDistThrMap;
  const heightDiffCda = trueFafAlt - (numElev + tch);
  const distFtCda = numDistCda * 6076.1154;
  const angleCda = numDistCda > 0 ? Math.atan(heightDiffCda / distFtCda) * (180 / Math.PI) : 0;
  const vsiCda = tasPath * 101.268 * Math.tan(angleCda * Math.PI / 180);
  const reqDistCda = heightDiffCda > 0 ? (heightDiffCda / Math.tan(3 * Math.PI / 180)) / 6076.1154 : 0;
  const diffDistCda = reqDistCda - numDistCda;

  const tableGsValues = [110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210];
  const closestTas = Math.round(tasPath / 10) * 10;

  // ----------------------------------------------------
  // --- 2. DESCENT ANGLE (TRAFFIC PATTERN) CALCULATION ---
  // ----------------------------------------------------
  const tfpTempCorrection = 4 * currentIsaDev * ((numTfpAlt - numElev) / 1000);
  const trueTfpAlt = numTfpAlt + tfpTempCorrection;

  const calculateDescentStart = (isLeftTraffic) => {
    if (numTfpGsDw <= 0) return { angle: 0, text: "N/A", reqDist: 0, drawData: null, trueTfpAlt, shortenedSeconds: null, advanceSeconds: null, advanceDist: null, abeamSeconds: -1, tas_dw: 0, tas_final_base: 0 };
    if (numTfpGsDw <= 40) return { angle: 0, text: "SPD LOW", reqDist: 0, drawData: null, trueTfpAlt, shortenedSeconds: null, advanceSeconds: null, advanceDist: null, abeamSeconds: -1, tas_dw: 0, tas_final_base: 0 };

    const heightToLose = trueTfpAlt - (numElev + tch);
    if (heightToLose <= 0) return { angle: 0, text: "TOO LOW", reqDist: 0, drawData: null, trueTfpAlt, shortenedSeconds: null, advanceSeconds: null, advanceDist: null, abeamSeconds: -1, tas_dw: 0, tas_final_base: 0 };

    const reqDistNM = (heightToLose / Math.tan(3 * Math.PI / 180)) / 6076.1154;

    const ias_dw = numTfpGsDw; 
    const ias_final_base = Math.max(120, numTfpGsDw - 20); 

    const tas_final_base = calculateTAS(ias_final_base, numTfpAlt, numOat);
    const tas_dw = calculateTAS(ias_dw, numTfpAlt, numOat);

    const windVx = -numWind; 
    const windVy = isLeftTraffic ? -numCrossWind : numCrossWind; 

    const angleDW = Math.PI; 
    const angleBase = Math.PI * 1.5; 
    const angleFinal = Math.PI * 2; 

    const { headingRad: hdgDW, gs: v_dw } = calculateHeadingAndGS(angleDW, tas_dw, windVx, windVy);
    const { headingRad: hdgBase, gs: v_base_straight } = calculateHeadingAndGS(angleBase, tas_final_base, windVx, windVy);
    const { headingRad: hdgFinal, gs: v_final_straight } = calculateHeadingAndGS(angleFinal, tas_final_base, windVx, windVy);

    const v_turn = tas_final_base;                           

    const r_final_tas = (tas_final_base * tas_final_base * 0.00001458) / Math.tan(numBankFinal * Math.PI / 180);
    const r_base_tas = (tas_final_base * tas_final_base * 0.00001458) / Math.tan(numBankBase * Math.PI / 180);

    const arc_final = r_final_tas * Math.abs(hdgFinal - hdgBase);
    const arc_base = r_base_tas * Math.abs(hdgBase - hdgDW);
    const omega_final = ((tas_final_base / 3600) / r_final_tas) * (180 / Math.PI);
    const omega_base = ((tas_final_base / 3600) / r_base_tas) * (180 / Math.PI);

    let tempFinalTurn = generateTurnPoints(hdgBase, hdgFinal, r_final_tas, tas_final_base, windVx, windVy, 30);
    const finalTurnDX = tempFinalTurn[tempFinalTurn.length - 1].x - tempFinalTurn[0].x;
    const finalTurnDY = tempFinalTurn[tempFinalTurn.length - 1].y - tempFinalTurn[0].y;

    let tempBaseTurn = generateTurnPoints(hdgDW, hdgBase, r_base_tas, tas_final_base, windVx, windVy, 30);
    const baseTurnDX = tempBaseTurn[tempBaseTurn.length - 1].x - tempBaseTurn[0].x;
    const baseTurnDY = tempBaseTurn[tempBaseTurn.length - 1].y - tempBaseTurn[0].y;

    const transTimeBase = numBankBase / 5; 
    const transTimeFinal = numBankFinal / 5;
    
    let distTransDwBaseIn = (v_dw / 3600) * transTimeBase; 
    let distTransBaseOut = (v_base_straight / 3600) * transTimeBase;
    let distTransFinalIn = (v_base_straight / 3600) * transTimeFinal;
    let distTransFinalOut = (v_final_straight / 3600) * transTimeFinal;

    const requiredYForTurns = -(finalTurnDY + baseTurnDY);
    const requiredYForTrans = distTransFinalIn + distTransBaseOut;
    
    let isContinuousTurn = false;
    let continuousType = "none"; 
    let L_b = 0;
    let availTransTime = transTimeBase + transTimeFinal; 
    let overshootNM = 0; 

    if (numTfpPatternWidth >= requiredYForTurns + requiredYForTrans) {
      L_b = numTfpPatternWidth - requiredYForTurns - requiredYForTrans;
    } else if (numTfpPatternWidth >= requiredYForTurns) {
      isContinuousTurn = true;
      continuousType = "margin"; 
      L_b = 0;
      const availableTrans = numTfpPatternWidth - requiredYForTurns;
      const ratio = availableTrans / requiredYForTrans;
      distTransBaseOut *= ratio;
      distTransFinalIn *= ratio;
      availTransTime = (transTimeBase + transTimeFinal) * ratio; 
    } else {
      isContinuousTurn = true;
      continuousType = "tight"; 
      L_b = 0;
      distTransBaseOut = 0;
      distTransFinalIn = 0;
      availTransTime = 0;
      overshootNM = requiredYForTurns - numTfpPatternWidth; 
    }

    const dwTime = Math.max(0, 35 - (numWind / 10) * 4);
    const distDW = (v_dw / 3600) * dwTime; 
    
    const L_f = distDW + distTransDwBaseIn - finalTurnDX - baseTurnDX - distTransFinalOut;
    const actualL_f = L_f > 0 ? L_f : 0;

    const ptFinalStart = { x: -actualL_f, y: 0 };
    const ptFinalTransOutStart = { x: ptFinalStart.x - distTransFinalOut, y: 0 };
    
    const offsetFinalX = ptFinalTransOutStart.x - tempFinalTurn[tempFinalTurn.length - 1].x;
    const offsetFinalY = ptFinalTransOutStart.y - tempFinalTurn[tempFinalTurn.length - 1].y;
    const finalTurnPoints = tempFinalTurn.map(p => ({ x: p.x + offsetFinalX, y: p.y + offsetFinalY }));
    
    const ptFinalTurnStart = finalTurnPoints[0];
    const ptFinalTransInStart = { x: ptFinalTurnStart.x, y: ptFinalTurnStart.y + distTransFinalIn };
    
    const ptBaseEnd = ptFinalTransInStart;
    const ptBaseStart = { x: ptBaseEnd.x, y: ptBaseEnd.y + L_b };
    
    const ptBaseTransOutStart = { x: ptBaseStart.x, y: ptBaseStart.y + distTransBaseOut };

    const offsetBaseX = ptBaseTransOutStart.x - tempBaseTurn[tempBaseTurn.length - 1].x;
    const offsetBaseY = ptBaseTransOutStart.y - tempBaseTurn[tempBaseTurn.length - 1].y;
    const baseTurnPoints = tempBaseTurn.map(p => ({ x: p.x + offsetBaseX, y: p.y + offsetBaseY }));

    const ptBaseTurnStart = baseTurnPoints[0];
    const ptDwTransInStart = { x: ptBaseTurnStart.x + distTransDwBaseIn, y: ptBaseTurnStart.y };
    const ptDwStart = { x: ptDwTransInStart.x + distDW, y: ptDwTransInStart.y };

    const actualPatternWidth = Math.abs(ptDwStart.y);
    const r_final_draw = Math.abs(finalTurnDY);
    const r_base_draw = Math.abs(baseTurnDY);
    const thrToBaseDist = actualL_f + distTransFinalOut + finalTurnDX;

    const T1 = actualL_f; 
    const T2 = T1 + distTransFinalOut;
    const T3 = T2 + arc_final;
    const T4 = T3 + distTransFinalIn;
    const T5 = T4 + L_b;
    const T6 = T5 + distTransBaseOut;
    const T7 = T6 + arc_base;
    const T8 = T7 + distTransDwBaseIn;
    const T9 = T8 + distDW;

    const totalDist = T9;
    const baseSeconds = L_b > 0 ? (L_b / (Math.max(1, v_base_straight) / 3600)) : 0;

    const hdgDegFinal = hdgFinal * (180 / Math.PI);
    const hdgDegBase = hdgBase * (180 / Math.PI);
    const hdgDegDW = hdgDW * (180 / Math.PI);

    let baseAngle = 0;
    let currentOmega = 0;
    let phaseText = "";
    let v_action = v_final_straight;
    let d_rem = reqDistNM;

    if (d_rem <= T1) {
      baseAngle = 360 - hdgDegFinal; currentOmega = 0; phaseText = "Final Straight"; v_action = v_final_straight;
    } else if (d_rem <= T2) {
      baseAngle = 360 - hdgDegFinal; currentOmega = 0; phaseText = "Final Trans"; v_action = v_final_straight;
    } else if (d_rem <= T3) {
      const d = d_rem - T2;
      baseAngle = 360 - (hdgDegFinal - (d / arc_final) * (hdgDegFinal - hdgDegBase)); 
      currentOmega = omega_final; phaseText = "Final Turn"; v_action = v_turn;
    } else if (d_rem <= T4) {
      baseAngle = 360 - hdgDegBase; currentOmega = 0; phaseText = "Base Trans"; v_action = v_base_straight;
    } else if (d_rem <= T5) {
      baseAngle = 360 - hdgDegBase; currentOmega = 0; phaseText = "Base Straight"; v_action = v_base_straight;
    } else if (d_rem <= T6) {
      baseAngle = 360 - hdgDegBase; currentOmega = 0; phaseText = "Base Trans"; v_action = v_base_straight;
    } else if (d_rem <= T7) {
      const d = d_rem - T6;
      baseAngle = 360 - (hdgDegBase - (d / arc_base) * (hdgDegBase - hdgDegDW)); 
      currentOmega = omega_base; phaseText = "Base Turn"; v_action = v_turn;
    } else if (d_rem <= T8) {
      baseAngle = 360 - hdgDegDW; currentOmega = 0; phaseText = "DW Trans"; v_action = v_dw;
    } else {
      baseAngle = 360 - hdgDegDW; currentOmega = 0; phaseText = "Downwind"; v_action = v_dw;
    }

    const leadTime = 3.4;
    const leadAngle = currentOmega * leadTime;
    let finalAngle = baseAngle + leadAngle;
    if (finalAngle > 180) finalAngle = 180;

    let actionDistNM = reqDistNM + (v_action / 3600) * leadTime;
    let ptDesc = { x: 0, y: 0 };
    let d_act = actionDistNM;
    
    if (d_act <= T1) {
      ptDesc = { x: -d_act, y: 0 };
    } else if (d_act <= T2) {
      ptDesc = { x: -d_act, y: 0 };
    } else if (d_act <= T3) {
      const d = d_act - T2;
      const ratio = 1 - (d / arc_final); 
      const exactIndex = ratio * (finalTurnPoints.length - 1);
      const idx1 = Math.floor(exactIndex);
      const idx2 = Math.ceil(exactIndex);
      if (idx1 === idx2) {
        ptDesc = { x: finalTurnPoints[idx1].x, y: finalTurnPoints[idx1].y };
      } else {
        const frac = exactIndex - idx1;
        ptDesc = {
          x: finalTurnPoints[idx1].x + frac * (finalTurnPoints[idx2].x - finalTurnPoints[idx1].x),
          y: finalTurnPoints[idx1].y + frac * (finalTurnPoints[idx2].y - finalTurnPoints[idx1].y)
        };
      }
    } else if (d_act <= T4) {
      const d = d_act - T3;
      ptDesc = { x: ptFinalTurnStart.x, y: ptFinalTurnStart.y + d };
    } else if (d_act <= T5) {
      const d = d_act - T4;
      ptDesc = { x: ptBaseEnd.x, y: ptBaseEnd.y + d };
    } else if (d_act <= T6) {
      const d = d_act - T5;
      ptDesc = { x: ptBaseStart.x, y: ptBaseStart.y + d };
    } else if (d_act <= T7) {
      const d = d_act - T6;
      const ratio = 1 - (d / arc_base); 
      const exactIndex = ratio * (baseTurnPoints.length - 1);
      const idx1 = Math.floor(exactIndex);
      const idx2 = Math.ceil(exactIndex);
      if (idx1 === idx2) {
        ptDesc = { x: baseTurnPoints[idx1].x, y: baseTurnPoints[idx1].y };
      } else {
        const frac = exactIndex - idx1;
        ptDesc = {
          x: baseTurnPoints[idx1].x + frac * (baseTurnPoints[idx2].x - baseTurnPoints[idx1].x),
          y: baseTurnPoints[idx1].y + frac * (baseTurnPoints[idx2].y - baseTurnPoints[idx1].y)
        };
      }
    } else if (d_act <= T8) {
      const d = d_act - T7;
      ptDesc = { x: ptBaseTurnStart.x + d, y: ptBaseTurnStart.y };
    } else {
      const d = d_act - T8;
      ptDesc = { x: ptDwTransInStart.x + d, y: ptDwTransInStart.y };
    }

    const segments = [
      { dist: distDW, gs: v_dw },
      { dist: distTransDwBaseIn, gs: v_dw },
      { dist: arc_base, gs: v_turn },
      { dist: distTransBaseOut, gs: v_base_straight },
      { dist: L_b, gs: v_base_straight },
      { dist: distTransFinalIn, gs: v_base_straight },
      { dist: arc_final, gs: v_turn },
      { dist: distTransFinalOut, gs: v_final_straight },
      { dist: actualL_f, gs: v_final_straight }
    ];

    let d_from_abeam = totalDist - actionDistNM; 
    let abeamSeconds = -1;
    let isEarly = false;
    
    if (d_from_abeam < 0) {
      abeamSeconds = Math.abs(d_from_abeam) / (v_dw / 3600);
      isEarly = true;
    } else {
      let rem = d_from_abeam;
      let timeAccum = 0;
      for (const seg of segments) {
        if (rem <= seg.dist) {
          timeAccum += rem / (Math.max(1, seg.gs) / 3600);
          break;
        } else {
          timeAccum += seg.dist / (Math.max(1, seg.gs) / 3600);
          rem -= seg.dist;
        }
      }
      abeamSeconds = timeAccum;
    }

    let shortenedSeconds = null;
    let advanceSeconds = null;
    let advanceDist = null;
    
    if (thrToBaseDist > 2.5) {
      const targetDistDW = 2.5 - distTransDwBaseIn - Math.abs(baseTurnDX);
      if (targetDistDW > 0) {
        shortenedSeconds = targetDistDW / (v_dw / 3600);
        advanceDist = distDW - targetDistDW;
        advanceSeconds = advanceDist / (v_dw / 3600);
      }
    }

    const altBaseTurnStart = getIndicatedAlt(numElev + 50 + T7 * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);
    const altBaseTurnEnd = getIndicatedAlt(numElev + 50 + T6 * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);
    const altFinalTurnStart = getIndicatedAlt(numElev + 50 + T3 * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);
    const altFinalTurnEnd = getIndicatedAlt(numElev + 50 + T2 * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);
    const altAbeam = getIndicatedAlt(numElev + 50 + totalDist * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);

    const drawData = {
      L_f: actualL_f, L_b, r_final: r_final_draw, r_base: r_base_draw, 
      finalTurnDX: Math.abs(finalTurnDX), baseTurnDX: Math.abs(baseTurnDX), ptDesc,
      ptThr: { x: 0, y: 0 },
      ptFinalStart, ptFinalTransOutStart, ptFinalTurnStart, ptFinalTransInStart,
      ptBaseEnd, ptBaseStart, ptBaseTransOutStart, ptBaseTurnStart,
      ptDwTransInStart, ptDwStart, 
      ptAbeam: { x: 0, y: actualPatternWidth }, 
      baseTurnPoints, finalTurnPoints,
      distDW, distTransDwBaseIn, thrToBaseDist,
      totalDist, 
      patternWidth: actualPatternWidth, targetWidth: numTfpPatternWidth, 
      isContinuousTurn, continuousType, availTransTime, overshootNM, dwTime,
      altBaseTurnStart: Math.round(altBaseTurnStart), altBaseTurnEnd: Math.round(altBaseTurnEnd),
      altFinalTurnStart: Math.round(altFinalTurnStart), altFinalTurnEnd: Math.round(altFinalTurnEnd),
      altAbeam: Math.round(altAbeam)
    };

    return {
      angle: finalAngle, text: phaseText, reqDist: reqDistNM, abeamSeconds, baseSeconds, isEarly,
      isContinuousTurn, continuousType, drawData, totalDist, trueTfpAlt,
      shortenedSeconds, advanceSeconds, advanceDist, tas_dw, tas_final_base
    };
  };

  const calculateDirectBase = () => {
    const ias = Math.max(120, numTfpGsDw - 20); 
    const tas = calculateTAS(ias, numTfpAlt, numOat);
    
    const windVx = -numWind; 
    const windVy = numCrossWind; 

    const startAngle = Math.PI / 2; 
    const endAngle = 0; 
    
    const { headingRad: hdgBase, gs: v_base } = calculateHeadingAndGS(startAngle, tas, windVx, windVy);
    const { headingRad: hdgFinal, gs: v_final } = calculateHeadingAndGS(endAngle, tas, windVx, windVy);
    
    const r_tas = (tas * tas * 0.00001458) / Math.tan(numBankFinal * Math.PI / 180);
    
    let turnPoints = generateTurnPoints(hdgBase, hdgFinal, r_tas, tas, windVx, windVy, 30);
    
    const turnDX = turnPoints[turnPoints.length - 1].x - turnPoints[0].x;
    const turnDY = turnPoints[turnPoints.length - 1].y - turnPoints[0].y;
    
    const ptFinalTurnEnd = { x: -2.5 + Math.abs(turnDX), y: 0 };
    const offsetX = ptFinalTurnEnd.x - turnPoints[turnPoints.length - 1].x;
    const offsetY = ptFinalTurnEnd.y - turnPoints[turnPoints.length - 1].y;
    
    turnPoints = turnPoints.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
    const ptFinalTurnStart = turnPoints[0];
    
    const distFinalStraight = Math.abs(ptFinalTurnEnd.x); 
    const arcTurn = r_tas * Math.abs(hdgFinal - hdgBase);
    const transTime = numBankFinal / 5;
    const distTrans = (v_base / 3600) * transTime;
    
    const ptTransStart = { x: ptFinalTurnStart.x, y: ptFinalTurnStart.y - distTrans }; 
    
    const targetTotalDist = 5.0; // Approximation based on standard RT pattern
    const distToTransStart = distFinalStraight + arcTurn + distTrans;
    const distBaseStart = Math.max(0, targetTotalDist - distToTransStart);
    const ptAbeamDB = { x: ptTransStart.x, y: ptTransStart.y - distBaseStart };
    
    const heightToLose = trueTfpAlt - (numElev + 50);
    const reqDistNM = heightToLose > 0 ? (heightToLose / Math.tan(3 * Math.PI / 180)) / 6076.1154 : 0;
    
    let d_rem = reqDistNM;
    let v_action = v_final;
    
    if (d_rem <= distFinalStraight) {
        v_action = v_final;
    } else if (d_rem <= distFinalStraight + arcTurn) {
        v_action = tas;
    } else {
        v_action = v_base;
    }
    
    const leadTime = 3.4;
    let actionDistNM = reqDistNM + (v_action / 3600) * leadTime;
    let ptDescDB = { x: 0, y: 0 };
    
    if (actionDistNM <= distFinalStraight) {
        ptDescDB = { x: -actionDistNM, y: 0 };
    } else if (actionDistNM <= distFinalStraight + arcTurn) {
        const d = actionDistNM - distFinalStraight;
        const ratio = 1 - (d / arcTurn); 
        const exactIndex = ratio * (turnPoints.length - 1);
        const idx1 = Math.floor(exactIndex);
        const idx2 = Math.ceil(exactIndex);
        if (idx1 === idx2) {
            ptDescDB = { x: turnPoints[idx1].x, y: turnPoints[idx1].y };
        } else {
            const frac = exactIndex - idx1;
            ptDescDB = {
                x: turnPoints[idx1].x + frac * (turnPoints[idx2].x - turnPoints[idx1].x),
                y: turnPoints[idx1].y + frac * (turnPoints[idx2].y - turnPoints[idx1].y)
            };
        }
    } else if (actionDistNM <= distFinalStraight + arcTurn + distTrans) {
        const d = actionDistNM - (distFinalStraight + arcTurn);
        ptDescDB = { x: ptFinalTurnStart.x, y: ptFinalTurnStart.y - d };
    } else {
        const d = actionDistNM - (distFinalStraight + arcTurn + distTrans);
        ptDescDB = { x: ptTransStart.x, y: ptTransStart.y - d };
    }
    
    const calcAlt = (dist) => getIndicatedAlt(numElev + 50 + dist * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);
    const altAbeam = Math.round(calcAlt(targetTotalDist));
    const altDesc = Math.round(numTfpAlt); 
    const altFinalTurnStart = Math.round(calcAlt(distFinalStraight + arcTurn));
    const altFinalTurnEnd = Math.round(calcAlt(distFinalStraight));

    const turnLeadDist = Math.abs(ptTransStart.y);

    return {
        reqDistNM, actionDistNM, turnLeadDist,
        drawData: {
            ptAbeamDB, ptTransStart, ptFinalTurnStart, ptFinalTurnEnd, ptDescDB, turnPoints,
            intersection: { x: -2.5, y: 0 }, turnLeadDist, altAbeam, altDesc, altFinalTurnStart, altFinalTurnEnd
        }
    };
  };

  // ----------------------------------------------------
  // --- 3. MIN CIRCLING CALCULATION ---
  // ----------------------------------------------------
  const calculateCirclingStart = (isLeftTraffic) => {
    if (numCirclingAppSpd <= 0) return { angle: 0, text: "N/A", reqDist: 0, drawData: null, trueMda: 0, reqBankDeg: 0, abeamSeconds: -1, tas_app: 0 };
    if (numCirclingAppSpd <= 40) return { angle: 0, text: "SPD LOW", reqDist: 0, drawData: null, trueMda: 0, reqBankDeg: 0, abeamSeconds: -1, tas_app: 0 };

    const tfpTempCorrection = 4 * currentIsaDev * ((numMda - numElev) / 1000);
    const trueMda = numMda + tfpTempCorrection;
    const heightToLose = trueMda - (numElev + tch);
    
    if (heightToLose <= 0) return { angle: 0, text: "TOO LOW", reqDist: 0, drawData: null, trueMda: 0, reqBankDeg: 0, abeamSeconds: -1, tas_app: 0 };

    const reqDistNM = (heightToLose / Math.tan(3 * Math.PI / 180)) / 6076.1154;

    const tas_app = calculateTAS(numCirclingAppSpd, numMda, numOat);

    const windVx = -numWind; 
    const windVy = isLeftTraffic ? -numCrossWind : numCrossWind; 

    const { headingRad: hdgDW, gs: v_dw } = calculateHeadingAndGS(Math.PI, tas_app, windVx, windVy);
    const { headingRad: hdgFinal, gs: v_final_straight } = calculateHeadingAndGS(Math.PI * 2, tas_app, windVx, windVy);
    const v_turn = tas_app; 

    const driftFactor = 2 - (windVy * Math.PI) / tas_app;
    if (driftFactor <= 0) return { angle: 0, text: "WIND LIMIT", reqDist: 0, drawData: null, trueMda: 0, reqBankDeg: 0, abeamSeconds: -1, tas_app: 0 };

    const maxBankDeg = 30; 
    const r_turn_tas_at_max_bank = (tas_app * tas_app * 0.00001458) / Math.tan(maxBankDeg * Math.PI / 180);
    const minPatternWidth = r_turn_tas_at_max_bank * driftFactor;

    let r_turn_tas;
    let reqBankDeg;
    let isOvershoot = false;

    if (minPatternWidth > numCirclingPatternWidth) {
      r_turn_tas = r_turn_tas_at_max_bank;
      reqBankDeg = maxBankDeg;
      isOvershoot = true;
    } else {
      r_turn_tas = numCirclingPatternWidth / driftFactor;
      const reqBankRad = Math.atan((tas_app * tas_app * 0.00001458) / r_turn_tas);
      reqBankDeg = reqBankRad * (180 / Math.PI);
    }

    let tempTurn = generateTurnPoints(hdgDW, hdgFinal, r_turn_tas, tas_app, windVx, windVy, 45);
    const actualTurnDX = tempTurn[tempTurn.length - 1].x - tempTurn[0].x;
    const turnDY = tempTurn[tempTurn.length - 1].y - tempTurn[0].y;
    
    let minX = 0;
    tempTurn.forEach(p => { if (p.x < minX) minX = p.x; });
    const maxTurnDepthX = Math.abs(minX);
    
    const actualPatternWidth = Math.abs(turnDY);
    const r_turn_draw = actualPatternWidth / 2;

    const transTime = reqBankDeg / 5; 
    const distTransIn = (v_dw / 3600) * transTime;
    const distTransOut = (v_final_straight / 3600) * transTime;

    const dwTime = Math.max(0, numCirclingDwTime - (numWind / 10) * 4);
    const distDW = (v_dw / 3600) * dwTime;

    const L_f = distDW + distTransIn - actualTurnDX - distTransOut; 
    const actualL_f = L_f > 0 ? L_f : 0;

    const ptFinalStart = { x: -actualL_f, y: 0 };
    const ptTransOutStart = { x: ptFinalStart.x - distTransOut, y: 0 };
    
    const offsetTurnX = ptTransOutStart.x - tempTurn[tempTurn.length - 1].x;
    const offsetTurnY = ptTransOutStart.y - tempTurn[tempTurn.length - 1].y;
    const turnPoints = tempTurn.map(p => ({ x: p.x + offsetTurnX, y: p.y + offsetTurnY }));
    
    const ptTurnStart = turnPoints[0];
    const ptTransInStart = { x: ptTurnStart.x + distTransIn, y: ptTurnStart.y };
    const ptDwStart = { x: ptTransInStart.x + distDW, y: ptTransInStart.y };

    const arc_turn = r_turn_tas * Math.abs(hdgFinal - hdgDW); 
    const omega_turn = ((tas_app / 3600) / r_turn_tas) * (180 / Math.PI);

    const T1 = actualL_f;
    const T2 = T1 + distTransOut;
    const T3 = T2 + arc_turn;
    const T4 = T3 + distTransIn;
    const T5 = T4 + distDW;
    const totalDist = T5;

    const ptTurnMid = turnPoints[Math.floor(turnPoints.length / 2)];
    const altTurnStart = getIndicatedAlt(numElev + 50 + T3 * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);
    const altTurnMid = getIndicatedAlt(numElev + 50 + (T2 + arc_turn / 2) * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);
    const altTurnEnd = getIndicatedAlt(numElev + 50 + T2 * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);

    const hdgDegFinal = hdgFinal * (180 / Math.PI);
    const hdgDegDW = hdgDW * (180 / Math.PI);

    let baseAngle = 0;
    let currentOmega = 0;
    let phaseText = "";
    let v_action = v_final_straight;

    let d_rem = reqDistNM;

    if (d_rem <= T1) {
      baseAngle = 360 - hdgDegFinal; currentOmega = 0; phaseText = "Final Straight"; v_action = v_final_straight;
    } else if (d_rem <= T2) {
      baseAngle = 360 - hdgDegFinal; currentOmega = 0; phaseText = "Trans Out"; v_action = v_final_straight;
    } else if (d_rem <= T3) {
      const d = d_rem - T2;
      baseAngle = 360 - (hdgDegFinal - (d / arc_turn) * (hdgDegFinal - hdgDegDW)); 
      currentOmega = omega_turn; phaseText = "180° Turn"; v_action = v_turn;
    } else if (d_rem <= T4) {
      baseAngle = 360 - hdgDegDW; currentOmega = 0; phaseText = "Trans In"; v_action = v_dw;
    } else {
      baseAngle = 360 - hdgDegDW; currentOmega = 0; phaseText = "Downwind"; v_action = v_dw;
    }

    const leadTime = 3.4;
    const leadAngle = currentOmega * leadTime;
    let finalAngle = baseAngle + leadAngle;

    let actionDistNM = reqDistNM + (v_action / 3600) * leadTime;
    let ptDesc = { x: 0, y: 0 };
    let d_act = actionDistNM;
    
    if (d_act <= T1) {
      ptDesc = { x: -d_act, y: 0 };
    } else if (d_act <= T2) {
      ptDesc = { x: -d_act, y: 0 };
    } else if (d_act <= T3) {
      const d = d_act - T2;
      const ratio = 1 - (d / arc_turn); 
      const exactIndex = ratio * (turnPoints.length - 1);
      const idx1 = Math.floor(exactIndex);
      const idx2 = Math.ceil(exactIndex);
      if (idx1 === idx2) {
        ptDesc = { x: turnPoints[idx1].x, y: turnPoints[idx1].y };
      } else {
        const frac = exactIndex - idx1;
        ptDesc = {
          x: turnPoints[idx1].x + frac * (turnPoints[idx2].x - turnPoints[idx1].x),
          y: turnPoints[idx1].y + frac * (turnPoints[idx2].y - turnPoints[idx1].y)
        };
      }
    } else if (d_act <= T4) {
      const d = d_act - T3;
      ptDesc = { x: ptTurnStart.x + d, y: ptTurnStart.y };
    } else {
      const d = d_act - T4;
      ptDesc = { x: ptTransInStart.x + d, y: ptTransInStart.y };
    }

    const segments = [
      { dist: distDW, gs: v_dw },
      { dist: distTransIn, gs: v_dw },
      { dist: arc_turn, gs: v_turn },
      { dist: distTransOut, gs: v_final_straight },
      { dist: actualL_f, gs: v_final_straight }
    ];

    let d_from_abeam = totalDist - actionDistNM; 
    let abeamSeconds = -1;
    let isEarly = false;
    
    if (d_from_abeam < 0) {
      abeamSeconds = Math.abs(d_from_abeam) / (v_dw / 3600);
      isEarly = true;
    } else {
      let rem = d_from_abeam;
      let timeAccum = 0;
      for (const seg of segments) {
        if (rem <= seg.dist) {
          timeAccum += rem / (Math.max(1, seg.gs) / 3600);
          break;
        } else {
          timeAccum += seg.dist / (Math.max(1, seg.gs) / 3600);
          rem -= seg.dist;
        }
      }
      abeamSeconds = timeAccum;
    }

    const altAbeam = getIndicatedAlt(numElev + 50 + totalDist * 6076.1154 * Math.tan(3 * Math.PI / 180), numElev, currentIsaDev);

    const drawData = {
      L_f: actualL_f, r_turn: r_turn_draw, turnDX: maxTurnDepthX, ptDesc, 
      patternWidth: actualPatternWidth, targetWidth: numCirclingPatternWidth, 
      isOvershoot, ptThr: { x: 0, y: 0 }, ptFinalStart, ptTransOutStart, ptTurnStart,
      ptTransInStart, ptDwStart, turnPoints, distDW, distTransIn, totalDist, dwTime,
      ptTurnMid, altTurnStart: Math.round(altTurnStart), altTurnMid: Math.round(altTurnMid),
      altTurnEnd: Math.round(altTurnEnd), altAbeam: Math.round(altAbeam) 
    };

    return {
      angle: finalAngle, text: phaseText, reqDist: reqDistNM, abeamSeconds, isEarly,
      isOvershoot, drawData, totalDist, trueMda, reqBankDeg, tas_app
    };
  };

  const tfpDataLT = calculateDescentStart(true);
  const tfpDataRT = calculateDescentStart(false);
  const directBaseData = calculateDirectBase(); 
  
  const circlingDataLT = calculateCirclingStart(true);
  const circlingDataRT = calculateCirclingStart(false);
  
  const formatHdg = (hdg) => Math.round((hdg + 360) % 360).toString().padStart(3, '0');

  // ==========================================
  // DYNAMIC CARDS CALCULATION
  // ==========================================
  const calcR22MapAlt = (gs, bank, isaD, elev) => {
    if (gs <= 0) return { alt: 0, turnIkl: 0, trackDist: 0 };
    const R = (gs * gs * 0.00001458) / Math.tan(bank * Math.PI / 180);
    const hdgChangeRad = 55 * Math.PI / 180;
    const arcNM = R * hdgChangeRad;
    const leadNM = R * Math.tan(hdgChangeRad / 2) + (gs / 3600 * (bank / 5));
    const distThrToAlign = 2.685 - leadNM;
    const distTurnStartToMap = (0.495 + 1.10) - leadNM;
    const trackDist = distThrToAlign + arcNM + distTurnStartToMap;
    const trueMapAlt = elev + 50 + trackDist * Math.tan(3 * Math.PI / 180) * 6076.1154;
    const turnIkl = leadNM - 0.495;
    const alt = getIndicatedAlt(trueMapAlt, elev, isaD);
    return { alt, turnIkl, trackDist };
  };

  const calcR23MapAlt = (gs, bank, isaD, elev) => {
    if (gs <= 0) return { alt: 0, turnItl: 0, trackDist: 0 };
    const R = (gs * gs * 0.00001458) / Math.tan(bank * Math.PI / 180);
    const hdgChangeRad = 47 * Math.PI / 180;
    const arcNM = R * hdgChangeRad;
    const leadNM = R * Math.tan(hdgChangeRad / 2) + (gs / 3600 * (bank / 5));
    const distThrToAlign = 2.377 - leadNM;
    const distTurnStartToMap = (4.90 - 3.563) - leadNM;
    const trackDist = distThrToAlign + arcNM + distTurnStartToMap;
    const trueMapAlt = elev + 50 + trackDist * Math.tan(3 * Math.PI / 180) * 6076.1154;
    const turnItl = 3.563 + leadNM;
    const alt = getIndicatedAlt(trueMapAlt, elev, isaD);
    return { alt, turnItl, trackDist };
  };

  const calcRoahRnp18RAngle = (oat) => {
    const fafAltInd = 1200, distNM = 3.6, elev = 16, tch = 50;
    const roahIsaTempAtElev = 15 - 1.98 * (elev / 1000);
    const roahIsaD = oat - roahIsaTempAtElev;
    const fafTempCorrection = 4 * roahIsaD * ((fafAltInd - elev) / 1000);
    const trueFafAlt = fafAltInd + fafTempCorrection;
    const heightDiff = trueFafAlt - (elev + tch);
    const distFt = distNM * 6076.1154;
    return Math.atan(heightDiff / distFt) * (180 / Math.PI);
  };

  const calcMmmxAngle = (oat) => {
    const fafAltInd = 8900, distNM = 4.7, elev = 7287, tch = 50;
    const mmmxIsaTempAtElev = 15 - 1.98 * (elev / 1000);
    const mmmxIsaD = oat - mmmxIsaTempAtElev;
    const fafTempCorrection = 4 * mmmxIsaD * ((fafAltInd - elev) / 1000);
    const trueFafAlt = fafAltInd + fafTempCorrection;
    const heightDiff = trueFafAlt - (elev + tch);
    const distFt = distNM * 6076.1154;
    return Math.atan(heightDiff / distFt) * (180 / Math.PI);
  };

  const calcR22FafAngle = (mapAltInd, oat) => {
    if (!mapAltInd) return 0;
    const fafAltInd = 5000, distNM = 11.6, elev = 35;
    const rjttIsaTempAtElev = 15 - 1.98 * (elev / 1000);
    const rjttIsaD = oat - rjttIsaTempAtElev;
    const fafTempCorrection = 4 * rjttIsaD * ((fafAltInd - elev) / 1000);
    const trueFafAlt = fafAltInd + fafTempCorrection;
    const mapTempCorrection = 4 * rjttIsaD * ((mapAltInd - elev) / 1000);
    const trueMapAlt = mapAltInd + mapTempCorrection;
    const heightDiff = trueFafAlt - trueMapAlt;
    const distFt = distNM * 6076.1154;
    return Math.atan(heightDiff / distFt) * (180 / Math.PI);
  };

  const calcR23FafAngle = (mapAltInd, oat) => {
    if (!mapAltInd) return 0;
    const fafAltInd = 4000, distNM = 9.6, elev = 55;
    const rjttIsaTempAtElev = 15 - 1.98 * (elev / 1000);
    const rjttIsaD = oat - rjttIsaTempAtElev;
    const fafTempCorrection = 4 * rjttIsaD * ((fafAltInd - elev) / 1000);
    const trueFafAlt = fafAltInd + fafTempCorrection;
    const mapTempCorrection = 4 * rjttIsaD * ((mapAltInd - elev) / 1000);
    const trueMapAlt = mapAltInd + mapTempCorrection;
    const heightDiff = trueFafAlt - trueMapAlt;
    const distFt = distNM * 6076.1154;
    return Math.atan(heightDiff / distFt) * (180 / Math.PI);
  };

  const r22Data15 = calcR22MapAlt(tasPath, 15, currentIsaDev, 35);
  const r22Data5 = calcR22MapAlt(tasPath, 5, currentIsaDev, 35);
  const r22Angle15 = calcR22FafAngle(r22Data15.alt, numOat);
  const r22Angle5 = calcR22FafAngle(r22Data5.alt, numOat);
  const r23Data15 = calcR23MapAlt(tasPath, 15, currentIsaDev, 55);
  const r23Data5 = calcR23MapAlt(tasPath, 5, currentIsaDev, 55);
  const r23Angle15 = calcR23FafAngle(r23Data15.alt, numOat);
  const r23Angle5 = calcR23FafAngle(r23Data5.alt, numOat);
  const roahAngle = calcRoahRnp18RAngle(numOat);
  const mmmxAngle = calcMmmxAngle(numOat);

  const renderPathAdjustment = (diff) => {
    if (Math.abs(diff) < 0.05) {
      return <span className="text-[11px] lg:text-xs font-mono font-black text-emerald-400 leading-none">ON 3.00° PATH</span>;
    }
    const isEarlier = diff > 0;
    const color = isEarlier ? 'text-rose-400' : 'text-sky-400';
    return (
      <div className="flex items-baseline gap-1">
        <span className={`text-[9.5px] lg:text-[10.5px] font-black ${color} leading-none`}>START</span>
        <span className={`text-[13px] lg:text-[15px] font-mono font-black ${color} leading-none`}>{Math.abs(diff).toFixed(2)}</span>
        <span className={`text-[9.5px] lg:text-[10.5px] font-black ${color} leading-none`}>NM {isEarlier ? 'EARLIER' : 'LATER'}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1 w-full flex-1 animate-in fade-in duration-300 min-h-screen bg-slate-950 p-2 sm:p-4 text-slate-100 font-sans antialiased">
      <div className="bg-slate-800/80 backdrop-blur-md p-1.5 lg:p-2 rounded-3xl border border-slate-700 shadow-xl w-full mx-auto flex flex-col gap-1 lg:gap-1.5 max-w-7xl">
        
        {/* --- ヘッダー ＆ タブ切り替え --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-0.5 border-b border-slate-600 pb-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600 rounded text-xs font-bold tracking-wider text-white">MANUAL CALC</span>
            <span className="text-base lg:text-lg font-black tracking-widest text-slate-200 leading-none">APPROACH & PATTERN CALCULATOR</span>
          </div>
          <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-700 shadow-inner items-center shrink-0 overflow-x-auto max-w-full">
            <button 
              onClick={() => setActiveTab('path')}
              className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === 'path' ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-slate-400 border border-transparent hover:bg-slate-700'
              }`}
            >
              <SafeIcon name="TrendingDown" className="w-3 h-3 shrink-0" />
              <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">3.00° PATH</span>
            </button>
            <button 
              onClick={() => setActiveTab('pattern')}
              className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ml-1 shrink-0 ${
                  activeTab === 'pattern' ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-slate-400 border border-transparent hover:bg-slate-700'
              }`}
            >
              <SafeIcon name="Navigation" className="w-3 h-3 shrink-0" />
              <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">TRAFFIC PATTERN</span>
            </button>
            <button 
              onClick={() => setActiveTab('circling')}
              className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ml-1 shrink-0 ${
                  activeTab === 'circling' ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-slate-400 border border-transparent hover:bg-slate-700'
              }`}
            >
              <SafeIcon name="RotateCcw" className="w-3 h-3 shrink-0" />
              <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">MIN CIRCLING</span>
            </button>
          </div>
        </div>

        {/* ================================== */}
        {/* --- TAB 1: 3.00° PATH CALC --- */}
        {/* ================================== */}
        {activeTab === 'path' && (
          <div className="flex flex-col w-full gap-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3 animate-in fade-in">
              {/* INPUTS */}
              <div className="flex flex-col gap-0.5 lg:gap-1 h-full">
                 <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Inputs (Manual)</h3>
                 
                 <div className="flex flex-col gap-0.5 lg:gap-1 flex-1 justify-between">
                   <SliderInput label="FAF ALT (FT)" value={fafAlt} setter={setFafAlt} min={1000} max={10000} step={100} colorClass="text-sky-400" accentClass="accent-sky-400" />
                   <SliderInput label="DIST (NM)" subLabel="FAF ➔ VDP (MAP)" value={distMapFaf} setter={setDistMapFaf} min={0} max={20} step={0.1} colorClass="text-emerald-400" accentClass="accent-emerald-400" />
                   <SliderInput 
                     label="DIST (NM)" subLabel={<span className="flex items-center gap-0.5">VDP <span className="bg-emerald-500/20 text-emerald-300 px-0.5 py-0.5 rounded border border-emerald-500/30 text-[7px] leading-none">優先</span> ➔ THR</span>} 
                     value={distThrMap} setter={setDistThrMap} min={0} max={20} step={0.1} colorClass="text-emerald-400" accentClass="accent-emerald-400" 
                   />
                   <SliderInput 
                     label="AIRPORT OAT (°C)" value={oat} setter={setOat} min={-40} max={54} step={1} colorClass="text-orange-400" accentClass="accent-orange-400" 
                   />
                   <SliderInput label="ELEVATION (FT)" value={elev} setter={setElev} min={0} max={8000} step={1} colorClass="text-slate-400" accentClass="accent-slate-400" />
                   <SliderInput 
                     label="TARGET APP SPD (IAS) (KT)" value={gs} setter={setGs} min={110} max={210} step={1} colorClass="text-slate-400" accentClass="accent-slate-400"
                     rightAddon={
                       <div className="flex items-center gap-1 ml-0.5 border-l border-slate-700 pl-1.5 lg:pl-2">
                         <span className="text-[8px] lg:text-[10px] font-black text-slate-400">TAS</span>
                         <div className="bg-slate-900/80 border border-slate-700/50 rounded px-1.5 py-0.5 shadow-inner text-right min-w-[2.5rem]">
                           <span className="text-sm lg:text-base font-mono font-black text-sky-300 leading-none">{tasPath}</span>
                         </div>
                       </div>
                     }
                   />
                 </div>
              </div>

              {/* OUTPUTS */}
              <div className="flex flex-col gap-0.5 lg:gap-1 h-full">
                 <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Results</h3>
                 
                 {/* Row 1: FAF 区間 */}
                 <div className="grid grid-cols-2 gap-1 flex-1">
                    <div className="bg-indigo-900/30 p-1.5 lg:p-2 rounded-2xl border border-indigo-500/30 flex flex-col justify-between shadow-inner relative overflow-hidden h-full">
                      <div className="flex flex-col items-center justify-center flex-1">
                        <span className="text-[9px] lg:text-[10px] text-indigo-300 font-black tracking-widest uppercase mb-1 text-center leading-tight">3.00° Path Target</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl lg:text-3xl font-mono font-black text-white leading-none">{Math.round(targetFafIndicated).toLocaleString()}</span>
                          <span className="text-xs lg:text-sm text-indigo-400 font-bold leading-none">FT</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-indigo-500/30">
                        <div className="flex justify-between items-center text-[9.5px] lg:text-[10.5px] font-mono">
                          <span className="text-slate-400">計器高度:</span>
                          <span className="text-slate-200 font-bold">{numFafAlt} FT</span>
                        </div>
                        <div className="flex justify-between items-center text-[9.5px] lg:text-[10.5px] font-mono">
                          <span className="text-indigo-300/80">真高度:</span>
                          <span className="text-indigo-300 font-bold">{Math.round(trueFafAlt)} FT</span>
                        </div>
                      </div>
                    </div>

                   <div className="bg-slate-800 p-1 lg:p-1.5 rounded-2xl border border-slate-600 flex flex-col items-center justify-center shadow-inner relative overflow-hidden h-full">
                      <span className="text-[9.5px] lg:text-[10.5px] text-slate-300 font-black tracking-widest text-center z-10 mb-0.5 leading-none flex items-center justify-center gap-1 whitespace-nowrap">
                        FAF {Math.round(trueFafAlt)} FT ➔ VDP {Math.round(true3DegMapAlt)} FT <span className="bg-slate-700 text-slate-300 px-1 py-0.5 rounded text-[7px] lg:text-[8px]">TRUE</span>
                      </span>
                      <div className="flex flex-col items-center gap-0.5 z-10 w-full mt-0.5">
                         <div className="flex w-full gap-1">
                           <div className="flex flex-col items-center bg-slate-900/50 w-full py-0.5 rounded-lg border border-slate-700/50 flex-1">
                             <span className="text-[9px] lg:text-[10px] text-slate-500 font-bold leading-none mb-0.5">ANGLE</span>
                             <span className="text-lg lg:text-xl font-mono font-black text-white leading-none mt-0.5">{angleMap.toFixed(2)}°</span>
                           </div>
                           <div className="flex flex-col items-center bg-slate-900/50 w-full py-0.5 rounded-lg border border-slate-700/50 flex-1">
                             <span className="text-[9px] lg:text-[10px] text-slate-500 font-bold leading-none mb-0.5">VSI @ TAS {tasPath}</span>
                             <span className="text-lg lg:text-xl font-mono font-black text-white leading-none mt-0.5">{Math.round(vsiMap)}</span>
                           </div>
                         </div>
                         <div className="flex flex-col items-center bg-slate-900/50 w-full py-0.5 rounded-lg border border-slate-700/50">
                            <span className="text-[9px] lg:text-[10px] text-slate-500 font-bold leading-none mb-0.5">TO FLY 3.00° PATH...</span>
                            <div className="flex items-baseline gap-0.5 mt-0.5">
                               {renderPathAdjustment(diffDistMap)}
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>

                 {/* Row 2: VDP/MAP 区間 */}
                 <div className="grid grid-cols-2 gap-1 flex-1">
                    <div className="bg-indigo-900/30 p-1.5 lg:p-2 rounded-2xl border border-indigo-500/30 flex flex-col justify-between shadow-inner relative overflow-hidden h-full">
                      <div className="flex flex-col items-center justify-center flex-1">
                        <span className="text-[9px] lg:text-[10px] text-indigo-300 font-black tracking-widest uppercase mb-1 text-center leading-tight">3.00° Path Target</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl lg:text-3xl font-mono font-black text-white leading-none">{Math.round(targetMapIndicated).toLocaleString()}</span>
                          <span className="text-xs lg:text-sm text-indigo-400 font-bold leading-none">FT</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-indigo-500/30">
                        <div className="flex justify-between items-center text-[9.5px] lg:text-[10.5px] font-mono">
                          <span className="text-slate-400">真高度:</span>
                          <span className="text-indigo-300 font-bold">{Math.round(true3DegMapAlt)} FT</span>
                        </div>
                      </div>
                    </div>

                   <div className="bg-emerald-900/20 p-1 lg:p-1.5 rounded-2xl border border-emerald-600/30 flex flex-col items-center justify-center shadow-inner relative overflow-hidden h-full">
                      <span className="text-[9.5px] lg:text-[10.5px] text-emerald-400 font-black tracking-widest text-center z-10 mb-0.5 leading-none flex items-center justify-center gap-1 whitespace-nowrap">
                        VDP {Math.round(true3DegMapAlt)} FT ➔ THR {numElev + 50} FT <span className="bg-emerald-900/50 text-emerald-300 px-1 py-0.5 rounded text-[7px] lg:text-[8px]">TRUE</span>
                      </span>
                      <div className="flex flex-col items-center gap-0.5 z-10 w-full mt-0.5">
                         <div className="flex w-full gap-1">
                           <div className="flex flex-col items-center bg-emerald-950/40 w-full py-0.5 rounded-lg border border-emerald-500/20 flex-1">
                             <span className="text-[9px] lg:text-[10px] text-emerald-500/80 font-bold flex items-center gap-1 leading-none mb-0.5">ANGLE <span className="text-[7.5px] bg-emerald-900/60 px-1 py-0.5 rounded">TCH 50'</span></span>
                             <span className="text-lg lg:text-xl font-mono font-black text-white leading-none mt-0.5">{angleRwy.toFixed(2)}°</span>
                           </div>
                           <div className="flex flex-col items-center bg-emerald-950/40 w-full py-0.5 rounded-lg border border-emerald-500/20 flex-1">
                             <span className="text-[9px] lg:text-[10px] text-emerald-500/80 font-bold leading-none mb-0.5">VSI @ TAS {tasPath}</span>
                             <span className="text-lg lg:text-xl font-mono font-black text-white leading-none mt-0.5">{Math.round(vsiRwy)}</span>
                           </div>
                         </div>
                         <div className="flex flex-col items-center bg-emerald-950/40 w-full py-0.5 rounded-lg border border-emerald-500/20">
                            <span className="text-[9px] lg:text-[10px] text-emerald-500/80 font-bold leading-none mb-0.5">TO FLY 3.00° PATH...</span>
                            <div className="flex items-baseline gap-0.5 mt-0.5">
                               {renderPathAdjustment(diffDistRwy)}
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>

                 {/* Row 3: CDA 区間 */}
                 <div className="grid grid-cols-2 gap-1 flex-1">
                    <div className="bg-indigo-900/30 p-1 lg:p-1.5 rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center gap-0.5 shadow-inner relative overflow-hidden h-full">
                       <span className="text-[11px] lg:text-xs text-indigo-300 font-black tracking-widest z-10 text-center leading-none">TOTAL DIST (FAF ➔ THR)</span>
                       <div className="flex items-baseline gap-1 z-10 mt-0.5">
                          <span className="text-2xl lg:text-3xl font-mono font-black text-white leading-none">{numDistCda.toFixed(1)}</span>
                          <span className="text-sm lg:text-base text-indigo-400 font-bold leading-none">NM</span>
                       </div>
                       <div className="h-4 z-10 mt-0.5">
                          <span className="text-[9px] lg:text-[10px] text-indigo-300/80 font-mono bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30 leading-none">
                            ΔH: {Math.round(heightDiffCda).toLocaleString()} FT
                          </span>
                       </div>
                    </div>

                   <div className="bg-amber-900/20 p-1 lg:p-1.5 rounded-2xl border border-amber-600/30 flex flex-col items-center justify-center shadow-inner relative overflow-hidden h-full">
                      <span className="text-[9.5px] lg:text-[10.5px] text-amber-400 font-black tracking-widest text-center z-10 mb-0.5 leading-none flex items-center justify-center gap-1 whitespace-nowrap">
                        FAF {Math.round(trueFafAlt)} FT ➔ THR {numElev + 50} FT <span className="bg-amber-900/50 text-amber-300 px-1 py-0.5 rounded text-[7px] lg:text-[8px]">TRUE (CDA)</span>
                      </span>
                      <div className="flex flex-col items-center gap-0.5 z-10 w-full mt-0.5">
                         <div className="flex w-full gap-1">
                           <div className="flex flex-col items-center bg-amber-950/40 w-full py-0.5 rounded-lg border border-amber-500/20 flex-1">
                             <span className="text-[9px] lg:text-[10px] text-amber-500/80 font-bold flex items-center gap-1 leading-none mb-0.5">ANGLE <span className="text-[7.5px] bg-amber-900/60 px-1 py-0.5 rounded">TCH 50'</span></span>
                             <span className="text-lg lg:text-xl font-mono font-black text-white leading-none mt-0.5">{angleCda.toFixed(2)}°</span>
                           </div>
                           <div className="flex flex-col items-center bg-amber-950/40 w-full py-0.5 rounded-lg border border-amber-500/20 flex-1">
                             <span className="text-[9px] lg:text-[10px] text-amber-500/80 font-bold leading-none mb-0.5">VSI @ TAS {tasPath}</span>
                             <span className="text-lg lg:text-xl font-mono font-black text-white leading-none mt-0.5">{Math.round(vsiCda)}</span>
                           </div>
                         </div>
                         <div className="flex flex-col items-center bg-amber-950/40 w-full py-0.5 rounded-lg border border-amber-500/20">
                            <span className="text-[9px] lg:text-[10px] text-amber-500/80 font-bold leading-none mb-0.5">TO FLY 3.00° PATH...</span>
                            <div className="flex items-baseline gap-0.5 mt-0.5">
                               {renderPathAdjustment(diffDistCda)}
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>
              </div>
            </div>

            {/* REPRESENTATIVE EXAMPLES */}
            <div className="mt-0 border-t border-slate-700/50 pt-1 lg:pt-1.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-0.5 mb-1">
                 <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest leading-none">Representative Approaches</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-1 lg:gap-1.5">
                {/* Card 1: RJTT LDA R22 Bank 5 */}
                <div 
                  onClick={() => { setFafAlt(5000); setDistMapFaf(11.6); setDistThrMap(3.9); setElev(35); }}
                  className="bg-slate-800 p-1 lg:p-1.5 rounded-xl border border-slate-600 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors cursor-pointer hover:border-sky-400 hover:bg-slate-700 group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/50 group-hover:bg-sky-400 transition-colors"></div>
                  <span className="text-[10px] lg:text-[11px] text-slate-400 font-bold mb-0.5 tracking-widest leading-none mt-1 group-hover:text-slate-300 transition-colors">RJTT LDA R22</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-sky-300 leading-none mb-0.5">MAP ALT {Math.round(r22Data5.alt).toLocaleString()} FT</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-sky-300 leading-none mb-0.5">FAF ➔ VDP {r22Angle5.toFixed(2)}°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">Bank 5°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">旋回開始 IKL {r22Data5.turnIkl > 0 ? '手前' : '奥'} {Math.abs(r22Data5.turnIkl).toFixed(2)} NM</span>
                  <span className="text-[8.5px] lg:text-[9.5px] font-bold text-slate-500 leading-none">Track {r22Data5.trackDist.toFixed(2)} NM</span>
                </div>
                {/* Card 2: RJTT LDA R22 Bank 15 */}
                <div 
                  onClick={() => { setFafAlt(5000); setDistMapFaf(11.6); setDistThrMap(3.9); setElev(35); }}
                  className="bg-slate-800 p-1 lg:p-1.5 rounded-xl border border-slate-600 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors cursor-pointer hover:border-sky-400 hover:bg-slate-700 group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/50 group-hover:bg-sky-400 transition-colors"></div>
                  <span className="text-[10px] lg:text-[11px] text-slate-400 font-bold mb-0.5 tracking-widest leading-none mt-1 group-hover:text-slate-300 transition-colors">RJTT LDA R22</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-sky-300 leading-none mb-0.5">MAP ALT {Math.round(r22Data15.alt).toLocaleString()} FT</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-sky-300 leading-none mb-0.5">FAF ➔ VDP {r22Angle15.toFixed(2)}°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">Bank 15°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">旋回開始 IKL {r22Data15.turnIkl > 0 ? '手前' : '奥'} {Math.abs(r22Data15.turnIkl).toFixed(2)} NM</span>
                  <span className="text-[8.5px] lg:text-[9.5px] font-bold text-slate-500 leading-none">Track {r22Data15.trackDist.toFixed(2)} NM</span>
                </div>
                {/* Card 3: RJTT LDA R23 Bank 5 */}
                <div 
                  onClick={() => { setFafAlt(4000); setDistMapFaf(9.6); setDistThrMap(3.4); setElev(55); }}
                  className="bg-slate-800 p-1 lg:p-1.5 rounded-xl border border-slate-600 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors cursor-pointer hover:border-sky-400 hover:bg-slate-700 group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/50 group-hover:bg-sky-400 transition-colors"></div>
                  <span className="text-[10px] lg:text-[11px] text-slate-400 font-bold mb-0.5 tracking-widest leading-none mt-1 group-hover:text-slate-300 transition-colors">RJTT LDA R23</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-sky-300 leading-none mb-0.5">MAP ALT {Math.round(r23Data5.alt).toLocaleString()} FT</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-sky-300 leading-none mb-0.5">FAF ➔ VDP {r23Angle5.toFixed(2)}°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">Bank 5°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">旋回開始 ITL {r23Data5.turnItl.toFixed(2)} NM</span>
                  <span className="text-[8.5px] lg:text-[9.5px] font-bold text-slate-500 leading-none">Track {r23Data5.trackDist.toFixed(2)} NM</span>
                </div>
                {/* Card 4: RJTT LDA R23 Bank 15 */}
                <div 
                  onClick={() => { setFafAlt(4000); setDistMapFaf(9.6); setDistThrMap(3.4); setElev(55); }}
                  className="bg-slate-800 p-1 lg:p-1.5 rounded-xl border border-slate-600 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors cursor-pointer hover:border-sky-400 hover:bg-slate-700 group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/50 group-hover:bg-sky-400 transition-colors"></div>
                  <span className="text-[10px] lg:text-[11px] text-slate-400 font-bold mb-0.5 tracking-widest leading-none mt-1 group-hover:text-slate-300 transition-colors">RJTT LDA R23</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-sky-300 leading-none mb-0.5">MAP ALT {Math.round(r23Data15.alt).toLocaleString()} FT</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-sky-300 leading-none mb-0.5">FAF ➔ VDP {r23Angle15.toFixed(2)}°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">Bank 15°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">旋回開始 ITL {r23Data15.turnItl.toFixed(2)} NM</span>
                  <span className="text-[8.5px] lg:text-[9.5px] font-bold text-slate-500 leading-none">Track {r23Data15.trackDist.toFixed(2)} NM</span>
                </div>
                {/* Card 5 */}
                <div 
                  onClick={() => { setFafAlt(1200); setDistMapFaf(2.2); setDistThrMap(1.4); setElev(16); }}
                  className="bg-slate-800 p-1 lg:p-1.5 rounded-xl border border-slate-600 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors cursor-pointer hover:border-emerald-400 hover:bg-slate-700 group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors"></div>
                  <span className="text-[10px] lg:text-[11px] text-slate-400 font-bold mb-0.5 tracking-widest leading-none mt-1 group-hover:text-slate-300 transition-colors">ROAH RNP 18R</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-emerald-300 leading-none mb-0.5">CDA ANGLE {roahAngle.toFixed(2)}°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">FAF 1,200 FT</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">DIST 3.6 NM</span>
                  <span className="text-[8px] lg:text-[9px] font-bold text-slate-500 leading-none">※降下角確立を含まず</span>
                </div>
                {/* Card 6: MMMX ILS R05R */}
                <div 
                  onClick={() => { setFafAlt(8900); setDistMapFaf(4.0); setDistThrMap(0.7); setElev(7287); }}
                  className="bg-slate-800 p-1 lg:p-1.5 rounded-xl border border-slate-600 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors cursor-pointer hover:border-emerald-400 hover:bg-slate-700 group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors"></div>
                  <span className="text-[10px] lg:text-[11px] text-slate-400 font-bold mb-0.5 tracking-widest leading-none mt-1 group-hover:text-slate-300 transition-colors">MMMX ILS R05R</span>
                  <span className="text-[11px] lg:text-[13px] font-black text-emerald-300 leading-none mb-0.5">CDA ANGLE {mmmxAngle.toFixed(2)}°</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">FAF 8,900 FT</span>
                  <span className="text-[9.5px] lg:text-[10.5px] font-bold text-slate-400 leading-none mb-0.5">DIST 4.7 NM</span>
                  <span className="text-[8px] lg:text-[9px] font-bold text-slate-500 leading-none">※降下角確立を含まず</span>
                </div>
              </div>
            </div>

            {/* VSI TABLE (全幅) */}
            <div className="mt-1 lg:mt-1.5 border-t border-slate-700/50 pt-1 lg:pt-1.5">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-0.5 mb-1">
                 <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest leading-none">VSI Reference (FPM) - Calculated using TAS</h3>
               </div>
               <div className="bg-slate-900/80 rounded-2xl border border-slate-700 shadow-inner overflow-hidden mt-0">
                  <div className="overflow-x-auto w-full custom-scrollbar">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700/50 bg-slate-800/30">
                          <th className="text-[9.5px] lg:text-[10.5px] font-black text-slate-400 py-1 px-2 border-r border-slate-700/50 min-w-[80px] leading-none sticky left-0 bg-slate-800/90 backdrop-blur z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">GS / TAS ➔</th>
                          {tableGsValues.map(g => (
                            <th key={g} className={`text-[10px] lg:text-[11px] font-mono font-black py-1 px-1 leading-none min-w-[40px] ${g === closestTas ? 'bg-indigo-900/50 text-white border-b-2 border-indigo-400' : 'text-slate-400'}`}>
                              {g === closestTas && <SafeIcon name="ArrowDown" className="w-2.5 h-2.5 inline-block text-indigo-400 mr-0.5 -mt-0.5" />}
                              {g}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-700/30 bg-slate-800/20">
                          <td className="text-[9px] lg:text-[10px] font-black text-slate-300 py-0.5 px-2 border-r border-slate-700/50 leading-tight sticky left-0 bg-slate-800/90 backdrop-blur z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            FAF➔TGT<br/><span className="text-[8px] opacity-80 leading-none">{angleMap.toFixed(2)}°</span>
                          </td>
                          {tableGsValues.map(g => (
                            <td key={g} className={`text-[11px] lg:text-sm font-mono font-bold py-0.5 px-1 leading-none ${g === closestTas ? 'bg-indigo-900/30 text-white' : 'text-slate-300'}`}>
                              {Math.round(g * 101.268 * Math.tan(angleMap * Math.PI / 180))}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-700/30 bg-transparent">
                          <td className="text-[9px] lg:text-[10px] font-black text-emerald-400 py-0.5 px-2 border-r border-slate-700/50 leading-tight sticky left-0 bg-slate-900/90 backdrop-blur z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            VDP➔THR<br/><span className="text-[8px] opacity-80 leading-none">{angleRwy.toFixed(2)}°</span>
                          </td>
                          {tableGsValues.map(g => (
                            <td key={g} className={`text-[11px] lg:text-sm font-mono font-bold py-0.5 px-1 leading-none ${g === closestTas ? 'bg-indigo-900/30 text-white' : 'text-emerald-300'}`}>
                              {Math.round(g * 101.268 * Math.tan(angleRwy * Math.PI / 180))}
                            </td>
                          ))}
                        </tr>
                        <tr className="last:border-none bg-slate-800/20">
                          <td className="text-[9px] lg:text-[10px] font-black text-amber-400 py-0.5 px-2 border-r border-slate-700/50 leading-tight sticky left-0 bg-slate-800/90 backdrop-blur z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            CDA<br/><span className="text-[8px] opacity-80 leading-none">{angleCda.toFixed(2)}°</span>
                          </td>
                          {tableGsValues.map(g => (
                            <td key={g} className={`text-[11px] lg:text-sm font-mono font-bold py-0.5 px-1 leading-none ${g === closestTas ? 'bg-indigo-900/30 text-white' : 'text-amber-300'}`}>
                              {Math.round(g * 101.268 * Math.tan(angleCda * Math.PI / 180))}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

          </div>
        )}

        {/* ================================== */}
        {/* --- TAB 2: TRAFFIC PATTERN CALC --- */}
        {/* ================================== */}
        {activeTab === 'pattern' && (
          <div className="flex flex-col gap-2 lg:gap-3 animate-in fade-in h-full w-full">
            
             <div className="mb-2 lg:mb-3 border-b border-slate-700/50 pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-0.5 mb-1">
                   <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest leading-none">Preset Airports</h3>
                </div>
                <div className="flex w-full gap-0.5 lg:gap-1 pb-1 overflow-x-auto">
                  {[
                     { id: "RJTT 16L", alt: 1500, trk: 158, elev: 19 },
                     { id: "RJTT 34R", alt: 1500, trk: 338, elev: 20 },
                     { id: "RJCH 12", alt: 1600, trk: 117, elev: 92 },
                     { id: "RJCH 30", alt: 1600, trk: 297, elev: 151 },
                     { id: "RJOO 14R", alt: 1500, trk: 142, elev: 50 },
                     { id: "RJOM 32", alt: 1500, trk: 318, elev: 17 },
                     { id: "RJFF 34R", alt: 1500, trk: 338, elev: 32 },
                     { id: "RJFT 07", alt: 2400, trk: 72,  elev: 601 },
                     { id: "RJFT 25", alt: 2400, trk: 252, elev: 642 },
                     { id: "RJFM 09", alt: 1500, trk: 92,  elev: 15 }
                  ].map(preset => (
                     <button
                        key={preset.id}
                        onClick={() => {
                           setTfpAlt(preset.alt);
                           setRwyTrk(preset.trk);
                           setElev(preset.elev);
                        }}
                        className="bg-slate-800 px-1 py-1.5 rounded-lg border border-slate-600 shadow-sm flex flex-col items-center justify-center whitespace-nowrap flex-1 min-w-0 hover:bg-slate-700 hover:border-indigo-400 transition-colors group overflow-hidden"
                     >
                        <span className="text-[9px] lg:text-[10px] xl:text-[11px] font-black text-slate-300 group-hover:text-white leading-none mb-0.5 truncate w-full text-center">{preset.id}</span>
                        <span className="text-[7.5px] lg:text-[8px] xl:text-[9px] font-bold text-slate-500 leading-none group-hover:text-indigo-300 transition-colors truncate w-full text-center">ALT {preset.alt} / TRK {preset.trk}°</span>
                     </button>
                  ))}
                </div>
             </div>
             　　
             {/* --- 上段：入力とテキスト結果（2カラム） --- */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
               {/* ◀ 左側：入力パネル */}
               <div className="flex flex-col gap-0.5 lg:gap-1 h-full">
                  <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Inputs (Manual)</h3>
                  <div className="flex flex-col gap-0.5 lg:gap-1 flex-1 justify-between">
                    <SliderInput label="TARGET ALT (FT)" value={tfpAlt} setter={setTfpAlt} min={500} max={3000} step={10} colorClass="text-sky-400" accentClass="accent-sky-400" />
                    <SliderInput label="PATTERN WIDTH (NM)" value={tfpPatternWidth} setter={setTfpPatternWidth} min={1.5} max={3.0} step={0.1} colorClass="text-indigo-400" accentClass="accent-indigo-400" />
                    <div className="grid grid-cols-2 gap-1 lg:gap-2">
                      <SliderInput label="BASE TURN BANK (°)" value={bankBase} setter={setBankBase} min={15} max={30} step={1} colorClass="text-amber-400" accentClass="accent-amber-400" />
                      <SliderInput label="FINAL TURN BANK (°)" value={bankFinal} setter={setBankFinal} min={15} max={30} step={1} colorClass="text-purple-400" accentClass="accent-purple-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-1 lg:gap-2">
                      <SliderInput label="RWY TRACK (°)" value={rwyTrk} setter={setRwyTrk} min={1} max={360} step={1} colorClass="text-slate-400" accentClass="accent-slate-400" />
                      <SliderInput label="ELEVATION (FT)" value={elev} setter={setElev} min={0} max={8000} step={1} colorClass="text-slate-400" accentClass="accent-slate-400" />
                    </div>
                    <SliderInput 
                      label="AIRPORT OAT (°C)" value={oat} setter={setOat} min={-40} max={54} step={1} colorClass="text-orange-400" accentClass="accent-orange-400" 
                    />
                    <SliderInput 
                      label="TARGET SPD @ DW (IAS) (KT)" value={tfpGsDw} setter={setTfpGsDw} min={110} max={250} step={5} colorClass="text-slate-400" accentClass="accent-slate-400" 
                      rightAddon={
                        <div className="flex items-center gap-1 ml-0.5 border-l border-slate-700 pl-1.5 lg:pl-2">
                          <span className="text-[8px] lg:text-[10px] font-black text-slate-400">TAS</span>
                          <div className="bg-slate-900/80 border border-slate-700/50 rounded px-1.5 py-0.5 shadow-inner text-right min-w-[2.5rem]">
                            <span className="text-sm lg:text-base font-mono font-black text-sky-300 leading-none">{calculateTAS(tfpGsDw, tfpAlt, oat)}</span>
                          </div>
                        </div>
                      }
                    />
                    <SliderInput label="DW TAILWIND (KT)" subLabel="Headwind on RWY" value={wind} setter={setWind} min={-20} max={40} step={1} colorClass="text-sky-400" accentClass="accent-sky-400" />
                    <SliderInput label="CROSS WIND @ DW (KT)" subLabel="<0: Left / >0: Right" value={crossWind} setter={setCrossWind} min={-40} max={40} step={1} colorClass="text-teal-400" accentClass="accent-teal-400" />
                  </div>
               </div>

               {/* ▶ 右側：出力テキストパネル */}
               <div className="flex flex-col gap-1 lg:gap-1.5 h-full">
                  <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Descent Start Point (3.00° PATH)</h3>
                  
                  <div className="flex w-full gap-2 flex-1">
                     {/* LEFT TRAFFIC CARD */}
                     <div className="bg-indigo-900/30 p-2 lg:p-3 rounded-2xl border border-indigo-500/50 shadow-inner relative overflow-hidden flex-1 flex flex-col justify-between">
                       <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                       <span className="text-[10px] lg:text-xs font-black text-indigo-300 tracking-widest text-center mb-1 leading-none mt-1">LEFT TRAFFIC</span>
                       
                       <div className="flex flex-col items-center justify-center mb-2 mt-1">
                         <span className="text-[8px] lg:text-[10px] text-slate-400 font-bold mb-0.5">DESCENDING TRK</span>
                         <div className="flex items-baseline gap-0.5">
                            <span className="text-3xl lg:text-4xl font-mono font-black text-emerald-400 leading-none">{formatHdg(numRwyTrk - tfpDataLT.angle)}</span>
                            <span className="text-lg text-emerald-600 font-bold">°</span>
                         </div>
                       </div>
                       
                       <div className="flex flex-col items-center justify-center mb-2">
                          <span className="text-[9px] lg:text-[10px] font-mono font-bold text-slate-300 text-center leading-none">Turned: {(180 - tfpDataLT.angle).toFixed(1)}°</span>
                       </div>
                       
                       <div className="flex flex-col gap-1 w-full shrink-0">
                         <div className="h-[22px] lg:h-[26px] w-full">
                           {tfpDataLT.abeamSeconds !== -1 && (
                             <div className="flex justify-between items-center h-full text-[10px] lg:text-[11px] text-amber-400 font-mono bg-slate-900/40 px-1.5 rounded-sm">
                               <span>Abeam降下:</span>
                               <span className="font-black">{tfpDataLT.isEarly ? '手前 ' : '通過後 '}{tfpDataLT.abeamSeconds.toFixed(1)}s</span>
                             </div>
                           )}
                         </div>

                         <div className="h-[38px] lg:h-[44px] w-full">
                           {tfpDataLT.isContinuousTurn ? (
                             <div className={`flex flex-col justify-center h-full text-[10px] lg:text-[11px] font-mono px-1.5 rounded-sm border ${tfpDataLT.continuousType === 'tight' ? 'bg-orange-950/40 border-orange-500/30 text-orange-300' : 'bg-sky-950/40 border-sky-500/30 text-sky-300'}`}>
                               <div className="flex justify-between items-center">
                                 <span>Base Straight:</span>
                                 <span className="font-black uppercase text-[10px] tracking-tighter">CONTINUOUS</span>
                               </div>
                               <div className="flex justify-between items-center text-[8.5px] lg:text-[9.5px] opacity-80 mt-0.5 border-t border-current pt-0.5">
                                 <span>{tfpDataLT.continuousType === 'tight' ? 'Overshoot:' : 'Trans Margin:'}</span>
                                 <span className="font-bold">
                                   {tfpDataLT.continuousType === 'tight' 
                                     ? `+${tfpDataLT.drawData.overshootNM.toFixed(2)} NM` 
                                     : `${tfpDataLT.drawData.availTransTime.toFixed(1)} sec`
                                   }
                                 </span>
                               </div>
                             </div>
                           ) : tfpDataLT.baseSeconds !== undefined && (
                             <div className="flex justify-between items-center h-full text-[10px] lg:text-[11px] text-sky-300 font-mono bg-slate-900/40 px-1.5 rounded-sm">
                               <span>Base Straight:</span>
                               <span className="font-black">{tfpDataLT.baseSeconds.toFixed(1)}s</span>
                             </div>
                           )}
                         </div>

                         <div className="h-[52px] lg:h-[58px] w-full mt-0.5">
                           {tfpDataLT.shortenedSeconds !== null && (
                             <div className="flex flex-col justify-center h-full bg-indigo-950/40 border border-indigo-500/30 rounded px-1.5 gap-0.5">
                               <div className="text-[9px] lg:text-[10px] text-indigo-300 font-mono font-bold mb-0.5">2.5NM留まるには:</div>
                               <div className="flex justify-between text-[8.5px] lg:text-[9.5px] text-slate-300 font-mono">
                                 <span>DW:</span><span className="text-emerald-400 font-bold">{tfpDataLT.shortenedSeconds.toFixed(1)}s</span>
                               </div>
                               <div className="flex justify-between text-[8.5px] lg:text-[9.5px] text-slate-300 font-mono">
                                 <span>降下:</span><span className="text-emerald-400 font-bold">{tfpDataLT.advanceSeconds.toFixed(1)}s 早く</span>
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>

                     {/* RIGHT TRAFFIC CARD */}
                     <div className="bg-emerald-900/20 p-2 lg:p-3 rounded-2xl border border-emerald-500/50 shadow-inner relative overflow-hidden flex-1 flex flex-col justify-between">
                       <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                       <span className="text-[10px] lg:text-xs font-black text-emerald-300 tracking-widest text-center mb-1 leading-none mt-1">RIGHT TRAFFIC</span>
                       
                       <div className="flex flex-col items-center justify-center mb-2 mt-1">
                         <span className="text-[8px] lg:text-[10px] text-slate-400 font-bold mb-0.5">DESCENDING TRK</span>
                         <div className="flex items-baseline gap-0.5">
                            <span className="text-3xl lg:text-4xl font-mono font-black text-emerald-400 leading-none">{formatHdg(numRwyTrk + tfpDataRT.angle)}</span>
                            <span className="text-lg text-emerald-600 font-bold">°</span>
                         </div>
                       </div>
                       
                       <div className="flex flex-col items-center justify-center mb-2">
                          <span className="text-[9px] lg:text-[10px] font-mono font-bold text-slate-300 text-center leading-none">Turned: {(180 - tfpDataRT.angle).toFixed(1)}°</span>
                       </div>
                       
                       <div className="flex flex-col gap-1 w-full shrink-0">
                         <div className="h-[22px] lg:h-[26px] w-full">
                           {tfpDataRT.abeamSeconds !== -1 && (
                             <div className="flex justify-between items-center h-full text-[10px] lg:text-[11px] text-amber-400 font-mono bg-slate-900/40 px-1.5 rounded-sm">
                               <span>Abeam降下:</span>
                               <span className="font-black">{tfpDataRT.isEarly ? '手前 ' : '通過後 '}{tfpDataRT.abeamSeconds.toFixed(1)}s</span>
                             </div>
                           )}
                         </div>

                         <div className="h-[38px] lg:h-[44px] w-full">
                           {tfpDataRT.isContinuousTurn ? (
                             <div className={`flex flex-col justify-center h-full text-[10px] lg:text-[11px] font-mono px-1.5 rounded-sm border ${tfpDataRT.continuousType === 'tight' ? 'bg-orange-950/40 border-orange-500/30 text-orange-300' : 'bg-sky-950/40 border-sky-500/30 text-sky-300'}`}>
                               <div className="flex justify-between items-center">
                                 <span>Base Straight:</span>
                                 <span className="font-black uppercase text-[10px] tracking-tighter">CONTINUOUS</span>
                               </div>
                               <div className="flex justify-between items-center text-[8.5px] lg:text-[9.5px] opacity-80 mt-0.5 border-t border-current pt-0.5">
                                 <span>{tfpDataRT.continuousType === 'tight' ? 'Overshoot:' : 'Trans Margin:'}</span>
                                 <span className="font-bold">
                                   {tfpDataRT.continuousType === 'tight' 
                                     ? `+${tfpDataRT.drawData.overshootNM.toFixed(2)} NM` 
                                     : `${tfpDataRT.drawData.availTransTime.toFixed(1)} sec`
                                   }
                                 </span>
                               </div>
                             </div>
                           ) : tfpDataRT.baseSeconds !== undefined && (
                             <div className="flex justify-between items-center h-full text-[10px] lg:text-[11px] text-sky-300 font-mono bg-slate-900/40 px-1.5 rounded-sm">
                               <span>Base Straight:</span>
                               <span className="font-black">{tfpDataRT.baseSeconds.toFixed(1)}s</span>
                             </div>
                           )}
                         </div>

                         <div className="h-[52px] lg:h-[58px] w-full mt-0.5">
                           {tfpDataRT.shortenedSeconds !== null && (
                             <div className="flex flex-col justify-center h-full bg-emerald-950/30 border border-emerald-500/30 rounded px-1.5 gap-0.5">
                               <div className="text-[9px] lg:text-[10px] text-emerald-300 font-mono font-bold mb-0.5">2.5NM留まるには:</div>
                               <div className="flex justify-between text-[8.5px] lg:text-[9.5px] text-slate-300 font-mono">
                                 <span>DW:</span><span className="text-emerald-400 font-bold">{tfpDataRT.shortenedSeconds.toFixed(1)}s</span>
                               </div>
                               <div className="flex justify-between text-[8.5px] lg:text-[9.5px] text-slate-300 font-mono">
                                 <span>降下:</span><span className="text-emerald-400 font-bold">{tfpDataRT.advanceSeconds.toFixed(1)}s 早く</span>
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 w-full shrink-0 mt-auto bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-center text-[10px] lg:text-[12px] text-slate-400 font-mono border-b border-slate-700/50 pb-1">
                      <span>真高度 (ISA {Math.round(currentIsaDev) > 0 ? `+${Math.round(currentIsaDev)}` : Math.round(currentIsaDev)}):</span>
                      <span className="text-sky-300 font-bold">{Math.round(tfpDataLT.trueTfpAlt).toLocaleString()} FT</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] lg:text-[12px] text-slate-400 font-mono border-b border-slate-700/50 pb-1 pt-1">
                      <div className="flex justify-between items-center border-r border-slate-700/50 pr-2">
                        <span><span className="text-indigo-400 font-bold">LT</span> 総飛行距離:</span>
                        <span className="text-slate-200">{tfpDataLT.totalDist?.toFixed(2)} NM</span>
                      </div>
                      <div className="flex justify-between items-center pl-1">
                        <span><span className="text-emerald-400 font-bold">RT</span> 総飛行距離:</span>
                        <span className="text-slate-200">{tfpDataRT.totalDist?.toFixed(2)} NM</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] lg:text-[12px] text-slate-400 font-mono border-b border-slate-700/50 pb-1 pt-1">
                      <div className="flex justify-between items-center border-r border-slate-700/50 pr-2">
                        <span><span className="text-indigo-400 font-bold">LT</span> 必要降下距離:</span>
                        <span className="text-slate-200">{tfpDataLT.reqDist?.toFixed(2)} NM</span>
                      </div>
                      <div className="flex justify-between items-center pl-1">
                        <span><span className="text-emerald-400 font-bold">RT</span> 必要降下距離:</span>
                        <span className="text-slate-200">{tfpDataRT.reqDist?.toFixed(2)} NM</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9.5px] lg:text-[11px] text-purple-400 font-mono border-b border-slate-700/50 pb-1 pt-1">
                      <div className="flex justify-between items-center border-r border-slate-700/50 pr-1 lg:pr-2">
                        <span className="font-bold flex items-center gap-1 whitespace-nowrap">
                          <SafeIcon name="TrendingDown" className="w-3 h-3 shrink-0" />
                          DIRECT BASE 降下開始距離:
                        </span>
                        <span className="text-purple-300 font-bold ml-1">{Math.abs(directBaseData.drawData.ptDescDB?.y || 0).toFixed(2)} NM</span>
                      </div>
                      <div className="flex justify-between items-center pl-1">
                        <span className="font-bold flex items-center gap-1 whitespace-nowrap">
                          <SafeIcon name="RotateCcw" className="w-3 h-3 shrink-0" />
                          DIRECT BASE 旋回開始距離:
                        </span>
                        <span className="text-purple-300 font-bold ml-1">{directBaseData.turnLeadDist?.toFixed(2)} NM</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-1 text-[9px] lg:text-[10.5px] text-slate-400 font-mono">
                       <div className="text-slate-300 font-bold mb-0.5">前提条件</div>
                       <div className="grid grid-cols-1 md:grid-cols-5 gap-x-2 gap-y-0.5">
                         <div className="md:col-span-3">• Down Wind飛行時間 : <span className="text-slate-300">35sec (Tailwind 10kt毎に -4s)</span></div>
                         <div className="md:col-span-2">• Bank確立 : <span className="text-slate-300">5°/sec</span></div>
                         <div className="md:col-span-5">• Down Wind間のSPD : <span className="text-slate-300">Target DW SPD <span className="text-[8px] text-slate-500">(TAS {tfpDataLT.tas_dw}kt)</span></span></div>
                         <div className="md:col-span-3">• Base Turn以降のSPD : <span className="text-slate-300">Target DW SPD - 20kt <span className="text-[8px] text-slate-500">(TAS {tfpDataLT.tas_final_base}kt)</span></span></div>
                         <div className="md:col-span-2">• TCH : <span className="text-slate-300">50ft</span></div>
                         <div className="md:col-span-5">• 降下のPitch確立 : <span className="text-slate-300">0.5°/secで3.4sec（4.2° ⇒ 2.5°）</span></div>
                       </div>
                    </div>
                  </div>
               </div>
             </div>

             {/* --- 下段：トラフィックパターン描画領域 --- */}
             <div className="w-full mt-1 relative">
               {tfpDataLT.reqDist > 0 && tfpDataLT.drawData && tfpDataRT.drawData && (
                 <TrafficPatternGraphic drawDataLT={tfpDataLT.drawData} drawDataRT={tfpDataRT.drawData} drawDataDB={directBaseData.drawData} />
               )}
             </div>

          </div>
        )}

        {/* ================================== */}
        {/* --- TAB 3: MIN CIRCLING --- */}
        {/* ================================== */}
        {activeTab === 'circling' && (
          <div className="flex flex-col gap-2 lg:gap-3 animate-in fade-in h-full w-full">
             
             <div className="mb-2 lg:mb-3 border-b border-slate-700/50 pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-0.5 mb-1">
                   <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest leading-none">Preset Airports (MDA)</h3>
                </div>
                <div className="flex w-full gap-0.5 lg:gap-1 pb-1 overflow-x-auto">
                  {[
                     { id: "RJTT 16L", mda: 730, trk: 158, elev: 19 },
                     { id: "RJTT 34R", mda: 730, trk: 338, elev: 20 },
                     { id: "RJCH 12", mda: 690, trk: 117, elev: 92 },
                     { id: "RJCH 30", mda: 690, trk: 297, elev: 151 },
                     { id: "RJOO 14R", mda: 760, trk: 142, elev: 50 },
                     { id: "RJOM 32", mda: 570, trk: 318, elev: 17 },
                     { id: "RJFF 34R", mda: 1030, trk: 338, elev: 32 },
                     { id: "RJFT 07", mda: 1190, trk: 72,  elev: 601 },
                     { id: "RJFT 25", mda: 1190, trk: 252, elev: 642 },
                     { id: "RJFM 09", mda: 650, trk: 92,  elev: 15 }
                  ].map(preset => (
                     <button
                        key={preset.id}
                        onClick={() => {
                           setMda(preset.mda);
                           setRwyTrk(preset.trk);
                           setElev(preset.elev);
                        }}
                        className="bg-slate-800 px-1 py-1.5 rounded-lg border border-slate-600 shadow-sm flex flex-col items-center justify-center whitespace-nowrap flex-1 min-w-0 hover:bg-slate-700 hover:border-indigo-400 transition-colors group overflow-hidden"
                     >
                        <span className="text-[9px] lg:text-[10px] xl:text-[11px] font-black text-slate-300 group-hover:text-white leading-none mb-0.5 truncate w-full text-center">{preset.id}</span>
                        <span className="text-[7.5px] lg:text-[8px] xl:text-[9px] font-bold text-slate-500 leading-none group-hover:text-indigo-300 transition-colors truncate w-full text-center">MDA {preset.mda} / TRK {preset.trk}°</span>
                     </button>
                  ))}
                </div>
             </div>

             {/* --- 上段：入力とテキスト結果（2カラム） --- */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
               {/* ◀ 左側：入力パネル */}
               <div className="flex flex-col gap-0.5 lg:gap-1 h-full">
                  <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Inputs (Manual)</h3>
                  <div className="flex flex-col gap-0.5 lg:gap-1 flex-1 justify-between">
                    <SliderInput label="MDA (FT)" value={mda} setter={setMda} min={500} max={1500} step={10} colorClass="text-sky-400" accentClass="accent-sky-400" />
                    <SliderInput label="PATTERN WIDTH (NM)" value={circlingPatternWidth} setter={setCirclingPatternWidth} min={1.0} max={3.0} step={0.1} colorClass="text-indigo-400" accentClass="accent-indigo-400" />
                    <div className="grid grid-cols-2 gap-1 lg:gap-2">
                      <SliderInput label="RWY TRACK (°)" value={rwyTrk} setter={setRwyTrk} min={1} max={360} step={1} colorClass="text-slate-400" accentClass="accent-slate-400" />
                      <SliderInput label="ELEVATION (FT)" value={elev} setter={setElev} min={0} max={8000} step={1} colorClass="text-slate-400" accentClass="accent-slate-400" />
                    </div>
                    <SliderInput 
                      label="AIRPORT OAT (°C)" value={oat} setter={setOat} min={-40} max={54} step={1} colorClass="text-orange-400" accentClass="accent-orange-400" 
                    />
                    <SliderInput 
                      label="TARGET APP SPD (IAS) (KT)" value={circlingAppSpd} setter={setCirclingAppSpd} min={110} max={250} step={5} colorClass="text-slate-400" accentClass="accent-slate-400" 
                      rightAddon={
                        <div className="flex items-center gap-1 ml-0.5 border-l border-slate-700 pl-1.5 lg:pl-2">
                          <span className="text-[8px] lg:text-[10px] font-black text-slate-400">TAS</span>
                          <div className="bg-slate-900/80 border border-slate-700/50 rounded px-1.5 py-0.5 shadow-inner text-right min-w-[2.5rem]">
                            <span className="text-sm lg:text-base font-mono font-black text-sky-300 leading-none">{calculateTAS(circlingAppSpd, mda, oat)}</span>
                          </div>
                        </div>
                      }
                    />
                    <SliderInput label="DW TAILWIND (KT)" subLabel="Headwind on RWY" value={wind} setter={setWind} min={-20} max={40} step={1} colorClass="text-sky-400" accentClass="accent-sky-400" />
                    <SliderInput label="CROSS WIND @ DW (KT)" subLabel="<0: Left / >0: Right" value={crossWind} setter={setCrossWind} min={-40} max={40} step={1} colorClass="text-teal-400" accentClass="accent-teal-400" />
                  </div>
               </div>

               {/* ▶ 右側：出力テキストパネル */}
               <div className="flex flex-col gap-1 lg:gap-1.5 h-full">
                  <h3 className="text-xs lg:text-sm font-black text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Circling Descent Start</h3>
                  
                  <div className="flex w-full gap-2 flex-1">
                     {/* LEFT TRAFFIC CARD */}
                     <div className="bg-indigo-900/30 p-2 lg:p-3 rounded-2xl border border-indigo-500/50 shadow-inner relative overflow-hidden flex-1 flex flex-col justify-between">
                       <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                       <span className="text-[10px] lg:text-xs font-black text-indigo-300 tracking-widest text-center mb-1 leading-none mt-1">LEFT TRAFFIC</span>
                       <div className="flex flex-col items-center justify-center mb-2 mt-1">
                         <span className="text-[8px] lg:text-[10px] text-slate-400 font-bold mb-0.5">DESCENDING TRK</span>
                         <div className="flex items-baseline gap-0.5">
                            <span className="text-3xl lg:text-4xl font-mono font-black text-emerald-400 leading-none">{formatHdg(numRwyTrk - circlingDataLT.angle)}</span>
                            <span className="text-lg text-emerald-600 font-bold">°</span>
                         </div>
                       </div>
                       <div className="flex flex-col items-center justify-center mb-2">
                          <span className="text-[9px] lg:text-[10px] font-mono font-bold text-slate-300 text-center leading-none">Turned: {(180 - circlingDataLT.angle).toFixed(1)}°</span>
                       </div>
                       <div className="flex flex-col gap-1 w-full shrink-0">
                         <div className="h-[22px] lg:h-[26px] w-full">
                           {circlingDataLT.abeamSeconds !== -1 && (
                             <div className="flex justify-between items-center h-full text-[10px] lg:text-[11px] text-amber-400 font-mono bg-slate-900/40 px-1.5 rounded-sm">
                               <span>Abeam降下:</span>
                               <span className="font-black">{circlingDataLT.isEarly ? '手前 ' : '通過後 '}{circlingDataLT.abeamSeconds.toFixed(1)}s</span>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>

                     {/* RIGHT TRAFFIC CARD */}
                     <div className="bg-emerald-900/20 p-2 lg:p-3 rounded-2xl border border-emerald-500/50 shadow-inner relative overflow-hidden flex-1 flex flex-col justify-between">
                       <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                       <span className="text-[10px] lg:text-xs font-black text-emerald-300 tracking-widest text-center mb-1 leading-none mt-1">RIGHT TRAFFIC</span>
                       <div className="flex flex-col items-center justify-center mb-2 mt-1">
                         <span className="text-[8px] lg:text-[10px] text-slate-400 font-bold mb-0.5">DESCENDING TRK</span>
                         <div className="flex items-baseline gap-0.5">
                            <span className="text-3xl lg:text-4xl font-mono font-black text-emerald-400 leading-none">{formatHdg(numRwyTrk + circlingDataRT.angle)}</span>
                            <span className="text-lg text-emerald-600 font-bold">°</span>
                         </div>
                       </div>
                       <div className="flex flex-col items-center justify-center mb-2">
                          <span className="text-[9px] lg:text-[10px] font-mono font-bold text-slate-300 text-center leading-none">Turned: {(180 - circlingDataRT.angle).toFixed(1)}°</span>
                       </div>
                       <div className="flex flex-col gap-1 w-full shrink-0">
                         <div className="h-[22px] lg:h-[26px] w-full">
                           {circlingDataRT.abeamSeconds !== -1 && (
                             <div className="flex justify-between items-center h-full text-[10px] lg:text-[11px] text-amber-400 font-mono bg-slate-900/40 px-1.5 rounded-sm">
                               <span>Abeam降下:</span>
                               <span className="font-black">{circlingDataRT.isEarly ? '手前 ' : '通過後 '}{circlingDataRT.abeamSeconds.toFixed(1)}s</span>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 w-full shrink-0 mt-auto bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">

                    <div className="grid grid-cols-2 gap-2 mb-1">
                      {/* LT Required Bank */}
                      <div className="flex flex-col">
                        <div className={`p-1.5 lg:p-2 rounded-xl border flex items-center justify-between shadow-lg relative overflow-hidden ${circlingDataLT.isOvershoot ? 'bg-orange-950/40 border-orange-500/50' : 'bg-indigo-950/40 border-indigo-500/50'}`}>
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                          <div className="flex flex-col z-10 pl-1.5">
                            <span className={`text-[8.5px] lg:text-[9.5px] font-black uppercase tracking-widest ${circlingDataLT.isOvershoot ? 'text-orange-400/80' : 'text-indigo-300/80'}`}>LT Req Bank</span>
                            <span className="text-[9px] lg:text-[10px] font-mono font-bold text-slate-300 mt-0.5">W: {numCirclingPatternWidth.toFixed(2)}NM</span>
                          </div>
                          <div className="flex items-baseline gap-0.5 z-10">
                            <span className={`text-xl lg:text-2xl font-mono font-black leading-none ${circlingDataLT.isOvershoot ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]'}`}>
                              {circlingDataLT.reqBankDeg?.toFixed(1)}
                            </span>
                            <span className={`text-xs lg:text-sm font-bold ${circlingDataLT.isOvershoot ? 'text-orange-500' : 'text-indigo-400'}`}>°</span>
                          </div>
                          {circlingDataLT.isOvershoot && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center opacity-10 pointer-events-none">
                              <span className="text-2xl lg:text-3xl font-black text-orange-500 tracking-widest whitespace-nowrap">LIMIT OVER</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RT Required Bank */}
                      <div className="flex flex-col">
                        <div className={`p-1.5 lg:p-2 rounded-xl border flex items-center justify-between shadow-lg relative overflow-hidden ${circlingDataRT.isOvershoot ? 'bg-orange-950/40 border-orange-500/50' : 'bg-emerald-950/40 border-emerald-500/50'}`}>
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                          <div className="flex flex-col z-10 pl-1.5">
                            <span className={`text-[8.5px] lg:text-[9.5px] font-black uppercase tracking-widest ${circlingDataRT.isOvershoot ? 'text-orange-400/80' : 'text-emerald-300/80'}`}>RT Req Bank</span>
                            <span className="text-[9px] lg:text-[10px] font-mono font-bold text-slate-300 mt-0.5">W: {numCirclingPatternWidth.toFixed(2)}NM</span>
                          </div>
                          <div className="flex items-baseline gap-0.5 z-10">
                            <span className={`text-xl lg:text-2xl font-mono font-black leading-none ${circlingDataRT.isOvershoot ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}>
                              {circlingDataRT.reqBankDeg?.toFixed(1)}
                            </span>
                            <span className={`text-xs lg:text-sm font-bold ${circlingDataRT.isOvershoot ? 'text-orange-500' : 'text-emerald-400'}`}>°</span>
                          </div>
                          {circlingDataRT.isOvershoot && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center opacity-10 pointer-events-none">
                              <span className="text-2xl lg:text-3xl font-black text-orange-500 tracking-widest whitespace-nowrap">LIMIT OVER</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] lg:text-[12px] text-slate-400 font-mono border-b border-slate-700/50 pb-1 pt-0.5">
                      <span>真のMDA (ISA {Math.round(currentIsaDev) > 0 ? `+${Math.round(currentIsaDev)}` : Math.round(currentIsaDev)}):</span>
                      <span className="text-sky-300 font-bold">{Math.round(circlingDataLT.trueMda).toLocaleString()} FT</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] lg:text-[12px] text-slate-400 font-mono border-b border-slate-700/50 pb-1 pt-1 mt-0.5">
                      <div className="flex justify-between items-center border-r border-slate-700/50 pr-2">
                        <span><span className="text-indigo-400 font-bold">LT</span> 総飛行距離:</span>
                        <span className="text-slate-200">{circlingDataLT.totalDist?.toFixed(2)} NM</span>
                      </div>
                      <div className="flex justify-between items-center pl-1">
                        <span><span className="text-emerald-400 font-bold">RT</span> 総飛行距離:</span>
                        <span className="text-slate-200">{circlingDataRT.totalDist?.toFixed(2)} NM</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] lg:text-[12px] text-slate-400 font-mono pb-1 pt-1">
                      <div className="flex justify-between items-center border-r border-slate-700/50 pr-2">
                        <span><span className="text-indigo-400 font-bold">LT</span> 必要降下距離:</span>
                        <span className="text-slate-200">{circlingDataLT.reqDist?.toFixed(2)} NM</span>
                      </div>
                      <div className="flex justify-between items-center pl-1">
                        <span><span className="text-emerald-400 font-bold">RT</span> 必要降下距離:</span>
                        <span className="text-slate-200">{circlingDataRT.reqDist?.toFixed(2)} NM</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-1 text-[9px] lg:text-[10.5px] text-slate-400 font-mono">
                       <div className="text-slate-300 font-bold mb-0.5">前提条件</div>
                       <div className="grid grid-cols-1 md:grid-cols-5 gap-x-2 gap-y-0.5">
                         <div className="md:col-span-3">• Down Wind飛行時間 : <span className="text-slate-300">20sec (Tailwind 10kt毎に -4s)</span></div>
                         <div className="md:col-span-2">• Bank確立 : <span className="text-slate-300">5°/sec</span></div>
                         <div className="md:col-span-3">• 全区間のSPD : <span className="text-slate-300">Target APP SPD <span className="text-[8px] text-slate-500">(TAS {circlingDataLT.tas_app}kt)</span></span></div>
                         <div className="md:col-span-2">• TCH : <span className="text-slate-300">50ft</span></div>
                         <div className="md:col-span-5">• 降下のPitch確立 : <span className="text-slate-300">0.5°/secで3.4sec（4.2° ⇒ 2.5°）</span></div>
                       </div>
                    </div>
                  </div>

               </div>
             </div>

             {/* --- 下段：トラフィックパターン描画領域 --- */}
             <div className="w-full mt-1 relative">
               {circlingDataLT.reqDist > 0 && circlingDataLT.drawData && circlingDataRT.drawData && (
                 <CirclingPatternGraphic drawDataLT={circlingDataLT.drawData} drawDataRT={circlingDataRT.drawData} dwTime={numCirclingDwTime} />
               )}
             </div>

          </div>
        )}

      </div>
    </div>
  );
};

// --- [5-8] XwindView (XWIND) ---
const XwindView = () => {
  const [selectedRwy, setSelectedRwy] = useState(null);
  const [isCopMode, setIsCopMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState({ row: null, col: null });

  const runways = Array.from({ length: 36 }, (_, i) => String(i + 1).padStart(2, '0'));

  if (!selectedRwy) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] p-4 md:p-6 shadow-2xl border border-slate-700 animate-in fade-in">
        <div className="flex flex-col items-center gap-1 text-amber-400 mb-6">
          <SafeIcon name="Wind" className="w-10 h-10 md:w-12 md:h-12" />
          <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-widest text-center leading-tight">滑走路別<br />WIND COMPONENT</h2>
        </div>
        <div className="grid grid-cols-6 md:grid-cols-9 gap-2 md:gap-3 w-full max-w-4xl">
          {runways.map(rwy => (
            <button key={rwy} onClick={() => setSelectedRwy(rwy)} className="bg-slate-700/80 hover:bg-amber-600 border border-slate-500 hover:border-amber-400 text-white font-bold py-2 md:py-3 rounded-xl transition-all shadow-md text-center text-xs md:text-sm tracking-widest">{rwy}</button>
          ))}
        </div>
      </div>
    );
  }

  const limitConfig = B777_WIND_LIMITS;
  const activeCols = isCopMode ? limitConfig.copCols : limitConfig.capCols;
  const rwyHeading = parseInt(selectedRwy, 10) * 10;

  const tableData = Array.from({ length: 17 }, (_, i) => {
    const diff = (i + 1) * 10; let leftWind = rwyHeading - diff; if (leftWind <= 0) leftWind += 360;
    let rightWind = rwyHeading + diff; if (rightWind > 360) rightWind -= 360;
    const rowCalc = calculateWindComponentRow(selectedRwy, leftWind, limitConfig, isCopMode);
    return { leftWindStr: String(leftWind).padStart(3, '0'), rightWindStr: String(rightWind).padStart(3, '0'), vals: rowCalc.vals, isTailwind: diff > 90 };
  });

  return (
    <div className="w-full h-full flex flex-col bg-slate-800/80 backdrop-blur-xl rounded-[1.5rem] border border-slate-700 animate-in fade-in overflow-hidden">
      <div className="bg-slate-900/60 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between border-b border-slate-600 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setSelectedRwy(null)} className="bg-slate-700 hover:bg-slate-600 text-white p-1.5 md:p-2 rounded-lg transition-colors shadow-sm border border-slate-500"><SafeIcon name="ArrowLeft" className="w-4 h-4 md:w-5 md:h-5" /></button>
          <h2 className="text-base md:text-xl font-black text-white tracking-widest flex items-center gap-2">RWY <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">{selectedRwy}</span></h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-700/80 p-1 rounded-lg border border-slate-600 shadow-inner">
            <button onClick={() => setIsCopMode(false)} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-xs font-black tracking-widest transition-all ${!isCopMode ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-600'}`}>CAP</button>
            <button onClick={() => setIsCopMode(true)} className={`px-3 md:px-4 py-1.5 rounded-md text-[10px] md:text-xs font-black tracking-widest transition-all ${isCopMode ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-600'}`}>COP</button>
          </div>
        </div>
      </div>
      <div className="p-1.5 md:p-3 overflow-y-auto custom-scrollbar flex-1 bg-slate-900/20">
        <div className="max-w-4xl mx-auto w-full pb-4">
            <table className="w-full text-center border-collapse border border-slate-600 bg-slate-800/80 shadow-lg rounded-lg overflow-hidden">
              <thead className="sticky top-0 z-20">
                <tr>
                  <th className="bg-slate-700 text-slate-300 font-black text-[9px] md:text-[10px] p-1.5 md:p-2 border border-slate-600 min-w-[50px] shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                    <div className="mb-1 text-center whitespace-nowrap">L WIND</div>
                    <div className="flex flex-col mt-1 text-[7px] md:text-[8px] text-slate-400 text-center font-normal border-t border-slate-600 pt-1 w-full gap-[1px]">
                      <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter">T/O</div>
                      <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter">L/D</div>
                      <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter whitespace-nowrap">&ge;2700m</div>
                      <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter whitespace-nowrap">&lt;2700m</div>
                    </div>
                  </th>
                  {activeCols.map((col, idx) => (
                    <th key={idx} className={`text-white font-black p-1.5 md:p-2 border border-slate-600 min-w-[60px] transition-colors shadow-[0_2px_5px_rgba(0,0,0,0.5)] ${selectedCell.col === idx ? 'bg-sky-800/90' : 'bg-slate-700'} ${isCopMode && col.isCopHalf && selectedCell.col !== idx ? 'bg-sky-900/40' : ''}`}>
                      <div className="text-amber-400 text-xs md:text-sm">{isCopMode && col.isCopHalf ? `${col.val}/2` : col.val}</div>
                      <div className="flex flex-col mt-1 text-[6.5px] md:text-[7.5px] text-slate-300 font-normal border-t border-slate-600 pt-1 w-full gap-[1px]">
                        {col.labels.map((lbl, lIdx) => (<div key={lIdx} className={`h-[12px] flex items-center justify-center rounded-sm leading-none whitespace-nowrap tracking-tighter px-0.5 ${lbl !== '-' ? 'bg-slate-900/60' : ''}`}>{lbl}</div>))}
                      </div>
                    </th>
                  ))}
                  <th className="bg-slate-700 text-slate-300 font-black text-[9px] md:text-[10px] p-1.5 md:p-2 border border-slate-600 min-w-[50px] hidden md:table-cell shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                    <div className="mb-1 text-center whitespace-nowrap">R WIND</div>
                    <div className="flex flex-col mt-1 text-[7px] md:text-[8px] text-slate-400 text-center font-normal border-t border-slate-600 pt-1 w-full gap-[1px]">
                      <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter">T/O</div>
                      <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter">L/D</div>
                      <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter whitespace-nowrap">&ge;2700m</div>
                      <div className="h-[12px] flex items-center justify-center leading-none tracking-tighter whitespace-nowrap">&lt;2700m</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => {
                  const bgClass = row.isTailwind ? 'bg-rose-950/20' : (idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60');
                  const isRowHighlighted = selectedCell.row === idx;
                  return (
                    <tr key={idx} className={`transition-colors hover:bg-slate-600/50 ${isRowHighlighted ? 'bg-sky-900/60' : bgClass}`}>
                      <td className={`font-black text-[10px] md:text-xs p-1.5 md:p-2 border border-slate-600 transition-colors cursor-pointer ${isRowHighlighted ? 'bg-sky-800 text-white' : 'bg-slate-700/90 text-sky-300'}`} onClick={() => setSelectedCell(prev => ({ row: prev.row === idx ? null : idx, col: prev.col }))}>{row.leftWindStr}</td>
                      {activeCols.map((col, cIdx) => {
                        const cellVal = row.vals[col.val] || '-'; const isUnderlined = typeof cellVal === 'string' && cellVal.startsWith('_') && cellVal.endsWith('_'); const displayVal = isUnderlined ? cellVal.replace(/_/g, '') : cellVal;
                        const isColHighlighted = selectedCell.col === cIdx; const isTargetCell = isRowHighlighted && isColHighlighted; let cellBg = isCopMode && col.isCopHalf ? 'bg-sky-900/10' : '';
                        if (isTargetCell) cellBg = 'bg-sky-500/60 ring-inset ring-1 ring-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.5)] z-0 relative'; else if (isRowHighlighted || isColHighlighted) cellBg = 'bg-sky-800/40';
                        return (
                          <td key={cIdx} onClick={() => { if (selectedCell.row === idx && selectedCell.col === cIdx) { setSelectedCell({ row: null, col: null }); } else { setSelectedCell({ row: idx, col: cIdx }); } }} className={`text-white font-black text-[10px] md:text-xs p-1.5 md:p-2 border border-slate-600 transition-all cursor-pointer hover:bg-sky-700/50 ${cellBg}`}><span className={isUnderlined ? 'underline underline-offset-4 decoration-2 decoration-amber-500 text-amber-100' : ''}>{displayVal}</span></td>
                        );
                      })}
                      <td className={`font-black text-[10px] md:text-xs p-1.5 md:p-2 border border-slate-600 hidden md:table-cell transition-colors cursor-pointer ${isRowHighlighted ? 'bg-sky-800 text-white' : 'bg-slate-700/90 text-emerald-300'}`} onClick={() => setSelectedCell(prev => ({ row: prev.row === idx ? null : idx, col: prev.col }))}>{row.rightWindStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-wrap justify-center gap-4 mt-3 text-[10px] font-bold text-slate-400">
              <div className="flex items-center gap-1"><span className="text-amber-100 underline underline-offset-4 decoration-2 decoration-amber-500">15</span> = Tail Wind Limit</div>
            </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// [6] MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const tabs = ['DASHBOARD', 'TFC INFO', 'WX/MNM', 'DOCS', 'スマカタ', 'REST CALC', 'APP CALC', 'BUDDY COMM', 'XWIND'];
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false); const [flightId, setFlightId] = useState(""); const [isWifiModalOpen, setIsWifiModalOpen] = useState(false); const [isDrmModalOpen, setIsDrmModalOpen] = useState(false); const [isSmartCatModalOpen, setIsSmartCatModalOpen] = useState(false);
  const [restFlightHours3, setRestFlightHours3] = useState(8); const [restFlightMins3, setRestFlightMins3] = useState(0); const [restFlightHours4, setRestFlightHours4] = useState(12); const [restFlightMins4, setRestFlightMins4] = useState(0);
  const [stdHours, setStdHours] = useState(10); const [stdMins, setStdMins] = useState(0);
  const [isTakeoffAuto, setIsTakeoffAuto] = useState(true); const [taxiOutMins, setTaxiOutMins] = useState(20); const [restTakeoffHours, setRestTakeoffHours] = useState(10); const [restTakeoffMins, setRestTakeoffMins] = useState(20);
  const [restOffsetMins, setRestOffsetMins] = useState(0); const [restLandingOffsetMins, setRestLandingOffsetMins] = useState(0); const [restCrewSize, setRestCrewSize] = useState(3); const [restFirstRestMins, setRestFirstRestMins] = useState(60); const [restLastRestMins, setRestLastRestMins] = useState(60); const [restFirstHalfMins, setRestFirstHalfMins] = useState(0);

  useEffect(() => {
    if (isTakeoffAuto) { const totalMins = stdHours * 60 + stdMins + taxiOutMins; setRestTakeoffHours(Math.floor(totalMins / 60) % 24); setRestTakeoffMins(totalMins % 60); }
  }, [stdHours, stdMins, isTakeoffAuto, taxiOutMins]);

  const [selectedDep, setSelectedDep] = useState(""); const [selectedArr, setSelectedArr] = useState(""); const [selectedFlightId, setSelectedFlightId] = useState(""); const [selectedAirlineCode, setSelectedAirlineCode] = useState(""); const [selectedAirline, setSelectedAirline] = useState(""); const [selectedCallsign, setSelectedCallsign] = useState(""); const [trafficTimeRange, setTrafficTimeRange] = useState(30); const [depTrafficMode, setDepTrafficMode] = useState("DEP"); const [arrTrafficMode, setArrTrafficMode] = useState("OFF");
  const [state, setState] = useState({ selectedReg: "", selectedType: "777-200", isaDev: 0, cruiseAltitude: 30000, landingCondition: "Normal", selectedRwyCond: "6-DRY", windComponent: 0, appSpeedAdditive: 5, pressureAlt: 0, rwSlope: 0, reverserConfig: "Both", factConfig: "1.00", aiConfig: "OFF", cruiseWeight: 400000, landingWeight: 400000, ptowOrig: null, pldwOrig: null, toElevOrig: null, ldElevOrig: null });
  const [cruiseWtInputText, setCruiseWtInputText] = useState(formatWeightDisplay(state.cruiseWeight)); const [ldgWtInputText, setLdgWtInputText] = useState(formatWeightDisplay(state.landingWeight));
  useEffect(() => { setCruiseWtInputText(formatWeightDisplay(state.cruiseWeight)); }, [state.cruiseWeight]); useEffect(() => { setLdgWtInputText(formatWeightDisplay(state.landingWeight)); }, [state.landingWeight]);
  
  const updateState = (key, value) => { 
    setState(prev => { 
      const next = { ...prev, [key]: value }; 
      if (key === 'landingCondition') { 
        if (value === '1 ENG INOP') {
          if (prev.ptowOrig) next.landingWeight = prev.ptowOrig;
          if (prev.toElevOrig !== null) next.pressureAlt = prev.toElevOrig;
          next.reverserConfig = 'One'; // ENG INOP時にONE REVへ自動変更
        } else if (value === 'Normal') {
          if (prev.pldwOrig) next.landingWeight = prev.pldwOrig; 
          if (prev.ldElevOrig !== null) next.pressureAlt = prev.ldElevOrig;
        }
      } 
      return next; 
    }); 
  };
  const handleRegChange = (reg) => { const ac = aircraftRegistrationList.find(a => a.reg === reg); if (ac) setState(prev => ({ ...prev, selectedReg: reg, selectedType: ac.type, cruiseWeight: defaultCruiseWeights[ac.type], landingWeight: defaultLandingWeights[ac.type], landingCondition: "Normal" })); else setState(prev => ({ ...prev, selectedReg: reg })); };
  const setAircraftType = (type) => { setState(prev => ({ ...prev, selectedReg: "", selectedType: type, cruiseWeight: defaultCruiseWeights[type], landingWeight: defaultLandingWeights[type], landingCondition: "Normal" })); };

  const handleApplyFlightPlan = (data) => {
    setState(prev => {
      const next = { ...prev };
      if (data.reg) { const ac = aircraftRegistrationList.find(a => a.reg === data.reg); if (ac) { next.selectedReg = data.reg; next.selectedType = ac.type; } else { next.selectedReg = data.reg; } }
      if (data.isa !== undefined) next.isaDev = data.isa;
      if (data.alt !== undefined) next.cruiseAltitude = data.alt;
      if (data.ptow !== undefined) { next.cruiseWeight = data.ptow * 1000; next.ptowOrig = data.ptow * 1000; }
      if (data.pldw !== undefined) { next.pldwOrig = data.pldw * 1000; }
      if (data.toElev !== undefined) { next.toElevOrig = Math.round(data.toElev / 100) * 100; }
      if (data.ldElev !== undefined) { next.ldElevOrig = Math.round(data.ldElev / 100) * 100; }
      
      if (data.ptow !== undefined || data.pldw !== undefined) { 
        if (prev.landingCondition === "1 ENG INOP" && data.ptow !== undefined) {
          next.landingWeight = data.ptow * 1000;
          if (data.toElev !== undefined) next.pressureAlt = Math.round(data.toElev / 100) * 100;
        } else if (data.pldw !== undefined) {
          next.landingWeight = data.pldw * 1000;
          if (data.ldElev !== undefined) next.pressureAlt = Math.round(data.ldElev / 100) * 100;
        }
      } else {
        if (data.ldElev !== undefined) next.pressureAlt = Math.round(data.ldElev / 100) * 100;
      }
      return next;
    });
    if (data.flightId) { setFlightId(data.flightId); setSelectedFlightId(data.flightId); setSelectedAirlineCode("NH"); setSelectedAirline("ANA"); setSelectedCallsign("ALL NIPPON"); }
    if (data.fltTimeH !== undefined) { setRestFlightHours3(data.fltTimeH); setRestFlightHours4(data.fltTimeH); setRestFlightMins3(data.fltTimeM); setRestFlightMins4(data.fltTimeM); }
    if (data.stdH !== undefined) { setStdHours(data.stdH); setStdMins(data.stdM); setIsTakeoffAuto(true); }
    if (data.avgTaxi !== undefined) setTaxiOutMins(data.avgTaxi); else setTaxiOutMins(20);
    window.dispatchEvent(new CustomEvent('show-toast', { detail: 'フライトデータをパフォーマンス計算と休憩計算に反映しました！' }));
  };

  const parsedFlightData = useMemo(() => {
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

  const computed = useMemo(() => {
    let engineStr = "GE"; if (state.selectedType === "777-200" || state.selectedType === "777-300") { engineStr = "PW"; } const isPW = engineStr === "PW";
    const mKey = typeof modelKeyMap !== 'undefined' ? modelKeyMap[state.selectedType] : '772'; const perfTable = typeof CRUISE_PERF_DATA !== 'undefined' ? CRUISE_PERF_DATA[mKey] : [[150, 41000, 43100, 0, 43100, 43100, 43100]];
    const minCruiseWeight = perfTable ? perfTable[0][0] * 1000 : 150000; const maxCruiseWeight = perfTable ? perfTable[perfTable.length - 1][0] * 1000 : 350000; const clampedCruiseWeight = Math.max(minCruiseWeight, Math.min(state.cruiseWeight, maxCruiseWeight));
    
    let maxAvailableLdgWt = 800000; let landingMinWeight = 280000;
    if (mKey === "772") { maxAvailableLdgWt = 540000; landingMinWeight = 360000; } else if (mKey === "773") { maxAvailableLdgWt = 550000; landingMinWeight = 420000; } else if (mKey === "77W") { maxAvailableLdgWt = 800000; landingMinWeight = 460000; } else if (mKey === "77F") { maxAvailableLdgWt = 780000; landingMinWeight = 440000; }
    const clampedLandingWeight = Math.max(landingMinWeight, Math.min(state.landingWeight, maxAvailableLdgWt));
    const isEngInop = state.landingCondition === "1 ENG INOP"; const appAdd = state.appSpeedAdditive;
    const wt1000 = clampedCruiseWeight / 1000; const optAltRaw = interpolateObjArray(wt1000, perfTable, 1) || 30000; const buf13Raw = interpolateObjArray(wt1000, perfTable, 2) || 40000; const isa10Raw = interpolateObjArray(wt1000, perfTable, 4) || 41000; const isa15Raw = interpolateObjArray(wt1000, perfTable, 5) || 40000; const isa20Raw = interpolateObjArray(wt1000, perfTable, 6) || 39000;

    const optAlt = Math.round(optAltRaw); let thrustLimit;
    if (state.isaDev <= 10) thrustLimit = isa10Raw; else if (state.isaDev <= 15) thrustLimit = isa10Raw + (isa15Raw - isa10Raw) * ((state.isaDev - 10) / 5); else if (state.isaDev <= 20) thrustLimit = isa15Raw + (isa20Raw - isa15Raw) * ((state.isaDev - 15) / 5); else thrustLimit = isa20Raw + (isa20Raw - isa15Raw) * ((state.isaDev - 20) / 5);
    thrustLimit = Math.round(thrustLimit); const buf13 = Math.round(buf13Raw); const maxAlt = Math.min(buf13, thrustLimit); const limitReason = maxAlt >= 43100 ? "Structural Limit" : (thrustLimit < buf13 ? "Thrust Limit" : "Maneuver Margin");

    let mmo = (mKey === "772" || mKey === "773") ? 0.87 : 0.89, vmo = mKey === "77W" || mKey === "77F" ? Math.min(350, Math.round(330 + (state.cruiseAltitude / 30000) * 20)) : 330;
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
      if (f25Data && wt1000Ldg <= f25Data[f25Data.length - 1][0]) { currentPchFlap25 = interpolateObjArray(wt1000Ldg, f25Data, 1); currentN1Flap25 = interpolateObjArray(wt1000Ldg, f25Data, 2); }
      if (f30Data && wt1000Ldg <= f30Data[f30Data.length - 1][0]) { currentPchFlap30 = interpolateObjArray(wt1000Ldg, f30Data, 1); currentN1Flap30 = interpolateObjArray(wt1000Ldg, f30Data, 2); }
    }
    const scaleFactor = state.factConfig === "1.15" ? 1.0 : (1.0 / 1.15); const activeFlaps = isEngInop ? ["F20", "F30"] : ["F25", "F30"];
    const getAomDistance = (flapTagLong, brakeMode) => {
      if (typeof LANDING_DIST_DATA_RAW === 'undefined') return null;
      const tCat = isEngInop ? (flapTagLong === "FLAP 20" ? "inop_f20" : "inop_f30") : (flapTagLong === "FLAP 25" ? "f25" : "f30");
      const dbKey = tCat + "_" + (state.selectedRwyCond === "5-WET" ? "wet" : "dry");
      const aomData = LANDING_DIST_DATA_RAW[mKey]?.[dbKey];
      if (!aomData) return null;
      
      const bIdx = { "man": 1, "max": 2, "a4": 3, "a3": 4, "a2": 5, "a1": 6 }[brakeMode] || 2;
      const wt1000 = clampedLandingWeight / 1000;
      let baseDist = interpolateObjArray(wt1000, aomData.dist, bIdx);
      if (baseDist == null) return null;

      let adj = aomData.adj;
      if (adj && adj.threshold) { adj = wt1000 <= adj.threshold ? adj.light : adj.heavy; }

      let correctedDist = baseDist;
      if (adj) {
        if (state.appSpeedAdditive > 0 && adj.app) correctedDist += (state.appSpeedAdditive / 5) * adj.app;
        if (state.pressureAlt > 0 && adj.alt) correctedDist += (state.pressureAlt / 1000) * adj.alt;
        if (state.rwSlope !== 0 && adj.slp) correctedDist += state.rwSlope * adj.slp;
        if (state.windComponent !== 0 && adj.tw) { correctedDist += state.windComponent > 0 ? (state.windComponent / 5) * adj.tw : (state.windComponent / 10) * adj.tw; }
        if (state.reverserConfig === "None" && adj.nr) correctedDist += (adj.nr[bIdx - 1] || 0);
        else if (state.reverserConfig === "One" && adj.or) correctedDist += (adj.or[bIdx - 1] || 0);
      }

      return Math.round(correctedDist * scaleFactor);
    };
    
    const washoutText = (mKey === "77W" || mKey === "77F") ? "10,000-30,000FT" : "10,000-12,000FT";
    const etops = mKey === "77F" ? "424NM" : "423NM";
    const toSetting = isPW ? "1.05EPR" : "55%N1";
    const oxy = mKey === "77F" ? "1210" : "DMS 860 / INT LONG 1050 / INT SHORT 860";
    const engOil = "ABV 18";
    const brakeTemp = isPW ? "3.0" : "2.0";
    const dgExp = "250kg(550lbs)";
    const dgIso = mKey === "77F" ? "200単位 50単位/ULD" : "32単位 8単位/ULD";
    let dgDry = "800kg"; if (mKey === "772") dgDry = "600kg"; if (mKey === "77F") dgDry = "2,300kg(LOWER 500kg)";

    return { engine: engineStr, minCruiseWeight, maxCruiseWeight, clampedCruiseWeight, landingMinWeight, maxAvailableLdgWt, clampedLandingWeight, optAlt, maxAlt, limitReason, vmo, mmo, flapUpManeuver, holdSpdJsx, minSpdTypeJsx, spdUnit, minSpdBorderClass, minSpdIconClass, holdSpdLabelWt: Math.round(clampedCruiseWeight / 1000) + "K", holdSpdLabelAlt: formatNum(state.cruiseAltitude) + "FT", windText: state.windComponent === 0 ? "0" : state.windComponent > 0 ? `T+${state.windComponent}` : `H${Math.abs(state.windComponent)}`, slopeText: state.rwSlope === 0 ? "0" : state.rwSlope > 0 ? `D+${state.rwSlope}` : `U${Math.abs(state.rwSlope)}`, activeFlaps, n1F1: isEngInop ? "N/A" : (currentN1Flap25 !== null ? currentN1Flap25.toFixed(1) : "N/A"), n1F2: isEngInop ? "N/A" : (currentN1Flap30 !== null ? currentN1Flap30.toFixed(1) : "N/A"), pchF1: isEngInop ? "N/A" : (currentPchFlap25 !== null ? `P:${currentPchFlap25.toFixed(1)}` : "N/A"), pchF2: isEngInop ? "N/A" : (currentPchFlap30 !== null ? `P:${currentPchFlap30.toFixed(1)}` : "N/A"), distMax1: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "max"), distMax2: getAomDistance("FLAP 30", "max"), distAb41: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a4"), distAb42: getAomDistance("FLAP 30", "a4"), distAb31: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a3"), distAb32: getAomDistance("FLAP 30", "a3"), distAb21: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a2"), distAb22: getAomDistance("FLAP 30", "a2"), distAb11: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a1"), distAb12: getAomDistance("FLAP 30", "a1"), distMan1: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "man"), distMan2: getAomDistance("FLAP 30", "man"), penaltyF25: "TW+1000", penaltyF30: "TW+1000", taxiFuelRate: (mKey === "77W" || mKey === "77F") ? 72 : 57, dim: typeof AIRCRAFT_DIMENSIONS !== 'undefined' ? AIRCRAFT_DIMENSIONS[mKey] : {}, configText: mKey === "77F" ? "Freighter" : (typeof SEAT_DATA !== 'undefined' && SEAT_DATA[mKey] ? `${SEAT_DATA[mKey][0].classes} (Total: ${SEAT_DATA[mKey][0].total})` : "N/A"), washout: washoutText, etops, toSetting, oxy, engOil, brakeTemp, dgExp, dgIso, dgDry };
  }, [state]);

  return (
    <div className="min-h-screen bg-[#05070a] text-[#cbd5e1] pb-2 p-1 sm:p-2 space-y-1 font-sans flex flex-col relative overflow-hidden">
      <Toast />
      <PasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} onApply={handleApplyFlightPlan} />
      <WifiPwdModal isOpen={isWifiModalOpen} onClose={() => setIsWifiModalOpen(false)} />
      <DrmModal isOpen={isDrmModalOpen} onClose={() => setIsDrmModalOpen(false)} initialFlightNo={flightId} />
      <SmartCatModal isOpen={isSmartCatModalOpen} onClose={() => setIsSmartCatModalOpen(false)} />

      <div className="flex flex-col gap-1 w-full flex-none mb-1">
        <div className="flex justify-between items-end px-1 pt-1 pb-0.5 border-b-2 border-slate-700/80">
          <div className="flex items-center gap-1.5 text-blue-400 font-black tracking-tighter text-[11px] sm:text-sm">
            <SafeIcon name="Plane" className="w-4 h-4" /> 7PT B777 PERFORMANCE TOOL
            {flightId && <span className="ml-1 text-slate-300 font-mono text-[9px] border border-slate-600 px-1 rounded bg-slate-800 tracking-normal font-bold">ANA{flightId}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center mb-0.5 gap-1">
              <WifiButton type="INT" url="http://info.ana.co.jp/" label="INT" hoverClass="hover:bg-sky-600" colorClass="text-sky-400 border-sky-500/50" onLongPress={() => setIsWifiModalOpen(true)} />
              <WifiButton type="DOM" url="http://www.ana.co.jp/wifi" label="DOM" hoverClass="hover:bg-emerald-600" colorClass="text-emerald-400 border-emerald-500/50" onLongPress={() => { }} />

              <button onClick={() => setIsPasteModalOpen(true)} className="bg-slate-700 hover:bg-emerald-600 text-emerald-400 hover:text-white px-1 py-0.5 md:px-1.5 md:py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 hover:border-emerald-400 shadow-sm" title="PDF/TXT 読込">
                <SafeIcon name="ClipboardPaste" className="w-2.5 h-2.5 md:w-3 md:h-3 pointer-events-none" />
                <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">LOAD</span>
              </button>

              <button onClick={() => { if (!state.selectedReg || state.selectedReg === "N/A" || state.selectedReg === "") { window.dispatchEvent(new CustomEvent('show-toast', { detail: '機番を選択してください' })); return; } const buddycomUrl = typeof BUDDYCOM_LINKS !== 'undefined' ? BUDDYCOM_LINKS[state.selectedReg] : null; if (buddycomUrl) { const pastedFlightName = flightId ? `ANA${flightId}` : ""; if (pastedFlightName) { copyToClipboard(pastedFlightName); window.dispatchEvent(new CustomEvent('show-toast', { detail: `便名(${pastedFlightName})をコピーして起動しました` })); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Buddycomを起動しました' })); } setTimeout(() => { window.open(buddycomUrl, '_blank'); }, 1000); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'この機番のBuddycomリンクは未登録です' })); } }} className={`px-1 py-0.5 md:px-1.5 md:py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border shadow-sm ${state.selectedReg && state.selectedReg !== "N/A" && state.selectedReg !== "" ? 'bg-slate-700 hover:bg-orange-600 text-orange-400 hover:text-white border-slate-500 hover:border-orange-400' : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}`} title="Buddycomを開く"><SafeIcon name="Radio" className="w-2.5 h-2.5 md:w-3 md:h-3 pointer-events-none" /><span className="text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">BDYC</span></button>
              <button onClick={() => setIsDrmModalOpen(true)} className="px-1 py-0.5 md:px-1.5 md:py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border shadow-sm bg-slate-800 text-rose-300 border-slate-600 hover:border-rose-400 hover:bg-slate-700 hover:text-white" title="DRM報告"><SafeIcon name="Send" className="w-2.5 h-2.5 md:w-3 md:h-3 pointer-events-none" /><span className="text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">DRM</span></button>
              <button onClick={() => { let flightQuery = ""; if (flightId) { flightQuery = `NH${flightId}`; } else if (selectedFlightId && selectedFlightId !== "N/A" && selectedFlightId !== "") { if (selectedAirlineCode && selectedAirlineCode !== "N/A" && selectedAirlineCode !== "") { flightQuery = `${selectedAirlineCode}${selectedFlightId}`; } else { flightQuery = `NH${selectedFlightId}`; } } if (flightQuery) { copyToClipboard(flightQuery); window.dispatchEvent(new CustomEvent('show-toast', { detail: `便名(${flightQuery})をコピーしました。検索窓にペーストしてください` })); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'FR24アプリを起動します' })); } setTimeout(() => { window.open('https://www.flightradar24.com', '_blank'); }, 1000); }} className="bg-slate-700 hover:bg-yellow-600 text-yellow-400 hover:text-white px-1 py-0.5 md:px-1.5 md:py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 hover:border-yellow-400 shadow-sm" title="Flight Radar 24を開く"><SafeIcon name="Radar" className="w-2.5 h-2.5 md:w-3 md:h-3 pointer-events-none" /><span className="text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">FR24</span></button>
            </div>
            <div className="text-[10px] sm:text-xs font-black text-slate-300 tracking-widest bg-slate-800 px-2 py-0.5 rounded-t-md border border-slate-700 border-b-0">{activeTab}</div>
          </div>
        </div>
        <div className="flex gap-1 px-0.5 pb-1 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => {
            if (tab === 'スマカタ') {
              return (
                <button key={tab} onClick={() => setIsSmartCatModalOpen(true)} className="px-3 py-1.5 text-[9px] sm:text-[10px] font-bold rounded-md whitespace-nowrap transition-all shadow-sm bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50 flex items-center gap-1">
                  <SafeIcon name="BookOpen" className="w-3 h-3" /> スマカタ
                </button>
              );
            }
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 text-[9px] sm:text-[10px] font-bold rounded-md whitespace-nowrap transition-all shadow-sm flex items-center gap-1 ${activeTab === tab ? "bg-amber-600 text-white shadow-amber-900/50 scale-[1.02]" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50"}`}>
                {tab === 'XWIND' && <SafeIcon name="Wind" className="w-3 h-3" />}
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'DASHBOARD' && (
        <div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">
          {typeof DashboardView !== 'undefined' && (
            <DashboardView state={state} updateState={updateState} computed={computed} aircraftRegistrationList={typeof aircraftRegistrationList !== 'undefined' ? aircraftRegistrationList : []} handleRegChange={handleRegChange} setAircraftType={setAircraftType} cruiseWtInputText={cruiseWtInputText} setCruiseWtInputText={setCruiseWtInputText} ldgWtInputText={ldgWtInputText} setLdgWtInputText={setLdgWtInputText} />
          )}
        </div>
      )}
      {activeTab === 'TFC INFO' && (<div className="flex flex-col gap-1 w-full flex-1 h-full">{typeof FltInfoView !== 'undefined' && <FltInfoView p={fltInfoProps} />}</div>)}
      {activeTab === 'WX/MNM' && (<div className="flex flex-col gap-1 w-full flex-1 h-full">{typeof WxMnmReference !== 'undefined' && <WxMnmReference />}</div>)}
      {activeTab === 'DOCS' && (<div className="flex flex-col gap-1 w-full flex-1 h-full">{typeof Docs2View !== 'undefined' && <Docs2View />}</div>)}
      {activeTab === 'REST CALC' && (<div className="flex flex-col gap-1 w-full flex-1 h-full">
        {typeof RestView !== 'undefined' && <RestView
        flightHours={restCrewSize === 3 ? restFlightHours3 : restFlightHours4} setFlightHours={restCrewSize === 3 ? setRestFlightHours3 : setRestFlightHours4}
        flightMins={restCrewSize === 3 ? restFlightMins3 : restFlightMins4} setFlightMins={restCrewSize === 3 ? setRestFlightMins3 : setRestFlightMins4}
        stdHours={stdHours} setStdHours={setStdHours}
        stdMins={stdMins} setStdMins={setStdMins}
        isTakeoffAuto={isTakeoffAuto} setIsTakeoffAuto={setIsTakeoffAuto}
        takeoffHours={restTakeoffHours} setTakeoffHours={setRestTakeoffHours}
        takeoffMins={restTakeoffMins} setTakeoffMins={setRestTakeoffMins}
        offsetMins={restOffsetMins} setOffsetMins={setRestOffsetMins}
        landingOffsetMins={restLandingOffsetMins} setLandingOffsetMins={setRestLandingOffsetMins}
        crewSize={restCrewSize} setCrewSize={setRestCrewSize}
        firstRestMins={restFirstRestMins} setFirstRestMins={setRestFirstRestMins}
        lastRestMins={restLastRestMins} setLastRestMins={setRestLastRestMins}
        firstHalfMins={restFirstHalfMins} setFirstHalfMins={setRestFirstHalfMins}
        taxiOutMins={taxiOutMins} />}
      </div>)}
      {activeTab === 'BUDDY COMM' && (<div className="flex flex-col gap-1 w-full flex-1 h-full">{typeof BuddyCommView !== 'undefined' && <BuddyCommView p={{ aircraftRegistrationList: typeof aircraftRegistrationList !== 'undefined' ? aircraftRegistrationList : [], selectedReg: state.selectedReg, handleRegChange }} />}</div>)}
      {activeTab === 'APP CALC' && (<div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">{typeof ApproachCalcView !== 'undefined' && <ApproachCalcView />}</div>)}
      {activeTab === 'XWIND' && (<div className="flex flex-col gap-1 w-full flex-1 h-full mt-0.5">{typeof XwindView !== 'undefined' && <XwindView />}</div>)}
    </div>
  );
}