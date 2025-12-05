import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function BannerAdmin() {
  const location = useLocation();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    titulo: '',
    descripcion: '',
    imagen_file: null,
    url_link: '',
    activo: true,
    orden: 0,
    fecha_inicio: '',
    fecha_fin: '',
    color_borde: '#000000'
  });
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    cargarBanners();
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

  const cargarBanners = () => {
    setLoading(true);
    axios.get('/api/banners?all=true')
      .then(res => {
        setBanners(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando banners:', err);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editando) {
      // Si hay una nueva imagen, enviamos como FormData
      if (formData.imagen_file) {
        const formDataObj = new FormData();
        formDataObj.append('titulo', formData.titulo || '');
        formDataObj.append('descripcion', formData.descripcion || '');
        formDataObj.append('url_link', formData.url_link || '');
        formDataObj.append('activo', formData.activo);
        formDataObj.append('orden', formData.orden);
        formDataObj.append('fecha_inicio', formData.fecha_inicio || '');
        formDataObj.append('fecha_fin', formData.fecha_fin || '');
        formDataObj.append('color_borde', formData.color_borde);
        formDataObj.append('imagen', formData.imagen_file);
        
        axios.put(`/api/banners/${formData.id}`, formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(() => {
          cargarBanners();
          setFormVisible(false);
          limpiarFormulario();
          alert('Banner actualizado exitosamente');
        })
        .catch(err => {
          console.error('Error actualizando banner:', err);
          alert('Error al actualizar el banner');
        });
      } else {
        // Si no hay nueva imagen, enviamos solo los datos como JSON
        const dataToUpdate = {
          titulo: formData.titulo || '',
          descripcion: formData.descripcion || '',
          url_link: formData.url_link || '',
          activo: formData.activo,
          orden: formData.orden,
          fecha_inicio: formData.fecha_inicio || '',
          fecha_fin: formData.fecha_fin || '',
          color_borde: formData.color_borde
        };
        
        axios.put(`/api/banners/${formData.id}`, dataToUpdate, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(() => {
          cargarBanners();
          setFormVisible(false);
          limpiarFormulario();
          alert('Banner actualizado exitosamente');
        })
        .catch(err => {
          console.error('Error actualizando banner:', err);
          alert('Error al actualizar el banner');
        });
      }
    } else {
      // Crear nuevo banner - siempre con FormData
      const formDataObj = new FormData();
      formDataObj.append('titulo', formData.titulo || '');
      formDataObj.append('descripcion', formData.descripcion || '');
      formDataObj.append('url_link', formData.url_link || '');
      formDataObj.append('activo', formData.activo);
      formDataObj.append('orden', formData.orden);
      formDataObj.append('fecha_inicio', formData.fecha_inicio || '');
      formDataObj.append('fecha_fin', formData.fecha_fin || '');
      formDataObj.append('color_borde', formData.color_borde);
      
      if (formData.imagen_file) {
        formDataObj.append('imagen', formData.imagen_file);
      }
      
      axios.post('/api/banners', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(() => {
        cargarBanners();
        setFormVisible(false);
        limpiarFormulario();
      })
      .catch(err => console.error('Error creando banner:', err));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (name === 'imagen_file' && files && files[0]) {
      // Cuando se selecciona un archivo
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        imagen_file: file,
        es_url: false
      }));
      
      // Generar URL para previsualizar
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    } else {
      // Para otros campos
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const cambiarModoImagen = (esUrl) => {
    setFormData(prev => ({
      ...prev,
      es_url: esUrl,
      // Limpiar el campo opuesto
      ...(esUrl ? { imagen_file: null } : { url_imagen: '' })
    }));
    
    // Limpiar preview si es necesario
    if (esUrl) {
      setPreviewUrl(formData.url_imagen);
    } else {
      setPreviewUrl('');
    }
  };

  const editarBanner = (banner) => {
    let previewSrc = '';
    
    // Determinar la fuente de la imagen para previsualización
    if (banner.es_url) {
      previewSrc = banner.url_imagen;
    } else if (banner.imagen_base64) {
      previewSrc = `data:image/jpeg;base64,${banner.imagen_base64}`;
    }
    
    setFormData({
      ...banner,
      imagen_file: null, // No podemos setear el archivo directamente
      fecha_inicio: banner.fecha_inicio ? banner.fecha_inicio.split('T')[0] : '',
      fecha_fin: banner.fecha_fin ? banner.fecha_fin.split('T')[0] : '',
      color_borde: banner.color_borde || '#000000'
    });
    
    setPreviewUrl(previewSrc);
    setEditando(true);
    setFormVisible(true);
  };

  const limpiarFormulario = () => {
    setFormData({
      id: '',
      titulo: '',
      descripcion: '',
      imagen_file: null,
      url_link: '',
      activo: true,
      orden: banners.length,
      fecha_inicio: '',
      fecha_fin: '',
      color_borde: '#000000'
    });
    setPreviewUrl('');
    setEditando(false);
  };

  const handleReorder = (id, direccion) => {
    const index = banners.findIndex(b => b.id === id);
    if ((direccion === 'up' && index === 0) || 
        (direccion === 'down' && index === banners.length - 1)) {
      return; // No hacer nada si está en los extremos
    }
    
    const nuevosOrdenes = banners.map(b => ({
      id: b.id,
      orden: b.orden
    }));
    
    if (direccion === 'up') {
      const temp = nuevosOrdenes[index].orden;
      nuevosOrdenes[index].orden = nuevosOrdenes[index - 1].orden;
      nuevosOrdenes[index - 1].orden = temp;
    } else {
      const temp = nuevosOrdenes[index].orden;
      nuevosOrdenes[index].orden = nuevosOrdenes[index + 1].orden;
      nuevosOrdenes[index + 1].orden = temp;
    }
    
    axios.put('/api/banners/reordenar', { ordenes: nuevosOrdenes })
      .then(() => cargarBanners())
      .catch(err => console.error('Error reordenando:', err));
  };

  const borrarBanner = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta promoción?')) {
      axios.delete(`/api/banners/${id}`)
        .then(() => {
          cargarBanners();
        })
        .catch(err => console.error('Error eliminando banner:', err));
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Administración de Banners Promocionales</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => { limpiarFormulario(); setFormVisible(true); }}
        >
          <i className="bi bi-plus-circle"></i> Nuevo Banner
        </button>
      </div>

      {formVisible && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="m-0">{editando ? 'Editar Banner' : 'Crear Banner'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">Título</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="titulo" 
                    value={formData.titulo || ''} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Descripción</label>
                <textarea 
                  className="form-control" 
                  name="descripcion" 
                  value={formData.descripcion || ''} 
                  onChange={handleChange} 
                  rows="3"
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">URL del enlace (opcional)</label>
                <input 
                  type="url" 
                  className="form-control" 
                  name="url_link" 
                  value={formData.url_link || ''} 
                  onChange={handleChange} 
                  placeholder="https://ejemplo.com/oferta"
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Fecha de inicio promoción (opcional)</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="fecha_inicio" 
                    value={formData.fecha_inicio || ''} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Fecha de fin promoción (opcional)</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="fecha_fin" 
                    value={formData.fecha_fin || ''} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="col-md-4 mb-3 d-flex align-items-center">
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="switchActivo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="switchActivo">
                      <strong>{formData.activo ? 'Promoción Vigente' : 'Promoción NO Vigente'}</strong>
                      <br />
                      <small className="text-muted">
                        {formData.activo ? 'Visible en la página principal' : 'Oculto en la página principal'}
                      </small>
                    </label>
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Color del borde</label>
                  <div className="input-group">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      name="color_borde"
                      value={formData.color_borde || '#000000'}
                      onChange={handleChange}
                      title="Selecciona un color para el borde"
                    />
                    <span className="input-group-text">{formData.color_borde}</span>
                  </div>
                </div>
              </div>

              {/* Imagen del banner */}
              <div className="mb-3">
                <label className="form-label">Imagen del banner*</label>
                <input
                  type="file"
                  className="form-control"
                  name="imagen_file"
                  onChange={handleChange}
                  accept="image/*"
                  required={!editando}
                />
                <div className="form-text">
                  Selecciona una imagen desde tu computadora (JPG, PNG, etc.)
                </div>
              </div>

              {/* Vista previa mejorada */}
              {previewUrl && (
                <div className="mb-3">
                  <label className="form-label">Vista previa</label>
                  <div className="border rounded p-2" style={{ boxShadow: `0 4px 8px ${formData.color_borde}` }}>
                    <img 
                      src={previewUrl} 
                      alt="Vista previa" 
                      className="img-fluid rounded" 
                      style={{maxHeight: '200px', objectFit: 'cover'}} 
                    />
                  </div>
                </div>
              )}

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

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header bg-light">
            <h5 className="m-0">Banners existentes</h5>
          </div>
          <div className="card-body">
            {banners.length === 0 ? (
              <div className="alert alert-info">
                No hay banners promocionales. Crea uno nuevo.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Imagen</th>
                      <th>Título</th>
                      <th>Estado</th>
                      <th>Vigencia</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((banner, index) => (
                      <tr key={banner.id}>
                        <td>
                          <div className="btn-group-vertical">
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              disabled={index === 0}
                              onClick={() => handleReorder(banner.id, 'up')}
                            >
                              <i className="bi bi-arrow-up"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              disabled={index === banners.length - 1}
                              onClick={() => handleReorder(banner.id, 'down')}
                            >
                              <i className="bi bi-arrow-down"></i>
                            </button>
                          </div>
                        </td>
                        <td>
                          <img 
                            src={banner.es_url ? banner.url_imagen : `data:image/jpeg;base64,${banner.imagen_base64}`} 
                            alt={banner.titulo || 'Banner'} 
                            style={{width: '100px', height: '60px', objectFit: 'cover'}}
                            className="rounded"
                          />
                        </td>
                        <td>{banner.titulo || '-'}</td>
                        <td>
                          <span className={`badge ${banner.activo ? 'bg-success' : 'bg-danger'}`}>
                            {banner.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          {banner.fecha_inicio || banner.fecha_fin ? (
                            <small>
                              {banner.fecha_inicio ? `Desde: ${banner.fecha_inicio.split('T')[0]}` : 'Sin fecha de inicio'}<br/>
                              {banner.fecha_fin ? `Hasta: ${banner.fecha_fin.split('T')[0]}` : 'Sin fecha de fin'}
                            </small>
                          ) : (
                            'Permanente'
                          )}
                        </td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-primary me-1" 
                              onClick={() => editarBanner(banner)}
                            >
                              <i className="bi bi-pencil"></i> Editar
                            </button>
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => borrarBanner(banner.id)}
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
      )}
    </div>
  );
}


export default BannerAdmin;