from flask import Blueprint, jsonify, request
import os
import sqlite3
from datetime import datetime

debug_bp = Blueprint('debug', __name__)

@debug_bp.route('/api/health', methods=['GET'])
def api_health():
    """Endpoint básico de health check"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'message': 'API funcionando correctamente'
    }), 200

@debug_bp.route('/api/debug/health', methods=['GET'])
def health_check():
    """Endpoint de health check para verificar que el backend está funcionando"""
    try:
        # Verificar conexión a la base de datos
        basedir = os.path.abspath(os.path.dirname(__file__))
        database_path = os.path.join(basedir, "../instance/database.db")
        
        db_exists = os.path.exists(database_path)
        db_connection = False
        tables = []
        
        if db_exists:
            try:
                conn = sqlite3.connect(database_path)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [t[0] for t in cursor.fetchall()]
                conn.close()
                db_connection = True
            except Exception as e:
                print(f"Error conectando a BD: {e}")
        
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.now().isoformat(),
            'message': 'Backend funcionando correctamente',
            'database': {
                'exists': db_exists,
                'connection': db_connection,
                'path': database_path,
                'tables': tables
            },
            'environment': {
                'python_version': os.sys.version,
                'current_dir': os.getcwd(),
                'backend_dir': basedir
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'timestamp': datetime.now().isoformat(),
            'message': f'Error en health check: {str(e)}',
            'error': str(e)
        }), 500

@debug_bp.route('/api/debug/importador', methods=['GET'])
def debug_importador():
    """Endpoint para debug específico del importador"""
    try:
        # Verificar si las dependencias están disponibles
        dependencies = {}
        
        try:
            import pandas as pd
            dependencies['pandas'] = pd.__version__
        except ImportError:
            dependencies['pandas'] = 'No instalado'
        
        try:
            import openpyxl
            dependencies['openpyxl'] = openpyxl.__version__
        except ImportError:
            dependencies['openpyxl'] = 'No instalado'
        
        # Verificar directorio de uploads
        upload_dir = os.path.join(os.getcwd(), 'uploads')
        upload_dir_exists = os.path.exists(upload_dir)
        
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.now().isoformat(),
            'message': 'Debug del importador',
            'dependencies': dependencies,
            'upload_directory': {
                'path': upload_dir,
                'exists': upload_dir_exists,
                'writable': os.access(upload_dir, os.W_OK) if upload_dir_exists else False
            },
            'supported_formats': ['.xlsx', '.xls'],
            'max_file_size': '10MB'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'timestamp': datetime.now().isoformat(),
            'message': f'Error en debug del importador: {str(e)}',
            'error': str(e)
        }), 500

@debug_bp.route('/api/debug/request-info', methods=['POST'])
def debug_request():
    """Endpoint para debuggear requests HTTP"""
    try:
        request_info = {
            'method': request.method,
            'url': request.url,
            'headers': dict(request.headers),
            'content_type': request.content_type,
            'content_length': request.content_length,
            'form_data': dict(request.form) if request.form else {},
            'json_data': request.get_json() if request.is_json else None,
            'files': {}
        }
        
        # Información de archivos si los hay
        if request.files:
            for key, file in request.files.items():
                request_info['files'][key] = {
                    'filename': file.filename,
                    'content_type': file.content_type,
                    'content_length': len(file.read()) if file else 0
                }
                # Importante: volver al inicio del archivo
                if file:
                    file.seek(0)
        
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.now().isoformat(),
            'message': 'Información del request',
            'request_info': request_info
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'timestamp': datetime.now().isoformat(),
            'message': f'Error analizando request: {str(e)}',
            'error': str(e)
        }), 500
