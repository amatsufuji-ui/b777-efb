import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, Square, RotateCcw, FastForward, CheckSquare, Square as SquareOutline, 
  Info, AlertTriangle, Clock, ChevronRight, CheckCircle2, PlaneTakeoff, PlaneLanding,
  Coffee, Megaphone, ShieldAlert, XCircle, Settings2, Pause
} from 'lucide-react';

// タブ切り替え（アンマウント）時に状態を保持するためのモジュール変数
let persistedState = {
  selectedCountry: '米国',
  selectedPhase: '出発時',
  elapsedMs: 0,
  isRunning: false,
  baseTimestamp: null,
  inputTime: "",
  checkedTasks: {}
};

export const TarmacView = () => {
  const [selectedCountry, setSelectedCountry] = useState(persistedState.selectedCountry);
  const [selectedPhase, setSelectedPhase] = useState(persistedState.selectedPhase);
  
  // 初期マウント時に、もしタイマー稼働中なら現在時刻からelapsedMsを再計算（裏で進んでいた分を補正）
  const initialElapsed = persistedState.isRunning && persistedState.baseTimestamp 
    ? Date.now() - persistedState.baseTimestamp 
    : persistedState.elapsedMs;

  const [elapsedMs, setElapsedMs] = useState(initialElapsed);
  const [isRunning, setIsRunning] = useState(persistedState.isRunning);
  const [baseTimestamp, setBaseTimestamp] = useState(persistedState.baseTimestamp);
  const [inputTime, setInputTime] = useState(persistedState.inputTime);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const [checkedTasks, setCheckedTasks] = useState(persistedState.checkedTasks);
  const timerRef = useRef(null);

  const countries = ['米国', 'カナダ', '韓国', '中国', 'タイ', 'ベトナム'];
  
  // タイ・ベトナムは出発時のみ適用
  const phases = ['出発時', '到着時', 'ダイバート/ATB時'];
  const availablePhases = (selectedCountry === 'タイ' || selectedCountry === 'ベトナム') 
    ? ['出発時'] 
    : phases;

  // 国変更ハンドラー（ユーザー操作時のみ明示的にリセット）
  const handleCountryChange = (c) => {
    if (c === selectedCountry) return;
    setSelectedCountry(c);
    
    const available = (c === 'タイ' || c === 'ベトナム') ? ['出発時'] : phases;
    if (!available.includes(selectedPhase)) {
      setSelectedPhase('出発時');
    }
    
    setIsRunning(false);
    setElapsedMs(0);
    setBaseTimestamp(null);
    setInputTime("");
    setCheckedTasks({});
    setShowResetConfirm(false);
  };

  // フェーズ変更ハンドラー（ユーザー操作時のみ明示的にリセット）
  const handlePhaseChange = (p) => {
    if (p === selectedPhase) return;
    setSelectedPhase(p);
    
    setIsRunning(false);
    setElapsedMs(0);
    setBaseTimestamp(null);
    setInputTime("");
    setCheckedTasks({});
    setShowResetConfirm(false);
  };

  // ステートが変更されるたびにモジュール変数にバックアップ（タブ切り替え対策）
  useEffect(() => {
    persistedState = {
      selectedCountry,
      selectedPhase,
      elapsedMs,
      isRunning,
      baseTimestamp,
      inputTime,
      checkedTasks
    };
  }, [selectedCountry, selectedPhase, elapsedMs, isRunning, baseTimestamp, inputTime, checkedTasks]);

  // タイマー処理 (実時刻ベース)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (baseTimestamp) {
          setElapsedMs(Date.now() - baseTimestamp);
        } else {
          setElapsedMs(prev => prev + 1000);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, baseTimestamp]);

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setBaseTimestamp(Date.now() - elapsedMs);
      setIsRunning(true);
    }
  };
  
  const handleReset = () => {
    if (showResetConfirm) {
      setIsRunning(false);
      setElapsedMs(0);
      setBaseTimestamp(null);
      setInputTime("");
      setCheckedTasks({});
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  const addTime = (minutes) => {
    const msToAdd = minutes * 60 * 1000;
    setElapsedMs(prev => prev + msToAdd);
    if (baseTimestamp) {
      setBaseTimestamp(prev => prev - msToAdd);
    }
  };

  const applyInputTime = () => {
    if (!inputTime) return;
    const [hours, minutes] = inputTime.split(':').map(Number);
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    
    let diff = now.getTime() - targetDate.getTime();
    
    // もし未来の時間が入力されたら（前日の時間を入れたと解釈）
    if (diff < 0) {
       targetDate.setDate(targetDate.getDate() - 1);
       diff = now.getTime() - targetDate.getTime();
    }
    
    setBaseTimestamp(targetDate.getTime());
    setElapsedMs(diff);
    setIsRunning(true);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  // マイルストーン定義
  const milestones = useMemo(() => {
    const list = [];
    
    // カウント開始
    list.push({ time: 0, label: 'カウント開始', icon: Clock, color: 'text-blue-400' });
    
    // アナウンス (ベトナム以外は30分, マニュアル上は15分毎推奨だが法令ベースで配置)
    if (selectedCountry !== 'ベトナム' && selectedCountry !== 'タイ') {
      list.push({ time: 30, label: 'アナウンス(以降定期)', icon: Megaphone, color: 'text-amber-400' });
    }
    
    // 飲食物 (タイ・ベトナム除く)
    if (selectedCountry === 'ベトナム') {
      list.push({ time: 30, label: '飲料水提供', icon: Coffee, color: 'text-amber-400' });
    } else if (selectedCountry !== 'タイ') {
      list.push({ time: 120, label: '飲食物提供(以降2H毎)', icon: Coffee, color: 'text-amber-400' });
    }

    // 判断タイミング (カナダ、タイ、ベトナム: 2H / 米国、韓国、中国: 3H)
    if (['カナダ', 'タイ', 'ベトナム'].includes(selectedCountry)) {
      list.push({ time: 120, label: 'GTB/継続 判断', icon: ShieldAlert, color: 'text-orange-400' });
    } else {
      list.push({ time: 180, label: 'GTB/継続 判断', icon: ShieldAlert, color: 'text-orange-400' });
    }

    // 上限時間 (中国は無し)
    if (selectedCountry === '米国' || selectedCountry === '韓国') {
      list.push({ time: 240, label: '上限 (降機機会提供)', icon: XCircle, color: 'text-rose-500' });
    } else if (['カナダ', 'タイ', 'ベトナム'].includes(selectedCountry)) {
      list.push({ time: 180, label: '上限 (降機機会提供)', icon: XCircle, color: 'text-rose-500' });
    } else if (selectedCountry === '中国') {
      list.push({ time: 999, label: '上限なし', icon: Clock, color: 'text-slate-500' }); // 表示用
    }

    return list.sort((a, b) => a.time - b.time);
  }, [selectedCountry]);

  // チェックリスト生成
  const tasks = useMemo(() => {
    let t = [];
    t.push({ id: 't1', time: 0, text: 'カウント開始条件の確認（特例条件の確認）' });
    t.push({ id: 't2', time: 0, text: 'トイレの使用可否、客室温度の維持' });
    t.push({ id: 't3', time: 0, text: '旅客の健康状態の把握、リクライニング使用許可' });

    if (selectedCountry === '米国' && selectedPhase === '出発時') {
      t.push({ id: 't4', time: 15, text: '（ドアオープン時）降機可能である旨のアナウンス' });
    }

    if (selectedCountry !== 'タイ' && selectedCountry !== 'ベトナム') {
      t.push({ id: 't5', time: 30, text: '遅延状況のアナウンス（以降15〜30分毎に実施）' });
    }

    if (selectedCountry === 'ベトナム') {
      t.push({ id: 't_v1', time: 30, text: '飲料水の提供' });
    } else if (selectedCountry !== 'タイ') {
      t.push({ id: 't6', time: 120, text: '飲食物（水・スナック）の提供（以降2時間毎）' });
    }

    if (['カナダ', 'タイ', 'ベトナム'].includes(selectedCountry)) {
      t.push({ id: 't7', time: 120, text: 'GTBするか運航継続するかの判断（機長・基地長）' });
      t.push({ id: 't8', time: 180, text: '【上限到達】旅客へ降機の機会を提供' });
    } else {
      t.push({ id: 't7', time: 180, text: 'GTBするか運航継続するかの判断（機長・基地長）' });
      if (selectedCountry === '中国') {
        t.push({ id: 't8', time: 180, text: '離陸時刻不明な場合、降機の必要性を基地長へ確認' });
      } else {
        t.push({ id: 't8', time: 240, text: '【上限到達】旅客へ降機の機会を提供' });
      }
    }
    return t;
  }, [selectedCountry, selectedPhase]);

  const toggleTask = (id) => {
    setCheckedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // カウント条件データの取得
  const getConditions = () => {
    if (selectedCountry === 'ベトナム') {
      return {
        start: '出発時ドアクローズした時点',
        reset: 'リセットの概念なし (離陸するまでカウント継続)'
      };
    }
    if (selectedCountry === 'タイ') {
      return {
        start: 'ドアクローズした時点',
        reset: '①ドアオープンした時点\n②①を行わない場合は離陸した時点'
      };
    }
    if (selectedCountry === 'カナダ' || selectedCountry === '韓国' || selectedCountry === '中国') {
      return {
        start: selectedPhase === '出発時' ? 'ドアクローズした時点' : '着陸した時点',
        reset: '運航継続：離陸した時点\n運航中止：ドアオープンした時点\n(※降機可能と伝えてもリセットされない)'
      };
    }
    // 米国
    let resetStr = '①ドアオープンし降機可能と伝えた時点\n②行わない場合は離陸した時点';
    if (selectedPhase !== '出発時') resetStr = 'ドアオープンした時点 (降機準備完了のアナウンス時)';
    
    return {
      start: selectedPhase === '出発時' ? 'ドアクローズした時点' : '着陸した時点',
      reset: resetStr,
      special: selectedPhase === '出発時' ? '※Boarding Bridge即時再接続可能 ＆ 降機可能アナウンスを行えばカウント開始されない' : ''
    };
  };

  const conds = getConditions();

  return (
    <div className="flex flex-col md:flex-row gap-2 h-full overflow-hidden text-[#cbd5e1] p-1">
      {/* 左ペイン：設定・ルール確認 */}
      <div className="w-full md:w-1/2 flex flex-col gap-2 overflow-y-auto pr-1 hide-scrollbar">
        
        {/* 設定セクション */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-sm shrink-0">
          <div className="flex items-center gap-1.5 mb-3 text-blue-400 font-bold text-sm">
            <Settings2 className="w-4 h-4" />
            <span>対象国・フェーズ設定</span>
          </div>
          
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs text-slate-400 mb-1 font-semibold">対象国</div>
              <div className="flex flex-wrap gap-1.5">
                {countries.map(c => (
                  <button
                    key={c}
                    onClick={() => handleCountryChange(c)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors border shadow-sm ${
                      selectedCountry === c 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/50' 
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-1 font-semibold">運航フェーズ</div>
              <div className="flex flex-wrap gap-1.5">
                {availablePhases.map(p => (
                  <button
                    key={p}
                    onClick={() => handlePhaseChange(p)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors border flex items-center gap-1 shadow-sm ${
                      selectedPhase === p 
                      ? 'bg-amber-600 text-white border-amber-500 shadow-amber-900/50' 
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    {p === '出発時' && <PlaneTakeoff className="w-3 h-3" />}
                    {p === '到着時' && <PlaneLanding className="w-3 h-3" />}
                    {(p === 'ダイバート/ATB時') && <AlertTriangle className="w-3 h-3" />}
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* タイムライン概要 */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-sm shrink-0">
          <div className="flex items-center gap-1.5 mb-3 text-emerald-400 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>対応タイムライン概要</span>
          </div>
          
          <div className="relative pt-2 pb-6 px-4 overflow-x-auto hide-scrollbar">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-700"></div>
            <div className="flex justify-between relative min-w-[350px]">
              {milestones.map((ms, idx) => {
                const isPast = elapsedMinutes >= ms.time && ms.time !== 999;
                const isNext = !isPast && milestones.slice(0, idx).every(m => elapsedMinutes >= m.time);
                
                return (
                  <div key={idx} className="flex flex-col items-center relative" style={{ width: '40px' }}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 border-2 text-[10px] mb-1.5 font-bold transition-all ${
                      isPast ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                      isNext ? 'bg-amber-500 border-amber-300 text-white animate-pulse' :
                      'bg-slate-800 border-slate-600 text-slate-400'
                    }`}>
                      {ms.time === 999 ? '∞' : ms.time}
                    </div>
                    <div className="absolute top-6 w-24 text-center">
                      <span className={`text-[9px] font-bold leading-tight flex flex-col items-center justify-center ${isPast ? 'text-slate-300' : 'text-slate-400'}`}>
                        <ms.icon className={`w-3 h-3 mb-0.5 ${ms.color}`} />
                        {ms.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* カウント条件・特記事項 */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-sm shrink-0">
          <div className="flex items-center gap-1.5 mb-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>カウント条件 ({selectedCountry} / {selectedPhase})</span>
          </div>
          
          <div className="space-y-3 text-xs">
            <div className="bg-slate-900/50 p-2.5 rounded-md border border-slate-700/50">
              <span className="font-bold text-sky-400 block mb-1">開始条件:</span>
              <span className="text-slate-300">{conds.start}</span>
              {conds.special && (
                <div className="mt-1 text-amber-400 bg-amber-900/20 p-1.5 rounded text-[10px] font-semibold border border-amber-700/30">
                  {conds.special}
                </div>
              )}
            </div>
            
            <div className="bg-slate-900/50 p-2.5 rounded-md border border-slate-700/50">
              <span className="font-bold text-emerald-400 block mb-1">リセット条件:</span>
              <span className="text-slate-300 whitespace-pre-line leading-relaxed">{conds.reset}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右ペイン：タイマー・タスク */}
      <div className="w-full md:w-1/2 flex flex-col gap-2 overflow-y-auto pr-1 hide-scrollbar">
        
        {/* タイマーコントロール */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-sm shrink-0 flex flex-col items-center relative overflow-hidden">
          {/* 装飾背景 */}
          <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${isRunning ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`}></div>

          <div className="text-[10px] text-slate-400 font-bold mb-1 tracking-widest">ELAPSED TIME</div>
          <div className={`text-4xl sm:text-5xl font-mono font-black tracking-wider mb-2 ${isRunning ? 'text-amber-400' : 'text-slate-200'}`}>
            {formatTime(elapsedMs)}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <button
              onClick={toggleTimer}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-4 rounded-md font-bold text-sm transition-all shadow-sm ${
                isRunning 
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/50' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'PAUSE' : 'START'}
            </button>
            
            <button
              onClick={handleReset}
              className={`px-3 py-2 rounded-md font-bold text-sm transition-colors shadow-sm flex items-center gap-1 ${
                showResetConfirm
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
              }`}
              title="リセット"
            >
              <RotateCcw className="w-4 h-4" />
              {showResetConfirm && <span>本当に？</span>}
            </button>
          </div>

          <div className="flex w-full items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold shrink-0">基準時刻設定:</span>
            <input 
              type="time" 
              value={inputTime}
              onChange={(e) => setInputTime(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-slate-200 rounded px-2 py-1.5 text-xs w-full focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={applyInputTime}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors shrink-0 shadow-sm"
            >
              SET
            </button>
          </div>

          <div className="flex w-full items-center gap-1 mt-3 pt-3 border-t border-slate-700/50">
            <span className="text-[10px] text-slate-500 font-bold mr-1"><FastForward className="w-3 h-3 inline pb-0.5"/> SIMULATE:</span>
            {[15, 30, 60].map(m => (
              <button
                key={m}
                onClick={() => addTime(m)}
                className="flex-1 py-1 bg-slate-700/50 hover:bg-slate-600 text-slate-300 rounded text-[10px] font-bold border border-slate-600/50 transition-colors"
              >
                +{m}m
              </button>
            ))}
          </div>
        </div>

        {/* 動的チェックリスト */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-sm flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center gap-1.5 mb-3 text-sky-400 font-bold text-sm">
            <CheckSquare className="w-4 h-4" />
            <span>対応チェックリスト</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar space-y-2">
            {tasks.map((task) => {
              const isTimeOver = elapsedMinutes >= task.time && task.time > 0;
              const isDone = checkedTasks[task.id];

              let rowClass = "bg-slate-900/40 border-slate-700/50 text-slate-300";
              let iconClass = "text-slate-500";
              
              if (isDone) {
                rowClass = "bg-emerald-900/20 border-emerald-500/30 text-emerald-300 opacity-70";
                iconClass = "text-emerald-400";
              } else if (isTimeOver) {
                rowClass = "bg-rose-900/30 border-rose-500/50 text-rose-200 animate-pulse-slow shadow-[0_0_10px_rgba(244,63,94,0.15)]";
                iconClass = "text-rose-400";
              }

              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-2.5 rounded-md border cursor-pointer transition-all flex items-start gap-2.5 ${rowClass}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? <CheckSquare className={`w-4 h-4 ${iconClass}`} /> : <SquareOutline className={`w-4 h-4 ${iconClass}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold leading-tight ${isDone ? 'line-through decoration-emerald-500/50' : ''}`}>
                      {task.text}
                    </div>
                    {task.time > 0 && (
                      <div className="text-[10px] mt-1 opacity-70 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.time}分経過時
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Tailwind用アニメーション追加 */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default TarmacView;