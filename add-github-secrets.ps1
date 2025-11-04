# GitHub Secrets Setup Script
# Adds CRON_SECRET and VERCEL_APP_URL to GitHub repository

Write-Host ""
Write-Host "GitHub Secrets Setup for Automated Notifications" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Check if GitHub CLI is installed
Write-Host "Checking for GitHub CLI..." -ForegroundColor Yellow
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    Write-Host "ERROR: GitHub CLI (gh) is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install with: winget install --id GitHub.cli" -ForegroundColor Yellow
    Write-Host "Or download from: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "GitHub CLI found!" -ForegroundColor Green
Write-Host ""

# Check authentication
Write-Host "Checking GitHub authentication..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Not authenticated. Logging in..." -ForegroundColor Yellow
    gh auth login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Authentication failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Authenticated!" -ForegroundColor Green
Write-Host ""

# Get repository
Write-Host "Getting repository information..." -ForegroundColor Yellow
$repoInfo = git remote get-url origin
$repo = $repoInfo -replace '.*github\.com[:/]', '' -replace '\.git$', ''

Write-Host "Repository: $repo" -ForegroundColor Cyan
Write-Host ""

# Read CRON_SECRET from .env.local
Write-Host "Reading CRON_SECRET from .env.local..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".env.local"
$cronSecret = ($envContent | Select-String -Pattern "^CRON_SECRET=(.+)$").Matches.Groups[1].Value

if (-not $cronSecret) {
    Write-Host "ERROR: CRON_SECRET not found in .env.local!" -ForegroundColor Red
    exit 1
}

Write-Host "Found CRON_SECRET" -ForegroundColor Green
Write-Host ""

# Get Vercel URL
Write-Host "Enter your Vercel production URL:" -ForegroundColor Yellow
Write-Host "(Example: https://aiprojecthub.vercel.app)" -ForegroundColor Gray
Write-Host ""
Write-Host "Or press Enter to use: https://aiprojecthub-ge2ha3u2c-omars-projects-7051f8d4.vercel.app"
$vercelUrl = Read-Host "URL"

if ([string]::IsNullOrWhiteSpace($vercelUrl)) {
    $vercelUrl = "https://aiprojecthub-ge2ha3u2c-omars-projects-7051f8d4.vercel.app"
}

$vercelUrl = $vercelUrl.TrimEnd('/')

Write-Host ""
Write-Host "=" * 60
Write-Host "Ready to add secrets:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Repository:  $repo"
Write-Host "  CRON_SECRET: ******* (hidden)"
Write-Host "  VERCEL_APP_URL: $vercelUrl"
Write-Host ""
Write-Host "=" * 60
Write-Host ""

$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Adding secrets..." -ForegroundColor Yellow
Write-Host ""

# Add CRON_SECRET
Write-Host "  Adding CRON_SECRET..." -ForegroundColor Cyan
$cronSecret | gh secret set CRON_SECRET --repo $repo

if ($LASTEXITCODE -eq 0) {
    Write-Host "  SUCCESS: CRON_SECRET added!" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Failed to add CRON_SECRET" -ForegroundColor Red
    exit 1
}

# Add VERCEL_APP_URL
Write-Host "  Adding VERCEL_APP_URL..." -ForegroundColor Cyan
$vercelUrl | gh secret set VERCEL_APP_URL --repo $repo

if ($LASTEXITCODE -eq 0) {
    Write-Host "  SUCCESS: VERCEL_APP_URL added!" -ForegroundColor Green
} else {
    Write-Host "  ERROR: Failed to add VERCEL_APP_URL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" * 60
Write-Host "SUCCESS! All secrets added to GitHub!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""

# List secrets
Write-Host "Current secrets in repository:" -ForegroundColor Cyan
gh secret list --repo $repo

Write-Host ""
Write-Host "=" * 60
Write-Host "NEXT STEPS:" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""
Write-Host "1. Test the workflow:" -ForegroundColor Yellow
Write-Host "   https://github.com/$repo/actions"
Write-Host ""
Write-Host "2. Click 'Automated Notifications' workflow" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Click 'Run workflow' button" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Check your email!" -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 60
Write-Host "AUTOMATED SCHEDULE (UTC times):" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""
Write-Host "  8:00 AM  - Morning Notifications"
Write-Host "  9:00 AM  - Task Reminders"
Write-Host "  1:00 PM  - Midday Notifications"
Write-Host "  6:00 PM  - Evening Notifications"
Write-Host ""
Write-Host "Users will start receiving notifications tomorrow!" -ForegroundColor Green
Write-Host ""


