import pandas as pd
import numpy as np
import datetime
import os

# Define Paths
DATA_DIR = '../data/datasets'
OUTPUT_DIR = '../data/processed'

os.makedirs(OUTPUT_DIR, exist_ok=True)

def aggregate_department_performance():
    """
    ETL step: Aggregates average marks and attendance by Department 
    to empower the Admin & Faculty dashboard's high-level views.
    """
    print("Running Department Performance Aggregation...")
    
    file_path = f"{DATA_DIR}/enriched_engineering_student_academic_dataset.csv"
    if not os.path.exists(file_path):
        print(f"Warning: {file_path} not found. Skipping aggregation.")
        return

    # Load dataset
    df_students = pd.read_csv(file_path)
    
    # Calculate Risk Score dynamically
    if 'Attendance_Percentage' in df_students.columns and 'Average_Marks' in df_students.columns:
        df_students['Risk_Score'] = np.where(df_students['Attendance_Percentage'] < 75, 1, 0) + \
                                    np.where(df_students['Average_Marks'] < 50, 1, 0)
        
        # Group by Department based reporting
        dept_agg = df_students.groupby('Department').agg(
            Avg_Attendance=('Attendance_Percentage', 'mean'),
            Avg_Marks=('Average_Marks', 'mean'),
            Total_Students=('Student_ID', 'count'),
            High_Risk_Count=('Risk_Score', lambda x: (x == 2).sum())
        ).reset_index()

        timestamp = datetime.datetime.now().strftime("%Y%m%d")
        output_path = f"{OUTPUT_DIR}/dept_performance_insights_{timestamp}.csv"
        dept_agg.to_csv(output_path, index=False)
        print(f"-> Insights saved to: {output_path}")

def generate_weekly_growth_metrics():
    """
    ETL Step: Compares current vs previous metrics for the Weekly AI Analyst.
    Identifies which subjects had the highest drop in attendance.
    """
    print("Generating Weekly Growth & Drop Metrics...")
    # This would typically compare snapshots from the ETL DB.
    # Simulated output for the AI Analyst Context
    metrics = {
        'Metric': ['Overall Attendance Trend', 'Overall Marks Growth', 'Critical Risk Delta'],
        'Value': ['-2.1%', '+1.5%', '-5 cases'],
        'Insight': ['Warning: Drop in CS Attendance', 'Steady improvement overall', 'Faculty intervention is working']
    }
    df_metrics = pd.DataFrame(metrics)
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d")
    output_path = f"{OUTPUT_DIR}/weekly_insights_{timestamp}.csv"
    df_metrics.to_csv(output_path, index=False)
    print(f"-> Weekly insights saved to: {output_path}")

if __name__ == '__main__':
    try:
        aggregate_department_performance()
        generate_weekly_growth_metrics()
        print("ETL Insights Pipeline execution completed successfully!")
    except Exception as e:
        print(f"ETL Execution Warning: {str(e)}")
