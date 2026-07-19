import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, AlertTriangle, Info, FastForward, RotateCcw, 
  AlertCircle, Check, PlaneTakeoff, PlaneLanding, Plane
} from 'lucide-react';

const COUNTRY_DATA = {
  US: {
    id: 'US',
    name: '米国 (USA)',
    phases: ['Departure', 'Arrival', 'Divert'],
    limit: 4 * 60, 
    decisionPoint: 3 * 60,
    foodInterval: 2 * 60,
    announceInterval: 30,
    specialNotes: [
      '出発時: Boarding Bridge即時再接続可 ＆ 降機可能アナウンスでカウント開始を回避可能。',
      '3時間を超えた時点で、GTB(Gate Return)するか運航継続するか判断。',
      '出発便は4時間以内に管制機関へGTBを要求すればOK。'
    ],
    rules: {
      Departure: {
        start: 'ドアクローズした時点',
        reset: 'ドアオープンし降機可能と伝えた時点 / 離陸した時点'
      },
      Arrival: { start: '着陸した時点', reset: 'ドアオープンし降機可能と伝えた時点 / ドアオープンした時点' },
      Divert: { start: '着陸した時点', reset: 'ドアオープンし降機可能と伝えた時点 / ドアオープンした時点' }
    }
  },
  CA: {
    id: 'CA',
    name: 'カナダ (Canada)',
    phases: ['Departure', 'Arrival', 'Divert'],
    limit: 3 * 60,
    limitNote: '※ 3時間45分以内に離陸可能な見込みである情報があれば待機可',
    decisionPoint: 2 * 60,
    foodInterval: 2 * 60,
    announceInterval: 30,
    specialNotes: [
      'ドアオープンし降機可能と伝えてもリセット不可（離陸か運航中止のみ）。',
      '可能な限り、電子機器の使用制限を解除する。',
      '降機時は障がいのある旅客を優先する。'
    ],
    rules: {
      Departure: { start: 'ドアクローズした時点', reset: '運航継続: 離陸 / 運航中止: ドアオープン' },
      Arrival: { start: '着陸した時点', reset: '運航継続: 離陸 / 運航中止: ドアオープン' },
      Divert: { start: '着陸した時点', reset: '運航継続: 離陸 / 運航中止: ドアオープン' }
    }
  },
  KR: {
    id: 'KR',
    name: '韓国 (South Korea)',
    phases: ['Departure', 'Arrival', 'Divert'],
    limit: 4 * 60,
    limitNote: '※ 防除雪氷作業による場合は上限時間の適用除外（機内対応は継続）',
    decisionPoint: 3 * 60,
    foodInterval: 2 * 60,
    announceInterval: 30,
    specialNotes: [
      '【重要】降機可能であることを伝えドアオープンしている間の時間は、カウントに算入されない（タイマー一時停止可）。',
      'ドアオープンし降機可能と伝えてもリセット不可。'
    ],
    rules: {
      Departure: { start: 'ドアクローズした時点', reset: '運航継続: 離陸 / 運航中止: ドアオープン' },
      Arrival: { start: '着陸した時点', reset: '運航継続: 離陸 / 運航中止: ドアオープン' },
      Divert: { start: '着陸した時点', reset: '運航継続: 離陸 / 運航中止: ドアオープン' }
    }
  },
  CN: {
    id: 'CN',
    name: '中国 (China)',
    phases: ['Departure', 'Arrival', 'Divert'],
    limit: null,
    limitNote: '上限時間設定なし',
    decisionPoint: 3 * 60,
    foodInterval: 2 * 60,
    announceInterval: 30,
    specialNotes: [
      'ドアオープンし降機可能と伝えてもリセット不可。',
      '3時間を超えた時点で離陸予定時刻が不明な場合、降機の可能性を空港基地長に確認すること。'
    ],
    rules: {
      Departure: { start: 'ドアクローズした時点', reset: '運航継続: 離陸 / 運航中止: ドアオープン' },
      Arrival: { start: '着陸した時点', reset: '運航継続: 離陸 / 運航中止: ドアオープン' },
      Divert: { start: '着陸した時点', reset: '運航継続: 離陸 / 運航中止: ドアオープン' }
    }
  },
  TH: {
    id: 'TH',
    name: 'タイ (Thailand)',
    phases: ['Departure'],
    limit: 3 * 60,
    limitNote: '※ 管制情報により離陸時刻が確定している場合は対象外',
    decisionPoint: 2 * 60,
    foodInterval: null, 
    announceInterval: 15, 
    specialNotes: [
      '出発時のみ適用。',
      '飲食物の定時提供義務は対象外。',
      '30分毎のアナウンス義務はないが、会社規定に基づき原則15分毎に適切に実施。'
    ],
    rules: {
      Departure: { start: 'ドアクローズした時点', reset: '運航継続: 離陸 または ドアオープン / 運航中止: ドアオープン' }
    }
  },
  VN: {
    id: 'VN',
    name: 'ベトナム (Vietnam)',
    phases: ['Departure'],
    limit: 3 * 60,
    limitNote: '※ 管制情報により離陸時刻が確定している場合は対象外',
    decisionPoint: 2 * 60,
    foodInterval: null, 
    announceInterval: 15, 
    specialNotes: [
      '出発時のみ適用。',
      'カウント開始後、リセットの概念はない（離陸まで継続）。',
      '30分毎のアナウンス義務はないが、会社規定に基づき原則15分毎に適切に実施。'
    ],
    rules: {
      Departure: { start: 'ドアクローズした時点', reset: '離陸した時点までリセット概念なし' }
    }
  }
};

