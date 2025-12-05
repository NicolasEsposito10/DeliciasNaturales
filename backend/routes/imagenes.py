from flask import Blueprint, request, jsonify
from config.database import get_db

imagenes_bp = Blueprint('imagenes', __name__)

@imagenes_bp.route('/productos/<int:producto_id>/imagenes', methods=['POST'])
def crear_imagen_producto(producto_id):
    try:
        print(f"=== CREANDO IMAGEN PARA PRODUCTO {producto_id} ===")
        print(f"request.files: {request.files}")
        print(f"request.form: {request.form}")
        
        if 'imagen' in request.files:
            archivo = request.files['imagen']
            titulo = request.form.get('titulo', '')
            posicion = int(request.form.get('posicion', 0))
            
            print(f"Archivo recibido: {archivo.filename}")
            print(f"Título: {titulo}")
            print(f"Posición: {posicion}")
            
            # Leer el archivo como binario
            imagen_data = archivo.read()
            print(f"Tamaño de imagen_data: {len(imagen_data)} bytes")
            
            conn = get_db()
            cursor = conn.cursor()
            
            # Verificar que el producto existe
            cursor.execute('SELECT id FROM producto WHERE id = ?', (producto_id,))
            if not cursor.fetchone():
                print(f"ERROR: Producto {producto_id} no existe")
                return jsonify({'error': 'Producto no encontrado'}), 404
            
            cursor.execute('''
                INSERT INTO imagen_producto 
                (url, imagen_blob, es_url, posicion, titulo, producto_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (None, imagen_data, False, posicion, titulo, producto_id))
            
            imagen_id = cursor.lastrowid
            print(f"Imagen insertada con ID: {imagen_id}")
            
            # Verificar que se insertó correctamente
            cursor.execute('SELECT COUNT(*) FROM imagen_producto WHERE producto_id = ?', (producto_id,))
            count = cursor.fetchone()[0]
            print(f"Total de imágenes para producto {producto_id}: {count}")
            
            conn.commit()
            conn.close()
            
            print(f"=== IMAGEN GUARDADA EXITOSAMENTE ===")
            return jsonify({'id': imagen_id}), 201
        else:
            print("ERROR: No se encontró archivo 'imagen' en request.files")
            return jsonify({'error': 'No se encontró archivo de imagen'}), 400
            
    except Exception as e:
        print(f"ERROR creando imagen: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@imagenes_bp.route('/productos/<int:producto_id>/imagenes')
def get_imagenes_producto(producto_id):
    try:
        print(f"=== OBTENIENDO IMÁGENES PARA PRODUCTO {producto_id} ===")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM imagen_producto WHERE producto_id = ? ORDER BY posicion', (producto_id,))
        rows = cursor.fetchall()
        
        print(f"Encontradas {len(rows)} imágenes en BD para producto {producto_id}")
        
        imagenes = []
        for row in rows:
            print(f"Imagen ID {row[0]}: es_url={row[3]}, posicion={row[4]}, titulo='{row[5]}'")
            imagen = {
                'id': row[0],
                'url': row[1] if row[3] else None,
                'imagen_base64': None,
                'es_url': bool(row[3]),
                'posicion': row[4],
                'titulo': row[5]
            }
            
            # Si tiene imagen_blob, convertir a base64
            if row[2]:  # imagen_blob
                import base64
                imagen['imagen_base64'] = base64.b64encode(row[2]).decode('utf-8')
                imagen['es_url'] = False
                print(f"  -> Convertida a base64 (tamaño: {len(row[2])} bytes)")
            
            imagenes.append(imagen)
        
        conn.close()
        print(f"=== RETORNANDO {len(imagenes)} IMÁGENES ===")
        return jsonify(imagenes)
        
    except Exception as e:
        print(f"ERROR obteniendo imágenes: {e}")
        return jsonify({'error': str(e)}), 500

@imagenes_bp.route('/productos/<int:producto_id>/imagenes/reordenar', methods=['PUT'])
def reordenar_imagenes(producto_id):
    try:
        data = request.json
        nuevas_posiciones = data.get('posiciones', [])
        
        conn = get_db()
        cursor = conn.cursor()
        
        for pos_data in nuevas_posiciones:
            cursor.execute('UPDATE imagen_producto SET posicion = ? WHERE id = ? AND producto_id = ?', 
                          (pos_data['posicion'], pos_data['id'], producto_id))
        
        conn.commit()
        conn.close()
        return jsonify({'msg': 'Imágenes reordenadas'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@imagenes_bp.route('/imagenes/<int:imagen_id>', methods=['DELETE'])
def borrar_imagen(imagen_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM imagen_producto WHERE id = ?', (imagen_id,))
        conn.commit()
        conn.close()
        return jsonify({'msg': 'Imagen eliminada'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
