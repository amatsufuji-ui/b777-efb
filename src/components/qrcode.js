// qrcode.js — 2026-11-15 (完全オフライン動作の QR コード生成モジュール: CDN の QRious を置き換え)
// QR Code Model 2 / バイトモード / 誤り訂正レベル L / バージョン 1〜40 自動選択。
// 外部通信は一切行わない (fetch / script 読込なし)。SyncModal の「QRを表示 (送る)」用。
// 使い方: import { renderQRCode, createQRMatrix } from './qrcode';
//   renderQRCode(canvas, value, { size: 400, padding: 20 });  // QRious と同じ引数感覚
//   const { size, modules } = createQRMatrix(value);          // modules: Uint8Array (1=黒)

// ---------------------------------------------------------------------------
// GF(256) / Reed-Solomon
// ---------------------------------------------------------------------------
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
const gfMul = (a, b) => (a && b) ? GF_EXP[GF_LOG[a] + GF_LOG[b]] : 0;

function rsGeneratorPoly(deg) {
    // 係数は昇冪順 (定数項が先頭)。∏(x - α^i), i=0..deg-1 を展開する。
    let poly = [1];
    for (let i = 0; i < deg; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= gfMul(poly[j], GF_EXP[i]);
            next[j + 1] ^= poly[j];
        }
        poly = next;
    }
    return poly;
}
function rsComputeDivisor(deg) {
    // 剰余計算用に降冪順 (先頭が最高次の係数 1) へ反転する。
    return rsGeneratorPoly(deg).slice().reverse();
}
function rsRemainder(data, divisor) {
    const result = new Array(divisor.length - 1).fill(0);
    for (const b of data) {
        const factor = b ^ result.shift();
        result.push(0);
        for (let i = 0; i < result.length; i++) {
            result[i] ^= gfMul(divisor[i + 1], factor);
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// バージョン別テーブル (誤り訂正レベル L)
// RS_BLOCKS_L[version] = グループ列 [ブロック数, ブロック総コードワード, データコードワード]
// ---------------------------------------------------------------------------
const RS_BLOCKS_L = [
    null,
    [[1, 26, 19]], [[1, 44, 34]], [[1, 70, 55]], [[1, 100, 80]], [[1, 134, 108]],
    [[2, 86, 68]], [[2, 98, 78]], [[2, 121, 97]], [[2, 146, 116]],
    [[2, 86, 68], [2, 87, 69]],
    [[4, 101, 81]],
    [[2, 116, 92], [2, 117, 93]],
    [[4, 133, 107]],
    [[3, 145, 115], [1, 146, 116]],
    [[5, 109, 87], [1, 110, 88]],
    [[5, 122, 98], [1, 123, 99]],
    [[1, 135, 107], [5, 136, 108]],
    [[5, 150, 120], [1, 151, 121]],
    [[3, 141, 113], [4, 142, 114]],
    [[3, 135, 107], [5, 136, 108]],
    [[4, 144, 116], [4, 145, 117]],
    [[2, 139, 111], [7, 140, 112]],
    [[4, 151, 121], [5, 152, 122]],
    [[6, 147, 117], [4, 148, 118]],
    [[8, 132, 106], [4, 133, 107]],
    [[10, 142, 114], [2, 143, 115]],
    [[8, 152, 122], [4, 153, 123]],
    [[3, 147, 117], [10, 148, 118]],
    [[7, 146, 116], [7, 147, 117]],
    [[5, 145, 115], [10, 146, 116]],
    [[13, 145, 115], [3, 146, 116]],
    [[17, 145, 115]],
    [[17, 145, 115], [1, 146, 116]],
    [[13, 145, 115], [6, 146, 116]],
    [[12, 151, 121], [7, 152, 122]],
    [[6, 151, 121], [14, 152, 122]],
    [[17, 152, 122], [4, 153, 123]],
    [[4, 152, 122], [18, 153, 123]],
    [[20, 147, 117], [4, 148, 118]],
    [[19, 148, 118], [6, 149, 119]],
];
const TOTAL_CODEWORDS = [
    0,
    26, 44, 70, 100, 134, 172, 196, 242, 292, 346,
    404, 466, 532, 581, 655, 733, 815, 901, 991, 1085,
    1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185,
    2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706,
];
const ALIGNMENT_CENTERS = [
    null, [],
    [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
    [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70],
    [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86],
    [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
];

function dataCapacityBytes(version) {
    const groups = RS_BLOCKS_L[version];
    let dataCw = 0;
    for (const [count, , dcw] of groups) dataCw += count * dcw;
    const headerBits = 4 + (version <= 9 ? 8 : 16);
    return Math.floor((dataCw * 8 - headerBits) / 8);
}

// ---------------------------------------------------------------------------
// データコードワードの組み立て + インターリーブ
// ---------------------------------------------------------------------------
function buildFinalCodewords(bytes, version) {
    const groups = RS_BLOCKS_L[version];
    let dataCwTotal = 0;
    for (const [count, , dcw] of groups) dataCwTotal += count * dcw;

    // ビットストリーム: モード(0100) + 長さ + データ
    const bits = [];
    const pushBits = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    pushBits(0b0100, 4);
    pushBits(bytes.length, version <= 9 ? 8 : 16);
    for (const b of bytes) pushBits(b, 8);
    const capBits = dataCwTotal * 8;
    pushBits(0, Math.min(4, capBits - bits.length)); // 終端
    while (bits.length % 8 !== 0) bits.push(0);
    const dataBytes = [];
    for (let i = 0; i < bits.length; i += 8) {
        let b = 0;
        for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
        dataBytes.push(b);
    }
    for (let pad = 0xec; dataBytes.length < dataCwTotal; pad ^= 0xec ^ 0x11) dataBytes.push(pad);

    // ブロック分割 + ECC + インターリーブ
    const blocks = [];
    let offset = 0;
    for (const [count, tcw, dcw] of groups) {
        const eccLen = tcw - dcw;
        const divisor = rsComputeDivisor(eccLen);
        for (let k = 0; k < count; k++) {
            const blockData = dataBytes.slice(offset, offset + dcw);
            offset += dcw;
            blocks.push({ data: blockData, ecc: rsRemainder(blockData, divisor) });
        }
    }
    const result = [];
    const maxData = Math.max(...blocks.map(b => b.data.length));
    for (let i = 0; i < maxData; i++) {
        for (const b of blocks) if (i < b.data.length) result.push(b.data[i]);
    }
    const maxEcc = Math.max(...blocks.map(b => b.ecc.length));
    for (let i = 0; i < maxEcc; i++) {
        for (const b of blocks) if (i < b.ecc.length) result.push(b.ecc[i]);
    }
    return result;
}

// ---------------------------------------------------------------------------
// マトリクス描画
// ---------------------------------------------------------------------------
function createMatrixForVersion(codewords, version, mask) {
    const size = version * 4 + 17;
    const modules = new Int8Array(size * size).fill(-1); // -1: 未配置, 0: 白, 1: 黒
    const set = (x, y, v) => { if (x >= 0 && x < size && y >= 0 && y < size) modules[y * size + x] = v; };
    const get = (x, y) => modules[y * size + x];

    // ファインダパターン + セパレータ
    const drawFinder = (cx, cy) => {
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                set(cx + dx, cy + dy, (dist !== 2 && dist !== 4) ? 1 : 0);
            }
        }
    };
    drawFinder(3, 3);
    drawFinder(size - 4, 3);
    drawFinder(3, size - 4);

    // タイミングパターン
    for (let i = 0; i < size; i++) {
        if (get(i, 6) === -1) set(i, 6, i % 2 === 0 ? 1 : 0);
        if (get(6, i) === -1) set(6, i, i % 2 === 0 ? 1 : 0);
    }

    // アライメントパターン (ファインダと重なる三隅の組合せだけをスキップ。
    // タイミングパターン上の中心も上書きで描く)
    const centers = ALIGNMENT_CENTERS[version];
    const last = centers.length - 1;
    centers.forEach((cy, iy) => {
        centers.forEach((cx, ix) => {
            if ((ix === 0 && iy === 0) || (ix === 0 && iy === last) || (ix === last && iy === 0)) return;
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const dist = Math.max(Math.abs(dx), Math.abs(dy));
                    set(cx + dx, cy + dy, dist !== 1 ? 1 : 0);
                }
            }
        });
    });

    // ダークモジュール + 形式情報の予約
    set(8, size - 8, 1);
    const reserveFormat = () => {
        for (let i = 0; i <= 5; i++) if (get(8, i) === -1) set(8, i, 0);
        if (get(8, 7) === -1) set(8, 7, 0);
        if (get(8, 8) === -1) set(8, 8, 0);
        if (get(7, 8) === -1) set(7, 8, 0);
        for (let i = 9; i < 15; i++) if (get(14 - i, 8) === -1) set(14 - i, 8, 0);
        for (let i = 0; i < 8; i++) if (get(size - 1 - i, 8) === -1) set(size - 1 - i, 8, 0);
        for (let i = 8; i < 15; i++) if (get(8, size - 15 + i) === -1) set(8, size - 15 + i, 0);
    };
    reserveFormat();

    // バージョン情報 (V7以上)
    if (version >= 7) {
        let rem = version;
        for (let i = 0; i < 12; i++) { rem <<= 1; if (rem & 0x1000) rem ^= 0x1f25; }
        const bits = (version << 12) | (rem & 0xfff);
        for (let i = 0; i < 18; i++) {
            const bit = (bits >>> i) & 1;
            set(Math.floor(i / 3), size - 11 + (i % 3), bit);
            set(size - 11 + (i % 3), Math.floor(i / 3), bit);
        }
    }

    // データ配置 (ジグザグ)
    const totalBits = codewords.length * 8;
    let bitIdx = 0;
    const nextBit = () => {
        if (bitIdx >= totalBits) return 0;
        const byte = codewords[Math.floor(bitIdx / 8)];
        const bit = (byte >>> (7 - (bitIdx % 8))) & 1;
        bitIdx++;
        return bit;
    };
    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < size; vert++) {
            for (let j = 0; j < 2; j++) {
                const x = right - j;
                const upward = ((right + 1) & 2) === 0;
                const y = upward ? size - 1 - vert : vert;
                if (get(x, y) === -1) {
                    let bit = nextBit();
                    if (mask !== null && mask !== undefined) {
                        if (applyMask(mask, x, y)) bit ^= 1;
                    }
                    set(x, y, bit);
                }
            }
        }
    }

    // 形式情報 (レベル L = 01)
    if (mask !== null && mask !== undefined) {
        const data = (0b01 << 3) | mask;
        let rem = data;
        for (let i = 0; i < 10; i++) { rem <<= 1; if (rem & 0x400) rem ^= 0x537; }
        const formatBits = ((data << 10) | (rem & 0x3ff)) ^ 0x5412;
        const getBit = (i) => (formatBits >>> i) & 1;
        for (let i = 0; i <= 5; i++) set(8, i, getBit(i));
        set(8, 7, getBit(6));
        set(8, 8, getBit(7));
        set(7, 8, getBit(8));
        for (let i = 9; i < 15; i++) set(14 - i, 8, getBit(i));
        for (let i = 0; i < 8; i++) set(size - 1 - i, 8, getBit(i));
        for (let i = 8; i < 15; i++) set(8, size - 15 + i, getBit(i));
        set(8, size - 8, 1);
    }

    return { size, modules: Uint8Array.from(modules, v => (v === 1 ? 1 : 0)) };
}

