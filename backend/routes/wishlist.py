from flask import Blueprint, request, jsonify
import sqlite3
import jwt
from flask import current_app
from datetime import datetime

wishlist_bp = Blueprint('wishlist', __name__)

def get_db_connection():
    """Obtener conexión a la base de datos"""
    conn = sqlite3.connect('instance/database.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_user_from_token():
    """Helper function to extract user_id from JWT token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        print("❌ No auth header found")
        return None
    
    try:
        # Extraer el token del encabezado (formato: "Bearer <token>")
        token = auth_header.split(' ')[1]
        print(f"🔍 Token extraído: {token[:20]}...")
        
        # Decodificar el token
        datos = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = datos.get('user_id')
        print(f"✅ Usuario autenticado: {user_id}")
        return user_id
        
    except jwt.ExpiredSignatureError:
        print("❌ Token expirado")
        return None
    except jwt.InvalidTokenError as e:
        print(f"❌ Token inválido: {str(e)}")
        return None
    except IndexError:
        print("❌ Formato de Authorization header inválido")
        return None
    except Exception as e:
        print(f"❌ Error procesando token: {str(e)}")
        return None

@wishlist_bp.route('/api/wishlist', methods=['GET'])
def obtener_wishlist():
    """Obtener todos los productos en la wishlist del usuario actual"""
    try:
        print("🔍 Iniciando obtener_wishlist")
        usuario_id = get_user_from_token()
        if not usuario_id:
            print("❌ Usuario no autenticado")
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        print(f"✅ Usuario autenticado: {usuario_id}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        print("✅ Conexión a BD establecida")
        
        # Obtener items de wishlist con información básica del producto
        query = '''
        SELECT w.id as wishlist_id, w.fecha_agregado, w.producto_id,
               p.nombre, p.precio, p.disponible, p.descripcion,
               p.precio_costo, p.porcentaje_ganancia, p.precio_venta_publico,
               p.precio_fraccionado_por_100
        FROM wishlist w
        JOIN producto p ON w.producto_id = p.id
        WHERE w.usuario_id = ? AND p.disponible = 1
        ORDER BY w.fecha_agregado DESC
        '''
        
        cursor.execute(query, (usuario_id,))
        rows = cursor.fetchall()
        print(f"✅ Consulta ejecutada, {len(rows)} filas encontradas")
        
        # Convertir a lista de diccionarios
        items_completos = []
        for row in rows:
            producto_dict = {
                'id': row['producto_id'],
                'nombre': row['nombre'],
                'precio': row['precio'],
                'disponible': bool(row['disponible']),
                'descripcion': row['descripcion'],
                'precio_costo': row['precio_costo'],
                'porcentaje_ganancia': row['porcentaje_ganancia'],
                'precio_venta_publico': row['precio_venta_publico'],
                'precio_fraccionado_por_100': row['precio_fraccionado_por_100'],
                'proveedor': '',  # Valores por defecto
                'categoria': '',
                'marca': '',
                'unidad_nombre': '',
                'unidad_abrev': '',
                'wishlist_id': row['wishlist_id'],
                'fecha_agregado': row['fecha_agregado'],
                'imagenes': []
            }
            
            # Cargar imágenes del producto (opcional, se puede comentar para debug)
            try:
                cursor.execute('SELECT id, url, imagen_base64, es_url FROM imagen_producto WHERE producto_id = ?', 
                              (row['producto_id'],))
                imagenes = cursor.fetchall()
                producto_dict['imagenes'] = [dict(img) for img in imagenes]
            except Exception as img_error:
                print(f"⚠️ Error cargando imágenes para producto {row['producto_id']}: {str(img_error)}")
                producto_dict['imagenes'] = []
            
            items_completos.append(producto_dict)
        
        conn.close()
        print(f"✅ Retornando {len(items_completos)} items")
        return jsonify(items_completos), 200
        
    except Exception as e:
        print(f"Error al obtener wishlist: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@wishlist_bp.route('/api/wishlist', methods=['POST'])
def agregar_a_wishlist():
    """Agregar un producto a la wishlist"""
    try:
        usuario_id = get_user_from_token()
        if not usuario_id:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        data = request.get_json()
        producto_id = data.get('producto_id')
        
        if not producto_id:
            return jsonify({'error': 'ID de producto requerido'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar que el producto existe y está disponible
        cursor.execute('SELECT id, disponible FROM producto WHERE id = ?', (producto_id,))
        producto = cursor.fetchone()
        
        if not producto:
            conn.close()
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        if not producto['disponible']:
            conn.close()
            return jsonify({'error': 'Producto no disponible'}), 400
        
        # Verificar si ya está en wishlist
        cursor.execute('SELECT id FROM wishlist WHERE usuario_id = ? AND producto_id = ?', 
                      (usuario_id, producto_id))
        existe = cursor.fetchone()
        
        if existe:
            conn.close()
            return jsonify({'error': 'El producto ya está en tu wishlist'}), 409
        
        # Agregar a wishlist
        fecha_actual = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO wishlist (usuario_id, producto_id, fecha_agregado)
            VALUES (?, ?, ?)
        ''', (usuario_id, producto_id, fecha_actual))
        
        wishlist_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Producto agregado a wishlist',
            'wishlist_item': {
                'id': wishlist_id,
                'usuario_id': usuario_id,
                'producto_id': producto_id,
                'fecha_agregado': fecha_actual
            }
        }), 201
        
    except Exception as e:
        print(f"Error al agregar a wishlist: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@wishlist_bp.route('/api/wishlist/<int:producto_id>', methods=['DELETE'])
def remover_de_wishlist(producto_id):
    """Remover un producto de la wishlist"""
    try:
        usuario_id = get_user_from_token()
        if not usuario_id:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Buscar el item en la wishlist
        cursor.execute('SELECT id FROM wishlist WHERE usuario_id = ? AND producto_id = ?', 
                      (usuario_id, producto_id))
        item = cursor.fetchone()
        
        if not item:
            conn.close()
            return jsonify({'error': 'Producto no encontrado en wishlist'}), 404
        
        # Eliminar el item
        cursor.execute('DELETE FROM wishlist WHERE usuario_id = ? AND producto_id = ?',
                      (usuario_id, producto_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Producto removido de wishlist'}), 200
        
    except Exception as e:
        print(f"Error al remover de wishlist: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@wishlist_bp.route('/api/wishlist/check/<int:producto_id>', methods=['GET'])
def verificar_en_wishlist(producto_id):
    """Verificar si un producto está en la wishlist del usuario"""
    try:
        usuario_id = get_user_from_token()
        if not usuario_id:
            return jsonify({'en_wishlist': False}), 200
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM wishlist WHERE usuario_id = ? AND producto_id = ?',
                      (usuario_id, producto_id))
        item = cursor.fetchone()
        conn.close()
        
        return jsonify({'en_wishlist': item is not None}), 200
        
    except Exception as e:
        print(f"Error al verificar wishlist: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@wishlist_bp.route('/api/wishlist/count', methods=['GET'])
def contar_wishlist():
    """Obtener cantidad de productos en wishlist"""
    try:
        usuario_id = get_user_from_token()
        if not usuario_id:
            return jsonify({'count': 0}), 200
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM wishlist WHERE usuario_id = ?', (usuario_id,))
        result = cursor.fetchone()
        conn.close()
        
        return jsonify({'count': result['count']}), 200
        
    except Exception as e:
        print(f"Error al contar wishlist: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@wishlist_bp.route('/api/wishlist/clear', methods=['DELETE'])
def limpiar_wishlist():
    """Limpiar toda la wishlist del usuario"""
    try:
        usuario_id = get_user_from_token()
        if not usuario_id:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Contar items antes de eliminar
        cursor.execute('SELECT COUNT(*) as count FROM wishlist WHERE usuario_id = ?', (usuario_id,))
        count = cursor.fetchone()['count']
        
        # Eliminar todos los items de la wishlist del usuario
        cursor.execute('DELETE FROM wishlist WHERE usuario_id = ?', (usuario_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': f'Wishlist limpiada. {count} productos removidos.'
        }), 200
        
    except Exception as e:
        print(f"Error al limpiar wishlist: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500
