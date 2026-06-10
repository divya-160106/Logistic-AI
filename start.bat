@echo off
echo Starting LogisticAI Control System...
echo.

:: Backend
cd backend
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing backend dependencies...
pip install -r requirements.txt -q
echo Starting backend server...
start "LogisticAI Backend" cmd /k "call venv\Scripts\activate && python main.py"

:: Frontend
cd ..\frontend
echo Installing frontend dependencies...
call npm install --silent
echo Starting frontend dev server...
start "LogisticAI Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo  LogisticAI is starting up!
echo  Frontend : http://localhost:5173
echo  Backend  : http://localhost:8000
echo  API Docs : http://localhost:8000/docs
echo ============================================
echo.
pause
