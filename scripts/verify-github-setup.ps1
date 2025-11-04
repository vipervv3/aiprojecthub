# Comprehensive GitHub Setup Verification

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Actions Setup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if workflow file exists
Write-Host "1. Checking workflow file..." -ForegroundColor Yellow
if (Test-Path ".github/workflows/notifications.yml") {
    Write-Host "   [OK] Workflow file exists" -ForegroundColor Green
    $workflow = Get-Content ".github/workflows/notifications.yml" -Raw
    if ($workflow -match "CRON_SECRET" -and $workflow -match "VERCEL_APP_URL") {
        Write-Host "   [OK] Workflow references correct secrets" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Workflow may not reference secrets correctly" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [ERROR] Workflow file not found!" -ForegroundColor Red
}

Write-Host ""

# Check if workflow is committed
Write-Host "2. Checking if workflow is committed..." -ForegroundColor Yellow
$gitStatus = git status --porcelain ".github/workflows/notifications.yml" 2>&1
if ([string]::IsNullOrWhiteSpace($gitStatus)) {
    Write-Host "   [OK] Workflow file is committed" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] Workflow file may not be committed" -ForegroundColor Yellow
}

Write-Host ""

# Check Vercel endpoint
Write-Host "3. Testing Vercel endpoints..." -ForegroundColor Yellow
$vercelUrl = "https://aiprojecthub.vercel.app"

try {
    $response = Invoke-WebRequest -Uri "$vercelUrl/api/cron/schedule-notifications" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [WARNING] Endpoint accessible without auth (should require secret)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   [OK] Notification endpoint requires authentication" -ForegroundColor Green
    } else {
        Write-Host "   [INFO] Notification endpoint status: $statusCode" -ForegroundColor Cyan
    }
}

try {
    $response = Invoke-WebRequest -Uri "$vercelUrl/api/cron/task-reminders" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [WARNING] Endpoint accessible without auth (should require secret)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   [OK] Task reminders endpoint requires authentication" -ForegroundColor Green
    } else {
        Write-Host "   [INFO] Task reminders endpoint status: $statusCode" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Verification Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Since we can't access GitHub secrets directly, please verify:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to GitHub Secrets:" -ForegroundColor Cyan
Write-Host "   https://github.com/vipervv3/aiprojecthub/settings/secrets/actions" -ForegroundColor White
Write-Host ""
Write-Host "   You should see:" -ForegroundColor Yellow
Write-Host "   - CRON_SECRET (should show as dots/masked)" -ForegroundColor White
Write-Host "   - VERCEL_APP_URL (should show as dots/masked)" -ForegroundColor White
Write-Host ""
Write-Host "2. Test the workflow:" -ForegroundColor Cyan
Write-Host "   https://github.com/vipervv3/aiprojecthub/actions" -ForegroundColor White
Write-Host ""
Write-Host "   - Click 'Notification Reminders'" -ForegroundColor White
Write-Host "   - Click 'Run workflow'" -ForegroundColor White
Write-Host "   - Select 'main' branch" -ForegroundColor White
Write-Host "   - Click 'Run workflow'" -ForegroundColor White
Write-Host ""
Write-Host "3. Check the workflow run:" -ForegroundColor Cyan
Write-Host "   - Wait 30-60 seconds" -ForegroundColor White
Write-Host "   - Click on the latest run" -ForegroundColor White
Write-Host "   - Expand 'Trigger Notification Scheduler' step" -ForegroundColor White
Write-Host "   - Expand 'Trigger Task Reminders' step" -ForegroundColor White
Write-Host ""
Write-Host "   Look for:" -ForegroundColor Yellow
Write-Host "   [OK] 'Response status: 200'" -ForegroundColor Green
Write-Host "   [OK] 'Notification scheduler completed successfully'" -ForegroundColor Green
Write-Host "   [OK] 'Task reminders completed successfully'" -ForegroundColor Green
Write-Host ""
Write-Host "   If you see 401 errors:" -ForegroundColor Yellow
Write-Host "   - CRON_SECRET doesn't match Vercel" -ForegroundColor Red
Write-Host "   - Double-check the value in both places" -ForegroundColor Red
Write-Host ""
Write-Host "4. Verify automatic scheduling:" -ForegroundColor Cyan
Write-Host "   - Workflow should run automatically every hour" -ForegroundColor White
Write-Host "   - Next run will be at the top of the next hour" -ForegroundColor White
Write-Host "   - You can see scheduled runs in the Actions tab" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Checklist" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please confirm:" -ForegroundColor Cyan
Write-Host "  [ ] Both secrets added to GitHub (CRON_SECRET, VERCEL_APP_URL)" -ForegroundColor White
Write-Host "  [ ] Workflow file exists (.github/workflows/notifications.yml)" -ForegroundColor White
Write-Host "  [ ] Manual workflow run completed successfully" -ForegroundColor White
Write-Host "  [ ] No 401 errors in workflow logs" -ForegroundColor White
Write-Host ""
Write-Host "If all checked, your setup is complete! ✅" -ForegroundColor Green
Write-Host ""



