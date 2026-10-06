(function (root) {
  "use strict";
  // Reversible encoding, NOT encryption or authentication.
  // EL2 carries level; decode also accepts legacy student-only EL1.
  const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const MASK = 0x5A3C;
  const rol16 = x => ((x << 5) | (x >>> 11)) & 0xFFFF;
  const ror16 = x => ((x >>> 5) | (x << 11)) & 0xFFFF;
  function crc8(word) {
    let crc = 0;
    for (const byte of [word >>> 8, word & 255]) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ (crc & 128 ? 0x07 : 0)) & 255;
    }
    return crc;
  }
  function encode({ correct, total, completed, moduleId, difficulty = 1 }) {
    if (moduleId !== "electricity-knowledge" || completed !== true || total !== 10 || !Number.isInteger(correct) || correct < 0 || correct > total || ![0, 1, 2].includes(difficulty)) throw new Error("invalid-result");
    // v3: bits 15..12 version; 11 completed; 10..9 level; 8..5 correct; 4..1 total; 0 topic.
    const payload = (3 << 12) | (1 << 11) | (difficulty << 9) | (correct << 5) | (total << 1) | 1;
    const word = rol16(payload ^ MASK);
    let packed = (word << 8) | crc8(word);
    let text = "";
    for (let i = 0; i < 5; i++) { text = ALPHABET[packed & 31] + text; packed >>>= 5; }
    return `EL3-${text}`;
  }
  function decode(code) {
    if (typeof code !== "string") throw new Error("invalid-code");
    const normalized = code.trim().toUpperCase();
    if (!/^EL[123]-[0-9A-HJKMNP-TV-Z]{5}$/.test(normalized)) throw new Error("invalid-code");
    let packed = 0;
    for (const char of normalized.slice(4)) packed = packed * 32 + ALPHABET.indexOf(char);
    if (packed > 0xFFFFFF) throw new Error("invalid-code");
    const word = packed >>> 8;
    if (crc8(word) !== (packed & 255)) throw new Error("checksum");
    const payload = ror16(word) ^ MASK;
    const version = payload >>> 12, completed = Boolean(payload & 0x0800);
    const prefixVersion = Number(normalized[2]);
    if (version !== prefixVersion || ![1, 2, 3].includes(version)) throw new Error("invalid-result");
    const difficulty = version === 1 ? 1 : (version === 2 ? ((payload >>> 10) & 1) : ((payload >>> 9) & 3));
    const correct = version === 1 ? ((payload >>> 7) & 15) : (version === 2 ? ((payload >>> 6) & 15) : ((payload >>> 5) & 15));
    const total = version === 1 ? ((payload >>> 3) & 15) : (version === 2 ? ((payload >>> 2) & 15) : ((payload >>> 1) & 15));
    const topic = version === 1 ? (payload & 7) : (version === 2 ? (payload & 3) : (payload & 1));
    if (!completed || topic !== 1 || total !== 10 || correct > total) throw new Error("invalid-result");
    return { version, moduleId: "electricity-knowledge", completed, difficulty, level: ["primary-graduate","high-school-graduate","bachelor-engineer"][difficulty] || "unknown", correct, total, percent: correct * 10 };
  }
  const api = Object.freeze({ encode, decode });
  if (typeof module === "object" && module.exports) module.exports = api;
  root.GLOBOCIE_RESULT_CODE = api;
})(typeof window === "object" ? window : globalThis);
