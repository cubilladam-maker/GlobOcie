"use strict";

const app = document.querySelector("#app");
const dialog = document.querySelector("#info-dialog");
const dialogContent = document.querySelector("#dialog-content");

const DIFFICULTIES = [
  { id: "uczen", label: "Uczeń", level: 0, minutesPerQuestion: 0.42, sourceBand: 0 },
  { id: "student", label: "Student", level: 1, minutesPerQuestion: 0.50, sourceBand: 1 },
  { id: "student-plus", label: "Student+", level: 2, minutesPerQuestion: 0.55, sourceBand: 1 },
  { id: "zaawansowany", label: "Zaawansowany", level: 3, minutesPerQuestion: 0.60, sourceBand: 1 },
  { id: "zaawansowany-plus", label: "Zaawansowany+", level: 4, minutesPerQuestion: 0.65, sourceBand: 1 },
  { id: "doktorant", label: "Doktorant", level: 5, minutesPerQuestion: 0.70, sourceBand: 2 },
  { id: "doktorant-plus", label: "Doktorant+", level: 6, minutesPerQuestion: 0.76, sourceBand: 2 },
  { id: "doktor", label: "Doktor", level: 7, minutesPerQuestion: 0.82, sourceBand: 2 },
  { id: "profesor-minus", label: "Profesor−", level: 8, minutesPerQuestion: 0.88, sourceBand: 2 },
  { id: "profesor", label: "Profesor", level: 9, minutesPerQuestion: 0.95, sourceBand: 2 },
  { id: "ekspert", label: "Ekspert", level: 10, minutesPerQuestion: 1.02, sourceBand: 2 }
];

const AXIS_META = {
  economy: { left: "Więcej rynku", right: "Więcej redystrybucji", name: "Gospodarka" },
  social: { left: "Bardziej tradycyjnie", right: "Bardziej progresywnie", name: "Obyczaje" },
  authority: { left: "Więcej wolności", right: "Więcej porządku", name: "Wolność / porządek" },
  eu: { left: "Więcej suwerenności", right: "Więcej integracji", name: "Polska / UE" },
  climate: { left: "Wolniejsze regulacje", right: "Szybsza interwencja", name: "Klimat i energia" },
  centralization: { left: "Więcej samorządności", right: "Więcej centralizacji", name: "Państwo / samorząd" }
};

const storedUserGender = localStorage.getItem("knj-user-gender") || "male";

const state = {
  screen: "start",
  userGender: storedUserGender,
  genderChangeUsed: sessionStorage.getItem("knj-gender-change-used") === "1",
  // Motyw/przewodnik jest celowo przeciwny do płci użytkownika:
  // kobieta AI prowadzi mężczyznę, mężczyzna AI prowadzi kobietę.
  theme: storedUserGender === "male" ? "female" : "male",
  package: null,
  difficulty: 1,
  difficultyAtScreenStart: 1,
  pendingDifficulty: null,
  selfPosition: 50,
  questions: [],
  currentIndex: 0,
  answers: [],
  selectedAnswer: null,
  scores: freshScores(),
  adviceVisible: true,
  packageVersion: null,
  timerDeadlineMs: null,
  timerDurationSeconds: 0,
  sessionStartedMs: null
};

function freshScores() {
  return Object.fromEntries(Object.keys(AXIS_META).map(k => [k, { sum: 0, weight: 0 }]));
}

function setTheme(theme) {
  state.theme = theme;
  document.body.dataset.theme = theme;
  localStorage.setItem("knj-theme", theme);
}

function guideGenderForUser(gender = state.userGender) {
  return gender === "male" ? "female" : "male";
}

function guideRoleLabel() {
  return state.theme === "female" ? "Twoja przewodniczka AI" : "Twój przewodnik AI";
}

function setUserGender(gender) {
  if (gender !== "male" && gender !== "female") return;
  if (gender === state.userGender) return;
  if (state.genderChangeUsed) return;

  state.userGender = gender;
  state.genderChangeUsed = true;
  sessionStorage.setItem("knj-gender-change-used", "1");
  localStorage.setItem("knj-user-gender", gender);
  setTheme(guideGenderForUser(gender));
}

function guideImage() {
  return state.theme === "female" ? "assets/guide-female.png" : "assets/guide-male.png";
}

function difficultyTicks() {
  return `<div class="difficulty-ticks" aria-hidden="true">${DIFFICULTIES.map((_, i) => `<i class="${i === 0 || i === 1 || i === 9 || i === 10 ? "major" : ""}"></i>`).join("")}</div>`;
}

function difficultyAnchorLabels() {
  return `<div class="difficulty-anchor-labels"><span style="grid-column:1">Uczeń</span><span style="grid-column:2">Student</span><span style="grid-column:10">Profesor</span><span style="grid-column:11">Ekspert</span></div>`;
}

function bytesFromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function decodeTopicBytes(bytes) {
  let jsonText;
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;

  if (isGzip) {
    if (!("DecompressionStream" in window)) {
      throw new Error("Ta przeglądarka nie obsługuje rozpakowywania GZIP. Użyj aktualnego Chrome/Edge/Firefox.");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    jsonText = await new Response(stream).text();
  } else {
    jsonText = new TextDecoder().decode(bytes);
  }

  return JSON.parse(jsonText);
}

async function loadCompressedTopic(url) {
  // Przy zwykłym hostingu pobieramy kanoniczną paczkę .gz.
  // Przy uruchomieniu bezpośrednio z dysku (file://) fetch() jest blokowany przez
  // zabezpieczenia przeglądarki, więc używamy automatycznie wygenerowanej kopii
  // transportowej. To nadal te same SKOMPRESOWANE bajty GZIP, tylko zapisane Base64.
  if (location.protocol !== "file:") {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        return decodeTopicBytes(new Uint8Array(await response.arrayBuffer()));
      }
    } catch (error) {
      console.warn("Nie udało się pobrać paczki; próbuję lokalnej kopii skompresowanej.", error);
    }
  }

  const embedded = window.KNJ_EMBEDDED_TOPICS?.[url];
  if (!embedded) {
    throw new Error("Nie znaleziono skompresowanej paczki tematu ani jej lokalnej kopii transportowej.");
  }
  return decodeTopicBytes(bytesFromBase64(embedded));
}

function estimateSecondsForSession() {
  const remaining = Math.max(0, state.questions.length - state.currentIndex);
  return Math.max(60, Math.round(remaining * DIFFICULTIES[state.difficulty].minutesPerQuestion * 60));
}

function startCountdown(reset = true) {
  if (reset || !state.timerDeadlineMs) {
    state.timerDurationSeconds = estimateSecondsForSession();
    state.timerDeadlineMs = Date.now() + state.timerDurationSeconds * 1000;
  }
}

function remainingSeconds() {
  if (!state.timerDeadlineMs) return estimateSecondsForSession();
  return Math.max(0, Math.ceil((state.timerDeadlineMs - Date.now()) / 1000));
}

