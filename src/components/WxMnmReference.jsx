import React, { useState } from 'react';
import { SafeIcon } from './SharedComponents';

// --- [5-1] WxMnmReference (WX/MNM) ---   [5-3]の上まで省略
export const WxMnmReference = () => {
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