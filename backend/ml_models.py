import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix


def run_classification_models(df: pd.DataFrame, target_col: str = "Test Results") -> list[dict]:
    feature_cols = ["Age", "Billing Amount", "Length of Stay", "Gender", "Medical Condition", "Admission Type"]
    feature_cols = [c for c in feature_cols if c != target_col and c in df.columns]

    X = df[feature_cols]
    y = df[target_col]

    num_cols = [c for c in ["Age", "Billing Amount", "Length of Stay"] if c in feature_cols]
    cat_cols = [c for c in feature_cols if c not in num_cols]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    models = {
        "Decision Tree": DecisionTreeClassifier(max_depth=6, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42),
        "Logistic Regression": LogisticRegression(max_iter=500, random_state=42),
    }

    results = []
    labels = sorted(y.unique().tolist())

    for name, clf in models.items():
        pipe = Pipeline([("prep", preprocessor), ("clf", clf)])
        pipe.fit(X_train, y_train)
        preds = pipe.predict(X_test)
        results.append(
            {
                "name": name,
                "accuracy": round(accuracy_score(y_test, preds) * 100, 2),
                "precision": round(precision_score(y_test, preds, average="macro", zero_division=0) * 100, 2),
                "recall": round(recall_score(y_test, preds, average="macro", zero_division=0) * 100, 2),
                "f1_score": round(f1_score(y_test, preds, average="macro", zero_division=0) * 100, 2),
                "labels": labels,
                "confusion_matrix": confusion_matrix(y_test, preds, labels=labels).tolist(),
            }
        )

    return results


def run_kmeans_segmentation(df: pd.DataFrame, k: int = 4) -> dict:
    cols = ["Age", "Billing Amount", "Length of Stay"]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df[cols])

    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    clusters = km.fit_predict(X_scaled)
    tagged = df.copy()
    tagged["Cluster"] = clusters

    summary = []
    for cid in range(k):
        sub = tagged[tagged["Cluster"] == cid]
        summary.append(
            {
                "cluster_id": cid + 1,
                "count": int(len(sub)),
                "avg_age": round(float(sub["Age"].mean()), 1),
                "avg_billing": round(float(sub["Billing Amount"].mean()), 2),
                "avg_stay": round(float(sub["Length of Stay"].mean()), 1),
                "top_condition": str(sub["Medical Condition"].mode().iloc[0]) if not sub.empty else "N/A",
            }
        )

    return {"k": k, "inertia": round(float(km.inertia_), 2), "clusters": summary}
