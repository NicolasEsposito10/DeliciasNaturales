from flask import Blueprint, request, jsonify
from config.database import get_db
from utils.helpers import process_request_data

etiquetas_bp = Blueprint('etiquetas', __name__)

@etiquetas_bp.route('/etiquetas')
def get_etiquetas():
    try:
        print("=== OBTENIENDO ETIQUETAS ===")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM tipo_alimento ORDER BY nombre')
        rows = cursor.fetchall()
        
        etiquetas = []
        for row in rows:
            etiquetas.append({
                'id': row[0],
                'nombre': row[1]
            })
        
        conn.close()
        print(f"=== RETORNANDO {len(etiquetas)} ETIQUETAS ===")
        return jsonify(etiquetas)
        
    except Exception as e:
        print(f"Error en get_etiquetas: {e}")
        return jsonify({'error': str(e)}), 500

# Mantener compatibilidad con rutas antiguas
@etiquetas_bp.route('/tipos-alimento')
def get_tipos_alimento():
    return get_etiquetas()

@etiquetas_bp.route('/etiquetas', methods=['POST'])
def crear_etiqueta():
    try:
        print("=== CREANDO ETIQUETA ===")
        
        data = process_request_data(request)
        print(f"Datos recibidos: {data}")
        
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre es requerido'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO tipo_alimento (nombre) VALUES (?)', (data['nombre'],))
        etiqueta_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"=== ETIQUETA CREADA CON ID {etiqueta_id} ===")
        return jsonify({
            'success': True,
            'message': 'Etiqueta creada exitosamente',
            'id': etiqueta_id
        }), 201
        
    except Exception as e:
        print(f"Error creando etiqueta: {e}")
        return jsonify({'error': str(e)}), 500

@etiquetas_bp.route('/etiquetas/<int:id>', methods=['PUT'])
def modificar_etiqueta(id):
    try:
        print(f"=== MODIFICANDO ETIQUETA {id} ===")
        
        data = process_request_data(request)
        print(f"Datos recibidos: {data}")
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE tipo_alimento SET nombre = ? WHERE id = ?', (data.get('nombre'), id))
        conn.commit()
        conn.close()
        
        print(f"=== ETIQUETA {id} MODIFICADA EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Etiqueta actualizada exitosamente'
        })
        
    except Exception as e:
        print(f"Error modificando etiqueta: {e}")
        return jsonify({'error': str(e)}), 500

@etiquetas_bp.route('/etiquetas/<int:id>', methods=['DELETE'])
def borrar_etiqueta(id):
    try:
        print(f"=== ELIMINANDO ETIQUETA {id} ===")
        conn = get_db()
        cursor = conn.cursor()
        
        # Verificar si hay productos que usan esta etiqueta
        cursor.execute('SELECT COUNT(*) FROM producto_etiquetas WHERE etiqueta_id = ?', (id,))
        productos_usando = cursor.fetchone()[0]
        
        if productos_usando > 0:
            conn.close()
            return jsonify({
                'error': f'No se puede eliminar la etiqueta porque {productos_usando} producto(s) la están usando'
            }), 400
        
        cursor.execute('DELETE FROM tipo_alimento WHERE id = ?', (id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Etiqueta no encontrada'}), 404
        
        conn.commit()
        conn.close()
        
        print(f"=== ETIQUETA {id} ELIMINADA EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Etiqueta eliminada exitosamente'
        })
        
    except Exception as e:
        print(f"Error eliminando etiqueta: {e}")
        return jsonify({'error': str(e)}), 500
