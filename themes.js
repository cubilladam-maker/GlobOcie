(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.GLOBOCIE_THEME_API = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

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
    }
  };

  const modules = {
    "political-compass": {
      id: "political-compass",
      themeId: "politics",
      topicUrl: "topics/polityka-pl.quiz.gz",
      name: "Kompas polityczny",
      appearance: {
        "--module-accent": "#f0b74c",
        "--module-accent-2": "#3d8dff",
        "--module-cyan": "#5de4d0",
        "--module-line": "rgba(240, 183, 76, .30)",
        "--module-warning": "#f0b74c",
        "--module-bg-glow": "rgba(34, 93, 208, .25)",
        "--module-bg-glow-2": "rgba(240, 183, 76, .12)",
        "--module-cyan-border": "rgba(93, 228, 208, .58)",
        "--module-cyan-glow": "rgba(93, 228, 208, .18)"
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
      "name": "Religia i światopogląd",
      "appearance": {
        "--module-accent": "#d9a85f",
        "--module-accent-2": "#8d79ff",
        "--module-cyan": "#72e0c1",
        "--module-line": "rgba(217, 168, 95, .30)",
        "--module-warning": "#d9a85f",
        "--module-bg-glow": "rgba(104, 73, 179, .25)",
        "--module-bg-glow-2": "rgba(217, 168, 95, .12)",
        "--module-cyan-border": "rgba(114, 224, 193, .58)",
        "--module-cyan-glow": "rgba(114, 224, 193, .18)"
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
        "startEyebrow": "Religia i światopogląd · moduł ładowalny",
        "aiLead": "AI porządkuje Twoje odpowiedzi o wartościach i przekonaniach.",
        "aiSubline": "Wynik jest mapą refleksji, nie oceną wiary.",
        "startButton": "Rozpocznij: Religia i światopogląd →",
        "stageCaption": "Moduł zmienia pytania, akcenty i opis profilu po załadowaniu.",
        "cardDescription": "Zastanów się nad sensem, wartościami, tradycją i własną drogą."
      },
      "loading": {
        "title": "Wczytuję Religia i światopogląd…",
        "description": "Przygotowuję pytania o wartościach, sensie i miejscu przekonań w życiu."
      },
      "quiz": {
        "kicker": "Religia i światopogląd",
        "aiStatus": "AI analizuje Twój profil światopoglądowy",
        "aiNote": "Pytania są zaproszeniem do refleksji, a nie testem poprawności przekonań."
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

  return { themes, modules, defaultModule, getTheme, getModule, registerModule, describeAxis };
});
