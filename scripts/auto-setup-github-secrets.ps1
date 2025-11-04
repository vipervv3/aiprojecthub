# Automated GitHub Secrets Setup
# This script uses GitHub API to set secrets

param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$false)]
    [string]$CronSecret
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Secrets Automated Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$repoOwner = "vipervv3"
$repoName = "aiprojecthub"
$vercelUrl = "https://aiprojecthub.vercel.app"

# Get GitHub Token
if (-not $GitHubToken) {
    Write-Host "To set GitHub secrets, we need a GitHub Personal Access Token." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Create one at: https://github.com/settings/tokens/new" -ForegroundColor White
    Write-Host "Required scopes: 'repo' and 'admin:repo_hook'" -ForegroundColor White
    Write-Host ""
    $GitHubToken = Read-Host "Enter your GitHub Personal Access Token" -AsSecureString
    $GitHubToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($GitHubToken)
    )
}

if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
    Write-Host "❌ GitHub token is required!" -ForegroundColor Red
    exit 1
}

# Get CRON_SECRET
if (-not $CronSecret) {
    Write-Host ""
    Write-Host "Get CRON_SECRET from Vercel:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select 'aiprojecthub' project" -ForegroundColor White
    Write-Host "3. Settings → Environment Variables → CRON_SECRET" -ForegroundColor White
    Write-Host ""
    $CronSecret = Read-Host "Enter CRON_SECRET from Vercel" -AsSecureString
    $CronSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($CronSecret)
    )
}

if ([string]::IsNullOrWhiteSpace($CronSecret)) {
    Write-Host "❌ CRON_SECRET is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up secrets..." -ForegroundColor Cyan

# Function to set GitHub secret using GitHub API
function Set-GitHubSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue,
        [string]$Token,
        [string]$Owner,
        [string]$Repo
    )
    
    $headers = @{
        "Authorization" = "token $Token"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    # Get the public key for encryption
    $publicKeyUrl = "https://api.github.com/repos/$Owner/$Repo/actions/secrets/public-key"
    try {
        $publicKeyResponse = Invoke-RestMethod -Uri $publicKeyUrl -Headers $headers -Method Get
        $publicKey = $publicKeyResponse.key
        $keyId = $publicKeyResponse.key_id
    } catch {
        Write-Host "❌ Failed to get public key: $_" -ForegroundColor Red
        return $false
    }
    
    # Encrypt the secret using the public key (requires libsodium)
    # For now, we'll use a workaround with GitHub CLI or manual setup
    Write-Host "⚠️  GitHub API requires libsodium for encryption." -ForegroundColor Yellow
    Write-Host "Using alternative method..." -ForegroundColor Yellow
    
    return $false
}

# Alternative: Use GitHub CLI if available, or provide manual instructions
Write-Host ""
Write-Host "Setting secrets via GitHub API requires encryption..." -ForegroundColor Yellow
Write-Host ""

# Check if we can use gh command
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if ($ghPath) {
    Write-Host "✅ GitHub CLI found! Using it to set secrets..." -ForegroundColor Green
    
    # Set CRON_SECRET
    Write-Host "Setting CRON_SECRET..." -ForegroundColor Yellow
    $cronSecretEscaped = $CronSecret -replace '"', '\"'
    $cronSecretEscaped = $cronSecretEscaped -replace '\$', '\$'
    echo $CronSecret | gh secret set CRON_SECRET
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CRON_SECRET set!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set CRON_SECRET" -ForegroundColor Red
        exit 1
    }
    
    # Set VERCEL_APP_URL
    Write-Host "Setting VERCEL_APP_URL..." -ForegroundColor Yellow
    echo $vercelUrl | gh secret set VERCEL_APP_URL
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ VERCEL_APP_URL set!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set VERCEL_APP_URL" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ All secrets set successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
} else {
    Write-Host "GitHub CLI not found. Please use one of these methods:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Method 1: Install GitHub CLI" -ForegroundColor Cyan
    Write-Host "  Run as Administrator: winget install --id GitHub.cli" -ForegroundColor White
    Write-Host "  Then run: gh auth login" -ForegroundColor White
    Write-Host "  Then run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "Method 2: Manual Setup" -ForegroundColor Cyan
    Write-Host "  Go to: https://github.com/$repoOwner/$repoName/settings/secrets/actions" -ForegroundColor White
    Write-Host "  Add secret: CRON_SECRET = [your value]" -ForegroundColor White
    Write-Host "  Add secret: VERCEL_APP_URL = $vercelUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Your values to copy:" -ForegroundColor Yellow
    Write-Host "  CRON_SECRET: [hidden]" -ForegroundColor White
    Write-Host "  VERCEL_APP_URL: $vercelUrl" -ForegroundColor White
}



