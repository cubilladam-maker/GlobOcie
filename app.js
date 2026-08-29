"use strict";

const app = document.querySelector("#app");
const infoDialog = document.querySelector("#info-dialog");
const infoContent = document.querySelector("#dialog-content");
const confirmDialog = document.querySelector("#confirm-dialog");
const confirmContent = document.querySelector("#confirm-content");
const topProgress = document.querySelector("#top-progress");

const APP_VERSION = "0.2.2";

const DIFFICULTIES = [
  { id: "uczen", label: "Uczeń", level: 0, sourceBand: 0 },
  { id: "student", label: "Student", level: 1, sourceBand: 1 },
  { id: "student-plus", label: "Student+", level: 2, sourceBand: 1 },
  { id: "zaawansowany", label: "Zaawansowany", level: 3, sourceBand: 1 },
  { id: "zaawansowany-plus", label: "Zaawansowany+", level: 4, sourceBand: 1 },
  { id: "doktorant", label: "Doktorant", level: 5, sourceBand: 2 },
  { id: "doktorant-plus", label: "Doktorant+", level: 6, sourceBand: 2 },
  { id: "doktor", label: "Doktor", level: 7, sourceBand: 2 },
  { id: "profesor-minus", label: "Profesor−", level: 8, sourceBand: 2 },
  { id: "profesor", label: "Profesor", level: 9, sourceBand: 2 },
  { id: "ekspert", label: "Ekspert", level: 10, sourceBand: 2 }
];

const AXIS_META = {
  economy: { name: "Gospodarka", left: "Więcej rynku", right: "Więcej redystrybucji" },
  social: { name: "Obyczaje", left: "Tradycyjniej", right: "Progresywniej" },
  authority: { name: "Wolność / porządek", left: "Więcej wolności", right: "Więcej porządku" },
  eu: { name: "Polska / UE", left: "Więcej suwerenności", right: "Więcej integracji" },
  climate: { name: "Klimat i energia", left: "Wolniej", right: "Szybciej" },
  centralization: { name: "Państwo / samorząd", left: "Samorządność", right: "Centralizacja" }
};

const storedGender = localStorage.getItem("knj-user-gender") || "male";

const state = {
  screen: "start",
  userGender: storedGender,
  theme: storedGender === "male" ? "female" : "male",
  genderLocked: sessionStorage.getItem("knj-gender-locked") === "1",
  genderChangeUsed: sessionStorage.getItem("knj-gender-change-used") === "1",
  package: null,
  difficulty: Number(localStorage.getItem("knj-difficulty") || 1),
  selfPosition: Number(localStorage.getItem("knj-self-position") || 50),
  questions: [],
  currentIndex: 0,
  answers: [],
  scores: freshScores(),
  answerLock: false,
  difficultyChangeAttempted: false,
  hintOpen: false,
  sessionStartedMs: null
};

function freshScores() {
  return Object.fromEntries(Object.keys(AXIS_META).map(key => [key, { sum: 0, weight: 0 }]));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>\"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;" }[ch]));
}

function guideGenderForUser(gender = state.userGender) {
  return gender === "male" ? "female" : "male";
}

function guideRoleLabel(theme = state.theme) {
  return theme === "female" ? "Twoja przewodniczka AI" : "Twój przewodnik AI";
}

function setThemeFromGender() {
  state.theme = guideGenderForUser();
  document.body.dataset.theme = state.theme;
}

function femaleGuideImage() { return "assets/guide-female.png"; }
function maleGuideImage() { return "assets/guide-male.png"; }
function currentGuideImage() { return state.theme === "female" ? femaleGuideImage() : maleGuideImage(); }

function showLockedGenderWarning() {
  showInfo(`
    <h2>Wybór płci jest już zablokowany</h2>
    <p>Płeć przewodnika można ustawić tylko raz w danej grze.</p>
    <p>Jeśli zmieniłeś wybór albo rozpocząłeś quiz i wróciłeś na początek, ponowna zmiana nie jest już możliwa.</p>
    <p><strong>Nowy wybór będzie możliwy dopiero po rozpoczęciu całkowicie nowej sesji.</strong></p>
  `);
}

