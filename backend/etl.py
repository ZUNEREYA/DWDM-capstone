import hashlib
import pandas as pd
import numpy as np
from database import get_connection, init_star_schema


def hash_patient_name(name: str, idx: int) -> str:
    raw = str(name).strip().lower() if pd.notna(name) and str(name).strip() else f"patient-{idx}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:8].upper()
    return f"PT-{digest}"


def assign_age_group(age: int) -> str:
    if age < 18:
        return "0-17"
    if age <= 30:
        return "18-30"
    if age <= 45:
        return "31-45"
    if age <= 60:
        return "46-60"
    if age <= 75:
        return "61-75"
    return "76+"


def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    raw_rows = len(df)
    missing_before = int(df.isna().sum().sum())
    duplicates_before = int(df.duplicated().sum())

    cleaned = df.drop_duplicates().copy()

    # Standardize categorical string columns
    cat_cols = [
        "Gender",
        "Medical Condition",
        "Hospital",
        "Insurance Provider",
        "Admission Type",
        "Medication",
        "Test Results",
    ]
    for col in cat_cols:
        if col in cleaned.columns:
            mode_val = cleaned[col].mode().iloc[0] if not cleaned[col].dropna().empty else "Unknown"
            cleaned[col] = (
                cleaned[col]
                .fillna(mode_val)
                .astype(str)
                .str.strip()
                .str.replace(r"\s+", " ", regex=True)
                .str.title()
            )

    if "Blood Type" in cleaned.columns:
        mode_bt = cleaned["Blood Type"].mode().iloc[0] if not cleaned["Blood Type"].dropna().empty else "O+"
        cleaned["Blood Type"] = cleaned["Blood Type"].fillna(mode_bt).astype(str).str.strip().str.upper()

    # Numerical imputation and anomaly correction
    cleaned["Age"] = pd.to_numeric(cleaned["Age"], errors="coerce")
    cleaned["Age"] = cleaned["Age"].fillna(cleaned["Age"].median()).round().astype(int).clip(0, 120)

    cleaned["Billing Amount"] = pd.to_numeric(cleaned["Billing Amount"], errors="coerce")
    cleaned["Billing Amount"] = cleaned["Billing Amount"].abs().fillna(cleaned["Billing Amount"].abs().median()).round(2)

    cleaned["Room Number"] = pd.to_numeric(cleaned["Room Number"], errors="coerce")
    cleaned["Room Number"] = cleaned["Room Number"].fillna(cleaned["Room Number"].median()).round().astype(int)

    # Dates & Length of Stay
    cleaned["Date of Admission"] = pd.to_datetime(cleaned["Date of Admission"], errors="coerce").fillna(pd.Timestamp("2024-01-15"))
    cleaned["Discharge Date"] = pd.to_datetime(cleaned["Discharge Date"], errors="coerce")
    invalid_discharge = cleaned["Discharge Date"].isna() | (cleaned["Discharge Date"] < cleaned["Date of Admission"])
    cleaned.loc[invalid_discharge, "Discharge Date"] = cleaned.loc[invalid_discharge, "Date of Admission"] + pd.Timedelta(days=5)
    cleaned["Length of Stay"] = (cleaned["Discharge Date"] - cleaned["Date of Admission"]).dt.days.clip(lower=1)

    # Privacy anonymization
    cleaned["Patient_Hash"] = [hash_patient_name(n, i) for i, n in enumerate(cleaned["Name"])]
    cleaned["Age_Group"] = cleaned["Age"].apply(assign_age_group)

    summary = {
        "records_extracted": raw_rows,
        "records_transformed": len(cleaned),
        "missing_before": missing_before,
        "duplicates_removed": duplicates_before,
    }
    return cleaned, summary


def load_star_schema(cleaned: pd.DataFrame) -> int:
    init_star_schema()
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("DELETE FROM Fact_Admission")
    cur.execute("DELETE FROM Dim_Patient")
    cur.execute("DELETE FROM Dim_Hospital")
    cur.execute("DELETE FROM Dim_Date")
    cur.execute("DELETE FROM Dim_Medical_Condition")
    cur.execute("DELETE FROM Dim_Insurance")

    for _, row in cleaned.iterrows():
        cur.execute(
            "INSERT OR IGNORE INTO Dim_Patient (patient_hash, age, age_group, gender, blood_type) VALUES (?, ?, ?, ?, ?)",
            (row["Patient_Hash"], int(row["Age"]), row["Age_Group"], row["Gender"], row["Blood Type"]),
        )
        p_key = cur.execute("SELECT patient_key FROM Dim_Patient WHERE patient_hash = ?", (row["Patient_Hash"],)).fetchone()[0]

        cur.execute(
            "INSERT OR IGNORE INTO Dim_Hospital (hospital_name, hospital_tier) VALUES (?, ?)",
            (row["Hospital"], "General Acute Care"),
        )
        h_key = cur.execute("SELECT hospital_key FROM Dim_Hospital WHERE hospital_name = ?", (row["Hospital"],)).fetchone()[0]

        dt = row["Date of Admission"]
        full_date = dt.strftime("%Y-%m-%d")
        cur.execute(
            "INSERT OR IGNORE INTO Dim_Date (full_date, year, quarter, month, month_name, day_of_week) VALUES (?, ?, ?, ?, ?, ?)",
            (full_date, dt.year, f"Q{(dt.month - 1)//3 + 1}", dt.month, dt.strftime("%b"), dt.strftime("%a")),
        )
        d_key = cur.execute("SELECT date_key FROM Dim_Date WHERE full_date = ?", (full_date,)).fetchone()[0]

        cur.execute(
            "INSERT OR IGNORE INTO Dim_Medical_Condition (condition_name, clinical_category) VALUES (?, ?)",
            (row["Medical Condition"], "Clinical Condition"),
        )
        c_key = cur.execute("SELECT condition_key FROM Dim_Medical_Condition WHERE condition_name = ?", (row["Medical Condition"],)).fetchone()[0]

        cur.execute(
            "INSERT OR IGNORE INTO Dim_Insurance (provider_name) VALUES (?)",
            (row["Insurance Provider"],),
        )
        i_key = cur.execute("SELECT insurance_key FROM Dim_Insurance WHERE provider_name = ?", (row["Insurance Provider"],)).fetchone()[0]

        cur.execute(
            """
            INSERT INTO Fact_Admission (
                patient_key, hospital_key, date_key, condition_key, insurance_key,
                admission_type, medication, test_results, billing_amount, room_number,
                discharge_date, length_of_stay, load_batch_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                p_key,
                h_key,
                d_key,
                c_key,
                i_key,
                row["Admission Type"],
                row["Medication"],
                row["Test Results"],
                float(row["Billing Amount"]),
                int(row["Room Number"]),
                row["Discharge Date"].strftime("%Y-%m-%d"),
                int(row["Length of Stay"]),
            ),
        )

    conn.commit()
    conn.close()
    return len(cleaned)
