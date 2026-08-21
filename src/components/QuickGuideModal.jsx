import React, { useState, useEffect } from 'react';
import { SafeIcon } from './SharedComponents';

export const QuickGuideModal = ({ isOpen, onClose }) => {
  const [hideSetup, setHideSetup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('hideSetupGuide');
      setHideSetup(stored === 'true');
    }
  }, [isOpen]);

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setHideSetup(checked);
    if (checked) {
      localStorage.setItem('hideSetupGuide', 'true');
    } else {
      localStorage.removeItem('hideSetupGuide');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-w-2xl w-full max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center gap-2 text-rose-400 border-b border-slate-700 pb-2 shrink-0">
          <SafeIcon name="HelpCircle" className="w-6 h-6" />
          <h2 className="text-lg font-black text-white">7PT クイックガイド</h2>
        </div>

        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6 text-sm text-slate-300">

          {!hideSetup && (
            <div className="bg-[#0b2447] border border-blue-500/50 rounded-xl p-4 shadow-inner relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] opacity-10">
                <SafeIcon name="Smartphone" className="w-40 h-40" />
              </div>
              
              <div className="flex items-center gap-2 text-blue-400 font-black text-sm md:text-base mb-2 relative z-10">
                <SafeIcon name="AlertCircle" className="w-5 h-5" />
                <span>【重要】初回セットアップのお願い</span>
              </div>
              
              <p className="text-xs md:text-sm text-blue-100 leading-relaxed font-medium relative z-10 mb-3">
                本アプリは<span className="text-amber-400 font-bold mx-1">「ホーム画面に追加」</span>してご利用いただくよう設計されています。<br className="hidden md:block"/>
                ブラウザの検索バーなどを消し、全画面で快適に操作するために、<br className="hidden md:block"/>
                以下の手順でホーム画面に追加してからお使いください。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 relative z-10 mb-3">
                <div className="bg-[#121c2f] border border-blue-900/50 rounded-lg p-2.5 flex items-center gap-3">
                  <div className="text-blue-400 shrink-0"><SafeIcon name="Share" className="w-6 h-6" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-blue-400 font-black tracking-wider">STEP 1</span>
                    <span className="text-xs text-white font-bold leading-tight mt-0.5">ブラウザの<br/>「共有マーク」をタップ</span>
                  </div>
                </div>
                
                <div className="bg-[#121c2f] border border-blue-900/50 rounded-lg p-2.5 flex items-center gap-3">
                  <div className="text-sky-400 shrink-0"><SafeIcon name="PlusSquare" className="w-6 h-6" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-sky-400 font-black tracking-wider">STEP 2</span>
                    <span className="text-xs text-white font-bold leading-tight mt-0.5">メニューから<br/>「ホーム画面に追加」</span>
                  </div>
                </div>

                <div className="bg-[#062c21] border border-emerald-900/50 rounded-lg p-2.5 flex items-center gap-3">
                  <div className="text-emerald-400 shrink-0"><SafeIcon name="Smartphone" className="w-6 h-6" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-400 font-black tracking-wider">STEP 3</span>
                    <span className="text-xs text-white font-bold leading-tight mt-0.5">追加されたアイコンから<br/>アプリを起動！</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 relative z-10 border-t border-blue-800/50 pt-2">
                <input 
                  type="checkbox" 
                  id="hideSetupCheckbox" 
                  checked={hideSetup}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="hideSetupCheckbox" className="text-xs text-blue-200 cursor-pointer select-none">
                  今後このセットアップ案内を表示しない
                </label>
              </div>
            </div>
          )}
          
          <section>
            <h3 className="text-emerald-400 font-bold mb-2 border-l-4 border-emerald-400 pl-2">1. データの読み込み (LOAD)</h3>
            <p className="text-xs leading-relaxed ml-1">
              ヘッダーの <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">LOAD</span> ボタンから、PDF（Information Package）を選択するか、テキストをペーストすることで、機番・便名・重量・温度・経路などを読み込んで各計算に自動反映されます。
            </p>
          </section>

          <section>
            <h3 className="text-sky-400 font-bold mb-2 border-l-4 border-sky-400 pl-2">2. ヘッダーボタンの機能</h3>
            <ul className="text-xs leading-relaxed space-y-2 pl-1">
              <li><span className="bg-sky-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">PANA</span> <span className="bg-indigo-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">INMA</span> <span className="bg-emerald-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">DOM</span> : 機内Wi-Fiポータルへ接続します。（PANAを長押しでパスワード登録。パスワードの入力時にペースト可能。）</li>
              <li><span className="bg-purple-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">DRM</span> : 欧州線でのDRM送信のため抽出した便名を件名に入れた状態でGmailを起動します。</li>
              <li><span className="bg-orange-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">BDYC</span> : 当該機番のBuddycomを起動します。</li>
              <li><span className="bg-yellow-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">FR24</span> : FlightRadar24が起動し、便名にペーストできます。</li>
              <li><span className="bg-pink-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">ALC</span> : リモートアルコール検査を起動します。</li>
              <li><span className="bg-sky-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">CKIN</span> : オンラインチェックイン画面を開きます。</li>
              <li><span className="bg-emerald-600 px-1.5 py-0.5 rounded text-white font-mono font-bold">UPDT</span> : アプリ更新を行います。</li>
            </ul>
          </section>

          <section>
            <h3 className="text-amber-400 font-bold mb-3 border-l-4 border-amber-400 pl-2">3. 各機能・タブの説明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1 text-xs">
              
              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">DASHBOARD</div>
                <p className="leading-relaxed">PTOW/PLDWを読み込んでVREF、Flap Up Maneuver、Hold Speedや、着陸時のMAX AUTO / MAN 距離などをスライダーと連動してリアルタイムに計算します。<br/><span className="text-rose-400 mt-1 inline-block">※ ENG INOPを選ぶとPTOWを着陸重量に反映するのでTAKEOFF RTNが可能かの判断に使用できます。</span></p>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">TFC INFO</div>
                <p className="leading-relaxed">読み込んだ便の前後の便を表示します。また、便名を入力することで関連機の情報を表示します。</p>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">WX/MNM</div>
                <p className="leading-relaxed">WX悪化時のフローやFPL記号の説明を確認できます。</p>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">ETOPS</div>
                <p className="leading-relaxed">欧州線のみADDITIONAL FUEL要否の判断ツール、HF周波数の取得、ETOPS関連情報を確認できます。</p>
              </div>
              
              <div className="bg-slate-900/50 p-3 rounded border border-slate-700 md:col-span-2">
                <div className="text-amber-300 font-bold mb-2">NAVLOG</div>
                <ul className="leading-relaxed list-disc pl-4 space-y-1">
                  <li>DIST CK機能あり。</li>
                  <li>同じLOGをLOADしている状況で、SYNCボタンで記録したものの引き継ぎ機能が使えます。</li>
                  <li>STDからAVG TAXI OUT/ INでETAを表示し、そのETAに基づき目的地の天気と予想気温を表示します。</li>
                  <li>NOWボタンを押すと次のWPTに移動します。</li>
                  <li>ET/LTは実飛行時間に合わせて変化します。</li>
                  <li>ETOはATOを入力することで変化しますが、TIME DIFFはTAKEOFF TIMEからの誤差を表示します。</li>
                  <li>TIME DIFFとFUEL DIFFを上部ヘッダーに固定してグラフ表示できます。</li>
                  <li>最寄りのETOPS ALTNをハイライト表示します。</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">DOCS</div>
                <p className="leading-relaxed">危険品の混載確認や、配慮を要する旅客情報の確認ができます。</p>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">スマカタ</div>
                <p className="leading-relaxed">よく使うものの直リンクです。</p>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">REST CALC</div>
                <p className="leading-relaxed">REST計算ツールです。T/O TIMEはSTD+AVG TAXI TIMEがDEFAULTになります。</p>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">APP CALC</div>
                <p className="leading-relaxed">温度変化によるLDA時のFAFからMXまでのFPA計算、ILSZ34Lでは高温時にFAF手前のどれくらいでGS CAPTUREするかを算出、TRAFFIC PATTERNとMIN CIRCでは降下開始点を算出します。</p>
              </div>
              
              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">TARMAC</div>
                <p className="leading-relaxed">各国のルールを適用したフローチャートを表示します。</p>
              </div>

              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-1">XWIND</div>
                <p className="leading-relaxed">TAIL LIMITを選択可能な横風計算ツールです。</p>
              </div>

            </div>
          </section>

        </div>

        <button onClick={onClose} className="shrink-0 w-full mt-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg">
          閉じる
        </button>
      </div>
    </div>
  );
};