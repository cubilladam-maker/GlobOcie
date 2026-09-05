"use strict";

const app = document.querySelector("#app");
const infoDialog = document.querySelector("#info-dialog");
const infoContent = document.querySelector("#dialog-content");
const confirmDialog = document.querySelector("#confirm-dialog");
const confirmContent = document.querySelector("#confirm-content");
const topProgress = document.querySelector("#top-progress");
const ownerHotspot = document.querySelector("#owner-hotspot");
const ownerCounter = document.querySelector("#owner-counter");

const APP_VERSION = "2.17";
const QUESTION_TRANSITION_MS = 540;
const LOCAL_GAME_STARTS_KEY = "globocie-game-starts-v1";
const AXIS_POSITION_KEY_PREFIX = "globocie-axis-position-v1:";
const THEME_API = window.GLOBOCIE_THEME_API;
const I18N = window.GLOBOCIE_I18N;
const t = (key, vars = {}) => I18N.text(key, vars);
const initialModuleId = localStorage.getItem("globocie-module") || THEME_API.defaultModule || "political-compass";
const initialModule = THEME_API.getModule(initialModuleId);
const initialAxis = THEME_API.getTheme(initialModule.themeId || "politics").axis;
const initialStoredAxisPosition = localStorage.getItem(`${AXIS_POSITION_KEY_PREFIX}${initialModule.id}`) ?? (initialModule.id === THEME_API.defaultModule ? localStorage.getItem("globocie-axis-position") : null);
const initialAxisFallback = Number(initialAxis.defaultValue ?? 50);
const initialAxisCandidate = initialStoredAxisPosition !== null && initialStoredAxisPosition !== "" ? Number(initialStoredAxisPosition) : initialAxisFallback;
const initialSelfPosition = clamp(Number.isFinite(initialAxisCandidate) ? initialAxisCandidate : initialAxisFallback, Number(initialAxis.min ?? 0), Number(initialAxis.max ?? 100));

const DIFFICULTIES = [
  { id: "uczen", label: "Uczeń", sourceBand: 0 },
  { id: "student", label: "Student", sourceBand: 1 },
  { id: "student-plus", label: "Student+", sourceBand: 1 },
  { id: "zaawansowany", label: "Zaawansowany", sourceBand: 1 },
  { id: "zaawansowany-plus", label: "Zaawansowany+", sourceBand: 1 },
  { id: "doktorant", label: "Doktorant", sourceBand: 2 },
  { id: "doktorant-plus", label: "Doktorant+", sourceBand: 2 },
  { id: "doktor", label: "Doktor", sourceBand: 2 },
  { id: "profesor-minus", label: "Profesor−", sourceBand: 2 },
  { id: "profesor", label: "Profesor", sourceBand: 2 },
  { id: "ekspert", label: "Ekspert", sourceBand: 2 }
];

const AXIS_META = {
  economy: { name: "Gospodarka", left: "Rynek", right: "Redystrybucja" },
  social: { name: "Obyczaje", left: "Tradycja", right: "Zmiana" },
  authority: { name: "Wolność", left: "Autonomia", right: "Porządek" },
  eu: { name: "Polska / UE", left: "Suwerenność", right: "Integracja" },
  climate: { name: "Klimat", left: "Ostrożność", right: "Tempo zmian" },
  centralization: { name: "Państwo", left: "Samorząd", right: "Centralizacja" }
};

const NATURAL_QUESTION_REWRITES = new Map([
  ["Wysoka progresja podatkowa jest uzasadniona nie tylko fiskalnie, lecz także jako narzędzie ograniczania koncentracji wpływu ekonomicznego na życie publiczne.", "Wyższe podatki dla najbogatszych mogą być potrzebne nie tylko dla budżetu, ale też po to, żeby pieniądze nie dawały zbyt dużego wpływu na życie publiczne."],
  ["W liberalnej demokracji prewencyjne rozszerzanie kompetencji aparatu bezpieczeństwa bywa akceptowalne, nawet jeśli osłabia zasadę minimalnej ingerencji państwa w sferę prywatną.", "W demokracji państwo może czasem z wyprzedzeniem poszerzać uprawnienia służb, nawet jeśli oznacza to większą ingerencję w prywatność."],
  ["Neutralność światopoglądowa państwa powinna oznaczać aktywne usuwanie historycznych przywilejów dominujących norm kulturowych z prawa publicznego.", "Państwo powinno usuwać z prawa dawne przywileje jednej dominującej tradycji, jeśli chce być naprawdę neutralne światopoglądowo."],
  ["Dalsza integracja europejska powinna obejmować więcej decyzji podejmowanych większościowo na poziomie ponadnarodowym, nawet gdy pojedyncze państwo traci możliwość weta.", "Unia Europejska mogłaby podejmować więcej wspólnych decyzji większością, nawet jeśli pojedyncze państwo nie zawsze mogłoby je zablokować."],
  ["Koszty zewnętrzne emisji powinny być internalizowane regulacyjnie lub cenowo, nawet jeśli krótkookresowo obniża to konkurencyjność części energochłonnych sektorów.", "Firmy zanieczyszczające powinny ponosić koszt emisji w przepisach lub cenach, nawet jeśli na krótko pogorszy to sytuację części energochłonnych branż."],
  ["Równość dostępu do usług publicznych uzasadnia centralne standardy i redystrybucję między regionami, nawet kosztem fiskalnej autonomii samorządów.", "Jeśli wszyscy mają mieć podobny dostęp do usług publicznych, państwo może wyrównywać różnice między regionami, nawet kosztem części finansowej samodzielności samorządów."],
  ["Rozproszona wiedza uczestników rynku sprawia, że administracyjne korygowanie struktury cen i inwestycji częściej tworzy nowe zniekształcenia niż usuwa istniejące.", "Rynek często lepiej sam ustala ceny i kierunki inwestycji niż administracja państwowa."],
  ["Domniemanie wolności jednostki powinno ograniczać prewencyjne uprawnienia państwa także wtedy, gdy część ryzyka bezpieczeństwa pozostaje nieusunięta.", "Państwo powinno powstrzymywać się od wyprzedzającej kontroli ludzi, nawet jeśli nie da się w ten sposób usunąć całego ryzyka."],
  ["Pluralizm liberalny wymaga, aby państwo nie uprzywilejowywało tradycyjnych norm moralnych wobec alternatywnych, dobrowolnych stylów życia dorosłych.", "Jeśli dorośli nikogo nie krzywdzą, państwo nie powinno faworyzować tradycyjnego stylu życia kosztem innych dobrowolnych wyborów."],
  ["Polityka klimatyczna powinna mocniej uwzględniać koszt krańcowy redukcji emisji i opóźniać działania, których koszt społeczny jest nieproporcjonalny do efektu.", "Polityka klimatyczna powinna brać pod uwagę koszt kolejnych redukcji emisji i opóźniać działania, które kosztują społeczeństwo dużo więcej, niż dają efekt."],
  ["Subsydiarność powinna ograniczać przenoszenie nowych kompetencji na poziom unijny, jeśli cele można skutecznie realizować krajowo.", "Nie warto przenosić kolejnych decyzji na poziom Unii, jeśli Polska potrafi skutecznie zająć się nimi sama."],
  ["Zasada subsydiarności przemawia za przekazywaniem kompetencji możliwie najniższemu skutecznemu poziomowi władzy, nawet kosztem mniejszej jednolitości usług.", "Decyzje powinny zapadać możliwie blisko ludzi, jeśli niższy szczebel władzy potrafi skutecznie się nimi zająć — nawet gdy oznacza to mniej jednolite usługi."],
  ["Silna ochrona wolności wypowiedzi powinna obejmować także treści uznawane przez większość za społecznie szkodliwe, o ile nie spełniają wąskich kryteriów bezpośredniego zagrożenia.", "Wolność słowa powinna chronić także treści, które większość uważa za szkodliwe, jeśli nie stanowią bezpośredniego zagrożenia."],
  ["Redystrybucja powinna być ograniczana tam, gdzie osłabia krańcowe bodźce do pracy, oszczędzania i inwestowania bardziej niż poprawia dobrobyt społeczny.", "Redystrybucję warto ograniczać wtedy, gdy bardziej zniechęca do pracy, oszczędzania i inwestowania, niż poprawia życie społeczeństwa."]
]);

