# GlobOcie — automatyczne wydanie i publikacja

## Zasada zachowania plików

Nowy ZIP jest traktowany jako nakładka na poprzednią wersję repozytorium. Pliki, których nie ma w nowym ZIP-ie, pozostają w repozytorium i w pełnym wydaniu. Automat nie wykonuje usunięć.

Każde wydanie tworzy:

- `GlobOcie-vX.Y-DATA-FULL.zip` — pełny katalog strony,
- `GlobOcie-vX.Y-DATA-RELEASE.zip` — pełna strona w `GlobOcie/`, folder `CHANGES/` z samymi plikami dodanymi/zmienionymi oraz manifest,
- `releases/vX.Y-DATA/CHANGES/` — osobny folder zmian do szybkiego przeglądu.

## Jedno polecenie w Windows

Przeciągnij nowy pełny ZIP na `PUBLISH-GLOBOCIE.bat`. Skrypt:

1. odświeża `origin/main`,
2. pobiera poprzednią wersję jako bazę,
3. nakłada zawartość nowego ZIP-a bez kasowania starych plików,
4. wykrywa pliki dodane i zmienione przez SHA-256,
5. tworzy pełny ZIP, ZIP wydaniowy i `CHANGES/`,
6. synchronizuje repozytorium,
7. tworzy commit i wysyła go do `origin/main`.

Jeśli katalog nie jest klonem Git, przy pierwszym uruchomieniu skrypt automatycznie tworzy obok niego `.globocie-git` i pobiera repozytorium. Dzięki temu bieżący katalog może nadal służyć jako miejsce przechowywania ZIP-ów i plików roboczych.

Do wysłania potrzebne jest jednorazowo skonfigurowane uwierzytelnienie Git na tym komputerze, np. Git Credential Manager albo klucz SSH. Przy pierwszym `push` Git może otworzyć oficjalne logowanie GitHub. Hasła, tokeny i kody 2FA nigdy nie są wpisywane do skryptu ani rozmowy.

## Tryb kontroli bez publikacji

```text
node tools/globocie-release.mjs --zip "C:\sciezka\GlobOcie-v2.5-FULL.zip"
```

Tryb pełny:

```text
node tools/globocie-release.mjs --zip "C:\sciezka\GlobOcie-v2.5-FULL.zip" --sync --commit --publish
```

Wersja jest wykrywana z `APP_VERSION` lub nazwy pliku. Można wymusić ją przez `--version 2.5`.

## Kontrola po publikacji

Po udanym `push` trzeba sprawdzić deployment GitHub Pages oraz adres:

`https://cubilladam-maker.github.io/GlobOcie/`

W przypadku Service Workera należy potwierdzić, że identyfikator cache odpowiada nowej wersji i że odświeżenie wraca na ekran startowy. Sam automat nie usuwa starych zasobów; wersjonowanie adresów i cache pozostaje częścią kodu strony.
