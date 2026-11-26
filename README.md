# MediInsight AI — Healthcare Analytics System

**Capstone Project Title:** Design and Development of a Healthcare Analytics System Using Data Warehousing and Data Mining  
**Tagline:** Turning Healthcare Data into Intelligent Insights

**Team Members:**
- Shaik Ayesha Tabassum
- Pathan Zunereya
- P. Sana Banu
- R Harika

**Project Guide:** Dr. Praveen D S

---

## 1. Project Structure

```text
mediinsight-ai/
├── server.ts                  # Integrated Full-Stack Server (Node.js + Express + SQLite + Vite + Gemini AI)
├── server/
│   ├── demoDataset.ts         # Demonstration dataset generator (Prasad22 schema)
│   ├── dataEngine.ts          # CSV parser, quality profiler, privacy-preserving cleaner, KPI & hospital analytics
│   ├── warehouse.ts           # SQLite Star Schema (Fact_Admission + 5 Dimensions) & SQL OLAP engine
│   ├── mlEngine.ts            # Decision Tree, Random Forest, Logistic Regression, K-Means & Pattern Discovery
│   └── aiAssistant.ts         # Server-side @google/genai MediBot AI with deterministic fallback
├── backend/                   # Companion Python FastAPI + Pandas + Scikit-learn + SQLite Backend
│   ├── main.py                # FastAPI REST endpoints
│   ├── database.py            # SQLite Star Schema DDL
│   ├── etl.py                 # Pandas Extract-Transform-Load pipeline
│   ├── ml_models.py           # Scikit-learn classifiers & K-Means clustering
│   └── requirements.txt       # Python dependencies
├── src/
│   ├── App.tsx                # 14-page router & global state orchestration
│   ├── components/Layout.tsx  # Responsive sidebar shell + multilingual top bar
│   ├── i18n/translations.ts   # English, Tamil, and Hindi translations
│   ├── utils/pdfReports.ts    # jsPDF analytics, data quality, and ML report generators
│   ├── types/healthcare.ts    # Shared TypeScript domain interfaces
│   └── pages/                 # All 14 modular application pages
├── package.json
└── README.md
```

---

## 2. Dataset Integration (Kaggle Healthcare Dataset by Prasad22)

1. Download the CSV (`healthcare_dataset.csv`) from:  
   `https://www.kaggle.com/datasets/prasad22/healthcare-dataset`
2. Open **Data Collection** in the sidebar and drag-and-drop `healthcare_dataset.csv`.
3. Patient `Name` and `Doctor` identifiers are automatically hashed/redacted before entering dashboards or the SQLite Star Schema.
4. When no file is uploaded, MediInsight AI runs in clearly labelled **Demonstration Mode**.

---

## 3. VS Code Terminal Commands & Installation

### Option A: Run the Integrated Full-Stack Web App (Port 3000)

```bash
# 1. Install Node.js dependencies
npm install

# 2. (Optional) Configure Gemini API key in .env
cp .env.example .env
# Add GEMINI_API_KEY="your_key" inside .env

# 3. Start full-stack Express + Vite + SQLite server
npm run dev
```

Open `http://localhost:3000` in your browser.

### Option B: Run the Companion Python FastAPI Backend (Port 8000)

```bash
# 1. Create and activate a Python virtual environment
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate

# 2. Install Python dependencies
pip install -r backend/requirements.txt

# 3. Run FastAPI server
uvicorn backend.main:app --reload --port 8000 --app-dir backend
```
