# EduPath

**EduPath** is an AI-powered adaptive learning platform that helps students identify skill gaps and build personalized learning paths based on their current skills, target role, and learning goals.

## Features

* User profile and career goal setup
* Skill-gap analysis
* Personalized learning roadmap
* Progress tracking
* Adaptive learning recommendations
* AI-powered learning assistance
* Supabase integration for user data and authentication

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Python
* FastAPI

### Database & Authentication

* Supabase

### AI

* Gemini API

## Project Structure

```text
EduPath/
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── supabase_setup.sql
│   └── data.json
│
├── .gitignore
└── README.md
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/reyaan0902/EduPath.git
cd EduPath
```

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will normally run on:

```text
http://localhost:5173
```

### 3. Backend setup

Open another terminal:

```bash
cd backend
```

Create and activate a Python virtual environment:

```bash
python -m venv .venv
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend will normally run on:

```text
http://localhost:8000
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

## Environment Variables

Create the required `.env` files locally.

**Do not upload `.env` files or API keys to GitHub.**

Example:

```text
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

Backend environment variables should contain the required Supabase and AI API configuration.

## How EduPath Works

```text
User Profile
     ↓
Current Skills + Target Role
     ↓
Skill Gap Analysis
     ↓
Learning Objectives
     ↓
Personalized Roadmap
     ↓
Progress Tracking
     ↓
Adaptive Recommendations
```

## Project Status

EduPath is currently under active development as a college/hackathon project.

## Author

**Reyaan Gosalia**

GitHub: https://github.com/reyaan0902
