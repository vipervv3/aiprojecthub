# AI ProjectHub Setup Script for Windows
Write-Host "🚀 Setting up AI ProjectHub..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ and try again." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($versionNumber -lt 18) {
    Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Check if .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env.local"
    Write-Host "⚠️  Please update .env.local with your API keys and configuration" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "public\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Run type checking
Write-Host "🔍 Running type checking..." -ForegroundColor Yellow
npm run type-check

# Run linting
Write-Host "🧹 Running linter..." -ForegroundColor Yellow
npm run lint

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env.local with your API keys:" -ForegroundColor White
Write-Host "   - Supabase credentials" -ForegroundColor Gray
Write-Host "   - AI service API keys (OpenAI, Groq, AssemblyAI)" -ForegroundColor Gray
Write-Host "   - Email service configuration" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Set up your Supabase project:" -ForegroundColor White
Write-Host "   - Create a new Supabase project" -ForegroundColor Gray
Write-Host "   - Run the SQL schema from lib/database/schema.sql" -ForegroundColor Gray
Write-Host "   - Enable Row Level Security policies" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more information, check the README.md file" -ForegroundColor Cyan






















