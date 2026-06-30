import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';

// ==========================================
// ★ UTILITY FUNCTIONS & COMPONENTS
// ==========================================

const SafeIcon = ({ name, className }) => {
    const Icon = LucideIcons[name];
    if (!Icon) return null;
    return <Icon className={className} />;
};

// TAS(True Air Speed) 計算ユーティリティ
const calculateTAS = (ias, elevationFt, oatC) => {
    const iasNum = Number(ias);
    const elevNum = Number(elevationFt);
    const oatNum = Number(oatC);
    if (isNaN(iasNum) || isNaN(elevNum) || isNaN(oatNum) || iasNum === 0) return 0;

    const T0 = 288.15; // 海面標準温度 (K)
    const L = 0.0019812; // 気温減率 (K/ft)

    const h = Math.max(0, elevNum);
    const T_act = oatNum + 273.15; // 実際の気温 (K)

    // 気圧比の計算
    const P_ratio = Math.pow((1 - (L * h) / T0), 5.25588);
    // 空気密度比 (σ)
    const sigma = P_ratio * (T0 / T_act);

    return Math.round(iasNum / Math.sqrt(sigma));
};

// 風を考慮した偏流角（WCA）と対地速度（GS）を計算するユーティリティ
const calculateHeadingAndGS = (trackAngleRad, tas, windVx, windVy) => {
    // Trackに対する横風成分 (W_cross = Wind_x * sin(Track) - Wind_y * cos(Track))
    const crossWindComp = windVx * Math.sin(trackAngleRad) - windVy * Math.cos(trackAngleRad);

    // 偏流角 (Wind Correction Angle)
    const ratio = Math.max(-0.99, Math.min(0.99, crossWindComp / tas)); // 安全のためのリミット
    const wca = Math.asin(ratio);

    // 目標のHeading
    const headingRad = trackAngleRad + wca;

    // 対地速度 (Ground Speed)
    const tailWindComp = windVx * Math.cos(trackAngleRad) + windVy * Math.sin(trackAngleRad);
    const gs = tas * Math.cos(wca) + tailWindComp;

    return { headingRad, gs: Math.max(1, gs) }; // GSが負にならないよう制限
};

// 風を考慮した旋回軌跡（トロコイド曲線）の座標配列を生成する関数
const generateTurnPoints = (startAngle, endAngle, radiusTAS, tas, windVx, windVy, numPoints = 30) => {
    const points = [];
    const angleDiff = endAngle - startAngle;
    const turnTimeHours = Math.abs(angleDiff) * radiusTAS / tas;
    const isLeftTurn = angleDiff > 0; // 角度が増える方向を左旋回(反時計回り)とする

    // 旋回開始点(0,0)から見た旋回中心の相対位置
    const centerAngle = startAngle + (isLeftTurn ? Math.PI / 2 : -Math.PI / 2);
    const centerX = radiusTAS * Math.cos(centerAngle);
    const centerY = radiusTAS * Math.sin(centerAngle);

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const currentAngle = startAngle + angleDiff * t;
        const posAngle = currentAngle + (isLeftTurn ? -Math.PI / 2 : Math.PI / 2);

        // 対気的な円弧上の位置
        const airX = centerX + radiusTAS * Math.cos(posAngle);
        const airY = centerY + radiusTAS * Math.sin(posAngle);

        // 風によるドリフト量 (時間 * 風速)
        const driftX = windVx * (turnTimeHours * t);
        const driftY = windVy * (turnTimeHours * t);

        points.push({ x: airX + driftX, y: airY + driftY });
    }
    return points;
};

