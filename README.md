# Retainify — Employee Attrition Prediction System

Retainify is an AI-powered web platform that predicts employee attrition risk using machine learning and explainable AI. It helps HR teams identify at-risk employees early, understand the key drivers behind turnover, and take data-driven retention action through an interactive dashboard with real-time simulation capabilities.

The platform supports individual employee prediction with SHAP-based factor explanations, batch workforce analysis, retention recommendations, and a live rentention simulator that recalculates attrition risk as HR variables are adjusted.

## Dataset

- Source: IBM HR Analytics Employee Attrition Dataset
- Link: https://www.kaggle.com/datasets/pavansubhasht/ibm-hr-analytics-attrition-dataset

The dataset contains 1,470 employee records used to train the prediction models.

## Tech Stack
- Machine Learning: Python, XGBoost, Random Forest, Logistic Regression, SHAP, scikit-learn, imbalanced-learn
- Backend: FastAPI, Uvicorn, pandas, joblib
- Frontend: React, TypeScript, Tailwind CSS, Recharts, Framer Motion, Axios
- Deployment: Render (backend), Vercel (frontend)

## Documentation

A detailed project report is included in the repository covering the full methodology, feature engineering, model training and evaluation, attrition driver analysis, and platform architecture from raw data through deployment.

## How to Use

1. Visit https://retainify-krithika5432-5429s-projects.vercel.app/
2. Go to Predict and upload your employee dataset
3. Fill in an employee's details and click Generate Attrition Prediction
4. View the risk score, key drivers, and retention recommendations
5. Use the Retention Simulator to test what-if scenarios
6. Check Dataset, Model Performance, and Batch Analysis for full workforce insights

## Dataset Format
Accepts CSV or Excel files. Include these columns for best accuracy:
`Age` `Department` `JobRole` `MonthlyIncome` `OverTime` `JobSatisfaction` `EnvironmentSatisfaction` `WorkLifeBalance` `StockOptionLevel` `YearsAtCompany` `BusinessTravel` `MaritalStatus` `Attrition`
Missing columns default to neutral values — prediction still works, just less precisely. 
