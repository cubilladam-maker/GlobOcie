"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const themeApi = require("../themes.js");

class TestElement {
  constructor() {
    this.innerHTML = "";
    this.hidden = false;
    this.open = false;
    this.dataset = {};
    this.listeners = {};
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  querySelector() { return new TestElement(); }
  showModal() { this.open = true; }
  close() { this.open = false; }
  classList = { add() {} };
}

const elements = Object.fromEntries(["#app", "#info-dialog", "#dialog-content", "#confirm-dialog", "#confirm-content", "#top-progress", "#owner-hotspot", "#owner-counter"].map(selector => [selector, new TestElement()]));
const storage = new Map();
const rootStyle = { setProperty() {} };
const localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};

const context = vm.createContext({
  console,
  crypto: webcrypto,
  localStorage,
  document: {
    body: new TestElement(),
    documentElement: { style: rootStyle },
    querySelector: selector => elements[selector] || new TestElement(),
    addEventListener() {}
  },
  window: {
    GLOBOCIE_THEME_API: themeApi,
    GLOBOCIE_VISITOR_COUNTER: { endpoint: "", siteId: "globocie" },
    prompt: () => null,
    print() {}
  },
  location: { protocol: "file:" },
  setTimeout,
  clearTimeout,
  TextDecoder,
  TextEncoder,
  Blob,
  Response,
  DecompressionStream,
  atob,
  fetch
});

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const stylesSource = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
vm.runInContext(appSource, context, { filename: "app.js" });

const start = elements["#app"].innerHTML;
assert.match(start, /Odkryj swój[\s\S]*ukryty kod/);
assert.equal((start.match(/class="title-segment(?: title-segment-accent)?"/g) || []).length, 3);
assert.match(start, /class="topic-selector" id="topics"/);
assert.ok(start.indexOf("class=\"module-row\"") < start.indexOf("class=\"future-topics"), "Przyszłe tematy są przy aktywnych modułach");
assert.match(start, /Twój kod jest niepowtarzalny/);
assert.match(start, /Równowaga wolności i państwa/);
assert.doesNotMatch(start, /kobiet|mężczy|wróż|przewodnicz|przewodnik/i);

