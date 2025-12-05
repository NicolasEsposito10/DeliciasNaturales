import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function ProveedoresAdmin() {
  const location = useLocation();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    cargarProveedores();
  }, []);

  // Detectar si se debe abrir el formulario automáticamente
  useEffect(() => {
    if (location.state?.abrirFormulario) {
      limpiarFormulario();
      setFormVisible(true);
      // Limpiar el state para evitar que se abra de nuevo al navegar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const cargarProveedores = () => {
    setLoading(true);
    axios.get('/api/proveedores')
      .then(res => {
        setProveedores(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando proveedores:', err);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editando) {
      axios.put(`/api/proveedores/${formData.id}`, formData)
        .then(() => {
          cargarProveedores();
          setFormVisible(false);
          limpiarFormulario();
          alert('Proveedor actualizado exitosamente');
        })
        .catch(err => {
          console.error('Error actualizando proveedor:', err);
          alert('Error al actualizar el proveedor');
        });
    } else {
      axios.post('/api/proveedores', formData)
        .then(() => {
          cargarProveedores();
          setFormVisible(false);
          limpiarFormulario();
          alert('Proveedor creado exitosamente');
        })
        .catch(err => {
          console.error('Error creando proveedor:', err);
          alert('Error al crear el proveedor');
        });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const editarProveedor = (proveedor) => {
    setFormData(proveedor);
    setEditando(true);
    setFormVisible(true);
  };

  const borrarProveedor = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
      axios.delete(`/api/proveedores/${id}`)
        .then(() => {
          cargarProveedores();
          alert('Proveedor eliminado exitosamente');
        })
        .catch(err => {
          console.error('Error eliminando proveedor:', err);
          alert('Error al eliminar el proveedor');
        });
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      id: '',
      nombre: '',
      telefono: '',
      email: ''
    });
    setEditando(false);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Administración de Proveedores</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => { limpiarFormulario(); setFormVisible(true); }}
        >
          <i className="bi bi-plus-circle"></i> Nuevo Proveedor
        </button>
      </div>

      {formVisible && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="m-0">{editando ? 'Editar Proveedor' : 'Crear Proveedor'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nombre *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="nombre" 
                  value={formData.nombre || ''} 
                  onChange={handleChange} 
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Teléfono</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    name="telefono" 
                    value={formData.telefono || ''} 
                    onChange={handleChange} 
                    placeholder="11-1234-5678"
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">E-mail</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    name="email" 
                    value={formData.email || ''} 
                    onChange={handleChange} 
                    placeholder="contacto@proveedor.com"
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  {editando ? 'Actualizar' : 'Guardar'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {setFormVisible(false); limpiarFormulario();}}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header bg-light">
          <h5 className="m-0">Proveedores existentes</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : proveedores.length === 0 ? (
            <div className="alert alert-info">
              No hay proveedores registrados. Crea uno nuevo.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>E-mail</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map(proveedor => (
                    <tr key={proveedor.id}>
                      <td>{proveedor.id}</td>
                      <td><strong>{proveedor.nombre}</strong></td>
                      <td>{proveedor.telefono || '-'}</td>
                      <td>{proveedor.email || '-'}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary" 
                            onClick={() => editarProveedor(proveedor)}
                          >
                            <i className="bi bi-pencil"></i> Editar
                          </button>
                          <button 
                            className="btn btn-outline-danger" 
                            onClick={() => borrarProveedor(proveedor.id)}
                          >
                            <i className="bi bi-trash"></i> Eliminar
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
  );
}

export default ProveedoresAdmin;
