# Wiedza z zakresu elektryczności — v2.23

Suwak obejmuje dwa poziomy: Uczeń (indeks 0, podstawy elektryczności) i Student (indeks 1, autorski zakres III roku elektrotechniki). Nie jest deklaracją zgodności z programem konkretnej uczelni. Inne tematy zachowują własną skalę i ustawienia. Elektryczność ma osobny klucz `globocie-electricity-difficulty`; domyślnie Student. Zmiana poziomu w trakcie testu wymaga potwierdzenia rozpoczęcia nowego zestawu i zeruje odpowiedzi. Anulowanie zachowuje pytania, odpowiedzi i poziom.

Bank: 60 pytań PL/EN, po 30 na poziom, po 10 działów × 3 warianty liczbowe. Sesja losuje jedno pytanie z każdego działu wybranego poziomu, łącznie 10. Każde pytanie ma cztery odpowiedzi, podpowiedź i rozwiązanie. Wynik = poprawne/10 × 100%, bez mnożnika za poziom. Wynik końcowy i przegląd rozwiązań podają poziom; 80% Uczeń nie jest równoważne 80% Student. Brak danych do skalowania między poziomami. Kalkulator i podpowiedzi dozwolone. Wynik nie certyfikuje kwalifikacji zawodowych.

Uczeń: prawo Ohma, rezystory szeregowe i równoległe, moc, energia, bilans prądów, ładunek, pojemność, okres sinusoidy i straty I²R. Student: obwody AC, rezonans RLC, gwiazda trójfazowa, kompensacja, harmoniczne i PF, poślizg, bilans silnika, maksimum sprawności transformatora, buck CCM i dopasowanie zespolone.

Źródła podstaw teoretycznych: OpenStax University Physics Volume 2 dla podstaw; MIT, NPTEL i Texas Instruments dla poziomu studenckiego. Liczby ćwiczeniowe są autorskie. Adresy w JSON; modele i jednostki jawne w pytaniach.

Generator obu poziomów: `python tools/build-electricity-topic.py`. Czytelny bank `topics/electricity-student.json`; gzip i identyczna kopia osadzona JS. Test banku niezależnie przelicza wszystkie 60 kluczy; test przepływu sprawdza losowanie, poziomy, punktację, języki i kopiowanie. Liczniki zachowują dotychczasowe klucze.

Kod wyniku EL2 zawiera poziom, wynik i deklarację ukończenia. Dekoder nadal przyjmuje stare EL1, zawsze jako Student. Szczegóły: `docs/RESULT-CODES.md`. To proste kodowanie, nie podpis ani dowód autentycznego ukończenia.
