"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const zlib = require("node:zlib");
const themeApi = require("../themes.js");

assert.equal(themeApi.describeAxis("politics", 0).label, "Zdecydowanie więcej wolności");
assert.equal(themeApi.describeAxis("politics", 25).label, "Więcej wolności");
assert.equal(themeApi.describeAxis("politics", 50).label, "Równowaga wolności i państwa");
assert.equal(themeApi.describeAxis("politics", 70).label, "Więcej roli państwa");
assert.equal(themeApi.describeAxis("politics", 100).label, "Zdecydowanie więcej roli państwa");
assert.equal(themeApi.getTheme("thinking").axis.leftLabel, "Więcej intuicji");
assert.notEqual(themeApi.getTheme("thinking").axis.title, themeApi.getTheme("politics").axis.title);
for (const theme of Object.values(themeApi.themes)) {
  assert.ok(theme.axis.title);
  assert.ok(theme.axis.purpose);
  assert.ok(theme.axis.leftLabel);
  assert.ok(theme.axis.rightLabel);
  assert.equal(typeof theme.axis.min, "number");
  assert.equal(typeof theme.axis.max, "number");
  assert.equal(typeof theme.axis.step, "number");
  assert.equal(typeof theme.axis.defaultValue, "number");
  assert.ok(Array.isArray(theme.axis.ranges) && theme.axis.ranges.length > 0);
}
assert.equal(themeApi.getModule("political-compass").name, "Kompas polityczny");
assert.equal(themeApi.getModule("political-compass").themeId, "politics");
assert.equal(themeApi.getModule("political-compass").topicUrl, "topics/polityka-pl.quiz.gz");
assert.equal(themeApi.getModule("political-compass").appearance["--module-accent"], "#f2b84b");
assert.notEqual(themeApi.getModule("political-compass").appearance["--module-page-bg-2"], themeApi.getModule("religion-worldview").appearance["--module-page-bg-2"]);
assert.equal(themeApi.neutralAppearance["--module-page-bg-1"], "#02050e");
assert.ok(themeApi.getModule("political-compass").appearance["--module-primary-start"]);
assert.ok(themeApi.getModule("religion-worldview").appearance["--module-primary-start"]);
assert.equal(themeApi.getModule("religion-worldview").appearance["--module-heart-color"], "#ff5f9d");
assert.ok(themeApi.getModule("religion-worldview").appearance["--module-heart-glow"]);
assert.equal(themeApi.getTheme("climate").axis.title, "Twoja oś klimatyczna");
assert.equal(themeApi.getModule("global-warming").name, "Globalne ocieplenie, prawda czy fake?");
assert.equal(themeApi.getModule("global-warming").themeId, "climate");
assert.equal(themeApi.getModule("global-warming").topicUrl, "topics/global-warming-pl.quiz.gz");
assert.equal(themeApi.getModule("global-warming").appearance["--module-accent"], "#ff735c");
assert.equal(themeApi.getModule("global-warming").appearance["--module-cyan"], "#8aefff");
assert.ok(themeApi.getModule("global-warming").ui.startButton.includes("Globalne ocieplenie, prawda czy fake?"));
const appearanceKeys = ["--module-page-bg-1", "--module-page-bg-2", "--module-panel-start", "--module-primary-start", "--module-holo-core-bottom", "--module-radar-profile-stroke"];
for (const appearance of [themeApi.neutralAppearance, ...Object.values(themeApi.modules).map(module => module.appearance)]) {
  for (const key of appearanceKeys) assert.ok(appearance[key], `Brak zmiennej motywu ${key}`);
}
assert.equal(themeApi.futureTopics[0].name, "Poszukiwania Boga. Nauka, mity a rzeczywistość");
assert.deepEqual(themeApi.futureTopics.map(topic => topic.name), [
  "Poszukiwania Boga. Nauka, mity a rzeczywistość",
  "Styl myślenia",
  "Relacje i emocje",
  "Moralność i sumienie",
  "Człowiek i sztuczna inteligencja",
  "Sens życia i szczęście"
]);
assert.ok(!themeApi.futureTopics.some(topic => topic.id === "global-warming"), "Aktywny moduł klimatyczny nie może być zdublowany na liście przyszłych tematów");
assert.ok(!themeApi.futureTopics.some(topic => topic.name === "Nauka, wiara i rzeczywistość"));
const climateSource = fs.readFileSync(require("node:path").join(__dirname, "..", "topics/global-warming-pl.quiz.gz.js"), "utf8");
const climateEncoded = climateSource.match(/= '([^']+)'/)[1];
const climatePackage = JSON.parse(zlib.gunzipSync(Buffer.from(climateEncoded, "base64")));
assert.equal(climatePackage.manifest.id, "GLOBAL-WARMING-PL");
assert.equal(climatePackage.questions.length, 12);
assert.deepEqual(climatePackage.questions.reduce((counts, question) => { counts[question.difficulty] = (counts[question.difficulty] || 0) + 1; return counts; }, {}), { 0: 4, 1: 4, 2: 4 });
const extraModule = themeApi.registerModule({ id: "future-module", topicUrl: "topics/future.quiz.gz", ui: { startButton: "Uruchom przyszły moduł" }, appearance: { "--module-accent": "#123456" } });
assert.equal(extraModule.themeId, "politics");
assert.equal(extraModule.ui.startButton, "Uruchom przyszły moduł");
assert.equal(extraModule.appearance["--module-accent"], "#123456");
console.log("Theme: konfiguracja i wszystkie zakresy działają poprawnie.");
