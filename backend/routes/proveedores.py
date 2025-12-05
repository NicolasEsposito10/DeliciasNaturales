from flask import Blueprint, request, jsonify
from config.database import get_db
from utils.helpers import process_request_data

proveedores_bp = Blueprint('proveedores', __name__)

@proveedores_bp.route('/proveedores')
def get_proveedores():
    try:
        print("=== OBTENIENDO PROVEEDORES ===")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM proveedor ORDER BY nombre')
        rows = cursor.fetchall()
        
        proveedores = []
        for row in rows:
            proveedores.append({
                'id': row[0],
                'nombre': row[1],
                'telefono': row[2] if len(row) > 2 else '',
                'email': row[3] if len(row) > 3 else ''
            })
        
        conn.close()
        print(f"=== RETORNANDO {len(proveedores)} PROVEEDORES ===")
        return jsonify(proveedores)
        
    except Exception as e:
        print(f"Error en get_proveedores: {e}")
        return jsonify({'error': str(e)}), 500

@proveedores_bp.route('/proveedores', methods=['POST'])
def crear_proveedor():
    try:
        print("=== CREANDO PROVEEDOR ===")
        
        data = process_request_data(request)
        print(f"Datos recibidos: {data}")
        
        if not data.get('nombre'):
            return jsonify({'error': 'El nombre es requerido'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('INSERT INTO proveedor (nombre, telefono, email) VALUES (?, ?, ?)',
                      (data['nombre'], data.get('telefono'), data.get('email')))
        
        proveedor_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"=== PROVEEDOR CREADO CON ID {proveedor_id} ===")
        return jsonify({
            'success': True,
            'message': 'Proveedor creado exitosamente',
            'id': proveedor_id
        }), 201
        
    except Exception as e:
        print(f"Error creando proveedor: {e}")
        return jsonify({'error': str(e)}), 500

@proveedores_bp.route('/proveedores/<int:id>', methods=['PUT'])
def modificar_proveedor(id):
    try:
        print(f"=== MODIFICANDO PROVEEDOR {id} ===")
        
        data = process_request_data(request)
        print(f"Datos recibidos: {data}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE proveedor SET nombre = ?, telefono = ?, email = ? WHERE id = ?',
                      (data.get('nombre'), data.get('telefono'), data.get('email'), id))
        
        conn.commit()
        conn.close()
        
        print(f"=== PROVEEDOR {id} MODIFICADO EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Proveedor actualizado exitosamente'
        })
        
    except Exception as e:
        print(f"Error modificando proveedor: {e}")
        return jsonify({'error': str(e)}), 500

@proveedores_bp.route('/proveedores/<int:id>', methods=['DELETE'])
def borrar_proveedor(id):
    try:
        print(f"=== ELIMINANDO PROVEEDOR {id} ===")
        conn = get_db()
        cursor = conn.cursor()
        
        # Verificar si hay productos que usan este proveedor
        cursor.execute('SELECT COUNT(*) FROM producto WHERE proveedor_id = ?', (id,))
        productos_usando = cursor.fetchone()[0]
        
        if productos_usando > 0:
            conn.close()
            return jsonify({
                'error': f'No se puede eliminar el proveedor porque {productos_usando} producto(s) lo están usando'
            }), 400
        
        cursor.execute('DELETE FROM proveedor WHERE id = ?', (id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Proveedor no encontrado'}), 404
        
        conn.commit()
        conn.close()
        
        print(f"=== PROVEEDOR {id} ELIMINADO EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Proveedor eliminado exitosamente'
        })
        
    except Exception as e:
        print(f"Error eliminando proveedor: {e}")
        return jsonify({'error': str(e)}), 500
