import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

// ==========================================
// [1] SETTINGS & IMPORTS
// ==========================================
let localPdfjsLib = null;

// ==========================================
// [2] COMMON COMPONENTS
// ==========================================
const SafeIcon = ({ name, ...props }) => {
    const Icon = LucideIcons[name];
    if (Icon) return <Icon {...props} />;
    return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);
};

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
                <input type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="パスワードを入力" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-sky-400 mt-2" />
                <div className="flex gap-2 w-full mt-2"><button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-colors">キャンセル</button><button onClick={handleSave} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl transition-colors">保存</button></div>
            </div>
        </div>
    );
};

const DrmModal = ({ isOpen, onClose, initialFlightNo }) => {
    const [flightNo, setFlightNo] = useState(''); const [flightDate, setFlightDate] = useState('');
    useEffect(() => { if (isOpen) { setFlightNo(initialFlightNo || ''); const d = new Date(); const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]; setFlightDate(`${String(d.getDate()).padStart(2, '0')}${months[d.getMonth()]}`); } }, [isOpen, initialFlightNo]);
    const handleSubmit = () => {
        const email = "ml_notice_drm@ana.co.jp", fNo = flightNo ? `ANA${flightNo}` : "ANA", fDate = flightDate || "", subject = encodeURIComponent(fDate ? `${fNo}/${fDate}` : fNo);
        window.location.href = `googlegmail:///co?to=${email}&subject=${subject}`;
        setTimeout(() => { window.location.href = `mailto:${email}?subject=${subject}`; }, 2000);
        onClose();
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 border border-slate-600 rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-sm w-full">
                <SafeIcon name="Send" className="w-12 h-12 text-rose-400" /><h2 className="text-lg font-black text-white">DRM 報告</h2>
                <div className="w-full flex flex-col gap-3 mt-2">
                    <input type="number" value={flightNo} onChange={(e) => setFlightNo(e.target.value.slice(0, 4))} placeholder="便名 (1〜4桁)" className="w-full bg-slate-900 px-3 py-2.5 text-white font-mono text-center border border-slate-600 rounded focus:outline-none focus:border-rose-400" />
                    <input type="text" value={flightDate} onChange={(e) => setFlightDate(e.target.value.toUpperCase())} placeholder="日付 (例: 18JUN)" className="w-full bg-slate-900 px-3 py-2.5 text-white font-mono text-center border border-slate-600 rounded focus:outline-none focus:border-sky-400 uppercase" />
                </div>
                <div className="flex gap-2 w-full mt-2"><button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl">キャンセル</button><button onClick={handleSubmit} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl">メール起動</button></div>
            </div>
        </div>
    );
};

const parseFlightPlanText = (text) => {
    if (!text) return null; let data = {};
    const regMatch = text.match(/REG\/(JA[A-Z0-9]+)/) || text.match(/(JA\d{2,4}[A-Z]?)/); if (regMatch) data.reg = regMatch[1];
    const fltMatch = text.match(/ANA(\d{1,4})/); if (fltMatch) data.flightId = parseInt(fltMatch[1], 10).toString();
    const ptowMatch = text.match(/PTOW\s*([\d,]+)/); if (ptowMatch) data.ptow = Math.round(parseInt(ptowMatch[1].replace(/,/g, ''), 10) / 1000);
    const pldwMatch = text.match(/PLDW\s*([\d,]+)/); if (pldwMatch) data.pldw = Math.round(parseInt(pldwMatch[1].replace(/,/g, ''), 10) / 1000);
    const altMatch = text.match(/N\d{4}F(\d{3})/); if (altMatch) data.alt = parseInt(altMatch[1], 10) * 100;
    return Object.keys(data).length > 0 ? data : null;
};

const PasteModal = ({ isOpen, onClose, onApply }) => {
    const [text, setText] = useState(''); const [parsedData, setParsedData] = useState(null);
    useEffect(() => { if (isOpen) { setText(''); setParsedData(null); } }, [isOpen]);
    useEffect(() => { setParsedData(parseFlightPlanText(text)); }, [text]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 border border-slate-600 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 max-w-lg w-full">
                <h2 className="text-lg font-black text-white flex items-center gap-2"><SafeIcon name="ClipboardPaste" className="w-6 h-6 text-emerald-400" /> フライトプラン解析</h2>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="フライトプランのテキストをペースト..." className="w-full h-24 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-400 resize-none" />
                <div className="flex gap-2 w-full mt-2">
                    <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl">キャンセル</button>
                    <button onClick={() => { onApply(parsedData); onClose(); }} disabled={!parsedData} className={`flex-1 font-bold py-2 rounded-xl transition-all ${parsedData ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'}`}>データを反映</button>
                </div>
            </div>
        </div>
    );
};