const state = {
  screen: "start",
  moduleId: initialModule.id,
  loadedModuleId: null,
  themeId: initialModule.themeId || localStorage.getItem("globocie-theme") || "politics",
  package: null,
  difficulty: Number(localStorage.getItem("globocie-difficulty") || 1),
  selfPosition: initialSelfPosition,
  questions: [],
  currentIndex: 0,
  answers: [],
  scores: freshScores(),
  answerLock: false,
  difficultyChangeAttempted: false,
  hintOpen: false,
  futureTopicsOpen: false,
  sessionStartedMs: null,
  infoDialogKey: null,
  confirmState: null
};

function freshScores(meta = AXIS_META) {
  return Object.fromEntries(Object.keys(meta).map(key => [key, { sum: 0, weight: 0 }]));
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function localGameStarts() {
  const value = Number.parseInt(localStorage.getItem(LOCAL_GAME_STARTS_KEY) || "0", 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function recordLocalGameStart() {
  const nextValue = localGameStarts() + 1;
  localStorage.setItem(LOCAL_GAME_STARTS_KEY, String(nextValue));
  return nextValue;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>\"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch]));
}

function currentModule() { return THEME_API.getModule(state.moduleId); }
function currentTheme() { return THEME_API.getTheme(currentModule().themeId || state.themeId); }
function currentLocalizedModule() { return I18N.module(currentModule().id, currentModule()); }
function currentLocalizedTheme() { return I18N.theme(currentTheme().id || state.themeId, currentTheme()); }
function currentAxisMeta() { return I18N.axisMeta(currentModule().themeId || state.themeId, currentModule().axisMeta || AXIS_META); }
function axisDescription() { return I18N.axisDescription(currentModule().themeId || state.themeId, state.selfPosition, currentTheme()); }
function axisPositionKey(moduleId) { return `${AXIS_POSITION_KEY_PREFIX}${moduleId}`; }
function axisConfigForModule(module) { return THEME_API.getTheme(module.themeId || "politics").axis; }
function normalizedAxisPosition(value, axis) {
  const min = Number(axis?.min ?? 0);
  const max = Number(axis?.max ?? 100);
  const fallback = Number(axis?.defaultValue ?? 50);
  const numeric = value === null || value === undefined || value === "" ? fallback : Number(value);
  return clamp(Number.isFinite(numeric) ? numeric : fallback, min, max);
}
function loadAxisPosition(module) {
  const specific = localStorage.getItem(axisPositionKey(module.id));
  const legacy = module.id === THEME_API.defaultModule ? localStorage.getItem("globocie-axis-position") : null;
  return normalizedAxisPosition(specific ?? legacy, axisConfigForModule(module));
}
function saveAxisPosition(module, value) {
  const normalized = normalizedAxisPosition(value, axisConfigForModule(module));
  localStorage.setItem(axisPositionKey(module.id), String(normalized));
  localStorage.setItem("globocie-axis-position", String(normalized));
  return normalized;
}
function questionText(question) {
  const naturalText = typeof question?.naturalText === "string" ? question.naturalText.trim() : "";
  const polishText = naturalText || NATURAL_QUESTION_REWRITES.get(question?.text) || question?.text || t("questionFallback");
  return I18N.questionText(state.package?.manifest?.id, question?.id, polishText);
}

function questionCategory(question) {
  return I18N.questionCategory(state.package?.manifest?.id, question?.category || t("questionFallback"));
}

function difficultyLabel(index) {
  return I18N.difficultyLabel(index, DIFFICULTIES[index]?.label || t("difficulty"));
}

function syncLocale() {
  const language = I18N.getLanguage();
  document.documentElement.lang = language;
  document.title = t("documentTitle");
  document.querySelectorAll?.("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    const vars = key === "siteVersion" ? { version: APP_VERSION } : {};
    element.textContent = t(key, vars);
  });
  document.querySelectorAll?.("[data-i18n-aria]").forEach(element => {
    const key = element.dataset.i18nAria;
    const vars = key === "siteVersionAria" ? { version: APP_VERSION } : {};
    element.setAttribute("aria-label", t(key, vars));
  });
  document.querySelectorAll?.("[data-language]").forEach(element => {
    element.setAttribute("aria-pressed", element.dataset.language === language ? "true" : "false");
  });
}

function applyModuleAppearance() {
  const module = currentModule();
  const style = document.documentElement?.style;
  const isNeutralStart = state.screen === "start";
  const appearance = isNeutralStart ? (THEME_API.neutralAppearance || {}) : (module.appearance || {});
  Object.entries(appearance).forEach(([name, value]) => style?.setProperty(name, value));
  document.body.dataset.module = module.id;
  document.body.dataset.theme = isNeutralStart ? "neutral" : (currentTheme().id || state.themeId || "politics");
  document.body.dataset.moduleLoaded = state.loadedModuleId === module.id ? "true" : "false";
}

function activateModule(moduleId) {
  const module = THEME_API.getModule(moduleId);
  if (state.moduleId !== module.id) {
    saveAxisPosition(currentModule(), state.selfPosition);
    state.package = null;
    state.loadedModuleId = null;
    state.selfPosition = loadAxisPosition(module);
  }
  state.moduleId = module.id;
  state.themeId = module.themeId || "politics";
  localStorage.setItem("globocie-module", module.id);
  localStorage.setItem("globocie-theme", state.themeId);
  applyModuleAppearance();
  return module;
}

function bytesFromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function decodeTopicBytes(bytes) {
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  let jsonText;
  if (isGzip) {
    if (!("DecompressionStream" in window)) throw new Error(t("browserNoGzip"));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    jsonText = await new Response(stream).text();
  } else jsonText = new TextDecoder().decode(bytes);
  return JSON.parse(jsonText);
}

async function loadCompressedTopic(url) {
  if (location.protocol !== "file:") {
    try {
      const response = await fetch(`${url}?v=${APP_VERSION}-${Date.now()}`, { cache: "no-store" });
      if (response.ok) return decodeTopicBytes(new Uint8Array(await response.arrayBuffer()));
    } catch (error) { console.warn(t("embeddedFallback"), error); }
  }
  const embedded = window.KNJ_EMBEDDED_TOPICS?.[url];
  if (!embedded) throw new Error(t("packageNotFound"));
  return decodeTopicBytes(bytesFromBase64(embedded));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function topicQuestionsForDifficulty(level) {
  const difficulty = DIFFICULTIES[level] || DIFFICULTIES[1];
  const exact = state.package.questions.filter(question => question.difficulty === difficulty.sourceBand);
  const count = state.package.settings?.questionCountByDifficulty?.[String(difficulty.sourceBand)] || exact.length;
  return shuffle(exact).slice(0, Math.min(count, exact.length));
}

function beginSession(level = state.difficulty) {
  state.difficulty = clamp(Number(level), 0, 10);
  localStorage.setItem("globocie-difficulty", String(state.difficulty));
  state.questions = topicQuestionsForDifficulty(state.difficulty);
  state.currentIndex = 0;
  state.answers = [];
  state.scores = freshScores(currentAxisMeta());
  state.answerLock = false;
  state.difficultyChangeAttempted = false;
  state.hintOpen = false;
  state.sessionStartedMs = Date.now();
  recordLocalGameStart();
  persistProgress();
}

function persistProgress() {
  if (!state.package) return;
  localStorage.setItem("globocie-progress", JSON.stringify({
    packageId: state.package.manifest?.id,
    packageVersion: state.package.manifest?.version,
    moduleId: state.moduleId,
    themeId: state.themeId,
    difficulty: state.difficulty,
    selfPosition: state.selfPosition,
    currentIndex: state.currentIndex,
    answers: state.answers,
    scores: state.scores,
    sessionStartedMs: state.sessionStartedMs
  }));
}

function scoreAnswer(question, answerValue) {
  for (const [axis, weight] of Object.entries(question.axes || {})) {
    if (!state.scores[axis]) continue;
    state.scores[axis].sum += answerValue * weight;
    state.scores[axis].weight += Math.abs(weight) * 2;
  }
}

function axisPercent(axis) {
  const bucket = state.scores[axis];
  if (!bucket || bucket.weight === 0) return 50;
  const normalized = clamp(bucket.sum / bucket.weight, -1, 1);
  return Math.round((normalized + 1) * 50);
}

function confidencePercent() {
  if (!state.answers.length) return 0;
  const nonNeutral = state.answers.filter(answer => answer.value !== 0).length;
  const coverage = Object.values(state.scores).filter(value => value.weight > 0).length / Object.keys(state.scores).length;
  return Math.round(clamp(50 + 33 * (nonNeutral / state.answers.length) + 15 * coverage, 0, 96));
}

function difficultyTicks() {
  return `<div class="difficulty-ticks" aria-hidden="true">${DIFFICULTIES.map((_, index) => `<i class="${[0, 1, 9, 10].includes(index) ? "major" : ""}"></i>`).join("")}</div>`;
}

function difficultyLabels() {
  return `<div class="difficulty-labels"><span>${escapeHtml(difficultyLabel(0))}</span><span>${escapeHtml(difficultyLabel(1))}</span><span>${escapeHtml(difficultyLabel(9))}</span><span>${escapeHtml(difficultyLabel(10))}</span></div>`;
}

function aiHologram(extraClass = "") {
  const orbitLabel = t("artificialIntelligenceOrbit");
  return `<div class="ai-hologram ${extraClass}" aria-label="${escapeHtml(t("aiHologramAria"))}"><div class="ai-assembly"><div class="ai-orbit orbit-a"></div><div class="ai-orbit orbit-b"></div><div class="ai-orbit orbit-c"></div><div class="ai-core"><span>A</span><span>I</span></div><div class="ai-text-orbit"><span>${escapeHtml(orbitLabel)}&nbsp; • &nbsp;${escapeHtml(orbitLabel)}&nbsp; • &nbsp;</span></div></div><div class="ai-base"></div></div>`;
}

function fingerprintVisual() {
  return `<div class="fingerprint" aria-hidden="true">${Array.from({ length: 11 }, (_, index) => `<i style="--i:${index}"></i>`).join("")}</div>`;
}

function infoMarkup(key) {
  if (key === "help") return `<h2>${escapeHtml(t("helpTitle"))}</h2><p>${escapeHtml(t("helpParagraph1"))}</p><p>${escapeHtml(t("helpParagraph2"))}</p>`;
  if (key === "privacy") return `<h2>${escapeHtml(t("privacyTitle"))}</h2><p>${escapeHtml(t("privacyParagraph1"))}</p><p>${escapeHtml(t("privacyParagraph2"))}</p>`;
  return "";
}

function showInfo(key) {
  state.infoDialogKey = key;
  infoContent.innerHTML = infoMarkup(key);
  if (!infoDialog.open) infoDialog.showModal();
}

function confirmMarkup() {
  const confirm = state.confirmState;
  if (!confirm) return "";
  if (confirm.key === "difficulty") {
    return `<div class="confirm-symbol">⚠</div><h2>${escapeHtml(t("confirmDifficultyTitle"))}</h2><p>${t("confirmDifficultyChange", { current: escapeHtml(confirm.current), next: escapeHtml(confirm.next) })}</p><p>${escapeHtml(t("confirmAnswersRemoved"))}</p>`;
  }
  return `<div class="confirm-symbol">↻</div><h2>${escapeHtml(t("confirmReturnTitle"))}</h2><p>${escapeHtml(t("confirmReturnBody"))}</p>`;
}

function renderConfirmDialog() {
  if (!state.confirmState) return;
  const confirm = state.confirmState;
  const yesLabel = confirm.key === "difficulty" ? t("startNewGame") : t("returnToStart");
  confirmContent.innerHTML = `<div class="confirm-card">${confirmMarkup()}<div class="confirm-actions"><button class="secondary" id="confirm-no">${escapeHtml(t("stayHere"))}</button><button class="primary" id="confirm-yes">${escapeHtml(yesLabel)}</button></div></div>`;
  confirmContent.querySelector("#confirm-yes").onclick = () => { state.confirmState = null; confirmDialog.close(); confirm.onYes?.(); };
  confirmContent.querySelector("#confirm-no").onclick = () => { state.confirmState = null; confirmDialog.close(); confirm.onNo?.(); };
}

function showConfirm(key, options = {}, onYes, onNo = render) {
  state.confirmState = { key, ...options, onYes, onNo };
  renderConfirmDialog();
  if (!confirmDialog.open) confirmDialog.showModal();
}

function render() {
  applyModuleAppearance();
  ownerCounter.hidden = true;
  document.body.dataset.screen = state.screen;
  topProgress.hidden = state.screen !== "quiz";
  if (state.screen === "start") return renderStart();
  if (state.screen === "loading") return renderLoading();
  if (state.screen === "quiz") return renderQuiz();
  if (state.screen === "results") return renderResults();
  if (state.screen === "profile") return renderFullProfile();
}

function axisSettingCard(context = "start") {
  const theme = currentLocalizedTheme();
  const description = axisDescription();
  const isStart = context === "start";
  const intro = isStart ? `<p class="axis-intro">${escapeHtml(t("axisIntro"))}</p>` : "";
  return `<section class="axis-setting ${isStart ? "" : "axis-readonly"}"><div class="axis-heading"><h3>${escapeHtml(theme.axis.title)}: <strong id="axis-live-label">${escapeHtml(description.label)}</strong></h3>${isStart ? "" : `<span>${escapeHtml(t("initialSetting"))}</span>`}</div>${intro}${isStart ? `<input id="start-self-position" class="glow-range" type="range" min="${theme.axis.min}" max="${theme.axis.max}" step="${theme.axis.step}" value="${state.selfPosition}">` : `<div class="readonly-range"><i style="left:${state.selfPosition}%"></i></div>`}<div class="range-labels"><span>${escapeHtml(theme.axis.leftLabel)}</span><span>${escapeHtml(theme.axis.rightLabel)}</span></div><p class="axis-hint" id="axis-live-hint">${escapeHtml(description.hint)}</p></section>`;
}

function moduleCards() {
  return Object.values(THEME_API.modules).map(module => {
    const theme = currentLocalizedTheme().id === module.themeId ? currentLocalizedTheme() : I18N.theme(module.themeId, THEME_API.getTheme(module.themeId));
    const localized = I18N.module(module.id, module);
    const ui = localized.ui || {};
    const active = state.moduleId === module.id ? " active" : "";
    const appearance = module.appearance || {};
    const cardStyle = `--module-card-accent:${escapeHtml(appearance["--module-accent"] || "#b13cff")};--module-card-accent-2:${escapeHtml(appearance["--module-accent-2"] || "#3c6fff")};--module-card-cyan:${escapeHtml(appearance["--module-cyan"] || "#24d8ff")};--module-card-line:${escapeHtml(appearance["--module-cyan-border"] || "rgba(36,216,255,.58)")};--module-card-bg:${escapeHtml(appearance["--module-panel-start"] || "rgba(6,13,34,.82)")};--module-card-bg-2:${escapeHtml(appearance["--module-panel-end"] || "rgba(4,10,28,.9)")};--module-card-glow:${escapeHtml(appearance["--module-bg-glow"] || "rgba(74,62,255,.22)")}`;
    return `<article class="module available${active}" style="${cardStyle}" data-action="start-module" data-module-id="${escapeHtml(module.id)}" tabindex="0" role="button"><span>${active ? escapeHtml(t("active")) : escapeHtml(t("available"))}</span><h3>${escapeHtml(localized.name || theme.name)}</h3><p>${escapeHtml(ui.cardDescription || theme.eyebrow)}</p></article>`;
  }).join("");
}

function futureTopicsPanel() {
  const topics = THEME_API.futureTopics || [];
  return `<section class="future-topics ${state.futureTopicsOpen ? "open" : ""}"><button class="future-toggle" data-action="toggle-future-topics" aria-expanded="${state.futureTopicsOpen}"><span>${escapeHtml(t("upcomingTopics"))}</span><small>${escapeHtml(t("inPreparation"))}</small><b>${state.futureTopicsOpen ? "←" : "→"}</b></button><div class="future-topic-list" ${state.futureTopicsOpen ? "" : "hidden"} aria-label="${escapeHtml(t("upcomingTopics"))}">${topics.map(topic => `<button class="future-topic" type="button" disabled><strong>${escapeHtml(I18N.futureTopic(topic.id, topic.name))}</strong><span>${escapeHtml(t("comingSoon"))}</span></button>`).join("")}</div></section>`;
}

function renderStart() {
  const module = currentLocalizedModule();
  const theme = currentLocalizedTheme();
  const ui = module.ui || {};
  const bilingualTitle = I18N.getLanguage() === "pl" ? `<p class="start-title-english" lang="en">${escapeHtml(t("titleEnglish"))}</p>` : "";
  app.innerHTML = `<section class="start-page panel">
    <header class="start-title-block"><div class="eyebrow">${escapeHtml(ui.startEyebrow || theme.eyebrow)}</div><h1><span class="title-segment">${escapeHtml(t("titleSegment1"))}</span><span class="title-segment">${escapeHtml(t("titleSegment2"))}</span><span class="title-segment title-segment-accent">${escapeHtml(t("titleSegment3"))}</span></h1>${bilingualTitle}</header>
    <section class="start-copy">
      <div class="start-ai-note"><b>✦</b><span><strong>${escapeHtml(ui.aiLead || t("genericAiLead"))}</strong><small>${escapeHtml(ui.aiSubline || t("genericAiSubline"))}</small></span></div>
      <div class="code-space">${fingerprintVisual()}<div><strong>${escapeHtml(t("uniqueTitle"))}</strong><span>${escapeHtml(t("uniqueBody"))}</span></div></div>
      <div class="start-settings">${axisSettingCard("start")}<section class="setting-box difficulty-box"><h3>${escapeHtml(t("difficulty"))}: <strong id="start-difficulty-label">${escapeHtml(difficultyLabel(state.difficulty))}</strong></h3><input id="start-difficulty" class="glow-range" type="range" min="0" max="10" step="1" value="${state.difficulty}">${difficultyTicks()}${difficultyLabels()}</section></div>
      <div class="benefit-grid"><div><b>◇</b><span><strong>${escapeHtml(t("benefitProfile"))}</strong><small>${escapeHtml(t("benefitProfileBody"))}</small></span></div><div><b>☷</b><span><strong>${escapeHtml(t("benefitAnswers"))}</strong><small>${escapeHtml(t("benefitAnswersBody"))}</small></span></div><div><b>⌘</b><span><strong>${escapeHtml(t("benefitThinking"))}</strong><small>${escapeHtml(t("benefitThinkingBody"))}</small></span></div><div><b>✦</b><span><strong>${escapeHtml(t("benefitAnalysis"))}</strong><small>${escapeHtml(t("benefitAnalysisBody"))}</small></span></div></div>
      <div class="start-actions"><button class="primary big" data-action="start-module" data-module-id="${escapeHtml(module.id)}">${escapeHtml(ui.startButton || t("startNewGame"))}</button><button class="secondary" data-action="scroll-topics">${escapeHtml(t("chooseTopic"))}</button></div><div class="local-game-stat" aria-live="polite"><strong>${localGameStarts()}</strong><span>${escapeHtml(t("localStartsStat"))}</span></div>
    </section>
    <section class="start-stage"><div class="stage-glow"></div>${aiHologram("start-ai")}<p class="stage-caption">${escapeHtml(ui.stageCaption || t("aiNoteFallback"))}</p><div class="topic-selector" id="topics"><div class="module-row">${moduleCards()}</div>${futureTopicsPanel()}</div></section>
  </section>`;
}

function renderLoading() {
  const module = currentLocalizedModule();
  const loading = module.loading || {};
  app.innerHTML = `<section class="panel loading"><div class="loader-ring"></div><h2>${escapeHtml(loading.title || t("genericAiLead"))}</h2><p>${escapeHtml(loading.description || t("uniqueBody"))} ${escapeHtml(t("levelPrefix"))}: ${escapeHtml(difficultyLabel(state.difficulty))}.</p></section>`;
}

function aiHintForQuestion() {
  const generic = I18N.hints();
  return generic[(state.currentIndex + state.difficulty) % generic.length];
}

function shouldOfferHint() { return state.difficulty >= 3 || state.currentIndex % 3 === 2; }

function renderQuiz() {
  const module = currentLocalizedModule();
  const quizUi = module.quiz || {};
  const question = state.questions[state.currentIndex];
  if (!question) { state.screen = "results"; return render(); }
  const count = state.questions.length;
  const progress = Math.round(((state.currentIndex + 1) / count) * 100);
  topProgress.innerHTML = `<span>${escapeHtml(t("questionProgress", { current: state.currentIndex + 1, total: count }))}</span><strong>${progress}%</strong>`;
  const answers = I18N.answerScale(state.package?.manifest?.id, state.package.answerScale || []);
  const offerHint = shouldOfferHint();
  app.innerHTML = `<section class="quiz-page">
    <aside class="panel quiz-settings-panel"><div class="eyebrow">${escapeHtml(t("settings"))}</div>${axisSettingCard("quiz")}<section class="quiz-setting-section"><div class="difficulty-heading"><h3>${escapeHtml(t("difficulty"))}</h3><span>${escapeHtml(t("difficultyCanChange"))}</span></div><input id="difficulty-live" class="glow-range" type="range" min="0" max="10" step="1" value="${state.difficulty}" ${state.difficultyChangeAttempted ? "disabled" : ""}>${difficultyTicks()}${difficultyLabels()}<p>${escapeHtml(state.difficultyChangeAttempted ? t("difficultyAttemptUsed") : t("difficultyShiftRequiresNew"))}</p></section><section class="locked-summary"><div>◉</div><div><strong>${escapeHtml(t("startConfigured"))}</strong><span>${escapeHtml(axisDescription().label)}</span><span>${escapeHtml(t("levelPrefix"))}: ${escapeHtml(difficultyLabel(state.difficulty))}</span></div><b>🔒</b></section><section class="ai-tip-mini"><b>${escapeHtml(t("aiHintLabel"))}</b><p>${escapeHtml(t("aiHintBody"))}</p></section><button class="return-start" data-action="return-start">↻ <span><strong>${escapeHtml(t("returnStart"))}</strong><small>${escapeHtml(t("resetQuiz"))}</small></span></button></aside>
    <main class="panel quiz-question-panel"><div class="question-kicker">${escapeHtml(quizUi.kicker || questionCategory(question) || t("questionFallback"))}</div><h2>${escapeHtml(questionText(question))}</h2><div class="answers compact-answers">${answers.map((answer, index) => `<button class="answer" data-answer="${answer.value}" ${state.answerLock ? "disabled" : ""}><span class="answer-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(answer.label)}</span></button>`).join("")}</div>${offerHint ? `<button class="hint-row" data-action="toggle-hint"><span>✦</span><strong>${escapeHtml(t("questionHint"))}</strong><small>${escapeHtml(t(state.hintOpen ? "hide" : "show"))}</small><b>${state.hintOpen ? "⌃" : "⌄"}</b></button>` : ""}${offerHint && state.hintOpen ? `<div class="hint-box">${escapeHtml(aiHintForQuestion())}</div>` : ""}<div class="question-footnote">${escapeHtml(t("questionFootnote"))}</div></main>
    <aside class="panel quiz-ai-panel">${aiHologram("quiz-ai")}<div class="ai-status"><strong>${escapeHtml(quizUi.aiStatus || t("aiStatusFallback"))}</strong><span>${escapeHtml(quizUi.aiNote || t("aiNoteFallback"))}</span></div></aside>
  </section>`;
}

function chooseAnswer(value, button) {
  if (state.answerLock) return;
  state.answerLock = true;
  const question = state.questions[state.currentIndex];
  const numeric = Number(value);
  button?.classList.add("selected");
  document.querySelector(".quiz-question-panel")?.classList.add("question-leaving");
  scoreAnswer(question, numeric);
  state.answers.push({ questionId: question.id, value: numeric });
  state.currentIndex += 1;
  persistProgress();
  setTimeout(() => {
    state.answerLock = false;
    state.difficultyChangeAttempted = false;
    state.hintOpen = false;
    if (state.currentIndex >= state.questions.length) state.screen = "results";
    render();
  }, QUESTION_TRANSITION_MS);
}

function requestDifficultyChange(requested) {
  if (state.difficultyChangeAttempted) return renderQuiz();
  const direction = requested > state.difficulty ? 1 : -1;
  const nextLevel = clamp(state.difficulty + direction, 0, 10);
  if (nextLevel === state.difficulty) return renderQuiz();
  state.difficultyChangeAttempted = true;
  renderQuiz();
  showConfirm("difficulty", { current: difficultyLabel(state.difficulty), next: difficultyLabel(nextLevel) }, () => { beginSession(nextLevel); state.screen = "quiz"; render(); }, render);
}

function requestReturnStart() {
  showConfirm("return", {}, () => { state.questions = []; state.currentIndex = 0; state.answers = []; state.scores = freshScores(currentAxisMeta()); state.answerLock = false; state.hintOpen = false; state.screen = "start"; localStorage.removeItem("globocie-progress"); render(); });
}

function elapsedMinutes() {
  if (!state.sessionStartedMs) return 0;
  return Math.max(1, Math.round((Date.now() - state.sessionStartedMs) / 60000));
}

function strongestAxes() {
  return Object.keys(currentAxisMeta()).map(axis => ({ axis, value: axisPercent(axis), distance: Math.abs(axisPercent(axis) - 50) })).sort((a, b) => b.distance - a.distance).slice(0, 3);
}

function profileName() {
  const top = strongestAxes();
  const average = top.reduce((sum, item) => sum + item.distance, 0) / Math.max(1, top.length);
  if (average < 10) return t("balancedObserver");
  if (axisPercent("authority") < 52) return t("independentAnalyst");
  if (axisPercent("social") > 58) return t("openReformer");
  return t("pragmaticStrategist");
}

function profileSummary() {
  const names = strongestAxes().map(item => currentAxisMeta()[item.axis].name.toLowerCase());
  return t("profileSummary", { axes: escapeHtml(names.join(", ")) });
}

function radarPoint(percent, index, count, radius, cx, cy) {
  const angle = (-90 + index * (360 / count)) * Math.PI / 180;
  const distance = radius * (percent / 100);
  return [cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance];
}

function radarSvg(compact = false) {
  const axes = Object.keys(currentAxisMeta());
  const values = axes.map(axisPercent);
  const cx = 210, cy = 185, radius = 124;
  const rings = [25, 50, 75, 100].map(percent => `<polygon points="${axes.map((_, index) => radarPoint(percent, index, axes.length, radius, cx, cy).join(",")).join(" ")}" class="radar-ring"/>`).join("");
  const spokes = axes.map((_, index) => { const [x, y] = radarPoint(100, index, axes.length, radius, cx, cy); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-spoke"/>`; }).join("");
  const points = values.map((value, index) => radarPoint(value, index, axes.length, radius, cx, cy));
  const profile = `<polygon points="${points.map(point => point.join(",")).join(" ")}" class="radar-profile"/>`;
  const labels = compact ? "" : axes.map((axis, index) => { const [x, y] = radarPoint(119, index, axes.length, radius, cx, cy); return `<text x="${x}" y="${y}" text-anchor="middle" class="radar-label">${currentAxisMeta()[axis].name} ${values[index]}%</text>`; }).join("");
  return `<svg class="radar3d" viewBox="0 0 420 380" role="img" aria-label="${escapeHtml(t("profileChartAria"))}">${rings}${spokes}${profile}${labels}</svg>`;
}

function axisBarChart() {
  const axes = Object.keys(currentAxisMeta());
  return `<div class="axis-chart" role="group" aria-label="${escapeHtml(t("axisChartAria"))}"><ol class="axis-chart-list">${axes.map(axis => {
    const meta = currentAxisMeta()[axis];
    const value = axisPercent(axis);
    return `<li class="axis-chart-row"><div class="axis-chart-heading"><strong>${escapeHtml(meta.name)}</strong><b>${value}%</b></div><div class="axis-chart-track"><i style="width:${value}%"></i><span style="left:${value}%"></span></div><div class="axis-chart-scale"><span>${escapeHtml(meta.left)}</span><span>${escapeHtml(meta.right)}</span></div></li>`;
  }).join("")}</ol></div>`;
}

function analysisMarkup() {
  const axes = Object.keys(currentAxisMeta()).map(axis => ({ axis, value: axisPercent(axis) }));
  const strongest = [...axes].sort((a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50))[0];
  const weakest = [...axes].sort((a, b) => Math.abs(a.value - 50) - Math.abs(b.value - 50))[0];
  const average = Math.round(axes.reduce((sum, item) => sum + item.value, 0) / Math.max(1, axes.length));
  const strongestName = currentAxisMeta()[strongest.axis].name;
  const weakestName = currentAxisMeta()[weakest.axis].name;
  const direction = t(average >= 50 ? "rightSide" : "leftSide");
  return `<p>${t("analysisStrongest", { strongestName: escapeHtml(strongestName), strongestValue: strongest.value, weakestName: escapeHtml(weakestName), weakestValue: weakest.value })}</p><p>${t("analysisAverage", { average, direction: escapeHtml(direction) })}</p>`;
}

function insightCards() {
  return I18N.insights().map(([icon, title, body]) => `<article class="insight-card"><b>${icon}</b><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div></article>`).join("");
}

function renderResults() {
  const module = currentLocalizedModule();
  const confidence = confidencePercent();
  const completed = state.answers.length;
  const total = state.questions.length || completed;
  app.innerHTML = `<section class="panel result-dashboard">
    <header class="result-heading"><div><div class="eyebrow">${escapeHtml(module.name || t("profileFallback"))}</div><h1>${escapeHtml(profileName())}</h1><p>${profileSummary()}</p></div><div class="score-ring" style="--score:${confidence * 3.6}deg"><strong>${confidence}%</strong><span>${escapeHtml(t("consistency"))}</span></div></header>
    <section class="result-main"><div class="radar-card"><div class="card-heading"><span>${escapeHtml(t("profileMap"))}</span><small>${escapeHtml(t("responsesTime", { completed, total, minutes: elapsedMinutes() }))}</small></div>${radarSvg()}</div><div class="axis-chart-card"><div class="card-heading"><span>${escapeHtml(t("axisComparison"))}</span><small>${escapeHtml(t("axisCenterHint"))}</small></div>${axisBarChart()}</div><div class="insight-stack"><div class="card-heading"><span>${escapeHtml(t("keyObservations"))}</span><small>${escapeHtml(t("basedOnAnswers"))}</small></div>${insightCards()}</div></section>
    <section class="ai-analysis"><b>✦</b><div><span>${escapeHtml(t("analysisTitle"))}</span>${analysisMarkup()}</div></section>
    <div class="results-actions"><button class="primary" data-action="details">${escapeHtml(t("detailsButton"))}</button><button class="secondary" data-action="export-pdf">${escapeHtml(t("downloadResult"))}</button><button class="secondary" data-action="restart-topic">${escapeHtml(t("repeatQuiz"))}</button></div>
  </section>`;
}

function profileBar(axis) {
  const meta = currentAxisMeta()[axis];
  const value = axisPercent(axis);
  return `<div class="profile-bar"><div><strong>${escapeHtml(meta.name)}</strong><span>${value}%</span></div><div class="bar-track"><i style="width:${value}%"></i></div><small><span>${escapeHtml(meta.left)}</span><span>${escapeHtml(meta.right)}</span></small></div>`;
}

function profileDetailCards() {
  return I18N.profileDetails().map(([icon, title, body]) => `<article><b>${icon}</b><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div></article>`).join("");
}

function renderFullProfile() {
  const module = currentLocalizedModule();
  app.innerHTML = `<section class="panel full-profile">
    <header class="profile-hero"><div><div class="eyebrow">${escapeHtml(t("profileFallback"))} · ${escapeHtml(module.name || t("home"))}</div><h1>${escapeHtml(profileName())}</h1><p>${profileSummary()}</p><div class="chips">${strongestAxes().map(item => `<i>${escapeHtml(currentAxisMeta()[item.axis].name)}</i>`).join("")}</div></div><div class="profile-radar">${radarSvg(true)}</div></header>
    <section class="profile-content"><div class="profile-bars"><div class="section-title"><span>${escapeHtml(t("profileAxes"))}</span><small>${escapeHtml(t("profileAxesHint"))}</small></div>${Object.keys(currentAxisMeta()).map(profileBar).join("")}</div><div class="profile-details"><div class="section-title"><span>${escapeHtml(t("profileCode"))}</span><small>${escapeHtml(t("profilePatterns"))}</small></div><div class="profile-card-grid">${profileDetailCards()}</div></div></section>
    <section class="profile-conclusion"><b>✦</b><div><strong>${escapeHtml(t("aiSummary"))}</strong><p>${escapeHtml(t("profileConclusion"))}</p></div></section>
    <div class="results-actions"><button class="primary" data-action="export-pdf">${escapeHtml(t("downloadFullProfile"))}</button><button class="secondary" data-action="results">${escapeHtml(t("backToResults"))}</button><button class="secondary" data-action="home">${escapeHtml(t("home"))}</button></div>
  </section>`;
}

async function startModule(moduleId) {
  const module = activateModule(moduleId);
  state.screen = "loading";
  render();
  try {
    if (!state.package || state.loadedModuleId !== module.id) {
      state.package = await loadCompressedTopic(module.topicUrl);
      state.loadedModuleId = module.id;
      applyModuleAppearance();
    }
    beginSession(state.difficulty);
    state.screen = "quiz";
    render();
  } catch (error) {
    app.innerHTML = `<section class="panel loading error"><h2>${escapeHtml(t("loadingErrorTitle"))}</h2><p>${escapeHtml(error.message || String(error))}</p><button class="secondary" data-action="home">${escapeHtml(t("back"))}</button></section>`;
  }
}

function startPolitics() { return startModule("political-compass"); }

function restartTopic() {
  if (!state.package) return startPolitics();
  beginSession(state.difficulty);
  state.screen = "quiz";
  render();
}

function requestHome() {
  if (state.screen === "quiz") return requestReturnStart();
  state.screen = "start";
  render();
}

function showHelp() {
  showInfo("help");
}

function showPrivacy() {
  showInfo("privacy");
}

function showOwnerCounter(value, suffix) {
  ownerCounter.innerHTML = `<div class="counter-heading">${escapeHtml(t("counterHeading"))}</div><div class="counter-grid"><div class="counter-block"><span>${escapeHtml(t("onlineVisits"))}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(suffix)}</small></div><div class="counter-block local"><span>${escapeHtml(t("localStarts"))}</span><strong>${localGameStarts()}</strong><small>${escapeHtml(t("onDevice"))}</small></div></div><small class="counter-meta">v${escapeHtml(APP_VERSION)} · ${escapeHtml(currentLocalizedModule().name)}</small>`;
  ownerCounter.hidden = false;
}

const visitorCounter = {
  config: window.GLOBOCIE_VISITOR_COUNTER || {},
  visitorId() {
    let id = localStorage.getItem("globocie-visitor-id-v1");
    if (!id) { id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`; localStorage.setItem("globocie-visitor-id-v1", id); }
    return id;
  },
  isOwner() { return localStorage.getItem("globocie-owner-browser-v1") === "1"; },
  async request(path, options = {}) {
    if (!this.config.endpoint) return null;
    const endpoint = this.config.endpoint.replace(/\/$/, "");
    const response = await fetch(`${endpoint}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) }, cache: "no-store" });
    if (!response.ok) throw new Error(t("counterHttp", { status: response.status }));
    return response.json();
  },
  async registerVisit() {
    if (this.isOwner() || !this.config.endpoint) return;
    try { await this.request("/visit", { method: "POST", body: JSON.stringify({ siteId: this.config.siteId, visitorId: this.visitorId() }) }); } catch (error) { console.warn(t("counterUnavailable"), error); }
  },
  async reveal() {
    if (!this.isOwner()) {
      if (this.config.endpoint) {
        const ownerKey = window.prompt(t("ownerPrompt"));
        if (!ownerKey) return;
        try {
          await this.request("/owner", { method: "POST", headers: { "X-Owner-Key": ownerKey }, body: JSON.stringify({ siteId: this.config.siteId, visitorId: this.visitorId() }) });
          localStorage.setItem("globocie-owner-key-v1", ownerKey);
        } catch (error) {
          showOwnerCounter("—", t("invalidOwnerCode"));
          return;
        }
      }
      localStorage.setItem("globocie-owner-browser-v1", "1");
    }
    let value = "—";
    let suffix = t("counterNotConnected");
    if (this.config.endpoint) {
      try {
        const ownerKey = localStorage.getItem("globocie-owner-key-v1") || "";
        const data = await this.request(`/count?siteId=${encodeURIComponent(this.config.siteId)}`, { headers: { "X-Owner-Key": ownerKey } });
        value = String(data.count ?? 0);
      } catch (error) { value = "—"; suffix = t("counterUnavailable"); }
    }
    showOwnerCounter(value, suffix);
  }
};

