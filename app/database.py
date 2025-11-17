from dotenv import load_dotenv
import os
import psycopg2
# Force load .env from the parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "quinlob123"),
    "dbname": os.getenv("DB_NAME", "informationsystem")
}

print("Connecting to DB:", DB_CONFIG)  

def get_connection():
    
    return psycopg2.connect(**DB_CONFIG)
