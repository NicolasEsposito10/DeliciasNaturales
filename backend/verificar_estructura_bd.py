"""
Script para verificar la estructura de la tabla producto en la base de datos
"""
import sqlite3
import os

# Ruta a la base de datos
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "instance", "database.db")

print("="*60)
print("🔍 VERIFICANDO ESTRUCTURA DE LA BASE DE DATOS")
print("="*60)
print(f"\n📁 Ruta BD: {db_path}")
print(f"📊 BD existe: {os.path.exists(db_path)}\n")

if not os.path.exists(db_path):
    print("❌ La base de datos no existe")
    exit(1)

# Conectar a la base de datos
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Obtener estructura de la tabla producto
print("📋 ESTRUCTURA DE LA TABLA 'producto':")
print("-"*60)

cursor.execute("PRAGMA table_info(producto)")
columns = cursor.fetchall()

for col in columns:
    col_id, name, col_type, not_null, default_value, pk = col
    print(f"  • {name:30} | {col_type:15} | {'PK' if pk else 'NOT NULL' if not_null else 'NULL'}")

print("\n" + "="*60)

conn.close()
