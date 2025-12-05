import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../../context/CarritoContext';
import { useAuth } from '../../context/AuthContext';
import { formatearPrecio } from '../../utils/formatoArgentino.jsx';
import ModalFinalizarCompra from './ModalFinalizarCompra';

function Carrito() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, eliminarDelCarrito, actualizarCantidad, vaciarCarrito, finalizarPedido, obtenerTotal, setItems } = useCarrito();
  const [showModal, setShowModal] = useState(false);

  const handleCantidadChange = (itemId, nuevaCantidad) => {
    const cantidad = parseInt(nuevaCantidad);
    if (cantidad > 0) {
      actualizarCantidad(itemId, cantidad);
    }
  };

    const handleCantidadGramosChange = (itemId, nuevaCantidadGramos) => {
    const cantidadGramos = parseInt(nuevaCantidadGramos);
    
    // Validar cantidad mínima y múltiplos de 5
    if (cantidadGramos < 25) return;
    if (cantidadGramos % 5 !== 0) return;
    
    // Encontrar el item actual
    const itemActual = items.find(i => i.id === itemId);
    if (!itemActual || !itemActual.es_caso_2) return;
    
    const producto = itemActual.producto_original;
    const nuevoPrecio = (producto?.precio_fraccionado_por_100 || 0) * cantidadGramos / 100;
    const nuevoNombre = `${producto.nombre.split(' (')[0]} (${cantidadGramos}${itemActual.unidad_abrev || 'gr'})`;
    
    // Actualizar el item directamente
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            cantidad_personalizada: cantidadGramos,
            precio: nuevoPrecio,
            nombre: nuevoNombre
          };
        }
        return item;
      })
    );
  };

  const incrementarCantidad = (itemId, cantidadActual) => {
    const item = items.find(i => i.id === itemId);
    
    if (item?.es_caso_2) {
      // Caso 2: Incrementar en 5gr
      const nuevaCantidadGramos = item.cantidad_personalizada + 5;
      handleCantidadGramosChange(itemId, nuevaCantidadGramos);
    } else {
      // Caso 1: Incrementar cantidad normal
      actualizarCantidad(itemId, cantidadActual + 1);
    }
  };

  const decrementarCantidad = (itemId, cantidadActual) => {
    const item = items.find(i => i.id === itemId);
    
    if (item?.es_caso_2) {
      // Caso 2: Decrementar en 5gr (mínimo 25gr)
      const nuevaCantidadGramos = Math.max(25, item.cantidad_personalizada - 5);
      handleCantidadGramosChange(itemId, nuevaCantidadGramos);
    } else {
      // Caso 1: Decrementar cantidad normal
      if (cantidadActual > 1) {
        actualizarCantidad(itemId, cantidadActual - 1);
      }
    }
  };

  const handleFinalizarPedido = () => {
    // Verificar si el usuario está logueado
    if (!user) {
      // Usuario no logueado - redirigir a login
      // Guardar el carrito actual como "pendiente de asignar"
      localStorage.setItem('carrito_pendiente_login', JSON.stringify(items));
      console.log('💾 Carrito guardado como pendiente para asignar después del login');
      navigate('/login');
      return;
    }
    
    // Usuario logueado - mostrar modal
    setShowModal(true);
  };

  const handleConfirmarPedido = async (pedidoData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Error: No se encontró el token de autenticación');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pedidoData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el pedido');
      }

      // Pedido creado exitosamente
      setShowModal(false);
      vaciarCarrito();

      // Mostrar mensaje de éxito con información del pedido
      const mensajeExito = pedidoData.tipo_entrega === 'envio'
        ? `¡Pedido realizado con éxito!\n\n` +
          `Pedido N°: ${data.pedido.id}\n` +
          `Total: ${formatearPrecio(data.pedido.total)}\n` +
          `Envío a: ${pedidoData.calle} ${pedidoData.numero_calle}\n` +
          `Método de pago: ${pedidoData.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}\n\n` +
          `Te contactaremos al ${pedidoData.telefono_entrega} para coordinar la entrega.`
        : `¡Pedido realizado con éxito!\n\n` +
          `Pedido N°: ${data.pedido.id}\n` +
          `Total: ${formatearPrecio(data.pedido.total)}\n` +
          `Retiro por local\n` +
          `Métodos de pago disponibles: Efectivo, Tarjeta, Transferencia\n\n` +
          `Te esperamos para retirar tu pedido.`;

      alert(mensajeExito);

    } catch (error) {
      console.error('Error al confirmar pedido:', error);
      alert(`Error al procesar el pedido: ${error.message}`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '40px' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div 
                className="text-center p-5 rounded"
                style={{ 
                  backgroundColor: 'white', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: 'none'
                }}
              >
                <div className="mb-4">
                  <i 
                    className="bi bi-cart-x text-muted"
                    style={{ fontSize: '4rem' }}
                  ></i>
                </div>
                <h3 className="fw-bold mb-3" style={{ color: '#2d3748' }}>Tu carrito está vacío</h3>
                <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                  ¡Descubre nuestros productos y comienza a llenar tu carrito!
                </p>
                <button 
                  onClick={() => navigate('/tienda')}
                  className="btn btn-success btn-lg px-5 py-3"
                  style={{ 
                    borderRadius: '12px',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(40, 173, 16, 0.3)'
                  }}
                >
                  <i className="bi bi-shop me-2"></i>
                  Explorar Productos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="container">
        {/* Header del carrito */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h1 className="fw-bold mb-2" style={{ color: '#2d3748', fontSize: '2.5rem' }}>
                  <i className="bi bi-cart3 me-3" style={{ color: '#28ad10' }}></i>
                  Carrito de Compras
                </h1>
                <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
                  {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
                </p>
              </div>
              <button 
                className="btn btn-outline-danger"
                onClick={vaciarCarrito}
                style={{ 
                  borderRadius: '12px',
                  borderWidth: '2px',
                  fontWeight: '500'
                }}
              >
                <i className="bi bi-cart-x me-2"></i>
                Vaciar Carrito
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            {/* Lista de productos mejorada */}
            <div 
              className="rounded"
              style={{ 
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}
            >
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="p-4"
                  style={{ 
                    borderBottom: index === items.length - 1 ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <div className="row align-items-center g-3">
                    {/* Imagen y Producto */}
                    <div className="col-xl-4 col-lg-5">
                      <div className="d-flex align-items-center">
                        <div 
                          className="me-3 flex-shrink-0"
                          style={{ 
                            width: '80px', 
                            height: '80px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#f8f9fa',
                            border: '2px solid #e2e8f0'
                          }}
                        >
                          {item.imagen ? (
                            <img 
                              src={item.imagen.es_url ? item.imagen.url : `data:image/jpeg;base64,${item.imagen.imagen_base64}`}
                              alt={item.nombre}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div 
                              className="d-flex align-items-center justify-content-center h-100"
                              style={{ color: '#a0aec0' }}
                            >
                              <i className="bi bi-image" style={{ fontSize: '1.5rem' }}></i>
                            </div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <h5 className="fw-bold mb-1" style={{ color: '#2d3748', fontSize: '1.1rem' }}>
                            {item.nombre}
                          </h5>
                          {item.marca && (
                            <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                              Marca: {item.marca}
                            </p>
                          )}
                          <div className="d-flex flex-wrap gap-2">
                            {item.es_caso_2 && (
                              <span 
                                className="badge"
                                style={{ 
                                  backgroundColor: '#e6fffa', 
                                  color: '#065f46',
                                  fontSize: '0.8rem',
                                  fontWeight: '500'
                                }}
                              >
                                {item.cantidad_personalizada}{item.unidad_abrev || 'gr'}
                              </span>
                            )}
                            {item.es_caso_1 && (
                              <span 
                                className="badge"
                                style={{ 
                                  backgroundColor: '#e6f3ff', 
                                  color: '#1e40af',
                                  fontSize: '0.8rem',
                                  fontWeight: '500'
                                }}
                              >
                                {item.cantidad > 1 ? `${item.cantidad} unidades` : 'Unidad individual'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Precio Unitario */}
                    <div className="col-xl-2 col-lg-2">
                      <div className="text-center">
                        <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Precio</p>
                        <span className="fw-bold" style={{ color: '#28ad10', fontSize: '1.1rem' }}>
                          {formatearPrecio(item.precio)}
                        </span>
                      </div>
                    </div>

                    {/* Control de Cantidad */}
                    <div className="col-xl-3 col-lg-3">
                      <div>
                        <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>Cantidad</p>
                        {item.es_caso_2 ? (
                          // Caso 2: Control de gramos/ml
                          <div className="d-flex align-items-center justify-content-center">
                            <div 
                              className="input-group"
                              style={{ 
                                width: '160px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                borderRadius: '8px',
                                overflow: 'hidden'
                              }}
                            >
                              <button 
                                className="btn btn-outline-secondary quantity-btn"
                                type="button"
                                onClick={() => decrementarCantidad(item.id, item.cantidad)}
                                disabled={item.cantidad_personalizada <= 25}
                                style={{ 
                                  border: '1px solid #dee2e6', 
                                  backgroundColor: '#ffffff',
                                  color: '#495057'
                                }}
                              >
                                <i className="bi bi-dash"></i>
                              </button>
                              <input
                                type="number"
                                className="form-control text-center"
                                value={item.cantidad_personalizada}
                                onChange={(e) => handleCantidadGramosChange(item.id, e.target.value)}
                                min="25"
                                step="5"
                                style={{ 
                                  border: 'none',
                                  fontWeight: '600',
                                  backgroundColor: 'white'
                                }}
                              />
                              <button 
                                className="btn btn-outline-secondary quantity-btn"
                                type="button"
                                onClick={() => incrementarCantidad(item.id, item.cantidad)}
                                style={{ 
                                  border: '1px solid #dee2e6', 
                                  backgroundColor: '#ffffff',
                                  color: '#495057'
                                }}
                              >
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                            <span className="text-muted ms-2" style={{ fontSize: '0.9rem' }}>
                              {item.unidad_abrev || 'gr'}
                            </span>
                          </div>
                        ) : (
                          // Caso 1: Control de unidades normal
                          <div className="d-flex align-items-center justify-content-center">
                            <div 
                              className="input-group"
                              style={{ 
                                width: '160px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                borderRadius: '8px',
                                overflow: 'hidden'
                              }}
                            >
                              <button 
                                className="btn btn-outline-secondary quantity-btn"
                                type="button"
                                onClick={() => decrementarCantidad(item.id, item.cantidad)}
                                disabled={item.cantidad <= 1}
                                style={{ 
                                  border: '1px solid #dee2e6', 
                                  backgroundColor: '#ffffff',
                                  color: '#495057'
                                }}
                              >
                                <i className="bi bi-dash"></i>
                              </button>
                              <input
                                type="number"
                                className="form-control text-center"
                                value={item.cantidad}
                                onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                                min="1"
                                style={{ 
                                  border: 'none',
                                  fontWeight: '600',
                                  backgroundColor: 'white'
                                }}
                              />
                              <button 
                                className="btn btn-outline-secondary quantity-btn"
                                type="button"
                                onClick={() => incrementarCantidad(item.id, item.cantidad)}
                                style={{ 
                                  border: '1px solid #dee2e6', 
                                  backgroundColor: '#ffffff',
                                  color: '#495057'
                                }}
                              >
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                            <span className="text-muted ms-2" style={{ fontSize: '0.9rem' }}>
                              {item.cantidad === 1 ? 'ud' : 'uds'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="col-xl-2 col-lg-2">
                      <div className="text-center">
                        <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Subtotal</p>
                        <div>
                          <span className="fw-bold" style={{ color: '#2d3748', fontSize: '1.2rem' }}>
                            {item.es_caso_2 
                              ? formatearPrecio(item.precio)
                              : formatearPrecio(item.precio * item.cantidad)
                            }
                          </span>
                          {item.es_caso_2 && (
                            <div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                ({formatearPrecio(item.precio / item.cantidad_personalizada * 100)}/100{item.unidad_abrev})
                              </small>
                            </div>
                          )}
                          {item.es_caso_1 && item.cantidad > 1 && (
                            <div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {formatearPrecio(item.precio)} × {item.cantidad}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botón eliminar */}
                    <div className="col-xl-1 col-lg-1">
                      <div className="text-center">
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminarDelCarrito(item.id)}
                          title="Eliminar del carrito"
                          style={{ 
                            borderRadius: '8px',
                            width: '40px',
                            height: '40px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="bi bi-trash" style={{ fontSize: '0.9rem' }}></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen del Pedido Mejorado */}
          <div className="col-lg-4">
            <div 
              className="sticky-top"
              style={{ top: '20px' }}
            >
              <div 
                className="rounded p-4"
                style={{ 
                  backgroundColor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
              >
                <div className="d-flex align-items-center mb-4">
                  <i className="bi bi-receipt me-3" style={{ fontSize: '1.5rem', color: '#28ad10' }}></i>
                  <h4 className="fw-bold mb-0" style={{ color: '#2d3748' }}>Resumen del Pedido</h4>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ fontSize: '1rem', color: '#4a5568' }}>
                      Subtotal ({items.length} {items.length === 1 ? 'producto' : 'productos'}):
                    </span>
                    <span className="fw-bold" style={{ fontSize: '1.1rem', color: '#2d3748' }}>
                      {formatearPrecio(obtenerTotal())}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ fontSize: '1rem', color: '#4a5568' }}>Envío:</span>
                    <span className="text-muted" style={{ fontSize: '1rem' }}>A calcular</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ fontSize: '1rem', color: '#4a5568' }}>Descuentos:</span>
                    <span className="text-success fw-bold" style={{ fontSize: '1rem' }}>-$0,00</span>
                  </div>
                </div>

                <div 
                  className="border-top pt-3 mb-4"
                  style={{ borderColor: '#e2e8f0 !important' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold" style={{ fontSize: '1.3rem', color: '#2d3748' }}>Total:</span>
                    <span className="fw-bold" style={{ fontSize: '1.5rem', color: '#28ad10' }}>
                      {formatearPrecio(obtenerTotal())}
                    </span>
                  </div>
                </div>
                
                <div className="d-grid gap-3">
                  <button 
                    className="btn btn-success btn-lg py-3"
                    onClick={handleFinalizarPedido}
                    style={{ 
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      boxShadow: '0 4px 15px rgba(40, 173, 16, 0.3)',
                      border: 'none'
                    }}
                  >
                    <i className={`bi ${user ? 'bi-check-circle' : 'bi-box-arrow-in-right'} me-2`}></i>
                    {user ? 'Finalizar Compra' : 'Iniciar Sesión para Comprar'}
                  </button>
                  
                  <button 
                    onClick={() => navigate('/tienda')}
                    className="btn btn-outline-primary py-2"
                    style={{ 
                      borderRadius: '12px',
                      fontWeight: '500',
                      borderWidth: '2px'
                    }}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Continuar Comprando
                  </button>
                </div>

                {/* Información adicional */}
                <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="d-flex align-items-start">
                    <i className="bi bi-shield-check me-2 mt-1" style={{ color: '#28ad10' }}></i>
                    <div>
                      <small className="fw-bold" style={{ color: '#2d3748' }}>
                        Compra Segura
                      </small>
                      <br />
                      <small className="text-muted">
                        Tus datos están protegidos con encriptación SSL
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .quantity-btn {
          transition: all 0.2s ease !important;
        }
        
        .quantity-btn:hover:not(:disabled) {
          background-color: #28ad10 !important;
          border-color: #28ad10 !important;
          color: white !important;
        }
        
        .quantity-btn:active:not(:disabled) {
          background-color: #22941d !important;
          border-color: #22941d !important;
          color: white !important;
        }
      `}</style>

      {/* Modal de Finalizar Compra */}
      <ModalFinalizarCompra
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmarPedido}
        total={obtenerTotal()}
        items={items}
      />
    </div>
  );
}

export default Carrito;
