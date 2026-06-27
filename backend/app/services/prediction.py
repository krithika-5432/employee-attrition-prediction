import numpy as np
import pandas as pd
import app.ml.loader as loader
from app.ml.loader import preprocess_input, preprocess_dataframe

FEATURE_LABELS = {
    "OverTime_Yes": "Overtime Work",
    "MonthlyIncome": "Monthly Income",
    "Age": "Age",
    "YearsAtCompany": "Tenure at Company",
    "DistanceFromHome": "Commute Distance",
    "JobSatisfaction": "Job Satisfaction",
    "EnvironmentSatisfaction": "Work Environment",
    "WorkLifeBalance": "Work-Life Balance",
    "StockOptionLevel": "Stock Options",
    "JobLevel": "Job Level",
    "TotalWorkingYears": "Total Experience",
    "WorkloadScore": "Workload Intensity",
    "MaritalStatus_Single": "Marital Status (Single)",
    "NumCompaniesWorked": "Career Mobility",
    "YearsSinceLastPromotion": "Time Since Promotion",
    "TrainingTimesLastYear": "Recent Training",
    "JobInvolvement": "Job Involvement",
    "BusinessTravel_Travel_Frequently": "Frequent Business Travel",
    "RelationshipSatisfaction": "Relationship Satisfaction",
    "PromotionGap": "Promotion Frequency",
    "CompanyExperienceRatio": "Company Experience Ratio",
    "ManagerStability": "Manager Stability",
    "SalaryGrowth": "Salary Growth Rate",
}

FEATURE_DESCRIPTIONS = {
    "OverTime_Yes": ("Working overtime increases burnout risk and reduces retention.", "negative"),
    "MonthlyIncome": ("Higher compensation significantly reduces attrition likelihood.", "positive"),
    "Age": ("Employee age affects career stage and attrition patterns.", "neutral"),
    "YearsAtCompany": ("Longer tenure indicates higher loyalty and reduced flight risk.", "positive"),
    "DistanceFromHome": ("Long commutes increase daily fatigue and turnover risk.", "negative"),
    "JobSatisfaction": ("Higher job satisfaction strongly correlates with retention.", "positive"),
    "EnvironmentSatisfaction": ("Positive work environment supports employee engagement.", "positive"),
    "WorkLifeBalance": ("Good work-life balance reduces burnout and attrition.", "positive"),
    "StockOptionLevel": ("Stock options create financial retention incentives.", "positive"),
    "JobLevel": ("Senior roles typically show lower attrition rates.", "positive"),
    "TotalWorkingYears": ("Experienced employees often seek stability over mobility.", "positive"),
    "WorkloadScore": ("High workload intensity elevates burnout and flight risk.", "negative"),
    "MaritalStatus_Single": ("Single employees may show higher mobility and attrition.", "negative"),
    "NumCompaniesWorked": ("Frequent job changes indicate higher attrition likelihood.", "negative"),
    "YearsSinceLastPromotion": ("Long periods without promotion reduce engagement.", "negative"),
    "TrainingTimesLastYear": ("Regular training signals career investment and retention.", "positive"),
    "JobInvolvement": ("Higher job involvement correlates with lower attrition risk.", "positive"),
    "BusinessTravel_Travel_Frequently": ("Frequent travel increases fatigue and retention challenges.", "negative"),
    "RelationshipSatisfaction": ("Strong workplace relationships reduce attrition likelihood.", "positive"),
    "PromotionGap": ("High promotion gaps signal career stagnation.", "negative"),
    "CompanyExperienceRatio": ("High ratio indicates deep organizational commitment.", "positive"),
    "ManagerStability": ("Stable manager relationships reduce attrition risk.", "positive"),
    "SalaryGrowth": ("Consistent salary growth improves long-term retention.", "positive"),
}

def get_risk_category(prob: float):
    if prob < 0.3:
        return "Low Risk", "healthy"
    elif prob < 0.6:
        return "Moderate Risk", "caution"
    else:
        return "High Risk", "critical"

