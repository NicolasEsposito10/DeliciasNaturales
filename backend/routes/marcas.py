from flask import Blueprint, request, jsonify
from config.database import get_db
from utils.helpers import process_request_data

marcas_bp = Blueprint('marcas', __name__)

@marcas_bp.route('/marcas')
def get_marcas():
    try:
        print("=== OBTENIENDO MARCAS ===")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM marca ORDER BY nombre')
        rows = cursor.fetchall()
        
        marcas = []
        for row in rows:
            marcas.append({
                'id': row[0],
                'nombre': row[1]
            })
        
        conn.close()
        print(f"=== RETORNANDO {len(marcas)} MARCAS ===")
        return jsonify(marcas)
        
    except Exception as e:
        print(f"Error en get_marcas: {e}")
        return jsonify({'error': str(e)}), 500

@marcas_bp.route('/marcas', methods=['POST'])
def crear_marca():
    try:
        print("=== CREANDO MARCA ===")
        
        data = process_request_data(request)
        print(f"Datos recibidos: {data}")
        
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre es requerido'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO marca (nombre) VALUES (?)', (data['nombre'],))
        marca_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"=== MARCA CREADA CON ID {marca_id} ===")
        return jsonify({
            'success': True,
            'message': 'Marca creada exitosamente',
            'id': marca_id
        }), 201
        
    except Exception as e:
        print(f"Error creando marca: {e}")
        return jsonify({'error': str(e)}), 500

@marcas_bp.route('/marcas/<int:id>', methods=['PUT'])
def modificar_marca(id):
    try:
        print(f"=== MODIFICANDO MARCA {id} ===")
        
        data = process_request_data(request)
        print(f"Datos recibidos: {data}")
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE marca SET nombre = ? WHERE id = ?', (data.get('nombre'), id))
        conn.commit()
        conn.close()
        
        print(f"=== MARCA {id} MODIFICADA EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Marca actualizada exitosamente'
        })
        
    except Exception as e:
        print(f"Error modificando marca: {e}")
        return jsonify({'error': str(e)}), 500

@marcas_bp.route('/marcas/<int:id>', methods=['DELETE'])
def borrar_marca(id):
    try:
        print(f"=== ELIMINANDO MARCA {id} ===")
        conn = get_db()
        cursor = conn.cursor()
        
        # Verificar si hay productos que usan esta marca
        cursor.execute('SELECT COUNT(*) FROM producto WHERE marca_id = ?', (id,))
        productos_usando = cursor.fetchone()[0]
        
        if productos_usando > 0:
            conn.close()
            return jsonify({
                'error': f'No se puede eliminar la marca porque {productos_usando} producto(s) la están usando'
            }), 400
        
        cursor.execute('DELETE FROM marca WHERE id = ?', (id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Marca no encontrada'}), 404
        
        conn.commit()
        conn.close()
        
        print(f"=== MARCA {id} ELIMINADA EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Marca eliminada exitosamente'
        })
        
    except Exception as e:
        print(f"Error eliminando marca: {e}")
        return jsonify({'error': str(e)}), 500
