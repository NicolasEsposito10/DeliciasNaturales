from flask import Blueprint, request, jsonify, current_app
from models import db, Pedido, PedidoItem, Usuario, Producto
from functools import wraps
import jwt
import json
import os

pedidos_bp = Blueprint('pedidos', __name__)

# Archivo de configuración para el costo de envío
CONFIG_FILE = os.path.join(os.path.dirname(__file__), '..', 'config', 'envio_config.json')

def obtener_costo_envio_config():
    """Obtener el costo de envío desde el archivo de configuración"""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                return config.get('costo_envio', 500.0)
        return 500.0  # Valor por defecto
    except:
        return 500.0

def guardar_costo_envio_config(costo):
    """Guardar el costo de envío en el archivo de configuración"""
    try:
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        with open(CONFIG_FILE, 'w') as f:
            json.dump({'costo_envio': costo}, f)
        return True
    except Exception as e:
        print(f"Error guardando configuración: {e}")
        return False

# Decorador para verificar token JWT
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token no proporcionado'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            secret_key = current_app.config.get('SECRET_KEY', 'tu_clave_secreta_muy_segura_aqui_cambiar_en_produccion')
            data = jwt.decode(token, secret_key, algorithms=["HS256"])
            current_user = Usuario.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({'error': 'Usuario no encontrado'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        except Exception as e:
            return jsonify({'error': str(e)}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@pedidos_bp.route('/api/pedidos', methods=['POST'])
@token_required
def crear_pedido(current_user):
    """
    Crear un nuevo pedido
    
    Body esperado:
    {
        "tipo_entrega": "envio" | "retiro",
        "metodo_pago": "efectivo" | "transferencia",
        "telefono_entrega": "string" (solo si tipo_entrega = "envio"),
        "calle": "string" (solo si tipo_entrega = "envio"),
        "numero_calle": "string" (solo si tipo_entrega = "envio"),
        "entre_calles": "string" (solo si tipo_entrega = "envio"),
        "items": [
            {
                "producto_id": int,
                "nombre": string,
                "precio": float,
                "cantidad": int,
                "es_fraccionado": bool (opcional),
                "cantidad_personalizada": int (opcional, gramos/ml),
                "unidad": string (opcional, "gr", "ml", etc)
            }
        ]
    }
    """
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        if not data.get('tipo_entrega') or not data.get('metodo_pago') or not data.get('items'):
            return jsonify({'error': 'Faltan campos requeridos'}), 400
        
        tipo_entrega = data['tipo_entrega']
        
        # Validar tipo de entrega
        if tipo_entrega not in ['envio', 'retiro']:
            return jsonify({'error': 'Tipo de entrega inválido'}), 400
        
        # Si es retiro, no requiere método de pago específico (hay todos los métodos)
        # Si es envío, validar método de pago y campos adicionales
        if tipo_entrega == 'envio':
            # Validar método de pago para envío
            if data['metodo_pago'] not in ['efectivo', 'transferencia']:
                return jsonify({'error': 'Método de pago inválido'}), 400
            
            # Validar campos de envío
            campos_envio = ['telefono_entrega', 'calle', 'numero_calle', 'entre_calles']
            for campo in campos_envio:
                if not data.get(campo):
                    return jsonify({'error': f'Campo {campo} requerido para envío a domicilio'}), 400
        else:
            # Para retiro, establecer método de pago como 'local' (todos los métodos disponibles)
            data['metodo_pago'] = 'local'
        
        # Calcular subtotal
        subtotal = 0
        items_procesados = []
        
        for item in data['items']:
            # Validar que el producto existe
            producto = Producto.query.get(item['producto_id'])
            if not producto:
                return jsonify({'error': f'Producto {item["producto_id"]} no encontrado'}), 404
            
            # Calcular subtotal del item
            if item.get('es_fraccionado'):
                item_subtotal = item['precio']
            else:
                item_subtotal = item['precio'] * item['cantidad']
            
            subtotal += item_subtotal
            
            items_procesados.append({
                'producto_id': item['producto_id'],
                'nombre': item['nombre'],
                'precio': item['precio'],
                'cantidad': item['cantidad'],
                'es_fraccionado': item.get('es_fraccionado', False),
                'cantidad_personalizada': item.get('cantidad_personalizada'),
                'unidad': item.get('unidad'),
                'subtotal': item_subtotal
            })
        
        # Calcular costo de envío desde la configuración
        COSTO_ENVIO = obtener_costo_envio_config() if tipo_entrega == 'envio' else 0.0
        
        # Calcular total
        total = subtotal + COSTO_ENVIO
        
        # Crear el pedido
        nuevo_pedido = Pedido(
            usuario_id=current_user.id,
            tipo_entrega=tipo_entrega,
            telefono_entrega=data.get('telefono_entrega'),
            calle=data.get('calle'),
            numero_calle=data.get('numero_calle'),
            entre_calles=data.get('entre_calles'),
            metodo_pago=data['metodo_pago'],
            subtotal=subtotal,
            costo_envio=COSTO_ENVIO,
            total=total,
            estado='pendiente'
        )
        
        db.session.add(nuevo_pedido)
        db.session.flush()  # Para obtener el ID del pedido
        
        # Crear los items del pedido
        for item in items_procesados:
            pedido_item = PedidoItem(
                pedido_id=nuevo_pedido.id,
                producto_id=item['producto_id'],
                nombre_producto=item['nombre'],
                precio_unitario=item['precio'],
                cantidad=item['cantidad'],
                es_fraccionado=item['es_fraccionado'],
                cantidad_personalizada=item['cantidad_personalizada'],
                unidad=item['unidad'],
                subtotal=item['subtotal']
            )
            db.session.add(pedido_item)
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Pedido creado exitosamente',
            'pedido': nuevo_pedido.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error al crear pedido: {str(e)}")
        return jsonify({'error': 'Error al crear el pedido', 'detalle': str(e)}), 500

@pedidos_bp.route('/api/pedidos/usuario', methods=['GET'])
@token_required
def obtener_pedidos_usuario(current_user):
    """Obtener todos los pedidos del usuario actual"""
    try:
        pedidos = Pedido.query.filter_by(usuario_id=current_user.id).order_by(Pedido.fecha_pedido.desc()).all()
        
        return jsonify({
            'pedidos': [pedido.to_dict() for pedido in pedidos]
        }), 200
        
    except Exception as e:
        print(f"Error al obtener pedidos: {str(e)}")
        return jsonify({'error': 'Error al obtener pedidos'}), 500

@pedidos_bp.route('/api/pedidos/<int:pedido_id>', methods=['GET'])
@token_required
def obtener_pedido(current_user, pedido_id):
    """Obtener un pedido específico"""
    try:
        pedido = Pedido.query.get(pedido_id)
        
        if not pedido:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        
        # Verificar que el pedido pertenece al usuario actual o es admin
        if pedido.usuario_id != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'No autorizado'}), 403
        
        return jsonify(pedido.to_dict()), 200
        
    except Exception as e:
        print(f"Error al obtener pedido: {str(e)}")
        return jsonify({'error': 'Error al obtener el pedido'}), 500

@pedidos_bp.route('/api/pedidos/<int:pedido_id>/estado', methods=['PATCH'])
@token_required
def actualizar_estado_pedido(current_user, pedido_id):
    """Actualizar el estado de un pedido (solo admin)"""
    try:
        if current_user.role != 'admin':
            return jsonify({'error': 'No autorizado'}), 403
        
        pedido = Pedido.query.get(pedido_id)
        
        if not pedido:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        
        data = request.get_json()
        nuevo_estado = data.get('estado')
        
        estados_validos = ['pendiente', 'entregado', 'cancelado']
        
        if nuevo_estado not in estados_validos:
            return jsonify({'error': 'Estado inválido'}), 400
        
        pedido.estado = nuevo_estado
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Estado actualizado exitosamente',
            'pedido': pedido.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error al actualizar estado: {str(e)}")
        return jsonify({'error': 'Error al actualizar el estado'}), 500

@pedidos_bp.route('/api/pedidos/config/costo-envio', methods=['GET'])
def obtener_costo_envio():
    """Obtener el costo de envío actual"""
    costo = obtener_costo_envio_config()
    return jsonify({'costo_envio': costo}), 200

@pedidos_bp.route('/api/pedidos/config/costo-envio', methods=['PUT'])
@token_required
def actualizar_costo_envio(current_user):
    """Actualizar el costo de envío (solo admin)"""
    try:
        # Verificar que sea admin
        if current_user.role != 'admin':
            return jsonify({'error': 'No autorizado'}), 403
        
        data = request.get_json()
        nuevo_costo = data.get('costo_envio')
        
        if nuevo_costo is None:
            return jsonify({'error': 'Costo de envío no proporcionado'}), 400
        
        try:
            nuevo_costo = float(nuevo_costo)
            if nuevo_costo < 0:
                return jsonify({'error': 'El costo de envío no puede ser negativo'}), 400
        except ValueError:
            return jsonify({'error': 'El costo de envío debe ser un número válido'}), 400
        
        if guardar_costo_envio_config(nuevo_costo):
            return jsonify({
                'mensaje': 'Costo de envío actualizado exitosamente',
                'costo_envio': nuevo_costo
            }), 200
        else:
            return jsonify({'error': 'Error al guardar la configuración'}), 500
            
    except Exception as e:
        print(f"Error al actualizar costo de envío: {str(e)}")
        return jsonify({'error': 'Error al actualizar el costo de envío'}), 500

@pedidos_bp.route('/api/pedidos/admin/todos', methods=['GET'])
@token_required
def obtener_todos_pedidos_admin(current_user):
    """Obtener todos los pedidos (solo admin)"""
    try:
        # Verificar que sea admin
        if current_user.role != 'admin':
            return jsonify({'error': 'No autorizado'}), 403
        
        # Obtener todos los pedidos ordenados por fecha descendente
        pedidos = Pedido.query.order_by(Pedido.fecha_pedido.desc()).all()
        
        return jsonify({
            'pedidos': [pedido.to_dict() for pedido in pedidos]
        }), 200
        
    except Exception as e:
        print(f"Error al obtener todos los pedidos: {str(e)}")
        return jsonify({'error': 'Error al obtener los pedidos'}), 500
