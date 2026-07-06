import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

// ★ コメントアウトを外して、内部にダウンロードしたファイルを直接読み込みます
import * as importedPdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.js?worker&inline';

importedPdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();
let localPdfjsLib = importedPdfjsLib; // ← null ではなく、読み込んだライブラリを代入


// --- [2-1] SafeIcon ---
export const SafeIcon = ({ name, ...props }) => {
  const Icon = LucideIcons[name];
  if (Icon) return <Icon {...props} />;
  return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);
};

// --- [2-2] DepTag ---
export const DepTag = ({ type }) => {
  const config = { wt: { iconName: 'Scale', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', label: 'WT' }, alt: { iconName: 'Gauge', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10', label: 'ALT' }, isa: { iconName: 'Thermometer', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', label: 'ISA' }, oat: { iconName: 'Thermometer', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', label: 'OAT' }, gs: { iconName: 'FastForward', color: 'text-slate-300 border-slate-500/30 bg-slate-500/10', label: 'GS' } }[type];
  if (!config) return null;
  return (<div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${config.color} text-[9px] font-black uppercase tracking-tighter shadow-sm shrink-0`}><SafeIcon name={config.iconName} className="w-3 h-3" />{config.label}</div>);
};

// --- [2-3] copyToClipboard, WifiButton & WifiPwdModal ---
export const copyToClipboard = (text) => {
  const el = document.createElement('textarea'); el.value = text; el.setAttribute('readonly', ''); el.style.position = 'absolute'; el.style.left = '-9999px';
  document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
};

export const WifiButton = ({ type, url, label, hoverClass, colorClass, onLongPress }) => {
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

export const WifiPwdModal = ({ isOpen, onClose }) => {
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
export const DrmModal = ({ isOpen, onClose, initialFlightNo }) => {
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
export const parseFlightPlanText = (text) => {
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
  
  // ★ ICAO FPL形式（-RJTT0055 と -EGLL1344）から出発地・目的地を確実に抽出
  const icaoMatches = [...text.matchAll(/-([A-Z]{4})\d{4}/g)];
  if (icaoMatches.length >= 2) {
    if (!depPort) depPort = icaoMatches[0][1];
    if (!arrPort) arrPort = icaoMatches[1][1];
  }
  
  // ETOPS用に目的地をdataオブジェクトに格納
  if (arrPort) {
    data.dest = arrPort.toUpperCase();
  }

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

// ★ ETOPS判定用：PDFテキストから経路部分をざっくり抽出
  let extractedRoute = "";
  
  // パターン1：ICAO FPLフォーマット (例: -N0503F290 INUBO ... -EGLL1344 のような場合)
  // 非常に特徴的な文字列で誤爆が少ないため、こちらを【最優先】で探します
  const icaoRouteMatch = text.match(/-(?:N\d{4}|M\d{3})[FSAM]\d{3}\s+([\s\S]+?)(?=\s*-[A-Z]{4}\d{4})/i);
  
  // パターン2：一般的なディスパッチフォーマット ("ROUTE" などの見出しがある場合)
  // 見出しの誤爆（要約ルートなど）が多いため、バックアップとして使います
  const releaseRouteMatch = text.match(/(?:ATC ROUTE|ROUTE|RTE)[\s:]*([\s\S]+?)(?:RTE RSVS|ALTN|AWY|FLT INFO|RMK|FIR|ATC|TIME|PLND|PROFIL|DISP|FUEL|$)/i);

  // ★ 優先順位の変更：ICAOフォーマットを最優先で評価する！
  if (icaoRouteMatch && icaoRouteMatch[1].length > 10) {
    extractedRoute = icaoRouteMatch[1];
  } else if (releaseRouteMatch && releaseRouteMatch[1].length > 10) {
    extractedRoute = releaseRouteMatch[1];
  }

  if (extractedRoute) {
    // 改行をスペースに変換し、連続する無駄なスペースも1つに圧縮する
    data.route = extractedRoute.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(); 
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

export const PasteModal = ({ isOpen, onClose, onApply }) => {
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
              {parsedData.route && renderBadge("ROUTE", parsedData.route.substring(0, 15) + "...", "text-violet-300 bg-violet-500/20 border-violet-500/40")}
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
export const SmartCatModal = ({ isOpen, onClose }) => {
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

// --- [2-8] Toast ---
export const Toast = () => {
  const [toastMsg, setToastMsg] = useState('');
  useEffect(() => { const handleToast = (e) => { setToastMsg(e.detail); setTimeout(() => setToastMsg(''), 3000); }; window.addEventListener('show-toast', handleToast); return () => window.removeEventListener('show-toast', handleToast); }, []);
  if (!toastMsg) return null;
  return (<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-800 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-full font-bold text-xs shadow-lg animate-in fade-in slide-in-from-top-4">{toastMsg}</div>);
};

//APP CALC描画用COMPONENT
// ==========================================
// --- [2-9] SliderInput (APP CALC) ---
// ==========================================
export const SliderInput = ({ label, subLabel, value, setter, min, max, step, colorClass, accentClass, rightAddon }) => {
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
export const TrafficPatternGraphic = ({ drawDataLT, drawDataRT, drawDataDB }) => {
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
            <rect x={-28} y={-11} width={56} height={22} fill="#0f172a" rx={4} stroke={isRightTraffic ? "#059669" : "#4f46e5"} strokeWidth={1.5} opacity={0.9} />
            <text x={0} y={4} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{alt}'</text>
          </g>
        </g>
      );
    };

    return (
      <g transform={`translate(${offsetX}, 0)`}>
        <g>
          <g transform={`translate(0, ${-(patternWidth + 0.6) * scale})`}>
            <line x1={0} y1={0} x2={dirX * -thrToBaseDist * scale} y2={0} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6} />
            <line x1={0} y1={-5} x2={0} y2={5} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6} />
            <line x1={dirX * -thrToBaseDist * scale} y1={-5} x2={dirX * -thrToBaseDist * scale} y2={5} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6} />
            <rect x={dirX * (-thrToBaseDist / 2 * scale) - 60} y={-10} width={120} height={20} fill="#0f172a" rx={4} />
            <text x={dirX * (-thrToBaseDist / 2 * scale)} y={3} fill={isRightTraffic ? "#6ee7b7" : "#cbd5e1"} fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
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

          <line x1={baseTurnPoints[baseTurnPoints.length - 1].x} y1={baseTurnPoints[baseTurnPoints.length - 1].y} x2={ptBaseStart.x} y2={ptBaseStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />
          <line x1={ptBaseStart.x} y1={ptBaseStart.y} x2={ptBaseEnd.x} y2={ptBaseEnd.y} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} />
          <line x1={ptBaseEnd.x} y1={ptBaseEnd.y} x2={ptFinalTurnStart.x} y2={ptFinalTurnStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />

          {finalTurnPoints && <polyline points={finalTurnPoints.map(p => `${p.x},${p.y}`).join(' ')} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} fill="none" strokeLinejoin="round" />}

          <line x1={finalTurnPoints[finalTurnPoints.length - 1].x} y1={finalTurnPoints[finalTurnPoints.length - 1].y} x2={ptFinalStart.x} y2={ptFinalStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />
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
            <rect x={-36} y={-16} width={72} height={32} fill="#0f172a" rx={4} stroke="#c084fc" strokeWidth={1.5} opacity={0.9} />
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
            <rect x={-24} y={-9} width={48} height={18} fill="#0f172a" rx={3} stroke="#64748b" strokeWidth={1} opacity={0.9} />
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

export const CirclingPatternGraphic = ({ drawDataLT, drawDataRT, dwTime }) => {
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
            <rect x={-28} y={-11} width={56} height={22} fill="#0f172a" rx={4} stroke={isRightTraffic ? "#059669" : "#4f46e5"} strokeWidth={1.5} opacity={0.9} />
            <text x={0} y={4} fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{alt}'</text>
          </g>
        </g>
      );
    };

    return (
      <g transform={`translate(${offsetX}, 0)`}>
        <g>
          <g transform={`translate(0, ${-(patternWidth + 0.6) * scale})`}>
            <line x1={0} y1={0} x2={dirX * -(distDW + distTransIn + turnDX) * scale} y2={0} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6} />
            <line x1={0} y1={-5} x2={0} y2={5} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6} />
            <line x1={dirX * -(distDW + distTransIn + turnDX) * scale} y1={-5} x2={dirX * -(distDW + distTransIn + turnDX) * scale} y2={5} stroke={isRightTraffic ? "#34d399" : "#94a3b8"} strokeWidth={1.5} opacity={0.6} />

            <rect x={dirX * (-(distDW + distTransIn + turnDX) / 2) * scale - 60} y={-10} width={120} height={20} fill="#0f172a" rx={4} />
            <text x={dirX * (-(distDW + distTransIn + turnDX) / 2) * scale} y={3} fill={isRightTraffic ? "#6ee7b7" : "#cbd5e1"} fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="1">
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

          {turnPoints && <polyline points={turnPoints.map(p => `${p.x},${p.y}`).join(' ')} stroke={isRightTraffic ? "#34d399" : "#38bdf8"} strokeWidth={0.04} fill="none" strokeLinejoin="round" />}

          <line x1={turnPoints[turnPoints.length - 1].x} y1={turnPoints[turnPoints.length - 1].y} x2={ptFinalStart.x} y2={ptFinalStart.y} stroke={isRightTraffic ? "#059669" : "#818cf8"} strokeWidth={0.04} strokeDasharray="0.05 0.05" />
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