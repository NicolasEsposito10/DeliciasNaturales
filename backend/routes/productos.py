from flask import Blueprint, request, jsonify
from config.database import get_db, get_argentina_time
from utils.helpers import process_request_data, validate_required_fields

productos_bp = Blueprint('productos', __name__)

@productos_bp.route('/productos')
def get_productos():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT p.*, pr.nombre as proveedor, c.nombre as categoria, m.nombre as marca,
                   u.nombre as unidad_nombre, u.abreviacion as unidad_abrev
            FROM producto p
            JOIN proveedor pr ON p.proveedor_id = pr.id
            JOIN categoria c ON p.categoria_id = c.id
            JOIN marca m ON p.marca_id = m.id
            LEFT JOIN unidad u ON p.unidad_id = u.id
            ORDER BY p.id
        ''')
        
        rows = cursor.fetchall()
        productos = []
        
        for row in rows:
            # Obtener etiquetas del producto
            cursor.execute('''
                SELECT ta.id, ta.nombre
                FROM tipo_alimento ta
                JOIN producto_etiquetas pe ON ta.id = pe.etiqueta_id
                WHERE pe.producto_id = ?
            ''', (row[0],))
            
            etiquetas = [{'id': e[0], 'nombre': e[1]} for e in cursor.fetchall()]
            
            # Obtener imágenes del producto
            cursor.execute('''
                SELECT id, url, imagen_blob, es_url, posicion, titulo
                FROM imagen_producto 
                WHERE producto_id = ? 
                ORDER BY posicion
            ''', (row[0],))
            
            imagenes_rows = cursor.fetchall()
            imagenes = []
            for img_row in imagenes_rows:
                imagen = {
                    'id': img_row[0],
                    'url': img_row[1] if img_row[3] else None,
                    'imagen_base64': None,
                    'es_url': bool(img_row[3]),
                    'posicion': img_row[4],
                    'titulo': img_row[5]
                }
                # Si tiene imagen_blob, convertir a base64
                if img_row[2]:
                    import base64
                    imagen['imagen_base64'] = base64.b64encode(img_row[2]).decode('utf-8')
                    imagen['es_url'] = False
                    
                imagenes.append(imagen)
            
            # Mapear campos según la nueva estructura
            producto = {
                'id': row[0],
                'nombre': row[1],
                'precio': row[2],
                'disponible': bool(row[3]),
                'descripcion': row[4],
                'precio_costo': row[5],
                'porcentaje_ganancia': row[6],
                'precio_venta_publico': row[7],
                'fecha_ultima_modificacion': row[8],
                'proveedor_id': row[9],
                'categoria_id': row[10],
                'marca_id': row[11],
                'unidad_id': row[12] if len(row) > 12 else None,
                'cantidad_unidades': row[13] if len(row) > 13 else 1,
                'cantidad': row[14] if len(row) > 14 else 100,
                'precio_por_unidad': row[15] if len(row) > 15 else 0,
                'precio_fraccionado_por_100': row[16] if len(row) > 16 else 0,
                'tipo_calculo': row[17] if len(row) > 17 else 'peso',
                'proveedor': row[-5],
                'categoria': row[-4],
                'marca': row[-3],
                'unidad_nombre': row[-2] if len(row) > 20 else None,
                'unidad_abrev': row[-1] if len(row) > 20 else None,
                'etiquetas': etiquetas,
                'etiquetas_ids': [e['id'] for e in etiquetas],
                'imagenes': imagenes
            }
            productos.append(producto)
        
        conn.close()
        return jsonify(productos)
        
    except Exception as e:
        print(f"Error en get_productos: {e}")
        return jsonify({'error': str(e)}), 500

@productos_bp.route('/productos/por-categoria')
def get_productos_por_categoria():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT c.id, c.nombre, 
                   p.id, p.nombre, p.precio, p.descripcion, 
                   m.nombre as marca,
                   COUNT(*) OVER (PARTITION BY c.id) as total_productos
            FROM categoria c
            JOIN producto p ON c.id = p.categoria_id
            JOIN marca m ON p.marca_id = m.id
            WHERE p.disponible = 1
            ORDER BY c.id, p.id
        ''')
        
        rows = cursor.fetchall()
        
        categorias_dict = {}
        for row in rows:
            cat_id = row[0]
            if cat_id not in categorias_dict:
                categorias_dict[cat_id] = {
                    'id': cat_id,
                    'nombre': row[1],
                    'productos': [],
                    'total_productos': row[7],
                    'hay_mas': row[7] > 4
                }
            
            # Obtener etiquetas del producto
            cursor.execute('''
                SELECT ta.id, ta.nombre
                FROM tipo_alimento ta
                JOIN producto_etiquetas pe ON ta.id = pe.etiqueta_id
                WHERE pe.producto_id = ?
            ''', (row[2],))
            
            etiquetas = [{'id': e[0], 'nombre': e[1]} for e in cursor.fetchall()]
            
            # Obtener imágenes del producto
            cursor.execute('''
                SELECT id, url, imagen_blob, es_url, posicion, titulo
                FROM imagen_producto 
                WHERE producto_id = ? 
                ORDER BY posicion
            ''', (row[2],))
            
            imagenes_rows = cursor.fetchall()
            imagenes = []
            for img_row in imagenes_rows:
                imagen = {
                    'id': img_row[0],
                    'url': img_row[1] if img_row[3] else None,
                    'imagen_base64': None,
                    'es_url': bool(img_row[3]),
                    'posicion': img_row[4],
                    'titulo': img_row[5]
                }
                if img_row[2]:
                    import base64
                    imagen['imagen_base64'] = base64.b64encode(img_row[2]).decode('utf-8')
                    imagen['es_url'] = False
                    
                imagenes.append(imagen)
            
            if len(categorias_dict[cat_id]['productos']) < 4:
                categorias_dict[cat_id]['productos'].append({
                    'id': row[2],
                    'nombre': row[3],
                    'precio': row[4],
                    'descripcion': row[5],
                    'marca': row[6],
                    'etiquetas': etiquetas,
                    'imagenes': imagenes
                })
        
        conn.close()
        return jsonify(list(categorias_dict.values()))
        
    except Exception as e:
        print(f"Error en get_productos_por_categoria: {e}")
        return jsonify({'error': str(e)}), 500

