# EduSense AI - AI Academic Intelligence Platform

EduSense AI is a comprehensive, production-ready AI-powered education analytics system designed to bridge the gap between academic data and actionable student success metrics.

## 🚀 Key Features

*   **Role-Based Dashboards:** Distinct modern SaaS UIs for Admins, Faculty, and Students using React and TailwindCSS.
*   **AI Learning Assistant (RAG Chatbot):** Intelligent chat interface utilizing FAISS vector search and HuggingFace embeddings on course PDFs, combined with YouTube Data API playlist/video extraction.
*   **Academic Risk Prediction:** XGBoost ML model pipeline predicting student dropout/failure risk based on attendance, GPA trends, and engagement.
*   **ETL Data Pipeline:** Pandas scripts managed by Apache Airflow DAGs for ingesting student datasets.
*   **Voice AI Agents:** n8n graphical workflows triggering outbound/inbound Vapi AI voice calls for at-risk students and support.
*   **Containerized Architecture:** Fully dockerized stack (PostgreSQL, FastAPI, React/Vite, Airflow, n8n) via `docker-compose`.

## 🏗️ Tech Stack

*   **Frontend:** Vite, React, TailwindCSS + Custom CSS tokens, Recharts, Lucide Icons
*   **Backend:** FastAPI, Python, SQLAlchemy, JWT Auth, bcrypt
*   **Database:** PostgreSQL
*   **AI & ML:** Scikit-learn, XGBoost, LangChain, FAISS, Sentence-Transformers
*   **Workflow Automation:** n8n, Apache Airflow
*   **Containerization:** Docker, Docker Compose
*   **Integrations:** YouTube Data API v3, Vapi, Twilio

## 🏃 Testing & Running Locally

### Development Mode (Frontend Only Demo)
If you only wish to test the UI logic and aesthetics:
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start Vite dev server: `npm run dev`
4. Use the provided demo credentials on the Login screen.

### Full Stack Docker Deployment
To launch the entire platform, including databases, pipelines, and the backend:
1. Go to the project root: `cd "p:\EduSense AI"`
2. Execute Docker Compose: `docker compose up --build -d`

Docker runs the following services:
*   `localhost:5173` - Frontend UI
*   `localhost:8000` - FastAPI Swagger Docs
*   `localhost:8080` - Apache Airflow UI
*   `localhost:5678` - n8n Workflow Automation API
*   `localhost:5432` - PostgreSQL Database

## 👤 User Workflows
1.  **Admin:** Logs in, creates Faculty accounts (system auto-generates credentials), views universal metrics, dropout distributions.
2.  **Faculty:** Logs in using Admin credentials, adds students to their department, monitors specific class performance graphs, and identifies at-risk individuals.
3.  **Student:** Signs up independently, views personal SGPA graphs, interacts with the AI Assistant, and receives dynamic curriculum YouTube recommendations.
