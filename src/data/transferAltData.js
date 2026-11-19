// transferAltData.js — 2026-11-19 (管制移管高度表 [For Reference Only / Transfer
// Altitude Table] 2025年7月25日改訂・FO推進部 をデータ化したもの)
//
// 目的地空港 (ICAO) ごとに、Transfer point (NAVLOG のウェイポイント名と照合) と
// 移管高度を引けるようにした表。NavlogView が ALT 入力の上に赤字で表示する。
//
// 転記方針 (2026-11-19):
//   - このアプリはジェット機用なので、(FOR PROP) / (FOR DHC8-400) 専用の行は
//     収録していない。(FOR JET) の行と、機種条件のない行のみを収録。
//     例: RJOO ROKKO は FOR JET の 11,000FT、MUGIE は FOR JET の FL190。
//   - FROM RJxx の条件がある行は from に出発空港を入れ、照合時に出発空港で
//     絞り込む。Via Yxx 等の経路条件は NAVLOG から判定できないため区別しない
//     (同一点で高度が割れるケースはほぼ無く、割れるものは disp で併記する)。
//   - 「30NM to ASIBE」「20nm S of N30°」のような距離・位置指定のポイントは
//     ウェイポイント名と照合できないため収録していない。
//   - RJOO KAINA の高度は原表が「11,000FL」と印刷されている (FT の誤植と判断し
//     11,000FT として収録)。
//   - RJFK VEKVO は原表で FL200 と FL160 の2行が条件の記載なく並んでいるため、
//     disp で併記する (条件が判明したら分けること)。
//   - ROAH PRIUS は使用滑走路で FL220 (RWY36) / FL180 (RWY18) が変わるため併記。
//   - 長い表記 (At or below 等) は alt に原表どおり保持し、表示用に disp を持つ。
//
// エントリ形式: { points: [名前...], alt: '原表の表記', from?: [ICAO...], disp?: '表示用' }

