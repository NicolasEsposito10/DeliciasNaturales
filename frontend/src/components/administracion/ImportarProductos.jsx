import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatearPrecio, formatearPorcentaje } from '../../utils/formatoArgentino.jsx';

function ImportarProductos() {
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [estado, setEstado] = useState(''); // 'subiendo', 'procesando', 'vista_previa', 'importando', 'completado'
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [error, setError] = useState('');

  const manejarSeleccionArchivo = (event) => {
    const archivoSeleccionado = event.target.files[0];
    if (archivoSeleccionado) {
      // Validar que sea un archivo Excel
      const extensionesValidas = ['.xlsx', '.xls'];
      const extension = archivoSeleccionado.name.toLowerCase().slice(-5);
      
      if (!extensionesValidas.some(ext => extension.includes(ext))) {
        setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
      }
      
      setArchivo(archivoSeleccionado);
      setError('');
    }
  };

  const subirArchivo = async () => {
    if (!archivo) {
      setError('Por favor selecciona un archivo Excel');
      return;
    }

    setCargando(true);
    setEstado('subiendo');
    setProgreso(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('archivo', archivo);

      // Simular progreso de subida
      const intervalSubida = setInterval(() => {
        setProgreso(prev => {
          if (prev >= 90) {
            clearInterval(intervalSubida);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await axios.post('/api/importar/subir-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos para archivos grandes
      });

      clearInterval(intervalSubida);
      setProgreso(100);
      
      setTimeout(() => {
        // Adaptar la respuesta del backend al formato esperado por el frontend
        const vistaAdaptada = {
          productos_validos: response.data.vista_previa?.productos_validos?.lista || [],
          productos_excluidos: response.data.vista_previa?.productos_invalidos?.lista || []
        };
        
        setVistaPrevia(vistaAdaptada);
        setEstado('vista_previa');
        setCargando(false);
      }, 500);

    } catch (error) {
      console.error('Error al subir archivo:', error);
      
      // Mostrar información detallada del error
      let mensajeError = 'Error al procesar el archivo. Verifica que el formato sea correcto.';
      
      if (error.response?.data?.mensaje) {
        mensajeError = error.response.data.mensaje;
      } else if (error.response?.data?.debug_info) {
        mensajeError = `${error.response.data.mensaje} - ${JSON.stringify(error.response.data.debug_info)}`;
      } else if (error.message) {
        mensajeError = `Error de conexión: ${error.message}`;
      }
      
      console.log('Información completa del error:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      setError(mensajeError);
      setCargando(false);
      setEstado('');
      setProgreso(0);
    }
  };

  const confirmarImportacion = async () => {
    if (!vistaPrevia) return;

    setCargando(true);
    setEstado('importando');
    setProgreso(0);
    setError('');

    try {
      // Crear un WebSocket o polling para recibir actualizaciones de progreso
      const response = await axios.post('/api/importar/confirmar', {
        productos_validos: vistaPrevia.productos_validos
      }, {
        timeout: 300000 // 5 minutos para importación
      });

      // Simular progreso de importación
      const totalProductos = vistaPrevia.productos_validos.length;
      let productosImportados = 0;
      
      const intervalImportacion = setInterval(() => {
        productosImportados++;
        const porcentaje = Math.round((productosImportados / totalProductos) * 100);
        setProgreso(porcentaje);
        
        if (productosImportados >= totalProductos) {
          clearInterval(intervalImportacion);
          setEstado('completado');
          setCargando(false);
        }
      }, 100);

    } catch (error) {
      console.error('Error al importar productos:', error);
      setError('Error al importar productos a la base de datos.');
      setCargando(false);
      setEstado('vista_previa');
      setProgreso(0);
    }
  };

  const rechazarImportacion = () => {
    setVistaPrevia(null);
    setEstado('');
    setArchivo(null);
    setProgreso(0);
    // Reset del input file
    const fileInput = document.getElementById('archivoExcel');
    if (fileInput) fileInput.value = '';
  };

  const reiniciar = () => {
    setArchivo(null);
    setVistaPrevia(null);
    setEstado('');
    setProgreso(0);
    setError('');
    setCargando(false);
    // Reset del input file
    const fileInput = document.getElementById('archivoExcel');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex align-items-center mb-5">
          <button
            className="btn btn-outline-primary me-3"
            onClick={() => navigate('/administrar')}
            style={{ borderRadius: '10px' }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver al Dashboard
          </button>
          <div>
            <h1 className="display-5 fw-bold mb-2">Importar Productos desde Excel</h1>
            <p className="text-muted mb-0">Sube un archivo Excel para importar productos masivamente</p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
              <div className="card-body p-5">
                
                {/* Paso 1: Selección de archivo */}
                {estado === '' && (
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="bi bi-file-earmark-excel text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="fw-bold mb-3">Seleccionar Archivo Excel</h3>
                    <p className="text-muted mb-4">
                      Sube un archivo Excel (.xlsx o .xls) con los productos a importar.<br />
                      El archivo debe tener la estructura específica con las columnas requeridas.
                    </p>
                    
                    {/* Información del formato */}
                    <div className="alert alert-info mb-4">
                      <h6 className="fw-bold mb-2">
                        <i className="bi bi-info-circle me-2"></i>
                        Formato requerido (fila 2):
                      </h6>
                      <div className="small text-start">
                        <strong>A2:</strong> Producto | <strong>C2:</strong> Proveedor | <strong>E2:</strong> Precio de Costo<br />
                        <strong>F2:</strong> % de ganancia | <strong>G2:</strong> Precio de Ganancia del Paquete<br />
                        <strong>H2:</strong> Precio por Unidad o 100 gramos | <strong>I2:</strong> Descripción
                      </div>
                    </div>

                    <div className="mb-4">
                      <input
                        type="file"
                        id="archivoExcel"
                        className="form-control"
                        accept=".xlsx,.xls"
                        onChange={manejarSeleccionArchivo}
                        style={{ borderRadius: '10px' }}
                      />
                    </div>

                    {error && (
                      <div className="alert alert-danger">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                      </div>
                    )}

                    <button
                      className="btn btn-primary btn-lg"
                      onClick={subirArchivo}
                      disabled={!archivo || cargando}
                      style={{ borderRadius: '10px', minWidth: '200px' }}
                    >
                      {cargando ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-cloud-upload me-2"></i>
                          Procesar Archivo
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Paso 2: Cargando/Procesando */}
                {(estado === 'subiendo' || estado === 'procesando') && (
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="bi bi-cloud-upload text-primary" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="fw-bold mb-3">
                      {estado === 'subiendo' ? 'Subiendo archivo...' : 'Procesando datos...'}
                    </h3>
                    <div className="progress mb-3" style={{ height: '10px', borderRadius: '10px' }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated"
                        style={{ width: `${progreso}%` }}
                      ></div>
                    </div>
                    <p className="text-muted">{progreso}% completado</p>
                  </div>
                )}

                {/* Paso 3: Vista previa */}
                {estado === 'vista_previa' && vistaPrevia && (
                  <div>
                    <h3 className="fw-bold mb-4 text-center">Vista Previa de Importación</h3>
                    
                    {/* Resumen */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="card bg-success text-white h-100">
                          <div className="card-body text-center">
                            <h4 className="fw-bold">{vistaPrevia.productos_validos.length}</h4>
                            <p className="mb-0">Productos a importar</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card bg-warning text-white h-100">
                          <div className="card-body text-center">
                            <h4 className="fw-bold">{vistaPrevia.productos_excluidos.length}</h4>
                            <p className="mb-0">Productos excluidos</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de productos válidos */}
                    {vistaPrevia.productos_validos.length > 0 && (
                      <div className="mb-4">
                        <h5 className="fw-bold text-success mb-3">
                          <i className="bi bi-check-circle me-2"></i>
                          Productos a importar
                        </h5>
                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <table className="table table-sm">
                            <thead className="table-light sticky-top">
                              <tr>
                                <th>Producto</th>
                                <th>Proveedor</th>
                                <th>Precio Costo</th>
                                <th>% Ganancia</th>
                                <th>Precio Paquete</th>
                                <th>Tipo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vistaPrevia.productos_validos.map((producto, index) => (
                                <tr key={index}>
                                  <td>{producto.nombre}</td>
                                  <td>{producto.proveedor}</td>
                                  <td>${producto.precio_costo}</td>
                                  <td>{producto.porcentaje_ganancia}%</td>
                                  <td>${producto.precio_ganancia_paquete}</td>
                                  <td>
                                    <span className={`badge ${producto.tipo === 1 ? 'bg-primary' : 'bg-info'}`}>
                                      {producto.tipo === 1 ? 'Unidad' : 'Gramos'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Lista de productos excluidos */}
                    {vistaPrevia.productos_excluidos.length > 0 && (
                      <div className="mb-4">
                        <h5 className="fw-bold text-warning mb-3">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Productos excluidos (datos faltantes)
                        </h5>
                        <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <table className="table table-sm">
                            <thead className="table-light sticky-top">
                              <tr>
                                <th>Producto</th>
                                <th>Motivo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vistaPrevia.productos_excluidos.map((producto, index) => (
                                <tr key={index}>
                                  <td>{producto.nombre || 'Sin nombre'}</td>
                                  <td>
                                    <small className="text-danger">{producto.motivo}</small>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Botones de confirmación */}
                    <div className="text-center">
                      <button
                        className="btn btn-success btn-lg me-3"
                        onClick={confirmarImportacion}
                        disabled={vistaPrevia.productos_validos.length === 0}
                        style={{ borderRadius: '10px', minWidth: '150px' }}
                      >
                        <i className="bi bi-check2 me-2"></i>
                        Aceptar e Importar
                      </button>
                      <button
                        className="btn btn-outline-danger btn-lg"
                        onClick={rechazarImportacion}
                        style={{ borderRadius: '10px', minWidth: '150px' }}
                      >
                        <i className="bi bi-x me-2"></i>
                        Rechazar
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 4: Importando */}
                {estado === 'importando' && (
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="bi bi-database-add text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="fw-bold mb-3">Importando productos ({progreso}%)</h3>
                    <div className="progress mb-3" style={{ height: '15px', borderRadius: '10px' }}>
                      <div
                        className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                        style={{ width: `${progreso}%` }}
                      ></div>
                    </div>
                    <p className="text-muted">
                      Insertando productos en la base de datos...
                    </p>
                  </div>
                )}

                {/* Paso 5: Completado */}
                {estado === 'completado' && (
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h3 className="fw-bold text-success mb-3">¡Importación Completada!</h3>
                    <p className="text-muted mb-4">
                      Los productos se han importado exitosamente a la base de datos.
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate('/administrar/productos')}
                        style={{ borderRadius: '10px' }}
                      >
                        <i className="bi bi-box me-2"></i>
                        Ver Productos
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={reiniciar}
                        style={{ borderRadius: '10px' }}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Importar Más
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportarProductos;
