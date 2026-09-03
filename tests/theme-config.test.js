"use strict";
const assert = require("node:assert/strict");
const themeApi = require("../themes.js");

assert.equal(themeApi.describeAxis("politics", 0).label, "Zdecydowanie więcej wolności");
assert.equal(themeApi.describeAxis("politics", 25).label, "Więcej wolności");
assert.equal(themeApi.describeAxis("politics", 50).label, "Równowaga wolności i państwa");
assert.equal(themeApi.describeAxis("politics", 70).label, "Więcej roli państwa");
assert.equal(themeApi.describeAxis("politics", 100).label, "Zdecydowanie więcej roli państwa");
assert.equal(themeApi.getTheme("thinking").axis.leftLabel, "Więcej intuicji");
assert.notEqual(themeApi.getTheme("thinking").axis.title, themeApi.getTheme("politics").axis.title);
console.log("Theme: konfiguracja i wszystkie zakresy działają poprawnie.");
