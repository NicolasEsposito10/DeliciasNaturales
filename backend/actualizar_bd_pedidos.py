"""
Script para agregar las tablas de pedidos a la base de datos existente
"""
import os
import sys

# Agregar el directorio backend al path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from models import db, Pedido, PedidoItem
from simple_app import app

print("="*60)
print("🔄 ACTUALIZANDO BASE DE DATOS - AGREGANDO TABLAS DE PEDIDOS")
print("="*60)

with app.app_context():
    try:
        # Crear las nuevas tablas
        print("\n📊 Creando tablas de pedidos...")
        db.create_all()
        print("✅ Tablas creadas/actualizadas exitosamente")
        
        # Verificar que las tablas fueron creadas
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        print("\n📋 Tablas en la base de datos:")
        for table in sorted(tables):
            print(f"   • {table}")
        
        # Verificar específicamente las tablas de pedidos
        if 'pedidos' in tables and 'pedido_items' in tables:
            print("\n✅ Tablas de pedidos creadas correctamente:")
            print("   • pedidos")
            print("   • pedido_items")
        else:
            print("\n⚠️  Advertencia: No se encontraron todas las tablas de pedidos")
        
        print("\n" + "="*60)
        print("✅ ACTUALIZACIÓN COMPLETADA")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error al actualizar la base de datos: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
