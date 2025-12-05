"""
Script de prueba para verificar el sistema de pedidos
"""
import os
import sys

# Agregar el directorio backend al path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from models import db, Pedido, PedidoItem, Usuario, Producto
from simple_app import app

print("="*60)
print("🧪 PROBANDO SISTEMA DE PEDIDOS")
print("="*60)

with app.app_context():
    try:
        # Verificar que las tablas existen
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        print("\n✅ Tablas verificadas:")
        print(f"   • pedidos: {'✓' if 'pedidos' in tables else '✗'}")
        print(f"   • pedido_items: {'✓' if 'pedido_items' in tables else '✗'}")
        
        # Verificar columnas de la tabla pedidos
        if 'pedidos' in tables:
            columns = [col['name'] for col in inspector.get_columns('pedidos')]
            print(f"\n📋 Columnas de tabla 'pedidos':")
            for col in columns:
                print(f"   • {col}")
        
        # Verificar columnas de la tabla pedido_items
        if 'pedido_items' in tables:
            columns = [col['name'] for col in inspector.get_columns('pedido_items')]
            print(f"\n📋 Columnas de tabla 'pedido_items':")
            for col in columns:
                print(f"   • {col}")
        
        # Contar pedidos existentes
        total_pedidos = Pedido.query.count()
        print(f"\n📊 Pedidos en la base de datos: {total_pedidos}")
        
        # Contar usuarios
        total_usuarios = Usuario.query.count()
        print(f"👥 Usuarios registrados: {total_usuarios}")
        
        # Contar productos
        total_productos = Producto.query.count()
        print(f"🛍️  Productos disponibles: {total_productos}")
        
        print("\n" + "="*60)
        print("✅ SISTEMA DE PEDIDOS VERIFICADO CORRECTAMENTE")
        print("="*60)
        print("\n💡 Próximos pasos:")
        print("   1. Iniciar el backend: python simple_app.py")
        print("   2. Iniciar el frontend: npm run dev")
        print("   3. Ir al carrito y probar la finalización de compra")
        
    except Exception as e:
        print(f"\n❌ Error al verificar el sistema: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
