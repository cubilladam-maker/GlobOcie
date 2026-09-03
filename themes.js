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
    }
  };

  function getTheme(id) {
    return themes[id] || themes.politics;
  }

  function describeAxis(themeId, value) {
    const axis = getTheme(themeId).axis;
    const safe = Math.max(axis.min, Math.min(axis.max, Number(value)));
    return axis.ranges.find(range => safe >= range.min && safe <= range.max) || axis.ranges[0];
  }

  return { themes, getTheme, describeAxis };
});
