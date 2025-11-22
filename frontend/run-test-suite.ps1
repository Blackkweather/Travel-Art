# PowerShell script to run specific Cypress test suite
# Usage: .\run-test-suite.ps1 auth
# Usage: .\run-test-suite.ps1 booking
# Usage: .\run-test-suite.ps1 accessibility

param(
    [Parameter(Mandatory=$true)]
    [string]$Suite
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RUNNING TEST SUITE: $Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the frontend directory
if (-not (Test-Path "cypress")) {
    Write-Host "Error: Must run from frontend directory" -ForegroundColor Red
    exit 1
}

# Map suite names to test files
$testFiles = @{
    "auth" = "cypress/e2e/auth.cy.ts"
    "booking" = "cypress/e2e/booking.cy.ts"
    "accessibility" = "cypress/e2e/accessibility.cy.ts"
    "responsive" = "cypress/e2e/responsive.cy.ts"
    "api" = "cypress/e2e/api.cy.ts"
    "security" = "cypress/e2e/security.cy.ts"
    "performance" = "cypress/e2e/performance.cy.ts"
    "ui-consistency" = "cypress/e2e/ui-consistency.cy.ts"
}

if (-not $testFiles.ContainsKey($Suite)) {
    Write-Host "Error: Unknown test suite: $Suite" -ForegroundColor Red
    Write-Host "Available suites: $($testFiles.Keys -join ', ')" -ForegroundColor Yellow
    exit 1
}

$testFile = $testFiles[$Suite]

Write-Host "Running: $testFile" -ForegroundColor Yellow
Write-Host ""

npx cypress run --spec $testFile

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST SUITE COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

