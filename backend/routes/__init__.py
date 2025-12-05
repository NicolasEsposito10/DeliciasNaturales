from flask import Blueprint

def register_routes(app):
    """Registrar todas las rutas en la aplicación Flask"""
    
    from .productos import productos_bp
    from .proveedores import proveedores_bp
    from .categorias import categorias_bp
    from .marcas import marcas_bp
    from .etiquetas import etiquetas_bp
    from .unidades import unidades_bp
    from .banners import banners_bp
    from .imagenes import imagenes_bp
    from .usuarios import usuarios_bp
    from .export import export_bp
    from .importador import importador_bp
    from .debug import debug_bp
    from .wishlist import wishlist_bp
    from .pedidos import pedidos_bp
    
    # Registrar blueprints
    app.register_blueprint(productos_bp, url_prefix='/api')
    app.register_blueprint(proveedores_bp, url_prefix='/api')
    app.register_blueprint(categorias_bp, url_prefix='/api')
    app.register_blueprint(marcas_bp, url_prefix='/api')
    app.register_blueprint(etiquetas_bp, url_prefix='/api')
    app.register_blueprint(unidades_bp, url_prefix='/api')
    app.register_blueprint(banners_bp, url_prefix='/api')
    app.register_blueprint(imagenes_bp, url_prefix='/api')
    app.register_blueprint(usuarios_bp, url_prefix='/api')
    app.register_blueprint(export_bp, url_prefix='/api')
    app.register_blueprint(importador_bp, url_prefix='/api')
    app.register_blueprint(debug_bp)
    app.register_blueprint(wishlist_bp)
    app.register_blueprint(pedidos_bp)
