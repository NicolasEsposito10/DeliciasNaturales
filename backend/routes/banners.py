from flask import Blueprint, request, jsonify
from config.database import get_db
import sqlite3

banners_bp = Blueprint('banners', __name__)

@banners_bp.route('/banners')
def get_banners():
    try:
        print("=== OBTENIENDO BANNERS ===")
        conn = get_db()
        cursor = conn.cursor()
        
        show_all = request.args.get('all', '').lower() == 'true'
        print(f"Mostrar todos: {show_all}")
        
        if show_all:
            cursor.execute('SELECT * FROM banner ORDER BY orden')
        else:
            cursor.execute('SELECT * FROM banner WHERE activo = 1 ORDER BY orden')
        
        rows = cursor.fetchall()
        banners = []
        
        # Obtener nombres de columnas para mapear correctamente
        cursor.execute("PRAGMA table_info(banner)")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        print(f"Columnas de banner: {column_names}")
        
        for row in rows:
            print(f"Procesando banner ID: {row[0]}")
            
            # Mapear datos según las columnas disponibles
            banner = {
                'id': row[0],
                'titulo': row[1],
                'descripcion': row[2],
                'url_imagen': None,
                'imagen_base64': None,
                'es_url': False,
                'url_link': None,
                'activo': True,
                'orden': 0,
                'fecha_inicio': None,
                'fecha_fin': None,
                'color_borde': '#000000'
            }
            
            # Buscar índices de columnas específicas
            url_imagen_idx = column_names.index('url_imagen') if 'url_imagen' in column_names else None
            imagen_blob_idx = column_names.index('imagen_blob') if 'imagen_blob' in column_names else None
            es_url_idx = column_names.index('es_url') if 'es_url' in column_names else None
            url_link_idx = column_names.index('url_link') if 'url_link' in column_names else None
            activo_idx = column_names.index('activo') if 'activo' in column_names else None
            orden_idx = column_names.index('orden') if 'orden' in column_names else None
            color_borde_idx = column_names.index('color_borde') if 'color_borde' in column_names else None
            
            # Asignar valores según disponibilidad
            if url_imagen_idx is not None:
                banner['url_imagen'] = row[url_imagen_idx]
            if es_url_idx is not None:
                banner['es_url'] = bool(row[es_url_idx])
            if url_link_idx is not None:
                banner['url_link'] = row[url_link_idx]
            if activo_idx is not None:
                banner['activo'] = bool(row[activo_idx])
            if orden_idx is not None:
                banner['orden'] = row[orden_idx]
            if color_borde_idx is not None:
                banner['color_borde'] = row[color_borde_idx] or '#000000'
            
            # Manejar imagen_blob
            if imagen_blob_idx is not None and row[imagen_blob_idx]:
                print(f"Banner {row[0]} tiene imagen_blob de {len(row[imagen_blob_idx])} bytes")
                import base64
                banner['imagen_base64'] = base64.b64encode(row[imagen_blob_idx]).decode('utf-8')
                banner['es_url'] = False
                banner['url_imagen'] = None
                print(f"Imagen convertida a base64 (primeros 50 chars): {banner['imagen_base64'][:50]}...")
            elif banner['url_imagen']:
                print(f"Banner {row[0]} usa URL: {banner['url_imagen']}")
                banner['es_url'] = True
                banner['imagen_base64'] = None
            else:
                print(f"Banner {row[0]} no tiene imagen")
                banner['url_imagen'] = None
                banner['imagen_base64'] = None
                banner['es_url'] = False
            
            banners.append(banner)
        
        conn.close()
        print(f"=== RETORNANDO {len(banners)} BANNERS ===")
        for banner in banners:
            print(f"Banner {banner['id']}: tiene_base64={banner['imagen_base64'] is not None}, es_url={banner['es_url']}")
        
        return jsonify(banners)
        
    except Exception as e:
        print(f"Error en get_banners: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@banners_bp.route('/banners', methods=['POST'])
def crear_banner():
    try:
        print("=== INICIANDO CREACIÓN DE BANNER ===")
        print(f"Content-Type: {request.content_type}")
        print(f"request.form: {request.form}")
        print(f"request.files: {request.files}")
        
        # Detectar automáticamente el tipo de contenido y extraer datos
        data = {}
        imagen_blob = None
        es_url = False
        
        if request.content_type and 'application/json' in request.content_type:
            print("Procesando como JSON")
            data = request.get_json() or {}
            # Si viene por JSON, asumir que es URL
            if data.get('url_imagen'):
                es_url = True
        else:
            print("Procesando como form data")
            # Convertir form data a diccionario
            data = request.form.to_dict()
            # Convertir valores booleanos y numéricos
            if 'activo' in data:
                data['activo'] = data['activo'].lower() in ['true', '1', 'on']
            if 'orden' in data and data['orden'].isdigit():
                data['orden'] = int(data['orden'])
            
            # Verificar si hay archivo de imagen
            if 'imagen' in request.files:
                archivo = request.files['imagen']
                if archivo and archivo.filename:
                    print(f"Archivo de imagen recibido: {archivo.filename}")
                    imagen_blob = archivo.read()
                    print(f"Tamaño del blob: {len(imagen_blob)} bytes")
                    es_url = False
                    data['url_imagen'] = None  # No es URL sino archivo
            elif data.get('url_imagen'):
                print("URL de imagen proporcionada")
                es_url = True
        
        print(f"Datos procesados: {data}")
        print(f"Es URL: {es_url}, Tiene blob: {imagen_blob is not None}")
        
        # Validar que se recibieron datos
        if not data:
            print("ERROR: No se recibieron datos")
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        # Validar campos requeridos
        titulo = str(data.get('titulo', '')).strip()
        if not titulo:
            print("ERROR: Título es requerido")
            return jsonify({'error': 'El título es requerido'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verificar estructura de la tabla banner
        cursor.execute("PRAGMA table_info(banner)")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        print(f"Columnas de la tabla banner: {column_names}")
        
        # Obtener el próximo orden disponible
        cursor.execute('SELECT COALESCE(MAX(orden), -1) + 1 FROM banner')
        siguiente_orden = cursor.fetchone()[0]
        print(f"Siguiente orden disponible: {siguiente_orden}")
        
        # Preparar datos con valores por defecto seguros
        url_imagen = str(data.get('url_imagen', '')).strip() if data.get('url_imagen') else None
        
        # Si no hay URL ni blob, establecer valores como NULL
        if not url_imagen and not imagen_blob:
            url_imagen = None
            es_url = False
        
        # Verificar qué columnas existen para adaptar la inserción
        if 'imagen_blob' in column_names:
            print("Tabla tiene columna imagen_blob, insertando con BLOB")
            datos_banner = (
                titulo,
                str(data.get('descripcion', '')).strip() or None,
                url_imagen,
                imagen_blob,  # Este es el BLOB de la imagen
                es_url,
                str(data.get('url_link', '')).strip() or None,
                bool(data.get('activo', True)),
                data.get('orden', siguiente_orden),
                str(data.get('color_borde', '#000000')).strip()
            )
            
            cursor.execute('''
                INSERT INTO banner 
                (titulo, descripcion, url_imagen, imagen_blob, es_url, url_link, activo, orden, color_borde)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', datos_banner)
        else:
            print("Tabla NO tiene columna imagen_blob, insertando sin BLOB")
            datos_banner = (
                titulo,
                str(data.get('descripcion', '')).strip() or None,
                url_imagen,
                es_url,
                str(data.get('url_link', '')).strip() or None,
                bool(data.get('activo', True)),
                data.get('orden', siguiente_orden),
                str(data.get('color_borde', '#000000')).strip()
            )
            
            cursor.execute('''
                INSERT INTO banner 
                (titulo, descripcion, url_imagen, es_url, url_link, activo, orden, color_borde)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', datos_banner)
        
        banner_id = cursor.lastrowid
        print(f"Banner creado con ID: {banner_id}")
        
        # Verificar que se insertó correctamente
        cursor.execute('SELECT titulo, imagen_blob IS NOT NULL as tiene_blob, es_url FROM banner WHERE id = ?', (banner_id,))
        verificacion = cursor.fetchone()
        print(f"Verificación - Título: {verificacion[0]}, Tiene BLOB: {verificacion[1]}, Es URL: {verificacion[2]}")
        
        conn.commit()
        conn.close()
        
        print("=== BANNER CREADO EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Banner creado exitosamente',
            'id': banner_id
        }), 201
        
    except sqlite3.Error as e:
        print(f"ERROR de SQLite en crear_banner: {e}")
        return jsonify({'error': f'Error de base de datos: {str(e)}'}), 500
    except Exception as e:
        print(f"ERROR general en crear_banner: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@banners_bp.route('/banners/<int:id>', methods=['PUT'])
def actualizar_banner(id):
    try:
        print(f"=== ACTUALIZANDO BANNER {id} ===")
        print(f"Content-Type: {request.content_type}")
        print(f"request.files: {request.files}")
        print(f"request.form: {request.form}")
        
        # Detectar automáticamente el tipo de contenido y extraer datos
        data = {}
        imagen_blob = None
        es_url = False
        actualizar_imagen = False
        
        if request.content_type and 'application/json' in request.content_type:
            print("Procesando como JSON")
            data = request.get_json() or {}
            # Si viene por JSON y tiene url_imagen, es una URL
            if data.get('url_imagen'):
                es_url = True
                actualizar_imagen = True
        else:
            print("Procesando como form data")
            data = request.form.to_dict()
            
            # Convertir valores booleanos y numéricos
            if 'activo' in data:
                data['activo'] = data['activo'].lower() in ['true', '1', 'on']
            if 'orden' in data and data['orden'].isdigit():
                data['orden'] = int(data['orden'])
            
            # Verificar si hay archivo de imagen nuevo
            if 'imagen' in request.files:
                archivo = request.files['imagen']
                if archivo and archivo.filename:
                    print(f"Nuevo archivo de imagen recibido: {archivo.filename}")
                    imagen_blob = archivo.read()
                    print(f"Tamaño del nuevo blob: {len(imagen_blob)} bytes")
                    es_url = False
                    actualizar_imagen = True
                    data['url_imagen'] = None  # Limpiar URL si se sube archivo
            elif data.get('url_imagen'):
                print("Nueva URL de imagen proporcionada")
                es_url = True
                actualizar_imagen = True
                imagen_blob = None  # Limpiar blob si se usa URL
        
        print(f"Datos procesados: {data}")
        print(f"Actualizar imagen: {actualizar_imagen}, Es URL: {es_url}, Tiene blob: {imagen_blob is not None}")
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verificar que el banner existe
        cursor.execute('SELECT id FROM banner WHERE id = ?', (id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Banner no encontrado'}), 404
        
        # Verificar estructura de la tabla banner
        cursor.execute("PRAGMA table_info(banner)")
        columns_info = cursor.fetchall()
        column_names = [col[1] for col in columns_info]
        print(f"Columnas de la tabla banner: {column_names}")
        
        # Preparar datos básicos
        url_imagen = str(data.get('url_imagen', '')).strip() if data.get('url_imagen') else None
        
        # Construir la consulta de actualización según las columnas disponibles
        if 'imagen_blob' in column_names and actualizar_imagen:
            print("Actualizando con imagen (blob o URL)")
            cursor.execute('''
                UPDATE banner SET 
                    titulo = ?, descripcion = ?, url_imagen = ?, imagen_blob = ?, es_url = ?,
                    url_link = ?, activo = ?, orden = ?, color_borde = ?
                WHERE id = ?
            ''', (
                str(data.get('titulo', '')).strip(),
                str(data.get('descripcion', '')).strip(),
                url_imagen,
                imagen_blob,  # Será None si es URL, o el blob si es archivo
                es_url,
                str(data.get('url_link', '')).strip(),
                bool(data.get('activo', True)),
                data.get('orden', 0),
                str(data.get('color_borde', '#000000')).strip(),
                id
            ))
        elif 'imagen_blob' in column_names:
            print("Actualizando sin cambiar imagen")
            cursor.execute('''
                UPDATE banner SET 
                    titulo = ?, descripcion = ?, url_link = ?, activo = ?, orden = ?, color_borde = ?
                WHERE id = ?
            ''', (
                str(data.get('titulo', '')).strip(),
                str(data.get('descripcion', '')).strip(),
                str(data.get('url_link', '')).strip(),
                bool(data.get('activo', True)),
                data.get('orden', 0),
                str(data.get('color_borde', '#000000')).strip(),
                id
            ))
        else:
            print("Tabla sin columna imagen_blob, actualizando solo URL")
            cursor.execute('''
                UPDATE banner SET 
                    titulo = ?, descripcion = ?, url_imagen = ?, es_url = ?,
                    url_link = ?, activo = ?, orden = ?, color_borde = ?
                WHERE id = ?
            ''', (
                str(data.get('titulo', '')).strip(),
                str(data.get('descripcion', '')).strip(),
                url_imagen,
                es_url,
                str(data.get('url_link', '')).strip(),
                bool(data.get('activo', True)),
                data.get('orden', 0),
                str(data.get('color_borde', '#000000')).strip(),
                id
            ))
        
        # Verificar que se actualizó correctamente
        if actualizar_imagen and 'imagen_blob' in column_names:
            cursor.execute('SELECT titulo, imagen_blob IS NOT NULL as tiene_blob, es_url FROM banner WHERE id = ?', (id,))
            verificacion = cursor.fetchone()
            print(f"Verificación después de actualizar - Título: {verificacion[0]}, Tiene BLOB: {verificacion[1]}, Es URL: {verificacion[2]}")
        
        conn.commit()
        conn.close()
        
        print(f"=== BANNER {id} ACTUALIZADO EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Banner actualizado exitosamente',
            'id': id
        })
        
    except Exception as e:
        print(f"Error actualizando banner: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@banners_bp.route('/banners/<int:id>', methods=['DELETE'])
def borrar_banner(id):
    try:
        print(f"=== ELIMINANDO BANNER {id} ===")
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM banner WHERE id = ?', (id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Banner no encontrado'}), 404
        
        cursor.execute('DELETE FROM banner WHERE id = ?', (id,))
        
        conn.commit()
        conn.close()
        
        print(f"=== BANNER {id} ELIMINADO EXITOSAMENTE ===")
        return jsonify({
            'success': True,
            'message': 'Banner eliminado exitosamente'
        })
        
    except Exception as e:
        print(f"ERROR eliminando banner: {e}")
        return jsonify({'error': str(e)}), 500

@banners_bp.route('/banners/reordenar', methods=['PUT'])
def reordenar_banners():
    try:
        print("=== REORDENANDO BANNERS ===")
        
        data = {}
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json() or {}
        else:
            data = request.form.to_dict()
            if 'ordenes' in data:
                import json
                try:
                    data['ordenes'] = json.loads(data['ordenes'])
                except json.JSONDecodeError:
                    return jsonify({'error': 'Formato de órdenes inválido'}), 400
        
        nuevos_ordenes = data.get('ordenes', [])
        
        if not nuevos_ordenes:
            return jsonify({'error': 'No se proporcionaron órdenes para reordenar'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        for orden_data in nuevos_ordenes:
            if not isinstance(orden_data, dict) or 'id' not in orden_data or 'orden' not in orden_data:
                conn.close()
                return jsonify({'error': 'Formato de orden inválido'}), 400
                
            cursor.execute('UPDATE banner SET orden = ? WHERE id = ?', 
                          (orden_data['orden'], orden_data['id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Banners reordenados exitosamente'
        })
        
    except Exception as e:
        print(f"Error reordenando banners: {e}")
        return jsonify({'error': str(e)}), 500
