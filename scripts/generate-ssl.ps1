# Generate self-signed TLS certificate for staging/local HTTPS testing.
# Production should use a valid certificate from Let's Encrypt or your CA.

param(
    [string]$OutputDir = "ssl",
    [int]$DaysValid = 365
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$certPath = Join-Path $OutputDir "nginx.crt"
$keyPath = Join-Path $OutputDir "nginx.key"

if (Test-Path $certPath) {
    Write-Host "Certificate already exists at $certPath — skipping."
    exit 0
}

Write-Host "Generating self-signed certificate ($DaysValid days)..."

$cert = New-SelfSignedCertificate `
    -DnsName "ticketing-bpt.komdigi.go.id", "localhost" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddDays($DaysValid) `
    -KeyExportPolicy Exportable `
    -KeySpec Signature

$thumbprint = $cert.Thumbprint
$pfxPath = Join-Path $env:TEMP "ticketing-ssl.pfx"
$pfxPassword = ConvertTo-SecureString -String "temp-ssl-pass" -Force -AsPlainText

Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$thumbprint" -FilePath $pfxPath -Password $pfxPassword | Out-Null

# Convert PFX to PEM using OpenSSL if available, otherwise instruct user
$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if ($openssl) {
    & openssl pkcs12 -in $pfxPath -out $certPath -clcerts -nokeys -passin pass:temp-ssl-pass
    & openssl pkcs12 -in $pfxPath -out $keyPath -nocerts -nodes -passin pass:temp-ssl-pass
    Remove-Item $pfxPath -Force
    Remove-Item "Cert:\CurrentUser\My\$thumbprint" -Force
    Write-Host "Created: $certPath and $keyPath"
} else {
    Write-Warning "OpenSSL not found. Install OpenSSL or place valid nginx.crt/nginx.key manually in ./ssl/"
    Write-Host "PFX exported to: $pfxPath (convert manually)"
}
