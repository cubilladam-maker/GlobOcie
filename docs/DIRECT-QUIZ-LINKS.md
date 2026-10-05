# Bezpośrednie wejście do quizu — v2.21

Adres: `https://cubilladam-maker.github.io/GlobOcie/?quiz=IDENTYFIKATOR&lang=pl`.

Obsługiwane identyfikatory aktywnych tematów:

- `electricity-knowledge` — Wiedza z zakresu elektryczności;
- `political-compass` — Kompas polityczny;
- `religion-worldview` — Religia/światopogląd;
- `global-warming` — Globalne ocieplenie.

`lang=pl` lub `lang=en` jawnie ustawia język; bez tego parametru obowiązuje zapamiętany język (domyślnie PL). Parametr języka działa również bez `quiz`. Nieznany identyfikator tematu otwiera zwykły ekran startowy; nie jest traktowany jako adres zewnętrznego pakietu.

Poprawny identyfikator automatycznie ładuje pakiet i rozpoczyna nową sesję od pierwszego pytania, pomijając ekran wyboru. Odświeżenie takiego linku rozpoczyna nową sesję; nie jest to link do wznowienia odpowiedzi. Każde rzeczywiste rozpoczęcie powiększa istniejący lokalny licznik startów raz. Elektryczność zachowuje zablokowany poziom Student; pozostałe tematy używają zapamiętanego poziomu.

Potwierdzony powrót do wyboru tematów usuwa `quiz` z adresu (pozostawiając język i inne parametry), aby odświeżenie ekranu startowego nie uruchamiało ponownie quizu. Anulowanie powrotu nie zmienia adresu ani odpowiedzi. Przełącznik PL/EN podczas quizu zachowuje odpowiedzi i postęp. Zwykły adres bez parametrów nadal otwiera wybór tematów.