export const TRANSFER_ALT_TABLE = {
  // ---- 関西・中国・四国 (表1ページ目) ----
  RJBB: [
    { points: ['SINGU'], alt: 'FL180' },
    { points: ['OLBUG'], alt: 'FL160' },
    { points: ['SAEKI'], alt: 'FL170' },
    { points: ['UPGEB'], alt: 'FL270' },
    { points: ['SAKAI'], alt: 'FL180' },
    { points: ['URDET'], alt: 'FL180' },
    { points: ['CHILY'], alt: 'FL340' },
    { points: ['PIPED'], alt: 'FL350' },
    { points: ['MOCOS'], alt: 'FL350' },
    { points: ['SARGI'], alt: 'FL280' },
    { points: ['EMSUV'], alt: 'FL160' },
  ],
  RJBE: [
    { points: ['DINAH'], alt: '10,000FT' },
    { points: ['WAKIT'], alt: '13,000FT' },
    { points: ['STORK'], alt: 'FL290' },
    { points: ['LUXAD'], alt: 'FL180' },
    { points: ['URDET'], alt: 'FL160' },
    { points: ['SAKAI'], alt: 'FL160' },
    { points: ['KMC', 'IGOTO'], alt: 'FL340' },
    { points: ['MOCOS', 'PIPED'], alt: 'FL350' },
  ],
  RJOO: [
    { points: ['OHDAI'], alt: '13,000FT' },
    { points: ['ROKKO'], alt: '11,000FT' }, // FOR JET
    { points: ['KAINA'], alt: '11,000FT' }, // 原表は 11,000FL と印刷
    { points: ['ROSIE'], alt: 'FL250' }, // FOR JET
    { points: ['BECKY'], alt: 'FL190' }, // FOR JET
    { points: ['MUGIE'], alt: 'FL190' }, // FOR JET
    { points: ['KRE'], alt: 'FL150' },
    { points: ['SUGAL'], alt: 'FL320' },
    { points: ['KMC'], alt: 'FL340' },
    { points: ['MANEP', 'MAYVE'], alt: 'FL350', from: ['RJFM', 'RJFK', 'ROAH', 'ROIG'] },
    { points: ['OOITA'], alt: 'FL350' },
    { points: ['SARGI'], alt: 'FL280' },
    { points: ['MBE', 'OSPAN'], alt: 'FL340' },
  ],
  RJDC: [
    { points: ['DEMIZ'], alt: 'FL160' },
    { points: ['BAMBO'], alt: 'FL340', from: ['RJTT', 'RJGG', 'RJOO', 'RJBB'] },
  ],
  RJOA: [
    { points: ['SUNFL'], alt: '11,000FT' },
    { points: ['SOBOH'], alt: 'FL290' },
    { points: ['YANAI'], alt: 'FL170' },
    { points: ['AMURO', 'RYUOH'], alt: 'Below FL150', disp: '<FL150' },
    { points: ['ARASI'], alt: 'At or below FL400', disp: '≤FL400', from: ['RJTT'] },
    { points: ['MOCOS'], alt: 'FL350', from: ['ROAH'] },
  ],
  RJOB: [
    { points: ['WAKIT'], alt: 'FL160' },
    { points: ['TAKMA'], alt: '11,000FT' }, // 高松ASR停波時は 9,000FT
    { points: ['KMC', 'IGOTO'], alt: 'FL340' },
    { points: ['MOCOS'], alt: 'FL350', from: ['ROAH'] },
  ],
  RJOR: [
    { points: ['OVMAX'], alt: 'FL340' },
  ],
  RJOH: [
    { points: ['YME'], alt: 'FL320' },
    { points: ['RAKDA'], alt: '8,000FT' },
    { points: ['OVMAX'], alt: 'At or below FL400', disp: '≤FL400' },
  ],
  RJOI: [
    { points: ['WASYU'], alt: 'FL200' },
    { points: ['ONDOC'], alt: '10,000FT' },
    { points: ['MOCOS'], alt: 'FL350', from: ['ROAH'] },
  ],
  RJOW: [
    { points: ['LATOR'], alt: 'FL240' }, // 訓練空域使用時は変更の場合あり
    { points: ['OSPEL', 'SAMBA'], alt: 'At or below 13,000FT', disp: '≤13000FT' },
    { points: ['LEPGU'], alt: 'FL340' },
  ],
  RJOK: [
    { points: ['HALON'], alt: 'FL240' },
    { points: ['PANCH'], alt: '10,000FT' },
    { points: ['OBOKE'], alt: '12,000FT' },
  ],
  RJOM: [
    { points: ['WASYU'], alt: 'FL200' },
    { points: ['BAMBO', 'ITUKI', 'SHONO'], alt: '10,000FT' },
    { points: ['SOBOH'], alt: 'FL250' },
    { points: ['MOCOS'], alt: 'FL350', from: ['ROAH'] },
  ],
  RJOS: [
    { points: ['SINGU'], alt: 'FL180' },
    { points: ['DINAH'], alt: '10,000FT' },
  ],
  RJOT: [
    { points: ['WAKIT'], alt: 'FL150' },
    { points: ['TAKMA'], alt: '9,000FT' },
    { points: ['WIMPY'], alt: '6,000FT' },
    { points: ['IGOTO'], alt: 'FL340' },
    { points: ['MOCOS'], alt: 'FL350', from: ['ROAH'] },
  ],
  // ---- 北海道・東北・関東・中部 (表2ページ目) ----
  RJCW: [
    { points: ['RUMOI'], alt: 'FL350' },
  ],
  RJCC: [
    { points: ['IDEMI'], alt: 'FL150' }, // RWY01 in use 時 (PROP は NONUT A120)
    { points: ['NAVER'], alt: 'FL170' }, // RWY19 in use 時 (PROP は IBURI FL160)
  ],
  RJCK: [
    { points: ['SUMGA'], alt: 'FL150' },
  ],
  // RJEB は距離指定 (30NM to ASIBE) のみのため収録なし
  RJSS: [
    { points: ['FINCH', 'LANCE'], alt: '11,000FT' },
    { points: ['OWLET'], alt: '13,000FT' },
    { points: ['METEL'], alt: '12,000FT' },
    { points: ['ESMAD', 'MYOGI'], alt: 'FL350' },
  ],
  RJSF: [
    { points: ['SDE'], alt: 'FL160' },
    { points: ['HERON'], alt: '10,000FT' },
    { points: ['AKAGI'], alt: 'FL190' },
    { points: ['DAIGO'], alt: '10,000FT' },
  ],
  RJSA: [
    { points: ['AKITA'], alt: 'FL180' },
    { points: ['BENNY'], alt: 'FL330' },
  ],
  RJSK: [
    { points: ['MIKUM', 'SEBGA'], alt: '13,000FT' },
    { points: ['IWASE'], alt: 'FL160' },
    { points: ['GTC'], alt: 'FL350' },
  ],
  RJSR: [
    { points: ['CHOKA'], alt: 'FL190' },
  ],
  RJTT: [
    { points: ['TEDIX', 'MILIT', 'MESSE', 'ESKEN'], alt: 'FL160' },
    { points: ['DOLBA', 'TOPIT'], alt: 'FL150' },
    { points: ['SELNO'], alt: 'FL210' },
    { points: ['SPENS'], alt: 'FL220' },
    { points: ['INUBO'], alt: 'FL240' },
    { points: ['IGLAN', 'ENSAT'], alt: 'FL320' },
    { points: ['VIKET'], alt: 'FL300' },
    { points: ['OPELI', 'ENVOP', 'ISPEK', 'DAIGO', 'BEKPO', 'RUBIS', 'OSOPO', 'VESET', 'INVEL', 'BILLY'], alt: 'FL340' },
  ],
  RJAA: [
    { points: ['GURIP', 'LESPO', 'VAGLA'], alt: 'FL150' },
    { points: ['MAMAS'], alt: 'FL240' },
    { points: ['VIKET'], alt: 'FL300' },
    { points: ['IGLAN', 'ENSAT'], alt: 'FL320' },
    { points: ['DOLGO'], alt: 'FL330' },
    { points: ['OPELI', 'ENVOP', 'ISPEK', 'DAIGO', 'BEKPO', 'RUBIS', 'OSOPO', 'VESET', 'GUGBI', 'OMGIK', 'AKNED'], alt: 'FL340' },
  ],
  RJNS: [
    { points: ['KAWAI'], alt: 'FL170' },
    { points: ['TEBAS'], alt: 'FL270' },
    { points: ['MBE', 'AMVUS'], alt: 'FL340' },
  ],
  RJGG: [
    { points: ['MIDER', 'MARIA', 'NEZAM'], alt: '13,000FT' },
    { points: ['MAPLE'], alt: 'FL150' },
    { points: ['SANOR'], alt: '12,000FT' },
    { points: ['NATCH'], alt: '11,000FT' },
    { points: ['VERDI', 'IMPAL'], alt: 'FL270' },
    { points: ['NOBEP'], alt: 'FL310', from: ['ROAH', 'ROIG', 'ROMY'] },
    { points: ['TARBY', 'MEXIR', 'YUUPA'], alt: 'FL350' },
    { points: ['ISDAM'], alt: 'FL340' },
  ],
  RJSN: [
    { points: ['NESKO', 'IKUJI', 'AZUMI'], alt: 'FL350' },
    { points: ['OBAKO'], alt: 'FL380' },
  ],
  RJNK: [
    { points: ['YARII'], alt: 'FL200' },
    { points: ['HIMMY'], alt: 'FL160' },
    { points: ['SONBU'], alt: 'FL170' },
    { points: ['ATPOD'], alt: 'FL350' },
  ],
  RJNW: [
    { points: ['GORYU'], alt: 'At or above 12,000FT', disp: '≥12000FT' },
  ],
  // ---- 九州・沖縄 (表3ページ目) ----
  RJFF: [
    { points: ['STOUT'], alt: 'FL180' }, // FOR JET
    { points: ['GUSPA'], alt: 'FL160' },
    { points: ['ROBKU'], alt: 'FL200' },
    { points: ['LELAD'], alt: 'FL340', from: ['ROAH'] },
  ],
  RJFK: [
    { points: ['VEKVO'], alt: 'FL200 / FL160', disp: 'FL200/160' }, // 原表に条件の記載なし
    { points: ['VESEV'], alt: 'FL340', from: ['RJOO', 'RJBB'] },
    { points: ['SUC'], alt: 'FL340', from: ['RJTT', 'RJGG'] },
    { points: ['DONKO'], alt: 'FL340' },
    { points: ['YANAI'], alt: 'FL340' },
  ],
  RJFM: [
    { points: ['SIROK'], alt: '12,000FT' },
    { points: ['ESKAP'], alt: 'FL150' },
    { points: ['JOKER'], alt: 'FL170' },
    { points: ['GREEN'], alt: 'FL260' },
    { points: ['SATKI'], alt: 'FL280' },
    { points: ['KRE'], alt: 'FL340', from: ['RJOO', 'RJBB'] },
    { points: ['JAKAL'], alt: 'FL340', from: ['RJGG'] },
    { points: ['ISLUB'], alt: 'FL340', from: ['RJTT'] },
    { points: ['DONKO'], alt: 'FL340' },
    { points: ['YANAI'], alt: 'FL340' },
  ],
  RJFO: [
    { points: ['SQRUM'], alt: '11,000FT' },
    { points: ['BINGO'], alt: 'FL340', from: ['RJTT', 'RJGG', 'RJOO', 'RJBB'] },
  ],
  RJFS: [
    { points: ['IGLAT'], alt: 'FL150' },
    { points: ['BAMBO'], alt: 'FL340', from: ['RJTT', 'RJGG', 'RJOO', 'RJBB'] },
    { points: ['SUC'], alt: 'FL340' },
  ],
  RJFT: [
    { points: ['IGLAT'], alt: '13,000FT' },
    { points: ['BALIE'], alt: 'FL280' },
    { points: ['SAPIS', 'TEMIP'], alt: '11,000FT' },
    { points: ['ANLIK'], alt: 'FL150' },
    { points: ['LEONA'], alt: 'FL200' },
    { points: ['HIZET', 'MINTO', 'SUC'], alt: 'FL340' },
    { points: ['BAMBO'], alt: 'FL340', from: ['RJTT', 'RJGG', 'RJOO', 'RJBB'] },
  ],
  RJFU: [
    { points: ['OHGIE'], alt: '11,000FT' },
    { points: ['HONDO'], alt: '13,000FT' },
    { points: ['DGC'], alt: 'FL170' },
    { points: ['HIZET', 'MINTO'], alt: 'FL340' },
  ],
  ROAH: [
    { points: ['PRIUS'], alt: 'FL220 (RWY36 in use) / FL180 (RWY18 in use)', disp: 'FL220/180' },
    { points: ['GEMNI'], alt: 'FL130' },
  ],
  ROMY: [
    { points: ['SOARA'], alt: 'FL300' },
  ],
  RORS: [
    { points: ['SOARA'], alt: 'FL300' },
  ],
  ROIG: [
    { points: ['GANAS'], alt: 'FL300' },
  ],
};

// 目的地・出発地・ウェイポイント名から移管高度の表示文字列を引く。
// 該当がなければ null。from 条件があるエントリは、出発地が一致しない
// (または不明な) 場合は該当なしとする。
export function findTransferAlt(destIcao, depIcao, wpName) {
  if (!destIcao || !wpName) return null;
  const entries = TRANSFER_ALT_TABLE[String(destIcao).trim().toUpperCase()];
  if (!entries) return null;
  const wp = String(wpName).trim().toUpperCase();
  const dep = depIcao ? String(depIcao).trim().toUpperCase() : null;
  for (const e of entries) {
    if (!e.points.includes(wp)) continue;
    if (e.from && (!dep || !e.from.includes(dep))) continue;
    return e.disp || e.alt;
  }
  return null;
}