app.addEventListener("click", event => {
  const answer = event.target.closest("[data-answer]");
  if (answer) return chooseAnswer(answer.dataset.answer, answer);
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;
  if (action === "start-module") return startModule(actionElement.dataset.moduleId || "political-compass");
  if (action === "start-politics") return startPolitics();
  if (action === "scroll-topics") return document.querySelector("#topics")?.scrollIntoView({ behavior: "smooth" });
  if (action === "toggle-future-topics") { state.futureTopicsOpen = !state.futureTopicsOpen; return renderStart(); }
  if (action === "toggle-hint") { state.hintOpen = !state.hintOpen; return renderQuiz(); }
  if (action === "return-start") return requestReturnStart();
  if (action === "home") return requestHome();
  if (action === "restart-topic") return restartTopic();
  if (action === "help") return showHelp();
  if (action === "privacy") return showPrivacy();
  if (action === "close-dialog") return infoDialog.close();
  if (action === "export-pdf") return window.print();
  if (action === "details") { state.screen = "profile"; return render(); }
  if (action === "results") { state.screen = "results"; return render(); }
});

app.addEventListener("input", event => {
  if (event.target.id === "start-self-position") {
    state.selfPosition = saveAxisPosition(currentModule(), event.target.value);
    const description = axisDescription();
    document.querySelector("#axis-live-label").textContent = description.label;
    document.querySelector("#axis-live-hint").textContent = description.hint;
  }
  if (event.target.id === "start-difficulty") {
    state.difficulty = Number(event.target.value);
    localStorage.setItem("globocie-difficulty", String(state.difficulty));
    document.querySelector("#start-difficulty-label").textContent = DIFFICULTIES[state.difficulty].label;
  }
  if (event.target.id === "difficulty-live") requestDifficultyChange(Number(event.target.value));
});

document.addEventListener("click", event => {
  const language = event.target.closest("[data-language]")?.dataset.language;
  if (language) {
    I18N.setLanguage(language);
    return;
  }
  const action = event.target.closest(".topbar [data-action]")?.dataset.action;
  if (action === "help") showHelp();
  if (action === "privacy") showPrivacy();
  if (action === "home") requestHome();
  if (event.target.closest("#info-dialog [data-action='close-dialog']")) { state.infoDialogKey = null; infoDialog.close(); }
});

ownerHotspot.addEventListener("click", () => visitorCounter.reveal());
window.addEventListener?.("globocie-language-change", () => {
  syncLocale();
  render();
  if (infoDialog.open && state.infoDialogKey) infoContent.innerHTML = infoMarkup(state.infoDialogKey);
  if (confirmDialog.open && state.confirmState) renderConfirmDialog();
});
syncLocale();
visitorCounter.registerVisit();
render();
