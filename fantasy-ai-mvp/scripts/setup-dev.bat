@echo off
REM Fantasy.AI MVP Development Setup Script for Windows
REM This script sets up the development environment

echo 🚀 Setting up Fantasy.AI MVP development environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if .env.local exists
if not exist .env.local (
    echo ⚠️  .env.local not found. Copying from template...
    copy .env.local.template .env.local
    echo ✅ Created .env.local from template
    echo 📝 Please edit .env.local and add your API keys
)

REM Start database containers
echo 🐳 Starting database containers...
docker-compose up -d postgres

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
:wait_loop
docker-compose exec postgres pg_isready -U fantasy_user -d fantasy_ai_dev >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_loop
)

echo ✅ Database is ready!

REM Install dependencies
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npm run db:generate

REM Push database schema
echo 📊 Setting up database schema...
npm run db:push

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Edit .env.local and add your API keys (OpenAI, Stripe)
echo 2. Run 'npm run dev' to start the development server
echo 3. Open http://localhost:3000 in your browser
echo.
echo To stop the database: docker-compose down
echo To view database: docker-compose exec postgres psql -U fantasy_user -d fantasy_ai_dev

pause