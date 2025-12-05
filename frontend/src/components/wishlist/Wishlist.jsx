import React, { useState, useEffect } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../../context/CarritoContext';
import { formatearPrecio } from '../../utils/formatoArgentino.jsx';
import { generarSlugProducto } from '../../utils/slugUtils.js';

const Wishlist = () => {
  const { wishlistItems, loading, removerDeWishlist, limpiarWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { agregarAlCarrito } = useCarrito();
  const navigate = useNavigate();
  const [productosSeleccionados, setProductosSeleccionados] = useState(new Set());
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Función para determinar si es Caso 1 o Caso 2
  const determinarEsCaso1 = (producto) => {
    if (!producto || !producto.unidad_nombre) return false;
    
    const nombre = producto.unidad_nombre?.toLowerCase() || '';
    const abrev = producto.unidad_abrev?.toLowerCase() || '';
    
    return nombre.includes('unidad') || 
           abrev === 'u' || 
           abrev === 'unidad' || 
           abrev === 'unidades' ||
           nombre === 'unidades' ||
           nombre === 'unidad';
  };

  const obtenerPrecioMostrar = (producto) => {
    const esCaso1 = determinarEsCaso1(producto);
    
    if (esCaso1) {
      const precioUnidad = parseFloat(producto.precio_venta_publico || 0) / (producto.cantidad_unidades || 1);
      return {
        precio: formatearPrecio(precioUnidad),
        unidad: 'por unidad'
      };
    } else {
      return {
        precio: formatearPrecio(parseFloat(producto.precio_fraccionado_por_100 || 0)),
        unidad: `por 100${producto.unidad_abrev || 'g'}`
      };
    }
  };

  const handleProductoClick = (producto) => {
    const slug = generarSlugProducto(producto);
    navigate(`/producto/${slug}`);
  };

  const handleRemover = async (productoId) => {
    try {
      await removerDeWishlist(productoId);
      // Remover de seleccionados si estaba seleccionado
      const nuevosSeleccionados = new Set(productosSeleccionados);
      nuevosSeleccionados.delete(productoId);
      setProductosSeleccionados(nuevosSeleccionados);
    } catch (error) {
      console.error('Error al remover de wishlist:', error);
    }
  };

  const handleSeleccionarTodos = () => {
    if (productosSeleccionados.size === wishlistItems.length) {
      // Deseleccionar todos
      setProductosSeleccionados(new Set());
    } else {
      // Seleccionar todos
      const todosIds = new Set(wishlistItems.map(item => item.id));
      setProductosSeleccionados(todosIds);
    }
  };

  const handleSeleccionarProducto = (productoId) => {
    const nuevosSeleccionados = new Set(productosSeleccionados);
    if (nuevosSeleccionados.has(productoId)) {
      nuevosSeleccionados.delete(productoId);
    } else {
      nuevosSeleccionados.add(productoId);
    }
    setProductosSeleccionados(nuevosSeleccionados);
  };

  const handleRemoverSeleccionados = async () => {
    try {
      const promesas = Array.from(productosSeleccionados).map(id => removerDeWishlist(id));
      await Promise.all(promesas);
      setProductosSeleccionados(new Set());
    } catch (error) {
      console.error('Error al remover productos seleccionados:', error);
    }
  };

  const handleAgregarAlCarrito = (producto) => {
    const esCaso1 = determinarEsCaso1(producto);
    
    if (esCaso1) {
      // Caso 1: agregar 1 unidad
      agregarAlCarrito(producto, 1, false);
    } else {
      // Caso 2: agregar 100 gramos por defecto
      agregarAlCarrito(producto, 100, true);
    }
  };

  const handleLimpiarTodo = async () => {
    try {
      await limpiarWishlist();
      setMostrarConfirmacion(false);
      setProductosSeleccionados(new Set());
    } catch (error) {
      console.error('Error al limpiar wishlist:', error);
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando tu lista de deseos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-heart-fill text-danger me-2"></i>
            Mi Lista de Favoritos
          </h2>
          <p className="text-muted mb-0">
            {wishlistItems.length === 0 
              ? 'Tu lista está vacía' 
              : `${wishlistItems.length} producto${wishlistItems.length === 1 ? '' : 's'} guardado${wishlistItems.length === 1 ? '' : 's'}`
            }
          </p>
        </div>
        
        {wishlistItems.length > 0 && (
          <div className="d-flex gap-2">
            <button
              onClick={handleSeleccionarTodos}
              className="btn btn-outline-secondary"
            >
              {productosSeleccionados.size === wishlistItems.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
            
            {productosSeleccionados.size > 0 && (
              <button
                onClick={handleRemoverSeleccionados}
                className="btn btn-outline-danger"
              >
                Remover seleccionados ({productosSeleccionados.size})
              </button>
            )}
            
            <button
              onClick={() => setMostrarConfirmacion(true)}
              className="btn btn-danger"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      {wishlistItems.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-heart display-1 text-muted mb-3"></i>
          <h4 className="text-muted mb-3">Tu lista de deseos está vacía</h4>
          <p className="text-muted mb-4">
            Explora nuestros productos y agrega los que más te gusten a tu lista de deseos
          </p>
          <button
            onClick={() => navigate('/tienda')}
            className="btn btn-primary btn-lg"
          >
            Explorar productos
          </button>
        </div>
      ) : (
        <div className="row">
          {wishlistItems.map((producto) => {
            const precioInfo = obtenerPrecioMostrar(producto);
            const isSelected = productosSeleccionados.has(producto.id);
            
            return (
              <div key={producto.id} className="col-lg-4 col-md-6 mb-4">
                <div className={`card h-100 ${isSelected ? 'border-primary' : ''}`}>
                  {/* Checkbox de selección */}
                  <div className="position-absolute" style={{ top: '10px', left: '10px', zIndex: 5 }}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSeleccionarProducto(producto.id)}
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </div>
                  </div>

                  {/* Botón remover */}
                  <div className="position-absolute" style={{ top: '10px', right: '10px', zIndex: 5 }}>
                    <button
                      onClick={() => handleRemover(producto.id)}
                      className="btn btn-sm btn-outline-danger"
                      style={{ 
                        width: '30px', 
                        height: '30px',
                        padding: '0',
                        borderRadius: '50%'
                      }}
                      title="Remover de wishlist"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>

                  {/* Imagen del producto */}
                  <div 
                    className="card-img-top position-relative"
                    style={{ height: '200px', cursor: 'pointer' }}
                    onClick={() => handleProductoClick(producto)}
                  >
                    {producto.imagenes && producto.imagenes.length > 0 ? (
                      <img
                        src={producto.imagenes[0].es_url ? 
                          producto.imagenes[0].url : 
                          `data:image/jpeg;base64,${producto.imagenes[0].imagen_base64}`
                        }
                        alt={producto.nombre}
                        className="img-fluid"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                      />
                    ) : (
                      <div 
                        className="bg-light d-flex align-items-center justify-content-center"
                        style={{ width: '100%', height: '100%' }}
                      >
                        <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }}></i>
                      </div>
                    )}
                  </div>

                  <div className="card-body d-flex flex-column">
                    {/* Información del producto */}
                    <div className="flex-grow-1">
                      <h5 
                        className="card-title mb-2"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleProductoClick(producto)}
                      >
                        {producto.nombre}
                      </h5>
                      
                      {producto.marca && (
                        <p className="text-muted mb-2">{producto.marca}</p>
                      )}
                      
                      <div className="mb-3">
                        <span className="h5 text-success fw-bold">
                          {precioInfo.precio}
                        </span>
                        <br />
                        <small className="text-muted">{precioInfo.unidad}</small>
                      </div>
                      
                      {producto.descripcion && (
                        <p className="card-text text-muted small">
                          {producto.descripcion.length > 100 
                            ? `${producto.descripcion.substring(0, 100)}...` 
                            : producto.descripcion
                          }
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="d-flex gap-2 mt-auto">
                      <button
                        onClick={() => handleAgregarAlCarrito(producto)}
                        className="btn btn-primary flex-grow-1"
                      >
                        <i className="bi bi-cart-plus me-2"></i>
                        Agregar al carrito
                      </button>
                      <button
                        onClick={() => handleProductoClick(producto)}
                        className="btn btn-outline-secondary"
                        title="Ver detalles"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar acción</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMostrarConfirmacion(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que quieres eliminar todos los productos de tu lista de deseos?</p>
                <p className="text-danger">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setMostrarConfirmación(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleLimpiarTodo}
                >
                  Sí, eliminar todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
