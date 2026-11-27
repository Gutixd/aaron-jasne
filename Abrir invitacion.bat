@echo off
rem Levanta la invitacion en http://localhost:4410 y la abre en el navegador.
rem El panel queda en http://localhost:4410/panel/ (clave en CLAVE-PANEL.txt).
rem Cierra esta ventana para apagarla.
cd /d "%~dp0"

set "PHP=php"
where php >nul 2>nul || set "PHP=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
set "PHPEXT=-d extension_dir="%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.NTS.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\ext" -d extension=pdo_sqlite -d extension=mbstring -d extension=fileinfo -d extension=zip"

if not exist servidor\config.local.php "%PHP%" %PHPEXT% servidor\preparar-local.php

if not exist node_modules (
  echo Instalando dependencias, solo la primera vez...
  call npm install
)

start "API PHP (no cerrar)" /min "%PHP%" %PHPEXT% -S localhost:4411 -t public servidor\router-local.php
call npm run dev
