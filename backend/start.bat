@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   Starting EduSense AI Backend...
echo ========================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not available on PATH.
    echo Install Python 3.10+ and ensure "python" works in terminal.
    pause
    exit /b 1
)

if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate
) else (
    echo [WARN] Virtual environment not found. Using system Python.
)

echo Installing dependencies...
python -m pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Starting FastAPI server on port 8000...
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
if errorlevel 1 (
    echo [ERROR] Failed to start server.
)

pause
