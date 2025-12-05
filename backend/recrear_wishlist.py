import sqlite3
import os

def recrear_tabla_wishlist():
    """Recrear la tabla de wishlist con SQL directo"""
    db_path = os.path.join('instance', 'database.db')
    
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada en: {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Eliminar la tabla existente si existe
        cursor.execute("DROP TABLE IF EXISTS wishlist")
        print("✅ Tabla wishlist eliminada")
        
        # Crear la nueva tabla
        cursor.execute('''
            CREATE TABLE wishlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                producto_id INTEGER NOT NULL,
                fecha_agregado TEXT NOT NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
                FOREIGN KEY (producto_id) REFERENCES producto (id),
                UNIQUE(usuario_id, producto_id)
            )
        ''')
        
        print("✅ Tabla wishlist creada correctamente")
        
        # Crear índices para mejorar performance
        cursor.execute('CREATE INDEX idx_wishlist_usuario ON wishlist(usuario_id)')
        cursor.execute('CREATE INDEX idx_wishlist_producto ON wishlist(producto_id)')
        print("✅ Índices creados")
        
        conn.commit()
        
    except Exception as e:
        print(f"❌ Error al recrear tabla: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    recrear_tabla_wishlist()
