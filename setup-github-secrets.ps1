#!/usr/bin/env pwsh
# GitHub Secrets Setup Script
# Automatically adds required secrets to GitHub repository for automated notifications

Write-Host "🔐 GitHub Secrets Setup for Automated Notifications" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

# Check if GitHub CLI is installed
Write-Host "Checking for GitHub CLI..." -ForegroundColor Yellow
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if (-not $ghInstalled) {
    Write-Host "❌ GitHub CLI (gh) is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install GitHub CLI first:" -ForegroundColor Yellow
    Write-Host "  Windows: winget install --id GitHub.cli" -ForegroundColor White
    Write-Host "  Or download from: https://cli.github.com/" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ GitHub CLI found!" -ForegroundColor Green
Write-Host ""

# Check if authenticated
Write-Host "Checking GitHub authentication..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with GitHub!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Logging you in to GitHub..." -ForegroundColor Yellow
    gh auth login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ GitHub authentication failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Authenticated with GitHub!" -ForegroundColor Green
Write-Host ""

# Get repository info
Write-Host "Getting repository information..." -ForegroundColor Yellow
$repoInfo = git remote get-url origin
$repo = $repoInfo -replace '.*github\.com[:/]', '' -replace '\.git$', ''

Write-Host "📦 Repository: $repo" -ForegroundColor Cyan
Write-Host ""

# Read secrets from .env.local
Write-Host "Reading secrets from .env.local..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content ".env.local"

# Extract CRON_SECRET
$cronSecret = ($envContent | Select-String -Pattern "^CRON_SECRET=(.+)$").Matches.Groups[1].Value

if (-not $cronSecret) {
    Write-Host "❌ CRON_SECRET not found in .env.local!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found CRON_SECRET" -ForegroundColor Green

# Get Vercel deployment URL
Write-Host ""
Write-Host "Getting Vercel deployment URL..." -ForegroundColor Yellow

# Try to get from Vercel
$vercelUrl = ""
try {
    $vercelInfo = vercel ls --prod 2>&1 | Select-String -Pattern "https://.*\.vercel\.app" | Select-Object -First 1
    if ($vercelInfo) {
        $vercelUrl = $vercelInfo.Matches.Value
    }
} catch {
    Write-Host "⚠️ Could not auto-detect Vercel URL" -ForegroundColor Yellow
}

# If not found, ask user
if (-not $vercelUrl) {
    Write-Host ""
    Write-Host "Please enter your Vercel production URL:" -ForegroundColor Yellow
    Write-Host "(Example: https://aiprojecthub.vercel.app)" -ForegroundColor Gray
    $vercelUrl = Read-Host "URL"
}

if (-not $vercelUrl) {
    Write-Host "❌ Vercel URL is required!" -ForegroundColor Red
    exit 1
}

# Remove trailing slash if present
$vercelUrl = $vercelUrl.TrimEnd('/')

Write-Host "✅ Vercel URL: $vercelUrl" -ForegroundColor Green
Write-Host ""

# Confirm before proceeding
Write-Host "=" * 60
Write-Host "Ready to add the following secrets to GitHub:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Repository:  $repo" -ForegroundColor White
Write-Host "  Secret 1:    CRON_SECRET (${cronSecret.Length} characters)" -ForegroundColor White
Write-Host "  Secret 2:    VERCEL_APP_URL = $vercelUrl" -ForegroundColor White
Write-Host ""
Write-Host "=" * 60
Write-Host ""

$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "❌ Cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Adding secrets to GitHub..." -ForegroundColor Yellow
Write-Host ""

# Add CRON_SECRET
Write-Host "  📝 Adding CRON_SECRET..." -ForegroundColor Cyan
echo $cronSecret | gh secret set CRON_SECRET --repo $repo

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ CRON_SECRET added successfully!" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to add CRON_SECRET" -ForegroundColor Red
    exit 1
}

# Add VERCEL_APP_URL
Write-Host "  📝 Adding VERCEL_APP_URL..." -ForegroundColor Cyan
echo $vercelUrl | gh secret set VERCEL_APP_URL --repo $repo

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ VERCEL_APP_URL added successfully!" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to add VERCEL_APP_URL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" * 60
Write-Host "🎉 SUCCESS! All secrets added to GitHub!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""

# List all secrets
Write-Host "Current secrets in repository:" -ForegroundColor Cyan
gh secret list --repo $repo

Write-Host ""
Write-Host "=" * 60
Write-Host "✅ NEXT STEPS:" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""
Write-Host "1. Test the workflow manually:" -ForegroundColor Yellow
Write-Host "   https://github.com/$repo/actions" -ForegroundColor White
Write-Host ""
Write-Host "2. Click 'Automated Notifications' workflow" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Click 'Run workflow' button" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Watch the workflow run (should take ~30 seconds)" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Check your email for notifications!" -ForegroundColor Yellow
Write-Host ""
Write-Host "=" * 60
Write-Host "📅 AUTOMATED SCHEDULE (all times UTC):" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""
Write-Host "  ☀️  8:00 AM  - Morning Notifications" -ForegroundColor White
Write-Host "  ⏰  9:00 AM  - Task Reminders" -ForegroundColor White
Write-Host "  ⚡  1:00 PM  - Midday Notifications" -ForegroundColor White
Write-Host "  🌙  6:00 PM  - Evening Notifications" -ForegroundColor White
Write-Host ""
Write-Host "Users will start receiving notifications tomorrow!" -ForegroundColor Green
Write-Host ""

