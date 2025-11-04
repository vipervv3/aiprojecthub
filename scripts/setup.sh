#!/bin/bash

# AI ProjectHub Setup Script
echo "🚀 Setting up AI ProjectHub..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please update .env.local with your API keys and configuration"
else
    echo "✅ .env.local already exists"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p public/uploads
mkdir -p logs

# Set up Git hooks (optional)
echo "🔧 Setting up Git hooks..."
if [ -d ".git" ]; then
    chmod +x scripts/pre-commit.sh 2>/dev/null || true
    echo "✅ Git hooks configured"
fi

# Run type checking
echo "🔍 Running type checking..."
npm run type-check

# Run linting
echo "🧹 Running linter..."
npm run lint

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your API keys:"
echo "   - Supabase credentials"
echo "   - AI service API keys (OpenAI, Groq, AssemblyAI)"
echo "   - Email service configuration"
echo ""
echo "2. Set up your Supabase project:"
echo "   - Create a new Supabase project"
echo "   - Run the SQL schema from lib/database/schema.sql"
echo "   - Enable Row Level Security policies"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more information, check the README.md file"






















