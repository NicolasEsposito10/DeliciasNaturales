import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EtiquetasAdmin() {
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nombre: ''
  });

  useEffect(() => {
    cargarEtiquetas();
  }, []);

  const cargarEtiquetas = () => {
    setLoading(true);
    axios.get('/api/etiquetas')
      .then(res => {
        setEtiquetas(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando etiquetas:', err);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editando) {
      axios.put(`/api/etiquetas/${formData.id}`, formData)
        .then(() => {
          cargarEtiquetas();
          setFormVisible(false);
          limpiarFormulario();
          alert('Etiqueta actualizada exitosamente');
        })
        .catch(err => {
          console.error('Error actualizando etiqueta:', err);
          alert('Error al actualizar la etiqueta');
        });
    } else {
      axios.post('/api/etiquetas', formData)
        .then(() => {
          cargarEtiquetas();
          setFormVisible(false);
          limpiarFormulario();
          alert('Etiqueta creada exitosamente');
        })
        .catch(err => {
          console.error('Error creando etiqueta:', err);
          alert('Error al crear la etiqueta');
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

  const editarEtiqueta = (etiqueta) => {
    setFormData(etiqueta);
    setEditando(true);
    setFormVisible(true);
  };

  const borrarEtiqueta = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta etiqueta?')) {
      axios.delete(`/api/etiquetas/${id}`)
        .then(() => {
          cargarEtiquetas();
          alert('Etiqueta eliminada exitosamente');
        })
        .catch(err => {
          console.error('Error eliminando etiqueta:', err);
          alert('Error al eliminar la etiqueta');
        });
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      id: '',
      nombre: ''
    });
    setEditando(false);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Administración de Etiquetas</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => { limpiarFormulario(); setFormVisible(true); }}
        >
          <i className="bi bi-plus-circle"></i> Nueva Etiqueta
        </button>
      </div>

      {formVisible && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="m-0">{editando ? 'Editar Etiqueta' : 'Crear Etiqueta'}</h5>
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
                  placeholder="Ej: Orgánico, Sin TACC, Vegano, etc."
                />
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
          <h5 className="m-0">Etiquetas existentes</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : etiquetas.length === 0 ? (
            <div className="alert alert-info">
              No hay etiquetas registradas. Crea una nueva.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {etiquetas.map(etiqueta => (
                    <tr key={etiqueta.id}>
                      <td>{etiqueta.id}</td>
                      <td><strong>{etiqueta.nombre}</strong></td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary" 
                            onClick={() => editarEtiqueta(etiqueta)}
                          >
                            <i className="bi bi-pencil"></i> Editar
                          </button>
                          <button 
                            className="btn btn-outline-danger" 
                            onClick={() => borrarEtiqueta(etiqueta.id)}
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

export default EtiquetasAdmin;