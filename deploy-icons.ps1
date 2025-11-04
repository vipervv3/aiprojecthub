# Deploy App Icons Script

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "DEPLOY APP ICONS TO PRODUCTION" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host ""

# Check if icons exist
$icon192 = Test-Path "public/icon-192x192.png"
$icon512 = Test-Path "public/icon-512x512.png"

Write-Host "Checking for app icons..." -ForegroundColor Yellow
Write-Host ""

if ($icon192) {
    Write-Host "  icon-192x192.png: Found" -ForegroundColor Green
} else {
    Write-Host "  icon-192x192.png: Missing" -ForegroundColor Red
}

if ($icon512) {
    Write-Host "  icon-512x512.png: Found" -ForegroundColor Green
} else {
    Write-Host "  icon-512x512.png: Missing" -ForegroundColor Red
}

Write-Host ""

if ($icon192 -and $icon512) {
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Host "Both icons found! Ready to deploy!" -ForegroundColor Green
    Write-Host "=" * 70
    Write-Host ""
    
    $confirm = Read-Host "Deploy to Vercel now? (Y/N)"
    
    if ($confirm -eq 'Y' -or $confirm -eq 'y') {
        Write-Host ""
        Write-Host "Adding icons to git..." -ForegroundColor Yellow
        git add public/icon-*.png
        
        Write-Host "Committing..." -ForegroundColor Yellow
        git commit -m "Add PWA app icons for mobile installation"
        
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push origin main
        
        Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
        vercel --prod --yes
        
        Write-Host ""
        Write-Host "=" * 70 -ForegroundColor Green
        Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
        Write-Host "=" * 70
        Write-Host ""
        Write-Host "Your app can now be installed on mobile devices!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Test it:" -ForegroundColor Yellow
        Write-Host "1. Open your app on a phone" -ForegroundColor White
        Write-Host "2. Look for 'Add to Home Screen' or 'Install app'" -ForegroundColor White
        Write-Host "3. Tap to install" -ForegroundColor White
        Write-Host "4. Your new icon will appear on the home screen!" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
    }
} else {
    Write-Host "=" * 70 -ForegroundColor Red
    Write-Host "ICONS MISSING!" -ForegroundColor Red
    Write-Host "=" * 70
    Write-Host ""
    Write-Host "Please add both icon files to the public/ folder:" -ForegroundColor Yellow
    Write-Host "  - public/icon-192x192.png (192x192 pixels)" -ForegroundColor White
    Write-Host "  - public/icon-512x512.png (512x512 pixels)" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again!" -ForegroundColor Yellow
    Write-Host ""
}

