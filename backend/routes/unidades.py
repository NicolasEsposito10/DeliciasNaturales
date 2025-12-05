from flask import Blueprint, request, jsonify
from config.database import get_db
from utils.helpers import process_request_data

unidades_bp = Blueprint('unidades', __name__)

@unidades_bp.route('/unidades')
def get_unidades():
    try:
        print("=== OBTENIENDO UNIDADES ===")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM unidad ORDER BY nombre')
        rows = cursor.fetchall()
        
        unidades = []
        for row in rows:
            unidades.append({
                'id': row[0],
                'nombre': row[1],
                'abreviacion': row[2] if len(row) > 2 else '',
                'tipo': row[3] if len(row) > 3 else ''
            })
        
        conn.close()
        print(f"=== RETORNANDO {len(unidades)} UNIDADES ===")
        return jsonify(unidades)
        
    except Exception as e:
        print(f"Error en get_unidades: {e}")
        return jsonify({'error': str(e)}), 500

@unidades_bp.route('/unidades', methods=['POST'])
def crear_unidad():
    try:
        print("=== CREANDO UNIDAD ===")
        
        data = process_request_data(request)
        
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre es requerido'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM unidad WHERE nombre = ?', (data['nombre'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Ya existe una unidad con ese nombre'}), 400
        
        cursor.execute('INSERT INTO unidad (nombre, abreviacion, tipo) VALUES (?, ?, ?)', 
                      (data['nombre'], data.get('abreviacion', ''), data.get('tipo', 'peso')))
        
        unidad_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Unidad creada exitosamente',
            'id': unidad_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@unidades_bp.route('/unidades/<int:id>', methods=['PUT'])
def modificar_unidad(id):
    try:
        data = process_request_data(request)
        
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre es requerido'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE unidad SET nombre = ?, abreviacion = ?, tipo = ? WHERE id = ?',
                      (data['nombre'], data.get('abreviacion', ''), data.get('tipo', 'peso'), id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Unidad actualizada exitosamente'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@unidades_bp.route('/unidades/<int:id>', methods=['DELETE'])
def borrar_unidad(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verificar si hay productos que usan esta unidad
        cursor.execute('SELECT COUNT(*) FROM producto WHERE unidad_id = ?', (id,))
        productos_usando = cursor.fetchone()[0]
        
        if productos_usando > 0:
            conn.close()
            return jsonify({
                'error': f'No se puede eliminar la unidad porque {productos_usando} producto(s) la están usando'
            }), 400
        
        cursor.execute('DELETE FROM unidad WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Unidad eliminada exitosamente'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
