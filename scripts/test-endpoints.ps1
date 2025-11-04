# Test GitHub Workflow Endpoints
# This simulates what GitHub Actions does

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing GitHub Workflow Endpoints" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$vercelUrl = "https://aiprojecthub.vercel.app"

Write-Host "Step 1: Get CRON_SECRET from Vercel" -ForegroundColor Yellow
Write-Host "Go to: https://vercel.com/dashboard -> aiprojecthub -> Settings -> Environment Variables" -ForegroundColor White
Write-Host "Find CRON_SECRET and click the eye icon to reveal it" -ForegroundColor White
Write-Host ""

$cronSecret = Read-Host "Enter your CRON_SECRET" -AsSecureString
$cronSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($cronSecret)
)

if ([string]::IsNullOrWhiteSpace($cronSecretPlain)) {
    Write-Host "[ERROR] CRON_SECRET cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Testing endpoints..." -ForegroundColor Yellow
Write-Host ""

# Test notification scheduler endpoint
Write-Host "Testing: $vercelUrl/api/cron/schedule-notifications" -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $cronSecretPlain"
    }
    
    $response = Invoke-WebRequest -Uri "$vercelUrl/api/cron/schedule-notifications" -Method GET -Headers $headers -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content -ForegroundColor White
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDescription = $_.Exception.Response.StatusDescription
    
    Write-Host "[ERROR] Status: $statusCode $statusDescription" -ForegroundColor Red
    
    if ($statusCode -eq 401) {
        Write-Host ""
        Write-Host "401 Unauthorized means CRON_SECRET doesn't match!" -ForegroundColor Yellow
        Write-Host "Check:" -ForegroundColor Yellow
        Write-Host "1. CRON_SECRET in GitHub matches Vercel exactly" -ForegroundColor White
        Write-Host "2. No extra spaces or quotes" -ForegroundColor White
        Write-Host "3. Secret is set in GitHub: https://github.com/vipervv3/aiprojecthub/settings/secrets/actions" -ForegroundColor White
    } elseif ($statusCode -eq 404) {
        Write-Host ""
        Write-Host "404 Not Found - Check VERCEL_APP_URL" -ForegroundColor Yellow
        Write-Host "Make sure URL is: $vercelUrl (no trailing slash, no /api/ path)" -ForegroundColor White
    }
    
    exit 1
}

Write-Host ""
Write-Host "Testing: $vercelUrl/api/cron/task-reminders" -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $cronSecretPlain"
    }
    
    $response = Invoke-WebRequest -Uri "$vercelUrl/api/cron/task-reminders" -Method GET -Headers $headers -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content -ForegroundColor White
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDescription = $_.Exception.Response.StatusDescription
    
    Write-Host "[ERROR] Status: $statusCode $statusDescription" -ForegroundColor Red
    
    if ($statusCode -eq 401) {
        Write-Host ""
        Write-Host "401 Unauthorized means CRON_SECRET doesn't match!" -ForegroundColor Yellow
    }
    
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "[OK] Both endpoints working!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "If both tests passed, your secrets are correct." -ForegroundColor Cyan
Write-Host "The GitHub workflow should work now!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Try running the workflow again:" -ForegroundColor Yellow
Write-Host "https://github.com/vipervv3/aiprojecthub/actions" -ForegroundColor White



