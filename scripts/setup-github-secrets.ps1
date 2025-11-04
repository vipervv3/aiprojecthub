# GitHub Secrets Setup Script
# This script helps you set up GitHub secrets for the notification workflow

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Secrets Setup Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    Write-Host "⚠️  GitHub CLI (gh) is not installed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You have two options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install GitHub CLI (Recommended)" -ForegroundColor Green
    Write-Host "  Run: winget install --id GitHub.cli" -ForegroundColor White
    Write-Host "  Then run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Manual Setup" -ForegroundColor Green
    Write-Host "  Follow the instructions in: scripts/setup-github-secrets.md" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ GitHub CLI found!" -ForegroundColor Green
Write-Host ""

# Check if authenticated
Write-Host "Checking GitHub authentication..." -ForegroundColor Cyan
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with GitHub." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please authenticate first:" -ForegroundColor Yellow
    Write-Host "  Run: gh auth login" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Authenticated with GitHub!" -ForegroundColor Green
Write-Host ""

# Get CRON_SECRET from Vercel
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Get CRON_SECRET from Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor Yellow
Write-Host "2. Select your 'aiprojecthub' project" -ForegroundColor Yellow
Write-Host "3. Go to Settings → Environment Variables" -ForegroundColor Yellow
Write-Host "4. Find CRON_SECRET and click the eye icon to reveal it" -ForegroundColor Yellow
Write-Host ""
$cronSecret = Read-Host "Enter your CRON_SECRET from Vercel"

if ([string]::IsNullOrWhiteSpace($cronSecret)) {
    Write-Host "❌ CRON_SECRET cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Set VERCEL_APP_URL
$vercelUrl = "https://aiprojecthub.vercel.app"
Write-Host "Vercel URL: $vercelUrl" -ForegroundColor Green
Write-Host ""

# Confirm
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to set secrets:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CRON_SECRET: [Hidden for security]" -ForegroundColor White
Write-Host "VERCEL_APP_URL: $vercelUrl" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Proceed with setting these secrets? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Setting secrets..." -ForegroundColor Cyan

# Set CRON_SECRET
Write-Host "Setting CRON_SECRET..." -ForegroundColor Yellow
gh secret set CRON_SECRET --body $cronSecret 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CRON_SECRET set successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set CRON_SECRET" -ForegroundColor Red
    exit 1
}

# Set VERCEL_APP_URL
Write-Host "Setting VERCEL_APP_URL..." -ForegroundColor Yellow
gh secret set VERCEL_APP_URL --body $vercelUrl 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VERCEL_APP_URL set successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set VERCEL_APP_URL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ All secrets set successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/vipervv3/aiprojecthub/actions" -ForegroundColor White
Write-Host "2. Click 'Notification Reminders' workflow" -ForegroundColor White
Write-Host "3. Click 'Run workflow' to test it" -ForegroundColor White
Write-Host ""
Write-Host "The workflow will run automatically every hour! 🎉" -ForegroundColor Green



