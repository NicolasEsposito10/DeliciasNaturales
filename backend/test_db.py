import sqlite3
import os

def test_database():
    """Test simple de la base de datos"""
    db_path = 'instance/database.db'
    
    print(f"Probando conexión a: {db_path}")
    print(f"Archivo existe: {os.path.exists(db_path)}")
    
    if not os.path.exists(db_path):
        print("❌ Archivo de base de datos no existe")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar tablas existentes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print("\n📋 Tablas en la base de datos:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Verificar estructura de wishlist si existe
        if ('wishlist',) in tables:
            cursor.execute("PRAGMA table_info(wishlist)")
            columns = cursor.fetchall()
            print("\n📋 Estructura de tabla wishlist:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
        
        # Contar registros en wishlist
        if ('wishlist',) in tables:
            cursor.execute("SELECT COUNT(*) FROM wishlist")
            count = cursor.fetchone()[0]
            print(f"\n📊 Registros en wishlist: {count}")
        
        conn.close()
        print("\n✅ Test de base de datos completado")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_database()
