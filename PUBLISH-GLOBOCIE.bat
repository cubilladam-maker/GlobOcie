@echo off
setlocal

if "%~1"=="" (
  echo Przeciagnij nowy pelny ZIP GlobOcie na ten plik .bat.
  echo Przyklad: PUBLISH-GLOBOCIE.bat GlobOcie-v2.5-FULL.zip
  pause
  exit /b 2
)

where node >nul 2>&1
if errorlevel 1 (
  echo Nie znaleziono Node.js. Zainstaluj Node.js LTS i uruchom ponownie.
  pause
  exit /b 3
)

where git >nul 2>&1
if errorlevel 1 (
  echo Nie znaleziono Git. Zainstaluj Git for Windows i uruchom ponownie.
  pause
  exit /b 4
)

set "SOURCE_DIR=%~dp0."
set "REPO_DIR=%~dp0.globocie-git"
if exist "%~dp0.git\HEAD" set "REPO_DIR=%~dp0."

if not exist "%REPO_DIR%\.git\HEAD" (
  echo Pierwsze uruchomienie: pobieram poprzednia wersje repozytorium...
  git clone https://github.com/cubilladam-maker/GlobOcie.git "%REPO_DIR%"
  if errorlevel 1 (
    echo Nie udalo sie pobrac repozytorium.
    pause
    exit /b 5
  )
)

node "%~dp0tools\globocie-release.mjs" --repo "%REPO_DIR%" --zip "%~1" --out "%~dp0releases" --sync --commit --publish
if errorlevel 1 (
  echo.
  echo Publikacja nie zostala zakonczona. Sprawdz komunikat powyzej.
  pause
  exit /b 1
)

echo.
echo Publikacja zakonczona. Pliki wydania sa w katalogu releases.
pause
