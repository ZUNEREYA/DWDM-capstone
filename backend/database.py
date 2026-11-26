import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "mediinsight_warehouse.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_star_schema() -> None:
    conn = get_connection()
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS Dim_Patient (
            patient_key INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_hash TEXT UNIQUE NOT NULL,
            age INTEGER NOT NULL,
            age_group TEXT NOT NULL,
            gender TEXT NOT NULL,
            blood_type TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Dim_Hospital (
            hospital_key INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_name TEXT UNIQUE NOT NULL,
            hospital_tier TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Dim_Date (
            date_key INTEGER PRIMARY KEY AUTOINCREMENT,
            full_date TEXT UNIQUE NOT NULL,
            year INTEGER NOT NULL,
            quarter TEXT NOT NULL,
            month INTEGER NOT NULL,
            month_name TEXT NOT NULL,
            day_of_week TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Dim_Medical_Condition (
            condition_key INTEGER PRIMARY KEY AUTOINCREMENT,
            condition_name TEXT UNIQUE NOT NULL,
            clinical_category TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Dim_Insurance (
            insurance_key INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Fact_Admission (
            admission_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_key INTEGER NOT NULL,
            hospital_key INTEGER NOT NULL,
            date_key INTEGER NOT NULL,
            condition_key INTEGER NOT NULL,
            insurance_key INTEGER NOT NULL,
            admission_type TEXT NOT NULL,
            medication TEXT NOT NULL,
            test_results TEXT NOT NULL,
            billing_amount REAL NOT NULL,
            room_number INTEGER NOT NULL,
            discharge_date TEXT NOT NULL,
            length_of_stay INTEGER NOT NULL,
            load_batch_id INTEGER NOT NULL,
            FOREIGN KEY (patient_key) REFERENCES Dim_Patient(patient_key),
            FOREIGN KEY (hospital_key) REFERENCES Dim_Hospital(hospital_key),
            FOREIGN KEY (date_key) REFERENCES Dim_Date(date_key),
            FOREIGN KEY (condition_key) REFERENCES Dim_Medical_Condition(condition_key),
            FOREIGN KEY (insurance_key) REFERENCES Dim_Insurance(insurance_key)
        );
        """
    )
    conn.commit()
    conn.close()
