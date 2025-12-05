import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function UnidadesAdmin() {
  const location = useLocation();
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    abreviacion: ''
  });

  useEffect(() => {
    cargarUnidades();
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

  const cargarUnidades = () => {
    setLoading(true);
    axios.get('/api/unidades')
      .then(res => {
        setUnidades(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando unidades:', err);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editando) {
      axios.put(`/api/unidades/${formData.id}`, formData)
        .then(() => {
          cargarUnidades();
          setFormVisible(false);
          limpiarFormulario();
          alert('Unidad actualizada exitosamente');
        })
        .catch(err => {
          console.error('Error actualizando unidad:', err);
          alert('Error al actualizar la unidad');
        });
    } else {
      axios.post('/api/unidades', formData)
        .then(() => {
          cargarUnidades();
          setFormVisible(false);
          limpiarFormulario();
          alert('Unidad creada exitosamente');
        })
        .catch(err => {
          console.error('Error creando unidad:', err);
          alert('Error al crear la unidad');
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

  const editarUnidad = (unidad) => {
    setFormData(unidad);
    setEditando(true);
    setFormVisible(true);
  };

  const borrarUnidad = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta unidad?')) {
      axios.delete(`/api/unidades/${id}`)
        .then(() => {
          cargarUnidades();
          alert('Unidad eliminada exitosamente');
        })
        .catch(err => {
          console.error('Error eliminando unidad:', err);
          alert('Error al eliminar la unidad');
        });
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      id: '',
      nombre: '',
      abreviacion: ''
    });
    setEditando(false);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Administración de Unidades</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => { limpiarFormulario(); setFormVisible(true); }}
        >
          <i className="bi bi-plus-circle"></i> Nueva Unidad
        </button>
      </div>

      {formVisible && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="m-0">{editando ? 'Editar Unidad' : 'Crear Unidad'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-8 mb-3">
                  <label className="form-label">Nombre *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="nombre" 
                    value={formData.nombre || ''} 
                    onChange={handleChange} 
                    required
                    placeholder="Ej: gramos, kilogramos, litros, etc."
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Abreviación *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="abreviacion" 
                    value={formData.abreviacion || ''} 
                    onChange={handleChange} 
                    required
                    placeholder="Ej: g, kg, l, etc."
                    maxLength="10"
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
          <h5 className="m-0">Unidades existentes</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : unidades.length === 0 ? (
            <div className="alert alert-info">
              No hay unidades registradas. Crea una nueva.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Abreviación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {unidades.map(unidad => (
                    <tr key={unidad.id}>
                      <td>{unidad.id}</td>
                      <td><strong>{unidad.nombre}</strong></td>
                      <td><span className="badge bg-info">{unidad.abreviacion}</span></td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary" 
                            onClick={() => editarUnidad(unidad)}
                          >
                            <i className="bi bi-pencil"></i> Editar
                          </button>
                          <button 
                            className="btn btn-outline-danger" 
                            onClick={() => borrarUnidad(unidad.id)}
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

export default UnidadesAdmin;
