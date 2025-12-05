import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCarrito } from '../../context/CarritoContext';
import { formatearPrecio } from '../../utils/formatoArgentino.jsx';
import { extraerIdDeSlug, validarSlugProducto } from '../../utils/slugUtils.js';
import WishlistButton from '../wishlist/WishlistButton';

function ProductoDetalle() {
  const { nombreProducto } = useParams();
  const navigate = useNavigate();
  const { items, agregarAlCarrito } = useCarrito();
  
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cantidad, setCantidad] = useState(1); // Para Caso 1
  const [cantidadGramos, setCantidadGramos] = useState(100); // Para Caso 2
  const [imagenActual, setImagenActual] = useState(0);
  const [mostrandoZoom, setMostrandoZoom] = useState(false);

  useEffect(() => {
    cargarProducto();
  }, [nombreProducto]);

  const cargarProducto = async () => {
    setCargando(true);
    try {
      // Validar formato del slug
      if (!validarSlugProducto(nombreProducto)) {
        console.error('Formato de slug inválido:', nombreProducto);
        navigate('/tienda');
        return;
      }

      // Extraer ID del slug
      const productoId = extraerIdDeSlug(nombreProducto);
      if (!productoId) {
        console.error('No se pudo extraer ID del slug:', nombreProducto);
        navigate('/tienda');
        return;
      }

      // Buscar producto por ID
      const productosRes = await axios.get('/api/productos');
      const productoEncontrado = productosRes.data.find(prod => prod.id === productoId);

      if (!productoEncontrado) {
        console.error('Producto no encontrado con ID:', productoId);
        navigate('/tienda');
        return;
      }

      // Cargar imágenes del producto si no están incluidas
      if (!productoEncontrado.imagenes || productoEncontrado.imagenes.length === 0) {
        try {
          const imagenesRes = await axios.get(`/api/productos/${productoEncontrado.id}/imagenes`);
          productoEncontrado.imagenes = imagenesRes.data;
        } catch (error) {
          console.warn('No se pudieron cargar las imágenes:', error);
          productoEncontrado.imagenes = [];
        }
      }

      setProducto(productoEncontrado);
      
      // Establecer cantidades mínimas según el tipo
      if (determinarEsCaso1(productoEncontrado)) {
        setCantidad(1);
      } else {
        // Caso 2: Buscar cantidad más común en el carrito para este producto
        const itemsExistentes = items.filter(item => 
          item.producto_id === productoEncontrado.id && item.es_caso_2
        );
        
        if (itemsExistentes.length > 0) {
          // Usar la cantidad más común o la última utilizada
          const cantidadesUsadas = itemsExistentes.map(item => item.cantidad_personalizada);
          const cantidadMasComun = cantidadesUsadas.reduce((a, b, _, arr) =>
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
          );
          setCantidadGramos(cantidadMasComun);
        } else {
          setCantidadGramos(100); // Mínimo por defecto
        }
      }
      
    } catch (error) {
      console.error('Error cargando producto:', error);
      navigate('/tienda');
    } finally {
      setCargando(false);
    }
  };

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

  // Calcular precio dinámico para Caso 2
  const calcularPrecioDinamico = () => {
    if (!producto) return 0;
    
    if (determinarEsCaso1(producto)) {
      // Caso 1: Calcular precio por unidad individual
      const precioUnidad = parseFloat(producto.precio_venta_publico || 0) / (producto.cantidad_unidades || 1);
      return precioUnidad * cantidad;
    }
    
    // Caso 2: Calcular precio por gramos/ml
    const cantidadNumero = parseInt(cantidadGramos) || 0;
    if (producto.precio_fraccionado_por_100 && cantidadNumero >= 25) {
      const precioPor100 = producto.precio_fraccionado_por_100;
      return (precioPor100 * cantidadNumero) / 100;
    }
    
    return 0;
  };

  const handleAgregarAlCarrito = () => {
    if (!producto) return;
    
    const esCaso1 = determinarEsCaso1(producto);
    
    if (esCaso1) {
      // Caso 1: Agregar por unidades individuales
      const precioUnidad = parseFloat(producto.precio_venta_publico || 0) / (producto.cantidad_unidades || 1);
      
      // Crear producto personalizado para cada unidad con precio individual
      const productoUnidad = {
        ...producto,
        precio_unitario: precioUnidad,
        precio_total: precioUnidad,
        cantidad_seleccionada: 1,
        es_caso_1: true,
        nombre_display: `${producto.nombre} (unidad)`
      };
      
      // Agregar la cantidad seleccionada de unidades individuales
      for (let i = 0; i < cantidad; i++) {
        agregarAlCarrito(productoUnidad);
      }
      
      // Mostrar notificación
      const toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
          <strong>${cantidad}x ${producto.nombre}</strong> agregado al carrito
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
      document.body.appendChild(toast);
    } else {
      // Caso 2: Agregar por peso/volumen
      const cantidadNumero = parseInt(cantidadGramos) || 0;
      
      if (cantidadNumero < 25) {
        alert(`La cantidad mínima es 25${producto.unidad_abrev || 'gr'}`);
        return;
      }
      
      // Verificar que sea múltiplo de 5 (termine en 0 o 5)
      const ultimoDigito = cantidadNumero % 10;
      if (ultimoDigito !== 0 && ultimoDigito !== 5) {
        alert(`La cantidad debe terminar en 0 o 5. Cantidad actual: ${cantidadNumero}${producto.unidad_abrev || 'gr'}`);
        return;
      }
      
      // Crear producto modificado con la cantidad personalizada
      const precioPorCantidad = calcularPrecioDinamico();
      const productoPersonalizado = {
        ...producto,
        cantidad_personalizada: cantidadNumero,
        precio_personalizado: precioPorCantidad,
        precio_total: precioPorCantidad,
        es_caso_2: true,
        nombre_personalizado: `${producto.nombre} (${cantidadNumero}${producto.unidad_abrev || 'gr'})`,
        nombre_display: `${producto.nombre} (${cantidadNumero}${producto.unidad_abrev || 'gr'})`
      };
      
      agregarAlCarrito(productoPersonalizado);
      
      // Mostrar notificación
      const toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
          <strong>${cantidadNumero}${producto.unidad_abrev || 'gr'} de ${producto.nombre}</strong> agregado al carrito
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
      document.body.appendChild(toast);
    }
    
    setTimeout(() => {
      const toasts = document.querySelectorAll('.toast-notification');
      toasts.forEach(toast => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      });
    }, 3000);
  };

  // Función para comprar ahora (agregar al carrito y redirigir)
  const handleComprarAhora = () => {
    if (!producto) return;

    // Primero agregar al carrito usando la misma lógica
    handleAgregarAlCarrito();

    // Pequeño delay para asegurar que el producto se agregue antes de redirigir
    setTimeout(() => {
      navigate('/carrito');
    }, 300);
  };

  // Funciones para Caso 1 (por unidades)
  const incrementarCantidad = () => {
    setCantidad(prev => prev + 1);
  };

  const decrementarCantidad = () => {
    setCantidad(prev => prev > 1 ? prev - 1 : 1);
  };

  // Funciones para Caso 2 (por peso/volumen)
  const incrementarGramos = (incremento = 5) => {
    setCantidadGramos(prev => prev + incremento);
  };

  const decrementarGramos = (decremento = 5) => {
    setCantidadGramos(prev => {
      const nuevo = prev - decremento;
      return nuevo >= 25 ? nuevo : 25;
    });
  };

  const handleCantidadGramosChange = (e) => {
    const valor = e.target.value;
    
    // Permitir campo vacío temporalmente
    if (valor === '') {
      setCantidadGramos('');
      return;
    }
    
    const numero = parseInt(valor);
    
    // Si es un número válido
    if (!isNaN(numero) && numero >= 0) {
      // Si es un número de 1 o 2 dígitos, permitir entrada temporal sin corrección
      // Esto permite escribir "1" para luego completar "100" sin que se autocorrija
      if (numero < 100) {
        setCantidadGramos(numero);
        return;
      }
      
      // Para números de 3 dígitos o más, aplicar corrección automática
      const ultimoDigito = numero % 10;
      let numeroCorregido = numero;
      
      // Si no termina en 0 o 5, corregir automáticamente al múltiplo de 5 más cercano
      if (ultimoDigito !== 0 && ultimoDigito !== 5) {
        if (ultimoDigito < 3) {
          // 1, 2 -> 0
          numeroCorregido = numero - ultimoDigito;
        } else if (ultimoDigito < 8) {
          // 3, 4, 6, 7 -> 5
          numeroCorregido = numero - ultimoDigito + 5;
        } else {
          // 8, 9 -> siguiente 0 (sumar para llegar al siguiente 10)
          numeroCorregido = numero + (10 - ultimoDigito);
        }
      }
      
      setCantidadGramos(numeroCorregido);
    }
  };

  // Función para manejar cuando el usuario termina de editar (onBlur)
  const handleCantidadGramosBlur = () => {
    let valor = parseInt(cantidadGramos) || 25;
    
    // Si el valor es menor a 25, establecer en 25
    if (valor < 25) {
      valor = 25;
    } else {
      // Asegurar que sea múltiplo de 5
      const ultimoDigito = valor % 10;
      if (ultimoDigito !== 0 && ultimoDigito !== 5) {
        // Redondear al múltiplo de 5 más cercano
        if (ultimoDigito < 3) {
          valor = valor - ultimoDigito;
        } else if (ultimoDigito < 8) {
          valor = valor - ultimoDigito + 5;
        } else {
          valor = valor + (10 - ultimoDigito);
        }
      }
    }
    
    setCantidadGramos(valor);
  };

  // Función auxiliar para validar cantidad de gramos
  const esCantidadGramosValida = () => {
    const cantidadNumero = parseInt(cantidadGramos);
    if (isNaN(cantidadNumero) || cantidadNumero < 25) {
      return false;
    }
    // Verificar que termine en 0 o 5 (múltiplo de 5)
    const ultimoDigito = cantidadNumero % 10;
    return ultimoDigito === 0 || ultimoDigito === 5;
  };

  // Función para obtener información del carrito para este producto
  const obtenerInfoCarrito = () => {
    if (!producto) return null;
    
    const itemsDelProducto = items.filter(item => item.producto_id === producto.id);
    
    if (itemsDelProducto.length === 0) return null;
    
    const esCaso1 = determinarEsCaso1(producto);
    
    if (esCaso1) {
      const totalUnidades = itemsDelProducto.reduce((total, item) => total + item.cantidad, 0);
      return `Ya tienes ${totalUnidades} ${totalUnidades === 1 ? 'unidad' : 'unidades'} en el carrito`;
    } else {
      const grupos = itemsDelProducto.reduce((acc, item) => {
        const clave = item.cantidad_personalizada;
        acc[clave] = (acc[clave] || 0) + item.cantidad;
        return acc;
      }, {});
      
      const descripciones = Object.entries(grupos).map(([cantidad, veces]) => 
        `${cantidad}${producto.unidad_abrev || 'gr'} (×${veces})`
      );
      
      return `En carrito: ${descripciones.join(', ')}`;
    }
  };

  const cambiarImagen = (index) => {
    setImagenActual(index);
  };

  const siguienteImagen = () => {
    if (producto?.imagenes?.length > 0) {
      setImagenActual(prev => (prev + 1) % producto.imagenes.length);
    }
  };

  const anteriorImagen = () => {
    if (producto?.imagenes?.length > 0) {
      setImagenActual(prev => prev === 0 ? producto.imagenes.length - 1 : prev - 1);
    }
  };

  if (cargando) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: '#28ad10' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Producto no encontrado.
          <button 
            className="btn ms-3" 
            onClick={() => navigate('/tienda')}
            style={{
              backgroundColor: 'transparent',
              borderColor: '#28ad10',
              color: '#28ad10',
              border: '2px solid #28ad10',
              transition: 'all 0.3s ease'
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
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  const esCaso1 = determinarEsCaso1(producto);
  const imagenPrincipal = producto.imagenes && producto.imagenes.length > 0 
    ? (producto.imagenes[imagenActual].es_url 
        ? producto.imagenes[imagenActual].url 
        : `data:image/jpeg;base64,${producto.imagenes[imagenActual].imagen_base64}`)
    : '/placeholder-product.jpg';

  return (
    <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container py-5 position-relative">
        {/* Botón de Wishlist - Esquina Superior Derecha */}
        <div className="position-absolute" style={{ top: '20px', right: '15px', zIndex: 10 }}>
          <WishlistButton 
            producto={producto} 
            size="lg"
            showText={false}
          />
        </div>
      
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
          <li className="breadcrumb-item">
            <button 
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => navigate(`/tienda/${producto.categoria.toLowerCase().replace(/\s+/g, '-')}`)}
            >
              {producto.categoria}
            </button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {producto.nombre}
          </li>
        </ol>
      </nav>

      <div className="row">
        {/* Galería de imágenes */}
        <div className="col-lg-6">
          <div className="sticky-top" style={{ top: '20px' }}>
            {/* Imagen principal */}
            <div className="position-relative mb-3">
              <div 
                className="ratio ratio-1x1 rounded overflow-hidden"
                style={{ 
                  cursor: 'zoom-in',
                  border: '1px solid #dee2e6'
                }}
                onClick={() => setMostrandoZoom(true)}
              >
                <img 
                  src={imagenPrincipal}
                  alt={producto.nombre}
                  className="img-fluid"
                  style={{ 
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                />
              </div>
              
              {/* Controles de navegación */}
              {producto.imagenes && producto.imagenes.length > 1 && (
                <>
                  <button 
                    className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-2"
                    onClick={anteriorImagen}
                    style={{ zIndex: 1000 }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button 
                    className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-2"
                    onClick={siguienteImagen}
                    style={{ zIndex: 1000 }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </>
              )}

              {/* Indicador de cantidad de imágenes */}
              {producto.imagenes && producto.imagenes.length > 1 && (
                <div className="position-absolute bottom-0 end-0 bg-dark text-white px-2 py-1 m-2 rounded">
                  {imagenActual + 1} / {producto.imagenes.length}
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {producto.imagenes && producto.imagenes.length > 1 && (
              <div className="d-flex gap-2 overflow-auto">
                {producto.imagenes.map((imagen, index) => (
                  <img
                    key={index}
                    src={imagen.es_url 
                      ? imagen.url 
                      : `data:image/jpeg;base64,${imagen.imagen_base64}`}
                    alt={`${producto.nombre} ${index + 1}`}
                    className={`flex-shrink-0 rounded cursor-pointer ${
                      index === imagenActual ? 'border-primary' : 'border-light'
                    }`}
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      objectFit: 'cover',
                      border: '2px solid',
                      cursor: 'pointer'
                    }}
                    onClick={() => cambiarImagen(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Información del producto */}
        <div className="col-lg-6">
          <div className="ps-lg-4">
            {/* Título */}
            <div className="mb-3">
              <h1 className="h2 fw-bold">{producto.nombre}</h1>
            </div>

            {/* Marca */}
            <p className="mb-3" style={{ fontSize: '1.4rem' }}>
              <strong>Marca:</strong> <span style={{ color: 'black' }}>{producto.marca}</span>
            </p>

            {/* Precio por 100g/ml o por unidad */}
            {esCaso1 ? (
              <div className="mb-3">
                <h4 className="mb-0" style={{ fontSize: '1.5rem', color: 'black' }}>
                  Precio por unidad: {formatearPrecio(parseFloat(producto.precio_venta_publico || 0) / (producto.cantidad_unidades || 1))}
                </h4>
              </div>
            ) : (
              <div className="mb-3">
                <h4 className="mb-0" style={{ fontSize: '1.5rem', color: 'black' }}>
                  Precio por 100{producto.unidad_abrev || 'gr'}: {formatearPrecio(producto.precio_fraccionado_por_100 || 0)}
                </h4>
              </div>
            )}

            {/* Disponibilidad */}
            <div className="mb-4">
              <span 
                className="badge fs-6"
                style={{ 
                  backgroundColor: producto.disponible ? '#28ad10' : '#dc3545',
                  color: 'white'
                }}
              >
                {producto.disponible ? '✓ Disponible en stock' : '✗ No disponible en stock'}
              </span>
              
              {/* Información del carrito */}
              {obtenerInfoCarrito() && (
                <div className="mt-2">
                  <small style={{ color: '#28ad10', backgroundColor: '#f8f9fa' }} className="px-2 py-1 rounded">
                    <i className="bi bi-cart-check me-1"></i>
                    {obtenerInfoCarrito()}
                  </small>
                </div>
              )}
            </div>

            {/* Selector de cantidad según el tipo */}
            {esCaso1 ? (
              // CASO 1: Selector de unidades
              <div className="mb-4">
                <label className="form-label fw-semibold">Cantidad (unidades):</label>
                <div className="d-flex align-items-center mb-3">
                  <div className="input-group" style={{ maxWidth: '150px' }}>
                    <button 
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={decrementarCantidad}
                      disabled={cantidad <= 1}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <input
                      type="number"
                      className="form-control text-center"
                      value={cantidad}
                      onChange={(e) => {
                        const valor = parseInt(e.target.value) || 1;
                        setCantidad(valor > 0 ? valor : 1);
                      }}
                      min="1"
                      style={{
                        MozAppearance: 'textfield', /* Firefox */
                        WebkitAppearance: 'none', /* Chrome, Safari, Edge */
                        appearance: 'none' /* Standard */
                      }}
                      onWheel={(e) => e.target.blur()} /* Prevenir cambios con rueda del mouse */
                    />
                    <button 
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={incrementarCantidad}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  <div className="ms-3">
                    <h5 className="fw-bold mb-0 text-success">
                      {formatearPrecio(calcularPrecioDinamico())}
                    </h5>
                    <small className="text-muted">
                      Total por {cantidad} {cantidad === 1 ? 'unidad' : 'unidades'}
                    </small>
                  </div>
                </div>
              </div>
            ) : (
              // CASO 2: Selector de peso/volumen
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Cantidad ({producto.unidad_abrev || 'gr'}):
                </label>
                <div className="d-flex align-items-center mb-3">
                  <div className="input-group" style={{ maxWidth: '200px' }}>
                    <button 
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => decrementarGramos(5)}
                      disabled={parseInt(cantidadGramos) <= 25}
                    >
                      <i className="bi bi-dash"></i> 5
                    </button>
                    <input
                      type="number"
                      className="form-control text-center"
                      value={cantidadGramos}
                      onChange={handleCantidadGramosChange}
                      onBlur={handleCantidadGramosBlur}
                      onKeyDown={(e) => {
                        // Permitir teclas de control (backspace, delete, tab, enter, escape, flechas)
                        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
                          return;
                        }
                        // Permitir números del 0-9
                        if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
                          return; // Permitir entrada, la corrección se hace en onChange
                        } else {
                          // Bloquear cualquier otra tecla (letras, símbolos, etc.)
                          e.preventDefault();
                        }
                      }}
                      min="25"
                      step="5"
                      style={{
                        MozAppearance: 'textfield', /* Firefox */
                        WebkitAppearance: 'none', /* Chrome, Safari, Edge */
                        appearance: 'none' /* Standard */
                      }}
                      onWheel={(e) => e.target.blur()} /* Prevenir cambios con rueda del mouse */
                    />
                    <button 
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => incrementarGramos(5)}
                    >
                      <i className="bi bi-plus"></i> 5
                    </button>
                  </div>
                  <div className="ms-3">
                    <h5 className="fw-bold mb-0 text-success">
                      {formatearPrecio(calcularPrecioDinamico())}
                    </h5>
                    <small className="text-muted">
                      Total por {cantidadGramos}{producto.unidad_abrev || 'gr'}
                    </small>
                  </div>
                </div>
                
                {/* Botones rápidos para cantidades comunes */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Cantidades rápidas:</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {[100, 250, 500, 750, 1000].map(valor => {
                      const enCarrito = items.some(item => 
                        item.producto_id === producto.id && 
                        item.es_caso_2 && 
                        item.cantidad_personalizada === valor
                      );
                      
                      return (
                        <button
                          key={valor}
                          className="btn btn-sm position-relative"
                          onClick={() => setCantidadGramos(valor)}
                          style={{
                            backgroundColor: cantidadGramos === valor ? '#28ad10' : 'transparent',
                            borderColor: '#28ad10',
                            color: cantidadGramos === valor ? 'white' : '#28ad10',
                            border: '1px solid #28ad10',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (cantidadGramos !== valor) {
                              e.target.style.backgroundColor = '#28ad10';
                              e.target.style.color = 'white';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (cantidadGramos !== valor) {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = '#28ad10';
                            }
                          }}
                        >
                          {valor}{producto.unidad_abrev || 'gr'}
                          {enCarrito && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill" style={{ backgroundColor: '#28ad10' }}>
                              <i className="bi bi-cart-check" style={{ fontSize: '0.7em' }}></i>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mb-2">
                </div>
                
                {cantidadGramos < 25 && (
                  <div className="text-danger mb-2">
                    <small>
                      <i className="bi bi-exclamation-triangle-fill"></i>
                      La cantidad mínima es 25{producto.unidad_abrev || 'gr'}
                    </small>
                  </div>
                )}
                
                {cantidadGramos % 5 !== 0 && (
                  <div className="text-warning mb-2">
                    <small>
                      <i className="bi bi-exclamation-triangle-fill"></i>
                      La cantidad debe ser múltiplo de 5
                    </small>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="d-grid gap-2 mb-4">
              <button
                className="btn btn-success fw-semibold shadow-sm"
                onClick={handleAgregarAlCarrito}
                disabled={!producto.disponible || (!esCaso1 && !esCantidadGramosValida())}
                style={{ 
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="bi bi-cart-plus me-2"></i>
                Agregar al carrito
              </button>
              <button
                className="btn"
                onClick={handleComprarAhora}
                disabled={!producto.disponible || (!esCaso1 && !esCantidadGramosValida())}
                style={{
                  backgroundColor: 'transparent',
                  borderColor: '#28ad10',
                  color: '#28ad10',
                  border: '2px solid #28ad10',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#28ad10';
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#28ad10';
                  }
                }}
              >
                <i className="bi bi-lightning-fill me-2"></i>
                Comprar ahora
              </button>
            </div>

            {/* Descripción */}
            {producto.descripcion && (
              <div className="border rounded p-3">
                <h5 className="fw-semibold mb-3">Descripción</h5>
                <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                  {producto.descripcion}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de zoom */}
      {mostrandoZoom && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}
          onClick={() => setMostrandoZoom(false)}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-transparent border-0 position-relative">
              <button 
                className="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
                style={{ zIndex: 10000 }}
                onClick={() => setMostrandoZoom(false)}
              ></button>
              <img 
                src={imagenPrincipal}
                alt={producto.nombre}
                className="img-fluid rounded"
                style={{ maxHeight: '90vh', maxWidth: '100%', objectFit: 'contain' }}
              />
              {/* Controles de navegación en el modal */}
              {producto.imagenes && producto.imagenes.length > 1 && (
                <>
                  <button 
                    className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-3"
                    onClick={anteriorImagen}
                    style={{ zIndex: 10000 }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button 
                    className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-3"
                    onClick={siguienteImagen}
                    style={{ zIndex: 10000 }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 bg-dark text-white px-3 py-1 rounded">
                    {imagenActual + 1} / {producto.imagenes.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default ProductoDetalle;
