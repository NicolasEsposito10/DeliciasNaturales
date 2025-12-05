from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from datetime import datetime, timedelta
import jwt
import logging
from config.database import get_db
from auth_debugger import debug_token

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

usuarios_bp = Blueprint('usuarios', __name__)

def get_db_connection():
    """Obtener conexión a la base de datos"""
    conn = sqlite3.connect('instance/database.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_user_from_token(token):
    """Obtener usuario desde el token JWT"""
    try:
        if not token:
            logger.warning("No se proporcionó token")
            return None
        
        # Remover 'Bearer ' si está presente
        if token.startswith('Bearer '):
            token = token[7:]
        
        logger.info(f"Validando token (primeros 20 chars): {token[:20]}...")
        
        # Decodificar token usando la clave de la app
        secret_key = current_app.config.get('SECRET_KEY', 'tu_clave_secreta_muy_segura_aqui_cambiar_en_produccion')
        logger.info(f"Usando SECRET_KEY: {secret_key[:20]}...")
        
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        user_id = payload.get('user_id')
        
        logger.info(f"Token decodificado exitosamente, user_id: {user_id}")
        
        if not user_id:
            logger.warning("Token no contiene user_id")
            return None
        
        # Obtener usuario de la base de datos
        conn = get_db_connection()
        user = conn.execute(
            'SELECT * FROM usuarios WHERE id = ?', 
            (user_id,)
        ).fetchone()
        conn.close()
        
        if user:
            user_dict = dict(user)
            logger.info(f"Usuario encontrado: {user_dict['email']}, role: {user_dict['role']}")
            return user_dict
        else:
            logger.warning(f"Usuario con ID {user_id} no encontrado en BD")
            return None
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token expirado")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Token inválido: {e}")
        return None
    except Exception as e:
        logger.error(f"Error validando token: {e}")
        return None

def verificar_admin(user):
    """Verificar si el usuario es administrador"""
    return user and (user.get('role') == 'admin' or user.get('tipo') == 'admin')

@usuarios_bp.route('/debug/auth', methods=['GET'])
def debug_auth_status():
    """Endpoint para depurar el estado de autenticación"""
    return debug_token()

