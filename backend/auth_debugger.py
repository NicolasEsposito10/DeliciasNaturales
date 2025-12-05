import jwt
import datetime
from flask import request, jsonify, current_app
from functools import wraps

def debug_token():
    """
    Endpoint de depuración para verificar el estado del token de autenticación
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return jsonify({
            'autenticado': False,
            'error': 'No se encontró token de autorización',
            'mensaje': 'No hay token en las cabeceras de la solicitud'
        }), 401
    
    try:
        # Extraer el token del encabezado (formato: "Bearer <token>")
        token = auth_header.split(' ')[1]
        
        # Decodificar el token
        datos = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        
        # Verificar expiración manualmente (aunque jwt.decode ya lo hace)
        if 'exp' in datos and datetime.datetime.utcnow() > datetime.datetime.fromtimestamp(datos['exp']):
            return jsonify({
                'autenticado': False,
                'error': 'Token expirado',
                'expiracion': datetime.datetime.fromtimestamp(datos['exp']).isoformat(),
                'hora_actual': datetime.datetime.utcnow().isoformat()
            }), 401
            
        # Si llegamos aquí, el token es válido
        return jsonify({
            'autenticado': True,
            'datos_usuario': {
                'id': datos.get('user_id'),
                'email': datos.get('email'),
                'role': datos.get('role')
            },
            'expiracion': datetime.datetime.fromtimestamp(datos['exp']).isoformat() if 'exp' in datos else 'No definida',
            'tiempo_restante_segundos': datos['exp'] - datetime.datetime.utcnow().timestamp() if 'exp' in datos else None
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({
            'autenticado': False,
            'error': 'Token expirado (ExpiredSignatureError)'
        }), 401
    except jwt.InvalidTokenError:
        return jsonify({
            'autenticado': False,
            'error': 'Token inválido (InvalidTokenError)'
        }), 401
    except Exception as e:
        return jsonify({
            'autenticado': False,
            'error': f'Error al procesar el token: {str(e)}'
        }), 401

def verificar_auth_frontend():
    """
    Función para agregar a las rutas de la API que necesitan depuración de autenticación
    """
    @wraps(verificar_auth_frontend)
    def decorator(*args, **kwargs):
        return debug_token()
    return decorator