function applyMask(mask, x, y) {
    switch (mask) {
        case 0: return (x + y) % 2 === 0;
        case 1: return y % 2 === 0;
        case 2: return x % 3 === 0;
        case 3: return (x + y) % 3 === 0;
        case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
        case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
        case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
        case 7: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        default: return false;
    }
}

// ペナルティ評価 (マスク自動選択用)
function penaltyScore(modules, size) {
    let score = 0;
    const get = (x, y) => modules[y * size + x];
    // ルール1: 同色の連続 (行・列)
    for (let y = 0; y < size; y++) {
        let runColor = get(0, y), runLen = 1;
        for (let x = 1; x < size; x++) {
            if (get(x, y) === runColor) { runLen++; } else {
                if (runLen >= 5) score += runLen - 2;
                runColor = get(x, y); runLen = 1;
            }
        }
        if (runLen >= 5) score += runLen - 2;
    }
    for (let x = 0; x < size; x++) {
        let runColor = get(x, 0), runLen = 1;
        for (let y = 1; y < size; y++) {
            if (get(x, y) === runColor) { runLen++; } else {
                if (runLen >= 5) score += runLen - 2;
                runColor = get(x, y); runLen = 1;
            }
        }
        if (runLen >= 5) score += runLen - 2;
    }
    // ルール2: 2x2 同色ブロック
    for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
            const c = get(x, y);
            if (c === get(x + 1, y) && c === get(x, y + 1) && c === get(x + 1, y + 1)) score += 3;
        }
    }
    // ルール3: ファインダ類似パターン
    const pattern = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    const patternRev = [...pattern].reverse();
    const matchAt = (vals, off) => pattern.every((v, i) => vals[off + i] === v) || patternRev.every((v, i) => vals[off + i] === v);
    for (let y = 0; y < size; y++) {
        const row = Array.from({ length: size }, (_, x) => get(x, y));
        for (let i = 0; i + 11 <= size; i++) if (matchAt(row, i)) score += 40;
    }
    for (let x = 0; x < size; x++) {
        const col = Array.from({ length: size }, (_, y) => get(x, y));
        for (let i = 0; i + 11 <= size; i++) if (matchAt(col, i)) score += 40;
    }
    // ルール4: 黒比率の偏り
    let dark = 0;
    for (let i = 0; i < modules.length; i++) dark += modules[i];
    const percent = (dark * 100) / modules.length;
    const prevMultiple = Math.floor(percent / 5) * 5;
    const nextMultiple = prevMultiple + 5;
    score += Math.min(Math.abs(prevMultiple - 50), Math.abs(nextMultiple - 50)) / 5 * 10;
    return score;
}

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------
const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
function utf8Bytes(str) {
    if (textEncoder) return textEncoder.encode(str);
    const out = [];
    for (let i = 0; i < str.length; i++) {
        let cp = str.charCodeAt(i);
        if (cp < 0x80) out.push(cp);
        else if (cp < 0x800) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
        else out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    }
    return new Uint8Array(out);
}

