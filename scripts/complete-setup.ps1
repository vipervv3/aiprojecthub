# Complete Automated Setup Script
# This will download GitHub CLI, authenticate, and set up secrets

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete GitHub + Vercel Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI exists
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    Write-Host "GitHub CLI not found. Let's install it..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try winget first (most reliable)
    Write-Host "Attempting to install via winget..." -ForegroundColor Cyan
    try {
        winget install --id GitHub.cli --silent --accept-package-agreements --accept-source-agreements 2>&1 | Out-Null
        Start-Sleep -Seconds 3
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        $ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
        if ($ghInstalled) {
            Write-Host "[OK] GitHub CLI installed successfully!" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Winget installation failed. You may need to run PowerShell as Administrator." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please install GitHub CLI manually:" -ForegroundColor Yellow
        Write-Host "1. Download from: https://cli.github.com/" -ForegroundColor White
        Write-Host "2. Or run: winget install --id GitHub.cli" -ForegroundColor White
        Write-Host ""
        exit 1
    }
}

if (-not $ghInstalled) {
    Write-Host "[ERROR] GitHub CLI installation failed. Please install manually." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] GitHub CLI found!" -ForegroundColor Green
Write-Host ""

# Check authentication
Write-Host "Checking GitHub authentication..." -ForegroundColor Cyan
$authCheck = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not authenticated. Starting authentication..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "A browser window will open for GitHub authentication." -ForegroundColor Cyan
    Write-Host "Please follow the prompts to authorize." -ForegroundColor Cyan
    Write-Host ""
    
    gh auth login --web --hostname github.com
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Authentication failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[OK] Authenticated successfully!" -ForegroundColor Green
} else {
    Write-Host "[OK] Already authenticated!" -ForegroundColor Green
}

Write-Host ""

# Get CRON_SECRET from user
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Get CRON_SECRET from Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vercel encrypts secrets, so we need to get it manually:" -ForegroundColor Yellow
Write-Host "1. Open: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Click 'aiprojecthub' project" -ForegroundColor White
Write-Host "3. Go to Settings → Environment Variables" -ForegroundColor White
Write-Host "4. Find 'CRON_SECRET' and click the eye icon to reveal it" -ForegroundColor White
Write-Host ""
Write-Host "Or, if you know the value, you can enter it directly." -ForegroundColor Cyan
Write-Host ""

$cronSecret = Read-Host "Enter CRON_SECRET (or press Enter to open Vercel dashboard)" -AsSecureString
$cronSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($cronSecret)
)

if ([string]::IsNullOrWhiteSpace($cronSecretPlain)) {
    Write-Host ""
    Write-Host "Opening Vercel dashboard..." -ForegroundColor Cyan
    Start-Process "https://vercel.com/dashboard"
    Write-Host ""
    $cronSecret = Read-Host "Now enter CRON_SECRET" -AsSecureString
    $cronSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($cronSecret)
    )
}

if ([string]::IsNullOrWhiteSpace($cronSecretPlain)) {
    Write-Host "[ERROR] CRON_SECRET is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Set VERCEL_APP_URL
$vercelUrl = "https://aiprojecthub.vercel.app"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Setting GitHub Secrets" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Setting CRON_SECRET..." -ForegroundColor Yellow
echo $cronSecretPlain | gh secret set CRON_SECRET

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to set CRON_SECRET" -ForegroundColor Red
    Write-Host "Make sure you have write access to the repository." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] CRON_SECRET set!" -ForegroundColor Green
Write-Host ""

Write-Host "Setting VERCEL_APP_URL..." -ForegroundColor Yellow
echo $vercelUrl | gh secret set VERCEL_APP_URL

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to set VERCEL_APP_URL" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] VERCEL_APP_URL set!" -ForegroundColor Green
Write-Host ""

# Test the workflow
Write-Host "========================================" -ForegroundColor Green
Write-Host "[OK] Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Secrets configured:" -ForegroundColor Cyan
Write-Host "  [OK] CRON_SECRET" -ForegroundColor Green
Write-Host "  [OK] VERCEL_APP_URL = $vercelUrl" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test the workflow:" -ForegroundColor Yellow
Write-Host "   https://github.com/vipervv3/aiprojecthub/actions" -ForegroundColor White
Write-Host "   Click 'Notification Reminders' → 'Run workflow'" -ForegroundColor White
Write-Host ""
Write-Host "2. The workflow will run automatically every hour!" -ForegroundColor Green
Write-Host ""

# Ask if user wants to test now
$testNow = Read-Host "Would you like to test the workflow now? (y/n)"
if ($testNow -eq "y" -or $testNow -eq "Y") {
    Write-Host ""
    Write-Host "Opening GitHub Actions..." -ForegroundColor Cyan
    Start-Process "https://github.com/vipervv3/aiprojecthub/actions"
}

Write-Host ""
Write-Host "All done! Your notification system is ready!" -ForegroundColor Green

