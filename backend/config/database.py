import os
import sqlite3
from datetime import datetime
import pytz

# Configuración de la base de datos
basedir = os.path.abspath(os.path.dirname(__file__))
database_path = os.path.join(basedir, "..", "instance", "database.db")

def get_db():
    """Función para obtener conexión directa a SQLite"""
    try:
        conn = sqlite3.connect(database_path)
        return conn
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        raise

def get_argentina_time():
    """Función para obtener hora argentina"""
    try:
        argentina_tz = pytz.timezone('America/Argentina/Buenos_Aires')
        return datetime.now(argentina_tz).strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        print(f"❌ Error obteniendo hora argentina: {e}")
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
