# Quick System Check for AI Project Hub
param(
    [string]$URL = "https://aiprojecthub-ac797u84g-omars-projects-7051f8d4.vercel.app"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "AI PROJECT HUB - SYSTEM CHECK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$tests = @()

# Test Deployment
Write-Host "Checking deployment..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri $URL -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($r.StatusCode -eq 200) {
        Write-Host " PASS" -ForegroundColor Green
        $tests += "PASS"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $tests += "FAIL"
}

# Test Icon 192
Write-Host "Checking icon-192x192.png..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$URL/icon-192x192.png" -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($r.StatusCode -eq 200 -and $r.RawContentLength -gt 1000) {
        Write-Host " PASS" -ForegroundColor Green
        $tests += "PASS"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $tests += "FAIL"
}

# Test Icon 512
Write-Host "Checking icon-512x512.png..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$URL/icon-512x512.png" -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($r.StatusCode -eq 200 -and $r.RawContentLength -gt 1000) {
        Write-Host " PASS" -ForegroundColor Green
        $tests += "PASS"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $tests += "FAIL"
}

# Test Manifest
Write-Host "Checking manifest.json..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$URL/manifest.json" -Method GET -TimeoutSec 10 -UseBasicParsing
    $m = $r.Content | ConvertFrom-Json
    if ($m.name -eq "AI ProjectHub") {
        Write-Host " PASS" -ForegroundColor Green
        $tests += "PASS"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $tests += "FAIL"
}

# Test Service Worker
Write-Host "Checking service worker..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$URL/sw.js" -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($r.StatusCode -eq 200) {
        Write-Host " PASS" -ForegroundColor Green
        $tests += "PASS"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $tests += "FAIL"
}

# Test Morning API
Write-Host "Checking morning notifications API..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$URL/api/cron/morning-notifications" -Method GET -TimeoutSec 10 -UseBasicParsing -SkipHttpErrorCheck
    if ($r.StatusCode -eq 401 -or $r.StatusCode -eq 200) {
        Write-Host " PASS" -ForegroundColor Green
        $tests += "PASS"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $tests += "FAIL"
}

# Test Task Reminders API
Write-Host "Checking task reminders API..." -NoNewline
try {
    $r = Invoke-WebRequest -Uri "$URL/api/cron/task-reminders" -Method GET -TimeoutSec 10 -UseBasicParsing -SkipHttpErrorCheck
    if ($r.StatusCode -eq 401 -or $r.StatusCode -eq 200) {
        Write-Host " PASS" -ForegroundColor Green
        $tests += "PASS"
    }
} catch {
    Write-Host " FAIL" -ForegroundColor Red
    $tests += "FAIL"
}

# Check local files
Write-Host "Checking local icon files..." -NoNewline
if ((Test-Path "public/icon-192x192.png") -and (Test-Path "public/icon-512x512.png")) {
    Write-Host " PASS" -ForegroundColor Green
    $tests += "PASS"
} else {
    Write-Host " FAIL" -ForegroundColor Red
    $tests += "FAIL"
}

# Check GitHub workflow
Write-Host "Checking GitHub workflow..." -NoNewline
if (Test-Path ".github/workflows/notifications.yml") {
    Write-Host " PASS" -ForegroundColor Green
    $tests += "PASS"
} else {
    Write-Host " FAIL" -ForegroundColor Red
    $tests += "FAIL"
}

# Results
$passed = ($tests | Where-Object { $_ -eq "PASS" }).Count
$total = $tests.Count
$rate = [math]::Round(($passed / $total) * 100, 1)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESULTS: $passed/$total tests passed - $rate%" -ForegroundColor $(if ($rate -ge 90) { "Green" } elseif ($rate -ge 70) { "Yellow" } else { "Red" })
Write-Host "========================================`n" -ForegroundColor Cyan

if ($rate -ge 90) {
    Write-Host "EXCELLENT! Your app is fully operational!`n" -ForegroundColor Green
} elseif ($rate -ge 70) {
    Write-Host "GOOD but needs attention. Check failed tests.`n" -ForegroundColor Yellow
} else {
    Write-Host "CRITICAL ISSUES DETECTED. Please fix failed tests.`n" -ForegroundColor Red
}

Write-Host "URL: $URL`n" -ForegroundColor Cyan

