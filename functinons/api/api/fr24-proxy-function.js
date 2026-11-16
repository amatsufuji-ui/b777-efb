// fr24-proxy-function.js — 2026-11-16 (Cloudflare Pages Function: Flightradar24 API プロキシ)
// プロジェクトの functions/api/fr24/[[path]].js に、このファイルの内容を置く。
// ※ functions/api/fr24.js (単一ファイル) では /api/fr24 ちょうどしか一致せず、
// /api/fr24/flight-summary/light のようなサブパスを受けられないため、
// 必ず fr24 フォルダ内の [[path]].js (キャッチオール) として配置すること。
// GET /api/fr24/<path>?<query> を受け、環境変数シークレット FR24_API_TOKEN を
// Authorization: Bearer として付与し、https://fr24api.flightradar24.com/api/<path>
// へそのまま転送する。トークンをフロントエンドに露出させないための薄い中継。
// トークン未設定時は 501 {error:'FR24_API_TOKEN not configured'} を返す
// (アプリ側はこれを見て「FR24 APIが未設定です」と表示する)。
// Cloudflare Pages プロジェクトの Settings → Environment variables に
// FR24_API_TOKEN を Secret として登録し、再デプロイすると有効になる。

const FR24_API_BASE = 'https://fr24api.flightradar24.com/api/';

const jsonResponse = (status, obj) => new Response(JSON.stringify(obj), {
status,
headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store'}
});

export async function onRequest(context) {
const { request, env} = context;

if (request.method!== 'GET') {
return jsonResponse(405, { error: 'method not allowed'});
}

const url = new URL(request.url);
const marker = '/api/fr24';
const idx = url.pathname.indexOf(marker);
const subPath = (idx >= 0? url.pathname.slice(idx + marker.length): '').replace(/^\/+/, '');

if (!subPath || subPath.includes('..') || subPath.includes('\\')) {
return jsonResponse(400, { error: 'missing or invalid FR24 path'});
}

const token = env && env.FR24_API_TOKEN;
if (!token) {
return jsonResponse(501, { error: 'FR24_API_TOKEN not configured'});
}

let upstream;
try {
upstream = await fetch(FR24_API_BASE + subPath + url.search, {
method: 'GET',
headers: {
'Authorization': `Bearer ${token}`,
'Accept-Version': 'v1',
'Accept': 'application/json'
}
});
} catch (e) {
return jsonResponse(502, { error: 'FR24 upstream unreachable'});
}

return new Response(upstream.body, {
status: upstream.status,
headers: {
'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
'Cache-Control': 'no-store'
}
});
}
