import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function MarcasAdmin() {
  const location = useLocation();
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nombre: ''
  });

  useEffect(() => {
    cargarMarcas();
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

  const cargarMarcas = () => {
    setLoading(true);
    axios.get('/api/marcas')
      .then(res => {
        setMarcas(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando marcas:', err);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editando) {
      axios.put(`/api/marcas/${formData.id}`, formData)
        .then(() => {
          cargarMarcas();
          setFormVisible(false);
          limpiarFormulario();
          alert('Marca actualizada exitosamente');
        })
        .catch(err => {
          console.error('Error actualizando marca:', err);
          alert('Error al actualizar la marca');
        });
    } else {
      axios.post('/api/marcas', formData)
        .then(() => {
          cargarMarcas();
          setFormVisible(false);
          limpiarFormulario();
          alert('Marca creada exitosamente');
        })
        .catch(err => {
          console.error('Error creando marca:', err);
          alert('Error al crear la marca');
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

  const editarMarca = (marca) => {
    setFormData(marca);
    setEditando(true);
    setFormVisible(true);
  };

  const borrarMarca = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta marca?')) {
      axios.delete(`/api/marcas/${id}`)
        .then(() => {
          cargarMarcas();
          alert('Marca eliminada exitosamente');
        })
        .catch(err => {
          console.error('Error eliminando marca:', err);
          alert('Error al eliminar la marca');
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
        <h2>Administración de Marcas</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => { limpiarFormulario(); setFormVisible(true); }}
        >
          <i className="bi bi-plus-circle"></i> Nueva Marca
        </button>
      </div>

      {formVisible && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="m-0">{editando ? 'Editar Marca' : 'Crear Marca'}</h5>
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
                  placeholder="Ej: La Serenísima, Granix, etc."
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
          <h5 className="m-0">Marcas existentes</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : marcas.length === 0 ? (
            <div className="alert alert-info">
              No hay marcas registradas. Crea una nueva.
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
                  {marcas.map(marca => (
                    <tr key={marca.id}>
                      <td>{marca.id}</td>
                      <td><strong>{marca.nombre}</strong></td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary" 
                            onClick={() => editarMarca(marca)}
                          >
                            <i className="bi bi-pencil"></i> Editar
                          </button>
                          <button 
                            className="btn btn-outline-danger" 
                            onClick={() => borrarMarca(marca.id)}
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

export default MarcasAdmin;
