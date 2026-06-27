import joblib
import numpy as np
import pandas as pd
from pathlib import Path
MODEL_DIR = Path(__file__).parent.parent.parent / "trained_models"
models = {}
scaler = None
feature_columns = None
shap_explainer = None

def load_all():
    global models, scaler, feature_columns, shap_explainer
    global MODEL_DIR
    feature_columns = joblib.load(MODEL_DIR / "feature_columns.pkl")
    scaler = joblib.load(MODEL_DIR / "scaler.pkl")
    
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        models["xgboost"] = joblib.load(MODEL_DIR / "xgboost.pkl")
        models["random_forest"] = joblib.load(MODEL_DIR / "random-forest.pkl")
        models["logistic_regression"] = joblib.load(MODEL_DIR / "logistic-regression.pkl")
        shap_explainer = joblib.load(MODEL_DIR / "shap_explainer.pkl")
    
    print("All models loaded successfully")


def preprocess_input(data: dict) -> pd.DataFrame:
    """Convert raw form input to model-ready feature vector."""
    if feature_columns is None:
        load_all()
    age = float(data.get("age", 30))
    monthly_income = float(data.get("monthlyIncome", 5000))
    distance = float(data.get("distanceFromHome", 10))
    stock_option = float(data.get("stockOptionLevel", 0))
    wlb = float(data.get("workLifeBalance", 2))
    job_sat = float(data.get("jobSatisfaction", 2))
    env_sat = float(data.get("environmentSatisfaction", 2))
    overtime = data.get("overtime", "No")
    gender = data.get("gender", "Male")
    marital = data.get("maritalStatus", "Single")
    department = data.get("department", "Sales")
    job_role = data.get("jobRole", "Sales Executive")
    travel = data.get("businessTravel", "Travel_Rarely")
    
    years_at_company = float(data.get("yearsAtCompany", 3))
    years_in_role = float(data.get("yearsInCurrentRole", 2))
    years_since_promo = float(data.get("yearsSinceLastPromotion", 1))
    years_with_mgr = float(data.get("yearsWithCurrManager", 2))
    total_working = float(data.get("totalWorkingYears", 8))
    education = float(data.get("education", 3))
    job_involvement = float(data.get("jobInvolvement", 3))
    job_level = float(data.get("jobLevel", 2))
    num_companies = float(data.get("numCompaniesWorked", 2))
    pct_salary_hike = float(data.get("percentSalaryHike", 12))
    performance = float(data.get("performanceRating", 3))
    relationship_sat = float(data.get("relationshipSatisfaction", 3))
    training_times = float(data.get("trainingTimesLastYear", 2))
    daily_rate = float(data.get("dailyRate", 800))
    hourly_rate = float(data.get("hourlyRate", 65))
    monthly_rate = float(data.get("monthlyRate", 14000))

    income_per_year = monthly_income * 12
    promotion_gap = years_since_promo / max(years_at_company, 1)
    company_exp_ratio = years_at_company / max(total_working, 1)
    manager_stability = years_with_mgr / max(years_at_company, 1)
    workload_score = (1 if overtime == "Yes" else 0) * 2 + (2 if travel == "Travel_Frequently" else (1 if travel == "Travel_Rarely" else 0))
    salary_growth = pct_salary_hike / max(years_at_company, 1)

    row = {
        "Age": age, "DailyRate": daily_rate, "DistanceFromHome": distance,
        "Education": education, "EnvironmentSatisfaction": env_sat,
        "HourlyRate": hourly_rate, "JobInvolvement": job_involvement,
        "JobLevel": job_level, "JobSatisfaction": job_sat,
        "MonthlyIncome": monthly_income, "MonthlyRate": monthly_rate,
        "NumCompaniesWorked": num_companies, "PercentSalaryHike": pct_salary_hike,
        "PerformanceRating": performance, "RelationshipSatisfaction": relationship_sat,
        "StockOptionLevel": stock_option, "TotalWorkingYears": total_working,
        "TrainingTimesLastYear": training_times, "WorkLifeBalance": wlb,
        "YearsAtCompany": years_at_company, "YearsInCurrentRole": years_in_role,
        "YearsSinceLastPromotion": years_since_promo, "YearsWithCurrManager": years_with_mgr,
        "IncomePerYear": income_per_year, "PromotionGap": promotion_gap,
        "CompanyExperienceRatio": company_exp_ratio, "ManagerStability": manager_stability,
        "WorkloadScore": workload_score, "SalaryGrowth": salary_growth,
        "BusinessTravel_Travel_Frequently": 1 if travel == "Travel_Frequently" else 0,
        "BusinessTravel_Travel_Rarely": 1 if travel == "Travel_Rarely" else 0,
        "Department_Research & Development": 1 if department == "Research & Development" else 0,
        "Department_Sales": 1 if department == "Sales" else 0,
        "EducationField_Life Sciences": 0, "EducationField_Marketing": 0,
        "EducationField_Medical": 0, "EducationField_Other": 0,
        "EducationField_Technical Degree": 0,
        "Gender_Male": 1 if gender == "Male" else 0,
        "JobRole_Human Resources": 1 if job_role == "Human Resources" else 0,
        "JobRole_Laboratory Technician": 1 if job_role == "Laboratory Technician" else 0,
        "JobRole_Manager": 1 if job_role == "Manager" else 0,
        "JobRole_Manufacturing Director": 1 if job_role == "Manufacturing Director" else 0,
        "JobRole_Research Director": 1 if job_role == "Research Director" else 0,
        "JobRole_Research Scientist": 1 if job_role == "Research Scientist" else 0,
        "JobRole_Sales Executive": 1 if job_role == "Sales Executive" else 0,
        "JobRole_Sales Representative": 1 if job_role == "Sales Representative" else 0,
        "MaritalStatus_Married": 1 if marital == "Married" else 0,
        "MaritalStatus_Single": 1 if marital == "Single" else 0,
        "OverTime_Yes": 1 if overtime == "Yes" else 0,
    }

    df = pd.DataFrame([row])[feature_columns]
    return df


