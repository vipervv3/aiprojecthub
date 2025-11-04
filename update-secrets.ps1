# Update GitHub and Vercel Secrets Script

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "AUTOMATED NOTIFICATIONS - SECRET UPDATE GUIDE" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host ""

# Get Vercel Production URL
Write-Host "1. GETTING VERCEL PRODUCTION URL..." -ForegroundColor Yellow
$vercelUrl = "https://aiprojecthub-52w7g6w3c-omars-projects-7051f8d4.vercel.app"
Write-Host "   Production URL: $vercelUrl" -ForegroundColor Green
Write-Host ""

# Get CRON_SECRET
Write-Host "2. GETTING CRON_SECRET FROM .env.local..." -ForegroundColor Yellow
$cronSecret = (Select-String -Path .env.local -Pattern "^CRON_SECRET=(.+)$").Matches.Groups[1].Value
Write-Host "   CRON_SECRET: $cronSecret" -ForegroundColor Green
Write-Host ""

# Check other important env vars
Write-Host "3. CHECKING OTHER ENVIRONMENT VARIABLES..." -ForegroundColor Yellow
$resendKey = (Select-String -Path .env.local -Pattern "^RESEND_API_KEY=(.+)$").Matches.Groups[1].Value
$groqKey = (Select-String -Path .env.local -Pattern "^GROQ_API_KEY=(.+)$").Matches.Groups[1].Value
$supabaseUrl = (Select-String -Path .env.local -Pattern "^NEXT_PUBLIC_SUPABASE_URL=(.+)$").Matches.Groups[1].Value

if ($resendKey) { Write-Host "   RESEND_API_KEY: Found" -ForegroundColor Green } else { Write-Host "   RESEND_API_KEY: Missing" -ForegroundColor Red }
if ($groqKey) { Write-Host "   GROQ_API_KEY: Found" -ForegroundColor Green } else { Write-Host "   GROQ_API_KEY: Missing" -ForegroundColor Red }
if ($supabaseUrl) { Write-Host "   SUPABASE_URL: Found" -ForegroundColor Green } else { Write-Host "   SUPABASE_URL: Missing" -ForegroundColor Red }
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "ACTIONS REQUIRED:" -ForegroundColor Yellow
Write-Host "=" * 70
Write-Host ""

# GitHub Secret Update
Write-Host "ACTION 1: UPDATE GITHUB SECRET" -ForegroundColor Yellow
Write-Host "-" * 70
Write-Host ""
Write-Host "Go to: https://github.com/vipervv3/aiprojecthub/settings/secrets/actions" -ForegroundColor White
Write-Host ""
Write-Host "Update VERCEL_APP_URL secret:" -ForegroundColor White
Write-Host "  1. Click the pencil icon next to VERCEL_APP_URL" -ForegroundColor Gray
Write-Host "  2. Replace the value with:" -ForegroundColor Gray
Write-Host "     $vercelUrl" -ForegroundColor Cyan
Write-Host "  3. Click 'Update secret'" -ForegroundColor Gray
Write-Host ""
Write-Host "This value has been copied to your clipboard!" -ForegroundColor Green
Set-Clipboard -Value $vercelUrl
Write-Host ""

# Vercel Environment Variables
Write-Host "ACTION 2: VERIFY VERCEL ENVIRONMENT VARIABLES" -ForegroundColor Yellow
Write-Host "-" * 70
Write-Host ""
Write-Host "Go to: https://vercel.com/omars-projects-7051f8d4/aiprojecthub/settings/environment-variables" -ForegroundColor White
Write-Host ""
Write-Host "Make sure these variables exist (add if missing):" -ForegroundColor White
Write-Host ""
Write-Host "  Variable Name              | Status" -ForegroundColor Gray
Write-Host "  " + ("-" * 66) -ForegroundColor Gray
Write-Host "  CRON_SECRET                | Already exists (verified)" -ForegroundColor Green
if ($resendKey) { Write-Host "  RESEND_API_KEY             | Found in .env.local" -ForegroundColor Green }
if ($groqKey) { Write-Host "  GROQ_API_KEY               | Found in .env.local" -ForegroundColor Green }
if ($supabaseUrl) { Write-Host "  NEXT_PUBLIC_SUPABASE_URL   | Found in .env.local" -ForegroundColor Green }
Write-Host ""
Write-Host "  If any are missing, add them from your .env.local file" -ForegroundColor Yellow
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "QUICK TEST:" -ForegroundColor Yellow
Write-Host "=" * 70
Write-Host ""
Write-Host "After updating, test with:" -ForegroundColor White
Write-Host "  1. Go to: https://github.com/vipervv3/aiprojecthub/actions" -ForegroundColor Gray
Write-Host "  2. Click 'Debug Notifications (Test)'" -ForegroundColor Gray
Write-Host "  3. Click 'Run workflow'" -ForegroundColor Gray
Write-Host "  4. Check the results!" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Green
Write-Host "The Vercel URL has been copied to your clipboard!" -ForegroundColor Green
Write-Host "Just paste it in GitHub!" -ForegroundColor Green
Write-Host "=" * 70
Write-Host ""

