# Script d'installation du raccourci Merise - EPSI Edition
$ws = New-Object -ComObject WScript.Shell
$appDir = Join-Path $env:LOCALAPPDATA 'Merise-EPSI'
if (-not (Test-Path $appDir)) { New-Item -ItemType Directory -Path $appDir -Force | Out-Null }
$iconFile = Join-Path $appDir 'favicon.ico'
try {
  Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Math087a/meriz-epsi/main/public/favicon.ico' -OutFile $iconFile -UseBasicParsing
} catch {}

$browserPaths = @(
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
)
$browser = $browserPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { $browser = 'msedge.exe' }
$url = 'https://math087a.github.io/meriz-epsi/'

$desktop = [Environment]::GetFolderPath('Desktop')
$programs = [Environment]::GetFolderPath('Programs')

# Raccourci Bureau
$scDesktop = $ws.CreateShortcut((Join-Path $desktop 'Merise EPSI Edition.lnk'))
$scDesktop.TargetPath = $browser
$scDesktop.Arguments = "--app=$url"
if (Test-Path $iconFile) { $scDesktop.IconLocation = "$iconFile,0" }
$scDesktop.Description = 'Merise EPSI Edition'
$scDesktop.Save()

# Raccourci Menu Demarrer
$scPrograms = $ws.CreateShortcut((Join-Path $programs 'Merise EPSI Edition.lnk'))
$scPrograms.TargetPath = $browser
$scPrograms.Arguments = "--app=$url"
if (Test-Path $iconFile) { $scPrograms.IconLocation = "$iconFile,0" }
$scPrograms.Description = 'Merise EPSI Edition'
$scPrograms.Save()

Write-Host "Installation terminee avec succes !" -ForegroundColor Green
Write-Host "Raccourci ajoute sur le Bureau et dans le Menu Demarrer." -ForegroundColor Cyan
Write-Host "Astuce : Clic droit sur l icone dans la barre des taches -> Epingler a la barre des taches." -ForegroundColor Yellow
Start-Process -FilePath $browser -ArgumentList "--app=$url"