const generateTasks = (countryId) => {
  const data = COUNTRY_DATA[countryId];
  let tasks = [];

  tasks.push({ time: 0, id: 'init_1', title: 'カウント開始', desc: '化粧室の使用、客室温度の維持、旅客の健康状態を把握し必要な措置を講じる', isUrgent: false });

  if (countryId === 'VN') {
    tasks.push({ time: 30, id: 'vn_water', title: '飲料水の提供', desc: '旅客へ飲料水を提供すること', isUrgent: true });
  }

  for (let m = data.announceInterval; m <= 300; m += data.announceInterval) {
    tasks.push({ 
      time: m, 
      id: `ann_${m}`, 
      title: '機内アナウンス', 
      desc: `遅延の状況(理由、今後の見込み等)についてアナウンスを実施`, 
      isUrgent: false 
    });
  }

  if (data.foodInterval) {
    for (let m = data.foodInterval; m <= 300; m += data.foodInterval) {
      tasks.push({ 
        time: m, 
        id: `food_${m}`, 
        title: '飲食物の提供', 
        desc: `すべての旅客に対して飲み物と食べ物を提供 (安全上支障がある場合を除く)`, 
        isUrgent: true 
      });
    }
  }

  if (data.decisionPoint) {
    tasks.push({ 
      time: data.decisionPoint, 
      id: 'decision', 
      title: '【重要】降機・運航継続の判断', 
      desc: countryId === 'CN' ? '離陸予定時刻が不明な場合は、降機の必要性を基地長に確認。' : '上限前に降機機会を提供するため、GTBするか運航継続するか空港基地長と協議し判断する。', 
      isUrgent: true,
      isCritical: true
    });
  }

  if (data.limit) {
    tasks.push({ 
      time: data.limit, 
      id: 'limit', 
      title: '【限界】上限時間到達', 
      desc: `これ以上の機内停留は不可。速やかに降機の機会を提供すること。(${data.limitNote || ''})`, 
      isUrgent: true,
      isCritical: true
    });
  }

  tasks.sort((a, b) => a.time - b.time);
  
  const groupedTasks = [];
  let currentTime = -1;
  let currentGroup = null;

  tasks.forEach(task => {
    if (task.time !== currentTime) {
      if (currentGroup) groupedTasks.push(currentGroup);
      currentTime = task.time;
      currentGroup = { time: currentTime, tasks: [] };
    }
    currentGroup.tasks.push(task);
  });
  if (currentGroup) groupedTasks.push(currentGroup);

  return groupedTasks;
};

