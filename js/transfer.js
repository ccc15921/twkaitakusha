/* 紀錄轉移：把「企劃代號#編號 → 數量」壓縮成可放進網址的字串，並產生 QR Code。
 * 完全在瀏覽器內運作，不會把資料送到任何伺服器（網址 # 後面的內容不會被傳給網站）。
 *
 * payload 格式： 2z.<base64url>   deflate-raw 壓縮
 *               2p.<base64url>   未壓縮（舊瀏覽器 / 資料很小時較短才會用）
 * 內容（壓縮前）： [CRC32 4 bytes] + UTF-8 文字，連結被截斷或損壞時一定會被偵測到
 * 文字： 企劃代號=編號,編號*數量,...;企劃代號=...   （各段以 encodeURIComponent 跳脫）
 */
(function (root) {
  'use strict';

  const MAX_PAYLOAD_CHARS = 8000;     // 網址過長就不處理（也避免解壓炸彈）
  const MAX_TEXT_BYTES = 1024 * 1024;

  const esc = s => encodeURIComponent(s).replace(/\*/g, '%2A');

  /* ---- 文字 <-> 紀錄 ---- */
  function ownedToText(owned) {
    const groups = new Map();
    Object.keys(owned || {}).forEach(key => {
      const qty = Math.floor(Number(owned[key]));
      const i = key.lastIndexOf('#');
      if (i <= 0 || !(qty >= 1)) return;
      const code = key.slice(0, i), idx = key.slice(i + 1);
      if (!groups.has(code)) groups.set(code, []);
      groups.get(code).push(esc(idx) + (qty > 1 ? '*' + qty : ''));
    });
    return [...groups].map(([code, toks]) => esc(code) + '=' + toks.join(',')).join(';');
  }
  function textToOwned(text) {
    const out = {};
    if (!text) return out;
    text.split(';').forEach(seg => {
      const eq = seg.indexOf('=');
      if (eq <= 0) return;
      const code = decodeURIComponent(seg.slice(0, eq));
      seg.slice(eq + 1).split(',').forEach(tok => {
        if (!tok) return;
        const star = tok.lastIndexOf('*');
        const idx = decodeURIComponent(star < 0 ? tok : tok.slice(0, star));
        const qty = star < 0 ? 1 : parseInt(tok.slice(star + 1), 10);
        if (code && idx !== '' && qty >= 1) out[code + '#' + idx] = qty;
      });
    });
    return out;
  }

  /* ---- CRC32 ---- */
  let crcTable = null;
  function crc32(bytes) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        crcTable[n] = c >>> 0;
      }
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /* ---- bytes <-> base64url ---- */
  function bytesToB64url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlToBytes(str) {
    if (!/^[A-Za-z0-9_-]*$/.test(str)) throw new Error('bad-chars');
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* ---- 壓縮（原生 CompressionStream；不支援時退回不壓縮） ---- */
  const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
  async function pipe(bytes, stream) {
    const w = stream.writable.getWriter();
    // 資料損壞時寫入端也會 reject；錯誤統一由下面讀取端丟出，這裡接住避免「未處理的 Promise 錯誤」
    w.write(bytes).catch(() => {});
    w.close().catch(() => {});
    return new Uint8Array(await new Response(stream.readable).arrayBuffer());
  }

  /** 紀錄物件 → payload 字串（不含網址前綴） */
  async function encode(owned) {
    const text = new TextEncoder().encode(ownedToText(owned));
    const bytes = new Uint8Array(4 + text.length);
    new DataView(bytes.buffer).setUint32(0, crc32(text));
    bytes.set(text, 4);
    let best = '2p.' + bytesToB64url(bytes);
    if (canCompress()) {
      try {
        const z = '2z.' + bytesToB64url(await pipe(bytes, new CompressionStream('deflate-raw')));
        if (z.length < best.length) best = z;
      } catch (e) { /* 用未壓縮版本 */ }
    }
    return best;
  }

  /** payload 字串 → 紀錄物件（未經驗證，呼叫端要自行 normalize）。失敗時丟出 Error('bad' | 'unsupported') */
  async function decode(payload) {
    const m = /^2([zp])\.([A-Za-z0-9_-]*)$/.exec(String(payload || ''));
    if (!m || payload.length > MAX_PAYLOAD_CHARS) throw new Error('bad');
    let bytes;
    try { bytes = b64urlToBytes(m[2]); } catch (e) { throw new Error('bad'); }
    if (m[1] === 'z') {
      if (!canCompress()) throw new Error('unsupported');
      try { bytes = await pipe(bytes, new DecompressionStream('deflate-raw')); }
      catch (e) { throw new Error('bad'); }
    }
    if (bytes.length < 4 || bytes.length > MAX_TEXT_BYTES) throw new Error('bad');
    const text = bytes.subarray(4);
    if (new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0) !== crc32(text)) throw new Error('bad');
    try { return textToOwned(new TextDecoder('utf-8', { fatal: true }).decode(text)); }
    catch (e) { throw new Error('bad'); }
  }

  /* ---- QR Code（SVG）。放不下時回傳 null ---- */
  function qrSvg(text) {
    if (typeof root.qrcode !== 'function') return null;
    for (const level of ['M', 'L']) {            // 先試較耐掃的 M，放不下再用 L
      try {
        const qr = root.qrcode(0, level);
        qr.addData(text, 'Byte');
        qr.make();
        const n = qr.getModuleCount(), margin = 4, size = n + margin * 2;
        let d = '';
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n;) {
            if (!qr.isDark(r, c)) { c++; continue; }
            let len = 1;
            while (c + len < n && qr.isDark(r, c + len)) len++;
            d += `M${c + margin} ${r + margin}h${len}v1h-${len}z`;
            c += len;
          }
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR Code">` +
          `<rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
      } catch (e) { /* 容量不足，試下一個等級 */ }
    }
    return null;
  }

  const api = { encode, decode, qrSvg, ownedToText, textToOwned, MAX_PAYLOAD_CHARS };
  root.AzkiTransfer = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