vm.runInContext(`activateModule("religion-worldview"); state.screen = "start"; render();`, context);
const worldviewStart = elements["#app"].innerHTML;
assert.match(worldviewStart, /Twoja oś światopoglądowa/);
assert.match(worldviewStart, /Więcej autonomii/);
assert.match(worldviewStart, /Więcej zakorzenienia/);
assert.match(worldviewStart, /value="50"/);
assert.match(worldviewStart, /--module-card-accent:#d9a85f/);
assert.doesNotMatch(worldviewStart, /Twoja oś polityczna/);
vm.runInContext(`activateModule("political-compass"); state.screen = "start"; render();`, context);
assert.equal(storage.get("globocie-axis-position-v1:religion-worldview"), "50");

const answerScale = [
  { value: -2, label: "Zdecydowanie się nie zgadzam" },
  { value: -1, label: "Raczej się nie zgadzam" },
  { value: 0, label: "Nie mam pewności / zależy" },
  { value: 1, label: "Raczej się zgadzam" },
  { value: 2, label: "Zdecydowanie się zgadzam" }
];
vm.runInContext(`state.package = ${JSON.stringify({ answerScale })}; state.questions = ${JSON.stringify([{ id: "q1", category: "Obyczaje", text: "Przykładowe pytanie testowe", axes: { social: 1 } }])}; state.currentIndex = 0; state.screen = "quiz"; render();`, context);
const quiz = elements["#app"].innerHTML;
assert.match(quiz, /Przykładowe pytanie testowe/);
assert.equal((quiz.match(/class="answer"/g) || []).length, 5);
assert.ok(quiz.indexOf("compact-answers") - quiz.indexOf("Przykładowe pytanie testowe") < 900, "Odpowiedzi powinny być bezpośrednio pod pytaniem");
assert.doesNotMatch(quiz, /kobiet|mężczy|wróż|przewodnicz|przewodnik/i);
assert.equal(elements["#top-progress"].hidden, false);
assert.match(elements["#top-progress"].innerHTML, /Pytanie 1 \/ 1/);

vm.runInContext(`state.questions = ${JSON.stringify([{ id: "q-natural", category: "Gospodarka", text: "Rozproszona wiedza uczestników rynku sprawia, że administracyjne korygowanie struktury cen i inwestycji częściej tworzy nowe zniekształcenia niż usuwa istniejące.", axes: { economy: 1 } }])}; state.currentIndex = 0; state.screen = "quiz"; render();`, context);
const naturalQuiz = elements["#app"].innerHTML;
assert.match(naturalQuiz, /Rynek często lepiej sam ustala ceny/);
assert.doesNotMatch(naturalQuiz, /Rozproszona wiedza uczestników rynku/);
vm.runInContext(`state.questions = ${JSON.stringify([{ id: "q-natural-2", category: "Gospodarka", text: "Redystrybucja powinna być ograniczana tam, gdzie osłabia krańcowe bodźce do pracy, oszczędzania i inwestowania bardziej niż poprawia dobrobyt społeczny.", axes: { economy: -1 } }])}; state.currentIndex = 0; state.screen = "quiz"; render();`, context);
const naturalQuizTwo = elements["#app"].innerHTML;
assert.match(naturalQuizTwo, /Redystrybucję warto ograniczać/);
assert.doesNotMatch(naturalQuizTwo, /krańcowe bodźce/);

vm.runInContext(`state.answers = [{ questionId: "q1", value: 2 }]; state.scores.social = { sum: 2, weight: 2 }; state.screen = "results"; render();`, context);
const results = elements["#app"].innerHTML;
assert.match(results, /Mapa Twojego profilu/);
assert.match(results, /Porównanie osi/);
assert.equal((results.match(/class="axis-chart-row"/g) || []).length, 6);
assert.match(results, /Analiza AI/);
assert.match(results, /Zobacz pełny profil/);

vm.runInContext(`state.screen = "profile"; render();`, context);
const profile = elements["#app"].innerHTML;
assert.match(profile, /Twój pełny profil/);
assert.equal((profile.match(/class="profile-bar"/g) || []).length, 6);
assert.equal((profile.match(/<article>/g) || []).length, 6);
assert.match(profile, /Podsumowanie AI/);

assert.match(appSource, /QUESTION_TRANSITION_MS = 540/);
assert.match(appSource, /APP_VERSION = "2\.13"/);
assert.match(appSource, /LOCAL_GAME_STARTS_KEY = "globocie-game-starts-v1"/);
assert.match(appSource, /recordLocalGameStart\(\);/);
assert.match(appSource, /counter-grid/);
assert.match(appSource, /Odwiedziny online/);
assert.match(appSource, /Rozpoczęcia gry lokalnie/);
assert.match(appSource, /LOCAL_GAME_STARTS_KEY = "globocie-game-starts-v1"/);
assert.match(appSource, /wersja v\$\{escapeHtml\(APP_VERSION\)\}/);
assert.match(appSource, /startModule\("political-compass"\)/);
assert.match(indexSource, /class="site-version"/);
assert.match(indexSource, /Wersja strony: v2\.13/);
assert.match(stylesSource, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(stylesSource, /\.topic-selector \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/s);
assert.match(stylesSource, /body\[data-screen="start"\] \{ overflow: hidden; \}/);
assert.match(start, /lokalne rozpoczęcia gry na tym urządzeniu/);
assert.match(start, />0<\/strong><span>lokalne rozpoczęcia gry/);
assert.equal(elements["#owner-counter"].hidden, true, "Licznik ma znikać po zmianie ekranu");

storage.set("globocie-game-starts-v1", "7");
vm.runInContext(`state.screen = "start"; render();`, context);
const carriedForward = elements["#app"].innerHTML;
assert.match(carriedForward, />7<\/strong><span>lokalne rozpoczęcia gry/);
vm.runInContext(`state.package = { questions: [{ difficulty: 1, id: "q1", axes: { social: 1 } }] }; beginSession(); state.screen = "start"; render();`, context);
const startedAgain = elements["#app"].innerHTML;
assert.match(startedAgain, />8<\/strong><span>lokalne rozpoczęcia gry/);
assert.equal(storage.get("globocie-game-starts-v1"), "8");
assert.match(start, /Przyszłe tematy/);
assert.match(start, /Globalne ocieplenie/);
assert.doesNotMatch(start, /Nauka, wiara i rzeczywistość/);
console.log("Render: start, quiz, wynik, pełny profil i reguły prywatnego licznika działają poprawnie.");
