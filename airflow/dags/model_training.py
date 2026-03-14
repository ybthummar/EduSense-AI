from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'ml_ops',
    'start_date': datetime(2023, 1, 1),
    'retries': 1,
    'retry_delay': timedelta(minutes=10),
}

with DAG(
    'model_training_pipeline',
    default_args=default_args,
    description='Retrain risk prediction XGBoost and refresh FAISS index',
    schedule_interval='@weekly',
    catchup=False,
) as dag:

    train_risk_model = BashOperator(
        task_id='train_risk_model',
        bash_command='python /opt/airflow/backend/ml/risk_model.py',
    )

    update_vector_store = BashOperator(
        task_id='update_vector_store',
        bash_command='python /opt/airflow/backend/rag/document_loader.py',
    )

    train_risk_model >> update_vector_store
