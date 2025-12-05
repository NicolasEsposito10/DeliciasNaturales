# Sistema de Pedidos - Delicias Naturales

## 📋 Resumen de Cambios

Se ha implementado un sistema completo de gestión de pedidos con las siguientes características:

### ✨ Características Principales

1. **Modal de Finalización de Compra**
   - Interfaz intuitiva y moderna
   - Selección de tipo de entrega (Envío o Retiro)
   - Formulario de datos de envío condicional
   - Selección de método de pago (Efectivo o Transferencia)
   - Cálculo automático del costo de envío
   - Vista previa del total con desglose

2. **Tipos de Entrega**
   - **Retiro por Local**: Sin costo adicional
   - **Envío a Domicilio**: Con costo de envío de $500 (configurable)
     - Requiere: Teléfono, Calle, Número, Entre calles

3. **Métodos de Pago**
   - Efectivo
   - Transferencia Bancaria/MercadoPago

### 🗄️ Base de Datos

#### Nuevas Tablas Creadas

**Tabla `pedidos`:**
- `id`: ID único del pedido
- `usuario_id`: FK hacia usuarios
- `fecha_pedido`: Fecha y hora del pedido
- `tipo_entrega`: 'envio' o 'retiro'
- `telefono_entrega`: Teléfono de contacto (solo envío)
- `calle`: Nombre de la calle (solo envío)
- `numero_calle`: Número de domicilio (solo envío)
- `entre_calles`: Referencias de ubicación (solo envío)
- `metodo_pago`: 'efectivo' o 'transferencia'
- `subtotal`: Subtotal de productos
- `costo_envio`: Costo del envío
- `total`: Total del pedido
- `estado`: Estado del pedido (pendiente, confirmado, enviado, entregado, cancelado)

**Tabla `pedido_items`:**
- `id`: ID único del item
- `pedido_id`: FK hacia pedidos
- `producto_id`: FK hacia productos
- `nombre_producto`: Nombre del producto (guardado para histórico)
- `precio_unitario`: Precio unitario al momento de la compra
- `cantidad`: Cantidad de unidades
- `es_fraccionado`: Indica si es producto fraccionado
- `cantidad_personalizada`: Gramos/ml para productos fraccionados
- `unidad`: Unidad de medida ('gr', 'ml', etc)
- `subtotal`: Subtotal del item

### 🔧 API Endpoints

#### POST `/api/pedidos`
Crear un nuevo pedido (requiere autenticación)

**Body:**
```json
{
  "tipo_entrega": "envio|retiro",
  "metodo_pago": "efectivo|transferencia",
  "telefono_entrega": "string",
  "calle": "string",
  "numero_calle": "string",
  "entre_calles": "string",
  "items": [
    {
      "producto_id": 1,
      "nombre": "Producto",
      "precio": 100.0,
      "cantidad": 2,
      "es_fraccionado": false,
      "cantidad_personalizada": null,
      "unidad": null
    }
  ]
}
```

#### GET `/api/pedidos/usuario`
Obtener todos los pedidos del usuario autenticado

#### GET `/api/pedidos/<id>`
Obtener un pedido específico

#### PATCH `/api/pedidos/<id>/estado`
Actualizar el estado de un pedido (solo admin)

**Body:**
```json
{
  "estado": "confirmado|enviado|entregado|cancelado"
}
```

#### GET `/api/pedidos/config/costo-envio`
Obtener el costo de envío actual

### 📁 Archivos Nuevos/Modificados

#### Backend:
- ✅ `backend/models.py` - Agregados modelos Pedido y PedidoItem
- ✅ `backend/routes/pedidos.py` - Nueva ruta para gestión de pedidos
- ✅ `backend/routes/__init__.py` - Registrado blueprint de pedidos
- ✅ `backend/actualizar_bd_pedidos.py` - Script de migración de BD

#### Frontend:
- ✅ `frontend/src/components/carrito/ModalFinalizarCompra.jsx` - Nuevo componente modal
- ✅ `frontend/src/components/carrito/Carrito.jsx` - Integración del modal y lógica de pedidos

### 🚀 Cómo Usar

1. **Actualizar Base de Datos:**
   ```bash
   cd backend
   python actualizar_bd_pedidos.py
   ```

2. **Iniciar Backend:**
   ```bash
   cd backend
   python simple_app.py
   ```

3. **Iniciar Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Proceso de Compra:**
   - Agregar productos al carrito
   - Ir al carrito
   - Click en "Finalizar Compra"
   - Si no está logueado, será redirigido al login
   - Seleccionar tipo de entrega
   - Si es envío, completar datos de entrega
   - Seleccionar método de pago
   - Confirmar pedido
   - El pedido se guarda en la BD y el carrito se vacía

### 💰 Configuración de Costos

El costo de envío está definido en `backend/routes/pedidos.py`:
```python
COSTO_ENVIO = 500.0  # Modificar según necesidad
```

### 🔒 Seguridad

- Todas las rutas de pedidos requieren autenticación JWT
- Solo los usuarios pueden ver sus propios pedidos
- Solo los admins pueden modificar el estado de pedidos
- Validación de datos en backend y frontend

### 📊 Estados de Pedidos

- **pendiente**: Pedido creado, esperando confirmación
- **confirmado**: Pedido confirmado por el negocio
- **enviado**: Pedido en camino (solo para envíos)
- **entregado**: Pedido completado
- **cancelado**: Pedido cancelado

### 🎨 Diseño UI/UX

- Interfaz moderna con tarjetas interactivas
- Selección visual de opciones
- Formulario condicional (solo muestra campos de envío si es necesario)
- Resumen en tiempo real del total
- Validaciones en tiempo real
- Mensajes de confirmación personalizados
- Diseño responsive

### ✅ Validaciones Implementadas

- Usuario debe estar autenticado
- Campos obligatorios según tipo de entrega
- Validación de formato de teléfono (solo números)
- Validación de productos existentes
- Cálculo automático de subtotales y totales
- Validación de métodos de pago válidos

---

## 🐛 Troubleshooting

**Error: "No module named 'pytz'"**
```bash
python -m pip install -r requirements.txt
```

**Las tablas no se crearon:**
```bash
python actualizar_bd_pedidos.py
```

**Error de autenticación en frontend:**
- Verificar que el token esté guardado en localStorage
- Verificar que el backend esté corriendo
- Verificar CORS en el backend
