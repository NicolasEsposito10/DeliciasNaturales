from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import base64

db = SQLAlchemy()

class Proveedor(db.Model):
    __tablename__ = 'proveedor'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(50))
    email = db.Column(db.String(100))
    
    # Relación con productos
    productos = db.relationship('Producto', backref='proveedor', lazy=True)

class Categoria(db.Model):
    __tablename__ = 'categoria'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    productos = db.relationship('Producto', backref='categoria', lazy=True)

class TipoAlimento(db.Model):
    __tablename__ = 'tipo_alimento'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)

class Marca(db.Model):
    __tablename__ = 'marca'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    productos = db.relationship('Producto', backref='marca', lazy=True)

# Tabla de asociación para la relación muchos-a-muchos entre Producto y TipoAlimento (Etiquetas)
producto_etiquetas = db.Table('producto_etiquetas',
    db.Column('producto_id', db.Integer, db.ForeignKey('producto.id'), primary_key=True),
    db.Column('etiqueta_id', db.Integer, db.ForeignKey('tipo_alimento.id'), primary_key=True)
)

class Producto(db.Model):
    __tablename__ = 'producto'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    precio = db.Column(db.Float)
    disponible = db.Column(db.Boolean, default=True)
    descripcion = db.Column(db.Text)
    
    # Campos de pricing
    precio_costo = db.Column(db.Float)
    porcentaje_ganancia = db.Column(db.Float)
    precio_venta_publico = db.Column(db.Float)
    
    # Campo de timestamp
    fecha_ultima_modificacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    proveedor_id = db.Column(db.Integer, db.ForeignKey('proveedor.id'))
    categoria_id = db.Column(db.Integer, db.ForeignKey('categoria.id'))
    marca_id = db.Column(db.Integer, db.ForeignKey('marca.id'))
    unidad_id = db.Column(db.Integer, db.ForeignKey('unidad.id'))
    
    # Campos adicionales para unidades
    cantidad_unidades = db.Column(db.Integer)
    cantidad = db.Column(db.Float)
    precio_por_unidad = db.Column(db.Float)
    precio_fraccionado_por_100 = db.Column(db.Float)
    tipo_calculo = db.Column(db.String(50))
    
    # Relación muchos-a-muchos con etiquetas
    etiquetas = db.relationship('TipoAlimento', secondary=producto_etiquetas, lazy='subquery',
                               backref=db.backref('productos_etiquetados', lazy=True))
    
    # Relación con imágenes
    imagenes = db.relationship('ImagenProducto', backref='producto', lazy=True, cascade='all, delete-orphan')
    
    def calcular_precios(self):
        """Calcula automáticamente los precios derivados"""
        if self.precio_costo and self.porcentaje_ganancia is not None:
            self.precio_venta_publico = self.precio_costo + (self.porcentaje_ganancia * self.precio_costo)
            self.precio = self.precio_venta_publico

class ImagenProducto(db.Model):
    __tablename__ = 'imagen_producto'
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(255))
    imagen_blob = db.Column(db.LargeBinary)
    es_url = db.Column(db.Boolean, default=True)
    posicion = db.Column(db.Integer, default=0)
    titulo = db.Column(db.String(100))
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    
    def obtener_imagen_base64(self):
        if self.es_url:
            return None
        if self.imagen_blob:
            return base64.b64encode(self.imagen_blob).decode('utf-8')
        return None

class Banner(db.Model):
    __tablename__ = 'banner'
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100))
    descripcion = db.Column(db.Text)
    url_imagen = db.Column(db.String(255))
    imagen_blob = db.Column(db.LargeBinary)
    es_url = db.Column(db.Boolean, default=True)
    url_link = db.Column(db.String(255))
    activo = db.Column(db.Boolean, default=True)
    orden = db.Column(db.Integer, default=0)
    fecha_inicio = db.Column(db.DateTime)
    fecha_fin = db.Column(db.DateTime)
    color_borde = db.Column(db.String(20), default='#000000')
    
    def obtener_imagen_base64(self):
        if self.es_url:
            return None
        if self.imagen_blob:
            return base64.b64encode(self.imagen_blob).decode('utf-8')
        return None