@usuarios_bp.route('/usuarios/registro', methods=['POST'])
def registro_usuario():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'apellido', 'email', 'password', 'telefono', 'codigo_pais']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': True, 'message': f'El campo {field} es requerido'}), 400
        
        # Conectar a la base de datos
        conn = sqlite3.connect('instance/database.db')
        cursor = conn.cursor()
        
        # Verificar si el email ya existe
        cursor.execute('SELECT id FROM usuarios WHERE email = ?', (data['email'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': True, 'message': 'El email ya está registrado'}), 400
        
        # Verificar si el teléfono ya existe
        telefono_completo = data.get('telefono_completo', f"{data['codigo_pais']}{data['telefono']}")
        cursor.execute('SELECT id FROM usuarios WHERE telefono_completo = ?', (telefono_completo,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': True, 'message': 'El teléfono ya está registrado'}), 400
        
        # Hashear la contraseña con método específico
        password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256')
        
        # Insertar nuevo usuario
        cursor.execute('''
            INSERT INTO usuarios (
                nombre, apellido, email, password_hash, telefono_completo, 
                codigo_pais, telefono, fecha_nacimiento, direccion, ciudad, 
                codigo_postal, role, fecha_registro, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['nombre'],
            data['apellido'],
            data['email'].lower(),
            password_hash,
            telefono_completo,
            data['codigo_pais'],
            data['telefono'],
            data.get('fecha_nacimiento', '1990-01-01'),  # Valor por defecto
            data.get('direccion', ''),
            data.get('ciudad', ''),
            data.get('codigo_postal', ''),
            data.get('role', 'client'),
            datetime.now().isoformat(),
            True
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # Obtener el usuario creado
        cursor.execute('''
            SELECT id, nombre, apellido, email, telefono_completo, codigo_pais, 
                   telefono, fecha_nacimiento, direccion, ciudad, codigo_postal, 
                   role, fecha_registro FROM usuarios WHERE id = ?
        ''', (user_id,))
        
        user_data = cursor.fetchone()
        conn.close()
        
        # Formatear respuesta
        usuario = {
            'id': user_data[0],
            'nombre': user_data[1],
            'apellido': user_data[2],
            'email': user_data[3],
            'telefono_completo': user_data[4],
            'codigo_pais': user_data[5],
            'telefono': user_data[6],
            # Los campos que no mostramos en el frontend los omitimos del response
            'role': user_data[11],
            'fecha_registro': user_data[12]
        }
        
        return jsonify({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'usuario': usuario
        }), 201
        
    except Exception as e:
        print(f"Error en registro: {e}")
        return jsonify({'error': True, 'message': 'Error interno del servidor'}), 500

@usuarios_bp.route('/usuarios/login', methods=['POST'])
def login_usuario():
    try:
        from flask import current_app
        
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': True, 'message': 'Email y contraseña son requeridos'}), 400
        
        conn = sqlite3.connect('instance/database.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, nombre, apellido, email, password_hash, telefono_completo, 
                   codigo_pais, telefono, role, activo FROM usuarios 
            WHERE email = ? AND activo = 1
        ''', (email.lower(),))
        
        user_data = cursor.fetchone()
        conn.close()
        
        if not user_data:
            return jsonify({'error': True, 'message': 'Credenciales inválidas'}), 401
        
        # Verificar contraseña
        if not check_password_hash(user_data[4], password):
            return jsonify({'error': True, 'message': 'Credenciales inválidas'}), 401
        
        # Generar JWT token
        payload = {
            'user_id': user_data[0],
            'email': user_data[3],
            'role': user_data[8],
            'exp': datetime.utcnow() + timedelta(hours=24)  # Token válido por 24 horas
        }
        
        token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        # Formatear respuesta
        usuario = {
            'id': user_data[0],
            'name': f"{user_data[1]} {user_data[2]}",
            'nombre': user_data[1],
            'apellido': user_data[2],
            'email': user_data[3],
            'telefono_completo': user_data[5],
            'codigo_pais': user_data[6],
            'telefono': user_data[7],
            'role': user_data[8]
        }
        
        print(f"✅ Login exitoso para {email} - Token generado")
        
        return jsonify({
            'success': True,
            'message': 'Login exitoso',
            'usuario': usuario,
            'token': token
        }), 200
        
    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({'error': True, 'message': 'Error interno del servidor'}), 500

# =================== RUTAS DE ADMINISTRACIÓN ===================

@usuarios_bp.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    """Obtener lista de todos los usuarios (solo admin)"""
    try:
        # Verificar autenticación
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({'error': 'No autorizado'}), 401
        
        if not verificar_admin(user):
            return jsonify({'error': 'Permisos insuficientes'}), 403
        
        # Obtener usuarios
        conn = get_db_connection()
        usuarios = conn.execute('''
            SELECT 
                id, email, nombre, apellido, telefono, role as tipo, activo,
                fecha_registro as fecha_creacion, telefono_completo
            FROM usuarios
            ORDER BY fecha_registro DESC
        ''').fetchall()
        conn.close()
        
        # Convertir a lista de diccionarios
        usuarios_list = []
        for usuario in usuarios:
            usuario_dict = dict(usuario)
            
            # Mapear roles de BD a valores que espera el frontend
            role_mapping = {
                'client': 'cliente',
                'admin': 'admin'
            }
            
            # Convertir el role de BD al tipo que espera el frontend
            role_bd = usuario_dict.get('tipo', 'client')  # 'tipo' es el alias de 'role' en la query
            usuario_dict['tipo'] = role_mapping.get(role_bd, 'cliente')
            
            # Agregar campos que espera el frontend
            usuario_dict['email_verificado'] = True  # Asumir verificado por defecto
            usuario_dict['ultimo_acceso'] = None     # Campo no disponible en schema actual
            usuarios_list.append(usuario_dict)
        
        return jsonify(usuarios_list), 200
        
    except Exception as e:
        logger.error(f"Error obteniendo usuarios: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@usuarios_bp.route('/usuarios/<int:usuario_id>', methods=['GET'])
def obtener_usuario_por_id(usuario_id):
    """Obtener datos de un usuario específico"""
    try:
        # Verificar autenticación
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({'error': 'No autorizado'}), 401
        
        # Verificar que el usuario puede acceder a estos datos
        # Solo puede acceder a sus propios datos o ser admin
        if user['id'] != usuario_id and not verificar_admin(user):
            return jsonify({'error': 'Permisos insuficientes'}), 403
        
        # Obtener usuario de la base de datos
        conn = get_db_connection()
        usuario = conn.execute('''
            SELECT 
                id, email, nombre, apellido, telefono, role, activo,
                fecha_registro, telefono_completo, codigo_pais,
                fecha_nacimiento, direccion, ciudad, codigo_postal
            FROM usuarios 
            WHERE id = ?
        ''', (usuario_id,)).fetchone()
        conn.close()
        
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Convertir a diccionario
        usuario_dict = dict(usuario)
        
        # Remover información sensible
        if 'password' in usuario_dict:
            del usuario_dict['password']
        
        return jsonify({
            'success': True,
            'usuario': usuario_dict
        }), 200
        
    except Exception as e:
        logger.error(f"Error obteniendo usuario {usuario_id}: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@usuarios_bp.route('/usuarios/<int:usuario_id>', methods=['PUT'])
def actualizar_perfil_usuario(usuario_id):
    """Actualizar datos del perfil de usuario"""
    try:
        # Verificar autenticación
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({'error': 'No autorizado'}), 401
        
        # Verificar que el usuario puede actualizar estos datos
        # Solo puede actualizar sus propios datos o ser admin
        if user['id'] != usuario_id and not verificar_admin(user):
            return jsonify({'error': 'Permisos insuficientes'}), 403
        
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'apellido', 'email', 'telefono', 'codigo_pais']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': True, 'message': f'El campo {field} es requerido'}), 400
        
        conn = get_db_connection()
        
        # Verificar que el usuario existe
        usuario_existente = conn.execute(
            'SELECT * FROM usuarios WHERE id = ?', 
            (usuario_id,)
        ).fetchone()
        
        if not usuario_existente:
            conn.close()
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Verificar si el email ya existe (pero no es el del usuario actual)
        email_existente = conn.execute(
            'SELECT id FROM usuarios WHERE email = ? AND id != ?', 
            (data['email'], usuario_id)
        ).fetchone()
        
        if email_existente:
            conn.close()
            return jsonify({'error': True, 'message': 'El email ya está en uso por otro usuario'}), 400
        
        # Preparar los datos para actualizar
        update_fields = []
        update_values = []
        
        # Campos básicos
        basic_fields = ['nombre', 'apellido', 'email', 'telefono', 'codigo_pais', 
                       'telefono_completo', 'fecha_nacimiento', 'direccion', 'ciudad', 'codigo_postal']
        
        for field in basic_fields:
            if field in data:
                update_fields.append(f"{field} = ?")
                update_values.append(data[field])
        
        # Manejar contraseña si se proporciona
        if data.get('password'):
            from werkzeug.security import generate_password_hash
            password_hash = generate_password_hash(data['password'])
            update_fields.append("password_hash = ?")
            update_values.append(password_hash)
        
        # Agregar el ID del usuario al final para la cláusula WHERE
        update_values.append(usuario_id)
        
        # Construir y ejecutar la query de actualización
        if update_fields:
            update_query = f"UPDATE usuarios SET {', '.join(update_fields)} WHERE id = ?"
            conn.execute(update_query, update_values)
            conn.commit()
        
        # Obtener los datos actualizados
        usuario_actualizado = conn.execute('''
            SELECT 
                id, email, nombre, apellido, telefono, role, activo,
                fecha_registro, telefono_completo, codigo_pais,
                fecha_nacimiento, direccion, ciudad, codigo_postal
            FROM usuarios 
            WHERE id = ?
        ''', (usuario_id,)).fetchone()
        
        conn.close()
        
        if usuario_actualizado:
            usuario_dict = dict(usuario_actualizado)
            logger.info(f"Usuario {usuario_id} actualizado exitosamente")
            return jsonify({
                'success': True,
                'message': 'Perfil actualizado exitosamente',
                'usuario': usuario_dict
            }), 200
        else:
            return jsonify({'error': 'Error al obtener datos actualizados'}), 500
        
    except Exception as e:
        logger.error(f"Error actualizando usuario {usuario_id}: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@usuarios_bp.route('/usuarios/<int:usuario_id>', methods=['DELETE'])
def eliminar_usuario(usuario_id):
    """Eliminar un usuario (solo admin)"""
    try:
        # Verificar autenticación
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({'error': 'No autorizado'}), 401
        
        if not verificar_admin(user):
            return jsonify({'error': 'Permisos insuficientes'}), 403
        
        # No permitir que un admin se elimine a sí mismo
        if user['id'] == usuario_id:
            return jsonify({'error': 'No puedes eliminar tu propia cuenta'}), 400
        
        # Verificar que el usuario existe
        conn = get_db_connection()
        usuario_existente = conn.execute(
            'SELECT * FROM usuarios WHERE id = ?', 
            (usuario_id,)
        ).fetchone()
        
        if not usuario_existente:
            conn.close()
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Eliminar relaciones en wishlist primero (si existen)
        try:
            conn.execute('DELETE FROM wishlist WHERE usuario_id = ?', (usuario_id,))
        except:
            pass  # La tabla wishlist puede no existir o no tener esa relación
        
        # Eliminar usuario
        conn.execute('DELETE FROM usuarios WHERE id = ?', (usuario_id,))
        conn.commit()
        conn.close()
        
        logger.info(f"Usuario {usuario_id} eliminado por admin {user['id']}")
        return jsonify({'message': 'Usuario eliminado exitosamente'}), 200
        
    except Exception as e:
        logger.error(f"Error eliminando usuario: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@usuarios_bp.route('/usuarios/<int:usuario_id>/permisos', methods=['PUT'])
def cambiar_permisos(usuario_id):
    """Cambiar permisos de un usuario (solo admin)"""
    try:
        # Verificar autenticación
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({'error': 'No autorizado'}), 401
        
        if not verificar_admin(user):
            return jsonify({'error': 'Permisos insuficientes'}), 403
        
        # Obtener datos del request
        data = request.get_json()
        nuevo_tipo = data.get('tipo')
        
        # Validar tipo - mapear frontend a backend
        mapeo_tipos = {
            'cliente': 'client',
            'admin': 'admin'
        }
        
        if nuevo_tipo not in mapeo_tipos:
            return jsonify({'error': 'Tipo de usuario inválido'}), 400
        
        nuevo_role = mapeo_tipos[nuevo_tipo]
        
        # No permitir que un admin se quite a sí mismo los permisos de admin
        if user['id'] == usuario_id and nuevo_tipo != 'admin':
            return jsonify({'error': 'No puedes cambiar tus propios permisos de administrador'}), 400
        
        # Verificar que el usuario existe
        conn = get_db_connection()
        usuario_existente = conn.execute(
            'SELECT * FROM usuarios WHERE id = ?', 
            (usuario_id,)
        ).fetchone()
        
        if not usuario_existente:
            conn.close()
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Actualizar permisos
        conn.execute(
            'UPDATE usuarios SET role = ? WHERE id = ?',
            (nuevo_role, usuario_id)
        )
        conn.commit()
        conn.close()
        
        logger.info(f"Permisos de usuario {usuario_id} cambiados a {nuevo_tipo} por admin {user['id']}")
        return jsonify({'message': 'Permisos actualizados exitosamente'}), 200
        
    except Exception as e:
        logger.error(f"Error cambiando permisos: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@usuarios_bp.route('/usuarios/<int:usuario_id>/estado', methods=['PUT'])
def cambiar_estado(usuario_id):
    """Activar/desactivar un usuario (solo admin)"""
    try:
        # Verificar autenticación
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({'error': 'No autorizado'}), 401
        
        if not verificar_admin(user):
            return jsonify({'error': 'Permisos insuficientes'}), 403
        
        # Obtener datos del request
        data = request.get_json()
        nuevo_estado = data.get('activo')
        
        # Validar estado
        if nuevo_estado is None:
            return jsonify({'error': 'Estado no especificado'}), 400
        
        # No permitir que un admin se desactive a sí mismo
        if user['id'] == usuario_id and not nuevo_estado:
            return jsonify({'error': 'No puedes desactivar tu propia cuenta'}), 400
        
        # Verificar que el usuario existe
        conn = get_db_connection()
        usuario_existente = conn.execute(
            'SELECT * FROM usuarios WHERE id = ?', 
            (usuario_id,)
        ).fetchone()
        
        if not usuario_existente:
            conn.close()
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Actualizar estado
        conn.execute(
            'UPDATE usuarios SET activo = ? WHERE id = ?',
            (nuevo_estado, usuario_id)
        )
        conn.commit()
        conn.close()
        
        estado_texto = "activado" if nuevo_estado else "desactivado"
        logger.info(f"Usuario {usuario_id} {estado_texto} por admin {user['id']}")
        return jsonify({'message': f'Usuario {estado_texto} exitosamente'}), 200
        
    except Exception as e:
        logger.error(f"Error cambiando estado: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500
