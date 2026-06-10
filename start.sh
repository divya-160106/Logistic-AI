#!/bin/bash
echo "Starting LogisticAI..."

# Backend
cd backend
python -m venv venv 2>/dev/null
source venv/bin/activate
pip install -r requirements.txt -q
python main.py &
BACKEND_PID=$!
echo "Backend started (PID $BACKEND_PID)"

# Frontend
cd ../frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID $FRONTEND_PID)"

echo ""
echo "LogisticAI running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers."

wait $BACKEND_PID $FRONTEND_PID
