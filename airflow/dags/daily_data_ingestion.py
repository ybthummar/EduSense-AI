from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'edusense_admin',
    'depends_on_past': False,
    'start_date': datetime(2023, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'daily_data_ingestion',
    default_args=default_args,
    description='Run daily ETL pipeline for student and marks ingestion',
    schedule_interval=timedelta(days=1),
    catchup=False,
) as dag:

    ingest_students = BashOperator(
        task_id='ingest_students',
        bash_command='python /opt/airflow/etl_pipeline/etl_students.py',
    )

    ingest_marks = BashOperator(
        task_id='ingest_marks',
        bash_command='python /opt/airflow/etl_pipeline/etl_marks.py',
    )

    ingest_students >> ingest_marks