function setUserGender(gender) {
  if (!["male", "female"].includes(gender)) return;
  if (gender === state.userGender) return;

  if (state.genderLocked || state.genderChangeUsed) {
    showLockedGenderWarning();
    return;
  }

  state.userGender = gender;
  state.genderChangeUsed = true;
  state.genderLocked = true;
  sessionStorage.setItem("knj-gender-change-used", "1");
  sessionStorage.setItem("knj-gender-locked", "1");
  localStorage.setItem("knj-user-gender", gender);
  setThemeFromGender();
  render();
}

function lockGenderBecauseGameStarted() {
  state.genderLocked = true;
  sessionStorage.setItem("knj-gender-locked", "1");
}

function bytesFromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function decodeTopicBytes(bytes) {
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  let jsonText;
  if (isGzip) {
    if (!("DecompressionStream" in window)) {
      throw new Error("Ta przeglądarka nie obsługuje rozpakowywania GZIP.");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    jsonText = await new Response(stream).text();
  } else {
    jsonText = new TextDecoder().decode(bytes);
  }
  return JSON.parse(jsonText);
}

async function loadCompressedTopic(url) {
  if (location.protocol !== "file:") {
    try {
      const response = await fetch(`${url}?v=${APP_VERSION}-${Date.now()}`, { cache: "no-store" });
      if (response.ok) return decodeTopicBytes(new Uint8Array(await response.arrayBuffer()));
    } catch (error) {
      console.warn("Pobranie paczki .gz nie powiodło się. Używam kopii transportowej.", error);
    }
  }
  const embedded = window.KNJ_EMBEDDED_TOPICS?.[url];
  if (!embedded) throw new Error("Nie znaleziono paczki tematu.");
  return decodeTopicBytes(bytesFromBase64(embedded));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function topicQuestionsForDifficulty(level) {
  const d = DIFFICULTIES[level] || DIFFICULTIES[1];
  const exact = state.package.questions.filter(q => q.difficulty === d.sourceBand);
  const count = state.package.settings?.questionCountByDifficulty?.[String(d.sourceBand)] || exact.length;
  return shuffle(exact).slice(0, Math.min(count, exact.length));
}

function beginSession(level = state.difficulty) {
  lockGenderBecauseGameStarted();
  state.difficulty = clamp(Number(level), 0, 10);
  localStorage.setItem("knj-difficulty", String(state.difficulty));
  state.questions = topicQuestionsForDifficulty(state.difficulty);
  state.currentIndex = 0;
  state.answers = [];
  state.scores = freshScores();
  state.answerLock = false;
  state.difficultyChangeAttempted = false;
  state.hintOpen = false;
  state.sessionStartedMs = Date.now();
  persistProgress();
}

function persistProgress() {
  if (!state.package) return;
  localStorage.setItem("knj-progress", JSON.stringify({
    packageId: state.package.manifest?.id,
    packageVersion: state.package.manifest?.version,
    difficulty: state.difficulty,
    selfPosition: state.selfPosition,
    userGender: state.userGender,
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
  const nonNeutral = state.answers.filter(a => a.value !== 0).length;
  const coverage = Object.values(state.scores).filter(x => x.weight > 0).length / Object.keys(state.scores).length;
  return Math.round(clamp(50 + 33 * (nonNeutral / state.answers.length) + 15 * coverage, 0, 96));
}

function difficultyTicks() {
  return `<div class="difficulty-ticks" aria-hidden="true">${DIFFICULTIES.map((d, i) => `<i class="${[0,1,9,10].includes(i) ? "major" : ""}"></i>`).join("")}</div>`;
}

function difficultyLabels() {
  return `<div class="difficulty-labels"><span>Uczeń</span><span>Student</span><span>Profesor</span><span>Ekspert</span></div>`;
}

function aiHologram(extraClass = "") {
  return `
    <div class="ai-hologram ${extraClass}" aria-label="Animowany symbol AI">
      <div class="ai-orbit orbit-a"></div>
      <div class="ai-orbit orbit-b"></div>
      <div class="ai-orbit orbit-c"></div>
      <div class="ai-core"><span>A</span><span>I</span></div>
      <div class="ai-base"></div>
    </div>`;
}

function showInfo(html) {
  infoContent.innerHTML = html;
  if (!infoDialog.open) infoDialog.showModal();
}

function showConfirm(html, yesLabel, onYes, onNo) {
  confirmContent.innerHTML = `
    <div class="confirm-card">
      ${html}
      <div class="confirm-actions">
        <button class="secondary" id="confirm-no">Nie, zostań tutaj</button>
        <button class="primary" id="confirm-yes">${yesLabel}</button>
      </div>
    </div>`;
  confirmDialog.showModal();
  confirmContent.querySelector("#confirm-yes").onclick = () => {
    confirmDialog.close();
    onYes?.();
  };
  confirmContent.querySelector("#confirm-no").onclick = () => {
    confirmDialog.close();
    onNo?.();
  };
}

function render() {
  setThemeFromGender();
  document.body.dataset.screen = state.screen;
  topProgress.hidden = state.screen !== "quiz";
  if (state.screen === "start") return renderStart();
  if (state.screen === "loading") return renderLoading();
  if (state.screen === "quiz") return renderQuiz();
  if (state.screen === "results") return renderResults();
}

function renderStart() {
  app.innerHTML = `
    <section class="start-page">
      <section class="panel start-copy">
        <div class="eyebrow">Poznaj siebie z pomocą sztucznej inteligencji</div>
        <h1>Kim naprawdę <span>jestem</span></h1>
        <p class="lead">Interaktywny quiz, w którym Sztuczna Inteligencja prowadzi Cię przez pytania i pomaga uporządkować odpowiedzi w czytelny profil.</p>
        <p class="start-desc">Odpowiadaj szczerze, bez presji i odkrywaj, co naprawdę kształtuje Twoje przekonania, wartości i sposób myślenia. To nie test z etykietą — to rozmowa z AI o Tobie.</p>
        <div class="ai-line"><strong>Jestem Twoją Sztuczną Inteligencją (AI).</strong> Od teraz ${state.theme === "female" ? "jestem Twoją przewodniczką" : "jestem Twoim przewodnikiem"}.</div>

        <div class="start-block">
          <div class="block-title"><strong>Kim jesteś?</strong><span>To pozwala AI dobrać perspektywę przewodnika.</span></div>
          <div class="gender-grid ${state.genderLocked ? "locked" : ""}">
            <button class="gender-choice ${state.userGender === "female" ? "active" : ""}" data-user-gender="female"><b>♀</b><span><strong>Jestem kobietą</strong><small>Wróży Ci mężczyzna AI</small></span></button>
            <button class="gender-choice ${state.userGender === "male" ? "active" : ""}" data-user-gender="male"><b>♂</b><span><strong>Jestem mężczyzną</strong><small>Wróży Ci kobieta AI</small></span></button>
          </div>
          <div class="lock-note">${state.genderLocked ? "🔒 Wybór jest już zablokowany dla tej gry. Próba zmiany pokaże ostrzeżenie." : "Wybór można zmienić tylko raz. Po rozpoczęciu gry zostaje zablokowany."}</div>
        </div>

        <div class="start-settings">
          <div class="setting-box">
            <h3>Twoja oś światopoglądowa — ustawienie początkowe</h3>
            <input id="start-self-position" class="glow-range" type="range" min="0" max="100" step="5" value="${state.selfPosition}">
            <div class="range-labels"><span>Więcej wolności</span><span>Więcej państwa</span></div>
          </div>
          <div class="setting-box">
            <h3>Poziom trudności: <strong id="start-difficulty-label">${DIFFICULTIES[state.difficulty].label}</strong></h3>
            <input id="start-difficulty" class="glow-range" type="range" min="0" max="10" step="1" value="${state.difficulty}">
            ${difficultyTicks()}${difficultyLabels()}
          </div>
        </div>

        <div class="benefit-grid">
          <div><b>◈</b><span><strong>Odkryjesz swój profil poglądów</strong><small>Zobaczysz, gdzie i jak Twoje przekonania łączą się ze sobą.</small></span></div>
          <div><b>☷</b><span><strong>Uporządkujesz odpowiedzi</strong><small>AI złoży je w czytelny, spójny profil.</small></span></div>
          <div><b>⌘</b><span><strong>Poznasz styl myślenia</strong><small>Nie tylko „co”, ale również „jak” odpowiadasz.</small></span></div>
          <div><b>✦</b><span><strong>Otrzymasz przewodnika AI</strong><small>Podpowiedzi pojawią się wtedy, gdy naprawdę będą przydatne.</small></span></div>
        </div>

        <div class="start-actions">
          <button class="primary big" data-action="start-politics">Rozpocznij darmowy quiz →</button>
          <button class="secondary" data-action="scroll-topics">Wybierz temat</button>
        </div>
      </section>

      <section class="panel start-stage">
        <div class="stage-title"><strong>Kim naprawdę jestem</strong><small>Twój quiz AI z wymiennymi tematami i własną ścieżką dla każdego problemu.</small></div>
        <div class="guide-duo">
          <div class="guide-figure female ${state.theme === "female" ? "chosen" : ""}"><img src="${femaleGuideImage()}" alt="Przewodniczka AI"><span>Przewodniczka AI</span></div>
          ${aiHologram("start-ai")}
          <div class="guide-figure male ${state.theme === "male" ? "chosen" : ""}"><img src="${maleGuideImage()}" alt="Przewodnik AI"><span>Przewodnik AI</span></div>
        </div>
        <div class="stage-caption">W trakcie gry litery <strong>AI</strong> obracają się powoli — to stały znak aktywnego przewodnika.</div>
        <div class="module-row" id="topics">
          <article class="module available" data-action="start-politics"><span>DARMOWY</span><h3>Położenie na scenie politycznej</h3><p>Odkryj swój punkt widzenia na scenie politycznej.</p></article>
          <article class="module locked"><span>MODUŁ DODATKOWY</span><h3>Religia i światopogląd</h3><p>Twoje wierzenia, wartości i światopogląd.</p></article>
          <article class="module locked"><span>MODUŁ DODATKOWY</span><h3>Styl myślenia</h3><p>Sposób, w jaki analizujesz i podejmujesz decyzje.</p></article>
          <article class="module locked"><span>MODUŁ DODATKOWY</span><h3>Relacje i emocje</h3><p>Jak budujesz relacje i wyrażasz emocje.</p></article>
        </div>
      </section>
    </section>`;
}

function renderLoading() {
  app.innerHTML = `<section class="panel loading"><div class="loader-ring"></div><h2>Ładuję quiz…</h2><p>Przygotowuję pytania dla poziomu ${escapeHtml(DIFFICULTIES[state.difficulty].label)}.</p></section>`;
}

function aiHintForQuestion(q) {
  const generic = [
    "Czytaj całe pytanie i wszystkie odpowiedzi. Nie szukaj odpowiedzi, która brzmi najmocniej — wybierz tę najbliższą Tobie.",
    "Jeśli wahasz się między dwiema odpowiedziami, wybierz tę, którą obroniłbyś bez dodatkowych zastrzeżeń.",
    "Spróbuj oddzielić to, co faktycznie uważasz, od tego, co Twoim zdaniem wypada odpowiedzieć."
  ];
  const idx = (state.currentIndex + state.difficulty) % generic.length;
  return generic[idx];
}

function shouldOfferHint() {
  return state.difficulty >= 3 || state.currentIndex % 3 === 2;
}

function renderQuiz() {
  const q = state.questions[state.currentIndex];
  if (!q) {
    state.screen = "results";
    return render();
  }

  const count = state.questions.length;
  const progress = Math.round(((state.currentIndex + 1) / count) * 100);
  topProgress.innerHTML = `<span>Pytanie ${state.currentIndex + 1} / ${count}</span><strong>${progress}%</strong>`;
  const answerOptions = state.package.answerScale || [];
  const offerHint = shouldOfferHint();

  app.innerHTML = `
    <section class="quiz-page">
      <aside class="panel quiz-settings-panel">
        <div class="eyebrow">Ustawienia</div>
        <section class="quiz-setting-section">
          <h3>Twoja oś światopoglądowa</h3>
          <div class="readonly-range visible-pulse"><i style="left:${state.selfPosition}%"></i></div>
          <div class="range-labels"><span>Więcej wolności</span><span>Więcej państwa</span></div>
          <p>To ustawienie pochodzi z ekranu startowego i podczas quizu jest tylko wskaźnikiem.</p>
        </section>

        <section class="quiz-setting-section">
          <div class="difficulty-heading"><h3>Poziom trudności</h3><span>Możesz zmienić w każdej chwili</span></div>
          <input id="difficulty-live" class="glow-range visible-pulse" type="range" min="0" max="10" step="1" value="${state.difficulty}" ${state.difficultyChangeAttempted ? "disabled" : ""}>
          ${difficultyTicks()}${difficultyLabels()}
          <p>${state.difficultyChangeAttempted ? "Na tym pytaniu wykorzystano już próbę zmiany poziomu." : "Możesz przesunąć suwak tylko o jedną pozycję w lewo albo w prawo. Zmiana wymaga rozpoczęcia nowej gry."}</p>
        </section>

        <section class="locked-summary">
          <div>◉</div><div><strong>Ustawione na start</strong><span>Płeć: ${state.userGender === "male" ? "Mężczyzna" : "Kobieta"}</span><span>Poziom: ${DIFFICULTIES[state.difficulty].label}</span></div><b>🔒</b>
        </section>

        <section class="ai-tip-mini">
          <b>✦ Wskazówka AI</b>
          <p>AI dopasowuje tempo i podpowiedzi do przebiegu quizu.</p>
        </section>

        <button class="return-start" data-action="return-start">↻ <span><strong>Powrót na początek gry</strong><small>Zresetuj quiz i rozpocznij od nowa</small></span></button>
      </aside>

      <main class="panel quiz-question-panel">
        <div class="question-kicker">${escapeHtml(q.category || "Pytanie")}</div>
        <h2>${escapeHtml(q.text)}</h2>
        <div class="answers compact-answers">
          ${answerOptions.map((a, i) => `<button class="answer" data-answer="${a.value}" ${state.answerLock ? "disabled" : ""}><span class="answer-letter">${String.fromCharCode(65+i)}</span><span>${escapeHtml(a.label)}</span></button>`).join("")}
        </div>
        ${offerHint ? `<button class="hint-row" data-action="toggle-hint"><span>🤖</span><strong>AI podpowiedź</strong><small>${state.hintOpen ? "ukryj" : "kliknij, aby zobaczyć"}</small><b>${state.hintOpen ? "⌃" : "⌄"}</b></button>` : ""}
        ${offerHint && state.hintOpen ? `<div class="hint-box">${escapeHtml(aiHintForQuestion(q))}</div>` : ""}
        <div class="question-footnote">Po kliknięciu odpowiedzi przechodzisz od razu do następnego pytania. Nie ma przycisku „Poprzednie”.</div>
      </main>

      <aside class="panel quiz-ai-panel">
        ${aiHologram("quiz-ai")}
        <div class="ai-status"><strong>AI analizuje przebieg quizu</strong><span>Powolny obrót oznacza aktywnego przewodnika.</span></div>
      </aside>
    </section>`;
}

function chooseAnswer(value, button) {
  if (state.answerLock) return;
  state.answerLock = true;
  const q = state.questions[state.currentIndex];
  const numeric = Number(value);
  button?.classList.add("selected");
  scoreAnswer(q, numeric);
  state.answers.push({ questionId: q.id, value: numeric });
  state.currentIndex += 1;
  persistProgress();

  setTimeout(() => {
    state.answerLock = false;
    state.difficultyChangeAttempted = false;
    state.hintOpen = false;
    if (state.currentIndex >= state.questions.length) state.screen = "results";
    render();
  }, 180);
}

function requestDifficultyChange(requested) {
  if (state.difficultyChangeAttempted) return renderQuiz();

  const direction = requested > state.difficulty ? 1 : -1;
  const nextLevel = clamp(state.difficulty + direction, 0, 10);
  if (nextLevel === state.difficulty) return renderQuiz();

  state.difficultyChangeAttempted = true;
  renderQuiz();

  showConfirm(`
    <div class="confirm-symbol">⚠</div>
    <h2>Zmiana poziomu wymaga nowej gry</h2>
    <p>Chcesz zmienić poziom z <strong>${DIFFICULTIES[state.difficulty].label}</strong> na <strong>${DIFFICULTIES[nextLevel].label}</strong>.</p>
    <p>Dotychczasowe odpowiedzi zostaną usunięte z pomiaru i quiz rozpocznie się od początku.</p>
    <p><strong>Czy zgadzasz się rozpocząć nową grę?</strong></p>
  `, "Tak — rozpocznij nową grę", () => {
    beginSession(nextLevel);
    state.screen = "quiz";
    render();
  }, () => {
    render();
  });
}

function requestReturnStart() {
  showConfirm(`
    <div class="confirm-symbol">↻</div>
    <h2>Powrót na początek gry</h2>
    <p>Dotychczasowe odpowiedzi zostaną usunięte z bieżącej serii.</p>
    <p>Wybór płci pozostanie zablokowany, ponieważ gra została już rozpoczęta.</p>
  `, "Wróć na początek", () => {
    state.questions = [];
    state.currentIndex = 0;
    state.answers = [];
    state.scores = freshScores();
    state.answerLock = false;
    state.hintOpen = false;
    state.screen = "start";
    localStorage.removeItem("knj-progress");
    render();
  });
}

function elapsedMinutes() {
  if (!state.sessionStartedMs) return 0;
  return Math.max(1, Math.round((Date.now() - state.sessionStartedMs) / 60000));
}

function radarPoint(percent, index, radius, cx, cy) {
  const angle = (-90 + index * 60) * Math.PI / 180;
  const r = radius * (percent / 100);
  return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
}

function radar3dSvg() {
  const axes = Object.keys(AXIS_META);
  const values = axes.map(axisPercent);
  const cx = 210, cy = 185, radius = 132;
  const ringPercents = [25, 50, 75, 100];

  const rings = ringPercents.map(p => {
    const pts = axes.map((_, i) => radarPoint(p, i, radius, cx, cy).join(",")).join(" ");
    return `<polygon points="${pts}" class="radar-ring"/>`;
  }).join("");

  const spokes = axes.map((_, i) => {
    const [x,y] = radarPoint(100, i, radius, cx, cy);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-spoke"/>`;
  }).join("");

  const profilePts = values.map((v, i) => radarPoint(v, i, radius, cx, cy));
  const depthLayers = [20,16,12,8,4].map(offset => `<polygon points="${profilePts.map(([x,y]) => `${x},${y+offset}`).join(" ")}" class="radar-depth" style="opacity:${0.08 + (20-offset)*0.012}"/>`).join("");
  const profile = `<polygon points="${profilePts.map(p => p.join(",")).join(" ")}" class="radar-profile"/>`;
  const labels = axes.map((axis, i) => {
    const [x,y] = radarPoint(118, i, radius, cx, cy);
    return `<text x="${x}" y="${y}" text-anchor="middle" class="radar-label">${AXIS_META[axis].name} ${values[i]}%</text>`;
  }).join("");

  return `<svg class="radar3d" viewBox="0 0 420 390" role="img" aria-label="Trójwymiarowy wykres profilu">${rings}${spokes}${depthLayers}${profile}${labels}</svg>`;
}

function strongestAxes() {
  return Object.keys(AXIS_META)
    .map(axis => ({ axis, distance: Math.abs(axisPercent(axis) - 50), value: axisPercent(axis) }))
    .sort((a,b) => b.distance - a.distance)
    .slice(0,3);
}

function profileName() {
  const strongest = strongestAxes();
  const avg = strongest.reduce((sum, x) => sum + x.distance, 0) / strongest.length;
  if (avg < 12) return "Zrównoważony obserwator";
  if (axisPercent("authority") < 40 && axisPercent("economy") < 45) return "Racjonalny indywidualista";
  if (axisPercent("authority") > 60) return "Pragmatyczny instytucjonalista";
  return "Wielowymiarowy indywidualista";
}

function profileSummary() {
  const top = strongestAxes();
  const names = top.map(x => AXIS_META[x.axis].name.toLowerCase());
  return `Najsilniej wyróżniają Cię wymiary: ${names.join(", ")}. Wynik traktuj jako mapę kierunków, a nie sztywną etykietę.`;
}

function renderResults() {
  const confidence = confidencePercent();
  const completed = state.answers.length;
  const total = state.questions.length || completed;
  const top = strongestAxes();

  app.innerHTML = `
    <section class="results-page">
      <section class="panel results-left">
        <div class="eyebrow">Koniec quizu</div>
        <h1>Twój profil jest <span>gotowy</span></h1>
        <p class="lead results-lead">Ukończyłeś quiz „Kim naprawdę jestem”. Poniżej znajdziesz podsumowanie odpowiedzi oraz najważniejsze kierunki Twojego profilu.</p>

        <section class="score-hero">
          <div class="score-ring"><strong>${confidence}%</strong><span>spójność</span></div>
          <div><h2>${confidence >= 80 ? "Wysoki poziom spójności" : confidence >= 60 ? "Dobry poziom spójności" : "Profil wymagający dalszych pytań"}</h2><p>AI ocenia, jak konsekwentnie układają się Twoje odpowiedzi.</p></div>
        </section>

        <div class="result-stats">
          <div><b>◎</b><strong>${confidence}%</strong><span>Poziom zgodności</span></div>
          <div><b>◇</b><strong>${confidence >= 75 ? "Wysoka" : "Średnia"}</strong><span>Pewność wyniku</span></div>
          <div><b>◷</b><strong>${elapsedMinutes()} min</strong><span>Czas quizu</span></div>
          <div><b>?</b><strong>${completed} / ${total}</strong><span>Liczba pytań</span></div>
        </div>

        <div class="result-profile-grid">
          <article><span>Twój profil</span><h2>${profileName()}</h2><p>${profileSummary()}</p><div class="chips">${top.map(x => `<i>${AXIS_META[x.axis].name}</i>`).join("")}</div></article>
          <article><span>Twoja oś światopoglądowa</span><div class="readonly-range result-range"><i style="left:${state.selfPosition}%"></i></div><div class="range-labels"><span>Więcej wolności</span><span>Więcej państwa</span></div><p>To Twoje ustawienie początkowe — pomocniczy punkt odniesienia do interpretacji wyniku.</p></article>
        </div>

        <div class="results-actions">
          <button class="primary" data-action="details">Zobacz szczegóły →</button>
          <button class="secondary" data-action="home">Powrót na początek</button>
          <button class="secondary" data-action="restart-topic">Powtórz test</button>
          <button class="secondary" data-action="export-pdf">Eksport PDF</button>
        </div>
      </section>

      <section class="panel results-right">
        <div class="results-right-head"><div><div class="eyebrow">Twoje wyniki w 3D</div><p>Zobacz, jak kształtuje się Twój profil w kluczowych wymiarach.</p></div><span class="view3d">Widok: 3D ◇</span></div>
        <div class="results-visuals">
          <div class="radar-wrap">${radar3dSvg()}</div>
          <div class="result-ai-wrap">${aiHologram("result-ai")}<div class="ai-status"><strong>AI analizuje Twój profil…</strong><span>Litery AI obracają się powoli także na ekranie końcowym.</span></div></div>
        </div>

        <section class="next-modules">
          <div class="next-head"><div><div class="eyebrow">Co dalej?</div><p>Odkryj kolejne tematy i poszerzaj horyzonty.</p></div></div>
          <div class="next-grid">
            <article><span>POPULARNY</span><h3>Religia i światopogląd</h3><p>Poznaj różne wierzenia i systemy światopoglądowe.</p><button class="secondary" disabled>Zablokowane</button></article>
            <article><span>POPULARNY</span><h3>Styl myślenia</h3><p>Sprawdź, jak analizujesz świat i podejmujesz decyzje.</p><button class="secondary" disabled>Zablokowane</button></article>
            <article><span>NOWOŚĆ</span><h3>Nowy moduł</h3><p>Kolejny temat pełen inspiracji.</p><button class="secondary" disabled>Wkrótce</button></article>
          </div>
        </section>
      </section>
    </section>`;
}

async function startPolitics() {
  state.screen = "loading";
  render();
  try {
    if (!state.package) state.package = await loadCompressedTopic("topics/polityka-pl.quiz.gz");
    beginSession(state.difficulty);
    state.screen = "quiz";
    render();
  } catch (error) {
    app.innerHTML = `<section class="panel loading error"><h2>Nie udało się uruchomić quizu</h2><p>${escapeHtml(error.message || String(error))}</p><button class="secondary" data-action="home">Wróć</button></section>`;
  }
}

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
  showInfo(`<h2>Jak to działa?</h2><p>Po kliknięciu odpowiedzi przechodzisz automatycznie do kolejnego pytania. Po ostatnim pytaniu pojawia się ekran wyniku.</p><p><strong>Poziom trudności</strong> można spróbować zmienić na każdym ekranie pytania tylko raz i tylko o jedną pozycję w lewo lub w prawo. Zatwierdzenie zmiany rozpoczyna nową grę.</p><p><strong>Płeć przewodnika</strong> można ustawić tylko raz. Po zmianie wyboru lub po rozpoczęciu gry jest blokowana.</p>`);
}

function showPrivacy() {
  showInfo(`<h2>Prywatność</h2><p>Ta wersja zapisuje stan quizu lokalnie w przeglądarce. Odpowiedzi nie są wysyłane do zewnętrznego modelu językowego.</p><p>Interfejs v${APP_VERSION} nie rejestruje Service Workera buforującego aplikację, dzięki czemu po wdrożeniu nie powinna pozostawać stara wersja strony.</p>`);
}

app.addEventListener("click", event => {
  const gender = event.target.closest("[data-user-gender]");
  if (gender) {
    setUserGender(gender.dataset.userGender);
    return;
  }

  const answer = event.target.closest("[data-answer]");
  if (answer) {
    chooseAnswer(answer.dataset.answer, answer);
    return;
  }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;

  if (action === "start-politics") return startPolitics();
  if (action === "scroll-topics") return document.querySelector("#topics")?.scrollIntoView({ behavior: "smooth" });
  if (action === "toggle-hint") { state.hintOpen = !state.hintOpen; return renderQuiz(); }
  if (action === "return-start") return requestReturnStart();
  if (action === "home") return requestHome();
  if (action === "restart-topic") return restartTopic();
  if (action === "help") return showHelp();
  if (action === "privacy") return showPrivacy();
  if (action === "close-dialog") return infoDialog.close();
  if (action === "export-pdf") return window.print();
  if (action === "details") return showInfo(`<h2>Szczegóły profilu</h2>${Object.entries(AXIS_META).map(([axis, meta]) => `<p><strong>${meta.name}:</strong> ${axisPercent(axis)}%</p>`).join("")}`);
});

app.addEventListener("input", event => {
  if (event.target.id === "start-self-position") {
    state.selfPosition = Number(event.target.value);
    localStorage.setItem("knj-self-position", String(state.selfPosition));
  }

  if (event.target.id === "start-difficulty") {
    state.difficulty = Number(event.target.value);
    localStorage.setItem("knj-difficulty", String(state.difficulty));
    const label = document.querySelector("#start-difficulty-label");
    if (label) label.textContent = DIFFICULTIES[state.difficulty].label;
  }

  if (event.target.id === "difficulty-live") {
    requestDifficultyChange(Number(event.target.value));
  }
});

document.addEventListener("click", event => {
  const action = event.target.closest(".topbar [data-action]")?.dataset.action;
  if (action === "help") showHelp();
  if (action === "privacy") showPrivacy();
  if (action === "home") requestHome();
  if (event.target.closest("#info-dialog [data-action='close-dialog']")) infoDialog.close();
});

setThemeFromGender();
render();
