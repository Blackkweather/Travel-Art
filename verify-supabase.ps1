# ============================================
# SUPABASE MCP CONNECTION VERIFICATION SCRIPT
# ============================================
# This script tests your Supabase connection and configuration
# Run with: .\verify-supabase.ps1

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "SUPABASE CONNECTION VERIFICATION" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Load environment variables from backend/.env
if (Test-Path "backend\.env") {
    Write-Host "[1/6] Loading environment variables..." -ForegroundColor Yellow
    Get-Content "backend\.env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
    Write-Host "   OK Environment variables loaded`n" -ForegroundColor Green
} else {
    Write-Host "   ERROR backend/.env not found!`n" -ForegroundColor Red
    exit 1
}

# Check required variables
Write-Host "[2/6] Checking required environment variables..." -ForegroundColor Yellow
$required = @('SUPABASE_PROJECT_REF', 'SUPABASE_DB_PASSWORD', 'SUPABASE_REGION', 'DATABASE_URL')
$missing = @()

foreach ($var in $required) {
    $value = [Environment]::GetEnvironmentVariable($var, 'Process')
    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "   ERROR Missing: $var" -ForegroundColor Red
        $missing += $var
    } else {
        if ($var -eq 'SUPABASE_DB_PASSWORD') {
            Write-Host "   OK $var = ****" -ForegroundColor Green
        } else {
            Write-Host "   OK $var = $value" -ForegroundColor Green
        }
    }
}

if ($missing.Count -gt 0) {
    Write-Host "`n   ERROR: Missing required variables!`n" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verify connection string format
Write-Host "[3/6] Verifying connection string format..." -ForegroundColor Yellow
$dbUrl = [Environment]::GetEnvironmentVariable('DATABASE_URL', 'Process')
if ($dbUrl -match 'pooler\.supabase\.com:(\d+)') {
    $port = $matches[1]
    if ($port -eq '6543') {
        Write-Host "   OK Using Transaction Pooler (Port 6543) - RECOMMENDED" -ForegroundColor Green
    } elseif ($port -eq '5432') {
        Write-Host "   WARNING Using Session Pooler (Port 5432) - OK but slower" -ForegroundColor Yellow
    } else {
        Write-Host "   ERROR Unknown port: $port" -ForegroundColor Red
    }
} else {
    Write-Host "   ERROR Invalid connection string format" -ForegroundColor Red
}
Write-Host ""

# Check password encoding
Write-Host "[4/6] Checking password encoding..." -ForegroundColor Yellow
$password = [Environment]::GetEnvironmentVariable('SUPABASE_DB_PASSWORD', 'Process')
if ($password -match '%') {
    Write-Host "   OK Password is URL-encoded (contains %)" -ForegroundColor Green
} else {
    if ($password -match '[;@:/]') {
        Write-Host "   WARNING Password contains special characters but is NOT URL-encoded!" -ForegroundColor Yellow
        Write-Host "     Encode: ; = %3B, @ = %40, : = %3A, / = %2F" -ForegroundColor Yellow
    } else {
        Write-Host "   OK Password appears safe (no special characters)" -ForegroundColor Green
    }
}
Write-Host ""

# Security check
Write-Host "[5/6] Security audit..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $gitStatus = git status --porcelain .env 2>$null
    if ($gitStatus) {
        Write-Host "   WARNING: .env file is tracked by git!" -ForegroundColor Red
        Write-Host "     Run: git rm --cached .env" -ForegroundColor Yellow
    } else {
        Write-Host "   OK .env is not tracked by git" -ForegroundColor Green
    }
} else {
    Write-Host "   WARNING No .env file found in root" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "[6/6] Connection test summary..." -ForegroundColor Yellow
Write-Host "   To test the actual database connection, run:" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor White
Write-Host "   npx prisma db pull" -ForegroundColor White
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

