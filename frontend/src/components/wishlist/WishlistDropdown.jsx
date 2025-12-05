import React, { useState, useRef, useEffect } from 'react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatearPrecio } from '../../utils/formatoArgentino.jsx';
import { generarSlugProducto } from '../../utils/slugUtils.js';

const WishlistDropdown = () => {
  const { wishlistItems, obtenerCount, obtenerPreview, removerDeWishlist, loading } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const count = obtenerCount();
  const previewItems = obtenerPreview(8); // Reducir a 8 items para mejor UI

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

  // Manejar clicks fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target) && 
          !buttonRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Manejar mouse leave del dropdown
  const handleMouseLeave = () => {
    setShowDropdown(false);
  };

  const handleButtonClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleProductoClick = (producto) => {
    const slug = generarSlugProducto(producto);
    navigate(`/producto/${slug}`);
    setShowDropdown(false);
  };

  const handleRemover = async (e, productoId) => {
    e.stopPropagation();
    try {
      await removerDeWishlist(productoId);
    } catch (error) {
      console.error('Error al remover de wishlist:', error);
    }
  };

  const handleVerTodo = () => {
    navigate('/wishlist');
    setShowDropdown(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="position-relative">
      <button
        ref={buttonRef}
        className="btn position-relative"
        type="button"
        onClick={handleButtonClick}
        style={{
          border: 'none',
          backgroundColor: 'transparent',
          padding: '8px 12px',
          color: count > 0 ? '#dc3545' : '#6c757d',
          transition: 'color 0.3s ease'
        }}
        title={count > 0 ? `${count} productos en wishlist` : 'Lista de deseos'}
      >
        <i 
          className={count > 0 ? 'bi bi-heart-fill' : 'bi bi-heart'} 
          style={{ fontSize: '1.3rem' }}
        ></i>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop para cerrar dropdown */}
          <div 
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ 
              zIndex: 1040,
              backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }}
            onClick={() => setShowDropdown(false)}
          ></div>

          {/* Dropdown content */}
          <div 
            className="position-absolute end-0 mt-2"
            style={{ 
              zIndex: 1050,
              width: '380px',
              maxHeight: '500px',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                padding: '20px 24px 16px 24px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderBottom: '1px solid #e9ecef'
              }}
            >
              <h6 
                className="mb-0 d-flex align-items-center"
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#495057'
                }}
              >
                <i 
                  className="bi bi-heart-fill me-3" 
                  style={{ 
                    color: '#ff6b9d',
                    fontSize: '1.1rem'
                  }}
                ></i>
                Favoritos
                {count > 0 && (
                  <span 
                    className="ms-auto px-2 py-1"
                    style={{
                      backgroundColor: '#fff3f6',
                      color: '#ff6b9d',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      border: '1px solid #ffe0e8'
                    }}
                  >
                    {count}
                  </span>
                )}
              </h6>
            </div>

            {loading ? (
              <div 
                className="text-center py-5"
                style={{ backgroundColor: '#fafbfc' }}
              >
                <div 
                  className="spinner-border text-primary" 
                  role="status"
                  style={{ color: '#ff6b9d !important' }}
                >
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : previewItems.length === 0 ? (
              <div 
                className="text-center py-5"
                style={{ 
                  backgroundColor: '#fafbfc',
                  margin: '0'
                }}
              >
                <div 
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#fff3f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}
                >
                  <i 
                    className="bi bi-heart" 
                    style={{ 
                      fontSize: '2.2rem',
                      color: '#ff6b9d'
                    }}
                  ></i>
                </div>
                <p 
                  className="mb-1"
                  style={{
                    color: '#6c757d',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Tu lista está vacía
                </p>
                <small 
                  style={{
                    color: '#adb5bd',
                    fontSize: '0.85rem'
                  }}
                >
                  Agrega productos que te gusten ♡
                </small>
              </div>
            ) : (
              <>
                {previewItems.map((producto, index) => {
                  const precioInfo = obtenerPrecioMostrar(producto);
                  const isLast = index === previewItems.length - 1;
                  return (
                    <div 
                      key={producto.id}
                      className="position-relative"
                      style={{ 
                        cursor: 'pointer',
                        padding: '16px 24px',
                        borderBottom: isLast ? 'none' : '1px solid #f1f3f4',
                        backgroundColor: '#ffffff',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleProductoClick(producto)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <div className="d-flex align-items-start">
                        {/* Imagen del producto */}
                        <div 
                          className="me-3 flex-shrink-0"
                          style={{ 
                            width: '60px', 
                            height: '60px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#f8f9fa',
                            border: '2px solid #f1f3f4'
                          }}
                        >
                          {producto.imagenes && producto.imagenes.length > 0 ? (
                            <img
                              src={producto.imagenes[0].es_url ? 
                                producto.imagenes[0].url : 
                                `data:image/jpeg;base64,${producto.imagenes[0].imagen_base64}`
                              }
                              alt={producto.nombre}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }}
                            />
                          ) : (
                            <div 
                              className="d-flex align-items-center justify-content-center h-100"
                              style={{ backgroundColor: '#fff3f6' }}
                            >
                              <i 
                                className="bi bi-image" 
                                style={{ 
                                  color: '#ff6b9d',
                                  fontSize: '1.2rem'
                                }}
                              ></i>
                            </div>
                          )}
                        </div>

                        {/* Información del producto */}
                        <div className="flex-grow-1 min-width-0">
                          <h6 
                            className="mb-1 text-truncate" 
                            style={{ 
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              color: '#2d3748',
                              lineHeight: '1.3'
                            }}
                          >
                            {producto.nombre}
                          </h6>
                          {producto.marca && (
                            <p 
                              className="mb-2 text-truncate" 
                              style={{ 
                                fontSize: '0.8rem',
                                color: '#718096',
                                margin: '0'
                              }}
                            >
                              {producto.marca}
                            </p>
                          )}
                          <div>
                            <span 
                              className="fw-bold" 
                              style={{ 
                                fontSize: '0.9rem',
                                color: '#48bb78'
                              }}
                            >
                              {precioInfo.precio}
                            </span>
                            <br />
                            <small 
                              style={{
                                color: '#a0aec0',
                                fontSize: '0.75rem'
                              }}
                            >
                              {precioInfo.unidad}
                            </small>
                          </div>
                        </div>

                        {/* Botón remover */}
                        <button
                          onClick={(e) => handleRemover(e, producto.id)}
                          className="ms-2"
                          style={{ 
                            width: '36px', 
                            height: '36px',
                            padding: '0',
                            border: 'none',
                            backgroundColor: 'transparent',
                            borderRadius: '8px',
                            color: '#e53e3e',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fed7d7';
                            e.currentTarget.style.color = '#c53030';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#e53e3e';
                          }}
                          title="Remover de wishlist"
                        >
                          <i className="bi bi-x-lg" style={{ fontSize: '0.9rem' }}></i>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Botón Ver Todo */}
                {count > 10 && (
                  <div 
                    style={{
                      padding: '16px 24px',
                      backgroundColor: '#f7fafc',
                      borderTop: '1px solid #e2e8f0'
                    }}
                  >
                    <button 
                      onClick={handleVerTodo}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #ff6b9d',
                        backgroundColor: 'transparent',
                        color: '#ff6b9d',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ff6b9d';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#ff6b9d';
                      }}
                    >
                      Ver todos ({count} productos)
                    </button>
                  </div>
                )}

                {count <= 10 && count > 0 && (
                  <div 
                    style={{
                      padding: '16px 24px',
                      backgroundColor: '#f7fafc',
                      borderTop: '1px solid #e2e8f0'
                    }}
                  >
                    <button 
                      onClick={handleVerTodo}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #667eea',
                        backgroundColor: 'transparent',
                        color: '#667eea',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#667eea';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#667eea';
                      }}
                    >
                      Gestionar lista de favoritos
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WishlistDropdown;
