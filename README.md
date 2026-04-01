# InvoiceAI — Smart GST Invoice Analyzer

> **AI-powered, 100% free, browser-based GST invoice data extractor with compliance validation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![HTML](https://img.shields.io/badge/Built%20with-HTML%2FJS%2FCSS-orange)](.)
[![AI Provider](https://img.shields.io/badge/AI-Groq%20%7C%20OpenRouter-green)](https://console.groq.com)
[![No Backend](https://img.shields.io/badge/Backend-None%20(Client--Side%20Only)-lightgrey)](.)

---

## 🌟 Overview

**InvoiceAI** is a fully client-side web application that lets you upload GST invoices (PDF or images), automatically extracts all key fields using OCR + AI, validates them against Indian GST compliance rules, and lets you ask questions about the invoice via an AI chat assistant — all for **free**, with no server required.

---

## ✨ Features

### 📤 Smart Invoice Upload
- Drag & drop or click-to-browse file upload
- **Batch upload** — process multiple invoices at once
- Supports **PDF** (multi-page), **JPG**, **PNG**, **WEBP**, **BMP**, **TIFF**
- Up to **25 MB** per file

### 🔍 AI-Powered Data Extraction (Free Providers)
- Uses **Groq** (Llama 3.3 70B — 30 req/min, completely free) or **OpenRouter** (free tier) as AI backends
- Three extraction modes:
  - **Regex Only** — works with zero API key
  - **AI-Powered** — highest accuracy using LLM
  - **Hybrid** — regex extraction + AI verification pass

### 📄 OCR Engine
- PDF text layer extraction via [PDF.js](https://mozilla.github.io/pdf.js/)
- Image OCR via [Tesseract.js](https://tesseract.projectnaptha.com/) (runs fully in-browser)
- Handles scanned documents, printed invoices, and native digital PDFs

### 🧾 Extracted GST Invoice Fields
| Category | Fields |
|---|---|
| Invoice Details | Invoice Number, Date, Place of Supply, Reverse Charge |
| Seller | Name, GSTIN, Address |
| Buyer | Name, GSTIN, Address |
| Tax Breakdown | CGST Rate & Amount, SGST Rate & Amount, IGST Rate & Amount, Cess |
| Totals | Taxable Value (Subtotal), Grand Total |
| Line Items | Description, HSN/SAC, Qty, Unit, Rate, Amount |

All fields are **editable** directly in the UI after extraction.

### ✅ GST Compliance Validator
- Validates **GSTIN format** (15-char pattern + checksum verification)
- Checks all **mandatory GST invoice fields** (Invoice No., Date, Seller GSTIN, Place of Supply, etc.)
- Validates **HSN/SAC codes** (4, 6, or 8 digits)
- Validates **CGST = SGST** parity
- Generates a **compliance score** (0–100%) with pass/warn/fail breakdown per field
- Labels: *Fully Compliant*, *Mostly Compliant*, *Partially Compliant*, *Non-Compliant*

### 💬 AI Invoice Chat Assistant
- Ask natural language questions about any extracted invoice
- Powered by the same free Groq/OpenRouter backend
- Pre-built suggestions:
  - 📋 Summarize invoice
  - ✅ Check GST compliance
  - 💰 Tax breakdown
  - 👥 Seller & Buyer details
  - 🔍 Find discrepancies
  - 📒 Generate accounting entry

### 📤 Export Options
- **JSON** export — full structured invoice data
- **CSV** export — spreadsheet-ready format
- **Export All History** — bulk export from local storage

### 🗂️ Local History
- All processed invoices saved to **browser localStorage**
- Browse, reload, and re-export past invoices
- Clear individual or all history entries

---

## 🚀 Getting Started

### Option 1 — Open Directly (No Install)
Since InvoiceAI is purely client-side:
1. Clone or download this repository
2. Open `index.html` directly in your browser (Chrome / Edge recommended)
3. That's it — no build step, no server needed!

```bash
git clone https://github.com/YOUR_USERNAME/invoice-analyzer.git
cd invoice-analyzer
# Double-click index.html, or:
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

### Option 2 — Serve Locally (Recommended for PDF.js)
PDF.js works better when served over HTTP. Use any static server:

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
# Install "Live Server" extension and click "Go Live"
```

Then open [http://localhost:8080](http://localhost:8080).

---

## 🔑 API Key Setup (For AI Mode)

InvoiceAI uses **free** AI APIs. No credit card required.

### Groq (Recommended — Fastest)
1. Sign up at [console.groq.com](https://console.groq.com) (free, ~2 min)
2. Go to **API Keys** → Create a new key (starts with `gsk_...`)
3. In the app, click **⚙ API Key** → paste key → Save

**Rate limit:** 30 requests/min (very generous for individual use)

### OpenRouter (Fallback)
1. Sign up at [openrouter.ai](https://openrouter.ai/keys) (free)
2. Copy your key (starts with `sk-or-...`)
3. Switch provider in the app settings to **OpenRouter**

> **Note:** The **Regex Only** mode works without any API key for basic field extraction.

---

## 🏗️ Project Structure

```
invoice-analyzer/
├── index.html              # Main app shell & UI layout
├── style.css               # All styles (glassmorphism dark theme)
└── src/
    ├── main.js             # App orchestration, event handling, UI state
    ├── aiExtractor.js      # Groq & OpenRouter API integration
    ├── fieldExtractor.js   # Regex-based field extraction
    ├── gstValidator.js     # GSTIN validation & GST compliance engine
    ├── ocrEngine.js        # Tesseract.js OCR wrapper
    ├── pdfParser.js        # PDF.js text extraction
    ├── invoiceChat.js      # AI chat assistant logic
    ├── exportManager.js    # JSON & CSV export utilities
    └── storageManager.js   # localStorage CRUD for invoice history
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | Vanilla CSS (glassmorphism, custom animations) |
| Logic | Vanilla JavaScript (ES6+ modules pattern) |
| PDF Parsing | [PDF.js 4.9](https://mozilla.github.io/pdf.js/) (CDN) |
| OCR | [Tesseract.js 5](https://tesseract.projectnaptha.com/) (CDN) |
| AI Extraction | [Groq API](https://groq.com) / [OpenRouter](https://openrouter.ai) |
| AI Model | Llama 3.3 70B Versatile |
| Storage | Browser `localStorage` |
| Fonts | Google Fonts — Inter |

**Zero build tools. Zero npm packages. Zero backend.**

---

## 📸 Screenshots

> Upload invoices, extract data automatically, validate GST compliance, and chat with AI about your invoice — all in one sleek dark-mode interface.

---

## 🔐 Privacy

- **No data leaves your browser** (except the OCR text sent to the AI API for extraction).
- API keys are stored in `localStorage` on your device only.
- No analytics, no tracking, no server.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla Foundation
- [Tesseract.js](https://tesseract.projectnaptha.com/) — OCR in the browser
- [Groq](https://groq.com) — Blazing fast free LLM inference
- [OpenRouter](https://openrouter.ai) — Free model fallback
- [Meta Llama 3.3](https://ai.meta.com/blog/meta-llama-3/) — The underlying AI model

---

<p align="center">Made with ❤️ for Indian businesses and accountants</p>
