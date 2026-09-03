# Prywatny licznik unikalnych przeglądarek

Frontend licznika jest gotowy. Działa w trybie lokalnym bez połączenia i po podaniu adresu endpointu korzysta z Cloudflare Worker + D1. Wartość mieszka poza plikami strony, więc nie znika przy kolejnych wersjach kodu.

## Jednorazowe uruchomienie

1. Utwórz bezpłatną bazę D1 `globocie-visitors` i wykonaj `schema.sql`.
2. Skopiuj `wrangler.toml.example` jako `wrangler.toml`, wstaw identyfikator bazy i pozostaw dozwoloną domenę GitHub Pages.
3. Ustaw dwa sekrety Workera: `OWNER_KEY` (co najmniej 20 znaków) oraz `HASH_PEPPER` (losowy, długi ciąg). Sekretów nie zapisuj w repozytorium.
4. Wdróż Worker, a jego adres wpisz jako `endpoint` w `visitor-counter-config.js`.
5. W swoim Chrome kliknij niewidoczny obszar 28×28 px w samym prawym górnym rogu. Za pierwszym razem podaj `OWNER_KEY`. Przeglądarka zapamięta tryb właściciela lokalnie.

## Zasady działania

- liczona jest jedna losowo oznaczona przeglądarka, a nie każde wejście;
- identyfikatory trafiają do D1 wyłącznie jako skróty SHA-256 z tajnym `HASH_PEPPER`;
- przeglądarka właściciela jest wykluczana i usuwana z licznika;
- odczyt wartości wymaga sekretu właściciela;
- pojedynczy adres sieciowy może dopisać maksymalnie pięć nowych identyfikatorów dziennie, co ogranicza proste sztuczne nabijanie;
- D1 można eksportować do SQL przed większą migracją lub zmianą usługi.

Bezpłatny plan D1 ma limity wielokrotnie większe niż potrzeby małej strony; aktualne limity należy sprawdzić przed wdrożeniem w dokumentacji Cloudflare.
