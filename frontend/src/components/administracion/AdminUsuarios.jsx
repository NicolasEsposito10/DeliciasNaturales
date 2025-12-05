import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, getToken } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [accionModal, setAccionModal] = useState('');
  const [nuevoPermiso, setNuevoPermiso] = useState('cliente');

  // Verificar permisos al cargar
  useEffect(() => {
    console.log('🔍 AdminUsuarios - Verificando permisos...');
    console.log('  - isAuthenticated():', isAuthenticated());
    console.log('  - isAdmin():', isAdmin());
    console.log('  - user:', user);
    
    if (!isAuthenticated()) {
      console.log('❌ No autenticado, redirigiendo a login');
      navigate('/login');
      return;
    }
    
    if (!isAdmin()) {
      console.log('❌ No es admin, redirigiendo a administrar');
      navigate('/administrar');
      mostrarNotificacion('No tienes permisos para acceder a esta sección', 'error');
      return;
    }
    
    console.log('✅ Permisos OK, cargando usuarios...');
    cargarUsuarios();
  }, [isAuthenticated, isAdmin, navigate]);

  // Función para obtener token (ahora usar el del AuthContext)
  const obtenerToken = () => {
    const token = getToken();
    console.log('🔑 obtenerToken:', token ? 'disponible' : 'NO disponible');
    return token;
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const token = obtenerToken();
      
      if (!token) {
        mostrarNotificacion('No hay token de autenticación', 'error');
        navigate('/login');
        return;
      }

      console.log('🔐 Realizando petición con token:', token.substring(0, 20) + '...');
      
      const response = await axios.get('http://localhost:5000/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Usuarios cargados:', response.data);
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      
      if (error.response?.status === 401) {
        mostrarNotificacion('Sesión expirada. Por favor, inicia sesión nuevamente', 'error');
        navigate('/login');
      } else if (error.response?.status === 403) {
        mostrarNotificacion('No tienes permisos para ver esta información', 'error');
        navigate('/administrar');
      } else {
        mostrarNotificacion('Error al cargar usuarios: ' + (error.response?.data?.error || error.message), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-danger';
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
           style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 5000);
  };

  const filtrarUsuarios = () => {
    let usuariosFiltrados = usuarios.filter(usuario =>
      usuario.email.toLowerCase().includes(filtro.toLowerCase()) ||
      usuario.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
      usuario.apellido?.toLowerCase().includes(filtro.toLowerCase())
    );

    if (tipoFiltro !== 'todos') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario => usuario.tipo === tipoFiltro);
    }

    return usuariosFiltrados;
  };

  const abrirModal = (usuario, accion) => {
    setUsuarioSeleccionado(usuario);
    setAccionModal(accion);
    setNuevoPermiso(usuario.tipo || 'cliente');
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setUsuarioSeleccionado(null);
    setAccionModal('');
    setNuevoPermiso('cliente');
  };

  const eliminarUsuario = async () => {
    try {
      const token = obtenerToken();
      await axios.delete(`http://localhost:5000/api/usuarios/${usuarioSeleccionado.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      mostrarNotificacion('Usuario eliminado exitosamente');
      cargarUsuarios();
      cerrarModal();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      mostrarNotificacion('Error al eliminar usuario: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const cambiarPermisos = async () => {
    try {
      const token = obtenerToken();
      await axios.put(`http://localhost:5000/api/usuarios/${usuarioSeleccionado.id}/permisos`, {
        tipo: nuevoPermiso
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      mostrarNotificacion('Permisos actualizados exitosamente');
      cargarUsuarios();
      cerrarModal();
    } catch (error) {
      console.error('Error actualizando permisos:', error);
      mostrarNotificacion('Error al actualizar permisos: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const toggleEstadoUsuario = async (usuario) => {
    try {
      const token = obtenerToken();
      const nuevoEstado = usuario.activo ? 'inactivo' : 'activo';
      await axios.put(`http://localhost:5000/api/usuarios/${usuario.id}/estado`, {
        activo: !usuario.activo
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      mostrarNotificacion(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
      cargarUsuarios();
    } catch (error) {
      console.error('Error cambiando estado del usuario:', error);
      mostrarNotificacion('Error al cambiar estado del usuario: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const getEstadoBadge = (usuario) => {
    if (usuario.activo === false) {
      return <span className="badge bg-danger">Inactivo</span>;
    }
    return <span className="badge bg-success">Activo</span>;
  };

  const getTipoBadge = (tipo) => {
    const badges = {
      'admin': <span className="badge bg-danger">Administrador</span>,
      'cliente': <span className="badge bg-info">Cliente</span>
    };
    return badges[tipo] || <span className="badge bg-secondary">Desconocido</span>;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-1">
                <i className="bi bi-people-fill text-purple me-2"></i>
                Administración de Usuarios
              </h2>
              <p className="text-muted mb-0">Gestiona usuarios, permisos y estados del sistema</p>
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate('/administrar')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Buscar usuarios:</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por email, nombre o apellido..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Filtrar por tipo:</label>
                  <select
                    className="form-select"
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value)}
                  >
                    <option value="todos">Todos los usuarios</option>
                    <option value="admin">Administradores</option>
                    <option value="cliente">Clientes</option>
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    className="btn btn-primary w-100"
                    onClick={cargarUsuarios}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Cargando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Actualizar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body text-center">
              <i className="bi bi-people-fill fs-1 mb-2"></i>
              <h4 className="mb-0">{usuarios.length}</h4>
              <small>Total Usuarios</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-danger text-white">
            <div className="card-body text-center">
              <i className="bi bi-shield-fill fs-1 mb-2"></i>
              <h4 className="mb-0">{usuarios.filter(u => u.tipo === 'admin').length}</h4>
              <small>Administradores</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body text-center">
              <i className="bi bi-person-fill fs-1 mb-2"></i>
              <h4 className="mb-0">{usuarios.filter(u => u.tipo === 'cliente').length}</h4>
              <small>Clientes</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-table me-2"></i>
                Lista de Usuarios ({filtrarUsuarios().length})
              </h5>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-3 text-muted">Cargando usuarios...</p>
                </div>
              ) : filtrarUsuarios().length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-people text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3 text-muted">No se encontraron usuarios con los filtros aplicados</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Fecha Registro</th>
                        <th>Último Acceso</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrarUsuarios().map((usuario) => (
                        <tr key={usuario.id}>
                          <td className="fw-bold">{usuario.id}</td>
                          <td>
                            <div>
                              <div className="fw-semibold">{usuario.email}</div>
                              {usuario.email_verificado && (
                                <small className="text-success">
                                  <i className="bi bi-check-circle me-1"></i>
                                  Verificado
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            {usuario.nombre || usuario.apellido ? (
                              <div>
                                <div>{usuario.nombre} {usuario.apellido}</div>
                                {usuario.telefono && (
                                  <small className="text-muted">{usuario.telefono}</small>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">Sin datos</span>
                            )}
                          </td>
                          <td>{getTipoBadge(usuario.tipo)}</td>
                          <td>{getEstadoBadge(usuario)}</td>
                          <td>
                            <small>{formatearFecha(usuario.fecha_creacion)}</small>
                          </td>
                          <td>
                            <small>
                              {usuario.ultimo_acceso ? 
                                formatearFecha(usuario.ultimo_acceso) : 
                                'Nunca'
                              }
                            </small>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-warning"
                                onClick={() => abrirModal(usuario, 'permisos')}
                                title="Cambiar permisos"
                              >
                                <i className="bi bi-gear"></i>
                              </button>
                              <button
                                className={`btn ${usuario.activo ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                                onClick={() => toggleEstadoUsuario(usuario)}
                                title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                              >
                                <i className={`bi ${usuario.activo ? 'bi-person-x' : 'bi-person-check'}`}></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => abrirModal(usuario, 'eliminar')}
                                title="Eliminar usuario"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para acciones */}
      {modalVisible && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {accionModal === 'eliminar' ? 'Eliminar Usuario' : 'Cambiar Permisos'}
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModal}></button>
              </div>
              <div className="modal-body">
                {accionModal === 'eliminar' ? (
                  <div>
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>¡Atención!</strong> Esta acción no se puede deshacer.
                    </div>
                    <p>
                      ¿Estás seguro de que quieres eliminar al usuario{' '}
                      <strong>{usuarioSeleccionado?.email}</strong>?
                    </p>
                    <p className="text-muted">
                      Se eliminarán permanentemente todos los datos asociados a este usuario.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p>
                      Cambiar permisos para el usuario{' '}
                      <strong>{usuarioSeleccionado?.email}</strong>
                    </p>
                    <div className="mb-3">
                      <label className="form-label">Nuevo tipo de usuario:</label>
                      <select
                        className="form-select"
                        value={nuevoPermiso}
                        onChange={(e) => setNuevoPermiso(e.target.value)}
                      >
                        <option value="cliente">Cliente</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div className="alert alert-info">
                      <h6>Niveles de permisos:</h6>
                      <ul className="mb-0">
                        <li><strong>Cliente:</strong> Acceso básico a la tienda</li>
                        <li><strong>Administrador:</strong> Acceso completo al sistema</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                {accionModal === 'eliminar' ? (
                  <button type="button" className="btn btn-danger" onClick={eliminarUsuario}>
                    <i className="bi bi-trash me-2"></i>
                    Eliminar Usuario
                  </button>
                ) : (
                  <button type="button" className="btn btn-warning" onClick={cambiarPermisos}>
                    <i className="bi bi-gear me-2"></i>
                    Actualizar Permisos
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .text-purple {
          color: #6f42c1 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminUsuarios;
