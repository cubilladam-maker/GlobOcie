# Kod wyniku EL2 — GlobOcie v2.23

Kod widoczny na ekranie końcowym, w przeglądzie odpowiedzi i wydruku. Powstaje po 10 różnych pytaniach i 10 ważnych odpowiedziach tego samego poziomu. Przycisk kopiuje sam kod. Niepełny test nie daje kodu. PL/EN zachowuje wynik, poziom i kod.

To odwracalne kodowanie, nie szyfrowanie ani podpis. Ten sam poziom i wynik dają ten sam kod. CRC wykrywa błędy przepisywania, nie chroni przed fałszerstwem. Kod nie dowodzi tożsamości, samodzielności ani rzeczywistego ukończenia poza deklaracją aplikacji.

## Kodowanie

`n` = liczba poprawnych odpowiedzi 0–10, `d` = 0 Uczeń lub 1 Student.

```
P = (2<<12) | (1<<11) | (d<<10) | (n<<6) | (10<<2) | 1
X = P XOR 0x5A3C
K = ((X<<5) | (X>>>11)) & 0xFFFF
C = CRC8(K)
V = (K<<8) | C
kod = "EL2-" + Base32(V, 5 znaków)
```

P: bity 15–12 wersja 2; bit 11 ukończenie; bit 10 poziom; bity 9–6 poprawne; bity 5–2 liczba pytań; bity 1–0 temat 1. Base32: `0123456789ABCDEFGHJKMNPQRSTVWXYZ`, najstarszy znak pierwszy, dopełnienie zerami do 5 znaków. CRC8: wielomian 0x07, start 0, bajt starszy K potem młodszy, bez odbicia i końcowego XOR. Dla każdego bajtu c XOR bajt, następnie 8 razy `c=((c<<1) XOR ((c&128)?0x07:0))&255`, warunek przed przesunięciem.

## Dekodowanie

```
V = wartość pięciu znaków Base32 (maksymalnie 0xFFFFFF)
K = V>>>8; C = V&255; sprawdź CRC8(K)==C
X = ((K>>>5) | (K<<11)) & 0xFFFF
P = X XOR 0x5A3C
d = (P>>>10)&1; n = (P>>>6)&15
procent = 10*n
```

Sprawdź wersję 2 zgodną z prefiksem EL2, ukończenie, temat 1, liczbę pytań 10 i n≤10. EL1 nadal dekodowany wcześniejszym układem bitów: wersja 1, ukończenie bit 11, n bity 10–7, total bity 6–3, temat bity 2–0. Wszystkie EL1 dotyczą poziomu Student. Niezgodny prefiks/wersja odrzucany.

Dekoder: `node tools/decode-result-code.cjs KOD`. Zwraca procent, liczbę poprawnych, poziom `pupil`/`student` i deklarację ukończenia. Testy obejmują 22 nowe pary poziom/wynik, 11 historycznych EL1, niezależną kontrolę obrotu i CRC oraz wszystkie 3410 pojedynczych zmian znaku w nowych kodach.
