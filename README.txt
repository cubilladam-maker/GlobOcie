GLOBOCIE v2.8 — ODKRYJ SWÓJ WEWNĘTRZNY UKRYTY KOD

Nowy interfejs quizu obejmuje ekran startowy, pytania, wynik i pełny profil.
Aktywny moduł „Kompas polityczny” może zmieniać wygląd, teksty i zachowanie po wczytaniu własnego pakietu pytań.
Licznik właściciela pokazuje wersję aplikacji oraz nazwę aktywnego modułu.
Na ekranie startowym widoczna jest także lokalna liczba rozpoczęć gry na tym urządzeniu. Panel właściciela pokazuje równocześnie licznik online i licznik lokalny.
Test lokalny: otwórz index.html albo uruchom START-SERWER-LOCAL.bat.
Publikacja GitHub Pages następuje dopiero po osobnym zatwierdzeniu użytkownika.

ARCHIWALNY OPIS RDZENIA DANYCH

QUIZ-DOWODOWY-CORE-2026 — CORE 2.1 GRAPH PLANNER

NAJWAŻNIEJSZA ZMIANA
Pytania nie są już „mózgiem”. Są warstwą prezentacji modelu wiedzy.

MODEL:
- 150 kanonicznych węzłów:
  * 80 węzłów dowodowych/tematycznych,
  * 50 węzłów pojęciowych,
  * 20 węzłów wzorców rozumowania.
- 40 000 istniejących rekordów pytań przypisano do węzłów.
- Każda błędna odpowiedź może mieć reasoning_tags.
- Profil użytkownika pamięta nie tylko wyniki, ale typy powtarzających się błędów.

OBOWIĄZKOWY RDZEŃ KAŻDEJ SESJI:
1. Czy Ziemia się ociepla?
2. Czy pomiary są wiarygodne?
3. Czy niezależne wskaźniki są zgodne?
4. Co fizycznie robi CO₂?
5. Skąd pochodzi dodatkowy CO₂?
6. Czy konkurencyjne przyczyny wyjaśniają obserwowany wzorzec?
7. Które wyjaśnienie najlepiej przechodzi test atrybucji?

Jeśli użytkownik ma trudność, system może wstawić pytanie naprawcze, ale nie pomija kolejnego ogniwa rdzenia.

NOWE METRYKI:
- „Trafność odpowiedzi” zamiast nadmiernie precyzyjnego „Wiedza”.
- Rozumowanie.
- Pokrycie rdzenia.
- Pewność profilu: niska / średnia / wysoka (dotyczy ilości danych o użytkowniku, nie pewności naukowej).

ŹRÓDŁA:
- źródła są powiązane z węzłami wiedzy,
- zawierają datę przeglądu w pakiecie,
- po odpowiedzi pokazuje się węzeł wiedzy i przypisane źródła.

ARCHITEKTURA:
- NDJSON.GZ pozostaje,
- 289 skompresowanych paczek,
- surowe rekordy po wzbogaceniu: 71.86 MB,
- GZIP razem: 1.78 MB,
- lokalny index.html automatycznie przełącza się na tryb offline,
- GitHub Pages pobiera paczki na żądanie i cache'uje je Service Workerem.

Liczba pytań:
- 0% = 18,
- 100% = 36,
- liniowo pomiędzy,
- zmiana poziomu w trakcie nie zmienia długości już rozpoczętej sesji.

Uruchomienie: rozpakuj i kliknij index.html.


NOWOŚCI CORE 2.1:
- planista grafu pilnuje ukończenia 7 obowiązkowych ogniw rdzenia przed końcem sesji,
- może wstawić maksymalnie jedno pytanie naprawcze między kolejnymi ogniwami rdzenia,
- po ukończeniu rdzenia dobiera pytania z uwzględnieniem:
  * słabych węzłów wiedzy,
  * słabych rodzin tematycznych,
  * powtarzalnych wzorców rozumowania,
  * poziomu trudności,
  * różnorodności i świeżości tematów,
- osobna pamięć nodeMastery dla kanonicznych węzłów wiedzy,
- wizualna mapa 7-etapowej ścieżki dowodu na ekranie pytania,
- podsumowanie pokazuje również najsłabsze węzły wiedzy.


POPRAWKA CORE 2.1.1:
- naprawiono obsługę przycisku „Sprawdź”,
- po kliknięciu natychmiast pojawia się „Sprawdzam odpowiedź…”,
- wynik jest wyświetlany zanim silnik spróbuje zapisać profil,
- błąd pamięci/profilu nie może już zablokować feedbacku,
- po analizie ekran automatycznie przewija się do wyniku,
- odpowiedzi są blokowane po sprawdzeniu i pojawia się wyraźne „Dalej →”,
- dodano obsługę błędu widoczną na stronie,
- ustawiono type="button" dla przycisków,
- poprawiono 9062 mylących komunikatów opcji „Żadne z powyższych”.