function formatTimeSeconds(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function refreshCountdownDisplay() {
  const el = document.querySelector("#countdown-time");
  if (!el) return;
  el.textContent = formatTimeSeconds(remainingSeconds());
}

function topicQuestionsForDifficulty(level) {
  const difficulty = DIFFICULTIES[level] || DIFFICULTIES[1];
  const sourceBand = difficulty.sourceBand;
  const exact = state.package.questions.filter(q => q.difficulty === sourceBand);
  const target = state.package.settings.questionCountByDifficulty[String(sourceBand)] || exact.length;
  return shuffle(exact).slice(0, Math.min(target, exact.length));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function beginSession(level = state.difficulty) {
  state.difficulty = level;
  state.difficultyAtScreenStart = level;
  state.pendingDifficulty = null;
  state.questions = topicQuestionsForDifficulty(level);
  state.currentIndex = 0;
  state.answers = [];
  state.selectedAnswer = null;
  state.scores = freshScores();
  state.adviceVisible = true;
  state.sessionStartedMs = Date.now();
  startCountdown(true);
  persistProgress();
}

function clearMeasurementHistory() {
  // Celowo zerujemy CAŁĄ część pomiarową. Poprzednie pytania i odpowiedzi
  // są traktowane jako niebyłe po zatwierdzeniu zmiany poziomu trudności.
  state.answers = [];
  state.currentIndex = 0;
  state.selectedAnswer = null;
  state.scores = freshScores();
  state.timerDeadlineMs = null;
  state.timerDurationSeconds = 0;
  state.sessionStartedMs = null;
  localStorage.removeItem("knj-progress");
}

function persistProgress() {
  if (!state.package) return;
  const payload = {
    packageId: state.package.manifest.id,
    packageVersion: state.package.manifest.version,
    difficulty: state.difficulty,
    currentIndex: state.currentIndex,
    answers: state.answers,
    scores: state.scores,
    theme: state.theme,
    userGender: state.userGender,
    selfPosition: state.selfPosition,
    timerDeadlineMs: state.timerDeadlineMs,
    timerDurationSeconds: state.timerDurationSeconds,
    sessionStartedMs: state.sessionStartedMs
  };
  localStorage.setItem("knj-progress", JSON.stringify(payload));
}

function scoreAnswer(question, answerValue) {
  for (const [axis, weight] of Object.entries(question.axes || {})) {
    const bucket = state.scores[axis];
    if (!bucket) continue;
    bucket.sum += answerValue * weight;
    bucket.weight += Math.abs(weight) * 2; // skala odpowiedzi -2..2
  }
}

function axisPercent(axis) {
  const bucket = state.scores[axis];
  if (!bucket || bucket.weight === 0) return 50;
  const normalized = Math.max(-1, Math.min(1, bucket.sum / bucket.weight));
  return Math.round((normalized + 1) * 50);
}

function confidencePercent() {
  if (!state.answers.length) return 0;
  const nonNeutral = state.answers.filter(a => a.value !== 0).length;
  const coverage = Object.values(state.scores).filter(x => x.weight > 0).length / Object.keys(state.scores).length;
  return Math.round(Math.min(96, 48 + 35 * (nonNeutral / state.answers.length) + 15 * coverage));
}

function render() {
  setTheme(guideGenderForUser(state.userGender));
  document.body.dataset.screen = state.screen;
  if (state.screen === "start") return renderStart();
  if (state.screen === "loading") return renderLoading();
  if (state.screen === "quiz") return renderQuiz();
  if (state.screen === "difficulty-reset") return renderDifficultyReset();
  if (state.screen === "results") return renderResults();
}

function renderStart() {
  app.innerHTML = `
    <section class="start-grid">
      <div class="panel hero-copy">
        <div class="hero-intro">
          <div class="eyebrow">Poznaj siebie z pomocą sztucznej inteligencji</div>
          <h1>Kim naprawdę <span>jestem</span></h1>
          <p class="lead">Interaktywny quiz, w którym Sztuczna Inteligencja prowadzi Cię przez pytania i pomaga uporządkować odpowiedzi w czytelny profil.</p>
          <div class="ai-line"><strong>Jestem Twoją Sztuczną Inteligencją (AI).</strong><br>${state.theme === "female" ? "Od teraz jestem Twoją przewodniczką." : "Od teraz jestem Twoim przewodnikiem."}</div>
        </div>

        <div class="identity-block">
          <div class="identity-heading"><strong>Kim jesteś?</strong><span>Przewodnik AI będzie płci przeciwnej.</span></div>
          <div class="theme-picker ${state.genderChangeUsed ? "locked" : ""}" role="group" aria-label="Wybierz swoją płeć">
            <button class="theme-button ${state.userGender === "female" ? "active" : ""}" data-user-gender="female" ${state.genderChangeUsed ? "disabled" : ""}><span>♀</span><strong>Jestem kobietą</strong><small>Wróży Ci mężczyzna AI</small></button>
            <button class="theme-button ${state.userGender === "male" ? "active" : ""}" data-user-gender="male" ${state.genderChangeUsed ? "disabled" : ""}><span>♂</span><strong>Jestem mężczyzną</strong><small>Wróży Ci kobieta AI</small></button>
          </div>
          <div class="theme-note"><strong>Uwaga:</strong> wybór nie zmienia inteligencji gry, pytań ani wyniku. ${state.genderChangeUsed ? "Zmiana została już wykorzystana — wybór jest zablokowany do końca tej sesji." : "Ten wybór możesz zmienić tylko jeden raz w tej sesji."}</div>
        </div>

        <div class="start-settings">
          <div class="start-setting">
            <h3>Twoja oś światopoglądowa — ustawienie początkowe</h3>
            <input id="start-self-position" type="range" min="0" max="100" step="5" value="${state.selfPosition}" aria-label="Początkowa kalibracja własnej pozycji">
            <div class="range-labels"><span>Więcej wolności</span><span>Więcej państwa</span></div>
            <div class="difficulty-note"><strong>Ustawiasz tylko tutaj.</strong> W trakcie quizu ten element będzie już wyłącznie wskaźnikiem.</div>
          </div>
          <div class="start-setting">
            <h3>Poziom trudności: <strong id="start-difficulty-label">${DIFFICULTIES[state.difficulty].label}</strong></h3>
            <input id="start-difficulty" type="range" min="0" max="10" step="1" value="${state.difficulty}" aria-label="Początkowy poziom trudności, 11 stopni">
            ${difficultyTicks()}
            ${difficultyAnchorLabels()}
            <div class="difficulty-note">Ten poziom możesz później zmienić na ekranie pytania. Zatwierdzona zmiana rozpoczyna nową serię i unieważnia wcześniejsze odpowiedzi.</div>
          </div>
        </div>

        <div class="hero-actions">
          <button class="primary" data-action="start-politics">Rozpocznij darmowy temat →</button>
          <button class="secondary" data-action="scroll-topics">Wybierz temat</button>
        </div>
      </div>

      <div class="panel hero-art">
        <img src="${guideImage()}" alt="Przewodnik Sztucznej Inteligencji" />
        <div class="hero-badge"><strong>Sztuczna Inteligencja (AI)</strong><br><small>${guideRoleLabel()}</small></div>
      </div>

      <div class="panel topics" id="topics">
        <h2>Dostępne tematy quizów</h2>
        <p class="theme-note">Każdy temat uruchamia własny zestaw danych i własną skórkę. Silnik pozostaje wspólny.</p>
        <div class="topic-grid">
          <article class="topic-card available" data-action="start-politics">
            <span class="tag">Darmowy</span>
            <h3>Położenie na scenie politycznej</h3>
            <p>Poznaj swoje poglądy na wielu niezależnych osiach.</p>
          </article>
          ${["Wartości życiowe", "Styl myślenia", "Relacje i emocje"].map(title => `
          <article class="topic-card"><span class="tag locked">Wkrótce</span><h3>${title}</h3><p>Oddzielny moduł tematyczny do doładowania.</p></article>`).join("")}
        </div>
      </div>
    </section>`;
}

function renderLoading() {
  app.innerHTML = `<section class="loading"><div><b>Ładuję skompresowane archiwum tematu…</b><br><br>Pytania i odpowiedzi nie są wpisane na stałe do rdzenia aplikacji.</div></section>`;
}

function renderQuiz() {
  const q = state.questions[state.currentIndex];
  if (!q) { state.screen = "results"; return render(); }

  const progress = Math.round((state.currentIndex / state.questions.length) * 100);
  const answerOptions = state.package.answerScale;
  const difficultyChanged = state.pendingDifficulty !== null && state.pendingDifficulty !== state.difficulty;

  app.innerHTML = `
    <section class="quiz-layout">
      <aside class="panel guide-card">
        <div class="guide-portrait"><img src="${guideImage()}" alt="${state.theme === "female" ? "Przewodniczka" : "Przewodnik"} Sztucznej Inteligencji"></div>
        <div class="guide-copy">
          <h3>Sztuczna Inteligencja</h3>
          <p>Odpowiadaj szczerze. Nie ma dobrych ani złych odpowiedzi. Wynik powstaje wyłącznie z Twoich wyborów.</p>
        </div>
      </aside>

      <div class="quiz-main">
        <section class="panel progress-panel">
          <div class="progress-row">
            <div><strong>Pytanie ${state.currentIndex + 1} z ${state.questions.length}</strong><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div></div>
            <div><small>Pozostały czas</small><div class="time" id="countdown-time">${formatTimeSeconds(remainingSeconds())}</div></div>
          </div>
        </section>

        <section class="panel question-card">
          <div class="question-kicker">${q.category}</div>
          <h2>${q.text}</h2>
          <div class="answers">
            ${answerOptions.map((a, i) => `
              <button class="answer ${state.selectedAnswer === a.value ? "selected" : ""}" data-answer="${a.value}">
                <span class="answer-num">${i + 1}</span><span>${a.label}</span>
              </button>`).join("")}
          </div>
        </section>

        <section class="controls">
          <div class="panel control-panel">
            <h3>Twoja oś światopoglądowa — wskaźnik</h3>
            <div class="readonly-range" role="img" aria-label="Początkowa pozycja na osi światopoglądowej: ${state.selfPosition} procent">
              <div class="readonly-range-track"><i class="readonly-range-dot" style="left:${state.selfPosition}%"></i></div>
            </div>
            <div class="range-labels"><span>Więcej wolności</span><span>Więcej państwa</span></div>
            <div class="difficulty-note">Ustawienie z pierwszego ekranu. Podczas quizu jest tylko wskaźnikiem i nie można go już przesuwać.</div>
          </div>
          <div class="panel control-panel">
            <h3>Poziom trudności: <strong id="difficulty-label">${DIFFICULTIES[state.pendingDifficulty ?? state.difficulty].label}</strong></h3>
            <input id="difficulty" type="range" min="0" max="10" step="1" value="${state.pendingDifficulty ?? state.difficulty}" aria-label="Poziom trudności, 11 stopni">
            ${difficultyTicks()}
            ${difficultyAnchorLabels()}
            <div class="difficulty-note">Na tym ekranie możesz przesunąć poziom maksymalnie o 1 działkę. Zmiana poziomu unieważni dotychczasową serię pomiarową dopiero po jej zatwierdzeniu.</div>
          </div>
        </section>

        <section class="restart-callout ${difficultyChanged ? "visible" : ""}" id="restart-callout">
          <div><strong>Zmieniłeś poziom trudności.</strong><p>Po zatwierdzeniu dotychczasowe pytania i odpowiedzi będą traktowane jako niebyłe.</p></div>
          <button class="restart-button" data-action="apply-difficulty">Zastosuj nowy poziom →</button>
        </section>

        <div class="quiz-actions no-back">
          <button class="abort-button" data-action="abort-quiz">✕ Przerwij quiz i wróć do początku</button>
          <div class="no-return-note">Po zatwierdzeniu odpowiedzi nie wracamy do wcześniejszych pytań.</div>
          <button class="primary" id="next-question" data-action="next" ${state.selectedAnswer === null || difficultyChanged ? "disabled" : ""}>${state.currentIndex + 1 === state.questions.length ? "Zobacz wynik" : "Następne pytanie"} →</button>
        </div>
      </div>

      <aside class="panel result-preview">
        <h3>Podgląd wymiarów</h3>
        <p>To orientacyjny podgląd. Pełna interpretacja pojawi się dopiero po zakończeniu quizu.</p>
        ${Object.entries(AXIS_META).map(([axis, meta]) => `
          <div class="axis-mini"><header><span>${meta.name}</span><span>${state.scores[axis].weight ? axisPercent(axis) + "%" : "—"}</span></header><div class="axis-bar"><i style="width:${axisPercent(axis)}%"></i></div></div>
        `).join("")}
        <div class="preview-note">Ty: <strong>${state.userGender === "male" ? "mężczyzna" : "kobieta"}</strong> · prowadzi Cię <strong>${state.theme === "female" ? "kobieta AI" : "mężczyzna AI"}</strong>. Nie wpływa to na wynik.</div>
      </aside>
    </section>`;
}

function renderDifficultyReset() {
  const d = DIFFICULTIES[state.difficulty];
  app.innerHTML = `
    <section class="panel interstitial">
      <div class="symbol">✦</div>
      <div class="eyebrow">Sztuczna Inteligencja dostosowała quiz</div>
      <h2>Nowy poziom: ${d.label}</h2>
      <p>Poprzednia seria została usunięta z pomiaru i nie będzie miała żadnego wpływu na wynik. Zaczynamy od nowa pytaniami przygotowanymi dla poziomu <strong>${d.label}</strong>.</p>
      <p>Nowa seria: <strong>${state.questions.length} pytań</strong> · przewidywany czas około <strong>${Math.ceil(estimateSecondsForSession()/60)} min</strong>.</p>
      <div class="interstitial-actions">
        <button class="abort-button" data-action="abort-quiz">✕ Przerwij quiz i wróć do początku</button>
        <button class="primary" data-action="resume-after-difficulty">Rozpocznij nową serię →</button>
      </div>
    </section>`;
}


function elapsedSessionSeconds() {
  if (!state.sessionStartedMs) return 0;
  return Math.max(0, Math.round((Date.now() - state.sessionStartedMs) / 1000));
}

function formatDurationLong(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h} h ${m} min ${s} s` : `${m} min ${s} s`;
}

function resultProfileType() {
  const vals = Object.keys(AXIS_META).map(axisPercent);
  const spread = Math.max(...vals) - Math.min(...vals);
  const offCenter = vals.reduce((a, v) => a + Math.abs(v - 50), 0) / vals.length;
  if (spread >= 60) return "Unikalny profil";
  if (offCenter < 12) return "Profil centrowy";
  return "Profil wielowymiarowy";
}

function resultSummaryText() {
  const economy = axisPercent("economy");
  const authority = axisPercent("authority");
  const social = axisPercent("social");
  const parts = [];
  if (economy < 42) parts.push("większą swobodę gospodarczą");
  else if (economy > 58) parts.push("większą rolę redystrybucji");
  else parts.push("równowagę między rynkiem a redystrybucją");
  if (authority < 42) parts.push("silny nacisk na wolności osobiste");
  else if (authority > 58) parts.push("większą rolę porządku i instytucji państwa");
  if (social < 40) parts.push("bardziej tradycyjne podejście obyczajowe");
  else if (social > 60) parts.push("bardziej progresywne podejście obyczajowe");
  return `Twój profil wskazuje na ${parts.slice(0, 2).join(" oraz ")}.`;
}

function politicalMapSvg() {
  const economy = axisPercent("economy");
  const authority = axisPercent("authority");
  const xPct = 100 - economy; // prawa strona = więcej rynku
  const yPct = 100 - authority; // góra = więcej porządku/autorytaryzmu
  const x = 38 + (xPct / 100) * 224;
  const y = 34 + (yPct / 100) * 224;
  return `
    <svg class="political-map-svg" viewBox="0 0 300 300" role="img" aria-label="Mapa położenia politycznego">
      <defs>
        <linearGradient id="quadTop" x1="0" x2="1"><stop offset="0" stop-color="#c92a6f"/><stop offset="1" stop-color="#315cff"/></linearGradient>
        <linearGradient id="quadBottom" x1="0" x2="1"><stop offset="0" stop-color="#e33c5a"/><stop offset="1" stop-color="#39b979"/></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect x="38" y="34" width="224" height="112" rx="6" fill="url(#quadTop)" opacity=".85"/>
      <rect x="38" y="146" width="224" height="112" rx="6" fill="url(#quadBottom)" opacity=".85"/>
      ${[0,1,2,3,4,5,6,7,8].map(i=>`<line x1="${38+i*28}" y1="34" x2="${38+i*28}" y2="258" stroke="rgba(255,255,255,.16)"/>`).join("")}
      ${[0,1,2,3,4,5,6,7,8].map(i=>`<line x1="38" y1="${34+i*28}" x2="262" y2="${34+i*28}" stroke="rgba(255,255,255,.16)"/>`).join("")}
      <line x1="150" y1="28" x2="150" y2="266" stroke="#f3f5ff" stroke-width="2"/>
      <line x1="30" y1="146" x2="270" y2="146" stroke="#f3f5ff" stroke-width="2"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="#41d6ff" stroke="#fff" stroke-width="3" filter="url(#glow)"/>
      <text x="150" y="16" text-anchor="middle" class="map-label">Autorytaryzm</text>
      <text x="150" y="291" text-anchor="middle" class="map-label">Libertarianizm</text>
      <text x="5" y="126" class="map-label">Lewa strona</text>
      <text x="5" y="140" class="map-sub">równość</text>
      <text x="5" y="154" class="map-sub">redystrybucja</text>
      <text x="295" y="126" text-anchor="end" class="map-label">Prawa strona</text>
      <text x="295" y="140" text-anchor="end" class="map-sub">wolność</text>
      <text x="295" y="154" text-anchor="end" class="map-sub">gospodarcza</text>
    </svg>`;
}

const PARTY_UI_DEMO = [
  { name:"Konfederacja Wolność i Niepodległość", color:"#3197ff", profile:{economy:15,social:22,authority:45,eu:10,climate:15,centralization:30} },
  { name:"Prawo i Sprawiedliwość (PiS)", color:"#4f8cff", profile:{economy:62,social:20,authority:78,eu:22,climate:48,centralization:78} },
  { name:"Polska 2050", color:"#ffc12d", profile:{economy:50,social:58,authority:46,eu:75,climate:72,centralization:44} },
  { name:"Platforma Obywatelska (KO)", color:"#ffb22e", profile:{economy:38,social:68,authority:42,eu:86,climate:74,centralization:42} },
  { name:"Polskie Stronnictwo Ludowe (PSL)", color:"#51d66d", profile:{economy:46,social:38,authority:52,eu:62,climate:55,centralization:30} },
  { name:"Lewica", color:"#ff3d91", profile:{economy:84,social:88,authority:38,eu:82,climate:90,centralization:58} },
  { name:"Razem", color:"#b655ff", profile:{economy:94,social:92,authority:34,eu:76,climate:94,centralization:66} }
];

function partyUiDemoSimilarity(party) {
  const diffs = Object.keys(AXIS_META).map(axis => axisPercent(axis) - party.profile[axis]);
  const rms = Math.sqrt(diffs.reduce((a,d)=>a+d*d,0) / diffs.length);
  return Math.max(12, Math.min(88, Math.round(100 - rms * 1.35)));
}

function renderPartyUiDemo() {
  const items = PARTY_UI_DEMO.map(p => ({...p, similarity:partyUiDemoSimilarity(p)})).sort((a,b)=>b.similarity-a.similarity);
  const scene = Math.round(items.reduce((a,p,i)=>a + (p.profile.economy < 50 ? 1 : -1) * p.similarity / (i+1),0));
  const marker = Math.max(8, Math.min(92, 50 - scene/12));
  return `
    <div class="pl-scale"><span>Lewa strona</span><span>Prawa strona</span><i style="left:${marker}%"><b>Ty</b></i></div>
    <div class="party-list">${items.map(p=>`<div class="party-row"><span class="party-dot" style="background:${p.color}"></span><span class="party-name">${p.name}</span><span class="party-bar"><i style="width:${p.similarity}%;background:${p.color}"></i></span><strong>${p.similarity}%</strong></div>`).join("")}</div>
    <div class="demo-disclaimer">Wizualizacja układu wyniku. Profile partii są w tej wersji demonstracyjne i wymagają osobnej, aktualizowanej bazy programów.</div>`;
}

function resultInterpretationItems() {
  const e=axisPercent("economy"), a=axisPercent("authority"), s=axisPercent("social"), eu=axisPercent("eu"), c=axisPercent("climate"), z=axisPercent("centralization");
  const items=[];
  items.push(e<42 ? "Preferujesz większą wolność gospodarczą i prywatną inicjatywę." : e>58 ? "Akceptujesz większą rolę państwa w redystrybucji i gospodarce." : "Łączysz mechanizmy rynkowe z umiarkowaną rolą redystrybucji.");
  items.push(a<42 ? "Mocno cenisz wolności osobiste i ograniczanie przymusu." : a>58 ? "Doceniasz silne instytucje państwa, bezpieczeństwo i porządek." : "Szukasz równowagi między wolnością jednostki a porządkiem społecznym.");
  items.push(s<40 ? "W sprawach obyczajowych jesteś raczej tradycyjny." : s>60 ? "W sprawach obyczajowych jesteś raczej progresywny." : "W sprawach obyczajowych zajmujesz stanowisko umiarkowane.");
  items.push(eu>60 ? "Jesteś bardziej otwarty na integrację europejską." : eu<40 ? "Przywiązujesz większą wagę do suwerenności państwa." : c>65 ? "W klimacie i energetyce akceptujesz szybszą interwencję publiczną." : z<40 ? "Preferujesz większą samorządność i decentralizację." : "Twój profil nie układa się w jeden prosty schemat.");
  return items.slice(0,4);
}

function renderResults() {
  const confidence = confidencePercent();
  const elapsed = elapsedSessionSeconds();
  const profileType = resultProfileType();
  const interp = resultInterpretationItems();
  const mapX = ((100 - axisPercent("economy")) / 100 * 2 - 1).toFixed(2);
  const mapY = ((50 - axisPercent("authority")) / 50).toFixed(2);
  app.innerHTML = `
    <section class="result-dashboard">
      <section class="panel result-summary-strip">
        <div class="result-summary-intro">
          <div class="result-trophy">🏆</div>
          <div><div class="result-title">Twój wynik</div><p>${resultSummaryText()}</p></div>
        </div>
        <div class="result-stat"><span>◷</span><small>Czas trwania</small><strong>${formatDurationLong(elapsed)}</strong></div>
        <div class="result-stat"><span>▥</span><small>Poziom trudności</small><strong>${DIFFICULTIES[state.difficulty].label}</strong></div>
        <div class="result-stat"><span>⬡</span><small>Spójność odpowiedzi</small><strong>${confidence >= 80 ? "Wysoka" : confidence >= 60 ? "Średnia" : "Niska"} ${confidence}%</strong></div>
        <div class="result-stat"><span>◎</span><small>Typ profilu</small><strong>${profileType}</strong></div>
      </section>

      <section class="result-main-grid">
        <article class="panel result-pane map-pane">
          <h2>1. Położenie wg nauk politycznych <span>(ogólne)</span></h2>
          <p class="pane-subtitle">Twój wynik na klasycznej mapie 2D politologii.</p>
          <div class="map-wrap">${politicalMapSvg()}</div>
          <div class="coords">Współrzędne: <b>x: ${mapX}</b><b>y: ${mapY}</b></div>
        </article>

        <article class="panel result-pane party-pane">
          <h2>2. Położenie na polskiej scenie politycznej <span>(specyficzne dla Polski)</span></h2>
          <p class="pane-subtitle">Porównanie profilu do sceny politycznej — warstwa demonstracyjna UI.</p>
          ${renderPartyUiDemo()}
        </article>

        <article class="panel result-pane interpretation-pane">
          <h2>Interpretacja Twojego wyniku</h2>
          <ul class="interpretation-list">
            ${interp.map((txt,i)=>`<li><span class="interp-icon i${i}">${["↗","⬡","⚖","★"][i]}</span><p>${txt}</p></li>`).join("")}
          </ul>
          <section class="result-advice-mini ${state.adviceVisible ? "" : "hidden"}" id="advice">
            <button data-action="close-advice" aria-label="Zamknij poradę">×</button>
            <h3>Rada końcowa</h3>
            <p>Rozmawiaj, słuchaj i weryfikuj swoje przekonania. Wynik jest mapą — nie etykietą.</p>
            <div class="ai-bot">AI</div>
          </section>
        </article>
      </section>

      <section class="panel result-bottom-strip">
        <div class="about-test">
          <strong>O teście</strong>
          <span>▤ Pytania <b>${state.answers.length} / ${state.questions.length}</b></span>
          <span>⌘ Model <b>Wielowymiarowy</b></span>
          <span>◫ Metodologia <b>Nauki polityczne + porównanie z PL</b></span>
          <span>▣ Pakiet <b>${state.package.manifest.id} ${state.package.manifest.version}</b></span>
        </div>
        <div class="result-buttons">
          <button class="secondary" data-action="restart-topic">↻ Powtórz test</button>
          <button class="secondary" data-action="compare-result">👥 Porównaj wynik</button>
          <button class="secondary" data-action="home">▦ Zmień temat</button>
          <button class="secondary" data-action="export-pdf">▤ Eksport PDF</button>
        </div>
      </section>
    </section>`;
}

function showError(error) {
  console.error(error);
  app.innerHTML = `<section class="panel error"><h2>Nie udało się uruchomić quizu</h2><p>${escapeHtml(error.message || String(error))}</p><button class="secondary" data-action="home">Wróć</button></section>`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
}

async function startPolitics() {
  state.screen = "loading";
  render();
  try {
    if (!state.package) {
      state.package = await loadCompressedTopic("topics/polityka-pl.quiz.gz");
      state.packageVersion = state.package.manifest.version;
    }
    beginSession(state.difficulty);
    state.screen = "quiz";
    render();
  } catch (err) {
    showError(err);
  }
}

function nextQuestion() {
  if (state.selectedAnswer === null) return;
  const q = state.questions[state.currentIndex];
  const value = Number(state.selectedAnswer);
  scoreAnswer(q, value);
  state.answers.push({ questionId: q.id, value });
  state.selectedAnswer = null;
  state.currentIndex++;
  persistProgress();
  if (state.currentIndex >= state.questions.length) state.screen = "results";
  else state.difficultyAtScreenStart = state.difficulty;
  render();
}

function applyDifficulty() {
  if (state.pendingDifficulty === null || state.pendingDifficulty === state.difficulty) return;
  const newLevel = state.pendingDifficulty;
  clearMeasurementHistory();
  state.difficulty = newLevel;
  state.difficultyAtScreenStart = newLevel;
  state.pendingDifficulty = null;
  state.questions = topicQuestionsForDifficulty(newLevel);
  startCountdown(true);
  state.screen = "difficulty-reset";
  persistProgress();
  render();
}

function syncDifficultyUi() {
  const effective = state.pendingDifficulty ?? state.difficulty;
  const changed = state.pendingDifficulty !== null && state.pendingDifficulty !== state.difficulty;
  const label = document.querySelector("#difficulty-label");
  const callout = document.querySelector("#restart-callout");
  const next = document.querySelector("#next-question");
  if (label) label.textContent = DIFFICULTIES[effective].label;
  if (callout) callout.classList.toggle("visible", changed);
  if (next) next.disabled = state.selectedAnswer === null || changed;
}

function abortQuiz() {
  const active = state.screen === "quiz" || state.screen === "difficulty-reset";
  if (active) {
    const ok = window.confirm("Przerwać bieżący quiz? Dotychczasowe odpowiedzi z tej serii zostaną usunięte i wrócisz do pierwszej strony.");
    if (!ok) return;
  }

  state.pendingDifficulty = null;
  state.questions = [];
  state.currentIndex = 0;
  state.answers = [];
  state.selectedAnswer = null;
  state.scores = freshScores();
  state.difficultyAtScreenStart = state.difficulty;
  state.adviceVisible = true;
  state.timerDeadlineMs = null;
  state.timerDurationSeconds = 0;
  state.sessionStartedMs = null;
  localStorage.removeItem("knj-progress");
  state.screen = "start";
  render();
}

function requestHome() {
  if (state.screen === "quiz" || state.screen === "difficulty-reset") return abortQuiz();
  state.screen = "start";
  render();
}

function showDialog(type) {
  if (type === "help") {
    dialogContent.innerHTML = `<h2>Jak to działa?</h2><p>Silnik quizu ładuje wybrany temat ze skompresowanej paczki. Odpowiedzi są przeliczane na kilka niezależnych wymiarów. Poziom trudności ma 11 stopni i można go zmienić w trakcie testu maksymalnie o jeden stopień na ekran.</p><p>Po zatwierdzeniu odpowiedzi przechodzimy wyłącznie naprzód — wcześniejszego pytania nie można już otworzyć ponownie.</p><p><strong>Zmiana trudności jest świadomym restartem części pomiarowej:</strong> po zatwierdzeniu wszystkie poprzednie pytania i odpowiedzi przestają istnieć dla wyniku.</p>`;
  } else {
    dialogContent.innerHTML = `<h2>Prywatność</h2><p>Ta prototypowa wersja działa lokalnie w przeglądarce. Stan bieżącej sesji może być zapisany w pamięci przeglądarki (localStorage), aby nie zniknął przy przypadkowym odświeżeniu.</p><p>W tej wersji nie wysyłamy odpowiedzi do zewnętrznego modelu językowego.</p>`;
  }
  dialog.showModal();
}

app.addEventListener("click", (event) => {
  const genderChoice = event.target.closest("[data-user-gender]");
  if (genderChoice) {
    setUserGender(genderChoice.dataset.userGender);
    render();
    return;
  }

  const answer = event.target.closest("[data-answer]");
  if (answer) { state.selectedAnswer = Number(answer.dataset.answer); renderQuiz(); return; }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  if (action === "start-politics") return startPolitics();
  if (action === "scroll-topics") return document.querySelector("#topics")?.scrollIntoView({ behavior: "smooth" });
  if (action === "next") return nextQuestion();
  if (action === "apply-difficulty") return applyDifficulty();
  if (action === "resume-after-difficulty") { if (!state.sessionStartedMs) state.sessionStartedMs = Date.now(); state.screen = "quiz"; render(); return; }
  if (action === "restart-topic") { beginSession(state.difficulty); state.screen = "quiz"; render(); return; }
  if (action === "abort-quiz") return abortQuiz();
  if (action === "home") return requestHome();
  if (action === "close-advice") { state.adviceVisible = false; document.querySelector("#advice")?.classList.add("hidden"); return; }
  if (action === "compare-result") { alert("Porównywanie wyników dołączymy w następnej wersji."); return; }
  if (action === "export-pdf") { window.print(); return; }
  if (action === "help" || action === "privacy") return showDialog(action);
  if (action === "close-dialog") return dialog.close();
});

app.addEventListener("input", (event) => {
  if (event.target.id === "start-self-position") {
    state.selfPosition = Number(event.target.value);
    return;
  }

  if (event.target.id === "start-difficulty") {
    state.difficulty = Number(event.target.value);
    state.difficultyAtScreenStart = state.difficulty;
    state.pendingDifficulty = null;
    const label = document.querySelector("#start-difficulty-label");
    if (label) label.textContent = DIFFICULTIES[state.difficulty].label;
    return;
  }

  if (event.target.id === "difficulty") {
    const requested = Number(event.target.value);
    const minAllowed = Math.max(0, state.difficultyAtScreenStart - 1);
    const maxAllowed = Math.min(10, state.difficultyAtScreenStart + 1);
    const clamped = Math.max(minAllowed, Math.min(maxAllowed, requested));

    // Nie renderujemy całego ekranu podczas przeciągania suwaka.
    // Podmiana DOM w zdarzeniu input przerywała gest przeciągania w przeglądarce.
    event.target.value = String(clamped);
    state.pendingDifficulty = clamped === state.difficulty ? null : clamped;
    syncDifficultyUi();
  }
});

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "help" || action === "privacy") showDialog(action);
  if (action === "close-dialog") dialog.close();
  if (action === "home" && event.target.closest(".topbar")) requestHome();
});

setInterval(() => {
  if (state.screen === "quiz" || state.screen === "difficulty-reset") refreshCountdownDisplay();
}, 1000);

setTheme(state.theme);
render();
