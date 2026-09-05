(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.GLOBOCIE_THEME_API = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const neutralAppearance = {
    "--module-accent": "#b13cff",
    "--module-accent-2": "#3c6fff",
    "--module-cyan": "#24d8ff",
    "--module-line": "rgba(112, 111, 255, .28)",
    "--module-warning": "#efb53d",
    "--module-bg-glow": "rgba(74, 62, 255, .22)",
    "--module-bg-glow-2": "rgba(159, 52, 255, .15)",
    "--module-cyan-border": "rgba(36, 216, 255, .58)",
    "--module-cyan-glow": "rgba(36, 216, 255, .18)",
    "--module-page-bg-1": "#02050e",
    "--module-page-bg-2": "#07112a",
    "--module-page-bg-3": "#030611",
    "--module-panel-start": "rgba(15, 28, 68, .93)",
    "--module-panel-end": "rgba(5, 12, 31, .95)",
    "--module-title-start": "rgba(14, 27, 65, .97)",
    "--module-title-end": "rgba(9, 18, 46, .93)",
    "--module-copy-start": "rgba(14, 27, 65, .97)",
    "--module-copy-end": "rgba(5, 12, 31, .94)",
    "--module-stage-start": "rgba(3, 7, 23, .86)",
    "--module-stage-end": "rgba(4, 9, 26, .97)",
    "--module-primary-start": "#9e2cff",
    "--module-primary-mid": "#694cff",
    "--module-primary-end": "#178eff",
    "--module-primary-shadow": "rgba(111, 56, 255, .28)",
    "--module-soft-accent": "rgba(177, 60, 255, .09)",
    "--module-soft-accent-strong": "rgba(177, 60, 255, .12)",
    "--module-holo-filter": "rgba(103, 63, 255, .36)",
    "--module-holo-core-top": "#eef3ff",
    "--module-holo-core-mid": "#6f75ff",
    "--module-holo-core-bottom": "#b62cff",
    "--module-holo-core-stroke": "rgba(255, 255, 255, .42)",
    "--module-holo-core-shadow": "rgba(91, 119, 255, .38)",
    "--module-holo-orbit": "rgba(158, 67, 255, .53)",
    "--module-holo-orbit-shadow": "rgba(177, 60, 255, .45)",
    "--module-holo-inset": "rgba(70, 105, 255, .35)",
    "--module-holo-text": "#bda7ff",
    "--module-holo-text-shadow": "#6b43ff",
    "--module-holo-base": "rgba(174, 61, 255, .55)",
    "--module-holo-base-shadow": "rgba(111, 54, 255, .25)",
    "--module-holo-base-inset": "rgba(73, 89, 255, .48)",
    "--module-answer-letter-start": "rgba(177, 60, 255, .3)",
    "--module-answer-letter-end": "rgba(72, 72, 185, .2)",
    "--module-radar-fill": "rgba(90, 73, 255, .035)",
    "--module-radar-stroke": "rgba(161, 118, 255, .32)",
    "--module-radar-profile-fill": "rgba(124, 67, 255, .28)",
    "--module-radar-profile-stroke": "#bc70ff",
    "--module-radar-glow": "rgba(167, 77, 255, .6)",
    "--module-analysis-start": "rgba(177, 60, 255, .09)",
    "--module-analysis-end": "rgba(44, 85, 255, .035)",
    "--module-dialog-bg": "#081126",
    "--module-heart-color": "#ff72b6",
    "--module-heart-core": "#ffd8ec",
    "--module-heart-glow": "rgba(255, 79, 164, .68)",
    "--module-heart-ring": "rgba(255, 130, 193, .72)"
  };

  const themes = {
    politics: {
      id: "politics",
      name: "Położenie na scenie politycznej",
      eyebrow: "Poznaj swój sposób patrzenia na państwo i wolność",
      axis: {
        id: "political-balance",
        title: "Twoja oś polityczna",
        purpose: "Punkt startowy pomaga AI porównać Twoją deklarację z odpowiedziami w quizie.",
        leftLabel: "Więcej wolności",
        rightLabel: "Więcej roli państwa",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        ranges: [
          { min: 0, max: 19, label: "Zdecydowanie więcej wolności", hint: "Najważniejsza jest dla Ciebie swoboda jednostki i ograniczona rola państwa." },
          { min: 20, max: 39, label: "Więcej wolności", hint: "Skłaniasz się ku wolności jednostki, pozostawiając państwu wybrane zadania." },
          { min: 40, max: 60, label: "Równowaga wolności i państwa", hint: "Szukasz praktycznej równowagi między autonomią ludzi a wspólnymi regułami." },
          { min: 61, max: 80, label: "Więcej roli państwa", hint: "Częściej widzisz państwo jako narzędzie porządkowania i wyrównywania szans." },
          { min: 81, max: 100, label: "Zdecydowanie więcej roli państwa", hint: "Silne instytucje publiczne są dla Ciebie ważniejsze niż szeroka swoboda jednostki." }
        ]
      }
    },
    thinking: {
      id: "thinking",
      name: "Styl myślenia",
      eyebrow: "Poznaj swój sposób analizowania informacji",
      axis: {
        id: "thinking-balance",
        title: "Twoja oś myślenia",
        purpose: "Punkt startowy opisuje, jak zwykle podejmujesz decyzje.",
        leftLabel: "Więcej intuicji",
        rightLabel: "Więcej analizy",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        ranges: [
          { min: 0, max: 39, label: "Przewaga intuicji", hint: "Najpierw wyczuwasz kierunek, potem szukasz uzasadnienia." },
          { min: 40, max: 60, label: "Równowaga intuicji i analizy", hint: "Łączysz przeczucie z porządkowaniem faktów." },
          { min: 61, max: 100, label: "Przewaga analizy", hint: "Najpierw porządkujesz dane, a dopiero potem wybierasz kierunek." }
        ]
      }
    },
    worldview: {
      "id": "worldview",
      "eyebrow": "Poznaj swoje wartości, przekonania i sposób widzenia świata",
      "axis": {
        "id": "worldview-balance",
        "title": "Twoja oś światopoglądowa",
        "purpose": "Punkt startowy pomaga porównać deklarowane wartości z odpowiedziami w quizie.",
        "leftLabel": "Więcej autonomii",
        "rightLabel": "Więcej zakorzenienia",
        "min": 0,
        "max": 100,
        "step": 5,
        "defaultValue": 50,
        "ranges": [
          {
            "min": 0,
            "max": 19,
            "label": "Silna autonomia",
            "hint": "Najważniejsze są dla Ciebie osobiste wybory i niezależne poszukiwanie sensu."
          },
          {
            "min": 20,
            "max": 39,
            "label": "Przewaga autonomii",
            "hint": "Cenisz własną drogę, choć widzisz wartość we wspólnych tradycjach."
          },
          {
            "min": 40,
            "max": 60,
            "label": "Równowaga autonomii i zakorzenienia",
            "hint": "Łączysz osobiste poszukiwania z szacunkiem dla wspólnoty i tradycji."
          },
          {
            "min": 61,
            "max": 80,
            "label": "Przewaga zakorzenienia",
            "hint": "Wspólnota, ciągłość i odziedziczone znaczenia są dla Ciebie ważnymi punktami odniesienia."
          },
          {
            "min": 81,
            "max": 100,
            "label": "Silne zakorzenienie",
            "hint": "Największą wagę przywiązujesz do tradycji, wspólnoty i trwałych ram wartości."
          }
        ]
      }
    },
    climate: {
      id: "climate",
      name: "Globalne ocieplenie, prawda czy fake?",
      eyebrow: "Sprawdź dowody, mechanizmy i jakość argumentów klimatycznych",
      axis: {
        id: "climate-evidence-balance",
        title: "Twoja oś klimatyczna",
        purpose: "Punkt startowy opisuje, jak ważysz siłę dowodów, tempo zmian i koszty działania.",
        leftLabel: "Więcej ostrożności",
        rightLabel: "Szybsza transformacja",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        ranges: [
          { min: 0, max: 19, label: "Silna ostrożność", hint: "Najpierw chcesz sprawdzać jakość danych, niepewności i koszty proponowanych działań." },
          { min: 20, max: 39, label: "Przewaga ostrożności", hint: "Dopuszczasz działania klimatyczne, ale oczekujesz mocnego uzasadnienia i proporcjonalnych kosztów." },
          { min: 40, max: 60, label: "Równowaga dowodów i działania", hint: "Łączysz sprawdzanie dowodów z oceną praktycznych skutków transformacji." },
          { min: 61, max: 80, label: "Przewaga tempa zmian", hint: "Uważasz, że spójne dowody uzasadniają szybsze ograniczanie ryzyk klimatycznych." },
          { min: 81, max: 100, label: "Silne tempo transformacji", hint: "Największą wagę przywiązujesz do szybkiego działania opartego na konwergencji dowodów." }
        ]
      }
    }
  };

  const futureTopics = [
    { id: "searching-god", name: "Poszukiwania Boga. Nauka, mity a rzeczywistość" },
    { id: "thinking-style", name: "Styl myślenia" },
    { id: "relationships-emotions", name: "Relacje i emocje" },
    { id: "morality-conscience", name: "Moralność i sumienie" },
    { id: "human-ai", name: "Człowiek i sztuczna inteligencja" },
    { id: "meaning-happiness", name: "Sens życia i szczęście" }
  ];

  const modules = {
    "political-compass": {
      id: "political-compass",
      themeId: "politics",
      topicUrl: "topics/polityka-pl.quiz.gz",
      name: "Kompas polityczny",
      appearance: {
        "--module-accent": "#f2b84b",
        "--module-accent-2": "#4b91ff",
        "--module-cyan": "#5de4d0",
        "--module-line": "rgba(242, 184, 75, .36)",
        "--module-warning": "#f6c85f",
        "--module-bg-glow": "rgba(28, 116, 255, .34)",
        "--module-bg-glow-2": "rgba(246, 170, 55, .18)",
        "--module-cyan-border": "rgba(93, 228, 208, .62)",
        "--module-cyan-glow": "rgba(93, 228, 208, .22)",
        "--module-page-bg-1": "#030914",
        "--module-page-bg-2": "#071e3f",
        "--module-page-bg-3": "#02050d",
        "--module-panel-start": "rgba(12, 32, 68, .95)",
        "--module-panel-end": "rgba(4, 13, 31, .97)",
        "--module-title-start": "rgba(10, 31, 67, .98)",
        "--module-title-end": "rgba(7, 20, 47, .94)",
        "--module-copy-start": "rgba(10, 31, 67, .98)",
        "--module-copy-end": "rgba(4, 13, 31, .96)",
        "--module-stage-start": "rgba(2, 10, 28, .90)",
        "--module-stage-end": "rgba(2, 7, 19, .98)",
        "--module-primary-start": "#be7028",
        "--module-primary-mid": "#d9823f",
        "--module-primary-end": "#2f8bff",
        "--module-primary-shadow": "rgba(47, 139, 255, .30)",
        "--module-soft-accent": "rgba(242, 184, 75, .10)",
        "--module-soft-accent-strong": "rgba(242, 184, 75, .16)",
        "--module-holo-filter": "rgba(39, 125, 255, .42)",
        "--module-holo-core-top": "#f8fbff",
        "--module-holo-core-mid": "#5aa8ff",
        "--module-holo-core-bottom": "#f2b84b",
        "--module-holo-core-stroke": "rgba(255, 255, 255, .48)",
        "--module-holo-core-shadow": "rgba(91, 160, 255, .42)",
        "--module-holo-orbit": "rgba(75, 145, 255, .65)",
        "--module-holo-orbit-shadow": "rgba(39, 125, 255, .50)",
        "--module-holo-inset": "rgba(93, 228, 208, .30)",
        "--module-holo-text": "#8cefe0",
        "--module-holo-text-shadow": "#388fff",
        "--module-holo-base": "rgba(242, 184, 75, .62)",
        "--module-holo-base-shadow": "rgba(47, 139, 255, .30)",
        "--module-holo-base-inset": "rgba(93, 228, 208, .35)",
        "--module-answer-letter-start": "rgba(242, 184, 75, .30)",
        "--module-answer-letter-end": "rgba(42, 104, 196, .25)",
        "--module-radar-fill": "rgba(40, 114, 255, .08)",
        "--module-radar-stroke": "rgba(93, 228, 208, .40)",
        "--module-radar-profile-fill": "rgba(242, 184, 75, .22)",
        "--module-radar-profile-stroke": "#ffd166",
        "--module-radar-glow": "rgba(45, 138, 255, .62)",
        "--module-analysis-start": "rgba(242, 184, 75, .12)",
        "--module-analysis-end": "rgba(45, 139, 255, .06)",
        "--module-dialog-bg": "#06152e"
      },
      ui: {
        startEyebrow: "Kompas polityczny · moduł aktywny",
        aiLead: "AI porządkuje Twoje odpowiedzi polityczne.",
        aiSubline: "Wynik pokazuje kierunki, nie przykleja etykiety.",
        startButton: "Rozpocznij Kompas polityczny →",
        stageCaption: "Kompas polityczny zmienia akcenty, opisy osi i zachowanie quizu po załadowaniu.",
        cardDescription: "Poznaj swój punkt widzenia na państwo, wolność i wspólne reguły."
      },
      loading: {
        title: "Wczytuję Kompas polityczny…",
        description: "Przygotowuję pytania o państwo, wolność i wspólne reguły."
      },
      quiz: {
        kicker: "Kompas polityczny",
        aiStatus: "AI analizuje Twój kompas polityczny",
        aiNote: "Tempo, opisy osi i podpowiedzi należą do modułu Kompas polityczny."
      }
    },
    "religion-worldview": {
      "id": "religion-worldview",
      "themeId": "worldview",
      "topicUrl": "topics/religia-swiatopoglad-pl.quiz.gz",
      "name": "Jaka religia/światopogląd tkwią w Twoim sercu?",
      "appearance": {
        "--module-accent": "#e2ad67",
        "--module-accent-2": "#a874ff",
        "--module-cyan": "#72e0c1",
        "--module-line": "rgba(226, 173, 103, .38)",
        "--module-warning": "#f1c47c",
        "--module-bg-glow": "rgba(128, 77, 221, .36)",
        "--module-bg-glow-2": "rgba(222, 135, 70, .18)",
        "--module-cyan-border": "rgba(114, 224, 193, .62)",
        "--module-cyan-glow": "rgba(114, 224, 193, .22)",
        "--module-page-bg-1": "#0a0617",
        "--module-page-bg-2": "#21103c",
        "--module-page-bg-3": "#07050f",
        "--module-panel-start": "rgba(40, 21, 66, .95)",
        "--module-panel-end": "rgba(15, 8, 31, .98)",
        "--module-title-start": "rgba(44, 23, 74, .98)",
        "--module-title-end": "rgba(22, 10, 44, .96)",
        "--module-copy-start": "rgba(44, 23, 74, .98)",
        "--module-copy-end": "rgba(15, 8, 31, .97)",
        "--module-stage-start": "rgba(11, 5, 28, .92)",
        "--module-stage-end": "rgba(7, 4, 18, .98)",
        "--module-primary-start": "#a94de8",
        "--module-primary-mid": "#805fe8",
        "--module-primary-end": "#3ac5b0",
        "--module-primary-shadow": "rgba(169, 75, 255, .32)",
        "--module-soft-accent": "rgba(183, 89, 255, .11)",
        "--module-soft-accent-strong": "rgba(226, 173, 103, .16)",
        "--module-holo-filter": "rgba(169, 75, 255, .45)",
        "--module-holo-core-top": "#fff5e4",
        "--module-holo-core-mid": "#b27aff",
        "--module-holo-core-bottom": "#e6a35e",
        "--module-holo-core-stroke": "rgba(255, 255, 255, .48)",
        "--module-holo-core-shadow": "rgba(178, 122, 255, .46)",
        "--module-holo-orbit": "rgba(184, 102, 255, .68)",
        "--module-holo-orbit-shadow": "rgba(179, 74, 255, .54)",
        "--module-holo-inset": "rgba(109, 226, 195, .35)",
        "--module-holo-text": "#e7c3ff",
        "--module-holo-text-shadow": "#a54cff",
        "--module-holo-base": "rgba(226, 173, 103, .65)",
        "--module-holo-base-shadow": "rgba(169, 75, 255, .34)",
        "--module-holo-base-inset": "rgba(114, 224, 193, .34)",
        "--module-answer-letter-start": "rgba(183, 89, 255, .32)",
        "--module-answer-letter-end": "rgba(87, 61, 156, .28)",
        "--module-radar-fill": "rgba(173, 107, 255, .08)",
        "--module-radar-stroke": "rgba(226, 173, 103, .42)",
        "--module-radar-profile-fill": "rgba(188, 112, 255, .27)",
        "--module-radar-profile-stroke": "#d6a4ff",
        "--module-radar-glow": "rgba(166, 83, 255, .68)",
        "--module-analysis-start": "rgba(183, 89, 255, .12)",
        "--module-analysis-end": "rgba(105, 78, 255, .07)",
        "--module-dialog-bg": "#13091f",
        "--module-heart-color": "#ff5f9d",
        "--module-heart-core": "#ffe1ee",
        "--module-heart-glow": "rgba(255, 66, 139, .78)",
        "--module-heart-ring": "rgba(255, 128, 181, .78)"
      },
      "axisMeta": {
        "economy": {
          "name": "Stosunek do dóbr",
          "left": "Prostota",
          "right": "Materialny dobrobyt"
        },
        "social": {
          "name": "Tradycja i zmiana",
          "left": "Tradycja",
          "right": "Otwartość"
        },
        "authority": {
          "name": "Osobista autonomia",
          "left": "Własne poszukiwanie",
          "right": "Wspólne ramy"
        },
        "eu": {
          "name": "Zakres wspólnoty",
          "left": "Lokalność",
          "right": "Uniwersalność"
        },
        "climate": {
          "name": "Relacja z naturą",
          "left": "Ostrożność",
          "right": "Aktywna troska"
        },
        "centralization": {
          "name": "Źródło sensu",
          "left": "Osobiste doświadczenie",
          "right": "Wspólnota i przekaz"
        }
      },
      "ui": {
        "startEyebrow": "Jaka religia/światopogląd tkwią w Twoim sercu? · moduł ładowalny",
        "aiLead": "AI porządkuje Twoje odpowiedzi o wartościach i przekonaniach.",
        "aiSubline": "Wynik jest mapą refleksji, nie oceną wiary.",
        "startButton": "Rozpocznij: Jaka religia/światopogląd tkwią w Twoim sercu? →",
        "stageCaption": "Moduł zmienia pytania, akcenty i opis profilu po załadowaniu.",
        "cardDescription": "Zastanów się nad sensem, wartościami, tradycją i własną drogą."
      },
      "loading": {
        "title": "Wczytuję Jaka religia/światopogląd tkwią w Twoim sercu?…",
        "description": "Przygotowuję pytania o wartościach, sensie i miejscu przekonań w życiu."
      },
      "quiz": {
        "kicker": "Jaka religia/światopogląd tkwią w Twoim sercu?",
        "aiStatus": "AI analizuje Twój profil światopoglądowy",
        "aiNote": "Pytania są zaproszeniem do refleksji, a nie testem poprawności przekonań."
      }
    },
    "global-warming": {
      id: "global-warming",
      themeId: "climate",
      topicUrl: "topics/global-warming-pl.quiz.gz",
      name: "Globalne ocieplenie, prawda czy fake?",
      appearance: {
        ...neutralAppearance,
        "--module-accent": "#ff735c",
        "--module-accent-2": "#42e8d5",
        "--module-cyan": "#8aefff",
        "--module-line": "rgba(138, 239, 255, .34)",
        "--module-warning": "#ffc15a",
        "--module-bg-glow": "rgba(33, 180, 170, .30)",
        "--module-bg-glow-2": "rgba(255, 108, 74, .18)",
        "--module-cyan-border": "rgba(138, 239, 255, .62)",
        "--module-cyan-glow": "rgba(138, 239, 255, .18)",
        "--module-page-bg-1": "#031218",
        "--module-page-bg-2": "#07343b",
        "--module-page-bg-3": "#02090e",
        "--module-panel-start": "rgba(8, 47, 56, .95)",
        "--module-panel-end": "rgba(3, 17, 25, .97)",
        "--module-title-start": "rgba(8, 55, 64, .98)",
        "--module-title-end": "rgba(5, 27, 34, .96)",
        "--module-copy-start": "rgba(8, 48, 57, .98)",
        "--module-copy-end": "rgba(3, 17, 25, .97)",
        "--module-stage-start": "rgba(2, 20, 28, .92)",
        "--module-stage-end": "rgba(2, 10, 15, .98)",
        "--module-primary-start": "#ff6b5c",
        "--module-primary-mid": "#ef9a48",
        "--module-primary-end": "#22cdbd",
        "--module-primary-shadow": "rgba(255, 108, 74, .28)",
        "--module-soft-accent": "rgba(255, 115, 92, .10)",
        "--module-soft-accent-strong": "rgba(255, 193, 90, .16)",
        "--module-holo-filter": "rgba(42, 218, 203, .35)",
        "--module-holo-core-top": "#efffff",
        "--module-holo-core-mid": "#66f3e1",
        "--module-holo-core-bottom": "#ff795d",
        "--module-holo-core-shadow": "rgba(65, 232, 213, .40)",
        "--module-holo-orbit": "rgba(138, 239, 255, .62)",
        "--module-holo-orbit-shadow": "rgba(42, 218, 203, .44)",
        "--module-holo-inset": "rgba(255, 115, 92, .25)",
        "--module-holo-text": "#a8fff2",
        "--module-holo-text-shadow": "#20cfc0",
        "--module-holo-base": "rgba(255, 115, 92, .58)",
        "--module-holo-base-shadow": "rgba(42, 218, 203, .26)",
        "--module-holo-base-inset": "rgba(138, 239, 255, .34)",
        "--module-answer-letter-start": "rgba(255, 115, 92, .30)",
        "--module-answer-letter-end": "rgba(38, 145, 147, .24)",
        "--module-radar-fill": "rgba(66, 232, 213, .07)",
        "--module-radar-stroke": "rgba(138, 239, 255, .40)",
        "--module-radar-profile-fill": "rgba(255, 115, 92, .23)",
        "--module-radar-profile-stroke": "#ffae70",
        "--module-radar-glow": "rgba(66, 232, 213, .56)",
        "--module-analysis-start": "rgba(255, 115, 92, .11)",
        "--module-analysis-end": "rgba(66, 232, 213, .06)",
        "--module-dialog-bg": "#06232b"
      },
      axisMeta: {
        climate: { name: "Klimat", left: "Ostrożność", right: "Tempo zmian" },
        economy: { name: "Koszt i sprawiedliwość", left: "Ostrożność kosztowa", right: "Inwestycje" },
        social: { name: "Zgoda społeczna", left: "Stopniowo", right: "Pilnie" },
        authority: { name: "Rola państwa", left: "Dobrowolność", right: "Reguły" },
        eu: { name: "Współpraca", left: "Samodzielność", right: "Wspólne działanie" },
        centralization: { name: "Skala działania", left: "Lokalnie", right: "Koordynacja" }
      },
      ui: {
        startEyebrow: "Globalne ocieplenie, prawda czy fake? · moduł aktywny",
        aiLead: "AI porządkuje Twoje odpowiedzi o dowodach klimatycznych.",
        aiSubline: "Wynik pokazuje sposób ważenia dowodów, ryzyka i działania.",
        startButton: "Rozpocznij: Globalne ocieplenie, prawda czy fake? →",
        stageCaption: "Moduł łączy pomiary, fizykę CO₂ i testowanie konkurencyjnych wyjaśnień.",
        cardDescription: "Sprawdź, jak oceniasz pomiary, mechanizmy i decyzje klimatyczne."
      },
      loading: {
        title: "Wczytuję Globalne ocieplenie, prawda czy fake?…",
        description: "Przygotowuję pytania o pomiarach, CO₂, lodzie, oceanach i atrybucji."
      },
      quiz: {
        kicker: "Globalne ocieplenie, prawda czy fake?",
        aiStatus: "AI analizuje Twoje rozumowanie klimatyczne",
        aiNote: "Pytania prowadzą przez dane, mechanizmy i jakość argumentów — bez etykietowania osoby."
      }
    }
  };

  const defaultModule = "political-compass";

  function getTheme(id) {
    return themes[id] || themes.politics;
  }

  function mergeModule(base, override) {
    return {
      ...base,
      ...override,
      appearance: { ...(base.appearance || {}), ...(override.appearance || {}) },
      ui: { ...(base.ui || {}), ...(override.ui || {}) },
      loading: { ...(base.loading || {}), ...(override.loading || {}) },
      quiz: { ...(base.quiz || {}), ...(override.quiz || {}) }
    };
  }

  function getModule(id) {
    return modules[id] || modules[defaultModule];
  }

  function registerModule(module) {
    if (!module?.id) throw new Error("Moduł musi mieć identyfikator.");
    modules[module.id] = mergeModule(getModule(defaultModule), module);
    return modules[module.id];
  }

  function describeAxis(themeId, value) {
    const axis = getTheme(themeId).axis;
    const safe = Math.max(axis.min, Math.min(axis.max, Number(value)));
    return axis.ranges.find(range => safe >= range.min && safe <= range.max) || axis.ranges[0];
  }

  return { themes, modules, futureTopics, neutralAppearance, defaultModule, getTheme, getModule, registerModule, describeAxis };
});
