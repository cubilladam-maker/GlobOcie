(function (root) {
  "use strict";

  const STORAGE_KEY = "globocie-language-v1";
  const languages = ["pl", "en"];

  const common = {
    pl: {
      documentTitle: "Odkryj swój wewnętrzny ukryty kod — quiz AI",
      brandName: "Odkryj swój ukryty kod",
      brandTagline: "quiz wspierany przez sztuczną inteligencję",
      homeAria: "Strona główna",
      help: "ⓘ Jak to działa?",
      privacy: "♢ Prywatność",
      languageLabel: "Język",
      languageGroupAria: "Wybór języka",
      closeDialog: "Zamknij",
      ownerHotspot: "Otwórz statystyki właściciela",
      footerBrand: "Odkryj swój ukryty kod",
      siteVersion: "Wersja strony: v{version}",
      siteVersionAria: "Wersja strony v{version}",
      footerService: "Brak Service Workera buforującego stary interfejs.",
      titleSegment1: "Odkryj swój",
      titleSegment2: "wewnętrzny",
      titleSegment3: "ukryty kod",
      genericAiLead: "Jestem Twoją Sztuczną Inteligencją (AI).",
      genericAiSubline: "Od teraz prowadzę Cię przez quiz.",
      uniqueTitle: "Twój kod jest niepowtarzalny",
      uniqueBody: "Każda odpowiedź odsłania kolejny fragment Twojego sposobu myślenia.",
      active: "AKTYWNY",
      available: "DOSTĘPNY",
      benefitProfile: "Odkryjesz swój profil poglądów",
      benefitProfileBody: "Zobaczysz, jak przekonania łączą się ze sobą.",
      benefitAnswers: "Uporządkujesz odpowiedzi",
      benefitAnswersBody: "AI złoży je w czytelny, spójny profil.",
      benefitThinking: "Poznasz styl myślenia",
      benefitThinkingBody: "Nie tylko „co”, ale również „jak” odpowiadasz.",
      benefitAnalysis: "Otrzymasz analizę AI",
      benefitAnalysisBody: "Wynik pozostanie mapą, nie sztywną etykietą.",
      chooseTopic: "Wybierz temat",
      axisIntro: "Zanim rozpoczniesz, ustaw suwak w miejscu, które najlepiej opisuje Twoje obecne podejście. To tylko punkt wyjścia do quizu — możesz wybrać dowolne położenie.",
      initialSetting: "Ustawienie początkowe",
      settings: "Ustawienia",
      difficulty: "Poziom trudności",
      difficultyCanChange: "Możesz zmienić w każdej chwili",
      difficultyAttemptUsed: "Na tym pytaniu wykorzystano próbę zmiany poziomu.",
      difficultyShiftRequiresNew: "Przesunięcie o jedną pozycję wymaga rozpoczęcia nowej gry.",
      startConfigured: "Ustawione na start",
      levelPrefix: "Poziom",
      aiHintLabel: "✦ Wskazówka AI",
      aiHintBody: "AI dopasowuje tempo i podpowiedzi do przebiegu quizu.",
      returnStart: "Powrót na początek gry",
      resetQuiz: "Zresetuj quiz i rozpocznij od nowa",
      questionProgress: "Pytanie {current} / {total}",
      questionFallback: "Pytanie",
      aiHologramAria: "Animowany symbol sztucznej inteligencji",
      artificialIntelligenceOrbit: "Sztuczna Inteligencja",
      questionHint: "AI podpowiedź",
      hide: "ukryj",
      show: "pokaż",
      questionFootnote: "Po wyborze odpowiedzi kolejne pytanie pojawi się automatycznie.",
      aiStatusFallback: "AI analizuje przebieg quizu",
      aiNoteFallback: "Spokojny obrót oznacza aktywną analizę.",
      confirmDifficultyTitle: "Zmiana poziomu wymaga nowej gry",
      confirmDifficultyChange: "Zmieniasz poziom z <strong>{current}</strong> na <strong>{next}</strong>.",
      confirmAnswersRemoved: "Dotychczasowe odpowiedzi zostaną usunięte.",
      startNewGame: "Rozpocznij nową grę",
      stayHere: "Nie, zostań tutaj",
      confirmReturnTitle: "Powrót na początek gry",
      confirmReturnBody: "Dotychczasowe odpowiedzi zostaną usunięte z bieżącej serii.",
      returnToStart: "Wróć na początek",
      responsesTime: "{completed}/{total} odpowiedzi · {minutes} min",
      consistency: "spójność",
      profileFallback: "Twój profil",
      balancedObserver: "Zrównoważony Obserwator",
      independentAnalyst: "Niezależny Analityk",
      openReformer: "Otwarty Reformator",
      pragmaticStrategist: "Pragmatyczny Strateg",
      profileSummary: "Najmocniej wyróżniają Cię: {axes}. To mapa tendencji, nie diagnoza ani sztywna etykieta.",
      rightSide: "prawą stronę swoich osi",
      leftSide: "lewą stronę swoich osi",
      profileChartAria: "Wykres profilu",
      axisChartAria: "Poziome porównanie wyników na osiach",
      axisCenterHint: "środek osi = 50%",
      profileMap: "Mapa Twojego profilu",
      axisComparison: "Porównanie osi",
      keyObservations: "Najważniejsze obserwacje",
      basedOnAnswers: "na podstawie odpowiedzi",
      analysisTitle: "Analiza AI",
      detailsButton: "Zobacz pełny profil →",
      downloadResult: "Pobierz wynik",
      repeatQuiz: "Powtórz quiz",
      analysisStrongest: "Najwyraźniej zaznacza się u Ciebie oś <strong>{strongestName}</strong> — wynik {strongestValue}%. Najbardziej wyśrodkowana pozostaje oś <strong>{weakestName}</strong> ({weakestValue}%), więc właśnie tam Twoje odpowiedzi są najbardziej elastyczne.",
      analysisAverage: "Średnia wszystkich osi wynosi {average}%, co wskazuje na ogólną skłonność ku {direction}. Traktuj ten rezultat jako mapę aktualnych tendencji: odpowiedzi mogą zmieniać się wraz z doświadczeniem, wiedzą i sytuacją.",
      profileAxes: "Twoje położenie na osiach",
      profileAxesHint: "Wynik 50% oznacza środek danej osi",
      profileCode: "Jak działa Twój wewnętrzny kod",
      profilePatterns: "Najważniejsze wzorce odpowiedzi",
      aiSummary: "Podsumowanie AI",
      profileConclusion: "Największą wartością tego profilu jest jego wielowymiarowość. Traktuj go jak punkt startowy do dalszych pytań, a nie ostateczny opis siebie.",
      downloadFullProfile: "Pobierz pełny profil",
      backToResults: "Wróć do podsumowania",
      home: "Ekran główny",
      helpTitle: "Jak to działa?",
      helpParagraph1: "Wybierz pozycję początkową i poziom trudności. Po kliknięciu odpowiedzi kolejne pytanie pojawi się automatycznie w płynnym obrocie karty.",
      helpParagraph2: "Na końcu zobaczysz mapę 3D oraz poziome porównanie osi. To narzędzie do autorefleksji, nie diagnoza psychologiczna.",
      privacyTitle: "Prywatność",
      privacyParagraph1: "Odpowiedzi, postęp quizu i liczba rozpoczęć gry są przechowywane lokalnie w tej przeglądarce. Liczba rozpoczęć nie jest wysyłana na serwer.",
      privacyParagraph2: "Opcjonalny licznik odwiedzin zapisuje wyłącznie losowy identyfikator przeglądarki, bez imienia, adresu e-mail i treści odpowiedzi.",
      counterHeading: "Statystyki GlobOcie",
      onlineVisits: "Odwiedziny online",
      localStarts: "Rozpoczęcia gry lokalnie",
      onDevice: "na tym urządzeniu",
      counterNotConnected: "usługa online do podłączenia",
      counterUnavailable: "licznik chwilowo niedostępny",
      invalidOwnerCode: "nieprawidłowy kod właściciela",
      ownerPrompt: "Kod właściciela (wymagany tylko przy pierwszym uruchomieniu):",
      counterHttp: "Licznik HTTP {status}",
      loadingErrorTitle: "Nie udało się uruchomić quizu",
      back: "Wróć",
      browserNoGzip: "Ta przeglądarka nie obsługuje rozpakowywania GZIP.",
      embeddedFallback: "Używam osadzonej kopii tematu.",
      packageNotFound: "Nie znaleziono paczki pytań.",
      localStartsStat: "lokalne rozpoczęcia gry na tym urządzeniu",
      upcomingTopics: "Przyszłe tematy",
      inPreparation: "W przygotowaniu",
      comingSoon: "Wkrótce",
      levelSchool: "Uczeń",
      levelStudent: "Student",
      levelProfessor: "Profesor",
      levelExpert: "Ekspert",
      insightAnalytical: "Analityczne podejście",
      insightAnalyticalBody: "Decyzje opierasz na argumentach i szukasz konsekwencji różnych rozwiązań.",
      insightIndependent: "Niezależność myślenia",
      insightIndependentBody: "Nie przyjmujesz gotowych etykiet; częściej budujesz własne stanowisko.",
      insightConsistency: "Spójność wartości",
      insightConsistencyBody: "W odpowiedziach powtarza się stabilny zestaw priorytetów.",
      detailAnalytical: "Analityczne podejście",
      detailAnalyticalBody: "Porządkujesz informacje i szukasz związków przyczynowo-skutkowych.",
      detailIndependent: "Niezależność",
      detailIndependentBody: "Własne rozumowanie jest dla Ciebie ważniejsze niż przynależność do obozu.",
      detailOpen: "Otwartość",
      detailOpenBody: "Potrafisz aktualizować stanowisko, kiedy pojawiają się lepsze argumenty.",
      detailDecision: "Styl decyzji",
      detailDecisionBody: "Łączysz ocenę faktów z przewidywaniem praktycznych konsekwencji.",
      detailStrengths: "Mocne strony",
      detailStrengthsBody: "Spójność, ciekawość i odporność na proste etykiety.",
      detailGrowth: "Obszar do rozwoju",
      detailGrowthBody: "Warto sprawdzać, czy dłuższa analiza nie opóźnia potrzebnej decyzji.",
      hintOne: "Czytaj całe pytanie. Wybierz odpowiedź najbliższą Tobie, nie tę, która brzmi najmocniej.",
      hintTwo: "Jeśli wahasz się między dwiema odpowiedziami, wybierz tę, którą obroniłbyś bez dodatkowych zastrzeżeń.",
      hintThree: "Oddziel to, co faktycznie uważasz, od tego, co Twoim zdaniem wypada odpowiedzieć."
    },
    en: {
      documentTitle: "Discover your hidden inner code — AI quiz",
      brandName: "Discover your hidden code",
      brandTagline: "a quiz supported by artificial intelligence",
      homeAria: "Home page",
      help: "ⓘ How does it work?",
      privacy: "♢ Privacy",
      languageLabel: "Language",
      languageGroupAria: "Language selection",
      closeDialog: "Close",
      ownerHotspot: "Open owner statistics",
      footerBrand: "Discover your hidden code",
      siteVersion: "Site version: v{version}",
      siteVersionAria: "Site version v{version}",
      footerService: "No Service Worker is caching the old interface.",
      titleSegment1: "Discover your",
      titleSegment2: "hidden inner",
      titleSegment3: "code",
      genericAiLead: "I am your Artificial Intelligence (AI).",
      genericAiSubline: "From here, I will guide you through the quiz.",
      uniqueTitle: "Your code is one of a kind",
      uniqueBody: "Each answer reveals another fragment of the way you think.",
      active: "ACTIVE",
      available: "AVAILABLE",
      benefitProfile: "Discover your opinion profile",
      benefitProfileBody: "See how your beliefs connect with one another.",
      benefitAnswers: "Organize your answers",
      benefitAnswersBody: "AI will assemble them into a clear, coherent profile.",
      benefitThinking: "Learn your thinking style",
      benefitThinkingBody: "Not only what you answer, but also how you answer.",
      benefitAnalysis: "Receive an AI analysis",
      benefitAnalysisBody: "The result remains a map, not a fixed label.",
      chooseTopic: "Choose a topic",
      axisIntro: "Before you begin, place the slider where it best describes your current approach. It is only a starting point for the quiz — choose any position you like.",
      initialSetting: "Starting position",
      settings: "Settings",
      difficulty: "Difficulty level",
      difficultyCanChange: "You can change it at any time",
      difficultyAttemptUsed: "You have used the level-change attempt on this question.",
      difficultyShiftRequiresNew: "Moving by one position requires starting a new game.",
      startConfigured: "Set at the start",
      levelPrefix: "Level",
      aiHintLabel: "✦ AI hint",
      aiHintBody: "AI adapts the pace and hints to the course of the quiz.",
      returnStart: "Return to the start",
      resetQuiz: "Reset the quiz and start again",
      questionProgress: "Question {current} / {total}",
      questionFallback: "Question",
      aiHologramAria: "Animated artificial intelligence symbol",
      artificialIntelligenceOrbit: "Artificial Intelligence",
      questionHint: "AI hint",
      hide: "hide",
      show: "show",
      questionFootnote: "After you choose an answer, the next question will appear automatically.",
      aiStatusFallback: "AI is analyzing the quiz",
      aiNoteFallback: "A calm rotation indicates active analysis.",
      confirmDifficultyTitle: "Changing the level requires a new game",
      confirmDifficultyChange: "You are changing the level from <strong>{current}</strong> to <strong>{next}</strong>.",
      confirmAnswersRemoved: "Your answers so far will be removed.",
      startNewGame: "Start a new game",
      stayHere: "No, stay here",
      confirmReturnTitle: "Return to the start",
      confirmReturnBody: "Your answers so far will be removed from the current series.",
      returnToStart: "Return to the start",
      responsesTime: "{completed}/{total} answers · {minutes} min",
      consistency: "consistency",
      profileFallback: "Your profile",
      balancedObserver: "Balanced Observer",
      independentAnalyst: "Independent Analyst",
      openReformer: "Open Reformer",
      pragmaticStrategist: "Pragmatic Strategist",
      profileSummary: "Your strongest themes are: {axes}. This is a map of tendencies, not a diagnosis or a fixed label.",
      rightSide: "the right side of your axes",
      leftSide: "the left side of your axes",
      profileChartAria: "Profile chart",
      axisChartAria: "Horizontal comparison of results across the axes",
      axisCenterHint: "axis midpoint = 50%",
      profileMap: "Your profile map",
      axisComparison: "Axis comparison",
      keyObservations: "Key observations",
      basedOnAnswers: "based on your answers",
      analysisTitle: "AI analysis",
      detailsButton: "See the full profile →",
      downloadResult: "Download result",
      repeatQuiz: "Retake quiz",
      analysisStrongest: "The clearest signal is your <strong>{strongestName}</strong> axis at {strongestValue}%. The most centered axis is <strong>{weakestName}</strong> ({weakestValue}%), which is where your answers are most flexible.",
      analysisAverage: "The average across all axes is {average}%, suggesting an overall leaning toward {direction}. Treat this result as a map of current tendencies: answers can change with experience, knowledge, and circumstances.",
      profileAxes: "Your position on the axes",
      profileAxesHint: "A score of 50% marks the midpoint of an axis",
      profileCode: "How your inner code works",
      profilePatterns: "The most important answer patterns",
      aiSummary: "AI summary",
      profileConclusion: "The greatest value of this profile is its multidimensional view. Treat it as a starting point for further questions, not as a final description of yourself.",
      downloadFullProfile: "Download full profile",
      backToResults: "Back to summary",
      home: "Home screen",
      helpTitle: "How does it work?",
      helpParagraph1: "Choose a starting position and difficulty level. After you click an answer, the next question will appear automatically with a smooth card rotation.",
      helpParagraph2: "At the end, you will see a 3D map and a horizontal comparison of the axes. This is a self-reflection tool, not a psychological diagnosis.",
      privacyTitle: "Privacy",
      privacyParagraph1: "Answers, quiz progress, and the number of game starts are stored locally in this browser. The number of starts is not sent to a server.",
      privacyParagraph2: "The optional visit counter stores only a random browser identifier, without your name, email address, or answer content.",
      counterHeading: "GlobOcie statistics",
      onlineVisits: "Online visits",
      localStarts: "Local game starts",
      onDevice: "on this device",
      counterNotConnected: "online service to connect",
      counterUnavailable: "counter temporarily unavailable",
      invalidOwnerCode: "invalid owner code",
      ownerPrompt: "Owner code (required only on first use):",
      counterHttp: "Counter HTTP {status}",
      loadingErrorTitle: "The quiz could not be started",
      back: "Back",
      browserNoGzip: "This browser does not support GZIP decompression.",
      embeddedFallback: "Using the embedded topic copy.",
      packageNotFound: "Question package not found.",
      localStartsStat: "local game starts on this device",
      upcomingTopics: "Upcoming topics",
      inPreparation: "In preparation",
      comingSoon: "Coming soon",
      levelSchool: "School",
      levelStudent: "Student",
      levelProfessor: "Professor",
      levelExpert: "Expert",
      insightAnalytical: "Analytical approach",
      insightAnalyticalBody: "You base decisions on arguments and look for the consequences of different solutions.",
      insightIndependent: "Independent thinking",
      insightIndependentBody: "You do not adopt ready-made labels; you more often build your own position.",
      insightConsistency: "Value consistency",
      insightConsistencyBody: "Your answers repeat a stable set of priorities.",
      detailAnalytical: "Analytical approach",
      detailAnalyticalBody: "You organize information and look for cause-and-effect relationships.",
      detailIndependent: "Independence",
      detailIndependentBody: "Your own reasoning matters more to you than belonging to a camp.",
      detailOpen: "Openness",
      detailOpenBody: "You can update your position when better arguments appear.",
      detailDecision: "Decision style",
      detailDecisionBody: "You combine weighing facts with anticipating practical consequences.",
      detailStrengths: "Strengths",
      detailStrengthsBody: "Consistency, curiosity, and resistance to simple labels.",
      detailGrowth: "Room to grow",
      detailGrowthBody: "It is worth checking whether extended analysis delays a decision that needs to be made.",
      hintOne: "Read the whole question. Choose the answer closest to you, not the one that sounds strongest.",
      hintTwo: "If you are between two answers, choose the one you could defend without extra qualifications.",
      hintThree: "Separate what you actually think from what you feel you are expected to answer."
    }
  };

  const difficultyCopy = {
    pl: ["Uczeń", "Student", "Student+", "Zaawansowany", "Zaawansowany+", "Doktorant", "Doktorant+", "Doktor", "Profesor−", "Profesor", "Ekspert"],
    en: ["School", "Student", "Student+", "Advanced", "Advanced+", "Doctoral", "Doctoral+", "Doctor", "Professor−", "Professor", "Expert"]
  };

  const themeCopy = {
    politics: {
      en: {
        name: "Position on the political spectrum",
        eyebrow: "Explore how you see the state and freedom",
        axis: {
          title: "Your political axis",
          purpose: "Your starting point helps AI compare your self-description with your quiz answers.",
          leftLabel: "More freedom",
          rightLabel: "A larger role for the state",
          ranges: [
            { min: 0, max: 19, label: "Strongly more freedom", hint: "Individual freedom and a limited role for the state matter most to you." },
            { min: 20, max: 39, label: "More freedom", hint: "You lean toward individual freedom while leaving selected tasks to the state." },
            { min: 40, max: 60, label: "Balance between freedom and the state", hint: "You look for a practical balance between personal autonomy and shared rules." },
            { min: 61, max: 80, label: "A larger role for the state", hint: "You more often see the state as a tool for order and equal opportunity." },
            { min: 81, max: 100, label: "Strongly more state", hint: "Strong public institutions matter more to you than broad individual freedom." }
          ]
        }
      }
    },
    thinking: {
      en: {
        name: "Thinking style",
        eyebrow: "Explore how you analyze information",
        axis: {
          title: "Your thinking axis",
          purpose: "Your starting point describes how you usually make decisions.",
          leftLabel: "More intuition",
          rightLabel: "More analysis",
          ranges: [
            { min: 0, max: 39, label: "Intuition leads", hint: "You sense a direction first and look for justification afterward." },
            { min: 40, max: 60, label: "Balance between intuition and analysis", hint: "You combine a hunch with organizing the facts." },
            { min: 61, max: 100, label: "Analysis leads", hint: "You organize the data first and choose a direction afterward." }
          ]
        }
      }
    },
    worldview: {
      en: {
        name: "Worldview and values",
        eyebrow: "Explore your values, beliefs, and way of seeing the world",
        axis: {
          title: "Your worldview axis",
          purpose: "Your starting point helps compare your stated values with your quiz answers.",
          leftLabel: "More autonomy",
          rightLabel: "More rootedness",
          ranges: [
            { min: 0, max: 19, label: "Strong autonomy", hint: "Personal choices and an independent search for meaning matter most to you." },
            { min: 20, max: 39, label: "Autonomy leads", hint: "You value your own path while still seeing value in shared traditions." },
            { min: 40, max: 60, label: "Balance between autonomy and rootedness", hint: "You combine personal searching with respect for community and tradition." },
            { min: 61, max: 80, label: "Rootedness leads", hint: "Community, continuity, and inherited meanings are important points of reference for you." },
            { min: 81, max: 100, label: "Strong rootedness", hint: "Tradition, community, and lasting frameworks of value carry the greatest weight for you." }
          ]
        }
      }
    }
  };

  const axisMetaCopy = {
    politics: {
      en: {
        economy: { name: "Economy", left: "Market", right: "Redistribution" },
        social: { name: "Social change", left: "Tradition", right: "Change" },
        authority: { name: "Freedom", left: "Autonomy", right: "Order" },
        eu: { name: "Poland / EU", left: "Sovereignty", right: "Integration" },
        climate: { name: "Climate", left: "Caution", right: "Faster transition" },
        centralization: { name: "Government", left: "Local government", right: "Centralization" }
      }
    },
    worldview: {
      en: {
        economy: { name: "Relationship with material goods", left: "Simplicity", right: "Material prosperity" },
        social: { name: "Tradition and change", left: "Tradition", right: "Openness" },
        authority: { name: "Personal autonomy", left: "Personal searching", right: "Shared frameworks" },
        eu: { name: "Community scope", left: "Locality", right: "Universality" },
        climate: { name: "Relationship with nature", left: "Caution", right: "Active care" },
        centralization: { name: "Source of meaning", left: "Personal experience", right: "Community and transmission" }
      }
    }
  };

  const moduleCopy = {
    "political-compass": {
      en: {
        name: "Political Compass",
        ui: {
          startEyebrow: "Political Compass · active module",
          aiLead: "AI organizes your political answers.",
          aiSubline: "The result shows directions without assigning a label.",
          startButton: "Start Political Compass →",
          stageCaption: "Political Compass changes accents, axis descriptions, and quiz behavior after loading.",
          cardDescription: "Explore your view of the state, freedom, and shared rules."
        },
        loading: {
          title: "Loading Political Compass…",
          description: "Preparing questions about the state, freedom, and shared rules."
        },
        quiz: {
          kicker: "Political Compass",
          aiStatus: "AI is analyzing your political compass",
          aiNote: "The pace, axis descriptions, and hints belong to the Political Compass module."
        }
      }
    },
    "religion-worldview": {
      en: {
        name: "Which religion or worldview is in your heart?",
        ui: {
          startEyebrow: "Which religion or worldview is in your heart? · loadable module",
          aiLead: "AI organizes your answers about values and beliefs.",
          aiSubline: "The result is a map for reflection, not a judgment of faith.",
          startButton: "Start: Which religion or worldview is in your heart? →",
          stageCaption: "This module changes the questions, accents, and profile description after loading.",
          cardDescription: "Reflect on meaning, values, tradition, and your own path."
        },
        loading: {
          title: "Loading Which religion or worldview is in your heart?…",
          description: "Preparing questions about values, meaning, and the place of beliefs in life."
        },
        quiz: {
          kicker: "Which religion or worldview is in your heart?",
          aiStatus: "AI is analyzing your worldview profile",
          aiNote: "These questions invite reflection; they do not test whether your beliefs are correct."
        }
      }
    }
  };

  const futureTopicCopy = {
    "searching-god": { pl: "Poszukiwania Boga. Nauka, mity a rzeczywistość", en: "Searching for God: science, myths, and reality" },
    "global-warming": { pl: "Globalne ocieplenie — naukowa prawda czy fake?", en: "Global warming — scientific truth or fake?" },
    "thinking-style": { pl: "Styl myślenia", en: "Thinking style" },
    "relationships-emotions": { pl: "Relacje i emocje", en: "Relationships and emotions" },
    "morality-conscience": { pl: "Moralność i sumienie", en: "Morality and conscience" },
    "human-ai": { pl: "Człowiek i sztuczna inteligencja", en: "Humans and artificial intelligence" },
    "meaning-happiness": { pl: "Sens życia i szczęście", en: "Meaning of life and happiness" }
  };

  const answerScaleCopy = {
    "POLITYKA-PL": {
      pl: ["Zdecydowanie się nie zgadzam", "Raczej się nie zgadzam", "Nie mam zdania", "Raczej się zgadzam", "Zdecydowanie się zgadzam"],
      en: ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"]
    },
    "religia-swiatopoglad-pl": {
      pl: ["Zdecydowanie bliżej lewej", "Raczej bliżej lewej", "Pośrodku", "Raczej bliżej prawej", "Zdecydowanie bliżej prawej"],
      en: ["Definitely closer to the left", "Rather closer to the left", "In the middle", "Rather closer to the right", "Definitely closer to the right"]
    }
  };

  const categoryCopy = {
    "POLITYKA-PL": {
      pl: { Gospodarka: "Gospodarka", "Wolność i porządek": "Wolność i porządek", Obyczaje: "Obyczaje", "Polska i UE": "Polska i UE", "Klimat i energia": "Klimat i energia", "Państwo i samorząd": "Państwo i samorząd" },
      en: { Gospodarka: "Economy", "Wolność i porządek": "Freedom and order", Obyczaje: "Social change", "Polska i UE": "Poland and the EU", "Klimat i energia": "Climate and energy", "Państwo i samorząd": "Government and local government" }
    },
    "religia-swiatopoglad-pl": {
      pl: { Wartości: "Wartości", Wspólnota: "Wspólnota", Różnorodność: "Różnorodność", Natura: "Natura", Sumienie: "Sumienie", Tradycja: "Tradycja", Granice: "Granice", Odpowiedzialność: "Odpowiedzialność", Zmiana: "Zmiana", Prawda: "Prawda", "Wspólne dobro": "Wspólne dobro", Sens: "Sens" },
      en: { Wartości: "Values", Wspólnota: "Community", Różnorodność: "Diversity", Natura: "Nature", Sumienie: "Conscience", Tradycja: "Tradition", Granice: "Boundaries", Odpowiedzialność: "Responsibility", Zmiana: "Change", Prawda: "Truth", "Wspólne dobro": "Common good", Sens: "Meaning" }
    }
  };

  const questionCopy = {
    "POLITYKA-PL": {
      u01: "The state should provide more help to people with low incomes, even if this requires higher taxes for part of society.",
      u02: "For the sake of security, the state may sometimes limit some civil liberties.",
      u03: "The law should quickly adapt to social and cultural changes taking place in society.",
      u04: "Poland should hand some decisions to European Union institutions when this allows EU countries to act together.",
      u05: "The state should speed up the move away from fossil fuels, even if consumers bear part of the cost.",
      u06: "More important decisions should be made in Warsaw and fewer in municipalities and regions.",
      u07: "Private companies usually decide better than the state where money and investment should go.",
      u08: "Even unpopular views should be protected by freedom of speech as long as they do not directly call for violence.",
      s01: "The state should actively reduce wealth inequality through taxes and redistribution, even if this limits some incentives for private investment.",
      s02: "In a situation of a long-lasting security threat, expanding the powers of law-enforcement and security services may be justified at the cost of some citizens’ privacy.",
      s03: "Family and social law should primarily reflect the current choices of adult citizens rather than preserve traditional social norms.",
      s04: "In areas such as energy security or climate, common EU decisions should sometimes take precedence over complete freedom of national policy.",
      s05: "If the market does not reduce emissions quickly enough on its own, the state should use standards, fees, or bans to speed up the energy transition.",
      s06: "The most important public services should be organized according to uniform national standards, even at the cost of some local government independence.",
      s07: "Lower taxes and greater freedom for entrepreneurs are usually a better way to increase prosperity than expanding redistribution programs.",
      s08: "The state should be very cautious about restricting protests and speech, even when they are disruptive or sharply criticize public institutions.",
      p01: "Higher progressive taxation is justified not only for fiscal reasons, but also as a way to limit the concentration of economic influence over public life.",
      p02: "In a liberal democracy, expanding the powers of security agencies as a preventive measure can sometimes be acceptable, even if it weakens the principle of minimal state interference in private life.",
      p03: "The state’s ideological neutrality should mean actively removing the historical privileges of dominant cultural norms from public law.",
      p04: "Further European integration should include more decisions made by majority vote at the supranational level, even when an individual country loses its veto.",
      p05: "The external costs of emissions should be reflected in regulation or prices, even if this temporarily reduces the competitiveness of some energy-intensive sectors.",
      p06: "Equal access to public services justifies central standards and redistribution between regions, even at the cost of local governments’ fiscal autonomy.",
      p07: "Because market participants hold dispersed knowledge, administrative attempts to correct prices and investment patterns more often create new distortions than remove existing ones.",
      p08: "Strong protection of freedom of expression should also cover content that most people consider socially harmful, as long as it does not meet narrow criteria for a direct threat.",
      u09: "When the state has extra money, it is better to lower taxes than create new aid programs.",
      u10: "To maintain order, the police should have broader powers of control, even if that means less privacy.",
      u11: "The state should generally let adults decide for themselves how to live, even when most people consider those choices wrong.",
      u12: "Important decisions about Poland should be made primarily in Poland, even if this makes joint EU action harder.",
      u13: "If protecting the climate raises energy bills, the state should slow the pace of new regulations.",
      u14: "Municipalities and cities should have more freedom than central administration in spending money and organizing services.",
      s09: "Over the long term, simpler taxes and less redistribution usually support development better than extensive social transfers.",
      s10: "Even in the name of security, the state should set a very high threshold before allowing mass surveillance of citizens’ communications.",
      s11: "The law should protect adults’ freedom to live by non-traditional norms as long as they do not harm others.",
      s12: "National law should take precedence in more disputes over powers with EU institutions.",
      s13: "The energy transition should be slower if its pace clearly harms the economy’s competitiveness and raises the cost of living.",
      s14: "Local governments should have greater tax and organizational autonomy, even if this leads to differences between regions.",
      p09: "Redistribution should be limited where it weakens incentives to work, save, and invest more than it improves social well-being.",
      p10: "The presumption of individual freedom should limit preventive state powers even when some security risk remains uneliminated.",
      p11: "Liberal pluralism requires the state not to privilege traditional moral norms over alternative, voluntary lifestyles of adults.",
      p12: "The principle of subsidiarity should limit transferring new powers to the EU level when goals can be achieved effectively at the national level.",
      p13: "Climate policy should give more weight to the marginal cost of emissions reductions and delay measures whose social cost is disproportionate to their effect.",
      p14: "The principle of subsidiarity supports assigning powers to the lowest effective level of government, even at the cost of less uniform services."
    },
    "religia-swiatopoglad-pl": {
      "rw-001": "In matters of life’s meaning, personally searching for answers is most important to me.",
      "rw-002": "A religious or cultural tradition can be a valuable guide for people today as well.",
      "rw-003": "Different religions and worldviews can bring valuable perspectives to a shared conversation.",
      "rw-004": "The way people relate to nature is an important test of their value system.",
      "rw-005": "My own conscience should come before pressure from a group.",
      "rw-006": "It is worth preserving customs even when their original meaning can no longer be reconstructed.",
      "rw-007": "Respect for other people’s beliefs should also include the right to question them critically.",
      "rw-008": "A mature worldview should shape everyday decisions rather than remain only a declaration.",
      "rw-009": "A tradition that allows no correction gradually loses its ability to respond to people’s real problems.",
      "rw-010": "Important beliefs should be ready to engage in conversation with facts and experience.",
      "rw-011": "Differences in worldview should not prevent us from building shared principles for living together fairly.",
      "rw-012": "Questions without a final answer can be very valuable for human growth."
    }
  };

  function currentStorage() {
    try { return root.localStorage || globalThis.localStorage; } catch (_) { return null; }
  }

  function currentLanguage() {
    try {
      const stored = currentStorage()?.getItem(STORAGE_KEY);
      return languages.includes(stored) ? stored : "pl";
    } catch (_) { return "pl"; }
  }

  function interpolate(value, vars = {}) {
    return String(value).replace(/\{([\w]+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  }

  function text(key, vars = {}) {
    const lang = currentLanguage();
    const source = common[lang]?.[key] ?? common.pl[key] ?? key;
    return interpolate(source, vars);
  }

  function copyFor(table, id) {
    const lang = currentLanguage();
    return table[id]?.[lang] || table[id]?.pl || null;
  }

  function theme(id, rawTheme = {}) {
    const localized = copyFor(themeCopy, id) || {};
    return {
      ...rawTheme,
      ...localized,
      axis: { ...(rawTheme.axis || {}), ...(localized.axis || {}), ranges: localized.axis?.ranges || rawTheme.axis?.ranges || [] }
    };
  }

  function axisMeta(themeId, rawMeta = {}) {
    const localized = axisMetaCopy[themeId]?.[currentLanguage()] || {};
    return Object.fromEntries(Object.entries(rawMeta).map(([key, value]) => [key, { ...(value || {}), ...(localized[key] || {}) }]));
  }

  function axisDescription(themeId, value, rawTheme) {
    const axis = theme(themeId, rawTheme).axis || {};
    const numeric = Number(value);
    const safe = Math.max(Number(axis.min ?? 0), Math.min(Number(axis.max ?? 100), Number.isFinite(numeric) ? numeric : Number(axis.defaultValue ?? 50)));
    return axis.ranges.find(range => safe >= range.min && safe <= range.max) || axis.ranges[0] || { label: "", hint: "" };
  }

  function moduleCopyFor(id, rawModule = {}) {
    const localized = copyFor(moduleCopy, id) || {};
    return {
      ...rawModule,
      ...localized,
      ui: { ...(rawModule.ui || {}), ...(localized.ui || {}) },
      loading: { ...(rawModule.loading || {}), ...(localized.loading || {}) },
      quiz: { ...(rawModule.quiz || {}), ...(localized.quiz || {}) }
    };
  }

  function futureTopic(id, fallback = "") {
    return futureTopicCopy[id]?.[currentLanguage()] || fallback;
  }

  function packageCopy(packageId, table, id, fallback = "") {
    const lang = currentLanguage();
    const value = table[packageId]?.[lang]?.[id];
    return value ?? table[packageId]?.pl?.[id] ?? fallback;
  }

  function questionText(packageId, id, fallback = "") {
    if (currentLanguage() === "en") return questionCopy[packageId]?.[id] || fallback;
    return fallback;
  }

  function questionCategory(packageId, category = "") {
    return categoryCopy[packageId]?.[currentLanguage()]?.[category] || categoryCopy[packageId]?.pl?.[category] || category;
  }

  function answerScale(packageId, fallback = []) {
    const labels = answerScaleCopy[packageId]?.[currentLanguage()];
    if (!labels) return fallback;
    return fallback.map((answer, index) => ({ ...answer, label: labels[index] || answer.label }));
  }

  function difficultyLabel(index, fallback = "") {
    return difficultyCopy[currentLanguage()]?.[Number(index)] || fallback;
  }

  function insights() {
    return [
      ["✦", text("insightAnalytical"), text("insightAnalyticalBody")],
      ["◎", text("insightIndependent"), text("insightIndependentBody")],
      ["◇", text("insightConsistency"), text("insightConsistencyBody")]
    ];
  }

  function profileDetails() {
    return [
      ["✦", text("detailAnalytical"), text("detailAnalyticalBody")],
      ["◎", text("detailIndependent"), text("detailIndependentBody")],
      ["◇", text("detailOpen"), text("detailOpenBody")],
      ["⌘", text("detailDecision"), text("detailDecisionBody")],
      ["☷", text("detailStrengths"), text("detailStrengthsBody")],
      ["△", text("detailGrowth"), text("detailGrowthBody")]
    ];
  }

  function hints() { return [text("hintOne"), text("hintTwo"), text("hintThree")]; }

  function setLanguage(nextLanguage) {
    const next = String(nextLanguage).toLowerCase();
    if (!languages.includes(next)) return currentLanguage();
    try { currentStorage()?.setItem(STORAGE_KEY, next); } catch (_) { /* local persistence is optional */ }
    try {
      const EventConstructor = root.CustomEvent || root.Event;
      if (typeof EventConstructor === "function") root.dispatchEvent(new EventConstructor("globocie-language-change"));
    } catch (_) { /* rendering can also be requested by the caller */ }
    return next;
  }

  root.GLOBOCIE_I18N = {
    getLanguage: currentLanguage,
    setLanguage,
    text,
    theme,
    axisMeta,
    axisDescription,
    module: moduleCopyFor,
    futureTopic,
    questionText,
    questionCategory,
    answerScale,
    difficultyLabel,
    insights,
    profileDetails,
    hints,
    packageCopy
  };
})(typeof window !== "undefined" ? window : globalThis);
