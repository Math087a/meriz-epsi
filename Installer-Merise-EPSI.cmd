@echo off
title Installation de Merise EPSI Edition
if exist "%~dp0install.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Math087a/meriz-epsi/main/install.ps1 | iex"
)
pause