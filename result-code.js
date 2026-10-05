(function (root) {
  "use strict";
  // Reversible encoding, NOT encryption or authentication.
  // Format v1 is for the 10-question electrical engineering test only.
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
  function encode({ correct, total, completed, moduleId }) {
    if (moduleId !== "electricity-knowledge" || completed !== true || total !== 10 || !Number.isInteger(correct) || correct < 0 || correct > total) throw new Error("invalid-result");
    // bits 15..12 version; 11 completed; 10..7 correct; 6..3 total; 2..0 topic.
    const payload = (1 << 12) | (1 << 11) | (correct << 7) | (total << 3) | 1;
    const word = rol16(payload ^ MASK);
    let packed = (word << 8) | crc8(word);
    let text = "";
    for (let i = 0; i < 5; i++) { text = ALPHABET[packed & 31] + text; packed >>>= 5; }
    return `EL1-${text}`;
  }
  function decode(code) {
    if (typeof code !== "string") throw new Error("invalid-code");
    const normalized = code.trim().toUpperCase();
    if (!/^EL1-[0-9A-HJKMNP-TV-Z]{5}$/.test(normalized)) throw new Error("invalid-code");
    let packed = 0;
    for (const char of normalized.slice(4)) packed = packed * 32 + ALPHABET.indexOf(char);
    if (packed > 0xFFFFFF) throw new Error("invalid-code");
    const word = packed >>> 8;
    if (crc8(word) !== (packed & 255)) throw new Error("checksum");
    const payload = ror16(word) ^ MASK;
    const version = payload >>> 12, completed = Boolean(payload & 0x0800);
    const correct = (payload >>> 7) & 15, total = (payload >>> 3) & 15, topic = payload & 7;
    if (version !== 1 || !completed || topic !== 1 || total !== 10 || correct > total) throw new Error("invalid-result");
    return { version, moduleId: "electricity-knowledge", completed, correct, total, percent: correct * 10 };
  }
  const api = Object.freeze({ encode, decode });
  if (typeof module === "object" && module.exports) module.exports = api;
  root.GLOBOCIE_RESULT_CODE = api;
})(typeof window === "object" ? window : globalThis);
