import io
import os
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import get_connection, init_star_schema
from etl import clean_dataframe, load_star_schema
from ml_models import run_classification_models, run_kmeans_segmentation

load_dotenv()

app = FastAPI(title="MediInsight AI FastAPI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STATE = {"raw_df": None, "cleaned_df": None, "filename": None}


@app.on_event("startup")
def on_startup():
    init_star_schema()


@app.post("/api/dataset/upload")
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {exc}") from exc

    cleaned, summary = clean_dataframe(df)
    loaded_count = load_star_schema(cleaned)
    STATE["raw_df"] = df
    STATE["cleaned_df"] = cleaned
    STATE["filename"] = file.filename
    return {"filename": file.filename, "loaded_into_sqlite": loaded_count, **summary}


@app.post("/api/mining/run")
def run_mining(target_column: str = "Test Results", k: int = 4):
    if STATE["cleaned_df"] is None:
        raise HTTPException(status_code=400, detail="Upload a CSV dataset first.")
    df = STATE["cleaned_df"]
    return {
        "classification": run_classification_models(df, target_column),
        "clustering": run_kmeans_segmentation(df, k),
    }


@app.get("/api/warehouse/stats")
def warehouse_stats():
    conn = get_connection()
    tables = [
        "Fact_Admission",
        "Dim_Patient",
        "Dim_Hospital",
        "Dim_Date",
        "Dim_Medical_Condition",
        "Dim_Insurance",
    ]
    counts = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in tables}
    conn.close()
    return {"tables": counts, "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))}
