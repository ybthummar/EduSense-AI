@echo off
echo ========================================
echo   Starting EduSense AI Backend...
echo ========================================
echo.

if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate
) else (
    echo [WARN] Virtual environment not found. Using system Python.
)

echo Installing dependencies...
pip install -r requirements.txt --quiet

echo.
echo Starting FastAPI server on port 8000...
uvicorn main:app --reload --port 8000

pause
