import sqlite3
import os

def verificar_estructura_bd():
    """Verificar la estructura real de la base de datos"""
    db_path = os.path.join('instance', 'database.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada en: {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar estructura de tabla producto
        cursor.execute("PRAGMA table_info(producto)")
        columnas_producto = cursor.fetchall()
        
        print("📋 Estructura de tabla 'producto':")
        for col in columnas_producto:
            print(f"  - {col[1]} ({col[2]})")
        
        print("\n" + "="*50 + "\n")
        
        # Verificar estructura de tabla usuarios
        cursor.execute("PRAGMA table_info(usuarios)")
        columnas_usuarios = cursor.fetchall()
        
        print("📋 Estructura de tabla 'usuarios':")
        for col in columnas_usuarios:
            print(f"  - {col[1]} ({col[2]})")
            
        print("\n" + "="*50 + "\n")
        
        # Verificar si existe tabla wishlist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='wishlist'")
        wishlist_existe = cursor.fetchone()
        
        if wishlist_existe:
            cursor.execute("PRAGMA table_info(wishlist)")
            columnas_wishlist = cursor.fetchall()
            
            print("📋 Estructura de tabla 'wishlist':")
            for col in columnas_wishlist:
                print(f"  - {col[1]} ({col[2]})")
        else:
            print("❌ Tabla 'wishlist' no existe")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    verificar_estructura_bd()