// createQRMatrix(value, forced?) — forced は検証用 { version, mask }
export function createQRMatrix(value, forced) {
    const bytes = utf8Bytes(String(value));
    let version = forced && forced.version;
    if (!version) {
        version = 0;
        for (let v = 1; v <= 40; v++) {
            if (bytes.length <= dataCapacityBytes(v)) { version = v; break; }
        }
        if (!version) throw new Error('QR: データが大きすぎます (レベルL・最大約2900バイト)');
    }
    const codewords = buildFinalCodewords(bytes, version);
    if (forced && forced.mask !== undefined && forced.mask !== null) {
        return createMatrixForVersion(codewords, version, forced.mask);
    }
    let best = null;
    let bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
        const m = createMatrixForVersion(codewords, version, mask);
        const s = penaltyScore(m.modules, m.size);
        if (s < bestScore) { bestScore = s; best = m; }
    }
    return best;
}

// QRious 互換の Canvas 描画 (size/padding はピクセル、背景白・前景黒が既定)
export function renderQRCode(canvas, value, options = {}) {
    const size = options.size || 400;
    const padding = options.padding !== undefined ? options.padding : 20;
    const background = options.background || 'white';
    const foreground = options.foreground || 'black';
    const { size: n, modules } = createQRMatrix(value);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
    const scale = (size - padding * 2) / n;
    ctx.fillStyle = foreground;
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            if (modules[y * n + x]) {
                ctx.fillRect(padding + x * scale, padding + y * scale, scale + 0.5, scale + 0.5);
            }
        }
    }
    return canvas;
}

export default { createQRMatrix, renderQRCode };