// ==========================================
// ★ SLIDER INPUT COMPONENT (マニュアル入力専用)
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
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={handleNumberChange}
                        onBlur={handleBlur}
                        className={`border font-mono font-black text-base lg:text-lg px-1.5 py-0 rounded w-14 lg:w-16 text-right focus:outline-none transition-colors bg-slate-800 border-slate-600 text-white focus:border-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                    {rightAddon}
                </div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value === '' ? min : value}
                onChange={handleSliderChange}
                className={`w-full h-1 lg:h-1.5 bg-slate-600 rounded-full appearance-none cursor-pointer transition-all mt-1 ${accentClass}`}
            />
        </div>
    );
};

// ==========================================
// ★ GRAPHIC COMPONENTS
// ==========================================

const TrafficPatternGraphic = ({ drawDataLT, drawDataRT, drawDataDB }) => {
    if (!drawDataLT || !drawDataRT) return null;

    const rwyLengthNM = 1.5;
    const rwyHalf = rwyLengthNM / 2;

    const getMinX = (data) => {
        let min = Math.min(
            data.ptFinalStart?.x || 0,
            data.ptFinalTransOutStart?.x || 0,
            data.ptFinalTurnStart?.x || 0,
            data.ptBaseEnd?.x || 0,
            data.ptBaseStart?.x || 0,
            data.ptBaseTransOutStart?.x || 0,
            data.ptBaseTurnStart?.x || 0,
            data.ptDwTransInStart?.x || 0,
            data.ptDwStart?.x || 0
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


// ==========================================
// ★ MAIN APP COMPONENT
// ==========================================

export default function App() {
    const [activeTab, setActiveTab] = useState('path');

    // --- MANUAL STATES ---
    const [fafAlt, setFafAlt] = useState(1500);
    const [distMapFaf, setDistMapFaf] = useState(3.0);
    const [distThrMap, setDistThrMap] = useState(1.5);
    const [elev, setElev] = useState(0);
    const [oat, setOat] = useState(15);
    const [gs, setGs] = useState(145); // Target APP SPD (IAS)

    const [wind, setWind] = useState(0);
    const [crossWind, setCrossWind] = useState(0);
    const [rwyTrk, setRwyTrk] = useState(360);

    const [tfpAlt, setTfpAlt] = useState(1500);
    const [tfpPatternWidth, setTfpPatternWidth] = useState(2.5);
    const [tfpGsDw, setTfpGsDw] = useState(170); // Target SPD @ DW (IAS)
    const [bankBase, setBankBase] = useState(25);
    const [bankFinal, setBankFinal] = useState(20);

    const [mda, setMda] = useState(600);
    const [circlingPatternWidth, setCirclingPatternWidth] = useState(1.5);
    const [circlingAppSpd, setCirclingAppSpd] = useState(145);

    // --- Number Conversions ---
    const numElev = Number(elev) || 0;
    const numOat = Number(oat) || 0;
    // Calculate ISA Deviation based on Elevation and manual OAT
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

        // Manual Logic: DW IAS, and Base/Final IAS derived loosely from DW input.
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
    // DYNAMIC CARDS CALCULATION (代表事例の動的計算)
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
        const fafAltInd = 1200;
        const distNM = 3.6;
        const elev = 16;
        const tch = 50;
        const roahIsaTempAtElev = 15 - 1.98 * (elev / 1000);
        const roahIsaD = oat - roahIsaTempAtElev;
        const fafTempCorrection = 4 * roahIsaD * ((fafAltInd - elev) / 1000);
        const trueFafAlt = fafAltInd + fafTempCorrection;
        const heightDiff = trueFafAlt - (elev + tch);
        const distFt = distNM * 6076.1154;
        return Math.atan(heightDiff / distFt) * (180 / Math.PI);
    };

    const calcMmmxAngle = (oat) => {
        const fafAltInd = 8900;
        const distNM = 4.7; // 4.0 + 0.7
        const elev = 7287;
        const tch = 50;
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
        const fafAltInd = 5000;
        const distNM = 11.6;
        const elev = 35;
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
        const fafAltInd = 4000;
        const distNM = 9.6;
        const elev = 55;
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
                            className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'path' ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-slate-400 border border-transparent hover:bg-slate-700'
                                }`}
                        >
                            <SafeIcon name="TrendingDown" className="w-3 h-3 shrink-0" />
                            <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">3.00° PATH</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('pattern')}
                            className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ml-1 shrink-0 ${activeTab === 'pattern' ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-slate-400 border border-transparent hover:bg-slate-700'
                                }`}
                        >
                            <SafeIcon name="Navigation" className="w-3 h-3 shrink-0" />
                            <span className="text-[10px] md:text-xs font-black tracking-widest whitespace-nowrap">TRAFFIC PATTERN</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('circling')}
                            className={`px-3 py-1 rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 ml-1 shrink-0 ${activeTab === 'circling' ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-slate-400 border border-transparent hover:bg-slate-700'
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
                                                    FAF➔TGT<br /><span className="text-[8px] opacity-80 leading-none">{angleMap.toFixed(2)}°</span>
                                                </td>
                                                {tableGsValues.map(g => (
                                                    <td key={g} className={`text-[11px] lg:text-sm font-mono font-bold py-0.5 px-1 leading-none ${g === closestTas ? 'bg-indigo-900/30 text-white' : 'text-slate-300'}`}>
                                                        {Math.round(g * 101.268 * Math.tan(angleMap * Math.PI / 180))}
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr className="border-b border-slate-700/30 bg-transparent">
                                                <td className="text-[9px] lg:text-[10px] font-black text-emerald-400 py-0.5 px-2 border-r border-slate-700/50 leading-tight sticky left-0 bg-slate-900/90 backdrop-blur z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                                    VDP➔THR<br /><span className="text-[8px] opacity-80 leading-none">{angleRwy.toFixed(2)}°</span>
                                                </td>
                                                {tableGsValues.map(g => (
                                                    <td key={g} className={`text-[11px] lg:text-sm font-mono font-bold py-0.5 px-1 leading-none ${g === closestTas ? 'bg-indigo-900/30 text-white' : 'text-emerald-300'}`}>
                                                        {Math.round(g * 101.268 * Math.tan(angleRwy * Math.PI / 180))}
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr className="last:border-none bg-slate-800/20">
                                                <td className="text-[9px] lg:text-[10px] font-black text-amber-400 py-0.5 px-2 border-r border-slate-700/50 leading-tight sticky left-0 bg-slate-800/90 backdrop-blur z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                                                    CDA<br /><span className="text-[8px] opacity-80 leading-none">{angleCda.toFixed(2)}°</span>
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
                                    { id: "RJFT 07", alt: 2400, trk: 72, elev: 601 },
                                    { id: "RJFT 25", alt: 2400, trk: 252, elev: 642 },
                                    { id: "RJFM 09", alt: 1500, trk: 92, elev: 15 }
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
                                    { id: "RJFT 07", mda: 1190, trk: 72, elev: 601 },
                                    { id: "RJFT 25", mda: 1190, trk: 252, elev: 642 },
                                    { id: "RJFM 09", mda: 650, trk: 92, elev: 15 }
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
}