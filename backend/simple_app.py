from flask import Flask
from flask_cors import CORS
import os
import sys

# Agregar el directorio actual al path para imports relativos
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

print("🔄 Iniciando importaciones...")

try:
    # Importar la instancia de db y modelos desde models.py
    from models import db, Usuario
    print("✅ Modelos importados correctamente")
except ImportError as e:
    print(f"❌ Error importando modelos: {e}")
    print("⚠️  Continuando sin modelos...")
    db = None
    Usuario = None

print("🚀 Creando aplicación Flask...")
app = Flask(__name__)
CORS(app)

# Configuración de la base de datos
basedir = os.path.abspath(os.path.dirname(__file__))
database_path = os.path.join(basedir, "instance", "database.db")

print(f"📁 Directorio base: {basedir}")
print(f"🗄️  Ruta de BD: {database_path}")
print(f"📊 BD existe: {os.path.exists(database_path)}")

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Agregar SECRET_KEY para JWT
app.config['SECRET_KEY'] = 'tu_clave_secreta_muy_segura_aqui_cambiar_en_produccion'

# Inicializar la app con la base de datos solo si db está disponible
if db is not None:
    try:
        db.init_app(app)
        print("✅ Base de datos SQLAlchemy inicializada")
    except Exception as e:
        print(f"❌ Error inicializando SQLAlchemy: {e}")
else:
    print("⚠️  SQLAlchemy no disponible, usando SQLite directo")

@app.route('/')
def index():
    return "Backend funcionando - Aplicación modularizada"

# Registrar todas las rutas modularizadas
try:
    from routes import register_routes
    register_routes(app)
    print("✅ Rutas modularizadas registradas exitosamente")
except ImportError as e:
    print(f"❌ Error importando rutas modularizadas: {e}")
    print("⚠️  Las rutas no se pudieron cargar correctamente")
    import traceback
    traceback.print_exc()

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 INICIANDO SERVIDOR FLASK MODULARIZADO")
    print("="*50)
    
    # Verificar dependencias críticas
    print("🔍 Verificando dependencias...")
    
    if not os.path.exists(database_path):
        print("❌ ERROR: Base de datos no existe.")
        print(f"📁 Esperada en: {database_path}")
        print("🔧 Ejecuta primero: python create_fresh_db.py")
        exit(1)
    else:
        print("✅ Base de datos encontrada")
    
    # Verificar conexión a BD y tablas críticas
    try:
        # Importar después de configurar el path
        from config.database import get_db
        test_conn = get_db()
        cursor = test_conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"📊 Tablas encontradas: {tables}")
        
        # Verificar tabla unidades
        if 'unidad' not in tables:
            print("⚠️  Tabla 'unidad' no encontrada")
            print("🔧 Ejecuta: python setup_complete_system.py")
            test_conn.close()
            exit(1)
        else:
            print("✅ Tabla 'unidad' encontrada")
        
        test_conn.close()
        print("✅ Conexión a BD exitosa")
    except Exception as e:
        print(f"❌ ERROR conectando a BD: {e}")
        import traceback
        traceback.print_exc()
        print("\n🔧 SOLUCIÓN:")
        print("1. Verifica que existan los archivos __init__.py en las carpetas config/ y utils/")
        print("2. Ejecuta: python simple_app.py desde la carpeta backend/")
        exit(1)
    
    print("\n📂 Estructura modularizada:")
    print("   • config/database.py - Configuración de BD")
    print("   • utils/helpers.py - Funciones auxiliares")
    print("   • routes/ - Rutas organizadas por funcionalidad")
    print("     ├── productos.py")
    print("     ├── proveedores.py")
    print("     ├── categorias.py")
    print("     ├── marcas.py")
    print("     ├── etiquetas.py")
    print("     ├── unidades.py")
    print("     ├── banners.py")
    print("     ├── imagenes.py")
    print("     ├── usuarios.py")
    print("     └── export.py")
    
    print("\n🌐 Servidor iniciándose en:")
    print("   • URL: http://localhost:5000")
    print("   • Host: 0.0.0.0")
    print("   • Puerto: 5000")
    print("   • Debug: True")
    print("   • Modo: Modularizado ✨")
    print("\n💡 Presiona Ctrl+C para detener")
    print("="*50)
    
    try:
        app.run(debug=True, port=5000, host='0.0.0.0')
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido por el usuario")
    except Exception as e:
        print(f"\n❌ Error ejecutando servidor: {e}")
        import traceback
        traceback.print_exc()