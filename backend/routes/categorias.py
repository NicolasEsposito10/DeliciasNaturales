from flask import Blueprint, request, jsonify
from config.database import get_db
from utils.helpers import process_request_data

categorias_bp = Blueprint('categorias', __name__)

@categorias_bp.route('/categorias')
def get_categorias():
    try:
        print("=== OBTENIENDO CATEGORÍAS ===")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM categoria ORDER BY nombre')
        rows = cursor.fetchall()
        
        categorias = []
        for row in rows:
            categorias.append({
                'id': row[0],
                'nombre': row[1]
            })
        
        conn.close()
        print(f"=== RETORNANDO {len(categorias)} CATEGORÍAS ===")
        return jsonify(categorias)
        
    except Exception as e:
        print(f"Error en get_categorias: {e}")
        return jsonify({'error': str(e)}), 500

@categorias_bp.route('/categorias', methods=['POST'])
def crear_categoria():
    try:
        print("=== CREANDO CATEGORÍA ===")
        
        data = process_request_data(request)
        print(f"Datos recibidos: {data}")
        
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre es requerido'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO categoria (nombre) VALUES (?)', (data['nombre'],))
        categoria_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"=== CATEGORÍA CREADA CON ID {categoria_id} ===")
        return jsonify({
            'success': True,
            'message': 'Categoría creada exitosamente',
            'id': categoria_id
        }), 201
        
    except Exception as e:
        print(f"Error creando categoría: {e}")
        return jsonify({'error': str(e)}), 500

@categorias_bp.route('/categorias/<int:id>', methods=['PUT'])
def modificar_categoria(id):
    try:
        print(f"=== MODIFICANDO CATEGORÍA {id} ===")
        
        data = process_request_data(request)
        print(f"Datos recibidos: {data}")
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE categoria SET nombre = ? WHERE id = ?', (data.get('nombre'), id))
        conn.commit()
        conn.close()
        
        print(f"=== CATEGORÍA {id} MODIFICADA EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Categoría actualizada exitosamente'
        })
        
    except Exception as e:
        print(f"Error modificando categoría: {e}")
        return jsonify({'error': str(e)}), 500

@categorias_bp.route('/categorias/<int:id>', methods=['DELETE'])
def borrar_categoria(id):
    try:
        print(f"=== ELIMINANDO CATEGORÍA {id} ===")
        conn = get_db()
        cursor = conn.cursor()
        
        # Verificar si hay productos que usan esta categoría
        cursor.execute('SELECT COUNT(*) FROM producto WHERE categoria_id = ?', (id,))
        productos_usando = cursor.fetchone()[0]
        
        if productos_usando > 0:
            conn.close()
            return jsonify({
                'error': f'No se puede eliminar la categoría porque {productos_usando} producto(s) la están usando'
            }), 400
        
        cursor.execute('DELETE FROM categoria WHERE id = ?', (id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Categoría no encontrada'}), 404
        
        conn.commit()
        conn.close()
        
        print(f"=== CATEGORÍA {id} ELIMINADA EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Categoría eliminada exitosamente'
        })
        
    except Exception as e:
        print(f"Error eliminando categoría: {e}")
        return jsonify({'error': str(e)}), 500
