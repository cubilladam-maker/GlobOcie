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
    this.textContent = "";
    this.hidden = false;
    this.open = false;
    this.dataset = {};
    this.listeners = {};
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  querySelector() { return new TestElement(); }
  setAttribute(name, value) { this[name] = String(value); }
  showModal() { this.open = true; }
  close() { this.open = false; }
  classList = { add() {} };
}

const elements = Object.fromEntries(["#app", "#info-dialog", "#dialog-content", "#confirm-dialog", "#confirm-content", "#top-progress", "#owner-hotspot", "#owner-counter"].map(selector => [selector, new TestElement()]));
const storage = new Map();
const rootStyle = { values: {}, setProperty(name, value) { this.values[name] = value; } };
const body = new TestElement();
const localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
const windowListeners = {};
const windowObject = {
  GLOBOCIE_THEME_API: themeApi,
  GLOBOCIE_VISITOR_COUNTER: { endpoint: "", siteId: "globocie" },
  localStorage,
  prompt: () => null,
  print() {},
  addEventListener(name, callback) { (windowListeners[name] ||= []).push(callback); },
  dispatchEvent(event) { (windowListeners[event.type] || []).forEach(callback => callback(event)); },
  CustomEvent: class { constructor(type) { this.type = type; } }
};

const context = vm.createContext({
  console,
  crypto: webcrypto,
  localStorage,
  document: {
    body,
    documentElement: { style: rootStyle, lang: "pl" },
    title: "",
    querySelector: selector => elements[selector] || new TestElement(),
    querySelectorAll: () => [],
    addEventListener() {}
  },
  window: windowObject,
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
const i18nSource = fs.readFileSync(path.join(__dirname, "..", "i18n.js"), "utf8");
const indexSource = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const stylesSource = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
vm.runInContext(i18nSource, context, { filename: "i18n.js" });
vm.runInContext(appSource, context, { filename: "app.js" });

const start = elements["#app"].innerHTML;
assert.equal(body.dataset.theme, "neutral", "Ekran wyboru tematów ma neutralny motyw");
assert.equal(rootStyle.values["--module-accent"], themeApi.neutralAppearance["--module-accent"]);
assert.match(start, /Odkryj swój[\s\S]*ukryty kod/);
assert.equal((start.match(/class="title-segment(?: title-segment-accent)?"/g) || []).length, 3);
assert.match(start, /class="start-title-english"[^>]*>Discover your hidden inner code<\/p>/);
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
assert.match(worldviewStart, /--module-card-accent:#e2ad67/);
assert.match(worldviewStart, /class="ai-hologram start-ai heart-mode" data-heart-animation="true"/);
assert.match(worldviewStart, /class="heart-animation" data-heart-animation="true"/);
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
assert.equal(body.dataset.theme, "politics", "Quiz używa motywu aktywnego Theme");
assert.equal(rootStyle.values["--module-accent"], themeApi.getModule("political-compass").appearance["--module-accent"]);
assert.match(quiz, /Przykładowe pytanie testowe/);
assert.equal((quiz.match(/class="answer"/g) || []).length, 5);
assert.ok(quiz.indexOf("compact-answers") - quiz.indexOf("Przykładowe pytanie testowe") < 900, "Odpowiedzi powinny być bezpośrednio pod pytaniem");
assert.doesNotMatch(quiz, /kobiet|mężczy|wróż|przewodnicz|przewodnik/i);
assert.equal(elements["#top-progress"].hidden, false);
assert.match(elements["#top-progress"].innerHTML, /Pytanie 1 \/ 1/);
assert.doesNotMatch(quiz, /data-heart-animation="true"/);

vm.runInContext(`activateModule("religion-worldview"); state.screen = "loading"; render();`, context);
assert.equal(body.dataset.theme, "worldview", "Przełączenie quizu zmienia motyw Theme");
assert.equal(rootStyle.values["--module-accent"], themeApi.getModule("religion-worldview").appearance["--module-accent"]);
assert.notEqual(rootStyle.values["--module-page-bg-2"], themeApi.getModule("political-compass").appearance["--module-page-bg-2"]);
vm.runInContext(`state.package = ${JSON.stringify({ answerScale })}; state.screen = "quiz"; render();`, context);
const worldviewQuiz = elements["#app"].innerHTML;
assert.match(worldviewQuiz, /class="ai-hologram quiz-ai heart-mode" data-heart-animation="true"/);
assert.match(worldviewQuiz, /class="heart-core"/);
vm.runInContext(`activateModule("global-warming"); state.package = ${JSON.stringify({ manifest: { id: "GLOBAL-WARMING-PL" }, answerScale })}; state.questions = ${JSON.stringify([{ id: "gw-u01", category: "Pomiary globalne", text: "Długi szereg pomiarów testowych", axes: { climate: 1 } }])}; state.currentIndex = 0; state.screen = "start"; render();`, context);
const climateStart = elements["#app"].innerHTML;
assert.equal(body.dataset.theme, "neutral", "Ekran wyboru zachowuje neutralny motyw po wyborze modułu klimatycznego");
assert.match(climateStart, /Globalne ocieplenie, prawda czy fake\?/);
assert.match(climateStart, /--module-card-accent:#ff735c/);
vm.runInContext(`state.screen = "quiz"; render();`, context);
const climateQuiz = elements["#app"].innerHTML;
assert.equal(body.dataset.theme, "climate", "Quiz klimatyczny używa własnego motywu");
assert.equal(rootStyle.values["--module-accent"], "#ff735c");
assert.match(climateQuiz, /class="climate-question-artwork"/);
assert.match(climateQuiz, /assets\/climate-atlas\.svg\?v=2\.19/);
assert.match(climateQuiz, /Długi szereg pomiarów testowych/);
assert.doesNotMatch(climateQuiz, /data-heart-animation="true"/);
vm.runInContext(`state.screen = "start"; render();`, context);
assert.equal(body.dataset.theme, "neutral", "Powrót do tematów przywraca neutralny motyw");
assert.equal(rootStyle.values["--module-accent"], themeApi.neutralAppearance["--module-accent"]);
vm.runInContext(`activateModule("political-compass"); state.package = ${JSON.stringify({ answerScale })}; state.questions = ${JSON.stringify([{ id: "q1b", category: "Obyczaje", text: "Powrót do testu motywu", axes: { social: 1 } }])}; state.currentIndex = 0; state.screen = "quiz"; render();`, context);

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
assert.match(profile, /Twój profil/);
assert.equal((profile.match(/class="profile-bar"/g) || []).length, 6);
assert.equal((profile.match(/<article>/g) || []).length, 6);
assert.match(profile, /Podsumowanie AI/);

assert.match(appSource, /QUESTION_TRANSITION_MS = 540/);
assert.match(appSource, /APP_VERSION = "2\.19"/);
assert.match(appSource, /function climateQuestionArtwork\(module = currentModule\(\)\)/);
assert.match(appSource, /function heartAnimationMarkup\(\)/);
assert.match(appSource, /heartAnimationAria/);
assert.match(appSource, /LOCAL_GAME_STARTS_KEY = "globocie-game-starts-v1"/);
assert.match(appSource, /recordLocalGameStart\(\);/);
assert.match(appSource, /counter-grid/);
assert.match(appSource, /t\("onlineVisits"\)/);
assert.match(appSource, /t\("localStarts"\)/);
assert.match(appSource, /LOCAL_GAME_STARTS_KEY = "globocie-game-starts-v1"/);
assert.match(appSource, /counter-meta/);
assert.match(appSource, /startModule\("political-compass"\)/);
assert.match(indexSource, /class="site-version"/);
assert.match(indexSource, /Wersja strony: v2\.19/);
assert.match(indexSource, /i18n\.js\?v=2\.19/);
assert.match(indexSource, /global-warming-pl\.quiz\.gz\.js\?v=2\.19/);
assert.match(stylesSource, /\.climate-question-artwork \{[^}]*pointer-events: none/s);
assert.match(stylesSource, /@keyframes climateAtlasDrift/);
assert.match(stylesSource, /\.start-title-block h1 \{[^}]*grid-template-columns: auto auto auto[^}]*justify-content: center/s);
assert.match(stylesSource, /\.start-title-block h1 \{[^}]*column-gap: clamp\(8px, 1\.4vw, 24px\)/s);
assert.match(stylesSource, /\.start-title-block h1 \{[^}]*width: 100%/s);
assert.match(stylesSource, /\.start-title-english \{/);
assert.match(stylesSource, /\.topic-selector \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/s);
assert.match(stylesSource, /\.panel \{[^}]*var\(--module-panel-start\)/s);
assert.match(stylesSource, /\.primary \{[^}]*var\(--module-primary-start\)/s);
assert.match(stylesSource, /\.ai-core span \{[^}]*var\(--module-holo-core-bottom\)/s);
assert.match(stylesSource, /\.heart-animation \{/);
assert.match(stylesSource, /@keyframes heartBeat/);
assert.match(stylesSource, /@keyframes heartRipple/);
assert.match(stylesSource, /\.radar-profile \{[^}]*var\(--module-radar-profile-stroke\)/s);
assert.match(stylesSource, /body\[data-screen="start"\] \{ overflow: hidden; \}/);
assert.match(start, /lokalne rozpoczęcia gry na tym urządzeniu/);
assert.match(start, />0<\/strong><span>lokalne rozpoczęcia gry/);
assert.equal(elements["#owner-counter"].hidden, true, "Licznik ma znikać po zmianie ekranu");

const i18n = vm.runInContext("window.GLOBOCIE_I18N", context);
vm.runInContext(`state.package = ${JSON.stringify({ manifest: { id: "POLITYKA-PL" }, answerScale })}; state.questions = ${JSON.stringify([{ id: "u01", category: "Gospodarka", text: "Polskie pytanie testowe", axes: { economy: 1 } }])}; state.answers = [{ questionId: "u01", value: 2 }]; state.currentIndex = 0; state.difficulty = 2; state.screen = "quiz"; render();`, context);
const answersBeforeLanguage = vm.runInContext("JSON.stringify(state.answers)", context);
i18n.setLanguage("en");
const englishQuiz = elements["#app"].innerHTML;
assert.match(elements["#top-progress"].innerHTML, /Question 1 \/ 1/);
assert.match(englishQuiz, /The state should provide more help/);
assert.match(englishQuiz, /Strongly agree/);
assert.doesNotMatch(englishQuiz, /Pytanie|Poziom trudności|Zdecydowanie się zgadzam|Gospodarka/);
assert.equal(vm.runInContext("JSON.stringify(state.answers)", context), answersBeforeLanguage, "Zmiana języka nie kasuje odpowiedzi");
assert.equal(vm.runInContext("state.currentIndex", context), 0, "Zmiana języka nie zmienia postępu pytania");
assert.equal(context.document.documentElement.lang, "en");

vm.runInContext(`state.screen = "start"; render();`, context);
const englishStart = elements["#app"].innerHTML;
assert.match(englishStart, /Discover your[\s\S]*hidden inner[\s\S]*code/);
assert.doesNotMatch(englishStart, /class="start-title-english"/);
assert.match(englishStart, /Upcoming topics/);
assert.match(englishStart, /Searching for God/);
assert.doesNotMatch(englishStart, /Odkryj swój|wewnętrzny|ukryty kod|Przyszłe tematy|Wkrótce/);
vm.runInContext(`state.screen = "quiz"; render();`, context);

vm.runInContext(`state.screen = "results"; render();`, context);
const englishResults = elements["#app"].innerHTML;
assert.match(englishResults, /Your profile map/);
assert.match(englishResults, /AI analysis/);
assert.doesNotMatch(englishResults, /Mapa Twojego profilu|Analiza AI|odpowiedzi/);
vm.runInContext(`showHelp();`, context);
assert.match(elements["#dialog-content"].innerHTML, /How does it work/);
assert.doesNotMatch(elements["#dialog-content"].innerHTML, /Jak to działa/);
i18n.setLanguage("pl");
assert.equal(context.document.documentElement.lang, "pl");
assert.match(elements["#dialog-content"].innerHTML, /Jak to działa/);
vm.runInContext(`infoDialog.close(); state.screen = "start"; render();`, context);

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
