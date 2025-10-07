# database.py
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
import os

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "quinlob123"),
    "dbname": os.getenv("DB_NAME", "Informationsystem")
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)
