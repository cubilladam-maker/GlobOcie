# Kod wyniku EL1 — elektryczność

Decyzja 2026-10-05: wynik i krótki, czytelny kod na ekranie końcowym, przycisk Kopiuj kod; proste kodowanie przez operacje bitowe. Ta decyzja zastępuje wcześniejszy pomysł chronionego rejestru serwerowego. Nie wymaga serwera ani prywatnego klucza.

Kod powstaje w interfejsie dopiero po dziesięciu poprawnie zapisanych odpowiedziach na dziesięć różnych pytań. Wynik 8/10 = 80% daje **EL1-CVA2N**. Ten sam wynik daje ten sam kod, również po przełączeniu języka. Kod nie identyfikuje osoby, sesji ani daty. EL1 dotyczy wyłącznie obecnego dziesięciopytaniowego testu elektrycznego; przy zmianie schematu/interpretacji użyć nowego formatu, zachowując stary dekoder.

Jest to kodowanie odwracalne, nie szyfrowanie, podpis ani bezpieczny dowód ukończenia. Osoba znająca algorytm może wygenerować dowolny poprawny kod. Znacznik ukończenia jest informacją zakodowaną przez aplikację, a nie niezależnym poświadczeniem. Nie potwierdza tożsamości ani samodzielności. Kod nie jest tajny. Suma kontrolna wykrywa błędy przepisywania; nie chroni przed celową podmianą.

## Kodowanie

1. `n` = liczba poprawnych odpowiedzi, całkowita 0–10. Wymagane 10/10 odpowiedzi.
2. Złóż 16-bitowe dane: `P = (1<<12) | (1<<11) | (n<<7) | (10<<3) | 1`.
   Bity 15–12: wersja 1; bit 11: ukończony; bity 10–7: n; bity 6–3: 10; bity 2–0: temat 1.
3. `X = P XOR 0x5A3C`.
4. Obróć 16 bitów w lewo o 5: `K = ((X<<5) | (X>>>11)) & 0xFFFF`.
5. `C = CRC8(K)`; bajt starszy, potem młodszy; wielomian 0x07, start 0, bez odbicia, bez końcowego XOR.
6. `V = (K<<8) | C`. Zapisz V w pięciu znakach Base32, od najstarszej cyfry, dopełniając zerami. Alfabet: `0123456789ABCDEFGHJKMNPQRSTVWXYZ`. Dodaj prefiks `EL1-`.

CRC8: ustaw c=0; dla każdego z dwóch bajtów b wykonaj c=c XOR b, potem osiem razy `c=((c<<1) XOR (0x07 jeśli c&0x80, inaczej 0)) & 0xFF`. Warunek bada wartość c przed przesunięciem.

## Dekodowanie

1. Usuń białe znaki z początku/końca, zmień litery na wielkie. Sprawdź prefiks EL1- i dokładnie pięć znaków alfabetu.
2. Odczytaj Base32: `V=0`; dla każdego znaku `V=V*32 + indeks_znaku`. Wymagaj `V<=0xFFFFFF`.
3. `K=V>>>8`, `C=V&255`; wymagaj `CRC8(K)==C`.
4. Obróć K w prawo o 5: `X=((K>>>5)|(K<<11))&0xFFFF`.
5. `P=X XOR 0x5A3C`.
6. Odczytaj i sprawdź: wersja `P>>>12 == 1`; ukończenie `(P&0x0800)!=0`; temat `(P&7)==1`; total `(P>>>3)&15 == 10`; n `(P>>>7)&15` w zakresie 0–10. Wynik = `n*10%`.

Dekoder dla organizatora/AI-cji: `node tools/decode-result-code.cjs EL1-CVA2N`. Brak ekranu dekodera w quizie, ale publiczny kod źródłowy nie jest sekretem.

## Interfejs i testy

PL/EN obejmuje etykiety, instrukcję, ograniczenia i komunikaty kopiowania. Sukces kopiowania wyświetlany dopiero po udanym zapisie do schowka. Gdy schowek niedostępny, pole zostaje zaznaczone do ręcznego kopiowania. Kod widoczny także w rozwiązaniach i wydruku; powtórzenie testu zeruje komunikat kopiowania. Nie wysyła się wyniku do serwera.

Testy: wszystkie 11 wyników, niezależne obliczenia obrotu i CRC, wszystkie 1705 pojedynczych zmian znaku, błędne dane, niepełny quiz, blokada Student, kopiowanie z sukcesem i błędem, przełączanie PL/EN, telefon, powrót oraz dotychczasowe moduły.
