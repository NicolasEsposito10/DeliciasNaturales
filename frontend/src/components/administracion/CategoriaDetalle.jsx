import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCarrito } from '../../context/CarritoContext';
import { formatearPrecio } from '../../utils/formatoArgentino.jsx';
import { generarSlugProducto } from '../../utils/slugUtils.js';

function CategoriaDetalle() {
  const { nombreCategoria } = useParams();
  const navigate = useNavigate();
  const { items, agregarAlCarrito } = useCarrito();
  const [categoria, setCategoria] = useState(null);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const productsPorPagina = 20;

  // Agregar estilos CSS para el paginado
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pagination-custom .page-link {
        transition: all 0.2s ease-in-out;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .pagination-custom .page-link:hover:not(.disabled) {
        background-color: #28ad10 !important;
        color: white !important;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(40, 173, 16, 0.3);
      }
      .pagination-custom .page-item.active .page-link {
        box-shadow: 0 2px 6px rgba(40, 173, 16, 0.4);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  // Calcular productos para la página actual
  const calcularProductosPaginados = () => {
    const indiceInicio = (paginaActual - 1) * productsPorPagina;
    const indiceFin = indiceInicio + productsPorPagina;
    return productos.slice(indiceInicio, indiceFin);
  };

  // Calcular número total de páginas
  const calcularTotalPaginas = () => {
    return Math.ceil(productos.length / productsPorPagina);
  };

  // Manejar cambio de página
  const handleCambioPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    // Scroll al top cuando cambie de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generar números de página a mostrar (máximo 5 números)
  const generarNumerosPagina = () => {
    const totalPaginas = calcularTotalPaginas();
    const numerosPagina = [];
    
    if (totalPaginas <= 5) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        numerosPagina.push(i);
      }
    } else {
      // Si hay más de 5 páginas, mostrar páginas relevantes
      if (paginaActual <= 3) {
        // Al principio: mostrar 1,2,3,4,5
        for (let i = 1; i <= 5; i++) {
          numerosPagina.push(i);
        }
      } else if (paginaActual >= totalPaginas - 2) {
        // Al final: mostrar las últimas 5
        for (let i = totalPaginas - 4; i <= totalPaginas; i++) {
          numerosPagina.push(i);
        }
      } else {
        // En el medio: mostrar páginas alrededor de la actual
        for (let i = paginaActual - 2; i <= paginaActual + 2; i++) {
          numerosPagina.push(i);
        }
      }
    }
    
    return numerosPagina;
  };

  useEffect(() => {
    cargarCategoriaYProductos();
  }, [nombreCategoria]);

  // Resetear a página 1 cuando cambien los productos
  useEffect(() => {
    setPaginaActual(1);
  }, [productos]);

  const cargarCategoriaYProductos = async () => {
    setCargando(true);
    try {
      // Cargar todas las categorías y productos
      const [categoriasRes, productosRes] = await Promise.all([
        axios.get('/api/categorias'),
        axios.get('/api/productos')
      ]);

      // Buscar categoría por nombre (convertir slug a nombre)
      const nombreBuscado = nombreCategoria
        .replace(/-/g, ' ')
        .toLowerCase();

      const categoriaEncontrada = categoriasRes.data.find(cat => 
        cat.nombre.toLowerCase() === nombreBuscado ||
        cat.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === nombreBuscado
      );

      if (!categoriaEncontrada) {
        console.error('Categoría no encontrada:', nombreCategoria);
        navigate('/tienda');
        return;
      }

      setCategoria(categoriaEncontrada);

      // Filtrar productos de esta categoría
      const productosCategoria = productosRes.data.filter(
        producto => producto.categoria_id === categoriaEncontrada.id && producto.disponible
      );

      setProductos(productosCategoria);
    } catch (error) {
      console.error('Error cargando datos:', error);
      navigate('/tienda');
    } finally {
      setCargando(false);
    }
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

  const handleProductoClick = (producto) => {
    // Generar slug único usando nombre + marca + ID
    const slug = generarSlugProducto(producto);
    navigate(`/producto/${slug}`);
  };

  if (cargando) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (!categoria) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Categoría no encontrada.
          <button className="btn btn-primary ms-3" onClick={() => navigate('/tienda')}>
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container py-5">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <button 
                className="btn btn-link p-0 text-decoration-none"
                onClick={() => navigate('/tienda')}
              >
                Tienda
              </button>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {categoria?.nombre || nombreCategoria}
            </li>
          </ol>
        </nav>

        {/* Header de categoría */}
        <div className="text-center mb-5">
          <h1 
            className="display-1 fw-bold mb-3"
            style={{ 
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              color: '#000',
              letterSpacing: '1px'
            }}
          >
            {categoria.nombre}
          </h1>
          <p 
            className="lead fs-4 mb-0" 
            style={{ 
              color: '#6c757d',
              fontWeight: '400',
              fontSize: '1.15rem'
            }}
          >
            {productos.length} producto{productos.length !== 1 ? 's' : ''} disponible{productos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Botón volver */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-end">
              <button 
                className="btn d-flex align-items-center gap-2"
                onClick={() => navigate('/tienda')}
                style={{ 
                  borderRadius: '8px',
                  border: '2px solid #28ad10',
                  color: '#28ad10',
                  backgroundColor: 'transparent',
                  transition: 'all 0.3s ease',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#28ad10';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#28ad10';
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Volver a Tienda
              </button>
            </div>
          </div>
        </div>

      {/* Grid de productos */}
      {productos.length === 0 ? (
        <div className="text-center py-5">
          <div className="card border-0 shadow-lg mx-auto" style={{ maxWidth: '500px' }}>
            <div className="card-body py-5">
              <i className="bi bi-box-seam text-muted" style={{ fontSize: '4rem' }}></i>
              <h3 className="mt-3 text-muted">No hay productos disponibles</h3>
              <p className="text-muted">Esta categoría no tiene productos en este momento.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/tienda')}
              >
                Ver otras categorías
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Información de la página actual */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <p className="mb-0 text-muted">
                Mostrando {calcularProductosPaginados().length} de {productos.length} productos
                {calcularTotalPaginas() > 1 && (
                  <span className="ms-2">
                    (Página {paginaActual} de {calcularTotalPaginas()})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Grid de productos */}
          <div className="row g-4">
            {calcularProductosPaginados().map(producto => (
            <div key={producto.id} className="col-lg-3 col-md-4 col-sm-6">
              <div 
                className="card h-100 shadow-sm producto-card"
                style={{ cursor: 'pointer' }}
                onClick={() => handleProductoClick(producto)}
              >
                <div className="position-relative overflow-hidden">
                  {/* Imagen del producto */}
                  {producto.imagenes && producto.imagenes.length > 0 ? (
                    <div id={`carousel-${producto.id}`} className="carousel slide" data-bs-ride="carousel">
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
                              {formatearPrecio(parseFloat(producto.precio_venta_publico || 0) / (producto.cantidad_unidades || 1))}
                            </h5>
                            <small className="text-muted">por unidad</small>
                          </div>
                        ) : (
                          <div>
                            <h5 className="text-success fw-bold mb-0">
                              {formatearPrecio(parseFloat(producto.precio_fraccionado_por_100 || 0))}
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

          {/* Componente de paginación */}
          {calcularTotalPaginas() > 1 && (
            <div className="d-flex justify-content-center mt-4 mb-3">
              <nav>
                <ul className="pagination pagination-sm pagination-custom mb-0" style={{ gap: '2px' }}>
                  {/* Botón anterior */}
                  <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => handleCambioPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                      style={{ 
                        borderColor: '#28ad10',
                        color: paginaActual === 1 ? '#6c757d' : '#28ad10',
                        padding: '6px 10px',
                        fontSize: '0.875rem',
                        borderRadius: '6px'
                      }}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>

                  {/* Primera página y puntos suspensivos si es necesario */}
                  {paginaActual > 3 && calcularTotalPaginas() > 5 && (
                    <>
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => handleCambioPagina(1)}
                          style={{ 
                            borderColor: '#28ad10', 
                            color: '#28ad10',
                            padding: '6px 10px',
                            fontSize: '0.875rem',
                            borderRadius: '6px'
                          }}
                        >
                          1
                        </button>
                      </li>
                      <li className="page-item disabled">
                        <span 
                          className="page-link" 
                          style={{ 
                            borderColor: '#28ad10', 
                            color: '#6c757d',
                            padding: '6px 8px',
                            fontSize: '0.875rem',
                            borderRadius: '6px'
                          }}
                        >
                          ...
                        </span>
                      </li>
                    </>
                  )}

                  {/* Números de página */}
                  {generarNumerosPagina().map(numeroPagina => (
                    <li key={numeroPagina} className={`page-item ${paginaActual === numeroPagina ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handleCambioPagina(numeroPagina)}
                        style={{
                          borderColor: '#28ad10',
                          backgroundColor: paginaActual === numeroPagina ? '#28ad10' : 'white',
                          color: paginaActual === numeroPagina ? 'white' : '#28ad10',
                          padding: '6px 12px',
                          fontSize: '0.875rem',
                          borderRadius: '6px',
                          minWidth: '36px',
                          fontWeight: paginaActual === numeroPagina ? '600' : '500'
                        }}
                      >
                        {numeroPagina}
                      </button>
                    </li>
                  ))}

                  {/* Puntos suspensivos y última página si es necesario */}
                  {paginaActual < calcularTotalPaginas() - 2 && calcularTotalPaginas() > 5 && (
                    <>
                      <li className="page-item disabled">
                        <span 
                          className="page-link" 
                          style={{ 
                            borderColor: '#28ad10', 
                            color: '#6c757d',
                            padding: '6px 8px',
                            fontSize: '0.875rem',
                            borderRadius: '6px'
                          }}
                        >
                          ...
                        </span>
                      </li>
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => handleCambioPagina(calcularTotalPaginas())}
                          style={{ 
                            borderColor: '#28ad10', 
                            color: '#28ad10',
                            padding: '6px 10px',
                            fontSize: '0.875rem',
                            borderRadius: '6px'
                          }}
                        >
                          {calcularTotalPaginas()}
                        </button>
                      </li>
                    </>
                  )}

                  {/* Botón siguiente */}
                  <li className={`page-item ${paginaActual === calcularTotalPaginas() ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handleCambioPagina(paginaActual + 1)}
                      disabled={paginaActual === calcularTotalPaginas()}
                      style={{ 
                        borderColor: '#28ad10',
                        color: paginaActual === calcularTotalPaginas() ? '#6c757d' : '#28ad10',
                        padding: '6px 10px',
                        fontSize: '0.875rem',
                        borderRadius: '6px'
                      }}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
              
              {/* Información de página */}
              <div className="ms-3 d-flex align-items-center">
                <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                  Página {paginaActual} de {calcularTotalPaginas()}
                </small>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default CategoriaDetalle;
