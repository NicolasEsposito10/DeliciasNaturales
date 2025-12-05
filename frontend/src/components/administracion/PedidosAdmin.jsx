import React, { useState, useEffect } from 'react';
import { formatearPrecio } from '../../utils/formatoArgentino.jsx';

function PedidosAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [mostrarModalCosto, setMostrarModalCosto] = useState(false);
  const [nuevoCosto, setNuevoCosto] = useState('');

  const estadosColores = {
    'pendiente': { bg: 'warning', text: 'dark', icon: 'clock' },
    'entregado': { bg: 'success', text: 'white', icon: 'check-all' },
    'cancelado': { bg: 'danger', text: 'white', icon: 'x-circle' }
  };

  useEffect(() => {
    cargarPedidos();
    cargarCostoEnvio();
  }, []);

  const cargarCostoEnvio = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/pedidos/config/costo-envio');
      const data = await response.json();
      setCostoEnvio(data.costo_envio);
    } catch (err) {
      console.error('Error al cargar costo de envío:', err);
    }
  };

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/pedidos/admin/todos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los pedidos');
      }

      const data = await response.json();
      setPedidos(data.pedidos);
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      // Recargar pedidos
      await cargarPedidos();
      alert('Estado actualizado correctamente');
    } catch (err) {
      console.error('Error:', err);
      alert('Error al actualizar el estado del pedido');
    }
  };

  const actualizarCostoEnvio = async () => {
    try {
      const token = localStorage.getItem('token');
      const costo = parseFloat(nuevoCosto);

      if (isNaN(costo) || costo < 0) {
        alert('Por favor ingresa un costo válido');
        return;
      }

      const response = await fetch('http://localhost:5000/api/pedidos/config/costo-envio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ costo_envio: costo })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el costo');
      }

      setCostoEnvio(costo);
      setMostrarModalCosto(false);
      setNuevoCosto('');
      alert('Costo de envío actualizado correctamente');
    } catch (err) {
      console.error('Error:', err);
      alert('Error al actualizar el costo de envío');
    }
  };

  const pedidosFiltrados = filtroEstado === 'todos' 
    ? pedidos 
    : pedidos.filter(p => p.estado === filtroEstado);

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-2">
              <i className="bi bi-bag-check me-3" style={{ color: '#28ad10' }}></i>
              Gestión de Pedidos
            </h2>
            <p className="text-muted mb-0">
              Total de pedidos: {pedidos.length}
            </p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <div className="card border-0 shadow-sm px-3 py-2">
              <div className="d-flex align-items-center gap-3">
                <div>
                  <small className="text-muted d-block">Costo de envío actual</small>
                  <strong className="text-success" style={{ fontSize: '1.2rem' }}>
                    {formatearPrecio(costoEnvio)}
                  </strong>
                </div>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setNuevoCosto(costoEnvio.toString());
                    setMostrarModalCosto(true);
                  }}
                >
                  <i className="bi bi-pencil me-1"></i>
                  Editar
                </button>
              </div>
            </div>
            <button 
              className="btn btn-outline-primary"
              onClick={cargarPedidos}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2">
              <button
                className={`btn ${filtroEstado === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFiltroEstado('todos')}
              >
                Todos ({pedidos.length})
              </button>
              <button
                className={`btn ${filtroEstado === 'pendiente' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setFiltroEstado('pendiente')}
              >
                Pendientes ({pedidos.filter(p => p.estado === 'pendiente').length})
              </button>
              <button
                className={`btn ${filtroEstado === 'entregado' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setFiltroEstado('entregado')}
              >
                Entregados ({pedidos.filter(p => p.estado === 'entregado').length})
              </button>
              <button
                className={`btn ${filtroEstado === 'cancelado' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setFiltroEstado('cancelado')}
              >
                Cancelados ({pedidos.filter(p => p.estado === 'cancelado').length})
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos */}
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#a0aec0' }}></i>
            <p className="text-muted mt-3">No hay pedidos {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : ''}</p>
          </div>
        ) : (
          <div className="row g-4">
            {pedidosFiltrados.map(pedido => (
              <div key={pedido.id} className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="row align-items-center">
                      {/* Info del Pedido */}
                      <div className="col-lg-3">
                        <h5 className="mb-2">
                          <span className="badge bg-secondary me-2">#{pedido.id}</span>
                        </h5>
                        <p className="text-muted mb-1">
                          <i className="bi bi-calendar me-2"></i>
                          {formatearFecha(pedido.fecha_pedido)}
                        </p>
                        <p className="text-muted mb-0">
                          <i className="bi bi-person me-2"></i>
                          {pedido.usuario ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}` : `Usuario ID: ${pedido.usuario_id}`}
                        </p>
                      </div>

                      {/* Tipo de Entrega */}
                      <div className="col-lg-3">
                        <div className="mb-2">
                          {pedido.tipo_entrega === 'envio' ? (
                            <>
                              <span className="badge bg-info mb-2">
                                <i className="bi bi-truck me-1"></i>
                                Envío a Domicilio
                              </span>
                              <p className="mb-1" style={{ fontSize: '0.9rem' }}>
                                <strong>Dirección:</strong><br />
                                {pedido.calle} {pedido.numero_calle}<br />
                                Entre: {pedido.entre_calles}
                              </p>
                              <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                                <i className="bi bi-telephone me-1"></i>
                                {pedido.telefono_entrega}
                              </p>
                            </>
                          ) : (
                            <span className="badge bg-success">
                              <i className="bi bi-shop me-1"></i>
                              Retiro por Local
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="badge bg-secondary">
                            {pedido.metodo_pago === 'efectivo' ? (
                              <>
                                <i className="bi bi-cash me-1"></i>
                                Efectivo
                              </>
                            ) : pedido.metodo_pago === 'transferencia' ? (
                              <>
                                <i className="bi bi-bank me-1"></i>
                                Transferencia
                              </>
                            ) : (
                              <>
                                <i className="bi bi-credit-card me-1"></i>
                                Todos los métodos
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Estado */}
                      <div className="col-lg-2">
                        <select
                          className={`form-select bg-${estadosColores[pedido.estado]?.bg || 'secondary'} text-${estadosColores[pedido.estado]?.text || 'white'}`}
                          value={pedido.estado}
                          onChange={(e) => cambiarEstadoPedido(pedido.id, e.target.value)}
                          style={{ fontWeight: '600' }}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>

                      {/* Total */}
                      <div className="col-lg-2 text-center">
                        <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>Total</p>
                        <h4 className="mb-0 text-success fw-bold">
                          {formatearPrecio(pedido.total)}
                        </h4>
                        {pedido.costo_envio > 0 && (
                          <small className="text-muted">
                            (Envío: {formatearPrecio(pedido.costo_envio)})
                          </small>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="col-lg-2 text-end">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => setPedidoSeleccionado(pedido)}
                        >
                          <i className="bi bi-eye me-2"></i>
                          Ver Detalles
                        </button>
                      </div>
                    </div>

                    {/* Items del pedido (expandible) */}
                    {pedidoSeleccionado?.id === pedido.id && (
                      <div className="mt-4 pt-4 border-top">
                        <h6 className="fw-bold mb-3">
                          <i className="bi bi-basket me-2"></i>
                          Productos del Pedido
                        </h6>
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th className="text-center">Cantidad</th>
                                <th className="text-end">Precio Unit.</th>
                                <th className="text-end">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pedido.items.map((item, index) => (
                                <tr key={index}>
                                  <td>
                                    {item.nombre_producto}
                                    {item.es_fraccionado && (
                                      <span className="badge bg-light text-dark ms-2">
                                        {item.cantidad_personalizada}{item.unidad}
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {item.es_fraccionado ? '1' : item.cantidad}
                                    {!item.es_fraccionado && ' ud'}
                                  </td>
                                  <td className="text-end">{formatearPrecio(item.precio_unitario)}</td>
                                  <td className="text-end fw-bold">{formatearPrecio(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="table-light">
                                <td colSpan="3" className="text-end fw-bold">Subtotal:</td>
                                <td className="text-end fw-bold">{formatearPrecio(pedido.subtotal)}</td>
                              </tr>
                              {pedido.costo_envio > 0 && (
                                <tr className="table-light">
                                  <td colSpan="3" className="text-end">Envío:</td>
                                  <td className="text-end">{formatearPrecio(pedido.costo_envio)}</td>
                                </tr>
                              )}
                              <tr className="table-light">
                                <td colSpan="3" className="text-end fw-bold fs-5">TOTAL:</td>
                                <td className="text-end fw-bold fs-5 text-success">
                                  {formatearPrecio(pedido.total)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-secondary mt-2"
                          onClick={() => setPedidoSeleccionado(null)}
                        >
                          Cerrar Detalles
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para editar costo de envío */}
      {mostrarModalCosto && (
        <div 
          className="modal fade show" 
          style={{ 
            display: 'block', 
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
          onClick={() => setMostrarModalCosto(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-truck me-2"></i>
                  Configurar Costo de Envío
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setMostrarModalCosto(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Este costo se aplicará a todos los pedidos con envío a domicilio en Arroyito.
                </p>
                <div className="mb-3">
                  <label className="form-label fw-bold">Costo de Envío ($)</label>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    value={nuevoCosto}
                    onChange={(e) => setNuevoCosto(e.target.value)}
                    placeholder="Ej: 500"
                    min="0"
                    step="0.01"
                  />
                  <small className="text-muted">
                    Ingresa el costo en pesos argentinos
                  </small>
                </div>
                <div className="alert alert-info d-flex align-items-center">
                  <i className="bi bi-info-circle me-2"></i>
                  <div>
                    <small>
                      Los cambios se aplicarán inmediatamente a los nuevos pedidos.
                    </small>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setMostrarModalCosto(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={actualizarCostoEnvio}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PedidosAdmin;
