# Gera o site protegido em _site e abre em http://localhost:8080 para testar o login.
# Uso (PowerShell, na pasta landingpages):  .\scripts\testar-login.ps1
# Pare o servidor com Ctrl+C.

$usuario = Read-Host "Usuário"
$senha = Read-Host "Senha" -AsSecureString
$env:SITE_USER = $usuario
$env:SITE_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha))

node scripts/protect.mjs _site
Remove-Item Env:SITE_PASSWORD, Env:SITE_USER
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Start-Process "http://localhost:8080/"
python -m http.server 8080 --directory _site