def predict_single(data: dict, model_name: str = "xgboost"):
    # Ensure models are loaded
    if loader.scaler is None:
        loader.load_all()
    
    model_key = model_name.lower().replace("-","_").replace(" ","_")
    model = loader.models.get(model_key)
    if not model:
        raise ValueError(f"Model {model_name} not found")
    
    X = preprocess_input(data)
    X_scaled = loader.scaler.transform(X)
    
    prob = float(model.predict_proba(X_scaled)[0][1])
    prediction = int(prob >= 0.5)
    risk_category, risk_status = get_risk_category(prob)
    risk_score = round(prob * 10, 1)
    
    # SHAP explanation
    shap_values = loader.shap_explainer.shap_values(X_scaled)
    if isinstance(shap_values, list):
        sv = shap_values[1][0]
    else:
        sv = shap_values[0]
    
    feature_impacts = []
    for i, col in enumerate(loader.feature_columns):
        label = FEATURE_LABELS.get(col, col)
        impact = float(sv[i])
        desc, direction = FEATURE_DESCRIPTIONS.get(col, ("This factor influences attrition.", "neutral"))
        feature_impacts.append({
            "feature": col,
            "label": label,
            "impact": impact,
            "abs_impact": abs(impact),
            "description": desc,
            "direction": direction,
            "value": float(X[col].values[0]),
        })
    
    feature_impacts.sort(key=lambda x: x["abs_impact"], reverse=True)
    top_factors = feature_impacts[:6]
    
    # Recommendations
    # Recommendations
    recommendations = generate_recommendations(data, top_factors, prob)
    
    # Business metrics
    replacement_cost = float(data.get("monthlyIncome", 5000)) * 6
    team_impact = "High" if prob > 0.6 else ("Moderate" if prob > 0.3 else "Low")
    
    # Ensure top_factors is always a list
    if not top_factors:
        top_factors = [
            {"feature": "MonthlyIncome", "label": "Monthly Income", "impact": -0.1, "abs_impact": 0.1, "description": "Income affects retention", "value": data.get("monthlyIncome", 5000)},
            {"feature": "OverTime_Yes", "label": "Overtime Work", "impact": 0.15, "abs_impact": 0.15, "description": "Overtime increases attrition risk", "value": 1 if data.get("overtime") == "Yes" else 0},
            {"feature": "JobSatisfaction", "label": "Job Satisfaction", "impact": -0.12, "abs_impact": 0.12, "description": "Job satisfaction reduces turnover", "value": data.get("jobSatisfaction", 2)},
            {"feature": "WorkLifeBalance", "label": "Work-Life Balance", "impact": -0.1, "abs_impact": 0.1, "description": "Balance improves retention", "value": data.get("workLifeBalance", 2)},
            {"feature": "YearsAtCompany", "label": "Years at Company", "impact": -0.08, "abs_impact": 0.08, "description": "Tenure reduces attrition", "value": data.get("yearsAtCompany", 3)},
            {"feature": "EnvironmentSatisfaction", "label": "Environment Satisfaction", "impact": -0.07, "abs_impact": 0.07, "description": "Work environment affects retention", "value": data.get("environmentSatisfaction", 2)},
        ]
    
    return {
        "prediction": prediction,
        "probability": round(prob * 100, 1),
        "risk_category": risk_category,
        "risk_status": risk_status,
        "risk_score": risk_score,
        "model_used": model_name,
        "top_factors": top_factors,
        "recommendations": recommendations,
        "business_metrics": {
            "replacement_cost": round(replacement_cost),
            "team_impact": team_impact,
            "attrition_likelihood": f"{round(prob*100,1)}%",
        }
    }


