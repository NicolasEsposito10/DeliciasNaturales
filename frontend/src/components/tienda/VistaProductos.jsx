import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../../context/CarritoContext';
import { generarSlugProducto } from '../../utils/slugUtils.js';

function VistaProductos() {
  const [categorias, setCategorias] = useState([]);
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();
  const { items, agregarAlCarrito } = useCarrito();

  // Función para determinar si es Caso 1 o Caso 2
  const determinarEsCaso1 = (prod) => {
    if (!prod || !prod.unidad_nombre) return false;
    
    const nombre = prod.unidad_nombre?.toLowerCase() || '';
    const abrev = prod.unidad_abrev?.toLowerCase() || '';
    
    return nombre.includes('unidad') || 
           abrev === 'u' || 
           abrev === 'unidad' || 
           abrev === 'unidades' ||
           nombre === 'unidades' ||
           nombre === 'unidad';
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = () => {
    setCargando(true);
    // Cargar todas las categorías con conteo de productos
    Promise.all([
      axios.get('/api/categorias'),
      axios.get('/api/productos')
    ])
    .then(([categoriasRes, productosRes]) => {
      const todasCategorias = categoriasRes.data;
      const todosProductos = productosRes.data;
      
      // Contar productos por categoría
      const categoriasConConteo = todasCategorias.map(categoria => {
        const productosEnCategoria = todosProductos.filter(
          producto => producto.categoria_id === categoria.id && producto.disponible
        );
        return {
          ...categoria,
          totalProductos: productosEnCategoria.length
        };
      });
      
      // Organizar productos destacados por categoría (máximo 4 por categoría)
      const productosDestacadosPorCategoria = todasCategorias.map(categoria => {
        const productosEnCategoria = todosProductos
          .filter(producto => producto.categoria_id === categoria.id && producto.disponible)
          .slice(0, 4); // Solo los primeros 4
        
        return {
          categoria,
          productos: productosEnCategoria,
          totalProductos: todosProductos.filter(p => p.categoria_id === categoria.id && p.disponible).length
        };
      }).filter(item => item.productos.length > 0); // Solo categorías con productos
      
      setCategorias(categoriasConConteo);
      setProductosDestacados(productosDestacadosPorCategoria);
      setCargando(false);
    })
    .catch(err => {
      console.error('Error cargando categorías:', err);
      setCargando(false);
    });
  };

  const handleCategoriaClick = (categoria) => {
    // Convertir nombre a URL-friendly (slug)
    const nombreSlug = categoria.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .trim();
    
    navigate(`/tienda/${nombreSlug}`);
  };

  const handleProductoClick = (producto) => {
    // Generar slug único usando nombre + marca + ID
    const slug = generarSlugProducto(producto);
    navigate(`/producto/${slug}`);
  };

  const handleAgregarAlCarrito = (producto) => {
    // Determinar si es Caso 1 o Caso 2
    const esCaso1 = determinarEsCaso1(producto);
    
    if (esCaso1) {
      // Caso 1: Agregar una unidad individual
      const precioUnidad = parseFloat(producto.precio_venta_publico || 0) / (producto.cantidad_unidades || 1);
      
      const productoUnidad = {
        ...producto,
        precio_unitario: precioUnidad,
        precio_total: precioUnidad,
        cantidad_seleccionada: 1,
        es_caso_1: true,
        nombre_display: `${producto.nombre} (unidad)`
      };
      
      agregarAlCarrito(productoUnidad);
    } else {
      // Caso 2: Buscar si ya hay items de este producto en el carrito
      const itemsExistentes = items.filter(item => 
        item.producto_id === producto.id && item.es_caso_2
      );
      
      let cantidadAAgregar = 100; // Cantidad base por defecto
      
      // Si ya hay items, usar la misma cantidad que el último agregado
      if (itemsExistentes.length > 0) {
        const ultimoItem = itemsExistentes[itemsExistentes.length - 1];
        cantidadAAgregar = ultimoItem.cantidad_personalizada;
      }
      
      const precioPorCantidad = (producto.precio_fraccionado_por_100 * cantidadAAgregar) / 100;
      
      const productoPersonalizado = {
        ...producto,
        cantidad_personalizada: cantidadAAgregar,
        precio_personalizado: precioPorCantidad,
        precio_total: precioPorCantidad,
        es_caso_2: true,
        nombre_personalizado: `${producto.nombre} (${cantidadAAgregar}${producto.unidad_abrev || 'gr'})`,
        nombre_display: `${producto.nombre} (${cantidadAAgregar}${producto.unidad_abrev || 'gr'})`
      };
      
      agregarAlCarrito(productoPersonalizado);
    }
    
    // Mostrar notificación
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
      <div class="alert alert-success alert-dismissible fade show position-fixed" 
           style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
        <strong>${producto.nombre}</strong> agregado al carrito
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  // Color único verde para todas las categorías
  const colorCategoria = '#28ad10'; // Verde principal de la página

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container py-5">
        {/* Título principal */}
        <div className="text-center mb-5">
          <h1 
            className="display-1 fw-bold mb-3"
            style={{ 
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              color: '#000',
              letterSpacing: '2px'
            }}
          >
            Tienda
          </h1>
          <p 
            className="lead fs-4 mb-0" 
            style={{ 
              color: '#6c757d',
              fontWeight: '400',
              fontSize: '1.15rem'
            }}
          >
            Explora nuestras categorías de productos naturales
          </p>
        </div>

        {cargando ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3 fs-5">Cargando categorías...</p>
          </div>
        ) : (
          <>
            {/* Grid de categorías - Diseño minimalista rectangulares */}
            <div className="row g-3 mb-5">
              {categorias.map((categoria, index) => (
                <div key={categoria.id} className="col-xl-3 col-lg-4 col-md-6">
                  <div 
                    className="categoria-card-minimal"
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#fafbfa', // Fondo muy sutil verdoso
                      border: `3px solid ${colorCategoria}`,
                      padding: '1rem',
                      textAlign: 'center',
                      height: '90px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: '0 3px 12px rgba(40, 173, 16, 0.08)'
                    }}
                    onClick={() => handleCategoriaClick(categoria)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.backgroundColor = colorCategoria;
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.boxShadow = `0 8px 25px rgba(40, 173, 16, 0.25)`;
                      // Cambiar color del texto interno
                      const nombre = e.currentTarget.querySelector('.categoria-nombre');
                      const contador = e.currentTarget.querySelector('.categoria-contador');
                      const label = e.currentTarget.querySelector('.categoria-label');
                      if (nombre) nombre.style.color = 'white';
                      if (contador) contador.style.color = 'white';
                      if (label) label.style.color = 'rgba(255, 255, 255, 0.9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.backgroundColor = '#fafbfa';
                      e.currentTarget.style.color = 'inherit';
                      e.currentTarget.style.boxShadow = '0 3px 12px rgba(40, 173, 16, 0.08)';
                      // Restaurar colores originales
                      const nombre = e.currentTarget.querySelector('.categoria-nombre');
                      const contador = e.currentTarget.querySelector('.categoria-contador');
                      const label = e.currentTarget.querySelector('.categoria-label');
                      if (nombre) nombre.style.color = colorCategoria;
                      if (contador) contador.style.color = '#1f2937';
                      if (label) label.style.color = '#4b5563';
                    }}
                  >
                    {/* Nombre de categoría */}
                    <h6 
                      className="categoria-nombre fw-bold mb-1"
                      style={{ 
                        color: colorCategoria,
                        fontSize: '0.9rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        margin: '0 0 6px 0',
                        transition: 'color 0.2s ease',
                        textShadow: '0 1px 2px rgba(40, 173, 16, 0.1)'
                      }}
                    >
                      {categoria.nombre}
                    </h6>
                    
                    {/* Contador de productos */}
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <span 
                        className="categoria-contador fw-bold"
                        style={{ 
                          fontSize: '1.4rem',
                          color: '#1f2937',
                          fontWeight: '900',
                          transition: 'color 0.2s ease',
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        {categoria.totalProductos}
                      </span>
                      <span 
                        className="categoria-label"
                        style={{ 
                          fontSize: '0.75rem',
                          color: '#4b5563',
                          textTransform: 'lowercase',
                          fontWeight: '600',
                          transition: 'color 0.2s ease',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {categoria.totalProductos === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sección de productos destacados por categoría */}
            <div className="mt-5">
              <div className="text-center mb-5">
                <h2 
                  className="display-4 fw-bold mb-3"
                  style={{ 
                    color: '#000'
                  }}
                >
                  Productos Destacados
                </h2>
                <p 
                  className="lead fs-4 mb-0" 
                  style={{ 
                    color: '#6c757d',
                    fontWeight: '400',
                    fontSize: '1.15rem'
                  }}
                >
                  Descubre lo mejor de cada categoría
                </p>
              </div>

              {productosDestacados.map((item, categoryIndex) => (
                <div key={item.categoria.id} className="mb-5">
                  {/* Header de categoría */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h3 
                        className="h2 fw-bold mb-1"
                        style={{ 
                          color: '#000'
                        }}
                      >
                        {item.categoria.nombre}
                      </h3>
                      <small 
                        style={{ 
                          color: '#6c757d',
                          fontWeight: '400',
                          fontSize: '0.9rem'
                        }}
                      >
                        Mostrando {item.productos.length} de {item.totalProductos} productos
                      </small>
                    </div>
                    <button 
                      className="btn d-flex align-items-center gap-2"
                      onClick={() => handleCategoriaClick(item.categoria)}
                      style={{ 
                        borderRadius: '8px',
                        border: `2px solid ${colorCategoria}`,
                        color: colorCategoria,
                        backgroundColor: 'transparent',
                        transition: 'all 0.3s ease',
                        fontWeight: '600'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = colorCategoria;
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = colorCategoria;
                      }}
                    >
                      Ver todos
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>

                  {/* Grid de productos */}
                  <div className="row g-4">
                    {item.productos.map(producto => (
                      <div key={producto.id} className="col-xl-3 col-lg-4 col-md-6">
                          <div 
                            className="card h-100 shadow-sm producto-card"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleProductoClick(producto)}
                          >
                            <div className="position-relative overflow-hidden">
                              {/* Imagen del producto */}
                              {producto.imagenes && producto.imagenes.length > 0 ? (
                                <div id={`carousel-${producto.id}`} className="carousel slide" data-bs-ride="carousel" data-bs-interval="3000">
                                  <div className="carousel-inner">
                                    {producto.imagenes.map((imagen, index) => (
                                      <div 
                                        key={imagen.id} 
                                        className={`carousel-item ${index === 0 ? 'active' : ''}`}
                                      >
                                        <img 
                                          src={imagen.es_url ? imagen.url : `data:image/jpeg;base64,${imagen.imagen_base64}`} 
                                          className="card-img-top" 
                                          alt={imagen.titulo || producto.nombre}
                                          style={{ height: '220px', objectFit: 'cover' }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  {producto.imagenes.length > 1 && (
                                    <>
                                      <button 
                                        className="carousel-control-prev" 
                                        type="button" 
                                        data-bs-target={`#carousel-${producto.id}`} 
                                        data-bs-slide="prev"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          width: '30px',
                                          height: '30px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          backgroundColor: 'rgba(0,0,0,0.5)',
                                          borderRadius: '50%',
                                          border: 'none'
                                        }}
                                      >
                                        <span className="carousel-control-prev-icon" style={{ width: '12px', height: '12px' }}></span>
                                      </button>
                                      <button 
                                        className="carousel-control-next" 
                                        type="button" 
                                        data-bs-target={`#carousel-${producto.id}`} 
                                        data-bs-slide="next"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          width: '30px',
                                          height: '30px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          backgroundColor: 'rgba(0,0,0,0.5)',
                                          borderRadius: '50%',
                                          border: 'none'
                                        }}
                                      >
                                        <span className="carousel-control-next-icon" style={{ width: '12px', height: '12px' }}></span>
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Indicadores de puntos */}
                                  {producto.imagenes.length > 1 && (
                                    <div className="carousel-indicators" style={{ bottom: '10px' }}>
                                      {producto.imagenes.map((_, index) => (
                                        <button
                                          key={index}
                                          type="button"
                                          data-bs-target={`#carousel-${producto.id}`}
                                          data-bs-slide-to={index}
                                          className={index === 0 ? 'active' : ''}
                                          onClick={(e) => e.stopPropagation()}
                                          style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            margin: '0 3px'
                                          }}
                                        ></button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                            ) : producto.foto_url ? (
                              <img 
                                src={producto.foto_url} 
                                className="card-img-top" 
                                alt={producto.nombre}
                                style={{ height: '220px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '220px' }}>
                                <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
                              </div>
                            )}

                            {/* Badge de etiquetas */}
                            <div className="position-absolute top-0 end-0 p-2">
                              <div className="d-flex flex-row gap-1 align-items-end justify-content-start">
                                {producto.etiquetas && producto.etiquetas.length > 0 && (
                                  <>
                                    {producto.etiquetas.slice(0, 3).map((etiqueta) => (
                                      <span 
                                        key={`${producto.id}-etiqueta-${etiqueta.id}`}
                                        className="badge bg-success text-white shadow-sm"
                                        style={{ 
                                          fontSize: '0.75em', 
                                          whiteSpace: 'nowrap',
                                          maxWidth: '120px',
                                          fontWeight: '500'
                                        }}
                                        title={etiqueta.nombre}
                                      >
                                        {etiqueta.nombre.length > 50 ? 
                                          etiqueta.nombre.substring(0, 50): 
                                          etiqueta.nombre
                                        }
                                      </span>
                                    ))}
                                    {producto.etiquetas.length > 3 && (
                                      <span 
                                        className="badge bg-success bg-opacity-75 text-white shadow-sm"
                                        style={{ fontSize: '0.65em', fontWeight: '500' }}
                                        title={`${producto.etiquetas.slice(3).map(e => e.nombre).join(', ')}`}
                                      >
                                        +{producto.etiquetas.length - 3}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="card-body d-flex flex-column">
                            <h5 className="card-title text-truncate" title={producto.nombre}>
                              {producto.nombre}
                            </h5>

                            <h6 className="card-title text-truncate" title={producto.marca}>
                              {producto.marca}
                            </h6>
                            
                            <p className="card-text text-muted small flex-grow-1">
                              {producto.descripcion?.substring(0, 80)}
                              {producto.descripcion?.length > 80 ? '...' : ''}
                            </p>

                            <div className="mt-auto">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  {determinarEsCaso1(producto) ? (
                                    <div>
                                      <h5 className="text-success fw-bold mb-0">
                                        ${(parseFloat(producto.precio_venta_publico || 0) / (producto.cantidad_unidades || 1)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </h5>
                                      <small className="text-muted">por unidad</small>
                                    </div>
                                  ) : (
                                    <div>
                                      <h5 className="text-success fw-bold mb-0">
                                        ${parseFloat(producto.precio_fraccionado_por_100 || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </h5>
                                      <small className="text-muted">por 100{producto.unidad_abrev || 'gr'}</small>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <button
                                className="btn btn-success w-100 fw-semibold shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevenir navegación al detalle
                                  handleAgregarAlCarrito(producto);
                                }}
                                style={{ 
                                  borderRadius: '8px',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <i className="bi bi-cart-plus me-2"></i>
                                Añadir al carrito
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Línea separadora entre categorías */}
                  {categoryIndex !== productosDestacados.length - 1 && (
                    <hr className="my-5 border-2 opacity-25" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Mensaje si no hay categorías */}
        {!cargando && categorias.length === 0 && (
          <div className="text-center py-5">
            <div className="card border-0 shadow-lg mx-auto" style={{ maxWidth: '500px', borderRadius: '20px' }}>
              <div className="card-body py-5">
                <div className="mb-4">
                  <i className="bi bi-shop text-muted" style={{ fontSize: '4rem' }}></i>
                </div>
                <h3 className="text-muted">No hay categorías disponibles</h3>
                <p className="text-muted">Vuelve más tarde para ver nuestros productos.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .categoria-card:hover .btn {
          background-color: #343a40 !important;
          color: white !important;
          transform: scale(1.05);
        }
        
        .text-shadow {
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .producto-card {
          transition: all 0.3s ease;
          border-radius: 15px;
        }
        
        .producto-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        
        .carousel-control-prev,
        .carousel-control-next {
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .producto-card:hover .carousel-control-prev,
        .producto-card:hover .carousel-control-next {
          opacity: 1;
        }
        
        .carousel-indicators {
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }
        
        .producto-card:hover .carousel-indicators {
          opacity: 1;
        }
        
        @media (max-width: 768px) {
          .categoria-card {
            margin-bottom: 1.5rem;
          }
          
          .carousel-control-prev,
          .carousel-control-next {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default VistaProductos;