from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import io
import os
from pathlib import Path
import app.ml.loader as loader
from app.services.prediction import predict_single, batch_predict

router = APIRouter()

# State: holds uploaded or default dataset
_state = {"dataset": None}

# Auto-load IBM HR dataset on startup if present 
DEFAULT_DATASET_PATHS = [
    Path(__file__).parent.parent.parent / "datasets" / "raw-data.csv",
    Path(__file__).parent.parent.parent / "datasets" / "processed-data.csv",
    Path(__file__).parent.parent.parent / "datasets" / "data.csv",
]

def _try_load_default_dataset():
    for path in DEFAULT_DATASET_PATHS:
        if path.exists():
            try:
                df = pd.read_csv(path)
                _state["dataset"] = df
                print(f"✓ Default dataset loaded: {path.name} ({len(df)} rows)")
                return True
            except Exception as e:
                print(f"✗ Failed to load {path.name}: {e}")
    print("⚠ No default dataset found in datasets/ folder")
    return False

# Try to load default dataset at import time
_try_load_default_dataset()

# UPLOAD
@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    content = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(400, "Unsupported format. Please upload CSV or XLSX.")

        _state["dataset"] = df

        attrition_rate = None
        for col in ["Attrition", "attrition"]:
            if col in df.columns:
                vals = df[col].astype(str).str.lower()
                attrition_rate = round((vals == "yes").sum() / len(df) * 100, 1)
                break

        return {
            "success": True,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
            "attrition_rate": attrition_rate,
            "preview": df.head(5).fillna("").to_dict(orient="records"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {str(e)}")

# PREDICT
@router.post("/predict")
async def predict(data: dict):
    if loader.scaler is None:
        raise HTTPException(503, "Models still loading. Try again in a moment.")
    try:
        result = predict_single(data, data.get("model", "xgboost"))
        return result
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/simulate")
async def simulate(data: dict):
    if loader.scaler is None:
        raise HTTPException(503, "Models still loading. Try again in a moment.")
    try:
        result = predict_single(data, data.get("model", "xgboost"))
        return {
            "probability": result["probability"],
            "risk_category": result["risk_category"],
            "risk_status": result["risk_status"],
            "risk_score": result["risk_score"],
            "business_metrics": result["business_metrics"],
            "guidance": result["recommendations"],
        }
    except Exception as e:
        raise HTTPException(500, str(e))

# BATCH ANALYSIS
@router.post("/batch-analysis")
async def batch_analysis(data: dict):
    if _state["dataset"] is None:
        raise HTTPException(400, "No dataset available.")
    if loader.scaler is None:
        raise HTTPException(503, "Models still loading.")
    try:
        result = batch_predict(_state["dataset"], data.get("model", "xgboost"))
        return result
    except Exception as e:
        raise HTTPException(500, str(e))

# PERFORMANCE — update these numbers after running Notebook 4
@router.get("/performance")
async def performance():
    return {
        "xgboost": {
            "name": "XGBoost",
            "description": "Balanced Performance",
            "threshold": 0.3,
            "accuracy": 86.4,
            "precision": 60.0,
            "recall": 44.7,
            "f1": 51.2,
            "roc_auc": 79.0,
            "confusion_matrix": [[233, 14], [26, 21]],
        },
        "random_forest": {
            "name": "Random Forest",
            "description": "Max Risk Coverage",
            "threshold": 0.3,
            "accuracy": 78.2,
            "precision": 40.0,
            "recall": 72.3,
            "f1": 51.5,
            "roc_auc": 81.0,
            "confusion_matrix": [[196, 51], [13, 34]],
        },
        "logistic_regression": {
            "name": "Logistic Regression",
            "description": "High Interpretability",
            "threshold": 0.3,
            "accuracy": 65.6,
            "precision": 28.6,
            "recall": 76.6,
            "f1": 41.6,
            "roc_auc": 78.6,
            "confusion_matrix": [[157, 90], [11, 36]],
        },
    }

# FEATURE IMPORTANCE
@router.get("/feature-importance")
async def feature_importance():
    if loader.scaler is None:
        raise HTTPException(503, "Models not loaded yet.")
    model = loader.models.get("xgboost")
    if not model:
        raise HTTPException(500, "XGBoost model not available.")

    FEATURE_LABELS = {
        "OverTime_Yes": "Overtime", "MonthlyIncome": "Monthly Income",
        "Age": "Age", "YearsAtCompany": "Tenure",
        "DistanceFromHome": "Commute Distance",
        "JobSatisfaction": "Job Satisfaction",
        "EnvironmentSatisfaction": "Environment Satisfaction",
        "WorkLifeBalance": "Work-Life Balance",
        "StockOptionLevel": "Stock Options",
        "TotalWorkingYears": "Total Experience",
        "WorkloadScore": "Workload Score",
        "MaritalStatus_Single": "Marital (Single)",
        "NumCompaniesWorked": "Career Mobility",
        "YearsSinceLastPromotion": "Since Promotion",
        "JobInvolvement": "Job Involvement",
        "BusinessTravel_Travel_Frequently": "Frequent Travel",
        "PromotionGap": "Promotion Gap",
        "SalaryGrowth": "Salary Growth",
        "ManagerStability": "Manager Stability",
        "CompanyExperienceRatio": "Experience Ratio",
        "IncomePerYear": "Annual Income",
    }

    items = []
    for col, imp in zip(loader.feature_columns, model.feature_importances_):
        items.append({
            "feature": col,
            "label": FEATURE_LABELS.get(col, col.replace("_", " ")),
            "importance": round(float(imp) * 100, 2)
        })

    items.sort(key=lambda x: x["importance"], reverse=True)
    return {"features": items[:15]}


# DATASET ANALYTICS — fully automatic from loaded dataset
@router.get("/dataset-analytics")
async def dataset_analytics():
    if _state["dataset"] is None:
        raise HTTPException(400, "No dataset loaded.")

    df = _state["dataset"].copy()

    def safe_counts(series):
        return {str(k): int(v) for k, v in series.value_counts().items()}

    result = {
        "total_records": len(df),
        "total_features": len(df.columns),
    }

    # Attrition
    for col in ["Attrition", "attrition"]:
        if col in df.columns:
            result["attrition_distribution"] = safe_counts(df[col])
            vals = df[col].astype(str).str.lower()
            result["attrition_rate"] = round((vals == "yes").sum() / len(df) * 100, 1)
            result["stayed_count"] = int((vals == "no").sum())
            result["left_count"] = int((vals == "yes").sum())
            break

    # Department
    if "Department" in df.columns:
        result["department_distribution"] = safe_counts(df["Department"])
        # Attrition rate per department
        if "Attrition" in df.columns:
            dept_attr = {}
            for dept in df["Department"].unique():
                subset = df[df["Department"] == dept]["Attrition"].astype(str).str.lower()
                rate = round((subset == "yes").sum() / len(subset) * 100, 1)
                dept_attr[str(dept)] = rate
            result["department_attrition_rate"] = dept_attr

    # Job Role
    if "JobRole" in df.columns:
        result["job_role_distribution"] = safe_counts(df["JobRole"])
        if "Attrition" in df.columns:
            role_attr = {}
            for role in df["JobRole"].unique():
                subset = df[df["JobRole"] == role]["Attrition"].astype(str).str.lower()
                rate = round((subset == "yes").sum() / len(subset) * 100, 1)
                role_attr[str(role)] = rate
            result["role_attrition_rate"] = role_attr

    # Gender
    if "Gender" in df.columns:
        result["gender_distribution"] = safe_counts(df["Gender"])

    # Overtime
    if "OverTime" in df.columns:
        result["overtime_distribution"] = safe_counts(df["OverTime"])
        if "Attrition" in df.columns:
            ot_attr = {}
            for ot in df["OverTime"].unique():
                subset = df[df["OverTime"] == ot]["Attrition"].astype(str).str.lower()
                rate = round((subset == "yes").sum() / len(subset) * 100, 1)
                ot_attr[str(ot)] = rate
            result["overtime_attrition_rate"] = ot_attr

    # Marital Status
    if "MaritalStatus" in df.columns:
        result["marital_distribution"] = safe_counts(df["MaritalStatus"])

    # Business Travel
    if "BusinessTravel" in df.columns:
        result["travel_distribution"] = safe_counts(df["BusinessTravel"])

    # Age distribution + attrition by age bracket
    if "Age" in df.columns:
        ages = pd.to_numeric(df["Age"], errors="coerce").dropna()
        bins   = [18, 25, 30, 35, 40, 45, 50, 60, 100]
        labels = ["18-24","25-29","30-34","35-39","40-44","45-49","50-59","60+"]
        result["age_distribution"] = {}
        for i in range(len(labels)):
            result["age_distribution"][labels[i]] = int(
                ((ages >= bins[i]) & (ages < bins[i+1])).sum()
            )
        if "Attrition" in df.columns:
            df["_age_bracket"] = pd.cut(
                pd.to_numeric(df["Age"], errors="coerce"),
                bins=bins, labels=labels, right=False
            )
            age_attr = {}
            for bracket in labels:
                subset = df[df["_age_bracket"] == bracket]
                if len(subset) > 0:
                    vals = subset["Attrition"].astype(str).str.lower()
                    age_attr[bracket] = round((vals == "yes").sum() / len(subset) * 100, 1)
                else:
                    age_attr[bracket] = 0.0
            result["age_attrition_rate"] = age_attr
            df.drop(columns=["_age_bracket"], inplace=True)

    # Monthly Income distribution
    if "MonthlyIncome" in df.columns:
        inc    = pd.to_numeric(df["MonthlyIncome"], errors="coerce").dropna()
        bins   = [0, 2500, 5000, 7500, 10000, 15000, 10**6]
        labels = ["<2.5K","2.5-5K","5-7.5K","7.5-10K","10-15K",">15K"]
        result["income_distribution"] = {}
        for i in range(len(labels)):
            result["income_distribution"][labels[i]] = int(
                ((inc >= bins[i]) & (inc < bins[i+1])).sum()
            )

    # Satisfaction distributions
    if "JobSatisfaction" in df.columns:
        result["satisfaction_distribution"] = safe_counts(
            pd.to_numeric(df["JobSatisfaction"], errors="coerce").dropna().astype(int)
        )
    if "WorkLifeBalance" in df.columns:
        result["wlb_distribution"] = safe_counts(
            pd.to_numeric(df["WorkLifeBalance"], errors="coerce").dropna().astype(int)
        )
    if "EnvironmentSatisfaction" in df.columns:
        result["env_satisfaction_distribution"] = safe_counts(
            pd.to_numeric(df["EnvironmentSatisfaction"], errors="coerce").dropna().astype(int)
        )

    # Stock options
    if "StockOptionLevel" in df.columns:
        result["stock_option_distribution"] = safe_counts(
            pd.to_numeric(df["StockOptionLevel"], errors="coerce").dropna().astype(int)
        )

    # Years at company
    if "YearsAtCompany" in df.columns:
        yac = pd.to_numeric(df["YearsAtCompany"], errors="coerce").dropna()
        result["tenure_stats"] = {
            "mean": round(float(yac.mean()), 1),
            "median": round(float(yac.median()), 1),
            "max": int(yac.max()),
        }

    # Monthly income stats
    if "MonthlyIncome" in df.columns:
        inc = pd.to_numeric(df["MonthlyIncome"], errors="coerce").dropna()
        result["income_stats"] = {
            "mean": round(float(inc.mean()), 0),
            "median": round(float(inc.median()), 0),
            "min": round(float(inc.min()), 0),
            "max": round(float(inc.max()), 0),
        }

    return result