const Toast = () => {
    const [toastMsg, setToastMsg] = useState('');
    useEffect(() => { const handleToast = (e) => { setToastMsg(e.detail); setTimeout(() => setToastMsg(''), 3000); }; window.addEventListener('show-toast', handleToast); return () => window.removeEventListener('show-toast', handleToast); }, []);
    if (!toastMsg) return null;
    return (<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-800 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-full font-bold text-xs shadow-lg animate-in fade-in slide-in-from-top-4">{toastMsg}</div>);
};


// ==========================================
// [3] DATA SECTION (Dashboard Only)
// ==========================================
const aircraftRegistrationData = [
    { type: "777-200", engine: "PW4074/74D" },
    { type: "777-300", engine: "PW4090" },
    { type: "777-300ER", engine: "GE90-115BL" },
    { type: "777F", engine: "GE90-110B1L" }
];

const aircraftRegistrationList = [
    { reg: "JA713A", type: "777-200" }, { reg: "JA714A", type: "777-200" }, { reg: "JA715A", type: "777-200" }, { reg: "JA716A", type: "777-200" }, { reg: "JA717A", type: "777-200" },
    { reg: "JA741A", type: "777-200" }, { reg: "JA742A", type: "777-200" }, { reg: "JA743A", type: "777-200" }, { reg: "JA744A", type: "777-200" }, { reg: "JA745A", type: "777-200" },
    { reg: "JA751A", type: "777-300" }, { reg: "JA752A", type: "777-300" }, { reg: "JA753A", type: "777-300" }, { reg: "JA754A", type: "777-300" }, { reg: "JA755A", type: "777-300" },
    { reg: "JA784A", type: "777-300ER" }, { reg: "JA785A", type: "777-300ER" }, { reg: "JA787A", type: "777-300ER" }, { reg: "JA788A", type: "777-300ER" }, { reg: "JA790A", type: "777-300ER" },
    { reg: "JA791A", type: "777-300ER" }, { reg: "JA792A", type: "777-300ER" }, { reg: "JA793A", type: "777-300ER" }, { reg: "JA794A", type: "777-300ER" }, { reg: "JA795A", type: "777-300ER" },
    { reg: "JA796A", type: "777-300ER" }, { reg: "JA797A", type: "777-300ER" }, { reg: "JA798A", type: "777-300ER" }, { reg: "JA771F", type: "777F" }, { reg: "JA772F", type: "777F" }
];

const BUDDYCOM_LINKS = {
    "JA713A": "https://buddycom.net/b/14148/xPcqyZJY7DzWfLXND2r_tUc4PXRiUInw9LXvABc4w3zOWYx1bize1.JqTvux_RMxboc4b4z6pywLUsu_ZVQfHg"
    // ※コード短縮のため一部省略。実際の機能では元のリストをご使用ください
};

const defaultCruiseWeights = { "777-200": 400000, "777-300": 500000, "777-300ER": 760000, "777F": 760000 };
const defaultLandingWeights = { "777-200": 400000, "777-300": 500000, "777-300ER": 500000, "777F": 550000 };
const modelKeyMap = { "777-200": "772", "777-300": "773", "777-300ER": "77W", "777F": "77F" };
const AIRCRAFT_DIMENSIONS = { "772": { span: "199' 11\" (60.9m)", length: "209' 1\" (63.7m)", height: "60' 9\" (18.6m)" }, "773": { span: "199' 11\" (60.9m)", length: "242' 4\" (73.9m)", height: "61' 5\" (18.7m)" }, "77W": { span: "212' 7\" (64.8m)", length: "242' 4\" (73.9m)", height: "61' 5\" (18.7m)" }, "77F": { span: "212' 7\" (64.8m)", length: "209' 1\" (63.7m)", height: "61' 1\" (18.6m)" } };
const SEAT_DATA = { "772": [{ total: 405, classes: "C:21 Y:384" }], "773": [{ total: 514, classes: "C:21 Y:493" }], "77W": [{ total: 212, classes: "F:8 C:68 PY:24 Y:112" }], "77F": [{ total: 0, classes: "Freighter" }] };

const CRUISE_PERF_DATA = {
    "772": [[320, 43100, 43100, 43100, 43100, 43100, 43100], [360, 42300, 43100, 43100, 43100, 43000, 42100], [400, 40500, 43100, 42300, 42100, 41300, 40000], [440, 38700, 42900, 40500, 40400, 39600, 38000], [480, 37100, 41300, 38800, 38700, 37900, 36300], [520, 35200, 39600, 37100, 37000, 36200, 34800], [560, 33600, 38000, 35200, 35400, 34500, 33500]],
    "773": [[340, 43100, 43100, 43100, 43100, 43100, 43100], [400, 40100, 43100, 42200, 42600, 42100, 41400], [460, 37200, 42500, 39800, 40300, 39700, 38900], [540, 34200, 39400, 36600, 37200, 36600, 35600]],
    "77W": [[380, 42500, 43100, 42800, 43100, 43000, 40400], [460, 38800, 41700, 40400, 41400, 40100, 37600], [540, 36200, 39500, 37700, 39000, 37600, 34800], [620, 33500, 37400, 35100, 36600, 35200, 32000], [700, 30800, 35300, 32400, 34200, 32700, 29200], [780, 28000, 33100, 28800, 31800, 30200, 26400]],
    "77F": [[380, 43100, 43100, 43100, 43100, 43100, 40800], [460, 38700, 43100, 40000, 43100, 43100, 37100], [540, 36000, 41300, 37200, 40800, 40200, 34200], [620, 33500, 38500, 34800, 38000, 37400, 31800], [700, 30800, 36000, 32700, 35600, 35000, 29600], [780, 28500, 33600, 30700, 33100, 32300, 27600]]
};

const VREF_DATA = {
    "772": { vref30: [[280, 110], [400, 132], [540, 154]] },
    "773": { vref30: [[300, 114], [480, 145], [660, 171]] },
    "77W": { vref30: [[300, 113], [540, 152], [800, 184]] },
    "77F": { vref30: [[340, 137], [580, 151], [780, 184]] }
};

const HOLD_SPD_DATA_RAW = {
    "772": { weights: [320, 400, 560], alts: [1500, 10000, 20000], kias: [[195, 195, 195], [209, 209, 211], [239, 240, 280]] },
    "773": { weights: [340, 500, 660], alts: [1500, 10000, 20000], kias: [[199, 199, 199], [226, 227, 259], [259, 261, 306]] },
    "77W": { weights: [360, 560, 800], alts: [1500, 10000, 20000], kias: [[200, 200, 200], [231, 231, 263], [273, 276, 318]] },
    "77F": { weights: [340, 540, 780], alts: [1500, 10000, 20000], kias: [[217, 217, 217], [225, 225, 240], [263, 263, 309]] }
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

const TARGET_PITCH_N1_DATA_RAW = {
    "772": { f25: [[320, 2.3, 44.5], [360, 2.4, 46.7], [400, 2.5, 48.8], [440, 2.5, 50.8], [480, 2.6, 52.8], [520, 2.6, 54.7]], f30: [[320, 2.2, 48.1], [360, 2.2, 50.8], [400, 2.1, 53.4], [440, 2.1, 55.9], [480, 2.0, 58.3], [520, 2.0, 60.6]] },
    "773": { f25: [[360, 2.2, 47.0], [400, 2.2, 49.3], [440, 2.1, 51.6], [480, 2.1, 53.8], [520, 2.1, 55.9], [560, 2.0, 58.0]], f30: [[360, 1.8, 50.9], [400, 1.7, 53.5], [440, 1.6, 56.2], [480, 1.5, 58.8], [520, 1.5, 61.2], [560, 1.4, 63.5]] },
    "77W": { f25: [[400, 2.9, 46.4], [440, 2.8, 48.4], [480, 2.8, 50.4], [520, 2.8, 52.2], [560, 2.8, 53.9]], f30: [[400, 2.5, 50.1], [440, 2.5, 52.1], [480, 2.5, 54.2], [520, 2.4, 56.3], [560, 2.5, 58.1]] },
    "77F": { f25: [[300, 0.5, 50.1], [340, 1.1, 45.8], [380, 1.8, 46.1], [420, 3.0, 47.8], [460, 3.3, 49.8], [500, 3.3, 51.7], [540, 3.5, 53.3], [580, 3.4, 55.0]], f30: [[300, -0.4, 55.0], [340, 0.7, 52.5], [380, 0.9, 52.4], [420, 1.6, 52.7], [460, 2.9, 54.1], [500, 3.3, 56.0], [540, 3.4, 58.0], [580, 3.3, 59.9]] }
};

const LANDING_DIST_DATA_RAW = {
    "772": {
        f25_dry: { dist: [[460, 5600, 5600, 7000, 8100, 9300, 10100], [360, 4800, 4800, 5900, 6900, 7700, 8200]], adj: { tw: 1020, nr: [0, 0, 0, 0, 0, 0], app: 360, alt: 400, slp: 230 } },
        f25_wet: { dist: [[460, 6500, 6500, 7400, 8100, 9400, 10200], [360, 5500, 5500, 6400, 6900, 7800, 8300]], adj: { tw: 1020, nr: [480, 480, 0, 0, 0, 0], app: 360, alt: 400, slp: 230 } },
        f30_dry: { dist: [[460, 5400, 5400, 6800, 7800, 9000, 9800], [360, 4600, 4600, 5700, 6600, 7400, 7900]], adj: { tw: 1000, nr: [0, 0, 0, 0, 0, 0], app: 360, alt: 400, slp: 230 } },
        f30_wet: { dist: [[460, 6200, 6200, 7100, 7800, 9100, 9900], [360, 5300, 5300, 6100, 6600, 7500, 8000]], adj: { tw: 1000, nr: [480, 480, 0, 0, 0, 0], app: 360, alt: 400, slp: 230 } },
        inop_f20_dry: { dist: [[540, 6200, 6200, 8100, 8800, 9800, 10700], [380, 5200, 5200, 6500, 6800, 8000, 8500]], adj: { tw: 830, nr: [0, 0, 0, 0, 0, 100], app: 460, alt: 350, slp: 70 } },
        inop_f20_wet: { dist: [[540, 6900, 6900, 8100, 8800, 9800, 10700], [380, 5700, 5700, 6500, 6800, 8000, 8500]], adj: { tw: 830, nr: [430, 430, 70, 0, 0, 100], app: 460, alt: 350, slp: 130 } },
        inop_f30_dry: { dist: [[540, 5900, 5900, 8100, 8800, 9800, 10700], [380, 4900, 4900, 6300, 6600, 7700, 8300]], adj: { tw: 770, nr: [0, 0, 0, 0, 0, 90], app: 420, alt: 290, slp: 60 } },
        inop_f30_wet: { dist: [[540, 6500, 6500, 8100, 8800, 9800, 10700], [380, 5300, 5300, 6300, 6600, 7700, 8300]], adj: { tw: 770, nr: [320, 320, 60, 0, 0, 90], app: 420, alt: 290, slp: 120 } }
    },
    "773": {
        f25_dry: { dist: [[550, 6300, 6300, 7900, 9200, 10700, 11800], [440, 5500, 5500, 6700, 7700, 8800, 9400]], adj: { tw: 1090, nr: [0, 0, 0, 0, 0, 0], app: 400, alt: 470, slp: 260 } },
        f25_wet: { dist: [[550, 7400, 7400, 8400, 9400, 11000, 12000], [440, 6300, 6300, 7100, 7900, 9000, 9600]], adj: { tw: 1090, nr: [500, 500, 0, 0, 0, 0], app: 400, alt: 470, slp: 260 } },
        f30_dry: { dist: [[550, 6100, 6100, 7600, 8800, 10300, 11300], [440, 5300, 5300, 6400, 7400, 8400, 9000]], adj: { tw: 1070, nr: [0, 0, 0, 0, 0, 0], app: 410, alt: 430, slp: 230 } },
        f30_wet: { dist: [[550, 7100, 7100, 8100, 9000, 10600, 11500], [440, 6000, 6000, 6800, 7600, 8600, 9200]], adj: { tw: 1070, nr: [500, 500, 0, 0, 0, 0], app: 410, alt: 430, slp: 230 } },
        inop_f20_dry: { dist: [[550, 7100, 7100, 8900, 10700, 12100, 13300], [420, 6100, 6100, 7500, 8900, 9900, 10800]], adj: { tw: 1200, nr: [0, 0, 0, 0, 0, 140], app: 440, alt: 370, slp: 240 } },
        inop_f20_wet: { dist: [[550, 8000, 8000, 8900, 10700, 12100, 13300], [420, 6700, 6700, 7500, 8900, 9900, 10800]], adj: { tw: 1200, nr: [550, 550, 0, 0, 0, 140], app: 440, alt: 370, slp: 240 } },
        inop_f30_dry: { dist: [[550, 6400, 6400, 8300, 10400, 11500, 12500], [420, 5400, 5400, 6900, 8400, 9300, 10000]], adj: { tw: 1180, nr: [0, 0, 0, 0, 0, 140], app: 460, alt: 350, slp: 140 } },
        inop_f30_wet: { dist: [[550, 7100, 7100, 8300, 10400, 11500, 12500], [420, 6000, 6000, 6900, 8400, 9300, 10000]], adj: { tw: 1180, nr: [500, 500, 0, 0, 0, 140], app: 460, alt: 350, slp: 140 } }
    },
    "77W": {
        f25_dry: { dist: [[460, 5700, 5700, 7100, 8300, 9700, 10700], [800, 8200, 8200, 10900, 13000, 14400, null]], adj: { tw: 1130, nr: [0, 0, 0, 0, 0, 0], app: 410, alt: 490, slp: 350 } },
        f25_wet: { dist: [[460, 6700, 6700, 7700, 8600, 10200, 11100], [800, 8900, 8900, 10900, 13000, 14400, null]], adj: { tw: 1130, nr: [500, 500, 0, 0, 0, 0], app: 410, alt: 490, slp: 350 } },
        f30_dry: { dist: [[460, 5500, 5500, 6800, 8000, 9300, 10200], [800, 8100, 8100, 10700, 12800, 14100, null]], adj: { tw: 1110, nr: [0, 0, 0, 0, 0, 0], app: 390, alt: 450, slp: 320 } },
        f30_wet: { dist: [[460, 6500, 6500, 7400, 8300, 9800, 10600], [800, 8800, 8800, 10800, 12700, 14100, null]], adj: { tw: 1110, nr: [500, 500, 0, 0, 0, 0], app: 390, alt: 450, slp: 320 } },
        inop_f20_dry: { dist: [[460, 6400, 6400, 8200, 9700, 10900, 12200], [800, 9000, 9000, 11900, 14300, null, null]], adj: { tw: 1250, nr: [0, 0, 0, 0, 0, 140], app: 450, alt: 480, slp: 300 } },
        inop_f20_wet: { dist: [[460, 7000, 7000, 8200, 9700, 10900, 12200], [800, 10100, 10100, 12000, 14300, null, null]], adj: { tw: 1250, nr: [600, 600, 0, 0, 0, 140], app: 450, alt: 480, slp: 300 } },
        inop_f30_dry: { dist: [[460, 5500, 5500, 7000, 8100, 9100, 10100], [800, 8100, 8100, 10600, 12600, 14300, null]], adj: { tw: 1190, nr: [0, 0, 0, 0, 0, 280], app: 470, alt: 390, slp: 200 } },
        inop_f30_wet: { dist: [[460, 6100, 6100, 7000, 8100, 9100, 10100], [800, 9200, 9200, 10700, 12600, 14300, null]], adj: { tw: 1190, nr: [550, 550, 0, 0, 0, 280], app: 470, alt: 390, slp: 200 } }
    },
    "77F": {
        f25_dry: { dist: [[440, 5500, 5500, 6800, 8000, 9300, 10200], [780, 8600, 8600, 11400, 13600, null, null]], adj: { tw: 1110, nr: [0, 0, 0, 0, 0, 0], app: 410, alt: 460, slp: 340 } },
        f25_wet: { dist: [[440, 6500, 6500, 7400, 8300, 9700, 10600], [780, 10400, 10400, 12500, 14600, null, null]], adj: { tw: 1110, nr: [480, 480, 0, 0, 0, 0], app: 410, alt: 460, slp: 340 } },
        f30_dry: { dist: [[440, 5300, 5300, 6600, 7600, 8900, 9800], [780, 8200, 8200, 11200, 13500, null, null]], adj: { tw: 1080, nr: [0, 0, 0, 0, 0, 0], app: 410, alt: 420, slp: 310 } },
        f30_wet: { dist: [[440, 6200, 6200, 7100, 8000, 9300, 10100], [780, 10000, 10000, 12500, 14700, null, null]], adj: { tw: 1080, nr: [480, 480, 0, 0, 0, 0], app: 410, alt: 420, slp: 310 } },
        inop_f20_dry: { dist: [[440, 6100, 6100, 8000, 9300, 10500, 11800], [780, 8000, 8000, 10500, 12500, 14100, null]], adj: { tw: 1220, nr: [0, 0, 0, 0, 0, 420], app: 520, alt: 470, slp: 260 } },
        inop_f20_wet: { dist: [[440, 6800, 6800, 8000, 9300, 10500, 11800], [780, 10100, 10100, 12000, 14300, null, null]], adj: { tw: 1220, nr: [550, 550, 0, 0, 0, 420], app: 520, alt: 470, slp: 260 } },
        inop_f30_dry: { dist: [[440, 5500, 5500, 7000, 8100, 9100, 10100], [780, 8200, 8200, 11200, 13500, null, null]], adj: { tw: 1190, nr: [0, 0, 0, 0, 0, 280], app: 470, alt: 390, slp: 200 } },
        inop_f30_wet: { dist: [[440, 6100, 6100, 7000, 8100, 9100, 10100], [780, 10000, 10000, 12500, 14700, null, null]], adj: { tw: 1190, nr: [550, 550, 0, 0, 0, 280], app: 470, alt: 390, slp: 200 } }
    }
};


// ==========================================
// [4] UTILITY FUNCTIONS
// ==========================================
function formatNum(num) { return (num == null || isNaN(num)) ? "---" : Math.round(num).toLocaleString('en-US'); }
function formatWeightDisplay(val) { return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K'; }
function parseWeightInput(str) {
    if (!str) return null; str = str.toString().trim().toUpperCase().replace(/,/g, '');
    let mult = 1; if (str.endsWith('K')) { mult = 1000; str = str.slice(0, -1); }
    const val = parseFloat(str); if (isNaN(val)) return null;
    if (mult === 1 && val <= 1500) mult = 1000;
    return Math.round((val * mult) / 1000) * 1000;
}
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

function getHoldSpeed(type, weight, alt) {
    try {
        const d = HOLD_SPD_DATA_RAW[type]; if (!d) return null;
        let wK = Math.max(d.weights[0], Math.min(weight / 1000, d.weights[d.weights.length - 1]));
        let a = Math.max(d.alts[0], Math.min(alt, d.alts[d.alts.length - 1]));
        let wIdx = 0; while (wIdx < d.weights.length - 1 && d.weights[wIdx + 1] <= wK) wIdx++;
        let aIdx = 0; while (aIdx < d.alts.length - 1 && d.alts[aIdx + 1] <= a) aIdx++;
        const w1 = d.weights[wIdx], w2 = d.weights[wIdx + 1] || w1, a1 = d.alts[aIdx], a2 = d.alts[aIdx + 1] || a1;
        const wRatio = w1 === w2 ? 0 : (wK - w1) / (w2 - w1), aRatio = a1 === a2 ? 0 : (a - a1) / (a2 - a1);

        const row1 = d.kias[wIdx];
        const row2 = d.kias[wIdx + 1] || row1;
        const v11 = row1[aIdx];
        const v12 = row1[aIdx + 1] !== undefined ? row1[aIdx + 1] : v11;
        const v21 = row2[aIdx] !== undefined ? row2[aIdx] : v11;
        const v22 = row2[aIdx + 1] !== undefined ? row2[aIdx + 1] : v12;

        if (v11 === undefined || v12 === undefined || v21 === undefined || v22 === undefined) return null;
        return Math.round((v11 + (v21 - v11) * wRatio) + ((v12 + (v22 - v12) * wRatio) - (v11 + (v21 - v11) * wRatio)) * aRatio);
    } catch (e) {
        return null;
    }
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


// ==========================================
// [5] TAB COMPONENTS (DASHBOARD ONLY)
// ==========================================
const DashboardView = ({ state, updateState, computed, aircraftRegistrationList, aircraftRegistrationData, handleRegChange, setAircraftType, cruiseWtInputText, setCruiseWtInputText, ldgWtInputText, setLdgWtInputText }) => {
    const highlightToggleClass = (isActive, variant = "blue") => isActive ? `px-2 py-0.5 text-[9px] font-bold border-2 rounded transition-all tracking-wider ${variant === 'green' ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10' : variant === 'red' ? 'border-red-400 text-red-400 bg-red-400/10' : 'border-blue-400 text-blue-400 bg-blue-400/10'}` : "px-2 py-0.5 text-[9px] font-bold border border-slate-700 rounded transition-all tracking-wider text-slate-500 hover:text-slate-400";

    return (
        <div className="flex flex-col gap-1 overflow-y-auto flex-1 h-full pr-1 animate-in fade-in">
            {/* GLOBAL HEADER / SETTINGS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#131c2f] p-1.5 rounded-lg border border-slate-700/60 shadow-md gap-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold tracking-widest text-xs">
                    <SafeIcon name="Plane" className="w-3.5 h-3.5" /> B777 MASTER PERF EFB (ANA MODEL)
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <select value={state.selectedReg} onChange={(e) => handleRegChange(e.target.value)} className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-600 outline-none hover:border-slate-400 transition-colors">
                        <option value="">-- REG --</option>
                        {aircraftRegistrationList.map(ac => (<option key={ac.reg} value={ac.reg}>{ac.reg}</option>))}
                    </select>
                    <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
                        {aircraftRegistrationData.map(d => (
                            <button
                                key={d.type}
                                onClick={() => setAircraftType(d.type)}
                                className={d.type === state.selectedType ? "px-3 py-1 text-[10px] font-bold rounded transition-all bg-blue-600 text-white shadow-sm" : "px-3 py-1 text-[10px] font-bold rounded transition-all text-slate-400 hover:text-slate-200"}
                            >
                                {d.type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CRUISE PERFORMANCE MODULE */}
            <div className="bg-[#131c2f] border border-slate-700 rounded-lg p-1.5 shadow-xl">
                <div className="flex items-center gap-1 mb-1 text-slate-400 font-bold text-[9px] tracking-widest">
                    <SafeIcon name="Activity" className="w-3 h-3" /> CRUISE PERFORMANCE
                </div>
                <div className="flex flex-col xl:flex-row gap-1">
                    <div className="w-full xl:w-[45%] border border-slate-700 rounded p-1.5 flex gap-2 bg-[#1e293b]">
                        <div className="flex-[2] flex flex-col justify-center">
                            <div className="flex justify-between items-end mb-0.5">
                                <span className="text-[8px] text-slate-400 font-bold tracking-wider">GROSS WT</span>
                                <div className="flex items-center">
                                    <input type="text" value={cruiseWtInputText} onChange={(e) => setCruiseWtInputText(e.target.value)} onBlur={() => { const w = parseWeightInput(cruiseWtInputText); if (w !== null) updateState('cruiseWeight', w); else setCruiseWtInputText(formatWeightDisplay(state.cruiseWeight)); }} className="bg-transparent text-right text-[10px] text-white font-bold font-mono w-12 border-b border-transparent hover:border-slate-500 focus:border-emerald-500 focus:outline-none transition-colors" />
                                    <span className="text-[7px] text-slate-500 ml-0.5">LBS</span>
                                </div>
                            </div>
                            <input type="range" step="1000" min={computed.minCruiseWeight} max={computed.maxCruiseWeight} value={computed.clampedCruiseWeight} onChange={(e) => updateState('cruiseWeight', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 my-1.5" />
                            <div className="flex justify-between text-[7px] text-slate-500 mt-0.5 font-mono">
                                <span>{Math.round(computed.minCruiseWeight / 1000)}k</span>
                                <span>{Math.round(computed.maxCruiseWeight / 1000)}k</span>
                            </div>
                        </div>
                        <div className="w-px bg-slate-700 my-1 self-stretch"></div>
                        <div className="flex-[1.5] flex flex-col justify-center min-w-[75px]">
                            <div className="flex justify-between items-end mb-0.5">
                                <span className="text-[8px] text-slate-400 font-bold tracking-wider">CRZ ALT</span>
                                <span className="text-[10px] text-white font-bold font-mono">
                                    <span>{formatNum(state.cruiseAltitude)}</span><span className="text-[7px] text-slate-500 ml-0.5">FT</span>
                                </span>
                            </div>
                            <input type="range" min="0" max="43000" step="1000" value={state.cruiseAltitude} onChange={(e) => updateState('cruiseAltitude', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
                            <div className="flex justify-between text-[7px] text-slate-500 mt-0.5 font-mono">
                                <span>0</span>
                                <span>43k</span>
                            </div>
                        </div>
                        <div className="w-px bg-slate-700 my-1 self-stretch"></div>
                        <div className="flex-[1] flex flex-col justify-center min-w-[60px]">
                            <div className="flex justify-between items-end mb-0.5">
                                <span className="text-[8px] text-slate-400 font-bold tracking-wider">ISA DEV</span>
                                <span className="text-[10px] text-white font-bold font-mono">
                                    {(state.isaDev >= 0 ? '+' : '') + state.isaDev + '°C'}
                                </span>
                            </div>
                            <input type="range" min="-20" max="30" step="1" value={state.isaDev} onChange={(e) => updateState('isaDev', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
                            <div className="flex justify-between text-[7px] text-slate-500 mt-0.5 font-mono">
                                <span>-20</span>
                                <span>+30</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-1 gap-1 overflow-x-auto hide-scrollbar">
                        <div className="flex-1 min-w-[65px] border border-blue-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
                            <div className="text-center text-[7px] sm:text-[8px] font-bold text-blue-400 pb-0.5 tracking-wider">OPT ALT</div>
                            <div className="flex-1 flex justify-center items-center">
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter leading-none">{formatNum(computed.optAlt)}</span>
                                <span className="text-[8px] text-slate-500 ml-0.5">FT</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-[65px] border border-orange-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
                            <div className="text-center text-[7px] sm:text-[8px] font-bold text-orange-400 pb-0.5 tracking-wider">MAX ALT</div>
                            <div className="flex-1 flex flex-col justify-center items-center">
                                <div className="flex items-baseline">
                                    <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter leading-none">{formatNum(computed.maxAlt)}</span>
                                    <span className="text-[8px] text-slate-500 ml-0.5">FT</span>
                                </div>
                                <span className="text-[6px] text-orange-500/70 bg-orange-500/10 px-1 rounded mt-0.5 whitespace-nowrap leading-none scale-90">{computed.limitReason}</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-[65px] border border-purple-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
                            <div className="text-center text-[7px] sm:text-[8px] font-bold text-purple-400 pb-0.5 tracking-wider">VMO / MMO</div>
                            <div className="flex-1 flex flex-col justify-center items-center">
                                <div className="flex items-baseline">
                                    <span className="text-base sm:text-xl font-extrabold text-white font-mono tracking-tighter leading-none">{`${computed.vmo}/.${computed.mmo.toString().replace("0.", "")}`}</span>
                                </div>
                                <span className="text-[6px] text-purple-400/70 bg-purple-500/10 px-1 rounded mt-0.5 whitespace-nowrap scale-90">KIAS / MACH</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-[70px] border border-indigo-500/30 rounded flex flex-col bg-[#0f172a] overflow-hidden p-1">
                            <div className="text-center text-[7px] sm:text-[8px] font-bold text-indigo-400 pb-0.5 tracking-wider">FLAP UP MAN</div>
                            <div className="flex-1 flex flex-col justify-center items-center">
                                <div className="flex items-baseline">
                                    <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter leading-none">{computed.flapUpManeuver}</span>
                                    <span className="text-[8px] text-slate-500 ml-0.5">KTS</span>
                                </div>
                                <span className="text-[6px] text-indigo-400/70 bg-indigo-500/10 px-1 rounded mt-0.5 scale-90">Vref30 + 80</span>
                            </div>
                        </div>
                        <div className="flex-[1.2] min-w-[120px] bg-slate-800/80 border border-slate-700 border-t-[3px] border-t-violet-500 rounded flex flex-col justify-between items-center relative overflow-hidden p-1 group">
                            <div className="absolute top-0.5 right-0.5 flex flex-col items-end gap-[1px]">
                                <span className="text-[6px] font-mono text-slate-400 bg-slate-900/80 px-0.5 rounded border border-slate-600 leading-none">{computed.holdSpdLabelWt}</span>
                                <span className="text-[6px] font-mono text-slate-400 bg-slate-900/80 px-0.5 rounded border border-slate-600 leading-none">{computed.holdSpdLabelAlt}</span>
                            </div>
                            <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 mt-0">
                                <SafeIcon name="MapPin" className="w-2.5 h-2.5 text-violet-400" /> MINIMUM SPD
                            </span>
                            <div className="flex items-center gap-1 my-0.5">
                                <div className="text-lg sm:text-2xl font-black tracking-tighter leading-none flex items-baseline gap-0.5">
                                    {computed.holdSpdJsx}
                                    <span className="text-[8px] text-slate-500 font-normal tracking-normal ml-0.5">{computed.spdUnit}</span>
                                </div>
                            </div>
                            <div className="mt-auto flex flex-row items-center justify-center bg-slate-900/50 py-0.5 px-1 rounded-md border border-slate-700/50 w-full">
                                <span className="text-[5px] sm:text-[6.5px] font-mono font-bold text-slate-300 whitespace-nowrap text-center">
                                    {computed.minSpdTypeJsx}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LANDING DASHBOARD MODULE */}
            <div className="bg-[#0b101d] border border-slate-700/80 rounded-lg p-1 sm:p-1.5 shadow-2xl space-y-1">
                {/* Header & Toggles */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-1">
                    <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1 text-emerald-400 font-bold tracking-widest text-[9px] border border-emerald-500/50 px-1.5 py-0.5 rounded-full bg-emerald-500/10 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            LANDING
                        </div>
                        <div className="text-[8px] text-slate-500 font-mono pl-1">ADJUSTED DISTANCE</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                        <div className="flex gap-0.5">
                            <button className={highlightToggleClass(state.aiConfig === 'OFF')} onClick={() => updateState('aiConfig', 'OFF')}>A/I OFF</button>
                            <button className={highlightToggleClass(state.aiConfig === 'ON', 'green')} onClick={() => updateState('aiConfig', 'ON')}>A/I ON</button>
                        </div>
                        <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
                        <div className="flex gap-0.5">
                            <button className={highlightToggleClass(state.landingCondition === 'Normal', 'green')} onClick={() => updateState('landingCondition', 'Normal')}>NORMAL</button>
                            <button className={highlightToggleClass(state.landingCondition === '1 ENG INOP', 'red')} onClick={() => updateState('landingCondition', '1 ENG INOP')}>ENG INOP</button>
                        </div>
                        <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
                        <div className="flex gap-0.5">
                            <button className={highlightToggleClass(state.selectedRwyCond === '6-DRY', 'green')} onClick={() => updateState('selectedRwyCond', '6-DRY')}>DRY</button>
                            <button className={highlightToggleClass(state.selectedRwyCond === '5-WET', 'blue')} onClick={() => updateState('selectedRwyCond', '5-WET')}>WET</button>
                        </div>
                        <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
                        <div className="flex items-center gap-0.5">
                            <button className={highlightToggleClass(state.reverserConfig === 'Both')} onClick={() => updateState('reverserConfig', 'Both')}>BOTH</button>
                            <button className={highlightToggleClass(state.reverserConfig === 'One')} onClick={() => updateState('reverserConfig', 'One')}>ONE</button>
                            <button className={highlightToggleClass(state.reverserConfig === 'None', 'red')} onClick={() => updateState('reverserConfig', 'None')}>NO REV</button>
                        </div>
                        <div className="h-3 w-px bg-slate-700 mx-0.5"></div>
                        <div className="flex gap-0.5">
                            <button className={highlightToggleClass(state.factConfig === '1.15', 'green')} onClick={() => updateState('factConfig', '1.15')}>FACT 1.15</button>
                            <button className={highlightToggleClass(state.factConfig === '1.00')} onClick={() => updateState('factConfig', '1.00')}>BASE 1.00</button>
                        </div>
                    </div>
                </div>

                {/* Correction Sliders */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
                    <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827]">
                        <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[8px] text-slate-400 font-bold tracking-wider">LANDING WT</span>
                            <div className="flex items-center">
                                <input type="text" value={ldgWtInputText} onChange={(e) => setLdgWtInputText(e.target.value)} onBlur={() => { const w = parseWeightInput(ldgWtInputText); if (w !== null) updateState('landingWeight', w); else setLdgWtInputText(formatWeightDisplay(state.landingWeight)); }} className="bg-transparent text-right text-[10px] text-white font-bold font-mono w-12 border-b border-transparent hover:border-slate-500 focus:border-emerald-500 focus:outline-none transition-colors" />
                                <span className="text-[7px] text-slate-500 ml-0.5">LBS</span>
                            </div>
                        </div>
                        <input type="range" step="1000" min={computed.landingMinWeight} max={computed.maxAvailableLdgWt} value={computed.clampedLandingWeight} onChange={(e) => updateState('landingWeight', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500 my-1.5" />
                        <div className="flex justify-between text-[7px] text-slate-500 mt-0.5 font-mono">
                            <span>{Math.round(computed.landingMinWeight / 1000)}k</span>
                            <span>MAX: {Math.round(computed.maxAvailableLdgWt / 1000)}k</span>
                        </div>
                    </div>

                    <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
                        <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[8px] text-slate-400 font-bold tracking-wider">WIND COMP</span>
                            <span className="text-[10px] text-white font-bold font-mono"><span>{computed.windText}</span><span className="text-[7px] text-slate-500 ml-0.5">KT</span></span>
                        </div>
                        <input type="range" min="-20" max="15" step="5" value={state.windComponent} onChange={(e) => updateState('windComponent', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
                    </div>

                    <div className="border border-slate-750 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
                        <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[8px] text-slate-400 font-bold tracking-wider">APP SPD ADD</span>
                            <span className="text-[10px] text-white font-bold font-mono"><span>+{state.appSpeedAdditive}</span><span className="text-[7px] text-slate-500 ml-0.5">KT</span></span>
                        </div>
                        <input type="range" min="0" max="30" step="5" value={state.appSpeedAdditive} onChange={(e) => updateState('appSpeedAdditive', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
                    </div>

                    <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
                        <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[8px] text-slate-400 font-bold tracking-wider">PRESS ALT</span>
                            <span className="text-[10px] text-white font-bold font-mono"><span>{formatNum(state.pressureAlt)}</span><span className="text-[7px] text-slate-500 ml-0.5">FT</span></span>
                        </div>
                        <input type="range" min="0" max="8000" step="1000" value={state.pressureAlt} onChange={(e) => updateState('pressureAlt', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
                    </div>

                    <div className="border border-slate-700 rounded p-1.5 flex flex-col bg-[#111827] justify-center">
                        <div className="flex justify-between items-end mb-0.5">
                            <span className="text-[8px] text-slate-400 font-bold tracking-wider">RWY SLOPE</span>
                            <span className="text-[10px] text-white font-bold font-mono"><span>{computed.slopeText}</span><span className="text-[7px] text-slate-500 ml-0.5">%</span></span>
                        </div>
                        <input type="range" min="-2" max="2" step="1" value={state.rwSlope} onChange={(e) => updateState('rwSlope', Number(e.target.value))} className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 my-1.5" />
                    </div>
                </div>

                {/* 2-ROW GRID LANDING PERFORMANCE DASHBOARD */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 w-full">

                    <div className="border border-fuchsia-500/40 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
                        <div className="text-center text-[7px] sm:text-[8px] font-bold text-fuchsia-400 pb-0.5 tracking-widest bg-[#131c2f]">TARGET N1</div>
                        <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                            <div className="flex justify-between items-baseline leading-none">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[8px] sm:text-[10px] text-fuchsia-300/50 font-bold">{computed.activeFlaps[0]}</span>
                                    <span className="text-[6px] text-fuchsia-400 font-mono tracking-tighter">{computed.pchF1}</span>
                                </div>
                                <div className="flex items-baseline">
                                    <span className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono tracking-tighter">{computed.n1F1}</span>
                                    <span className="text-[6px] text-emerald-400/70 ml-[1px]">%</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[8px] sm:text-[10px] text-fuchsia-300/50 font-bold">{computed.activeFlaps[1]}</span>
                                    <span className="text-[6px] text-fuchsia-400 font-mono tracking-tighter">{computed.pchF2}</span>
                                </div>
                                <div className="flex items-baseline">
                                    <span className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono tracking-tighter">{computed.n1F2}</span>
                                    <span className="text-[6px] text-emerald-400/70 ml-[1px]">%</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-1 py-0.5 text-[6px] text-fuchsia-500/50 font-mono text-center flex justify-between mt-auto border-t border-fuchsia-500/10 pt-0.5">
                            <span>{computed.engine}</span>
                            <span className="text-fuchsia-500/70">Vref+{state.appSpeedAdditive}</span>
                        </div>
                    </div>

                    <div className="border border-slate-700 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
                        <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-400 pb-0.5 tracking-wider bg-[#131c2f]">MAX MAN</div>
                        <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[6px] text-slate-500 font-mono tracking-tighter">{computed.penaltyF25}</span>
                                    <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distMan1)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[6px] text-slate-500 font-mono tracking-tighter">{computed.penaltyF30}</span>
                                    <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distMan2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5">
                            <span>-</span><span>-</span>
                        </div>
                    </div>

                    <div className="border border-slate-700 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
                        <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-400 pb-0.5 tracking-widest bg-[#131c2f]">MAX AUTO</div>
                        <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distMax1)}</span>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distMax2)}</span>
                            </div>
                        </div>
                        <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5">
                            <span>-</span><span>-</span>
                        </div>
                    </div>

                    <div className="border border-slate-700 rounded flex flex-col bg-[#0f172a] overflow-hidden shadow-lg p-1 h-full">
                        <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-400 pb-0.5 tracking-wider bg-[#131c2f]">M TO FT</div>
                        <div className="flex-1 flex flex-col justify-around py-0.5 px-1 font-mono text-[9px] sm:text-xs">
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-slate-500">3000m:</span><span className="font-bold text-slate-300">9,843'</span>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-slate-500">2800m:</span><span className="font-bold text-slate-300">9,186'</span>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-slate-500">2500m:</span><span className="font-bold text-slate-300">8,202'</span>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-slate-500">2000m:</span><span className="font-bold text-slate-300">6,562'</span>
                            </div>
                        </div>
                        <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5">
                            <span>-</span><span>-</span>
                        </div>
                    </div>

                    <div className="border border-slate-750 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
                        <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 4</div>
                        <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb41)}</span>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb42)}</span>
                            </div>
                        </div>
                        <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5">
                            <span>-</span><span>-</span>
                        </div>
                    </div>

                    <div className="border border-slate-750 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
                        <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 3</div>
                        <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb31)}</span>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb32)}</span>
                            </div>
                        </div>
                        <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5">
                            <span>-</span><span>-</span>
                        </div>
                    </div>

                    <div className="border border-slate-750 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
                        <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 2</div>
                        <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb21)}</span>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb22)}</span>
                            </div>
                        </div>
                        <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5">
                            <span>-</span><span>-</span>
                        </div>
                    </div>

                    <div className="border border-slate-750 rounded flex flex-col bg-[#131c2f] overflow-hidden shadow-lg p-1 h-full">
                        <div className="text-center text-[7px] sm:text-[8px] font-bold text-slate-300 pb-0.5 tracking-widest bg-[#1a2640]">AUTO 1</div>
                        <div className="flex-1 flex flex-col justify-center gap-1.5 py-0.5 px-1">
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[0]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb11)}</span>
                            </div>
                            <div className="flex justify-between items-baseline leading-none">
                                <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold">{computed.activeFlaps[1]}</span>
                                <span className="text-lg sm:text-2xl font-extrabold text-white font-mono tracking-tighter">{formatNum(computed.distAb12)}</span>
                            </div>
                        </div>
                        <div className="px-1 py-0.5 text-[6px] opacity-0 font-mono text-center flex justify-between mt-auto border-t border-transparent pt-0.5">
                            <span>-</span><span>-</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* BOTTOM COMPONENT: LIMITS & GEOMETRY */}
            <div className="bg-[#111827] border border-slate-800 p-2 rounded-lg flex flex-col space-y-2 shadow-md mt-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-[11px] text-slate-400">
                    <span className="font-bold text-blue-400 tracking-wider flex items-center gap-1 uppercase">
                        <SafeIcon name="Maximize" className="w-3 h-3 md:w-3.5 md:h-3.5" /> GEOMETRY
                    </span>
                    <span>Span: <strong className="text-white">{computed.dim.span}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>Length: <strong className="text-white">{computed.dim.length}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>Height: <strong className="text-white">{computed.dim.height}</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>RFFS: <strong className="text-white">ICAO 9 / FAA E</strong></span>
                    <span className="text-slate-600">|</span>
                    <span>OUTER GEAR: <strong className="text-white">12.9M (CODE F)</strong></span>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] md:text-[11px] text-slate-400">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-amber-400 tracking-wider flex items-center gap-1 uppercase">
                            <SafeIcon name="Users" className="w-3 h-3 md:w-3.5 md:h-3.5" /> CONFIG
                        </span>
                        <span><strong className="text-white">{computed.configText}</strong></span>

                        <div className="w-px h-3.5 bg-slate-700 mx-1"></div>

                        <span className="font-bold text-rose-400 tracking-wider flex items-center gap-1 uppercase whitespace-nowrap">
                            <SafeIcon name="Wind" className="w-3 h-3 md:w-3.5 md:h-3.5" /> X-WIND
                        </span>
                        <div className="flex flex-wrap gap-1 text-[9px] md:text-[10px] font-mono text-white">
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap">DRY:38 | WET:25 | CC3:20(15) | CC2:15(10) | CC1:10 <span className="text-slate-500 ml-0.5">*() &lt;2700m</span></span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1 sm:mt-0">
                        <span className="bg-slate-800 text-[9px] md:text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 shadow-sm">Taxi: {computed.taxiFuelRate} lbs/m</span>
                        <span className="bg-slate-800 text-[9px] md:text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 shadow-sm">APU: 9 lbs/m</span>
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
    // DASHBOARD以外の不要なタブを削除
    const tabs = ['DASHBOARD'];

    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [flightId, setFlightId] = useState("");
    const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
    const [isDrmModalOpen, setIsDrmModalOpen] = useState(false);

    const [state, setState] = useState({
        selectedReg: "", selectedType: "777-200", isaDev: 0, cruiseAltitude: 30000,
        landingCondition: "Normal", selectedRwyCond: "6-DRY", windComponent: 0,
        appSpeedAdditive: 5, pressureAlt: 0, rwSlope: 0, reverserConfig: "Both",
        factConfig: "1.00", aiConfig: "OFF", cruiseWeight: 400000, landingWeight: 400000
    });

    const [cruiseWtInputText, setCruiseWtInputText] = useState(formatWeightDisplay(state.cruiseWeight));
    const [ldgWtInputText, setLdgWtInputText] = useState(formatWeightDisplay(state.landingWeight));

    useEffect(() => { setCruiseWtInputText(formatWeightDisplay(state.cruiseWeight)); }, [state.cruiseWeight]);
    useEffect(() => { setLdgWtInputText(formatWeightDisplay(state.landingWeight)); }, [state.landingWeight]);

    const updateState = (key, value) => { setState(prev => ({ ...prev, [key]: value })); };

    const handleRegChange = (reg) => {
        const ac = aircraftRegistrationList.find(a => a.reg === reg);
        if (ac) setState(prev => ({ ...prev, selectedReg: reg, selectedType: ac.type, cruiseWeight: defaultCruiseWeights[ac.type], landingWeight: defaultLandingWeights[ac.type], landingCondition: "Normal" }));
        else setState(prev => ({ ...prev, selectedReg: reg }));
    };

    const setAircraftType = (type) => {
        setState(prev => ({ ...prev, selectedReg: "", selectedType: type, cruiseWeight: defaultCruiseWeights[type], landingWeight: defaultLandingWeights[type], landingCondition: "Normal" }));
    };

    const handleApplyFlightPlan = (data) => {
        setState(prev => {
            const next = { ...prev };
            if (data.reg) { const ac = aircraftRegistrationList.find(a => a.reg === data.reg); if (ac) { next.selectedReg = data.reg; next.selectedType = ac.type; } else { next.selectedReg = data.reg; } }
            if (data.isa !== undefined) next.isaDev = data.isa;
            if (data.alt !== undefined) next.cruiseAltitude = data.alt;
            if (data.ptow !== undefined) next.cruiseWeight = data.ptow * 1000;
            if (data.pldw !== undefined) next.landingWeight = data.pldw * 1000;
            if (data.ldElev !== undefined) next.pressureAlt = Math.round(data.ldElev / 100) * 100;
            return next;
        });
        if (data.flightId) setFlightId(data.flightId);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: 'フライトデータをパフォーマンス計算に反映しました！' }));
    };

    const computed = useMemo(() => {
        const aircraftInfo = aircraftRegistrationData.find(a => a.type === state.selectedType) || aircraftRegistrationData[0];
        const mKey = modelKeyMap[state.selectedType];
        const perfTable = CRUISE_PERF_DATA[mKey];

        // 重量制限の範囲をテーブルデータから動的に取得
        const minCruiseWeight = perfTable[0][0] * 1000;
        const maxCruiseWeight = perfTable[perfTable.length - 1][0] * 1000;
        const clampedCruiseWeight = Math.max(minCruiseWeight, Math.min(state.cruiseWeight, maxCruiseWeight));

        let maxAvailableLdgWt = 800000;
        const landingMinWeight = 280000;
        const clampedLandingWeight = Math.max(landingMinWeight, Math.min(state.landingWeight, maxAvailableLdgWt));

        const isEngInop = state.landingCondition === "1 ENG INOP";

        // --- 巡航性能 (Optimum Alt / Maximum Alt) の計算 ---
        const wt1000 = clampedCruiseWeight / 1000;
        const optAltRaw = interpolateObjArray(wt1000, perfTable, 1);
        const buf13Raw = interpolateObjArray(wt1000, perfTable, 2);
        const isa10Raw = interpolateObjArray(wt1000, perfTable, 4);
        const isa15Raw = interpolateObjArray(wt1000, perfTable, 5);
        const isa20Raw = interpolateObjArray(wt1000, perfTable, 6);

        const optAlt = Math.round(optAltRaw);
        let thrustLimit;

        if (state.isaDev <= 10) {
            thrustLimit = isa10Raw;
        } else if (state.isaDev <= 15) {
            thrustLimit = isa10Raw + (isa15Raw - isa10Raw) * ((state.isaDev - 10) / 5);
        } else if (state.isaDev <= 20) {
            thrustLimit = isa15Raw + (isa20Raw - isa15Raw) * ((state.isaDev - 15) / 5);
        } else {
            thrustLimit = isa20Raw + (isa20Raw - isa15Raw) * ((state.isaDev - 20) / 5);
        }
        thrustLimit = Math.round(thrustLimit);
        const buf13 = Math.round(buf13Raw);

        const maxAlt = Math.min(buf13, thrustLimit);
        const limitReason = maxAlt >= 43100 ? "Structural Limit" : (thrustLimit < buf13 ? "Thrust Limit" : "Maneuver Margin");

        let mmo = (mKey === "772" || mKey === "773") ? 0.87 : 0.89, vmo = mKey === "77W" || mKey === "77F" ? Math.min(350, Math.round(330 + (state.cruiseAltitude / 30000) * 20)) : 330;
        const vref30Arr = VREF_DATA[mKey].vref30, vref30 = interpolateDirectArray(clampedCruiseWeight / 1000, vref30Arr.map(v => v[0]), vref30Arr.map(v => v[1]));
        const flapUpManeuver = vref30 ? Math.round(vref30 + 80) : "N/A";

        // --- 変更: 20,000ft以上で 1.3G Maneuver Speed (Mach) を表示するロジック ---
        let holdSpdJsx = <span className="text-white">---</span>;
        let minSpdTypeJsx = <span><span className="text-violet-400">Flap UP HOLD</span> &lt; 20k</span>;
        let spdUnit = "KTS";

        if (state.cruiseAltitude >= 20000) {
            const mMach = getManeuverMach(mKey, clampedCruiseWeight, state.cruiseAltitude);
            if (mMach) {
                const formattedMach = "." + Math.round(mMach * 1000).toString().padStart(3, '0');
                holdSpdJsx = <span className="text-white">{formattedMach}</span>;
                minSpdTypeJsx = <span><span className="text-violet-400">1.3G MANEUVER</span> &ge; 20k</span>;
                spdUnit = "MACH";
            }
        } else {
            const holdSpd = getHoldSpeed(mKey, clampedCruiseWeight, state.cruiseAltitude);
            if (holdSpd) {
                holdSpdJsx = <span className="text-white">{Math.round(holdSpd)}</span>;
                minSpdTypeJsx = <span><span className="text-violet-400">Flap UP HOLD</span> &lt; 20k</span>;
                spdUnit = "KTS";
            }
        }

        let currentN1Flap25 = null, currentPchFlap25 = null, currentN1Flap30 = null, currentPchFlap30 = null;
        if (!isEngInop) {
            const res25 = interpolateObjArray(clampedLandingWeight / 1000, TARGET_PITCH_N1_DATA_RAW[mKey].f25, 2);
            if (res25) currentN1Flap25 = res25;
            const res30 = interpolateObjArray(clampedLandingWeight / 1000, TARGET_PITCH_N1_DATA_RAW[mKey].f30, 2);
            if (res30) currentN1Flap30 = res30;
        }
        const scaleFactor = state.factConfig === "1.15" ? 1.0 : (1.0 / 1.15);
        const activeFlaps = isEngInop ? ["F20", "F30"] : ["F25", "F30"];

        const getAomDistance = (flapTagLong, brakeMode) => {
            const tCat = isEngInop ? (flapTagLong === "FLAP 20" ? "inop_f20" : "inop_f30") : (flapTagLong === "FLAP 25" ? "f25" : "f30");
            const dbKey = tCat + "_" + (state.selectedRwyCond === "5-WET" ? "wet" : "dry");
            const aomData = LANDING_DIST_DATA_RAW[mKey]?.[dbKey];
            if (!aomData) return null;
            const bIdx = { "man": 1, "max": 2, "a4": 3, "a3": 4, "a2": 5, "a1": 6 }[brakeMode] || 2;
            let correctedDist = interpolateObjArray(clampedLandingWeight / 1000, aomData.dist, bIdx);
            if (correctedDist == null) return null;
            return Math.round(correctedDist * scaleFactor);
        };

        return {
            engine: aircraftInfo.engine, minCruiseWeight, maxCruiseWeight, clampedCruiseWeight, landingMinWeight, maxAvailableLdgWt, clampedLandingWeight,
            optAlt, maxAlt, limitReason, vmo, mmo, flapUpManeuver, holdSpdJsx, minSpdTypeJsx, spdUnit,
            holdSpdLabelWt: Math.round(clampedCruiseWeight / 1000) + "K", holdSpdLabelAlt: formatNum(state.cruiseAltitude) + "FT",
            windText: state.windComponent === 0 ? "0" : state.windComponent > 0 ? `T+${state.windComponent}` : `H${Math.abs(state.windComponent)}`,
            slopeText: state.rwSlope === 0 ? "0" : state.rwSlope > 0 ? `D+${state.rwSlope}` : `U${Math.abs(state.rwSlope)}`,
            activeFlaps, n1F1: isEngInop ? "N/A" : (currentN1Flap25 !== null ? currentN1Flap25.toFixed(1) : "N/A"),
            n1F2: isEngInop ? "N/A" : (currentN1Flap30 !== null ? currentN1Flap30.toFixed(1) : "N/A"), pchF1: "P:0.0", pchF2: "P:0.0",
            distMax1: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "max"), distMax2: getAomDistance("FLAP 30", "max"),
            distAb41: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a4"), distAb42: getAomDistance("FLAP 30", "a4"),
            distAb31: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a3"), distAb32: getAomDistance("FLAP 30", "a3"),
            distAb21: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a2"), distAb22: getAomDistance("FLAP 30", "a2"),
            distAb11: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "a1"), distAb12: getAomDistance("FLAP 30", "a1"),
            distMan1: getAomDistance(isEngInop ? "FLAP 20" : "FLAP 25", "man"), distMan2: getAomDistance("FLAP 30", "man"),
            penaltyF25: "TW+1000", penaltyF30: "TW+1000", taxiFuelRate: (mKey === "77W" || mKey === "77F") ? 72 : 57, dim: AIRCRAFT_DIMENSIONS[mKey],
            configText: mKey === "77F" ? "Freighter" : `${SEAT_DATA[mKey][0].classes} (Total: ${SEAT_DATA[mKey][0].total})`
        };
    }, [state]);

    return (
        <div className="min-h-screen bg-[#05070a] text-[#cbd5e1] pb-2 p-1 sm:p-2 space-y-1 font-sans flex flex-col relative overflow-hidden">
            <Toast />
            <PasteModal isOpen={isPasteModalOpen} onClose={() => setIsPasteModalOpen(false)} onApply={handleApplyFlightPlan} />
            <WifiPwdModal isOpen={isWifiModalOpen} onClose={() => setIsWifiModalOpen(false)} />
            <DrmModal isOpen={isDrmModalOpen} onClose={() => setIsDrmModalOpen(false)} initialFlightNo={flightId} />

            {/* --- GLOBAL HEADER / TAB NAVIGATION --- */}
            <div className="flex flex-col gap-1 w-full flex-none mb-1">
                <div className="flex justify-between items-end px-1 pt-1 pb-0.5 border-b-2 border-slate-700/80">
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold tracking-widest text-[10px] sm:text-xs">
                        <SafeIcon name="Plane" className="w-4 h-4" /> B777 MASTER PERF EFB
                        {flightId && <span className="ml-1 text-slate-300 font-mono text-[9px] border border-slate-600 px-1 rounded bg-slate-800">ANA{flightId}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center mb-0.5 gap-1">
                            <WifiButton type="INT" url="http://info.ana.co.jp/" label="INT" hoverClass="hover:bg-sky-600" colorClass="text-sky-400 border-sky-500/50" onLongPress={() => setIsWifiModalOpen(true)} />
                            <WifiButton type="DOM" url="http://www.ana.co.jp/wifi" label="DOM" hoverClass="hover:bg-emerald-600" colorClass="text-emerald-400 border-emerald-500/50" onLongPress={() => { }} />

                            <button
                                onClick={() => setIsPasteModalOpen(true)}
                                className="bg-slate-700 hover:bg-emerald-600 text-emerald-400 hover:text-white px-1 py-0.5 md:px-1.5 md:py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border border-slate-500 hover:border-emerald-400 shadow-sm"
                                title="PDF/TXT 読込"
                            >
                                <SafeIcon name="ClipboardPaste" className="w-2.5 h-2.5 md:w-3 md:h-3 pointer-events-none" />
                                <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">LOAD</span>
                            </button>

                            <button onClick={() => { if (!state.selectedReg || state.selectedReg === "N/A" || state.selectedReg === "") { window.dispatchEvent(new CustomEvent('show-toast', { detail: '機番を選択してください' })); return; } const buddycomUrl = BUDDYCOM_LINKS[state.selectedReg]; if (buddycomUrl) { const pastedFlightName = flightId ? `ANA${flightId}` : ""; if (pastedFlightName) { copyToClipboard(pastedFlightName); window.dispatchEvent(new CustomEvent('show-toast', { detail: `便名(${pastedFlightName})をコピーして起動しました` })); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'Buddycomを起動しました' })); } setTimeout(() => { window.open(buddycomUrl, '_blank'); }, 1000); } else { window.dispatchEvent(new CustomEvent('show-toast', { detail: 'この機番のBuddycomリンクは未登録です' })); } }} className={`px-1 py-0.5 md:px-1.5 md:py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border shadow-sm ${state.selectedReg && state.selectedReg !== "N/A" && state.selectedReg !== "" ? 'bg-slate-700 hover:bg-orange-600 text-orange-400 hover:text-white border-slate-500 hover:border-orange-400' : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'}`} title="Buddycomを開く"><SafeIcon name="Radio" className="w-2.5 h-2.5 md:w-3 md:h-3 pointer-events-none" /><span className="text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">BDYC</span></button>
                            <button onClick={() => setIsDrmModalOpen(true)} className="px-1 py-0.5 md:px-1.5 md:py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors border shadow-sm bg-slate-800 text-rose-300 border-slate-600 hover:border-rose-400 hover:bg-slate-700 hover:text-white" title="DRM報告"><SafeIcon name="Send" className="w-2.5 h-2.5 md:w-3 md:h-3 pointer-events-none" /><span className="text-[8px] md:text-[9px] lg:text-[10px] font-black tracking-widest leading-none mt-0.5 pointer-events-none">DRM</span></button>
                        </div>
                        <div className="text-[10px] sm:text-xs font-black text-slate-300 tracking-widest bg-slate-800 px-2 py-0.5 rounded-t-md border border-slate-700 border-b-0">{activeTab}</div>
                    </div>
                </div>
                <div className="flex gap-1 px-0.5 pb-1 overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 text-[9px] sm:text-[10px] font-bold rounded-md whitespace-nowrap transition-all shadow-sm ${activeTab === tab ? "bg-blue-600 text-white shadow-blue-900/50 scale-[1.02]" : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50"}`}>{tab}</button>
                    ))}
                </div>
            </div>

            {/* --- TAB CONTENT AREA --- */}
            {activeTab === 'DASHBOARD' && (
                <div className="flex flex-col gap-1 w-full flex-1 h-full overflow-hidden">
                    <DashboardView state={state} updateState={updateState} computed={computed} aircraftRegistrationList={aircraftRegistrationList} aircraftRegistrationData={aircraftRegistrationData} handleRegChange={handleRegChange} setAircraftType={setAircraftType} cruiseWtInputText={cruiseWtInputText} setCruiseWtInputText={setCruiseWtInputText} ldgWtInputText={ldgWtInputText} setLdgWtInputText={setLdgWtInputText} />
                </div>
            )}
        </div>
    );
}