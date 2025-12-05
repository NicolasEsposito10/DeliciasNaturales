import React, { useState, useEffect } from 'react';
import { formatearPrecio } from '../../utils/formatoArgentino.jsx';

function ModalFinalizarCompra({ show, onClose, onConfirm, total, items }) {
  const [tipoEntrega, setTipoEntrega] = useState('retiro');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [costoEnvio, setCostoEnvio] = useState(0);
  
  // Datos para envío
  const [telefono, setTelefono] = useState('');
  const [calle, setCalle] = useState('');
  const [numeroCalle, setNumeroCalle] = useState('');
  const [entreCalles, setEntreCalles] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Obtener el costo de envío desde el backend
  useEffect(() => {
    const fetchCostoEnvio = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/pedidos/config/costo-envio');
        const data = await response.json();
        setCostoEnvio(data.costo_envio);
      } catch (err) {
        console.error('Error al obtener costo de envío:', err);
        setCostoEnvio(500); // Valor por defecto
      }
    };
    
    if (show) {
      fetchCostoEnvio();
    }
  }, [show]);

  // Calcular el total con envío
  const totalConEnvio = tipoEntrega === 'envio' ? total + costoEnvio : total;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (tipoEntrega === 'envio') {
      if (!telefono || !calle || !numeroCalle || !entreCalles) {
        setError('Por favor, completa todos los campos de envío');
        return;
      }
      
      // Validar formato de teléfono (solo números)
      if (!/^\d+$/.test(telefono)) {
        setError('El teléfono debe contener solo números');
        return;
      }
    }

    // Preparar datos del pedido
    const pedidoData = {
      tipo_entrega: tipoEntrega,
      metodo_pago: tipoEntrega === 'envio' ? metodoPago : 'local',
      items: items.map(item => ({
        producto_id: item.producto_id || item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        es_fraccionado: item.es_caso_2 || false,
        cantidad_personalizada: item.cantidad_personalizada,
        unidad: item.unidad_abrev
      }))
    };

    // Agregar datos de envío si corresponde
    if (tipoEntrega === 'envio') {
      pedidoData.telefono_entrega = telefono;
      pedidoData.calle = calle;
      pedidoData.numero_calle = numeroCalle;
      pedidoData.entre_calles = entreCalles;
    }

    onConfirm(pedidoData);
  };

  const handleClose = () => {
    // Resetear formulario
    setTipoEntrega('retiro');
    setMetodoPago('efectivo');
    setTelefono('');
    setCalle('');
    setNumeroCalle('');
    setEntreCalles('');
    setError('');
    onClose();
  };

  if (!show) return null;

  return (
    <div 
      className="modal fade show" 
      style={{ 
        display: 'block', 
        backgroundColor: 'rgba(0,0,0,0.5)',
        overflowY: 'auto'
      }}
      onClick={handleClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
          {/* Header */}
          <div 
            className="modal-header"
            style={{ 
              backgroundColor: '#28ad10',
              color: 'white',
              borderRadius: '16px 16px 0 0',
              padding: '1.5rem'
            }}
          >
            <h5 className="modal-title fw-bold" style={{ fontSize: '1.5rem' }}>
              <i className="bi bi-bag-check me-3"></i>
              Finalizar Compra
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={handleClose}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ padding: '2rem' }}>
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Tipo de Entrega */}
              <div className="mb-4">
                <label className="form-label fw-bold" style={{ fontSize: '1.1rem', color: '#2d3748' }}>
                  <i className="bi bi-truck me-2"></i>
                  Tipo de Entrega
                </label>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div 
                      className={`card h-100 ${tipoEntrega === 'retiro' ? 'border-success' : ''}`}
                      style={{ 
                        cursor: 'pointer',
                        borderWidth: tipoEntrega === 'retiro' ? '3px' : '1px',
                        transition: 'all 0.3s'
                      }}
                      onClick={() => setTipoEntrega('retiro')}
                    >
                      <div className="card-body text-center p-4">
                        <i 
                          className="bi bi-shop" 
                          style={{ 
                            fontSize: '3rem', 
                            color: tipoEntrega === 'retiro' ? '#28ad10' : '#a0aec0'
                          }}
                        ></i>
                        <h6 className="mt-3 fw-bold">Retiro por Local</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                          Sin costo adicional
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div 
                      className={`card h-100 ${tipoEntrega === 'envio' ? 'border-success' : ''}`}
                      style={{ 
                        cursor: 'pointer',
                        borderWidth: tipoEntrega === 'envio' ? '3px' : '1px',
                        transition: 'all 0.3s'
                      }}
                      onClick={() => setTipoEntrega('envio')}
                    >
                      <div className="card-body text-center p-4">
                        <i 
                          className="bi bi-house-door" 
                          style={{ 
                            fontSize: '3rem', 
                            color: tipoEntrega === 'envio' ? '#28ad10' : '#a0aec0'
                          }}
                        ></i>
                        <h6 className="mt-3 fw-bold">Envío a Domicilio</h6>
                        <p className="text-success mb-1 fw-bold" style={{ fontSize: '0.9rem' }}>
                          + {formatearPrecio(costoEnvio)}
                        </p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                          Solo en Arroyito
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos de Envío (solo si es envío a domicilio) */}
              {tipoEntrega === 'envio' && (
                <>
                  {/* Nota informativa sobre zona de envío */}
                  <div className="alert alert-info d-flex align-items-center mb-3" role="alert">
                    <i className="bi bi-info-circle-fill me-3" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <strong>Zona de envío:</strong> Los envíos a domicilio solo están disponibles dentro de la ciudad de Arroyito.
                    </div>
                  </div>

                  <div className="mb-4 p-4 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                    <h6 className="fw-bold mb-3" style={{ color: '#2d3748' }}>
                      <i className="bi bi-geo-alt me-2"></i>
                      Datos de Envío
                    </h6>
                    
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="form-label">Teléfono de Contacto *</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Ej: 1234567890"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          required={tipoEntrega === 'envio'}
                        />
                      </div>
                      
                      <div className="col-md-8">
                        <label className="form-label">Calle *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nombre de la calle"
                          value={calle}
                          onChange={(e) => setCalle(e.target.value)}
                          required={tipoEntrega === 'envio'}
                        />
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">Número *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nº"
                          value={numeroCalle}
                          onChange={(e) => setNumeroCalle(e.target.value)}
                          required={tipoEntrega === 'envio'}
                        />
                      </div>
                      
                      <div className="col-md-12">
                        <label className="form-label">Entre qué calles *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ej: Entre Av. Principal y Calle Secundaria"
                          value={entreCalles}
                          onChange={(e) => setEntreCalles(e.target.value)}
                          required={tipoEntrega === 'envio'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Método de Pago (solo para envío) */}
                  <div className="mb-4">
                    <label className="form-label fw-bold" style={{ fontSize: '1.1rem', color: '#2d3748' }}>
                      <i className="bi bi-credit-card me-2"></i>
                      Método de Pago
                    </label>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div 
                          className={`card h-100 ${metodoPago === 'efectivo' ? 'border-success' : ''}`}
                          style={{ 
                            cursor: 'pointer',
                            borderWidth: metodoPago === 'efectivo' ? '3px' : '1px',
                            transition: 'all 0.3s'
                          }}
                          onClick={() => setMetodoPago('efectivo')}
                        >
                          <div className="card-body text-center p-4">
                            <i 
                              className="bi bi-cash-stack" 
                              style={{ 
                                fontSize: '3rem', 
                                color: metodoPago === 'efectivo' ? '#28ad10' : '#a0aec0'
                              }}
                            ></i>
                            <h6 className="mt-3 fw-bold">Efectivo</h6>
                            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                              Pago al recibir
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div 
                          className={`card h-100 ${metodoPago === 'transferencia' ? 'border-success' : ''}`}
                          style={{ 
                            cursor: 'pointer',
                            borderWidth: metodoPago === 'transferencia' ? '3px' : '1px',
                            transition: 'all 0.3s'
                          }}
                          onClick={() => setMetodoPago('transferencia')}
                        >
                          <div className="card-body text-center p-4">
                            <i 
                              className="bi bi-bank" 
                              style={{ 
                                fontSize: '3rem', 
                                color: metodoPago === 'transferencia' ? '#28ad10' : '#a0aec0'
                              }}
                            ></i>
                            <h6 className="mt-3 fw-bold">Transferencia</h6>
                            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                              Bancaria o MercadoPago
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Resumen del Total */}
              <div 
                className="p-4 rounded"
                style={{ backgroundColor: '#e6f3ff' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ fontSize: '1rem', color: '#4a5568' }}>Subtotal:</span>
                  <span className="fw-bold" style={{ fontSize: '1.1rem' }}>
                    {formatearPrecio(total)}
                  </span>
                </div>
                
                {tipoEntrega === 'envio' && (
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span style={{ fontSize: '1rem', color: '#4a5568' }}>Envío:</span>
                    <span className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                      + {formatearPrecio(costoEnvio)}
                    </span>
                  </div>
                )}
                
                <hr style={{ margin: '0.75rem 0' }} />
                
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold" style={{ fontSize: '1.3rem', color: '#2d3748' }}>
                    Total:
                  </span>
                  <span className="fw-bold" style={{ fontSize: '1.5rem', color: '#28ad10' }}>
                    {formatearPrecio(totalConEnvio)}
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div 
            className="modal-footer"
            style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}
          >
            <button 
              type="button" 
              className="btn btn-outline-secondary px-4 py-2"
              onClick={handleClose}
              style={{ borderRadius: '8px', fontWeight: '500' }}
            >
              Cancelar
            </button>
            <button 
              type="button"
              className="btn btn-success px-5 py-2"
              onClick={handleSubmit}
              disabled={loading}
              style={{ 
                borderRadius: '8px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(40, 173, 16, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Procesando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Confirmar Pedido
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalFinalizarCompra;
