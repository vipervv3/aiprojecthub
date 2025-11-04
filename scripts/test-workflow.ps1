# Test GitHub Actions Workflow
# This will test if the secrets are configured correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing GitHub Actions Workflow" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$vercelUrl = "https://aiprojecthub.vercel.app"

Write-Host "Step 1: Testing if endpoints are accessible..." -ForegroundColor Yellow
Write-Host ""

# Test schedule-notifications endpoint (will fail without auth, but should respond)
Write-Host "Testing notification scheduler endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$vercelUrl/api/cron/schedule-notifications" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[WARNING] Endpoint responded without authentication (should require CRON_SECRET)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "[OK] Endpoint requires authentication (correct behavior)" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Endpoint response: $statusCode" -ForegroundColor Cyan
    }
}

Write-Host ""

# Test task-reminders endpoint
Write-Host "Testing task reminders endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$vercelUrl/api/cron/task-reminders" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[WARNING] Endpoint responded without authentication (should require CRON_SECRET)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "[OK] Endpoint requires authentication (correct behavior)" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Endpoint response: $statusCode" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to GitHub Actions:" -ForegroundColor Yellow
Write-Host "   https://github.com/vipervv3/aiprojecthub/actions" -ForegroundColor White
Write-Host ""
Write-Host "2. Click 'Notification Reminders' workflow" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Click 'Run workflow' button (top right)" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Select branch 'main' and click 'Run workflow'" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Wait for it to complete and check:" -ForegroundColor Yellow
Write-Host "   - Green checkmark = Success!" -ForegroundColor Green
Write-Host "   - Red X = Check logs for errors" -ForegroundColor Red
Write-Host ""
Write-Host "If you see 401 errors in the logs, the CRON_SECRET doesn't match." -ForegroundColor Yellow
Write-Host "If you see connection errors, check VERCEL_APP_URL." -ForegroundColor Yellow
Write-Host ""