# Modelo para usuarios con estructura completa
class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    telefono_completo = db.Column(db.String(20), unique=True, nullable=False, index=True)
    codigo_pais = db.Column(db.String(5), nullable=False)
    telefono = db.Column(db.String(15), nullable=False)
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    direccion = db.Column(db.String(255))
    ciudad = db.Column(db.String(100))
    codigo_postal = db.Column(db.String(10))
    role = db.Column(db.String(20), nullable=False, default='client')  # 'admin' o 'client'
    fecha_registro = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    activo = db.Column(db.Boolean, nullable=False, default=True)
    
    def __repr__(self):
        return f'<Usuario {self.email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'apellido': self.apellido,
            'email': self.email,
            'telefono_completo': self.telefono_completo,
            'codigo_pais': self.codigo_pais,
            'telefono': self.telefono,
            'fecha_nacimiento': self.fecha_nacimiento.isoformat() if self.fecha_nacimiento else None,
            'direccion': self.direccion,
            'ciudad': self.ciudad,
            'codigo_postal': self.codigo_postal,
            'role': self.role,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None,
            'activo': self.activo
        }

class Wishlist(db.Model):
    __tablename__ = 'wishlist'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    fecha_agregado = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relaciones
    usuario = db.relationship('Usuario', backref='wishlist_items')
    producto = db.relationship('Producto', backref='wishlist_items')
    
    # Índice único para evitar duplicados
    __table_args__ = (db.UniqueConstraint('usuario_id', 'producto_id', name='unique_user_product'),)
    
    def __repr__(self):
        return f'<Wishlist Usuario:{self.usuario_id} Producto:{self.producto_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'producto_id': self.producto_id,
            'fecha_agregado': self.fecha_agregado.isoformat(),
            'producto': self.producto.to_dict() if self.producto else None
        }

class Pedido(db.Model):
    __tablename__ = 'pedidos'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    fecha_pedido = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Información de entrega
    tipo_entrega = db.Column(db.String(20), nullable=False)  # 'envio' o 'retiro'
    
    # Datos para envío (solo si tipo_entrega = 'envio')
    telefono_entrega = db.Column(db.String(20))
    calle = db.Column(db.String(200))
    numero_calle = db.Column(db.String(10))
    entre_calles = db.Column(db.String(200))
    
    # Método de pago
    metodo_pago = db.Column(db.String(20), nullable=False)  # 'efectivo' o 'transferencia'
    
    # Costos
    subtotal = db.Column(db.Float, nullable=False)
    costo_envio = db.Column(db.Float, nullable=False, default=0)
    total = db.Column(db.Float, nullable=False)
    
    # Estado del pedido
    estado = db.Column(db.String(20), nullable=False, default='pendiente')  # pendiente, entregado, cancelado
    
    # Relaciones
    usuario = db.relationship('Usuario', backref='pedidos')
    items = db.relationship('PedidoItem', backref='pedido', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Pedido {self.id} Usuario:{self.usuario_id}>'
    
    def to_dict(self):
        usuario_info = {
            'id': self.usuario.id,
            'nombre': self.usuario.nombre,
            'apellido': self.usuario.apellido,
            'email': self.usuario.email,
            'telefono': self.usuario.telefono_completo
        } if self.usuario else None
        
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario': usuario_info,
            'fecha_pedido': self.fecha_pedido.isoformat(),
            'tipo_entrega': self.tipo_entrega,
            'telefono_entrega': self.telefono_entrega,
            'calle': self.calle,
            'numero_calle': self.numero_calle,
            'entre_calles': self.entre_calles,
            'metodo_pago': self.metodo_pago,
            'subtotal': self.subtotal,
            'costo_envio': self.costo_envio,
            'total': self.total,
            'estado': self.estado,
            'items': [item.to_dict() for item in self.items]
        }

class PedidoItem(db.Model):
    __tablename__ = 'pedido_items'
    
    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    
    nombre_producto = db.Column(db.String(200), nullable=False)  # Guardamos el nombre por si el producto se elimina
    precio_unitario = db.Column(db.Float, nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    
    # Para productos fraccionados
    es_fraccionado = db.Column(db.Boolean, default=False)
    cantidad_personalizada = db.Column(db.Integer)  # gramos o ml
    unidad = db.Column(db.String(10))  # 'gr', 'ml', etc
    
    subtotal = db.Column(db.Float, nullable=False)
    
    # Relación con producto
    producto = db.relationship('Producto')
    
    def __repr__(self):
        return f'<PedidoItem Pedido:{self.pedido_id} Producto:{self.producto_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'pedido_id': self.pedido_id,
            'producto_id': self.producto_id,
            'nombre_producto': self.nombre_producto,
            'precio_unitario': self.precio_unitario,
            'cantidad': self.cantidad,
            'es_fraccionado': self.es_fraccionado,
            'cantidad_personalizada': self.cantidad_personalizada,
            'unidad': self.unidad,
            'subtotal': self.subtotal
        }