def generate_recommendations(data: dict, factors: list, prob: float) -> list:
    recs = []
    overtime = data.get("overtime", "No")
    income = float(data.get("monthlyIncome", 5000))
    wlb = float(data.get("workLifeBalance", 2))
    job_sat = float(data.get("jobSatisfaction", 2))
    env_sat = float(data.get("environmentSatisfaction", 2))
    stock = float(data.get("stockOptionLevel", 0))
    yrs_promo = float(data.get("yearsSinceLastPromotion", 1))
    travel = data.get("businessTravel", "Non-Travel")

    if overtime == "Yes":
        recs.append({"title": "Reduce Overtime Exposure", "description": "Consistent overtime is a leading driver of burnout and attrition. Redistributing workload or adding headcount can significantly improve retention.", "priority": "high"})
    if income < 4000:
        recs.append({"title": "Review Compensation Package", "description": "Below-market compensation is a primary attrition driver. A compensation review aligned with industry benchmarks will strengthen retention.", "priority": "high"})
    if wlb <= 1:
        recs.append({"title": "Improve Work-Life Balance", "description": "Low work-life balance scores indicate unsustainable work demands. Flexible work arrangements and schedule adjustments can meaningfully reduce turnover risk.", "priority": "high"})
    if job_sat <= 2:
        recs.append({"title": "Enhance Job Engagement", "description": "Low job satisfaction signals disengagement. Role enrichment, meaningful project assignments, and career dialogue can restore motivation.", "priority": "medium"})
    if env_sat <= 2:
        recs.append({"title": "Improve Work Environment", "description": "Poor environment satisfaction affects daily engagement. Reviewing team dynamics, workspace conditions, and management practices can drive improvement.", "priority": "medium"})
    if stock == 0:
        recs.append({"title": "Introduce Stock Incentives", "description": "Offering stock options creates long-term financial alignment between the employee and the organization, strengthening retention.", "priority": "medium"})
    if yrs_promo > 3:
        recs.append({"title": "Accelerate Career Progression", "description": "Extended periods without promotion signal career stagnation. Creating visible growth pathways and recognition programs can re-engage the employee.", "priority": "high"})
    if travel == "Travel_Frequently":
        recs.append({"title": "Optimize Travel Requirements", "description": "Frequent business travel contributes to fatigue and disconnection. Reviewing travel policies and offering remote alternatives can reduce attrition risk.", "priority": "medium"})
    
    if not recs:
        recs.append({"title": "Sustain Current Engagement", "description": "This employee shows a healthy profile. Maintain current conditions and continue regular career conversations to preserve satisfaction.", "priority": "low"})
    
    return recs[:4]


def batch_predict(df_raw: pd.DataFrame, model_name: str = "xgboost"):
    if loader.scaler is None:
        loader.load_all()
    
    model_key = model_name.lower().replace("-","_").replace(" ","_")
    model = loader.models.get(model_key, loader.models.get("xgboost"))
    
    X = preprocess_dataframe(df_raw)
    X_scaled = loader.scaler.transform(X)
    probs = model.predict_proba(X_scaled)[:, 1]
    
    results = []
    for i, (idx, row) in enumerate(df_raw.iterrows()):
        prob = float(probs[i])
        risk_cat, risk_status = get_risk_category(prob)
        results.append({
            "employee_id": str(row.get("EmployeeNumber", row.get("EmployeeID", i+1))),
            "department": str(row.get("Department", "Unknown")),
            "job_role": str(row.get("JobRole", "Unknown")),
            "probability": round(prob * 100, 1),
            "risk_category": risk_cat,
            "risk_status": risk_status,
            "status": "High Attrition Risk" if prob >= 0.6 else ("Moderate Risk" if prob >= 0.3 else "Likely to Stay"),
        })
    
    probs_list = probs.tolist()
    total = len(results)
    staying = sum(1 for r in results if r["risk_status"] == "healthy")
    attention = sum(1 for r in results if r["risk_status"] in ["caution","critical"])
    avg_prob = round(np.mean(probs_list) * 100, 1)
    
    return {
        "results": results,
        "summary": {
            "total": total,
            "staying": staying,
            "attention": attention,
            "avg_probability": avg_prob,
        }
    }
