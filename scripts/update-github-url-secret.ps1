# Update GitHub VERCEL_APP_URL Secret

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating VERCEL_APP_URL in GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$vercelUrl = "https://aiprojecthub.vercel.app"

Write-Host "Vercel Production URL: $vercelUrl" -ForegroundColor Green
Write-Host ""

# Check if GitHub CLI is available
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if ($ghInstalled) {
    Write-Host "GitHub CLI found! Updating secret..." -ForegroundColor Green
    Write-Host ""
    
    # Check authentication
    $authCheck = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Not authenticated. Please authenticate first:" -ForegroundColor Yellow
        Write-Host "  Run: gh auth login" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    
    Write-Host "Setting VERCEL_APP_URL secret..." -ForegroundColor Yellow
    echo $vercelUrl | gh secret set VERCEL_APP_URL
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] VERCEL_APP_URL updated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Secret value: $vercelUrl" -ForegroundColor Cyan
    } else {
        Write-Host "[ERROR] Failed to update secret" -ForegroundColor Red
        Write-Host "Make sure you have write access to the repository." -ForegroundColor Yellow
        exit 1
    }
    
} else {
    Write-Host "GitHub CLI not found. Please update manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to:" -ForegroundColor Cyan
    Write-Host "   https://github.com/vipervv3/aiprojecthub/settings/secrets/actions" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Find 'VERCEL_APP_URL' secret:" -ForegroundColor Cyan
    Write-Host "   - If it exists: Click on it → 'Update' → Set value to: $vercelUrl" -ForegroundColor White
    Write-Host "   - If it doesn't exist: Click 'New repository secret'" -ForegroundColor White
    Write-Host "     Name: VERCEL_APP_URL" -ForegroundColor White
    Write-Host "     Value: $vercelUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Click 'Add secret' or 'Update secret'" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next: Test the Workflow" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After updating, test the workflow:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/vipervv3/aiprojecthub/actions" -ForegroundColor White
Write-Host "2. Click 'Notification Reminders' → 'Run workflow'" -ForegroundColor White
Write-Host ""



