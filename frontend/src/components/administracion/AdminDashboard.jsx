import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBox, 
  FaBullhorn, 
  FaTruck, 
  FaTags, 
  FaTag, 
  FaCopyright, 
  FaRuler,
  FaUsers,
  FaClipboardList 
} from 'react-icons/fa';

function AdminDashboard() {
  const navigate = useNavigate();
  const [exportando, setExportando] = useState(false);

  // Funciones para navegar directamente a formularios de creación
  const crearNuevoProducto = () => {
    navigate('/administrar/productos', { state: { abrirFormulario: true } });
  };

  const crearNuevaPromocion = () => {
    navigate('/administrar/promociones', { state: { abrirFormulario: true } });
  };

  const crearNuevaCategoria = () => {
    navigate('/administrar/categorias', { state: { abrirFormulario: true } });
  };

  const crearNuevaMarca = () => {
    navigate('/administrar/marcas', { state: { abrirFormulario: true } });
  };

  const crearNuevoProveedor = () => {
    navigate('/administrar/proveedores', { state: { abrirFormulario: true } });
  };

  const crearNuevaUnidad = () => {
    navigate('/administrar/unidades', { state: { abrirFormulario: true } });
  };

  const exportarDatos = async () => {
    try {
      setExportando(true);
      console.log('🚀 Iniciando exportación a Excel...');
      
      const response = await axios.get('/api/export/excel', {
        responseType: 'blob' // Importante para archivos binarios
      });
      
      // Crear un blob con la respuesta
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Crear URL temporal para descargar
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento de descarga temporal
      const link = document.createElement('a');
      link.href = url;
      
      // Generar nombre de archivo con fecha
      const fecha = new Date().toISOString().split('T')[0];
      link.download = `delicias_naturales_${fecha}.xlsx`;
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL temporal
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Exportación completada exitosamente');
      
      // Mostrar notificación de éxito
      const toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
          <strong>¡Exportación exitosa!</strong> El archivo Excel se ha descargado correctamente.
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
      
      // Mostrar notificación de error
      const toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
          <strong>Error de exportación</strong> No se pudo generar el archivo Excel.
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 5000);
    } finally {
      setExportando(false);
    }
  };

  const adminSections = [
    {
      title: 'Productos',
      description: 'Gestionar inventario, precios y detalles de productos',
      icon: <FaBox className="text-primary" size={48} />,
      path: '/administrar/productos',
      color: 'border-primary'
    },
    {
      title: 'Promociones',
      description: 'Administrar banners y ofertas especiales',
      icon: <FaBullhorn className="text-success" size={48} />,
      path: '/administrar/promociones',
      color: 'border-success'
    },
    {
      title: 'Proveedores',
      description: 'Gestionar información de proveedores',
      icon: <FaTruck className="text-info" size={48} />,
      path: '/administrar/proveedores',
      color: 'border-info'
    },
    {
      title: 'Categorías',
      description: 'Organizar productos por categorías',
      icon: <FaTags className="text-warning" size={48} />,
      path: '/administrar/categorias',
      color: 'border-warning'
    },
    {
      title: 'Etiquetas',
      description: 'Administrar etiquetas y tipos de alimentos',
      icon: <FaTag className="text-danger" size={48} />,
      path: '/administrar/etiquetas',
      color: 'border-danger'
    },
    {
      title: 'Marcas',
      description: 'Gestionar marcas de productos',
      icon: <FaCopyright className="text-secondary" size={48} />,
      path: '/administrar/marcas',
      color: 'border-secondary'
    },
    {
      title: 'Unidades',
      description: 'Administrar unidades de medida',
      icon: <FaRuler className="text-dark" size={48} />,
      path: '/administrar/unidades',
      color: 'border-dark'
    },
    {
      title: 'Usuarios',
      description: 'Gestionar usuarios y permisos del sistema',
      icon: <FaUsers className="text-purple" size={48} />,
      path: '/administrar/usuarios',
      color: 'border-purple'
    },
    {
      title: 'Pedidos',
      description: 'Ver y gestionar todos los pedidos de clientes',
      icon: <FaClipboardList className="text-success" size={48} />,
      path: '/administrar/pedidos',
      color: 'border-success'
    }
  ];

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold mb-2">
            <i className="bi bi-grid-3x3-gap-fill me-2" style={{ color: '#6f42c1' }}></i>
            Panel de Administración
          </h1>
          <p className="text-muted">
            Gestiona todos los aspectos de tu tienda desde un solo lugar
          </p>
          <hr className="w-25 mx-auto" style={{ height: '3px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
        </div>

        {/* Contenido principal */}
        <div className="row">
          {/* Sidebar izquierdo - Acciones rápidas */}
          <div className="col-xl-3 col-lg-4 col-md-12 mb-4">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-lightning-fill me-2 text-primary"></i>
                  Acceso Rápido
                </h5>
                <div className="d-grid gap-3">
                  <button 
                    className="btn btn-outline-primary d-flex align-items-center justify-content-start"
                    onClick={crearNuevoProducto}
                    style={{ borderRadius: '10px', padding: '12px 16px' }}
                  >
                    <i className="bi bi-plus-circle me-3 fs-5"></i>
                    <span>Nuevo Producto</span>
                  </button>
                  <button 
                    className="btn btn-outline-success d-flex align-items-center justify-content-start"
                    onClick={crearNuevaPromocion}
                    style={{ borderRadius: '10px', padding: '12px 16px' }}
                  >
                    <i className="bi bi-megaphone me-3 fs-5"></i>
                    <span>Nueva Promoción</span>
                  </button>
                  <button 
                    className="btn btn-outline-info d-flex align-items-center justify-content-start"
                    onClick={crearNuevaCategoria}
                    style={{ borderRadius: '10px', padding: '12px 16px' }}
                  >
                    <i className="bi bi-collection me-3 fs-5"></i>
                    <span>Nueva Categoría</span>
                  </button>
                  <button 
                    className="btn btn-outline-warning d-flex align-items-center justify-content-start"
                    onClick={crearNuevaMarca}
                    style={{ borderRadius: '10px', padding: '12px 16px' }}
                  >
                    <i className="bi bi-bookmark me-3 fs-5"></i>
                    <span>Nueva Marca</span>
                  </button>
                  <button 
                    className="btn btn-outline-secondary d-flex align-items-center justify-content-start"
                    onClick={crearNuevoProveedor}
                    style={{ borderRadius: '10px', padding: '12px 16px' }}
                  >
                    <i className="bi bi-truck me-3 fs-5"></i>
                    <span>Nuevo Proveedor</span>
                  </button>
                  <button 
                    className="btn btn-outline-dark d-flex align-items-center justify-content-start"
                    onClick={crearNuevaUnidad}
                    style={{ borderRadius: '10px', padding: '12px 16px' }}
                  >
                    <i className="bi bi-rulers me-3 fs-5"></i>
                    <span>Nueva Unidad</span>
                  </button>
                  <button 
                    className="btn btn-outline-purple d-flex align-items-center justify-content-start"
                    onClick={() => navigate('/administrar/usuarios')}
                    style={{ borderRadius: '10px', padding: '12px 16px', borderColor: '#6f42c1', color: '#6f42c1' }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#6f42c1';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = '#6f42c1';
                    }}
                  >
                    <i className="bi bi-people me-3 fs-5"></i>
                    <span>Gestionar Usuarios</span>
                  </button>
                  <hr className="my-3" />
                  <button 
                    className="btn btn-success d-flex align-items-center justify-content-start"
                    onClick={exportarDatos}
                    disabled={exportando}
                    style={{ borderRadius: '10px', padding: '12px 16px' }}
                  >
                    {exportando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-3" role="status"></span>
                        <span>Exportando...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-file-earmark-excel me-3 fs-5"></i>
                        <span>Exportar a Excel</span>
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-outline-info d-flex align-items-center justify-content-start"
                    onClick={() => navigate('/administrar/importar')}
                    style={{ borderRadius: '10px', padding: '12px 16px' }}
                  >
                    <i className="bi bi-file-earmark-arrow-up me-3 fs-5"></i>
                    <span>Importar productos desde Excel</span>
                  </button>
                  <button 
                    className="btn btn-outline-warning d-flex align-items-center justify-content-start"
                    onClick={() => navigate('/debug/importador')}
                    style={{ borderRadius: '10px', padding: '12px 16px' }}
                  >
                    <i className="bi bi-bug me-3 fs-5"></i>
                    <span>Debug Importador</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal - Grid de secciones */}
          <div className="col-xl-9 col-lg-8 col-md-12">
            <div className="row g-4">
              {adminSections.map((section, index) => (
                <div key={index} className="col-xl-4 col-lg-6 col-md-6">
                  <div 
                    className={`card h-100 border-0 shadow-sm admin-card ${section.color}`}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '15px',
                      borderLeft: '5px solid transparent'
                    }}
                    onClick={() => navigate(section.path)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="card-body d-flex flex-column p-4">
                      {/* Icono */}
                      <div className="text-center mb-3">
                        {section.icon}
                      </div>
                      
                      {/* Título */}
                      <h4 className="card-title text-center fw-bold mb-3">
                        {section.title}
                      </h4>
                      
                      {/* Descripción */}
                      <p className="card-text text-muted text-center flex-grow-1">
                        {section.description}
                      </p>
                      
                      {/* Botón */}
                      <div className="mt-auto">
                        <button
                          className="btn btn-outline-primary w-100 fw-semibold"
                          style={{ 
                            borderRadius: '25px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#0d6efd';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'scale(1.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#0d6efd';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          Acceder
                          <i className="bi bi-arrow-right ms-2"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-card:hover {
          border-left-width: 5px !important;
        }
        
        .admin-card.border-primary:hover {
          border-left-color: #0d6efd !important;
        }
        
        .admin-card.border-success:hover {
          border-left-color: #198754 !important;
        }
        
        .admin-card.border-info:hover {
          border-left-color: #0dcaf0 !important;
        }
        
        .admin-card.border-warning:hover {
          border-left-color: #ffc107 !important;
        }
        
        .admin-card.border-danger:hover {
          border-left-color: #dc3545 !important;
        }
        
        .admin-card.border-secondary:hover {
          border-left-color: #6c757d !important;
        }
        
        .admin-card.border-dark:hover {
          border-left-color: #212529 !important;
        }
        
        .admin-card.border-purple:hover {
          border-left-color: #6f42c1 !important;
        }
        
        .text-purple {
          color: #6f42c1 !important;
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;