@productos_bp.route('/productos', methods=['POST'])
def crear_producto():
    try:
        print("=== CREANDO PRODUCTO ===")
        
        data = process_request_data(request)
        print(f"Datos recibidos: {data}")
        
        # Validar campos requeridos
        error = validate_required_fields(data, ['nombre', 'precio_costo', 'porcentaje_ganancia', 'unidad_id'])
        if error:
            return jsonify({'error': error}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Determinar tipo de cálculo
        tipo_calculo = data.get('tipo_calculo', 'peso')
        print(f"Tipo de cálculo: {tipo_calculo}")
        
        # Convertir valores según el tipo de cálculo
        precio_costo = float(data.get('precio_costo', 0))
        porcentaje_ganancia = float(data.get('porcentaje_ganancia', 0))
        
        # FÓRMULA CORREGIDA: precio_costo + (precio_costo * porcentaje_ganancia)
        precio_final = precio_costo + (precio_costo * porcentaje_ganancia)
        
        print(f"Precio costo: {precio_costo}")
        print(f"Porcentaje ganancia (decimal): {porcentaje_ganancia}")
        print(f"Precio final calculado: {precio_final}")
        
        # Verificar qué columnas existen en la tabla producto
        cursor.execute("PRAGMA table_info(producto)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Columnas disponibles: {columns}")
        
        # Definir variables según el tipo de cálculo
        if tipo_calculo == 'unidad':
            # CASO 1: Por unidades
            cantidad_unidades = int(data.get('cantidad_unidades', 1)) if data.get('cantidad_unidades') is not None else 1
            precio_por_unidad = float(data.get('precio_por_unidad', 0)) if data.get('precio_por_unidad') is not None else 0
            cantidad = None
            precio_fraccionado_por_100 = None
        else:
            # CASO 2: Por peso/volumen
            cantidad = float(data.get('cantidad', 100)) if data.get('cantidad') is not None else 100
            precio_fraccionado_por_100 = float(data.get('precio_fraccionado_por_100', 0)) if data.get('precio_fraccionado_por_100') is not None else 0
            cantidad_unidades = None
            precio_por_unidad = None
        
        # Preparar datos base
        datos_base = {
            'nombre': data.get('nombre'),
            'precio_costo': precio_costo,
            'porcentaje_ganancia': porcentaje_ganancia,
            'precio': precio_final,
            'precio_venta_publico': precio_final,
            'disponible': bool(data.get('disponible', True)),
            'proveedor_id': int(data.get('proveedor_id')),
            'categoria_id': int(data.get('categoria_id')),
            'marca_id': int(data.get('marca_id')),
            'unidad_id': int(data.get('unidad_id')),
            'descripcion': data.get('descripcion', ''),
            'fecha_ultima_modificacion': get_argentina_time()
        }
        
        # Agregar campos específicos según disponibilidad en la tabla
        if 'tipo_calculo' in columns:
            datos_base['tipo_calculo'] = tipo_calculo
        
        if 'cantidad_unidades' in columns:
            datos_base['cantidad_unidades'] = cantidad_unidades
        
        if 'cantidad' in columns:
            datos_base['cantidad'] = cantidad
        
        if 'precio_por_unidad' in columns:
            datos_base['precio_por_unidad'] = precio_por_unidad
        
        if 'precio_fraccionado_por_100' in columns:
            datos_base['precio_fraccionado_por_100'] = precio_fraccionado_por_100
        
        # Construir consulta SQL dinámicamente
        columnas = list(datos_base.keys())
        valores = list(datos_base.values())
        placeholders = ', '.join(['?' for _ in columnas])
        columnas_str = ', '.join(columnas)
        
        sql = f"INSERT INTO producto ({columnas_str}) VALUES ({placeholders})"
        
        print(f"SQL: {sql}")
        print(f"Valores: {valores}")
        
        cursor.execute(sql, valores)
        producto_id = cursor.lastrowid
        
        # Agregar etiquetas si se proporcionaron
        if 'etiquetas_ids' in data and data['etiquetas_ids']:
            for etiqueta_id in data['etiquetas_ids']:
                cursor.execute('INSERT INTO producto_etiquetas (producto_id, etiqueta_id) VALUES (?, ?)', 
                              (producto_id, etiqueta_id))
        
        conn.commit()
        conn.close()
        
        print(f"=== PRODUCTO CREADO CON ID {producto_id} ===")
        return jsonify({
            'success': True,
            'message': 'Producto creado exitosamente',
            'id': producto_id
        }), 201
        
    except Exception as e:
        print(f"Error creando producto: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@productos_bp.route('/productos/<int:id>', methods=['PUT'])
def modificar_producto(id):
    try:
        data = request.json
        print(f"=== ACTUALIZANDO PRODUCTO {id} ===")
        print(f"Datos recibidos: {data}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Verificar qué columnas existen
        cursor.execute("PRAGMA table_info(producto)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Determinar tipo de cálculo
        tipo_calculo = data.get('tipo_calculo', 'peso')
        print(f"Tipo de cálculo: {tipo_calculo}")
        
        # Convertir valores básicos
        precio_costo = float(data.get('precio_costo', 0))
        porcentaje_ganancia = float(data.get('porcentaje_ganancia', 0))
        
        # FÓRMULA CORREGIDA: precio_costo + (precio_costo * porcentaje_ganancia)
        precio_final = precio_costo + (precio_costo * porcentaje_ganancia)
        
        print(f"Precio costo: {precio_costo}")
        print(f"Porcentaje ganancia (decimal): {porcentaje_ganancia}")
        print(f"Precio final calculado: {precio_final}")
        
        # Preparar campos base
        campos_update = [
            'nombre = ?', 'precio_costo = ?', 'porcentaje_ganancia = ?',
            'precio = ?', 'precio_venta_publico = ?', 'disponible = ?',
            'proveedor_id = ?', 'categoria_id = ?', 'marca_id = ?', 
            'descripcion = ?', 'fecha_ultima_modificacion = ?'
        ]
        
        valores_update = [
            data.get('nombre'),
            precio_costo,
            porcentaje_ganancia,
            precio_final,
            precio_final,
            data.get('disponible', True),
            int(data.get('proveedor_id')),
            int(data.get('categoria_id')),
            int(data.get('marca_id')),
            data.get('descripcion'),
            get_argentina_time()
        ]
        
        # Agregar campos específicos según el tipo y disponibilidad
        if 'unidad_id' in columns:
            campos_update.append('unidad_id = ?')
            valores_update.append(int(data.get('unidad_id')))
        
        if 'tipo_calculo' in columns:
            campos_update.append('tipo_calculo = ?')
            valores_update.append(tipo_calculo)
        
        if tipo_calculo == 'unidad':
            # CASO 1: Por unidades
            if 'cantidad_unidades' in columns:
                cantidad_unidades = int(data.get('cantidad_unidades', 1)) if data.get('cantidad_unidades') is not None else 1
                campos_update.append('cantidad_unidades = ?')
                valores_update.append(cantidad_unidades)
            
            if 'precio_por_unidad' in columns:
                precio_por_unidad = float(data.get('precio_por_unidad', 0)) if data.get('precio_por_unidad') is not None else 0
                campos_update.append('precio_por_unidad = ?')
                valores_update.append(precio_por_unidad)
            
            # Establecer como NULL los campos del caso 2
            if 'cantidad' in columns:
                campos_update.append('cantidad = ?')
                valores_update.append(None)
            
            if 'precio_fraccionado_por_100' in columns:
                campos_update.append('precio_fraccionado_por_100 = ?')
                valores_update.append(None)
        else:
            # CASO 2: Por peso/volumen
            if 'cantidad' in columns:
                cantidad = float(data.get('cantidad', 100)) if data.get('cantidad') is not None else 100
                campos_update.append('cantidad = ?')
                valores_update.append(cantidad)
            
            if 'precio_fraccionado_por_100' in columns:
                precio_fraccionado = float(data.get('precio_fraccionado_por_100', 0)) if data.get('precio_fraccionado_por_100') is not None else 0
                campos_update.append('precio_fraccionado_por_100 = ?')
                valores_update.append(precio_fraccionado)
            
            # Establecer como NULL los campos del caso 1
            if 'cantidad_unidades' in columns:
                campos_update.append('cantidad_unidades = ?')
                valores_update.append(None)
            
            if 'precio_por_unidad' in columns:
                campos_update.append('precio_por_unidad = ?')
                valores_update.append(None)
        
        # Agregar ID al final
        valores_update.append(id)
        
        # Ejecutar actualización
        sql = f"UPDATE producto SET {', '.join(campos_update)} WHERE id = ?"
        print(f"SQL Update: {sql}")
        print(f"Valores: {valores_update}")
        
        cursor.execute(sql, valores_update)
        
        # Actualizar etiquetas
        if 'etiquetas_ids' in data:
            # Eliminar etiquetas existentes
            cursor.execute('DELETE FROM producto_etiquetas WHERE producto_id = ?', (id,))
            
            # Agregar nuevas etiquetas
            for etiqueta_id in data['etiquetas_ids']:
                cursor.execute('INSERT INTO producto_etiquetas (producto_id, etiqueta_id) VALUES (?, ?)', 
                              (id, etiqueta_id))
        
        conn.commit()
        conn.close()
        
        print(f"=== PRODUCTO {id} ACTUALIZADO EXITOSAMENTE ===")
        return jsonify({'msg': 'Producto actualizado', 'id': id})
        
    except Exception as e:
        print(f"Error actualizando producto: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@productos_bp.route('/productos/<int:id>', methods=['DELETE'])
def borrar_producto(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Eliminar etiquetas asociadas
        cursor.execute('DELETE FROM producto_etiquetas WHERE producto_id = ?', (id,))
        # Eliminar imágenes asociadas
        cursor.execute('DELETE FROM imagen_producto WHERE producto_id = ?', (id,))
        # Eliminar producto
        cursor.execute('DELETE FROM producto WHERE id = ?', (id,))
        
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Producto eliminado exitosamente'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@productos_bp.route('/productos/buscar')
def buscar_productos():
    try:
        query = request.args.get('q', '').strip()
        
        if not query or len(query) < 2:
            return jsonify([])
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Búsqueda en nombre del producto y nombre de marca
        search_pattern = f'%{query}%'
        
        cursor.execute('''
            SELECT p.id, p.nombre, p.precio_costo, p.porcentaje_ganancia, p.precio, 
                   p.precio_venta_publico, p.disponible, p.proveedor_id, p.categoria_id, 
                   p.marca_id, p.unidad_id, p.descripcion, p.fecha_ultima_modificacion,
                   pr.nombre as proveedor_nombre, c.nombre as categoria_nombre, 
                   m.nombre as marca_nombre, u.nombre as unidad_nombre, u.abreviacion as unidad_abrev,
                   p.cantidad_unidades, p.cantidad, p.precio_por_unidad, 
                   p.precio_fraccionado_por_100, p.tipo_calculo
            FROM producto p
            JOIN proveedor pr ON p.proveedor_id = pr.id
            JOIN categoria c ON p.categoria_id = c.id
            JOIN marca m ON p.marca_id = m.id
            LEFT JOIN unidad u ON p.unidad_id = u.id
            WHERE p.disponible = 1 
            AND (p.nombre LIKE ? OR m.nombre LIKE ? OR p.descripcion LIKE ?)
            ORDER BY 
                CASE 
                    WHEN p.nombre LIKE ? THEN 1
                    WHEN m.nombre LIKE ? THEN 2
                    ELSE 3
                END,
                p.nombre
            LIMIT 20
        ''', (search_pattern, search_pattern, search_pattern, 
              f'{query}%', f'{query}%'))
        
        rows = cursor.fetchall()
        productos = []
        
        for row in rows:
            # Obtener etiquetas del producto
            cursor.execute('''
                SELECT ta.id, ta.nombre
                FROM tipo_alimento ta
                JOIN producto_etiquetas pe ON ta.id = pe.etiqueta_id
                WHERE pe.producto_id = ?
            ''', (row[0],))
            
            etiquetas = [{'id': e[0], 'nombre': e[1]} for e in cursor.fetchall()]
            
            # Obtener imágenes del producto
            cursor.execute('''
                SELECT id, url, imagen_blob, es_url, posicion, titulo
                FROM imagen_producto 
                WHERE producto_id = ? 
                ORDER BY posicion
                LIMIT 1
            ''', (row[0],))
            
            imagenes_rows = cursor.fetchall()
            imagenes = []
            for img_row in imagenes_rows:
                imagen = {
                    'id': img_row[0],
                    'url': img_row[1] if img_row[3] else None,
                    'imagen_base64': None,
                    'es_url': bool(img_row[3]),
                    'posicion': img_row[4],
                    'titulo': img_row[5],
                    'nombre_archivo': img_row[1] if img_row[3] else None  # Usar URL como nombre_archivo si es URL
                }
                if img_row[2]:
                    import base64
                    imagen['imagen_base64'] = base64.b64encode(img_row[2]).decode('utf-8')
                    imagen['es_url'] = False
                    
                imagenes.append(imagen)
            
            producto = {
                'id': row[0],
                'nombre': row[1],
                'precio_costo': row[2],
                'porcentaje_ganancia': row[3],
                'precio': row[4],
                'precio_venta_publico': row[5],
                'disponible': bool(row[6]),
                'proveedor_id': row[7],
                'categoria_id': row[8],
                'marca_id': row[9],
                'unidad_id': row[10],
                'descripcion': row[11],
                'fecha_ultima_modificacion': row[12],
                'proveedor_nombre': row[13],
                'categoria_nombre': row[14],
                'marca_nombre': row[15],
                'unidad_nombre': row[16],
                'unidad_abrev': row[17],
                'cantidad_unidades': row[18],
                'cantidad': row[19],
                'precio_por_unidad': row[20],
                'precio_fraccionado_por_100': row[21],
                'tipo_calculo': row[22],
                'etiquetas': etiquetas,
                'imagenes': imagenes
            }
            
            productos.append(producto)
        
        conn.close()
        return jsonify(productos)
        
    except Exception as e:
        print(f"Error en búsqueda de productos: {e}")
        return jsonify({'error': str(e)}), 500
