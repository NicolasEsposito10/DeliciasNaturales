import React, { useState, useRef } from 'react';
import axios from 'axios';
import { formatearPrecio, formatearPorcentaje } from '../../utils/formatoArgentino.jsx';

function ImportDebugger() {
  const [debugInfo, setDebugInfo] = useState({});
  const [logs, setLogs] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const fileInputRef = useRef(null);

  const addLog = (tipo, mensaje, datos = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, {
      id: Date.now(),
      timestamp,
      tipo,
      mensaje,
      datos
    }]);
  };

  const clearLogs = () => {
    setLogs([]);
    setDebugInfo({});
  };

  const manejarSeleccionArchivo = (event) => {
    const archivoSeleccionado = event.target.files[0];
    if (archivoSeleccionado) {
      setArchivo(archivoSeleccionado);
      
      addLog('info', 'Archivo seleccionado', {
        nombre: archivoSeleccionado.name,
        tamaño: archivoSeleccionado.size,
        tipo: archivoSeleccionado.type,
        ultimaModificacion: new Date(archivoSeleccionado.lastModified).toLocaleString()
      });

      // Validar extensión
      const extensionesValidas = ['.xlsx', '.xls'];
      const extension = archivoSeleccionado.name.toLowerCase();
      const esValido = extensionesValidas.some(ext => extension.endsWith(ext));
      
      addLog(esValido ? 'success' : 'error', 
        `Validación de extensión: ${esValido ? 'VÁLIDA' : 'INVÁLIDA'}`,
        { extension, extensionesValidas }
      );
    }
  };

  const testConexionBackend = async () => {
    addLog('info', 'Probando conexión con backend...');
    
    try {
      const response = await axios.get('/api/debug/health');
      addLog('success', 'Conexión exitosa con backend', response.data);
    } catch (error) {
      addLog('error', 'Error de conexión con backend', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const testEndpointImportador = async () => {
    addLog('info', 'Probando endpoint de importador...');
    
    try {
      // Crear un FormData vacío para probar el endpoint
      // Esto debería devolver un error 400 esperado (sin archivo)
      const formData = new FormData();
      
      const response = await axios.post('/api/importar/subir-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      addLog('success', 'Endpoint responde correctamente', response.data);
    } catch (error) {
      // Si es error 400 con mensaje de "No se ha enviado ningún archivo", es correcto
      if (error.response?.status === 400 && 
          error.response?.data?.mensaje?.includes('archivo')) {
        addLog('success', 'Endpoint funciona correctamente (error esperado sin archivo)', {
          status: error.response.status,
          message: error.response.data.mensaje
        });
      } else {
        addLog('error', 'Error en endpoint de importador', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
      }
    }
  };

  const analizarArchivo = async () => {
    if (!archivo) {
      addLog('error', 'No hay archivo seleccionado');
      return;
    }

    setCargando(true);
    addLog('info', 'Iniciando análisis detallado del archivo...');

    try {
      // 1. Información básica del archivo
      addLog('info', 'Información del archivo', {
        nombre: archivo.name,
        tamaño: `${(archivo.size / 1024).toFixed(2)} KB`,
        tipo: archivo.type,
        ultimaModificacion: new Date(archivo.lastModified).toLocaleString()
      });

      // 2. Leer como ArrayBuffer para análisis hexadecimal
      const arrayBuffer = await archivo.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const hexHeader = Array.from(uint8Array.slice(0, 20))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      
      addLog('info', 'Cabecera hexadecimal del archivo', { hex: hexHeader });

      // 3. Verificar si es realmente un archivo Excel
      const magicBytes = uint8Array.slice(0, 4);
      const isZip = magicBytes[0] === 0x50 && magicBytes[1] === 0x4B; // PK (ZIP)
      const isOLE = magicBytes[0] === 0xD0 && magicBytes[1] === 0xCF; // OLE2 (.xls)
      
      addLog('info', 'Análisis de formato', {
        esZIP: isZip,
        esOLE: isOLE,
        formatoDetectado: isZip ? 'Excel moderno (.xlsx)' : isOLE ? 'Excel antiguo (.xls)' : 'Desconocido'
      });

      // 4. Intentar subir el archivo al backend
      addLog('info', 'Enviando archivo al backend...');
      
      const formData = new FormData();
      formData.append('archivo', archivo);

      // Log del FormData
      addLog('info', 'FormData creado', {
        entries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          value: value instanceof File ? `File: ${value.name}` : value
        }))
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutos para archivos grandes
        onUploadProgress: (progressEvent) => {
          const porcentaje = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          addLog('info', `Progreso de subida: ${porcentaje}%`);
        }
      };

      addLog('info', 'Configuración de axios', config);

      const response = await axios.post('/api/importar/subir-excel', formData, config);
      
      addLog('success', 'Respuesta exitosa del backend', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      setDebugInfo(response.data);

    } catch (error) {
      addLog('error', 'Error durante el análisis', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          timeout: error.config.timeout,
          headers: error.config.headers
        } : null,
        request: error.request ? {
          readyState: error.request.readyState,
          status: error.request.status,
          statusText: error.request.statusText,
          responseURL: error.request.responseURL
        } : null,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        } : null
      });
    } finally {
      setCargando(false);
    }
  };

  const verificarRutasBackend = async () => {
    addLog('info', 'Verificando rutas disponibles en el backend...');
    
    const rutasAProbar = [
      { url: '/api/health', method: 'GET' },
      { url: '/api/debug/health', method: 'GET' },
      { url: '/api/importar/subir-excel', method: 'POST', data: new FormData() },
      { url: '/api/importar/confirmar', method: 'POST', data: {} }
    ];

    for (const ruta of rutasAProbar) {
      try {
        let response;
        if (ruta.method === 'GET') {
          response = await axios.get(ruta.url);
        } else {
          // Para POST, usar datos vacíos para probar que el endpoint existe
          response = await axios.post(ruta.url, ruta.data, {
            headers: ruta.data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
          });
        }
        
        addLog('success', `Ruta ${ruta.method} ${ruta.url} disponible`, {
          status: response.status,
          data: response.data
        });
      } catch (error) {
        // Si es 400 o 422, significa que el endpoint existe pero faltan datos (correcto)
        if (error.response?.status === 400 || error.response?.status === 422) {
          addLog('success', `Ruta ${ruta.method} ${ruta.url} disponible (respuesta esperada: faltan datos)`, {
            status: error.response.status,
            message: error.response.data?.mensaje || error.response.data?.message
          });
        } else {
          addLog('warning', `Ruta ${ruta.method} ${ruta.url} no disponible`, {
            status: error.response?.status,
            message: error.message
          });
        }
      }
    }
  };

  const getLogColor = (tipo) => {
    switch (tipo) {
      case 'success': return 'text-success';
      case 'error': return 'text-danger';
      case 'warning': return 'text-warning';
      case 'info': return 'text-primary';
      default: return 'text-muted';
    }
  };

  const getLogIcon = (tipo) => {
    switch (tipo) {
      case 'success': return 'bi-check-circle';
      case 'error': return 'bi-x-circle';
      case 'warning': return 'bi-exclamation-triangle';
      case 'info': return 'bi-info-circle';
      default: return 'bi-circle';
    }
  };

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold mb-2">🔍 Debug - Importador de Productos</h1>
          <p className="text-muted">Herramienta de diagnóstico para troubleshooting del importador</p>
        </div>

        <div className="row">
          {/* Panel de control */}
          <div className="col-lg-4 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-gear me-2"></i>
                  Panel de Control
                </h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-3">
                  {/* Selección de archivo */}
                  <div>
                    <label className="form-label fw-bold">Seleccionar archivo Excel:</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      accept=".xlsx,.xls"
                      onChange={manejarSeleccionArchivo}
                    />
                  </div>

                  {/* Botones de prueba */}
                  <button
                    className="btn btn-info"
                    onClick={testConexionBackend}
                  >
                    <i className="bi bi-wifi me-2"></i>
                    Test Conexión Backend
                  </button>

                  <button
                    className="btn btn-warning"
                    onClick={verificarRutasBackend}
                  >
                    <i className="bi bi-signpost me-2"></i>
                    Verificar Rutas
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={testEndpointImportador}
                  >
                    <i className="bi bi-plugin me-2"></i>
                    Test Endpoint Importador
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={analizarArchivo}
                    disabled={!archivo || cargando}
                  >
                    {cargando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Analizando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-2"></i>
                        Analizar Archivo Completo
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-outline-danger"
                    onClick={clearLogs}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Limpiar Logs
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logs en tiempo real */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-terminal me-2"></i>
                  Logs de Debug ({logs.length})
                </h5>
                <small>Tiempo real</small>
              </div>
              <div className="card-body p-0">
                <div 
                  className="logs-container p-3"
                  style={{ 
                    height: '500px', 
                    overflowY: 'auto', 
                    backgroundColor: '#1e1e1e',
                    fontFamily: 'Monaco, Consolas, monospace',
                    fontSize: '0.9rem'
                  }}
                >
                  {logs.length === 0 ? (
                    <div className="text-muted text-center mt-5">
                      <i className="bi bi-journal-text" style={{ fontSize: '3rem' }}></i>
                      <p className="mt-3">No hay logs aún. Comienza seleccionando un archivo y ejecutando pruebas.</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="log-entry mb-2 p-2 border-bottom border-secondary">
                        <div className="d-flex align-items-start">
                          <span className={`me-2 ${getLogColor(log.tipo)}`}>
                            <i className={`bi ${getLogIcon(log.tipo)}`}></i>
                          </span>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className={`fw-bold ${getLogColor(log.tipo)}`}>
                                [{log.timestamp}] {log.mensaje}
                              </span>
                            </div>
                            {log.datos && (
                              <div className="mt-1">
                                <pre className="text-light mb-0 small bg-secondary p-2 rounded">
                                  {JSON.stringify(log.datos, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional de debug */}
        {Object.keys(debugInfo).length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-clipboard-data me-2"></i>
                    Información de Debug del Backend
                  </h5>
                </div>
                <div className="card-body">
                  <pre className="bg-light p-3 rounded overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .logs-container::-webkit-scrollbar {
          width: 8px;
        }
        .logs-container::-webkit-scrollbar-track {
          background: #2d2d2d;
        }
        .logs-container::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 4px;
        }
        .logs-container::-webkit-scrollbar-thumb:hover {
          background: #777;
        }
        .log-entry {
          transition: background-color 0.2s ease;
        }
        .log-entry:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}

export default ImportDebugger;
