import React from 'react';
import { SafeIcon } from './SharedComponents';

export const QuickGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-w-2xl w-full max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center gap-2 text-rose-400 border-b border-slate-700 pb-2 shrink-0">
          <SafeIcon name="HelpCircle" className="w-6 h-6" />
          <h2 className="text-lg font-black text-white">7PT クイックガイド</h2>
        </div>

        {/* スクロール可能なコンテンツエリア */}
        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-5 text-sm text-slate-300">
          
          <section>
            <h3 className="text-emerald-400 font-bold mb-1 border-l-4 border-emerald-400 pl-2">1. データの読み込み (LOAD)</h3>
            <p className="text-xs leading-relaxed ml-1">
              ヘッダーの <span className="bg-emerald-600 text-white px-1 rounded font-bold">LOAD</span> ボタンから、PDF（Information Package）を選択するか、テキストをペーストすることで、<span className="text-emerald-300 font-bold">機番・便名・重量・温度・経路</span>などを読み込んで各計算に自動反映されます。
            </p>
          </section>

          <section>
            <h3 className="text-sky-400 font-bold mb-1 border-l-4 border-sky-400 pl-2">2. ヘッダーボタンの機能</h3>
            <ul className="text-xs leading-relaxed space-y-1.5 pl-1">
              <li><span className="bg-sky-600 px-1 rounded text-white font-mono font-bold">PANA</span> / <span className="bg-indigo-600 px-1 rounded text-white font-mono font-bold">INMA</span> / <span className="bg-emerald-600 px-1 rounded text-white font-mono font-bold">DOM</span> : 機内Wi-Fiポータルへ接続します。（PANAを長押しでパスワード登録）</li>
              <li><span className="bg-purple-600 px-1 rounded text-white font-mono font-bold">DRM</span> : 欧州線でのDRM送信のため、抽出した便名を件名に入れた状態でGmailを起動します。</li>
              <li><span className="bg-orange-600 px-1 rounded text-white font-mono font-bold">BDYC</span> : 当該機番のBuddycomを起動します。</li>
              <li><span className="bg-yellow-600 px-1 rounded text-white font-mono font-bold">FR24</span> : FlightRadar24が起動し、便名をペーストできます。</li>
              <li><span className="bg-pink-600 px-1 rounded text-white font-mono font-bold">ALC</span> : リモートアルコール検査（Google Meet等）を起動します。</li>
              <li><span className="bg-sky-600 px-1 rounded text-white font-mono font-bold">CKIN</span> : ANAオンラインチェックインを開きます。</li>
              <li><span className="bg-emerald-600 px-1 rounded text-white font-mono font-bold">UPDT</span> : アプリを最新バージョンに更新します。</li>
            </ul>
          </section>

          <section>
            <h3 className="text-amber-400 font-bold mb-2 border-l-4 border-amber-400 pl-2">3. 各機能・タブの説明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1 text-xs">
              
              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">DASHBOARD</div>
                <p className="leading-relaxed">PTOW/PLDWを読み込んでVREF、Flap Up Maneuver、Hold Speedや、着陸時のMAX AUTO / MAN 距離などをスライダーと連動してリアルタイムに計算します。<br/><span className="text-rose-400">※ ENG INOPを選ぶとPTOWを着陸重量に反映するのでTAKEOFF RTNが可能かの判断に使用できます。</span></p>
              </div>

              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">TFC INFO</div>
                <p className="leading-relaxed">読み込んだ便の前後の便を表示します。</p>
              </div>

              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">WX/MNM</div>
                <p className="leading-relaxed">WX悪化時のフローやFPL記号の説明を確認できます。</p>
              </div>

              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">ETOPS</div>
                <p className="leading-relaxed">欧州線のみADDITIONAL FUEL要否の判断ツールや、HF周波数の取得を行えます。</p>
              </div>

              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">DOCS</div>
                <p className="leading-relaxed">危険品の混載確認や、配慮を要する旅客の情報を確認できます。</p>
              </div>

              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">スマカタ</div>
                <p className="leading-relaxed">よく使うマニュアル・ドキュメントへの直リンク集です。</p>
              </div>

              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">REST CALC</div>
                <p className="leading-relaxed">REST計算ツール。T/O TIMEはSTD + AVG TAXI TIMEをデフォルトに設定しています。</p>
              </div>

              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">APP CALC</div>
                <p className="leading-relaxed">LDA時にFAFからMXまでのFPA計算、ILS Z 34Lでの高温時のGS CAPTURE予測、TRAFFIC PATTERNとMIN CIRCでの降下開始点を算出します。</p>
              </div>

              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">BUDDY COMM</div>
                <p className="leading-relaxed">選択した機番でBuddycomにログインします。</p>
              </div>

              <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                <div className="text-amber-300 font-bold mb-0.5">XWIND</div>
                <p className="leading-relaxed">TAIL LIMITを選択可能な横風・背風計算ツールです。</p>
              </div>

            </div>
          </section>

        </div>

        <button onClick={onClose} className="shrink-0 w-full mt-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">
          閉じる
        </button>
      </div>
    </div>
  );
};