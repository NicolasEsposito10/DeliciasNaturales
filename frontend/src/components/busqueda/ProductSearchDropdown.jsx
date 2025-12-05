import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatearPrecio } from '../../utils/formatoArgentino.jsx';
import { generarSlugProducto } from '../../utils/slugUtils.js';
import { FaSearch, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const ProductSearchDropdown = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

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

  // Buscar productos con debounce
  useEffect(() => {
    const buscarProductos = async () => {
      if (searchTerm.trim().length < 2) {
        setProductos([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`/api/productos/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
        // Limitar a 8 resultados para mejor UX
        setProductos(response.data.slice(0, 8));
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(buscarProductos, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Manejar clicks fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target)) {
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

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim().length >= 2) {
      setShowDropdown(true);
    }
  };

  const handleProductoClick = (producto) => {
    const slug = generarSlugProducto(producto);
    navigate(`/producto/${slug}`);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (productos.length > 0) {
      handleProductoClick(productos[0]);
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Input de búsqueda */}
      <form onSubmit={handleSubmit} className="d-flex align-items-center">
        <div className="position-relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={(e) => {
              handleInputFocus();
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#28ad10';
              e.target.style.boxShadow = '0 0 0 3px rgba(40, 173, 16, 0.1), 0 2px 8px rgba(0, 0, 0, 0.12)';
            }}
            onBlur={(e) => {
              if (!showDropdown) {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }
            }}
            placeholder="Buscar productos, marcas y más..."
            className="form-control"
            style={{
              width: '320px',
              backgroundColor: 'white',
              border: '2px solid #e0e0e0',
              borderRadius: '6px',
              paddingLeft: '45px',
              paddingRight: searchTerm ? '45px' : '15px',
              color: '#333',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          />
          
          {/* Icono de búsqueda */}
          <FaSearch 
            style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6c757d',
              fontSize: '0.9rem'
            }}
          />
          
          {/* Botón para limpiar */}
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#6c757d',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaTimes fontSize="0.8rem" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown de resultados */}
      {showDropdown && searchTerm.trim().length >= 2 && (
        <div
          className="position-absolute bg-white border rounded shadow-lg"
          style={{
            top: '100%',
            left: '0',
            width: '380px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1050,
            marginTop: '5px',
            borderColor: '#e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            animation: 'searchDropdownFadeIn 0.2s ease'
          }}
        >
          {loading ? (
            <div className="p-3 text-center">
              <div className="spinner-border spinner-border-sm text-success" role="status">
                <span className="visually-hidden">Buscando...</span>
              </div>
              <p className="mb-0 mt-2 text-muted small">Buscando productos...</p>
            </div>
          ) : productos.length > 0 ? (
            <>
              <div className="p-2 border-bottom bg-light">
                <small className="text-muted fw-semibold">
                  {productos.length} resultado{productos.length !== 1 ? 's' : ''}
                </small>
              </div>
              {productos.map((producto) => {
                const precioInfo = obtenerPrecioMostrar(producto);
                return (
                  <div
                    key={producto.id}
                    className="d-flex align-items-center p-3 border-bottom cursor-pointer"
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                    onClick={() => handleProductoClick(producto)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderLeft = '3px solid #28ad10';
                      e.currentTarget.style.paddingLeft = '12px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderLeft = 'none';
                      e.currentTarget.style.paddingLeft = '15px';
                    }}
                  >
                    {/* Imagen del producto */}
                    <div
                      className="flex-shrink-0 me-3"
                      style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e0e0e0'
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
                            objectFit: 'cover',
                            borderRadius: '3px'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '📦';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.5rem' }}>📦</span>
                      )}
                    </div>

                    {/* Info del producto */}
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-semibold" style={{ fontSize: '0.9rem', color: '#333' }}>
                        {producto.nombre}
                      </h6>
                      <p className="mb-1 text-muted small">
                        {producto.marca_nombre}
                      </p>
                      <div className="d-flex align-items-center">
                        <span className="text-success fw-bold me-2" style={{ fontSize: '0.9rem' }}>
                          {precioInfo.precio}
                        </span>
                        <small className="text-muted">
                          {precioInfo.unidad}
                        </small>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : searchTerm.trim().length >= 2 ? (
            <div className="p-3 text-center">
              <p className="mb-0 text-muted">
                No se encontraron productos para "{searchTerm}"
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ProductSearchDropdown;
