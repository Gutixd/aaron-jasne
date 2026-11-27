@echo off
rem Levanta la invitacion en http://localhost:4410 y la abre en el navegador.
rem Cierra esta ventana para apagarla.
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias, solo la primera vez...
  call npm install
)
call npm run dev
