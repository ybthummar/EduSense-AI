from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.utils.dates import days_ago
from datetime import timedelta

# Define standard DAG arguments
default_args = {
    'owner': 'edusense_admin',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

# The DAG definition
with DAG(
    'weekly_insights_generator',
    default_args=default_args,
    description='A weekly ETL pipeline to compute department performance and automated Risk Insights',
    schedule_interval='@weekly',  # Run once a week
    start_date=days_ago(1),
    catchup=False,
    tags=['edusense', 'insights', 'analytics'],
) as dag:

    # Task: Run Data ingestion updates
    fetch_latest_data = BashOperator(
        task_id='ingest_updates',
        bash_command='python3 /root/edusense/etl_pipeline/etl_attendance.py && python3 /root/edusense/etl_pipeline/etl_students.py'
    )

    # Task: Execute the new insights pipeline script
    generate_insights = BashOperator(
        task_id='generate_advanced_insights',
        bash_command='python3 /root/edusense/etl_pipeline/etl_insights_pipeline.py'
    )

    # Airflow task dependencies
    fetch_latest_data >> generate_insights