// 修正箇所：export const TarmacView として名前付きエクスポート可能にする
export const TarmacView = () => {
  const [country, setCountry] = useState('US');
  const [phase, setPhase] = useState('Departure');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const currentData = COUNTRY_DATA[country];
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!currentData.phases.includes(phase)) {
      setPhase(currentData.phases[0]);
    }
  }, [country, phase, currentData]);

  const taskGroups = useMemo(() => generateTasks(country), [country]);

  const overviewMilestones = useMemo(() => {
    const milestones = [];
    milestones.push({ time: 0, label: '開始' });
    
    if (currentData.id === 'VN') {
       milestones.push({ time: 30, label: '水提供' });
    }
    if (currentData.announceInterval) {
       milestones.push({ time: currentData.announceInterval, label: 'アナウンス開始' });
    }
    if (currentData.foodInterval) {
       milestones.push({ time: currentData.foodInterval, label: '飲食提供開始' });
    }
    if (currentData.decisionPoint) {
       milestones.push({ time: currentData.decisionPoint, label: '降機判断' });
    }
    if (currentData.limit) {
       milestones.push({ time: currentData.limit, label: '上限到達' });
    } else {
       milestones.push({ time: 240, label: '上限なし' }); // 視覚的プレースホルダー
    }

    const grouped = {};
    milestones.forEach(m => {
       if (!grouped[m.time]) grouped[m.time] = [];
       if (!grouped[m.time].includes(m.label)) {
         grouped[m.time].push(m.label);
       }
    });
    
    return Object.keys(grouped).sort((a,b) => Number(a) - Number(b)).map(t => ({
       time: Number(t),
       labels: grouped[t]
    }));
  }, [currentData]);

  const toggleTask = (taskId) => {
    const newChecked = new Set(checkedTasks);
    if (newChecked.has(taskId)) {
      newChecked.delete(taskId);
    } else {
      newChecked.add(taskId);
    }
    setCheckedTasks(newChecked);
  };

  const handleReset = () => {
    if (showResetConfirm) {
      setIsRunning(false);
      setElapsedSeconds(0);
      setCheckedTasks(new Set());
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => {
        setShowResetConfirm(false);
      }, 3000);
    }
  };

  const skipTime = (minutes) => {
    setElapsedSeconds(prev => prev + (minutes * 60));
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMinToText = (mins) => {
    if (mins === 0) return '開始時';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}時間${m}分`;
    if (h > 0) return `${h}時間`;
    return `${m}分`;
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-800 font-sans pb-10">
      <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-wider">Tarmac Delay Assistant</h1>
          </div>
          <div className="text-sm text-blue-200">ANA Operations Manual</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左側カラム：設定とルール */}
        <div className="lg:col-span-1 space-y-6">
          
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-semibold text-slate-700 flex items-center gap-2">
              国・地域を選択
            </div>
            <div className="p-2 grid grid-cols-2 gap-2">
              {Object.values(COUNTRY_DATA).map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    if(country !== c.id) {
                      setCountry(c.id);
                      setElapsedSeconds(0);
                      setIsRunning(false);
                      setCheckedTasks(new Set());
                      setShowResetConfirm(false);
                    }
                  }}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                    country === c.id 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-semibold text-slate-700">
              運航フェーズ
            </div>
            <div className="p-4 flex gap-2">
              {['Departure', 'Arrival', 'Divert'].map(p => {
                const isAvailable = currentData.phases.includes(p);
                const Icon = p === 'Departure' ? PlaneTakeoff : (p === 'Arrival' ? PlaneLanding : AlertCircle);
                return (
                  <button
                    key={p}
                    disabled={!isAvailable}
                    onClick={() => setPhase(p)}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border text-sm gap-1 transition-colors ${
                      !isAvailable ? 'opacity-40 bg-slate-100 cursor-not-allowed' :
                      phase === p ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {p === 'Departure' ? '出発' : p === 'Arrival' ? '到着' : 'Divert'}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="bg-blue-50 rounded-xl border border-blue-100 overflow-hidden">
            <div className="bg-blue-100 px-4 py-3 border-b border-blue-200 font-semibold text-blue-900 flex items-center gap-2">
              <Info className="w-5 h-5" /> 適用ルール ({currentData.name} - {phase})
            </div>
            <div className="p-4 text-sm text-blue-900 space-y-5">
              <div>
                <span className="font-bold block mb-1">カウント開始条件:</span>
                <div className="bg-white p-2 rounded border border-blue-100 shadow-sm text-slate-700">{currentData.rules[phase]?.start || 'N/A'}</div>
              </div>
              <div>
                <span className="font-bold block mb-1">カウントリセット条件:</span>
                <div className="bg-white p-2 rounded border border-blue-100 shadow-sm text-slate-700">{currentData.rules[phase]?.reset || 'N/A'}</div>
              </div>

              {/* 修正箇所：対応タイムライン概要を特記事項の上に配置 */}
              <div>
                <span className="font-bold block mb-2">対応タイムライン概要:</span>
                <div className="bg-white p-4 rounded border border-blue-100 shadow-sm overflow-x-auto">
                  <div className="flex items-start min-w-max relative">
                    <div className="absolute top-[7px] left-4 right-4 h-[2px] bg-blue-200 z-0"></div>
                    
                    {overviewMilestones.map((ms, i) => (
                       <div key={i} className="flex flex-col items-center w-24 relative z-10 flex-shrink-0">
                          <div className={`w-4 h-4 rounded-full border-[3px] mb-2 ${
                            ms.time === 240 && currentData.limit === null 
                              ? 'border-slate-300 bg-slate-100' 
                              : 'border-blue-500 bg-white'
                          }`}></div>
                          <span className="text-xs font-bold text-blue-800">
                            {ms.time === 240 && currentData.limit === null ? '設定なし' : formatMinToText(ms.time)}
                          </span>
                          <span className="text-[10px] text-slate-600 text-center mt-1 leading-tight px-1">
                            {ms.labels.map((l, idx) => <span key={idx} className="block mt-0.5">{l}</span>)}
                          </span>
                       </div>
                    ))}
                  </div>
                </div>
              </div>

              {currentData.specialNotes.length > 0 && (
                <div>
                  <span className="font-bold block mb-1">特記事項:</span>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {currentData.specialNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* 右側カラム：タイマーとチェックリスト */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 修正箇所：タイマーをチェックリストの上に移動 */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-center flex-shrink-0">
            <div className="bg-slate-800 text-white px-4 py-3 font-semibold flex justify-between items-center">
              <span>経過時間</span>
              {isRunning && <span className="flex items-center gap-1 text-xs text-green-400 animate-pulse"><Play className="w-3 h-3"/> 測定中</span>}
            </div>
            <div className="p-6">
              <div className="text-5xl font-mono font-bold tracking-wider text-slate-800 mb-6">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="flex justify-center gap-4">
                {!isRunning ? (
                  <button onClick={() => setIsRunning(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all">
                    <Play className="w-5 h-5" /> スタート
                  </button>
                ) : (
                  <button onClick={() => setIsRunning(false)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all">
                    <Pause className="w-5 h-5" /> 一時停止
                  </button>
                )}
                
                <button 
                  onClick={handleReset} 
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                    showResetConfirm 
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  <RotateCcw className="w-5 h-5" /> 
                  {showResetConfirm ? '本当に？' : 'リセット'}
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center gap-2 text-xs">
                <span className="text-slate-400 flex items-center mr-2"><FastForward className="w-3 h-3 mr-1"/> シミュレーション用:</span>
                <button onClick={() => skipTime(15)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">+15分</button>
                <button onClick={() => skipTime(60)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">+1時間</button>
              </div>
            </div>
          </section>

          {/* チェックリスト（下部） */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
              <span>対応タイムライン / チェックリスト</span>
              <span className="text-sm font-normal text-slate-500">現在経過: <strong className="text-blue-700">{formatMinToText(elapsedMinutes)}</strong></span>
            </div>
            <div className="p-6">
              
              <div className="relative border-l-2 border-slate-200 ml-4 md:ml-10 space-y-8 pb-10">
                {taskGroups.map((group, gIdx) => {
                  
                  const isFuture = group.time > elapsedMinutes;
                  const isPast = group.time <= elapsedMinutes;
                  const timeDiff = group.time - elapsedMinutes;
                  
                  // 未来すぎるタスクは非表示（直近60分まで表示）
                  if (timeDiff > 60 && gIdx > 0) return null; 

                  const isCurrentTarget = timeDiff > 0 && timeDiff <= 30; 

                  return (
                    <div key={group.time} className={`relative ${isFuture ? 'opacity-60' : 'opacity-100'}`}>
                      <div className={`absolute -left-16 md:-left-24 top-1 text-right w-12 md:w-20 font-mono font-bold text-sm md:text-base
                        ${isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                        {formatMinToText(group.time)}
                      </div>
                      
                      <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-white 
                        ${isPast ? 'border-blue-500' : 'border-slate-300'}
                        ${isCurrentTarget ? 'ring-4 ring-blue-100' : ''}
                      `} />

                      <div className="pl-6 space-y-3">
                        {group.tasks.map(task => {
                          const isChecked = checkedTasks.has(task.id);
                          const isDelayed = isPast && !isChecked && group.time > 0; 

                          return (
                            <div 
                              key={task.id} 
                              className={`p-4 rounded-lg border shadow-sm flex items-start gap-4 transition-all cursor-pointer
                                ${isChecked ? 'bg-slate-50 border-slate-200' : 
                                  isDelayed ? (task.isCritical ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300') : 
                                  isPast ? 'bg-white border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100'}
                              `}
                              onClick={() => isPast && toggleTask(task.id)}
                            >
                              <button 
                                disabled={!isPast}
                                className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                  ${!isPast ? 'border-slate-200 bg-slate-50' : 
                                    isChecked ? 'border-green-500 bg-green-500 text-white' : 
                                    isDelayed && task.isCritical ? 'border-red-400 bg-white' :
                                    isDelayed ? 'border-amber-400 bg-white' :
                                    'border-slate-300 hover:border-blue-400 bg-white'}
                                `}
                              >
                                {isChecked && <Check className="w-4 h-4" />}
                              </button>

                              <div className={`flex-1 ${isChecked ? 'opacity-60 line-through' : ''}`}>
                                <h3 className={`font-bold flex items-center gap-2 
                                  ${isDelayed && !isChecked && task.isCritical ? 'text-red-700' :
                                    isDelayed && !isChecked ? 'text-amber-700' :
                                    task.isCritical && isPast ? 'text-red-600' :
                                    'text-slate-800'
                                  }`}>
                                  {task.title}
                                  {task.isCritical && <AlertTriangle className="w-4 h-4" />}
                                </h3>
                                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{task.desc}</p>
                              </div>
                              
                              {!isChecked && isDelayed && (
                                <span className={`text-xs px-2 py-1 rounded font-bold whitespace-nowrap
                                  ${task.isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                                `}>
                                  未完了
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center text-slate-400 text-sm mt-4 italic">
                ... 規定時間以降も要件は継続します ...
              </div>

            </div>
          </section>
        </div>

      </main>
    </div>
  );
};

// プレビュー表示用 兼 デフォルトインポート対応
export default TarmacView;