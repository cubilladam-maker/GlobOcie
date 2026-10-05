"use strict";
const assert = require("node:assert/strict");
const { encode, decode } = require("../result-code.js");
const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const vectors = ["4VA73", "5VA5M", "6VA2D", "7VA0T", "0VA5R", "1VA7F", "2VA0P", "3VA21", "CVA2N", "DVA02", "EVA7V"];
for (let correct = 0; correct <= 10; correct++) {
  const code = encode({ correct, total: 10, completed: true, moduleId: "electricity-knowledge" });
  assert.equal(code, "EL1-" + vectors[correct]);
  assert.deepEqual(decode(code), { version: 1, moduleId: "electricity-knowledge", completed: true, correct, total: 10, percent: correct * 10 });
  assert.equal(decode("  " + code.toLowerCase() + "  ").correct, correct);
  // Every single-character mutation is rejected for every legitimate score.
  for (let pos = 4; pos < 9; pos++) for (const replacement of alphabet) {
    if (replacement === code[pos]) continue;
    assert.throws(() => decode(code.slice(0, pos) + replacement + code.slice(pos + 1)));
  }
}
for (const correct of [-1, 11, 1.5, NaN, "8", null]) assert.throws(() => encode({ correct, total: 10, completed: true, moduleId: "electricity-knowledge" }));
for (const patch of [{ total: 9 }, { completed: false }, { completed: 1 }, { moduleId: "political-compass" }]) assert.throws(() => encode({ correct: 8, total: 10, completed: true, moduleId: "electricity-knowledge", ...patch }));
for (const text of [null, 123, "EL1-CVA2", "EL1-CVA2NN", "EL1-OVA2N", "EL2-CVA2N", "EL1-ZZZZZ", "<script>"]) assert.throws(() => decode(text));
// Independent reference bit arithmetic + polynomial long division, not the implementation's loop.
function referenceCrc(word) {
  let polynomial = word * 256;
  for (let bit = 23; bit >= 8; bit--) if ((polynomial >>> bit) & 1) polynomial ^= 0x107 << (bit - 8);
  return polynomial;
}
for (let n = 0; n <= 10; n++) {
  const payload = 0x1800 + n * 128 + 10 * 8 + 1;
  const xor = payload ^ 0x5A3C;
  const rotated = ((xor * 32) % 65536) + Math.floor(xor / 2048);
  let packed = 0;
  for (const char of vectors[n]) packed = packed * 32 + alphabet.indexOf(char);
  assert.equal(packed >>> 8, rotated);
  assert.equal(packed & 255, referenceCrc(rotated));
}
console.log("Result codes: all 11 scores, independent bit/CRC reference, 1705 single-character typos, invalid/incomplete/topic inputs PASS.");
