# Task Scheduler
A simple full stack task scheduler application built with FastAPI (Python) for the backend and React + TypeScript + Tailwind CSS for the frontend.
It allows users to create, view and manage scheduled tasks using cron expressions.

## Features
Create, edit and delete scheduled tasks
Cron based scheduling with validation
Automatic execution with retries
Task dependency support
Simple UI with Tailwind CSS
FastAPI backend with SQLite

## Tech Stack
### Frontend
React + TypeScript
Tailwind CSS
Vite

### Backend
FastAPI
SQLAlchemy + SQLite
APScheduler
CORS enabled

## Setup Instructions
1. Clone the repo
git clone https://github.com/sunand-p/task-scheduler.git
cd task-scheduler

2. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
Backend runs at http://localhost:8000

3. Frontend setup
cd frontend
npm install
npm run dev
Frontend runs at http://localhost:5173
Environment Variables: VITE_API_URL=http://localhost:8000
