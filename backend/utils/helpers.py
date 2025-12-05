def process_request_data(request):
    """Función helper para procesar datos de request automáticamente"""
    data = {}
    if request.content_type and 'application/json' in request.content_type:
        data = request.get_json() or {}
    else:
        data = request.form.to_dict()
        # Convertir valores booleanos
        if 'disponible' in data:
            data['disponible'] = data['disponible'].lower() in ['true', '1', 'on']
        if 'activo' in data:
            data['activo'] = data['activo'].lower() in ['true', '1', 'on']
    return data

def validate_required_fields(data, required_fields):
    """Validar campos requeridos en los datos"""
    for field in required_fields:
        if not data.get(field):
            return f'El campo {field} es requerido'
    return None
