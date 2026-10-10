$sitePath = 'C:\Users\Baps\Downloads\rajan backup\organized\site'
$port = 8080

# Kill any existing server on port 8080
Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Stop-Process -Force

# Start Python HTTP server in background
$process = Start-Process -FilePath 'python' -ArgumentList "-m http.server $port --directory `"$sitePath`"" -WindowStyle Hidden -PassThru

Write-Host "Server starting at http://localhost:$port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Stop-Process -Id $process.Id -Force
}