def preprocess_dataframe(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Preprocess a batch dataframe."""
    df = df_raw.copy()
    if feature_columns is None:
        load_all()
    n = len(df)

    def get_series(col: str, default):
        if col in df.columns:
            return pd.to_numeric(df[col], errors='coerce').fillna(default)
        return pd.Series([default] * n)
    
    # Basic numeric defaults
    numeric_cols = ["Age","DailyRate","DistanceFromHome","Education","EnvironmentSatisfaction",
                    "HourlyRate","JobInvolvement","JobLevel","JobSatisfaction","MonthlyIncome",
                    "MonthlyRate","NumCompaniesWorked","PercentSalaryHike","PerformanceRating",
                    "RelationshipSatisfaction","StockOptionLevel","TotalWorkingYears",
                    "TrainingTimesLastYear","WorkLifeBalance","YearsAtCompany","YearsInCurrentRole",
                    "YearsSinceLastPromotion","YearsWithCurrManager"]
    
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    monthly = get_series("MonthlyIncome", 5000)
    df["IncomePerYear"] = monthly * 12

    years_since = get_series("YearsSinceLastPromotion", 0)
    years_at_company = get_series("YearsAtCompany", 1).replace(0, 1)
    total_working = get_series("TotalWorkingYears", 1).replace(0, 1)
    years_with_mgr = get_series("YearsWithCurrManager", 0)

    df["PromotionGap"] = years_since / years_at_company
    df["CompanyExperienceRatio"] = years_at_company / total_working
    df["ManagerStability"] = years_with_mgr / years_at_company

    ot_col = df.get("OverTime", pd.Series(["No"] * n))
    travel_col = df.get("BusinessTravel", pd.Series(["Non-Travel"] * n))
    df["WorkloadScore"] = (ot_col == "Yes").astype(int) * 2 + (travel_col == "Travel_Frequently").astype(int) * 2 + (travel_col == "Travel_Rarely").astype(int)
    pct_hike = get_series("PercentSalaryHike", 12)
    df["SalaryGrowth"] = pct_hike / years_at_company

    # One-hot encode
    if "BusinessTravel" in df.columns:
        df["BusinessTravel_Travel_Frequently"] = (df["BusinessTravel"] == "Travel_Frequently").astype(int)
        df["BusinessTravel_Travel_Rarely"] = (df["BusinessTravel"] == "Travel_Rarely").astype(int)
    else:
        df["BusinessTravel_Travel_Frequently"] = 0
        df["BusinessTravel_Travel_Rarely"] = 0

    dept_col = df.get("Department", pd.Series(["Sales"]*len(df)))
    df["Department_Research & Development"] = (dept_col == "Research & Development").astype(int)
    df["Department_Sales"] = (dept_col == "Sales").astype(int)

    edu_fields = ["Life Sciences","Marketing","Medical","Other","Technical Degree"]
    edu_col = df.get("EducationField", pd.Series([""]*len(df)))
    for ef in edu_fields:
        df[f"EducationField_{ef}"] = (edu_col == ef).astype(int)

    gender_col = df.get("Gender", pd.Series(["Male"]*len(df)))
    df["Gender_Male"] = (gender_col == "Male").astype(int)

    roles = ["Human Resources","Laboratory Technician","Manager","Manufacturing Director",
             "Research Director","Research Scientist","Sales Executive","Sales Representative"]
    role_col = df.get("JobRole", pd.Series([""]*len(df)))
    for r in roles:
        df[f"JobRole_{r}"] = (role_col == r).astype(int)

    marital_col = df.get("MaritalStatus", pd.Series(["Single"]*len(df)))
    df["MaritalStatus_Married"] = (marital_col == "Married").astype(int)
    df["MaritalStatus_Single"] = (marital_col == "Single").astype(int)

    ot_col2 = df.get("OverTime", pd.Series(["No"]*len(df)))
    df["OverTime_Yes"] = (ot_col2 == "Yes").astype(int)

    # Only keep feature columns
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    
    return df[feature_columns]
