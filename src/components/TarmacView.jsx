import React, { useState, useEffect, useMemo } from 'react';
import { SafeIcon } from './SharedComponents';

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
      Departure: { start: 'ドアクローズした時点', reset: 'ドアオープンし降機可能と伝えた時点 / 離陸した時点' },
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
    tasks.push({ time: 30, id: 'vn_water', title: '飲料水の提供', desc: '旅客へ飲料水を提供すること', isUrgent: true, isCritical: false });
  }

  for (let m = data.announceInterval; m <= 300; m += data.announceInterval) {
    tasks.push({ time: m, id: `ann_${m}`, title: '機内アナウンス', desc: `遅延の状況(理由、今後の見込み等)についてアナウンスを実施`, isUrgent: false });
  }

  if (data.foodInterval) {
    for (let m = data.foodInterval; m <= 300; m += data.foodInterval) {
      tasks.push({ time: m, id: `food_${m}`, title: '飲食物の提供', desc: `すべての旅客に対して飲み物と食べ物を提供 (安全上支障がある場合を除く)`, isUrgent: true });
    }
  }

  if (data.decisionPoint) {
    tasks.push({ 
      time: data.decisionPoint, id: 'decision', title: '【重要】降機・運航継続の判断', 
      desc: countryId === 'CN' ? '離陸予定時刻が不明な場合は、降機の必要性を基地長に確認。' : '上限前に降機機会を提供するため、GTBするか運航継続するか空港基地長と協議し判断する。', 
      isUrgent: true, isCritical: true
    });
  }

  if (data.limit) {
    tasks.push({ 
      time: data.limit, id: 'limit', title: '【限界】上限時間到達', 
      desc: `これ以上の機内停留は不可。速やかに降機の機会を提供すること。(${data.limitNote || ''})`, 
      isUrgent: true, isCritical: true
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

export const TarmacView = () => {
  const [country, setCountry] = useState('US');
  const [phase, setPhase] = useState('Departure');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState(new Set());
  
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
    if (window.confirm('タイマーとタスクの状況を全てリセットしますか？')) {
      setIsRunning(false);
      setElapsedSeconds(0);
      setCheckedTasks(new Set());
    }
  };

  const skipTime = (minutes) => setElapsedSeconds(prev => prev + (minutes * 60));

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
    <div className="flex flex-col lg:flex-row gap-4 w-full animate-in fade-in">
      
      {/* 左カラム：操作パネル (幅を5/12に拡張して見やすく) */}
      <div className="w-full lg:w-5/12 flex flex-col gap-4">
        
        {/* タイマー本体 */}
        <div className="bg-slate-800/80 rounded-xl shadow-lg border border-slate-600 overflow-hidden text-center flex flex-col">
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-700 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-slate-300">経過時間</span>
            {isRunning && <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 animate-pulse"><SafeIcon name="Play" className="w-3 h-3"/> 測定中</span>}
          </div>
          <div className="p-4 flex flex-col flex-1 justify-center">
            <div className="text-4xl lg:text-5xl font-mono font-black tracking-wider text-white mb-4 drop-shadow-md">
              {formatTime(elapsedSeconds)}
            </div>
            <div className="flex justify-center gap-2">
              {!isRunning ? (
                <button onClick={() => setIsRunning(true)} className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold shadow-lg shadow-emerald-900/20 transition-all border border-emerald-500 text-sm">
                  <SafeIcon name="Play" className="w-4 h-4" /> スタート
                </button>
              ) : (
                <button onClick={() => setIsRunning(false)} className="flex-1 flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-lg font-bold shadow-lg shadow-amber-900/20 transition-all border border-amber-500 text-sm">
                  <SafeIcon name="Pause" className="w-4 h-4" /> 一時停止
                </button>
              )}
              <button onClick={handleReset} className="flex-1 flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-lg font-bold transition-all border border-slate-500 text-sm">
                <SafeIcon name="RotateCcw" className="w-4 h-4" /> リセット
              </button>
            </div>

            {/* Sim controls */}
            <div className="mt-4 pt-3 border-t border-slate-700 flex justify-center items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center font-bold text-[10px]"><SafeIcon name="FastForward" className="w-3 h-3 mr-1"/> シミュレーション用:</span>
              <button onClick={() => skipTime(15)} className="px-2 py-1 bg-slate-900 border border-slate-600 hover:bg-slate-700 rounded text-slate-300 font-mono text-[10px]">+15分</button>
              <button onClick={() => skipTime(60)} className="px-2 py-1 bg-slate-900 border border-slate-600 hover:bg-slate-700 rounded text-slate-300 font-mono text-[10px]">+1時間</button>
            </div>
          </div>
        </div>

        {/* 国選択 */}
        <div className="bg-slate-800/80 rounded-xl shadow-lg border border-slate-600 overflow-hidden">
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-700 text-xs font-bold text-slate-300">
            適用国・地域を選択
          </div>
          <div className="p-2 grid grid-cols-2 gap-2">
            {Object.values(COUNTRY_DATA).map(c => (
              <button
                key={c.id}
                onClick={() => {
                  if(country !== c.id) {
                    if(elapsedSeconds > 0 && !window.confirm('国を変更するとタイマーがリセットされます。よろしいですか？')) return;
                    setCountry(c.id); setElapsedSeconds(0); setIsRunning(false); setCheckedTasks(new Set());
                  }
                }}
                className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                  country === c.id 
                    ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-900/30' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* フェーズ選択 */}
        <div className="bg-slate-800/80 rounded-xl shadow-lg border border-slate-600 overflow-hidden">
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-700 text-xs font-bold text-slate-300">
            運航フェーズ
          </div>
          <div className="p-2 flex gap-2">
            {['Departure', 'Arrival', 'Divert'].map(p => {
              const isAvailable = currentData.phases.includes(p);
              const iconName = p === 'Departure' ? 'PlaneTakeoff' : (p === 'Arrival' ? 'PlaneLanding' : 'AlertCircle');
              return (
                <button
                  key={p}
                  disabled={!isAvailable}
                  onClick={() => setPhase(p)}
                  className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] font-bold gap-1 transition-all ${
                    !isAvailable ? 'opacity-30 bg-slate-900 border-slate-800 cursor-not-allowed text-slate-500' :
                    phase === p ? 'bg-sky-600 border-sky-400 text-white shadow-md' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <SafeIcon name={iconName} className="w-4 h-4" />
                  {p === 'Departure' ? '出発' : p === 'Arrival' ? '到着' : 'Divert'}
                </button>
              )
            })}
          </div>
        </div>

        {}
        {/* ルール詳細 (より大きく目立つように) */}
        <div className="bg-slate-900/90 rounded-xl border-2 border-sky-500/50 shadow-lg overflow-hidden flex flex-col">
          <div className="bg-sky-900/40 px-3 py-2.5 border-b border-sky-500/50 text-sm lg:text-base font-black text-sky-300 flex items-center gap-2">
            <SafeIcon name="Info" className="w-4 h-4 lg:w-5 lg:h-5" /> 適用ルール・注意事項
          </div>
          <div className="p-3 lg:p-4 text-xs lg:text-sm text-slate-200 flex flex-col gap-3.5">
            <div>
              <span className="font-black text-sky-400 flex items-center gap-1.5 mb-1.5">
                <SafeIcon name="PlayCircle" className="w-3.5 h-3.5" /> カウント開始条件:
              </span>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-600 font-bold shadow-inner">
                {currentData.rules[phase]?.start || 'N/A'}
              </div>
            </div>
            <div>
              <span className="font-black text-sky-400 flex items-center gap-1.5 mb-1.5">
                <SafeIcon name="RotateCcw" className="w-3.5 h-3.5" /> カウントリセット条件:
              </span>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-600 font-bold shadow-inner">
                {currentData.rules[phase]?.reset || 'N/A'}
              </div>
            </div>
            {currentData.specialNotes.length > 0 && (
              <div className="mt-1">
                <span className="font-black text-amber-400 flex items-center gap-1.5 mb-2 text-sm lg:text-base">
                  <SafeIcon name="AlertTriangle" className="w-4 h-4 lg:w-5 lg:h-5" /> 特記事項・注意事項:
                </span>
                <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-500/40 shadow-inner">
                  <ul className="list-disc pl-4 space-y-2 text-amber-100 font-bold text-xs lg:text-sm leading-relaxed">
                    {currentData.specialNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      {/* 右カラム：タイムライン（チェックリスト） (幅を7/12にしてコンパクトに) */}
      <div className="w-full lg:w-7/12">
        <div className="bg-slate-800/80 rounded-xl shadow-lg border border-slate-600 overflow-hidden h-full flex flex-col">
          <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700 font-bold text-slate-200 flex justify-between items-center shrink-0">
            <span className="text-sm">対応タイムライン / チェックリスト</span>
            <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded border border-slate-600 text-sky-400">経過: {formatMinToText(elapsedMinutes)}</span>
          </div>
          
          <div className="flex-1 p-3 lg:p-5 overflow-y-auto custom-scrollbar bg-slate-900/30">
            {/* マージンを小さくしてコンパクト化 */}
            <div className="relative border-l-2 border-slate-700 ml-[50px] md:ml-[60px] space-y-4 pb-4">
              {taskGroups.map((group, gIdx) => {
                const isFuture = group.time > elapsedMinutes;
                const isPast = group.time <= elapsedMinutes;
                const timeDiff = group.time - elapsedMinutes;
                
                // 未来の遠すぎるタスクは隠す（1時間以上先）
                if (timeDiff > 60 && gIdx > 0) return null; 
                const isCurrentTarget = timeDiff > 0 && timeDiff <= 30; 

                return (
                  <div key={group.time} className={`relative transition-opacity duration-500 ${isFuture ? 'opacity-50' : 'opacity-100'}`}>
                    
                    {/* Time Marker */}
                    <div className={`absolute -left-[60px] md:-left-[70px] top-1 text-right w-[50px] md:w-[60px] font-mono font-black text-[10px] md:text-xs
                      ${isPast ? 'text-sky-400' : 'text-slate-500'}`}>
                      {formatMinToText(group.time)}
                    </div>
                    
                    {/* Timeline Dot (少し小さく) */}
                    <div className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 bg-slate-900 transition-colors duration-300
                      ${isPast ? 'border-sky-400' : 'border-slate-600'}
                      ${isCurrentTarget ? 'ring-4 ring-sky-900/50 bg-sky-900' : ''}
                    `} />

                    {/* Tasks in this time block */}
                    <div className="pl-4 space-y-2">
                      {group.tasks.map(task => {
                        const isChecked = checkedTasks.has(task.id);
                        const isDelayed = isPast && !isChecked && group.time > 0; // missed

                        return (
                          <div 
                            key={task.id} 
                            // パディングとギャップを縮小してコンパクト化
                            className={`p-2.5 lg:p-3 rounded-xl border shadow-md flex items-start gap-2.5 transition-all duration-300 cursor-pointer select-none
                              ${isChecked ? 'bg-emerald-900/20 border-emerald-900/50' : 
                                isDelayed ? (task.isCritical ? 'bg-rose-950/40 border-rose-500/50' : 'bg-amber-950/40 border-amber-500/50') : 
                                isPast ? 'bg-slate-800 border-sky-500/50 shadow-sky-900/20' : 'bg-slate-800/50 border-slate-700'}
                            `}
                            onClick={() => isPast && toggleTask(task.id)}
                          >
                            {/* Checkbox (少し小さく) */}
                            <button 
                              disabled={!isPast}
                              className={`mt-0.5 shrink-0 w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 flex items-center justify-center transition-all
                                ${!isPast ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed' : 
                                  isChecked ? 'border-emerald-500 bg-emerald-500 text-white scale-110' : 
                                  isDelayed && task.isCritical ? 'border-rose-500 bg-rose-950' :
                                  isDelayed ? 'border-amber-500 bg-amber-950' :
                                  'border-slate-400 hover:border-sky-400 bg-slate-800'}
                              `}
                            >
                              {isChecked && <SafeIcon name="Check" className="w-2.5 h-2.5 lg:w-3 lg:h-3" />}
                            </button>

                            <div className={`flex-1 ${isChecked ? 'opacity-50' : ''}`}>
                              {/* タイトルのフォントサイズを縮小 */}
                              <h3 className={`font-bold text-[11px] lg:text-xs flex items-center gap-1.5 transition-colors
                                ${isChecked ? 'text-emerald-400 line-through' :
                                  isDelayed && task.isCritical ? 'text-rose-400' :
                                  isDelayed ? 'text-amber-400' :
                                  task.isCritical && isPast ? 'text-rose-400' :
                                  'text-white'
                                }`}>
                                {task.title}
                                {task.isCritical && !isChecked && <SafeIcon name="AlertTriangle" className="w-3 h-3" />}
                              </h3>
                              {/* 説明文のフォントサイズを縮小 */}
                              <p className={`text-[9px] lg:text-[10px] mt-0.5 leading-relaxed ${isChecked ? 'text-slate-500 line-through' : 'text-slate-400'}`}>
                                {task.desc}
                              </p>
                            </div>
                            
                            {/* Status Badge */}
                            {!isChecked && isDelayed && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider whitespace-nowrap border
                                ${task.isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}
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
            
            {/* Bottom filler */}
            <div className="text-center text-slate-500 text-[10px] mt-4 italic font-bold">
              ... 規定時間以降も要件・アナウンスは継続します ...
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};