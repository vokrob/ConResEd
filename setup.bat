@echo off
REM ConResEd Setup Script for Windows

echo 🚀 Setting up ConResEd Development Environment...
echo.

REM Check if PostgreSQL is installed
echo Checking PostgreSQL...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL is not installed. Please install it first.
    exit /b 1
)
echo ✓ PostgreSQL found
echo.

REM Create database
echo Creating database...
psql -U postgres -c "CREATE DATABASE conresed;" 2>nul
if %errorlevel% neq 0 (
    echo Database might already exist or cannot be created automatically
)
echo ✓ Database setup complete
echo.

REM Install Python dependencies
echo Installing Python dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    exit /b 1
)
echo ✓ Python dependencies installed
echo.

REM Create .env file
if not exist .env (
    copy .env.example .env
    echo ✓ Environment file created
)

cd ..

echo.
echo ======================================
echo ✅ Setup Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Run the database schema: psql -U postgres -d conresed -f db\schema.sql
echo 3. Start the backend: cd backend ^&^& python app.py
echo 4. Open frontend\index.html in your browser
echo.

pause