# Fix CRON_SECRET Mismatch

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "FIX CRON_SECRET - AUTOMATED" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host ""

# Get the correct CRON_SECRET from .env.local
$cronSecret = (Select-String -Path .env.local -Pattern "^CRON_SECRET=(.+)$").Matches.Groups[1].Value

Write-Host "Found CRON_SECRET: $cronSecret" -ForegroundColor Green
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Yellow
Write-Host "OPTION 1: AUTOMATIC FIX (Requires Confirmation)" -ForegroundColor Yellow
Write-Host "=" * 70
Write-Host ""
Write-Host "Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "# Remove old CRON_SECRET" -ForegroundColor Gray
Write-Host "vercel env rm CRON_SECRET production" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Add correct CRON_SECRET" -ForegroundColor Gray
Write-Host "echo `"$cronSecret`" | vercel env add CRON_SECRET production" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Redeploy to apply changes" -ForegroundColor Gray
Write-Host "vercel --prod" -ForegroundColor Cyan
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Yellow
Write-Host "OPTION 2: MANUAL FIX (Easier - Use Vercel Dashboard)" -ForegroundColor Yellow
Write-Host "=" * 70
Write-Host ""
Write-Host "1. Open: https://vercel.com/omars-projects-7051f8d4/aiprojecthub/settings/environment-variables" -ForegroundColor White
Write-Host ""
Write-Host "2. Find CRON_SECRET in the list" -ForegroundColor White
Write-Host ""
Write-Host "3. Click the 3 dots (...) menu" -ForegroundColor White
Write-Host ""
Write-Host "4. Click 'Edit'" -ForegroundColor White
Write-Host ""
Write-Host "5. Paste this value:" -ForegroundColor White
Write-Host "   $cronSecret" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Save changes" -ForegroundColor White
Write-Host ""
Write-Host "7. Redeploy (optional - Vercel will use new value on next request)" -ForegroundColor White
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Green
Write-Host "The CRON_SECRET has been copied to your clipboard!" -ForegroundColor Green
Write-Host "Just paste it in Vercel dashboard!" -ForegroundColor Green
Write-Host "=" * 70
Write-Host ""

# Copy to clipboard
Set-Clipboard -Value $cronSecret
Write-Host "Ready to paste in Vercel!" -ForegroundColor Green
Write-Host ""

