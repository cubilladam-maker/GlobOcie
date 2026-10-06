# Kod wyniku EL3 — GlobOcie v2.27

Wynik zawiera procent poprawnych odpowiedzi oraz wybrany poziom. Nie stosuje mnożnika: wyniki różnych poziomów nie są równoważne.

Poziomy: 0 = Absolwent podstawówki, 1 = Maturzysta, 2 = Licencjat / inżynier. Angielskie nazwy opisują poziom wykształcenia; nie zakładają identycznych systemów szkolnych.

Kod jest odwracalnym zapisem, nie szyfrowaniem, podpisem ani dowodem tożsamości lub samodzielności. CRC wykrywa literówki, nie celowe fałszerstwo. Ten sam wynik i poziom dają ten sam kod.

## Kodowanie

Dla 10 ukończonych pytań, n poprawnych odpowiedzi i poziomu d:

```
payload = (3 << 12) | (1 << 11) | (d << 9) | (n << 5) | (10 << 1) | 1
word = ROL16(payload XOR 0x5A3C, 5)
packed = (word << 8) | CRC8(word)
kod = "EL3-" + Base32(packed, 5 znaków)
```

Bity: 15–12 wersja 3, 11 ukończenie, 10–9 poziom, 8–5 poprawne odpowiedzi, 4–1 liczba pytań, 0 temat elektryczności. CRC8: wielomian 0x07, początkowo 0; starszy bajt word przed młodszym. Alfabet Base32: 0123456789ABCDEFGHJKMNPQRSTVWXYZ.

## Dekodowanie

Odczytaj pięć znaków Base32, sprawdź CRC, obróć word o 5 bitów w prawo i wykonaj XOR 0x5A3C. Sprawdź zgodność prefiksu z wersją, ukończenie, temat, 10 pytań, poziom 0–2 i liczbę poprawnych 0–10. Procent = n × 10.

`node tools/decode-result-code.cjs KOD` zwraca poziom i wynik. EL1 i EL2 nadal są dekodowane według historycznego układu bitów. EL1 oznacza dawny Student. EL2 oznacza dawny Uczeń (0) albo Student (1); stare kody nie otrzymują nowej interpretacji Maturzysta. EL3 używa nowych trzech poziomów.
