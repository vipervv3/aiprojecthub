# ============================================================================
#  AI PROJECT HUB - COMPREHENSIVE SYSTEM CHECK
# ============================================================================

param(
    [string]$ProductionURL = "https://aiprojecthub-ac797u84g-omars-projects-7051f8d4.vercel.app"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "  AI PROJECT HUB - FULL SYSTEM VERIFICATION" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

# Results tracking
$results = @{
    Passed = @()
    Failed = @()
    Warnings = @()
}

function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$TestScript
    )
    
    Write-Host "Testing: $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        $result = & $TestScript
        if ($result -eq $true) {
            Write-Host " ✅ PASS" -ForegroundColor Green
            $results.Passed += $Name
            return $true
        } else {
            Write-Host " ❌ FAIL" -ForegroundColor Red
            $results.Failed += $Name
            return $false
        }
    } catch {
        Write-Host " ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $results.Failed += "$Name - $($_.Exception.Message)"
        return $false
    }
}

Write-Host "🔍 DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "-" * 80

# Test 1: Vercel deployment
Test-Component "Vercel Production Deployment" {
    try {
        $response = Invoke-WebRequest -Uri $ProductionURL -Method GET -TimeoutSec 10 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Test 2: Icon 192x192
Test-Component "App Icon 192x192" {
    try {
        $response = Invoke-WebRequest -Uri "$ProductionURL/icon-192x192.png" -Method GET -TimeoutSec 10 -UseBasicParsing
        return $response.StatusCode -eq 200 -and $response.RawContentLength -gt 1000
    } catch {
        return $false
    }
}

# Test 3: Icon 512x512
Test-Component "App Icon 512x512" {
    try {
        $response = Invoke-WebRequest -Uri "$ProductionURL/icon-512x512.png" -Method GET -TimeoutSec 10 -UseBasicParsing
        return $response.StatusCode -eq 200 -and $response.RawContentLength -gt 1000
    } catch {
        return $false
    }
}

# Test 4: Manifest.json
Test-Component "PWA Manifest" {
    try {
        $response = Invoke-WebRequest -Uri "$ProductionURL/manifest.json" -Method GET -TimeoutSec 10 -UseBasicParsing
        $manifest = $response.Content | ConvertFrom-Json
        return $manifest.name -eq "AI ProjectHub" -and $manifest.icons.Count -ge 2
    } catch {
        return $false
    }
}

# Test 5: Service Worker
Test-Component "Service Worker" {
    try {
        $response = Invoke-WebRequest -Uri "$ProductionURL/sw.js" -Method GET -TimeoutSec 10 -UseBasicParsing
        return $response.StatusCode -eq 200 -and $response.Content.Length -gt 100
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "🔍 API ENDPOINTS" -ForegroundColor Cyan
Write-Host "-" * 80

# Test 6-9: Notification endpoints (without auth - just check they exist)
$endpoints = @(
    @{Name = "Morning Notifications API"; Path = "/api/cron/morning-notifications"},
    @{Name = "Midday Notifications API"; Path = "/api/cron/midday-notifications"},
    @{Name = "Evening Notifications API"; Path = "/api/cron/evening-notifications"},
    @{Name = "Task Reminders API"; Path = "/api/cron/task-reminders"}
)

foreach ($endpoint in $endpoints) {
    Test-Component $endpoint.Name {
        try {
            # We expect 401 (unauthorized) which means endpoint exists
            $response = Invoke-WebRequest -Uri "$ProductionURL$($endpoint.Path)" -Method GET -TimeoutSec 10 -UseBasicParsing -SkipHttpErrorCheck
            # 401 = endpoint exists but needs auth (good!)
            # 404 = endpoint doesn't exist (bad!)
            return $response.StatusCode -eq 401 -or $response.StatusCode -eq 200
        } catch {
            return $false
        }
    }
}

Write-Host ""
Write-Host "🔍 LOCAL FILES" -ForegroundColor Cyan
Write-Host "-" * 80

# Test 10: Local icons exist
Test-Component "Local Icon Files" {
    $icon192 = Test-Path "public/icon-192x192.png"
    $icon512 = Test-Path "public/icon-512x512.png"
    return $icon192 -and $icon512
}

# Test 11: GitHub workflow file
Test-Component "GitHub Actions Workflow" {
    $workflow = Test-Path ".github/workflows/notifications.yml"
    if ($workflow) {
        $content = Get-Content ".github/workflows/notifications.yml" -Raw
        return $content -match "morning-notifications" -and $content -match "task-reminders"
    }
    return $false
}

# Test 12: Environment example file
Test-Component "Environment Configuration" {
    $envExample = Test-Path "env.example"
    if ($envExample) {
        $content = Get-Content "env.example" -Raw
        return $content -match "RESEND_API_KEY" -and $content -match "GROQ_API_KEY"
    }
    return $false
}

# Test 13: Vercel configuration
Test-Component "Vercel Configuration" {
    $vercelJson = Test-Path "vercel.json"
    if ($vercelJson) {
        $content = Get-Content "vercel.json" -Raw | ConvertFrom-Json
        # Should have empty crons array (using GitHub Actions instead)
        return $content.crons -is [array]
    }
    return $false
}

Write-Host ""
Write-Host "🔍 GITHUB INTEGRATION" -ForegroundColor Cyan
Write-Host "-" * 80

# Test 14: GitHub CLI
Test-Component "GitHub CLI Installed" {
    try {
        $null = gh --version 2>&1
        return $true
    } catch {
        return $false
    }
}

# Test 15: GitHub repo connected
Test-Component "GitHub Repository" {
    try {
        $remote = git remote get-url origin 2>&1
        return $remote -match "github.com"
    } catch {
        return $false
    }
}

# Test 16: Check recent workflow runs
Write-Host "Checking GitHub Actions runs..." -ForegroundColor Yellow
try {
    $runs = gh run list --workflow=notifications.yml --limit 3 --json status,conclusion,createdAt 2>&1 | ConvertFrom-Json
    if ($runs.Count -gt 0) {
        Write-Host "  Recent workflow runs:" -ForegroundColor White
        foreach ($run in $runs) {
            $status = if ($run.conclusion -eq "success") { "✅" } elseif ($run.conclusion -eq "failure") { "❌" } else { "⏳" }
            $time = [DateTime]::Parse($run.createdAt).ToString("yyyy-MM-dd HH:mm")
            Write-Host "    $status $($run.status) - $($run.conclusion) at $time" -ForegroundColor Gray
        }
        $results.Passed += "GitHub Actions History"
    } else {
        Write-Host "  No workflow runs found (workflows may not have triggered yet)" -ForegroundColor Yellow
        $results.Warnings += "No GitHub Actions runs yet"
    }
} catch {
    Write-Host "  ⚠️  Could not fetch workflow runs: $($_.Exception.Message)" -ForegroundColor Yellow
    $results.Warnings += "Could not check GitHub Actions runs"
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "  SYSTEM CHECK COMPLETE" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

# Summary
Write-Host "📊 RESULTS SUMMARY:" -ForegroundColor White
Write-Host ""
Write-Host "  ✅ Passed: $($results.Passed.Count)" -ForegroundColor Green
Write-Host "  ❌ Failed: $($results.Failed.Count)" -ForegroundColor Red
Write-Host "  ⚠️  Warnings: $($results.Warnings.Count)" -ForegroundColor Yellow
Write-Host ""

if ($results.Failed.Count -gt 0) {
    Write-Host "❌ FAILED TESTS:" -ForegroundColor Red
    foreach ($fail in $results.Failed) {
        Write-Host "  - $fail" -ForegroundColor Red
    }
    Write-Host ""
}

if ($results.Warnings.Count -gt 0) {
    Write-Host "⚠️  WARNINGS:" -ForegroundColor Yellow
    foreach ($warn in $results.Warnings) {
        Write-Host "  - $warn" -ForegroundColor Yellow
    }
    Write-Host ""
}

$totalTests = $results.Passed.Count + $results.Failed.Count
if ($totalTests -gt 0) {
    $passRate = [math]::Round(($results.Passed.Count / $totalTests) * 100, 1)
} else {
    $passRate = 0
}

$healthColor = "Red"
if ($passRate -ge 90) { $healthColor = "Green" }
elseif ($passRate -ge 70) { $healthColor = "Yellow" }

$passed = $results.Passed.Count
Write-Host "Overall Health: " -NoNewline
Write-Host "$passRate%" -ForegroundColor $healthColor -NoNewline
Write-Host " - $passed/$totalTests tests passed"
Write-Host ""

if ($passRate -ge 90) {
    Write-Host "EXCELLENT! Your app is fully operational!" -ForegroundColor Green
} elseif ($passRate -ge 70) {
    Write-Host "GOOD but needs attention. Check failed tests above." -ForegroundColor Yellow
} else {
    Write-Host "CRITICAL ISSUES DETECTED. Please fix failed tests." -ForegroundColor Red
}

Write-Host ""
Write-Host "Production URL: " -NoNewline
Write-Host $ProductionURL -ForegroundColor Cyan
Write-Host ""
Write-Host ("=" * 80)
Write-Host ""

# Return exit code based on results
if ($results.Failed.Count -eq 0) {
    exit 0
} else {
    exit 1
}

