<div align="center">


# ⚙️ SkillProof Backend API

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20.svg)](https://www.djangoproject.com/)
[![Celery](https://img.shields.io/badge/Celery-5.3-37814A.svg)](https://docs.celeryq.dev/)

*The core REST API and AI-Scoring engine powering the SkillProof platform.*

</div>

---

## 🌟 Overview

The SkillProof backend is built with **Django REST Framework** and handles everything from user authentication to complex AI-driven code evaluations. It utilizes **Celery** and **Redis** for asynchronous processing to ensure the API remains fast and non-blocking during heavy AI scoring tasks.

### 🔄 Asynchronous Task Flow

```mermaid
flowchart LR
    API[Django API] -->|Queues Task| Broker[(Redis)]
    Broker -->|Consumes| Worker[Celery Worker]
    Worker -->|Evaluates| AI[AI Scoring Engine]
    Worker -->|Saves Result| DB[(PostgreSQL)]
```

## 💻 Architecture Details
- **Core:** Python 3.11+
- **Framework:** Django REST Framework
- **Database:** PostgreSQL (via Supabase)
- **Async Queue:** Celery & Redis (via Upstash)
- **Transcription:** FFmpeg (for Whisper integration)

---

## 🚀 Getting Started

1. Install dependencies: `pip install -r requirements.txt`
2. Run migrations: `python manage.py migrate`
3. Start the server: `python manage.py runserver`

---

## 📄 License
This project is licensed under the [MIT License](../LICENSE).
