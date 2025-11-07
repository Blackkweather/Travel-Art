# Stop all node processes and free ports
Write-Host "Stopping all Node.js processes..."
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Freeing ports 3000, 3001, 3002, 4000..."
Get-NetTCPConnection -LocalPort 3000,3001,3002,4000 -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    } catch {}
}

Start-Sleep -Seconds 2

Write-Host "Checking remaining processes..."
$remaining = (Get-Process | Where-Object {$_.ProcessName -eq "node"} | Measure-Object).Count
Write-Host "Remaining Node processes: $remaining"

if ($remaining -eq 0) {
    Write-Host "✅ All processes stopped successfully!"
} else {
    Write-Host "⚠️  Some processes may still be running"
}

