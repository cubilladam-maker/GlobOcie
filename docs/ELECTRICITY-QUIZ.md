# Wiedza z zakresu elektryczności — v2.20

Nowy temat `electricity-knowledge`: autorski test na poziomie III roku elektrotechniki, bez deklarowania zgodności z programem konkretnej uczelni. 30 pytań = 10 rodzajów zadań po 3 warianty liczbowe. Sesja losuje po jednym wariancie z każdego rodzaju: 10 pytań, 4 odpowiedzi, jedna poprawna. 1 punkt za poprawną odpowiedź, 0 za błędną; wynik procentowy = poprawne / pytania × 100%. Kalkulator i podpowiedzi ze wzorami są dozwolone. Wynik nie certyfikuje kwalifikacji zawodowych.

Suwak trudności zablokowany na indeksie 1 („Student”) na starcie, podczas pytań i przy ponownym rozpoczęciu. Po przejściu do innych tematów przywracany jest ich zapamiętany poziom. Nowy temat nie używa osi przekonań ani wskaźnika „spójności” do oceny wiedzy. PL/EN zachowuje identyfikatory odpowiedzi i postęp. Liczniki zachowują wcześniejsze klucze.

Zakres: obwody AC, rezonans RLC, gwiazda trójfazowa, kompensacja mocy biernej, harmoniczne i PF, poślizg, bilans mocy silnika indukcyjnego, maksimum sprawności transformatora, buck CCM, zespolone dopasowanie Thévenina. Modele idealne/uproszczone i wyłączenia strat są wymienione w pytaniach. RMS oznacza wartość skuteczną, ΔIL — tętnienia od minimum do maksimum. Źródła dotyczą zasad teoretycznych; dane liczbowe są autorskimi danymi ćwiczeniowymi.

Pliki: `topics/electricity-student.json` (czytelny bank PL/EN), `.quiz.gz` (pakiet do pobrania przez aplikację), `.quiz.gz.js` (identyczna osadzona kopia awaryjna). Generator: `python tools/build-electricity-topic.py`.

Weryfikacja: `node tests/electricity-bank.test.js` niezależnie przelicza wszystkie 30 kluczy, w tym całkuje przebiegi dla harmonicznych i sprawdza lokalne maksimum sprawności/dopasowania. `node tests/electricity-flow.test.js` sprawdza dekodowanie gzip, 30 pytań/hintów w obu językach, 50 losowań, blokadę poziomu, przywracanie poziomu innych tematów, odrzucanie błędnego ID i podwójnego kliknięcia, wyniki 0/50/100%, rozwiązania i powrót na start. Istniejące testy motywów i renderowania pozostają wymagane. Testy VM sprawdzają logikę i generowany HTML; nie zastępują oględzin w przeglądarce.

Źródła podane również na ekranie wyników: MIT AC circuits, MIT 6.061 Polyphase Networks i Induction Machines, MIT Maximum Power Transfer, IIT Madras/NPTEL Transformer Efficiency, Texas Instruments Power Factor i Basic Calculation of a Buck Converter Power Stage. Dokładne adresy są w pakiecie JSON.
