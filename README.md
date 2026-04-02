# InvoiceAI — Smart GST SaaS Analyzer

> **AI-powered full-stack SaaS application for GST invoice data extraction, validation, and analytics.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-HTML%2FJS%2FCSS-orange)](.)
[![Backend](https://img.shields.io/badge/Backend-Python%20%7C%20FastAPI-blue)](./backend)
[![Database](https://img.shields.io/badge/Database-SQLite%20%7C%20SQLAlchemy-lightgrey)](./backend)

---

## 🌟 Overview

**InvoiceAI** is a comprehensive SaaS platform that allows users to create accounts, upload GST invoices (PDF or images), automatically extract key fields using OCR + AI, validate them against Indian GST compliance rules, and interact with a Personal Dashboard that visualizes total spending and tax summaries.

---

## ✨ Features

### 🔐 User Authentication (SaaS)
- Secure user registration and login system
- Email and password validation utilizing **bcrypt** hashing
- Secure API communication using **JSON Web Tokens (JWT)**
- Multi-tenant architecture (invoices and analytics are sandboxed per user)

### 📊 Personal Analytics Dashboard
- Automatically computes insights on scanned invoices
- Fully integrated with **Chart.js**
- **Monthly Spending:** Beautiful bar charts mapping transactions over time
- **Tax Summary:** Pie charts tracking SGST, CGST, and IGST breakdowns

### 📤 Smart Invoice Upload
- Drag & drop or click-to-browse file upload
- **Batch upload** — process multiple invoices at once
- Up to **25 MB** per file (Supports PDF, JPG, PNG, WEBP, TIFF)

### 🔍 AI-Powered Data Extraction (Free Providers)
- Configured out-of-the-box for **Groq** (Llama 3.3) or **OpenRouter**
- Three extraction modes: Regex Only, AI-Powered, and Hybrid

### ✅ GST Compliance Validator
- Validates **GSTIN format** and all **mandatory GST fields**
- Validates **HSN/SAC codes** and checks **CGST = SGST** parity
- Generates a **compliance score** (0–100%)

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3) |
| **Object Relational Mapper** | [SQLAlchemy](https://www.sqlalchemy.org/) |
| **Database** | SQLite (Easily swappable with MySQL/PostgreSQL) |
| **Security & Auth** | JWT (`python-jose`), `bcrypt` |
| **Frontend Framework** | Vanilla HTML5 / CSS3 (Glassmorphism) |
| **Frontend Logic** | Vanilla JavaScript (ES6+ modular patterns) |
| **Data Visualization** | [Chart.js 4](https://www.chartjs.org/) |
| **OCR & PDF Parsing** | Tesseract.js & PDF.js |

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
Ensure you have **Python 3.9+** installed on your system.

### 2. Clone and Setup Environment
```bash
git clone https://github.com/YOUR_USERNAME/ai-invoice-analyzer.git
cd ai-invoice-analyzer

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows:
.\.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install fastapi "uvicorn[standard]" sqlalchemy python-multipart python-jose bcrypt
```

### 3. Run the Full-Stack Application
The backend server will serve both the APIs and your static frontend files perfectly.

```bash
uvicorn backend.main:app --reload --port 8000
```

### 4. Visit the Application
Open your browser and navigate to:
[http://localhost:8000](http://localhost:8000)

Your SQLite database (`invoice_saas.db`) will be automatically created on startup!

---

## 🔑 API Key Setup (For AI Mode)
InvoiceAI uses free AI APIs. You supply your own keys directly in the frontend Settings UI for maximum privacy.
1. Sign up at [console.groq.com](https://console.groq.com)
2. Obtain a free API key
3. Inside the app, click **⚙ API Key**, paste your key, and click Save.

---

## 🤝 Contributing
Pull requests are warmly welcome!
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m 'Add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
