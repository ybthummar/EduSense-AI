import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
import joblib
import os
from pathlib import Path

MODEL_PATH = str(Path(__file__).parent / "saved_models" / "risk_xgb.pkl")

def train_academic_risk_model(df: pd.DataFrame):
    """
    Trains an XGBoost model to predict student risk (Low, Medium, High).
    Expected Features: Attendance, GPA_Trend, Missing_Assignments, Interaction_Score
    Target: Risk_Level
    """
    if df.empty:
        return None
        
    features = ['attendance', 'gpa_trend', 'missing_assignments', 'interaction_score']
    
    X = df[features]
    y = df['risk_encoded'] # 0: Low, 1: Medium, 2: High
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=5)
    model.fit(X_train, y_train)
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    
    return model

def predict_student_risk(attendance, gpa_trend, missing_assignments, interaction_score):
    """
    Load model and predict single student risk
    """
    try:
        model = joblib.load(MODEL_PATH)
        pred = model.predict([[attendance, gpa_trend, missing_assignments, interaction_score]])
        
        mapping = {0: "Low", 1: "Medium", 2: "High"}
        return mapping.get(pred[0], "Unknown")
    except Exception as e:
        # Fallback heuristic if model not trained
        if attendance < 70 or gpa_trend < 0:
            return "High"
        elif attendance < 85:
            return "Medium"
        return "Low"
